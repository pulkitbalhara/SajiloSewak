import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { useMemo } from 'react';
import { calculateAge, lifeStageForMonths } from '@/services/age';
import { estimateEnergyRequirement, calculateTreatBudget, calculateWeightChange, planDailyKcal } from '@/services/calc';
import { generateDailyRoutine } from '@/services/routine';
import { buildToday } from '@/services/today';
import { calculatePottyWindow } from '@/services/potty';
import type { Food } from '@/types';

// ============================================================================
// Central live-data hook. One subscription surface for the whole app.
// ============================================================================

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return +d; };
const todays = <T extends { at: string }>(a: T[] | undefined) =>
  (a ?? []).filter((e) => +new Date(e.at) >= startOfToday());

export function useData() {
  const dog = useLiveQuery(() => db.dogs.get('dog-1'), []);
  const settings = useLiveQuery(() => db.settings.get('app'), []);
  const family = useLiveQuery(() => db.family.toArray(), []) ?? [];
  const foods = useLiveQuery(() => db.foods.toArray(), []) ?? [];
  const plan = useLiveQuery(() => db.dietPlans.get('plan-1'), []);
  const feedings = useLiveQuery(() => db.feedings.orderBy('at').toArray(), []) ?? [];
  const treats = useLiveQuery(() => db.treats.orderBy('at').toArray(), []) ?? [];
  const water = useLiveQuery(() => db.water.orderBy('at').toArray(), []) ?? [];
  const potty = useLiveQuery(() => db.potty.orderBy('at').toArray(), []) ?? [];
  const sessions = useLiveQuery(() => db.sessions.orderBy('at').toArray(), []) ?? [];
  const skillProgress = useLiveQuery(() => db.skillProgress.toArray(), []) ?? [];
  const behaviors = useLiveQuery(() => db.behaviors.orderBy('at').toArray(), []) ?? [];
  const rests = useLiveQuery(() => db.rests.orderBy('start').toArray(), []) ?? [];
  const weights = useLiveQuery(() => db.weights.orderBy('date').toArray(), []) ?? [];
  const heights = useLiveQuery(() => db.heights.orderBy('date').toArray(), []) ?? [];
  const bcs = useLiveQuery(() => db.bcs.orderBy('date').toArray(), []) ?? [];
  const health = useLiveQuery(() => db.health.toArray(), []) ?? [];
  const reminders = useLiveQuery(() => db.reminders.toArray(), []) ?? [];

  const loading = !dog || !settings || !plan;

  const foodMap = useMemo(() => {
    const m: Record<string, Food> = {};
    foods.forEach((f) => (m[f.id] = f));
    return m;
  }, [foods]);

  const memberName = useMemo(() => {
    const m: Record<string, string> = {};
    family.forEach((f) => (m[f.id] = f.name));
    return (id: string) => m[id] ?? 'Someone';
  }, [family]);

  const activeMember = useMemo(
    () => family.find((f) => f.id === settings?.activeMemberId) ?? family[0],
    [family, settings],
  );

  const derived = useMemo(() => {
    if (!dog || !settings || !plan) return null;
    const age = calculateAge(dog.dob);
    const stage = lifeStageForMonths(age.months);
    const energy = estimateEnergyRequirement(dog);
    const treatBudget = calculateTreatBudget(energy.value, plan.treatBudgetPct);
    const planKcal = planDailyKcal(plan, foodMap);
    const weightChange = calculateWeightChange(weights);

    // routine (age-aware meals)
    const routine = generateDailyRoutine(settings.wakeTime, settings.bedTime, plan.mealsPerDay, stage.trainingMinutes);
    const today = buildToday(routine, feedings, potty, sessions, memberName);

    // today's tallies
    const tFeed = todays(feedings).filter((f) => f.slot !== 'topper');
    const tTreat = todays(treats);
    const consumedKcal =
      tFeed.reduce((a, f) => a + (f.kcal ?? 0), 0) + tTreat.reduce((a, t) => a + t.kcal, 0);
    const treatKcalToday = tTreat.reduce((a, t) => a + t.kcal, 0);

    // potty
    const pottyWindow = calculatePottyWindow(potty, age.months);
    const lastPee = [...potty].reverse().find((p) => p.kind === 'pee' || p.kind === 'both');
    const lastPoop = [...potty].reverse().find((p) => p.kind === 'poop' || p.kind === 'both');

    // training today
    const trainedTodayMin = todays(sessions).reduce((a, s) => a + s.minutes, 0);

    // rest
    const activeRest = rests.find((r) => !r.end);

    return {
      age, stage, energy, treatBudget, planKcal, weightChange, routine, today,
      mealsPlanned: plan.mealsPerDay,
      mealsCompleted: tFeed.length,
      consumedKcal, treatKcalToday,
      remainingKcal: Math.max(0, energy.value - consumedKcal),
      pottyWindow, lastPee, lastPoop,
      trainedTodayMin, trainingTarget: stage.trainingMinutes,
      activeRest,
    };
  }, [dog, settings, plan, foodMap, weights, feedings, potty, treats, sessions, rests, memberName]);

  return {
    loading, dog, settings, family, foods, foodMap, plan,
    feedings, treats, water, potty, sessions, skillProgress, behaviors, rests,
    weights, heights, bcs, health, reminders,
    memberName, activeMember, derived,
  };
}

export type AppData = ReturnType<typeof useData>;
