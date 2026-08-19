import type { DailyRoutine, RoutineStep, FeedingEvent, PottyEvent, TrainingSession, MealSlot } from '@/types';

// ============================================================================
// "What does the puppy need now?" engine — spec §2, §5, §28.
// Marries the generated routine with today's logged events to find the single
// NEXT ACTION and to drive the auto-generated daily checklist.
// ============================================================================

function toMin(t: string): number { const [h, m] = t.split(':').map(Number); return h * 60 + m; }

export interface TodayStep extends RoutineStep {
  done: boolean;
  isNext: boolean;
  isNow: boolean; // within +/- window of now
  doneBy?: string;
  doneAt?: string;
}

export interface TodayState {
  steps: TodayStep[];
  next: TodayStep | null;
  nowMinutes: number;
}

function startOfToday(): number { const d = new Date(); d.setHours(0, 0, 0, 0); return +d; }
function todaysEvents<T extends { at: string }>(evs: T[]): T[] {
  const s = startOfToday();
  return evs.filter((e) => +new Date(e.at) >= s);
}

export function buildToday(
  routine: DailyRoutine,
  feedings: FeedingEvent[],
  potty: PottyEvent[],
  sessions: TrainingSession[],
  memberName: (id: string) => string,
  now: Date = new Date(),
): TodayState {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const fed = todaysEvents(feedings);
  const pot = todaysEvents(potty);
  const trained = todaysEvents(sessions);

  // Track which meal slots are already satisfied
  const fedSlots = new Set(fed.map((f) => f.slot));
  // Potty events consumed in order for "potty" steps
  const pottySorted = [...pot].sort((a, b) => a.at.localeCompare(b.at));
  let pottyIdx = 0;
  const trainedCount = trained.length;
  let trainStepIdx = 0;

  const steps: TodayStep[] = routine.steps.map((s) => {
    let done = false, doneBy: string | undefined, doneAt: string | undefined;
    const stepMin = toMin(s.time);

    if (s.activity === 'breakfast' || s.activity === 'lunch' || s.activity === 'dinner') {
      const slot = s.linkedSlot as MealSlot;
      const ev = fed.find((f) => f.slot === slot);
      if (ev) { done = true; doneBy = memberName(ev.byMemberId); doneAt = ev.at; }
    } else if (s.activity === 'potty') {
      if (pottyIdx < pottySorted.length && stepMin <= nowMin + 30) {
        const ev = pottySorted[pottyIdx++];
        done = true; doneBy = memberName(ev.byMemberId); doneAt = ev.at;
      }
    } else if (s.activity === 'training') {
      if (trainStepIdx < trainedCount) {
        const ev = trained[trainStepIdx++];
        done = true; doneBy = memberName(ev.byMemberId); doneAt = ev.at;
      }
    } else {
      // play/rest/calm/wake/bed/water — considered done once their time passes
      done = stepMin < nowMin - 20;
    }
    return { ...s, done, isNext: false, isNow: false, doneBy, doneAt };
  });

  // NEXT = earliest not-done step whose time >= now-30 (or the soonest not-done)
  let next: TodayStep | null = null;
  const notDone = steps.filter((s) => !s.done);
  next = notDone.find((s) => toMin(s.time) >= nowMin - 20) ?? notDone[0] ?? null;
  if (next) {
    next.isNext = true;
    next.isNow = Math.abs(toMin(next.time) - nowMin) <= 20;
  }
  return { steps, next, nowMinutes: nowMin };
}

// Checklist grouping (spec §28)
export type Period = 'Morning' | 'Afternoon' | 'Evening' | 'Night';
export function periodOf(step: RoutineStep): Period {
  const h = Math.floor(toMin(step.time) / 60);
  if (step.activity === 'bed') return 'Night';
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  if (h < 21) return 'Evening';
  return 'Night';
}
