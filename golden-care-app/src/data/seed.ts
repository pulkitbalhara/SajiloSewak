import { format, subDays, subWeeks } from 'date-fns';
import { db, uid } from '@/db/db';
import { DEFAULT_FOODS } from './foods';
import { estimateEnergyRequirement } from '@/services/calc';
import { calculateFoodGrams, calculateMealAllocation, calculateTreatBudget } from '@/services/calc';
import type {
  Dog, FamilyMember, DietPlan, Settings, WeightMeasurement, HeightMeasurement,
  BCSMeasurement, PottyEvent, FeedingEvent, TrainingSession, BehaviorEvent,
  HealthRecord, Reminder, RestSession, MealSlot,
} from '@/types';

// ============================================================================
// Demo seed — spec §1 & §39. Our actual puppy + a realistic recent history so
// the dashboard feels alive on first open. Nothing here is hard-coded into the
// engine; it is editable data.
// ============================================================================

function iso(d: Date): string { return d.toISOString(); }
function day(d: Date): string { return format(d, 'yyyy-MM-dd'); }
function at(daysAgo: number, h: number, m = 0): string {
  const d = subDays(new Date(), daysAgo);
  d.setHours(h, m, 0, 0);
  return iso(d);
}
// True if the given time today is still in the future (skip for realistic seed).
function isFutureToday(daysAgo: number, h: number, m = 0): boolean {
  if (daysAgo !== 0) return false;
  const now = new Date();
  return h * 60 + m > now.getHours() * 60 + now.getMinutes();
}

export async function isSeeded(): Promise<boolean> {
  return (await db.dogs.count()) > 0;
}

