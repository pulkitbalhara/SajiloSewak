import type { Alert, FeedingEvent, Reminder, Settings, Food } from '@/types';
import { differenceInCalendarDays } from 'date-fns';

// ============================================================================
// Human-error prevention alerts — spec §29. Duplicate feed, treat over-budget,
// missed meal, weight-check due, supplement warning, etc.
// ============================================================================

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return +d; };

export function buildAlerts(input: {
  feedings: FeedingEvent[];
  memberName: (id: string) => string;
  treatKcalToday: number;
  treatBudget: number;
  mealsPlanned: number;
  planTimes: string[]; // 'HH:mm' for each planned meal
  reminders: Reminder[];
  settings: Settings;
  primaryFood?: Food;
  usesSupplement?: boolean;
}): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const todayFeed = input.feedings.filter((f) => +new Date(f.at) >= startOfToday() && f.slot !== 'topper');

  // Treat budget reached (spec §12/§29)
  if (input.treatBudget > 0 && input.treatKcalToday >= input.treatBudget) {
    alerts.push({
      id: 'treat-over', level: 'warn', icon: '🦴',
      title: 'Treat allowance reached',
      detail: `Today's treats add up to ~${Math.round(input.treatKcalToday)} kcal (budget ≈ ${Math.round(input.treatBudget)} kcal). Ease off treats so the complete diet isn't diluted.`,
    });
  } else if (input.treatBudget > 0 && input.treatKcalToday >= input.treatBudget * 0.8) {
    alerts.push({
      id: 'treat-near', level: 'info', icon: '🦴',
      title: 'Close to today’s treat budget',
      detail: `~${Math.round(input.treatKcalToday)} of ${Math.round(input.treatBudget)} kcal used.`,
    });
  }

  // Missed meal: a planned meal time has passed by >90 min and isn't logged
  const slots: ('breakfast' | 'lunch' | 'dinner')[] = input.mealsPlanned === 3
    ? ['breakfast', 'lunch', 'dinner'] : ['breakfast', 'dinner'];
  slots.forEach((slot, i) => {
    const t = input.planTimes[i];
    if (!t) return;
    const [h, m] = t.split(':').map(Number);
    const mealMin = h * 60 + m;
    const logged = todayFeed.some((f) => f.slot === slot);
    if (!logged && nowMin > mealMin + 90) {
      alerts.push({
        id: `missed-${slot}`, level: 'warn', icon: '🍽️',
        title: `${cap(slot)} not recorded`,
        detail: `${cap(slot)} was due around ${t} and hasn't been logged. Feed it, or tap it done if it was already given.`,
      });
    }
  });

  // Weekly weight check due
  const lastCheck = input.settings.lastWeeklyCheck;
  const daysSince = lastCheck ? differenceInCalendarDays(now, new Date(lastCheck + 'T00:00:00')) : 99;
  if (daysSince >= 7) {
    alerts.push({
      id: 'weight-due', level: 'warn', icon: '⚖️',
      title: 'Weekly weight check due',
      detail: 'Weigh & measure Golden today. Weekly monitoring keeps large-breed growth on a steady, lean track (Merck).',
    });
  }

  // Health reminders due soon
  input.reminders.filter((r) => !r.done).forEach((r) => {
    const d = differenceInCalendarDays(new Date(r.dueDate + 'T00:00:00'), now);
    if (d <= 3 && r.kind !== 'weight') {
      alerts.push({
        id: `rem-${r.id}`, level: d < 0 ? 'warn' : 'info', icon: '💉',
        title: d < 0 ? `${r.title} overdue` : `${r.title} due soon`,
        detail: d < 0 ? `Was due ${-d} day(s) ago.` : d === 0 ? 'Due today.' : `Due in ${d} day(s).`,
      });
    }
  });

  // Supplement warning (spec §11/§29)
  if (input.primaryFood?.category === 'primary-complete' && input.usesSupplement) {
    alerts.push({
      id: 'supplement', level: 'warn', icon: '⚠️',
      title: 'Supplement + complete food',
      detail: 'You already use a complete & balanced puppy food. Do NOT add calcium/multivitamins without a specific vet indication — over-supplementing calcium is risky for large-breed puppies (Merck).',
    });
  }

  return alerts;
}

function cap(s: string) { return s[0].toUpperCase() + s.slice(1); }
