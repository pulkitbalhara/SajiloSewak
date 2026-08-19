import type { PottyEvent } from '@/types';

// ============================================================================
// Potty coach — spec §17, §18. We LEARN a personalised interval from the pup's
// own outdoor-success gaps rather than asserting a rigid biological rule.
// ============================================================================

export interface PottyWindow {
  nextAt: Date | null;
  minutesFromNow: number | null;
  basisMinutes: number; // learned interval used
  learned: boolean; // true = derived from this dog's data
  message: string;
}

// Fallback guide by age (months): a young pup can hold roughly (age in months)
// hours during the day, capped. Used only until we have real data.
export function fallbackIntervalMinutes(ageMonths: number): number {
  const hours = Math.min(6, Math.max(1, Math.floor(ageMonths) + 1));
  return hours * 60;
}

export function calculatePottyWindow(
  events: PottyEvent[],
  ageMonths: number,
  now: Date = new Date(),
): PottyWindow {
  const sorted = [...events].sort((a, b) => a.at.localeCompare(b.at));
  const last = sorted[sorted.length - 1];

  // Learn median gap between successive potty events over the last ~30 events.
  const recent = sorted.slice(-30);
  const gaps: number[] = [];
  for (let i = 1; i < recent.length; i++) {
    const g = (+new Date(recent[i].at) - +new Date(recent[i - 1].at)) / 60000;
    if (g > 5 && g < 8 * 60) gaps.push(g);
  }
  let learned = false;
  let basis = fallbackIntervalMinutes(ageMonths);
  if (gaps.length >= 4) {
    gaps.sort((a, b) => a - b);
    const median = gaps[Math.floor(gaps.length / 2)];
    // blend learned median with age fallback, favouring learned
    basis = Math.round(median * 0.7 + basis * 0.3);
    learned = true;
  }

  if (!last) {
    return {
      nextAt: null, minutesFromNow: null, basisMinutes: basis, learned,
      message: 'Log a potty event to start learning the best timing.',
    };
  }
  const nextAt = new Date(+new Date(last.at) + basis * 60000);
  const minutesFromNow = Math.round((+nextAt - +now) / 60000);
  let message: string;
  if (minutesFromNow <= 0) message = 'Good time for an outside trip now.';
  else if (minutesFromNow <= 10) message = `Take outside in about ${minutesFromNow} min.`;
  else message = `Next suggested outing in ~${minutesFromNow} min.`;
  return { nextAt, minutesFromNow, basisMinutes: basis, learned, message };
}

// --- Analytics (spec §18): plain-language insights --------------------------
export function pottyInsights(events: PottyEvent[], now: Date = new Date()): string[] {
  const out: string[] = [];
  const weekAgo = +now - 7 * 86400000;
  const twoWeekAgo = +now - 14 * 86400000;
  const thisWeek = events.filter((e) => +new Date(e.at) >= weekAgo);
  const prevWeek = events.filter((e) => {
    const t = +new Date(e.at); return t >= twoWeekAgo && t < weekAgo;
  });

  const accThis = thisWeek.filter((e) => e.result === 'accident').length;
  const accPrev = prevWeek.filter((e) => e.result === 'accident').length;
  const outThis = thisWeek.filter((e) => e.result === 'outside').length;

  if (accPrev > 0 || accThis > 0) {
    if (accThis < accPrev) out.push(`Accidents are down — ${accPrev} last week to ${accThis} this week. Great progress. 🎉`);
    else if (accThis > accPrev) out.push(`Accidents are up (${accPrev} → ${accThis}). Try taking Golden out a little sooner after meals and naps.`);
    else if (accThis > 0) out.push(`${accThis} accident${accThis === 1 ? '' : 's'} this week — same as last week. Watch the busy times below.`);
  }
  if (outThis > 0) {
    const rate = Math.round((outThis / (outThis + accThis || 1)) * 100);
    out.push(`Outdoor success rate this week: ~${rate}%.`);
  }

  // Time-of-day clustering for accidents
  const byHour: Record<number, number> = {};
  thisWeek.filter((e) => e.result === 'accident').forEach((e) => {
    const h = new Date(e.at).getHours();
    byHour[h] = (byHour[h] || 0) + 1;
  });
  const peak = Object.entries(byHour).sort((a, b) => b[1] - a[1])[0];
  if (peak && +peak[1] >= 2) {
    const h = +peak[0];
    out.push(`Most accidents happen around ${fmtHour(h)}–${fmtHour(h + 2)}. Plan an extra outing then.`);
  }

  // Poop-after-breakfast pattern
  const poopAfterAM = events.filter((e) => (e.kind === 'poop' || e.kind === 'both') && e.context === 'after-eating' && new Date(e.at).getHours() < 12).length;
  if (poopAfterAM >= 3) out.push('Golden usually needs to poop shortly after breakfast — build that into the morning.');

  if (out.length === 0) out.push('Not enough data yet — keep tapping PEE / POOP / ACCIDENT and insights will appear.');
  return out;
}

function fmtHour(h: number): string {
  const hh = ((h % 24) + 24) % 24;
  const ampm = hh < 12 ? 'AM' : 'PM';
  const disp = hh % 12 === 0 ? 12 : hh % 12;
  return `${disp} ${ampm}`;
}