export async function seedDatabase(): Promise<void> {
  // --- Family (spec §3) -----------------------------------------------------
  const owner: FamilyMember = { id: 'm-owner', name: 'Pulkit', role: 'owner', emoji: '🧑', color: '#C9861E' };
  const mom: FamilyMember = { id: 'm-mom', name: 'Mom', role: 'mother', emoji: '👩', color: '#B4685B' };
  const dad: FamilyMember = { id: 'm-dad', name: 'Dad', role: 'father', emoji: '👨', color: '#5E9450' };
  const family = [owner, mom, dad];
  await db.family.bulkPut(family);

  // --- Foods ----------------------------------------------------------------
  await db.foods.bulkPut(DEFAULT_FOODS);
  const primary = DEFAULT_FOODS[0]; // large-breed puppy kibble

  // --- Dog (spec §1) --------------------------------------------------------
  const dog: Dog = {
    id: 'dog-1',
    name: 'Golden',
    breed: 'Golden Retriever',
    isLargeBreed: true,
    sex: 'male',
    dob: day(subWeeks(new Date(), 13)), // ~3 months
    weightKg: 9,
    heightCm: 33,
    activity: 'moderate',
    neuter: 'intact',
    currentFoodId: primary.id,
    healthNotes: 'Healthy, playful. Second vaccination done; third due soon.',
    allergies: [],
    photo: '🐶',
  };
  await db.dogs.put(dog);

  // --- Standard diet, computed from the energy estimate (spec §10) ----------
  const energy = estimateEnergyRequirement(dog);
  const treatBudget = calculateTreatBudget(energy.value, 10).value;
  const foodKcal = energy.value - Math.round(treatBudget * 0.5); // leave headroom for toppers/treats
  const grams = calculateFoodGrams(foodKcal, primary).value;
  const meals = energy.stage.recommendedMeals >= 3 ? 3 : energy.stage.recommendedMeals;
  const alloc = calculateMealAllocation(grams, meals);
  const slots: MealSlot[] = meals === 3 ? ['breakfast', 'lunch', 'dinner'] : ['breakfast', 'dinner'];
  const timeHints = meals === 3 ? ['07:30', '13:00', '19:00'] : ['08:00', '19:00'];

  const plan: DietPlan = {
    id: 'plan-1',
    dogId: dog.id,
    primaryFoodId: primary.id,
    mealsPerDay: meals,
    treatBudgetPct: 10,
    autoScaleWithGrowth: true,
    energyTargetKcal: energy.value,
    updatedAt: iso(new Date()),
    meals: slots.map((slot, i) => ({
      slot,
      label: slot[0].toUpperCase() + slot.slice(1),
      timeHint: timeHints[i],
      components: [{ foodId: primary.id, grams: alloc[i], auto: true }],
    })),
  };
  await db.dietPlans.put(plan);

  // --- Settings -------------------------------------------------------------
  const settings: Settings = {
    id: 'app',
    wakeTime: '06:30',
    bedTime: '22:00',
    mealsPerDay: meals,
    activeMemberId: dad.id,
    mode: 'simple',
    lastWeeklyCheck: day(subDays(new Date(), 3)),
  };
  await db.settings.put(settings);

  // --- Growth history (spec §14/§15) — steady, healthy gain -----------------
  const weightSeries = [
    { w: 6, wk: 6 }, { w: 6.7, wk: 5 }, { w: 7.3, wk: 4 },
    { w: 7.9, wk: 3 }, { w: 8.4, wk: 2 }, { w: 8.9, wk: 1 }, { w: 9, wk: 0 },
  ];
  const weights: WeightMeasurement[] = weightSeries.map((p) => ({
    id: uid('w'), date: day(subWeeks(new Date(), p.wk)), weightKg: p.w, byMemberId: owner.id,
  }));
  await db.weights.bulkPut(weights);

  const heights: HeightMeasurement[] = [
    { id: uid('h'), date: day(subWeeks(new Date(), 4)), heightCm: 29, byMemberId: owner.id },
    { id: uid('h'), date: day(subWeeks(new Date(), 2)), heightCm: 31, byMemberId: owner.id },
    { id: uid('h'), date: day(new Date()), heightCm: 33, byMemberId: owner.id },
  ];
  await db.heights.bulkPut(heights);

  const bcs: BCSMeasurement[] = [
    { id: uid('b'), date: day(subWeeks(new Date(), 3)), score: 4, byMemberId: owner.id },
    { id: uid('b'), date: day(subWeeks(new Date(), 1)), score: 5, byMemberId: owner.id },
  ];
  await db.bcs.bulkPut(bcs);

  // --- Potty history (spec §17/§18) — improving over 2 weeks ----------------
  const potty: PottyEvent[] = [];
  for (let d = 13; d >= 0; d--) {
    const successes = d > 6 ? 5 : 6;
    for (let s = 0; s < successes; s++) {
      const h = 7 + s * 2;
      if (isFutureToday(d, h, 15)) continue;
      potty.push({
        id: uid('p'), kind: s % 3 === 0 ? 'poop' : 'pee', result: 'outside',
        context: s === 0 ? 'woke-up' : s === 1 ? 'after-eating' : 'routine',
        at: at(d, h, 15), byMemberId: s % 2 ? mom.id : dad.id,
      });
    }
    // accidents: more in older days, cluster mid-afternoon
    const accidents = d > 6 ? 1 : (d > 3 ? 1 : 0);
    for (let a = 0; a < accidents; a++) {
      if (isFutureToday(d, 15, 20)) continue;
      potty.push({
        id: uid('p'), kind: 'pee', result: 'accident', context: 'after-play',
        at: at(d, 15, 20), byMemberId: dad.id,
      });
    }
  }
  await db.potty.bulkPut(potty);

  // --- Feeding history for today (partial — breakfast done) -----------------
  const feedings: FeedingEvent[] = [];
  for (let d = 6; d >= 1; d--) {
    slots.forEach((slot, i) => {
      feedings.push({
        id: uid('f'), slot, label: plan.meals[i].label, grams: alloc[i],
        kcal: Math.round((alloc[i] / 1000) * primary.kcalPerKg),
        at: at(d, +timeHints[i].split(':')[0], +timeHints[i].split(':')[1]),
        byMemberId: i % 2 ? mom.id : dad.id,
      });
    });
  }
  // today: only breakfast so far (acceptance test — Dad, ~08:02)
  const today0 = new Date(); today0.setHours(8, 2, 0, 0);
  feedings.push({
    id: uid('f'), slot: 'breakfast', label: 'Breakfast', grams: alloc[0],
    kcal: Math.round((alloc[0] / 1000) * primary.kcalPerKg), at: iso(today0), byMemberId: dad.id,
  });
  await db.feedings.bulkPut(feedings);

  // --- Training history -----------------------------------------------------
  const sessions: TrainingSession[] = [];
  for (let d = 6; d >= 1; d--) {
    sessions.push({
      id: uid('s'), at: at(d, 9, 0), minutes: 10,
      skillIds: ['name', 'sit', 'come', 'leave', 'settle'], byMemberId: owner.id,
    });
  }
  await db.sessions.bulkPut(sessions);
  await db.skillProgress.bulkPut([
    { skillId: 'name', level: 3, lastPracticed: at(1, 9) },
    { skillId: 'sit', level: 3, lastPracticed: at(1, 9) },
    { skillId: 'come', level: 2, lastPracticed: at(1, 9) },
    { skillId: 'leave', level: 1, lastPracticed: at(2, 9) },
    { skillId: 'settle', level: 2, lastPracticed: at(1, 9) },
    { skillId: 'down', level: 1, lastPracticed: at(3, 9) },
  ]);

  // --- Behaviour history (evening biting pattern) ---------------------------
  const behaviors: BehaviorEvent[] = [];
  for (let d = 6; d >= 0; d--) {
    const bites = d > 3 ? 3 : 2;
    for (let b = 0; b < bites; b++) {
      const h = 18 + (b % 2);
      if (isFutureToday(d, h, 30)) continue;
      behaviors.push({ id: uid('bh'), type: 'biting', at: at(d, h, 30), byMemberId: owner.id });
    }
    if (!isFutureToday(d, 14, 0)) behaviors.push({ id: uid('bh'), type: 'calm', at: at(d, 14, 0), byMemberId: mom.id });
    if (d % 2 === 0 && !isFutureToday(d, 9, 30)) behaviors.push({ id: uid('bh'), type: 'good-response', at: at(d, 9, 30), byMemberId: owner.id });
  }
  await db.behaviors.bulkPut(behaviors);

  // --- Rest -----------------------------------------------------------------
  const rests: RestSession[] = [];
  for (let d = 6; d >= 1; d--) {
    rests.push({ id: uid('r'), start: at(d, 10, 0), end: at(d, 12, 0), byMemberId: mom.id });
    rests.push({ id: uid('r'), start: at(d, 15, 0), end: at(d, 16, 30), byMemberId: mom.id });
  }
  await db.rests.bulkPut(rests);

  // --- Health & reminders (spec §25) ----------------------------------------
  const health: HealthRecord[] = [
    { id: uid('hr'), kind: 'vaccination', title: 'Vaccination — 2nd (DHPP)', date: day(subWeeks(new Date(), 3)), done: true },
    { id: uid('hr'), kind: 'vaccination', title: 'Vaccination — 3rd (DHPP)', dueDate: day(subDays(new Date(), -8)), done: false },
    { id: uid('hr'), kind: 'deworming', title: 'Deworming', date: day(subWeeks(new Date(), 2)), dueDate: day(subDays(new Date(), -12)), done: true },
    { id: uid('hr'), kind: 'flea-tick', title: 'Flea/tick prevention', date: day(subWeeks(new Date(), 2)), done: true },
    { id: uid('hr'), kind: 'vet-visit', title: 'Puppy wellness check', date: day(subWeeks(new Date(), 3)), done: true, notes: 'All good; keep monitoring weekly weight.' },
  ];
  await db.health.bulkPut(health);
  const reminders: Reminder[] = [
    { id: uid('rem'), title: '3rd vaccination (DHPP)', dueDate: day(subDays(new Date(), -8)), kind: 'vaccination', done: false },
    { id: uid('rem'), title: 'Monthly deworming', dueDate: day(subDays(new Date(), -12)), kind: 'deworming', done: false },
    { id: uid('rem'), title: 'Weekly weight & measurements', dueDate: day(new Date()), kind: 'weight', done: false },
  ];
  await db.reminders.bulkPut(reminders);
}

export async function resetDatabase(): Promise<void> {
  await Promise.all(db.tables.map((t) => t.clear()));
  await seedDatabase();
}
