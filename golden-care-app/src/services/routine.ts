import type { DailyRoutine, RoutineStep, MealSlot, RoutineActivity } from '@/types';

// ============================================================================
// Daily routine generator — spec §23. The heart of the app: the family enters
// only wake time, bedtime and meals/day; we build the whole day. The routine
// is age-aware via mealsPerDay (driven by life stage).
// ============================================================================

function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function toTime(mins: number): string {
  const m = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

const TITLES: Record<RoutineActivity, string> = {
  wake: 'Wake up', potty: 'Potty break', breakfast: 'Breakfast', lunch: 'Lunch',
  dinner: 'Dinner', play: 'Play', training: 'Training', rest: 'Rest / nap',
  calm: 'Calm time', water: 'Water', bed: 'Bedtime',
};

export function generateDailyRoutine(
  wakeTime: string,
  bedTime: string,
  mealsPerDay: number,
  trainingMinutes: number,
): DailyRoutine {
  const wake = toMin(wakeTime);
  let bed = toMin(bedTime);
  if (bed <= wake) bed += 1440; // crosses midnight
  const steps: RoutineStep[] = [];
  let i = 0;
  const push = (time: number, activity: RoutineActivity, opts: Partial<RoutineStep> = {}) => {
    steps.push({
      id: `r${i++}`,
      time: toTime(time),
      activity,
      title: opts.title ?? TITLES[activity],
      detail: opts.detail,
      durationMin: opts.durationMin,
      linkedSlot: opts.linkedSlot,
    });
  };

  // Meal slots spread across the waking window.
  const slots: MealSlot[] = mealsPerDay >= 4
    ? ['breakfast', 'lunch', 'snack', 'dinner']
    : mealsPerDay === 3 ? ['breakfast', 'lunch', 'dinner']
    : ['breakfast', 'dinner'];
  const window = bed - wake;

  // Anchor meals
  const mealTimes = slots.map((_, idx) => wake + 60 + Math.round((window - 180) * (idx / (slots.length - 1 || 1))));

  push(wake, 'wake', { detail: 'Straight outside — puppies need to go the moment they wake.' });
  push(wake + 5, 'potty', { detail: 'First potty of the day (highest chance of success).' });

  slots.forEach((slot, idx) => {
    const mt = mealTimes[idx];
    const activity: RoutineActivity = slot === 'breakfast' ? 'breakfast'
      : slot === 'lunch' ? 'lunch' : slot === 'dinner' ? 'dinner' : 'play';
    if (slot === 'snack') {
      push(mt, 'water', { title: 'Snack + water', detail: 'Small snack from the daily allowance.' });
    } else {
      push(mt, activity, { linkedSlot: slot, detail: 'Measured meal — follow the standard diet.' });
    }
    // potty ~10-20 min after eating
    push(mt + 15, 'potty', { detail: 'Take outside ~10–20 min after eating.', title: 'Potty (after eating)' });

    // Alternate play / training / rest in the gaps
    if (idx === 0) {
      push(mt + 40, 'play', { durationMin: 15, detail: 'Gentle play & exploration.' });
      push(mt + 60, 'training', { durationMin: Math.round(trainingMinutes / 2), detail: 'Short reward-based session.' });
      push(mt + 80, 'rest', { detail: 'Nap — a rested puppy bites and barks far less.' });
    } else if (idx === slots.length - 1) {
      push(mt + 40, 'calm', { durationMin: 15, detail: 'Wind down — settle on the mat, quiet chew.' });
    } else {
      push(mt + 40, 'rest', { detail: 'Midday rest.' });
      push(mt + 120, 'play', { durationMin: 15, detail: 'Play & a short training game.' });
      push(mt + 150, 'training', { durationMin: Math.round(trainingMinutes / 2), detail: 'Second short session.' });
    }
  });

  push(bed - 30, 'potty', { title: 'Final potty', detail: 'Last toilet trip before bed.' });
  push(bed, 'bed', { detail: 'Settle in the crate/rest area for the night.' });

  // sort & normalise times to strings within one day for display
  steps.sort((a, b) => toMin(a.time) - toMin(b.time) || 0);
  return { wakeTime, bedTime, mealsPerDay, steps };
}
