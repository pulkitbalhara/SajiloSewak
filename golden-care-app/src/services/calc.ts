import type { Dog, Food, DietPlan, WeightMeasurement } from '@/types';
import { calculateAge, lifeStageForMonths, type LifeStage } from './age';

// ============================================================================
// Nutrition & growth calculations — spec §7, §8, §12, §14, §37.
// Every result carries: value, units, formula, basis (source key), assumptions
// and limitations. Calculations NEVER live in UI components.
// ============================================================================

export interface Calc<T = number> {
  value: T;
  units?: string;
  formula: string;
  basis: string; // source org
  assumptions: string[];
  limitations: string;
}

// --- RER: Resting Energy Requirement ---------------------------------------
export function calculateRER(weightKg: number): Calc {
  const value = 70 * Math.pow(weightKg, 0.75);
  return {
    value: Math.round(value),
    units: 'kcal/day',
    formula: 'RER = 70 × (weight kg)^0.75',
    basis: 'Veterinary nutrition — RER',
    assumptions: [`Body weight = ${weightKg} kg`],
    limitations:
      'RER is only the at-rest energy baseline. A growing puppy needs a multiple of this.',
  };
}

// --- Estimated daily energy requirement (MER-style) ------------------------
export interface EnergyEstimate extends Calc {
  rer: number;
  factor: number;
  stage: LifeStage;
}
export function estimateEnergyRequirement(dog: Dog, on: Date = new Date()): EnergyEstimate {
  const rer = 70 * Math.pow(dog.weightKg, 0.75);
  const age = calculateAge(dog.dob, on);
  const stage = lifeStageForMonths(age.months);
  let factor = stage.energyFactor;
  // Adult factor nudges for neuter/activity (only applied once growth is done).
  if (stage.key === 'adult') {
    factor = dog.neuter === 'neutered' ? 1.6 : 1.8;
    if (dog.activity === 'active') factor += 0.2;
    if (dog.activity === 'very-active') factor += 0.4;
    if (dog.activity === 'low') factor -= 0.2;
  }
  const value = rer * factor;
  return {
    value: Math.round(value),
    units: 'kcal/day',
    rer: Math.round(rer),
    factor,
    stage,
    formula: `Energy ≈ RER × ${factor.toFixed(1)}  (RER = 70 × weight^0.75)`,
    basis: 'Merck Veterinary Manual',
    assumptions: [
      `Weight ${dog.weightKg} kg, age ${age.label} (${stage.label})`,
      stage.energyFactorNote,
    ],
    limitations:
      'This is a STARTING ESTIMATE, not an exact prescription. Adjust to the individual by weekly weight trend, body-condition score and your vet’s guidance.',
  };
}

// --- Food grams from an energy target & food density -----------------------
export function calculateFoodGrams(kcalTarget: number, food: Food): Calc {
  const grams = (kcalTarget / food.kcalPerKg) * 1000;
  return {
    value: Math.round(grams),
    units: 'g/day',
    formula: 'grams = (target kcal ÷ food kcal per kg) × 1000',
    basis: 'Manufacturer feeding guide',
    assumptions: [
      `Target ${Math.round(kcalTarget)} kcal/day`,
      `${food.name}: ${food.kcalPerKg} kcal/kg`,
    ],
    limitations:
      'Uses the calorie density you entered. If the food or its label changes, recalculate. Weigh food with a kitchen scale for accuracy.',
  };
}

// --- Split a daily gram amount across N meals ------------------------------
export function calculateMealAllocation(totalGrams: number, meals: number): number[] {
  if (meals <= 0) return [];
  const base = Math.round(totalGrams / meals / 5) * 5; // round to 5 g
  const out = Array(meals).fill(base);
  // put remainder into the first meal so the day sums correctly-ish
  const diff = Math.round(totalGrams) - base * meals;
  out[0] = Math.max(0, base + diff);
  return out;
}

// --- Treat budget (≤10% of daily calories) ---------------------------------
export function calculateTreatBudget(energyKcal: number, pct = 10): Calc {
  const value = (energyKcal * pct) / 100;
  return {
    value: Math.round(value),
    units: 'kcal/day',
    formula: `budget = daily energy × ${pct}%`,
    basis: 'Veterinary nutrition — the 10% rule',
    assumptions: [`Daily energy ≈ ${Math.round(energyKcal)} kcal`, `Treat share ${pct}%`],
    limitations:
      'Keeping treats & toppers under ~10% protects the complete diet from being diluted below nutritional adequacy.',
  };
}

// --- Weight change between two most recent measurements --------------------
export interface WeightChange {
  latestKg: number | null;
  previousKg: number | null;
  deltaKg: number | null;
  deltaPct: number | null;
  daysBetween: number | null;
}
export function calculateWeightChange(ms: WeightMeasurement[]): WeightChange {
  const sorted = [...ms].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  if (!latest) return { latestKg: null, previousKg: null, deltaKg: null, deltaPct: null, daysBetween: null };
  if (!prev) return { latestKg: latest.weightKg, previousKg: null, deltaKg: null, deltaPct: null, daysBetween: null };
  const deltaKg = +(latest.weightKg - prev.weightKg).toFixed(2);
  const days = Math.max(1,
    Math.round((+new Date(latest.date) - +new Date(prev.date)) / 86400000));
  return {
    latestKg: latest.weightKg,
    previousKg: prev.weightKg,
    deltaKg,
    deltaPct: +((deltaKg / prev.weightKg) * 100).toFixed(1),
    daysBetween: days,
  };
}

// --- Growth velocity (kg gained per week) ----------------------------------
export function calculateGrowthVelocity(ms: WeightMeasurement[]): Calc<number | null> {
  const c = calculateWeightChange(ms);
  if (c.deltaKg == null || c.daysBetween == null) {
    return { value: null, units: 'kg/week', formula: 'Δweight ÷ weeks between checks',
      basis: 'Merck Veterinary Manual', assumptions: ['Need at least two weight checks'],
      limitations: 'Add weekly weights to see the growth rate.' };
  }
  const perWeek = +(c.deltaKg / (c.daysBetween / 7)).toFixed(2);
  return {
    value: perWeek,
    units: 'kg/week',
    formula: 'velocity = Δweight ÷ (days between ÷ 7)',
    basis: 'Merck Veterinary Manual',
    assumptions: [`Δ ${c.deltaKg} kg over ${c.daysBetween} days`],
    limitations:
      'Aim for steady gain, not rapid gain — large-breed puppies do best growing slowly with a lean body condition. Judge trajectory over several weeks, not one reading.',
  };
}

// --- Sum today's energy target from a diet plan (for display) --------------
export function planDailyKcal(plan: DietPlan, foods: Record<string, Food>): number {
  let kcal = 0;
  for (const meal of plan.meals) {
    for (const c of meal.components) {
      const f = foods[c.foodId];
      if (f) kcal += (c.grams / 1000) * f.kcalPerKg;
    }
  }
  return Math.round(kcal);
}
