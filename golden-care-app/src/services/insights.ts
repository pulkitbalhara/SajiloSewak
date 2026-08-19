import type {
  BehaviorEvent, BehaviorType, WeightMeasurement, HeightMeasurement,
  BCSMeasurement, FeedingEvent, TreatEvent, PottyEvent, TrainingSession, RestSession,
} from '@/types';

// ============================================================================
// Behaviour trend detection (§21) & weekly report (§27). Presented as
// observations, never diagnoses.
// ============================================================================

export const BEHAVIOR_META: Record<BehaviorType, { label: string; emoji: string; positive?: boolean }> = {
  biting: { label: 'Biting / nipping', emoji: '🦷' },
  barking: { label: 'Barking', emoji: '🔊' },
  jumping: { label: 'Jumping up', emoji: '⬆️' },
  chewing: { label: 'Chewing (wrong thing)', emoji: '🪵' },
  whining: { label: 'Whining', emoji: '😢' },
  pulling: { label: 'Pulling on lead', emoji: '🐕' },
  stealing: { label: 'Stealing objects', emoji: '🧦' },
  guarding: { label: 'Resource guarding', emoji: '⚠️' },
  calm: { label: 'Calm behaviour', emoji: '😌', positive: true },
  'good-response': { label: 'Good response to cue', emoji: '⭐', positive: true },
};

export function behaviorInsights(events: BehaviorEvent[], now: Date = new Date()): string[] {
  const out: string[] = [];
  const weekAgo = +now - 7 * 86400000;
  const week = events.filter((e) => +new Date(e.at) >= weekAgo);
  if (week.length < 3) return ['Log a few behaviour taps and patterns will appear here.'];

  // Most common challenging behaviour + its peak time window
  const challenging = week.filter((e) => !BEHAVIOR_META[e.type].positive);
  const counts: Record<string, number> = {};
  challenging.forEach((e) => { counts[e.type] = (counts[e.type] || 0) + 1; });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (top) {
    const type = top[0] as BehaviorType;
    const byHour: Record<number, number> = {};
    challenging.filter((e) => e.type === type).forEach((e) => {
      const h = new Date(e.at).getHours();
      byHour[h] = (byHour[h] || 0) + 1;
    });
    const peak = Object.entries(byHour).sort((a, b) => b[1] - a[1])[0];
    if (peak && +peak[1] >= 2) {
      const h = +peak[0];
      out.push(`${BEHAVIOR_META[type].label} is highest around ${fmtHourRange(h)}. Try a nap or quiet chew before then.`);
    } else {
      out.push(`This week's most common challenge: ${BEHAVIOR_META[type].label.toLowerCase()}.`);
    }
  }
  const positive = week.filter((e) => BEHAVIOR_META[e.type].positive).length;
  if (positive >= 3) out.push(`${positive} calm / good-response moments logged this week — you're reinforcing the right things. ⭐`);
  return out;
}

function fmtHourRange(h: number): string {
  const f = (x: number) => {
    const hh = ((x % 24) + 24) % 24;
    const ampm = hh < 12 ? 'AM' : 'PM';
    const d = hh % 12 === 0 ? 12 : hh % 12;
    return `${d} ${ampm}`;
  };
  return `${f(h)}–${f(h + 2)}`;
}

// --- Weekly report ----------------------------------------------------------
export interface WeeklyReport {
  from: Date;
  to: Date;
  weight: { start: number | null; end: number | null };
  height: { start: number | null; end: number | null };
  bcs: { start: number | null; end: number | null };
  meals: { planned: number; completed: number };
  treatKcal: number;
  potty: { success: number; accidents: number };
  training: { minutes: number; skills: number };
  behaviorTop: string | null;
  restAvgHours: number | null;
  insights: string[];
  actions: string[];
}

function edgeVals<T>(arr: T[], get: (t: T) => number, getDate: (t: T) => string): { start: number | null; end: number | null } {
  const s = [...arr].sort((a, b) => getDate(a).localeCompare(getDate(b)));
  if (s.length === 0) return { start: null, end: null };
  return { start: get(s[0]), end: get(s[s.length - 1]) };
}

