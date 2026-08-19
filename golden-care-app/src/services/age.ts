import { differenceInDays } from 'date-fns';
import type { ISODate } from '@/types';

// ============================================================================
// Age & life-stage engine — spec §24. Life stage depends on age, size, breed
// and development (AAHA), not age alone; here we key off age for a large breed.
// ============================================================================

export interface AgeInfo {
  days: number;
  weeks: number;
  months: number; // fractional
  label: string; // "3 months", "14 weeks"
}

export function calculateAge(dob: ISODate, on: Date = new Date()): AgeInfo {
  const days = Math.max(0, differenceInDays(on, new Date(dob + 'T00:00:00')));
  const weeks = days / 7;
  const months = days / 30.4375;
  let label: string;
  if (weeks < 16) label = `${Math.round(weeks)} weeks`;
  else label = `${months.toFixed(months < 6 ? 1 : 0)} months`;
  return { days, weeks, months, label };
}

export type LifeStageKey =
  | '8-12w' | '3-4m' | '4-6m' | '6-9m' | '9-12m' | '12-18m' | 'adult';

export interface LifeStage {
  key: LifeStageKey;
  label: string;
  // Energy factor as a multiple of RER (starting points; Merck).
  energyFactor: number;
  energyFactorNote: string;
  recommendedMeals: number;
  trainingMinutes: number; // suggested daily total
  focus: string;
  pottyHoldHours: number; // rough daytime hold guide (age in months + 1, capped)
}

// Ordered thresholds by age in months.
const STAGES: { maxMonths: number; stage: LifeStage }[] = [
  { maxMonths: 3, stage: {
    key: '8-12w', label: '8–12 weeks', energyFactor: 3.0,
    energyFactorNote: '~3× RER — fastest early growth (Merck starting point).',
    recommendedMeals: 4, trainingMinutes: 10,
    focus: 'Socialization window, name, potty routine, gentle handling.', pottyHoldHours: 2 } },
  { maxMonths: 4, stage: {
    key: '3-4m', label: '3–4 months', energyFactor: 3.0,
    energyFactorNote: 'Puppies under ~4 months are commonly estimated near 3× RER (Merck).',
    recommendedMeals: 3, trainingMinutes: 12,
    focus: 'Foundation cues, bite inhibition, continued socialization.', pottyHoldHours: 3 } },
  { maxMonths: 6, stage: {
    key: '4-6m', label: '4–6 months', energyFactor: 2.5,
    energyFactorNote: '~2.5× RER as growth begins to slow (Merck).',
    recommendedMeals: 3, trainingMinutes: 15,
    focus: 'Reliability on cues, teething management, manners.', pottyHoldHours: 4 } },
  { maxMonths: 9, stage: {
    key: '6-9m', label: '6–9 months', energyFactor: 2.2,
    energyFactorNote: '~2–2.2× RER as the puppy nears adolescence (Merck).',
    recommendedMeals: 2, trainingMinutes: 15,
    focus: 'Adolescence — patient consistency, impulse control, longer settles.', pottyHoldHours: 5 } },
  { maxMonths: 12, stage: {
    key: '9-12m', label: '9–12 months', energyFactor: 2.0,
    energyFactorNote: '~2× RER approaching adult size (Merck).',
    recommendedMeals: 2, trainingMinutes: 15,
    focus: 'Proofing cues in distractions, calm greetings, recall.', pottyHoldHours: 6 } },
  { maxMonths: 18, stage: {
    key: '12-18m', label: '12–18 months', energyFactor: 1.8,
    energyFactorNote: 'Large breeds mature more slowly; ~1.8× RER while finishing growth (Merck).',
    recommendedMeals: 2, trainingMinutes: 15,
    focus: 'Finishing large-breed growth; transition toward adult food with vet guidance.', pottyHoldHours: 6 } },
  { maxMonths: Infinity, stage: {
    key: 'adult', label: 'Adult', energyFactor: 1.6,
    energyFactorNote: '~1.6× RER for a neutered adult (Merck) — intact/active dogs need more.',
    recommendedMeals: 2, trainingMinutes: 10,
    focus: 'Maintenance, mental enrichment, healthy weight.', pottyHoldHours: 6 } },
];

export function lifeStageForMonths(months: number): LifeStage {
  for (const s of STAGES) if (months < s.maxMonths) return s.stage;
  return STAGES[STAGES.length - 1].stage;
}