export function generateWeeklyReport(data: {
  weights: WeightMeasurement[];
  heights: HeightMeasurement[];
  bcs: BCSMeasurement[];
  feedings: FeedingEvent[];
  plannedMeals: number; // per day
  treats: TreatEvent[];
  potty: PottyEvent[];
  sessions: TrainingSession[];
  rests: RestSession[];
  behaviors: BehaviorEvent[];
  now?: Date;
}): WeeklyReport {
  const now = data.now ?? new Date();
  const from = new Date(+now - 7 * 86400000);
  const inWeek = (iso: string) => +new Date(iso) >= +from && +new Date(iso) <= +now;
  const inWeekDate = (d: string) => +new Date(d + 'T12:00:00') >= +from - 86400000;

  const w = edgeVals(data.weights.filter((m) => inWeekDate(m.date)), (m) => m.weightKg, (m) => m.date);
  const h = edgeVals(data.heights.filter((m) => inWeekDate(m.date)), (m) => m.heightCm, (m) => m.date);
  const b = edgeVals(data.bcs.filter((m) => inWeekDate(m.date)), (m) => m.score, (m) => m.date);
  // fall back to overall latest/prev if only one this week
  const fallbackW = data.weights.length >= 2 ? { start: data.weights[data.weights.length - 2].weightKg, end: data.weights[data.weights.length - 1].weightKg } : w;

  const feedings = data.feedings.filter((e) => inWeek(e.at) && e.slot !== 'topper');
  const treats = data.treats.filter((e) => inWeek(e.at));
  const potty = data.potty.filter((e) => inWeek(e.at));
  const sessions = data.sessions.filter((e) => inWeek(e.at));
  const rests = data.rests.filter((e) => inWeek(e.start) && e.end);

  const treatKcal = Math.round(treats.reduce((a, t) => a + t.kcal, 0));
  const success = potty.filter((e) => e.result === 'outside').length;
  const accidents = potty.filter((e) => e.result === 'accident').length;
  const minutes = sessions.reduce((a, s) => a + s.minutes, 0);
  const skillSet = new Set<string>();
  sessions.forEach((s) => s.skillIds.forEach((id) => skillSet.add(id)));
  const restHours = rests.map((r) => (+new Date(r.end!) - +new Date(r.start)) / 3600000);
  const restAvg = restHours.length ? +(restHours.reduce((a, x) => a + x, 0) / 7).toFixed(1) : null;

  const bTop = mostCommonBehavior({ behaviors: data.behaviors }, from, now);

  // Insights (§27: 3 key insights)
  const insights: string[] = [];
  const weight = w.start != null ? w : fallbackW;
  if (weight.start != null && weight.end != null) {
    const d = +(weight.end - weight.start).toFixed(2);
    if (d > 0) insights.push(`Growth is on a steady trajectory (${weight.start} → ${weight.end} kg).`);
    else if (d === 0) insights.push('Weight held steady this week — keep monitoring.');
    else insights.push(`Weight dipped slightly (${weight.start} → ${weight.end} kg) — worth a closer look.`);
  } else insights.push('Add a weekly weight to track growth.');
  if (accidents === 0 && success > 0) insights.push('No potty accidents logged — house-training is going well.');
  else if (success + accidents > 0) insights.push(`Potty: ${success} successes vs ${accidents} accidents.`);
  if (bTop) insights.push(`${bTop} was the most-logged challenge — the biggest training opportunity.`);
  else insights.push('Behaviour was calm this week — nice work.');

  // Actions (§27: 3 actions)
  const actions: string[] = [];
  if (weight.end != null) actions.push('Maintain current food quantity and re-check grams after the next weigh-in.');
  if (accidents > 0) actions.push('Take Golden outside a little earlier after meals and naps.');
  else actions.push('Keep the potty routine consistent — it’s working.');
  actions.push(minutes < 60 ? 'Add two more short reward-based training sessions.' : 'Add one calm-settle session in the evening.');

  return {
    from, to: now,
    weight, height: h, bcs: b,
    meals: { planned: data.plannedMeals * 7, completed: feedings.length },
    treatKcal,
    potty: { success, accidents },
    training: { minutes, skills: skillSet.size },
    behaviorTop: bTop,
    restAvgHours: restAvg,
    insights: insights.slice(0, 3),
    actions: actions.slice(0, 3),
  };
}

function mostCommonBehavior(data: { behaviors?: BehaviorEvent[] }, from: Date, now: Date): string | null {
  const evs = (data.behaviors || []).filter((e) => +new Date(e.at) >= +from && +new Date(e.at) <= +now && !BEHAVIOR_META[e.type].positive);
  if (evs.length === 0) return null;
  const counts: Record<string, number> = {};
  evs.forEach((e) => { counts[e.type] = (counts[e.type] || 0) + 1; });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? BEHAVIOR_META[top[0] as BehaviorType].label : null;
}
