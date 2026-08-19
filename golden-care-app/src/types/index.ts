// ============================================================================
// Data model — see spec §36. All persisted entities live here.
// ============================================================================

export type ID = string;
export type ISODate = string; // 'YYYY-MM-DD'
export type ISODateTime = string; // full ISO timestamp

export type Sex = 'male' | 'female';
export type ActivityLevel = 'low' | 'moderate' | 'active' | 'very-active';
export type NeuterStatus = 'intact' | 'neutered';

export type FamilyRole = 'owner' | 'mother' | 'father' | 'member';

export interface FamilyMember {
  id: ID;
  name: string;
  role: FamilyRole;
  emoji: string; // avatar
  color: string; // accent color
}

export interface Dog {
  id: ID;
  name: string;
  breed: string;
  isLargeBreed: boolean;
  sex: Sex;
  dob: ISODate; // date of birth
  weightKg: number; // current weight (latest measurement mirror)
  heightCm?: number;
  activity: ActivityLevel;
  neuter: NeuterStatus;
  currentFoodId: ID | null;
  healthNotes: string;
  allergies: string[]; // free-text intolerances
  photo?: string; // data URL or emoji fallback
}

// ---------------------------------------------------------------------------
// Food & nutrition
// ---------------------------------------------------------------------------

export type FoodCategory =
  | 'primary-complete'
  | 'topper'
  | 'treat'
  | 'occasional'
  | 'not-appropriate';

export type SafetyLevel =
  | 'ok'          // OK in appropriate portions
  | 'occasional'  // occasional / portion control
  | 'avoid'       // avoid
  | 'toxic';      // potentially toxic — contact vet

export interface Food {
  id: ID;
  name: string;
  category: FoodCategory;
  safety: SafetyLevel;
  kcalPerKg: number; // energy density (label value for kibble, estimate for fresh)
  // Optional macro/micro per 100g. undefined = unknown (never invented).
  proteinPct?: number; // % of food weight
  fatPct?: number;
  carbPct?: number;
  calciumPct?: number;
  phosphorusPct?: number;
  servingNote?: string;
  preparation?: string;
  suitableAge?: string;
  puppySuitability?: string;
  maxContributionPct?: number; // max % of daily calories this should provide
  safetyNotes?: string;
  source?: string;
  indian?: boolean; // common in Indian household
  isCustom?: boolean;
}

// A treat quick-pick option shown in the treat calculator
export interface TreatOption {
  id: ID;
  name: string;
  kcal: number; // estimated kcal for one serving
  emoji: string;
  note?: string;
}

// ---------------------------------------------------------------------------
// Diet plan (the "Standard Diet") — spec §10
// ---------------------------------------------------------------------------

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealComponent {
  foodId: ID;
  grams: number;
  auto: boolean; // true = grams auto-calculated from energy target
}

export interface Meal {
  slot: MealSlot;
  label: string;
  timeHint: string; // 'HH:mm'
  components: MealComponent[];
}

export interface DietPlan {
  id: ID;
  dogId: ID;
  primaryFoodId: ID; // complete & balanced food
  mealsPerDay: number;
  meals: Meal[];
  treatBudgetPct: number; // % of daily calories (default 10)
  autoScaleWithGrowth: boolean;
  energyTargetKcal: number; // snapshot target when plan was set
  updatedAt: ISODateTime;
}

// ---------------------------------------------------------------------------
// Events (the family logs these; mostly one-tap)
// ---------------------------------------------------------------------------

export interface FeedingEvent {
  id: ID;
  slot: MealSlot | 'topper';
  label: string;
  grams?: number;
  kcal?: number;
  at: ISODateTime;
  byMemberId: ID;
}

export interface TreatEvent {
  id: ID;
  name: string;
  kcal: number;
  at: ISODateTime;
  byMemberId: ID;
}

export interface WaterEvent {
  id: ID;
  at: ISODateTime;
  byMemberId: ID;
}

export type PottyKind = 'pee' | 'poop' | 'both';
export type PottyResult = 'outside' | 'accident';
export type PottyContext =
  | 'woke-up' | 'after-eating' | 'after-drinking' | 'after-play'
  | 'after-training' | 'after-nap' | 'routine';

export interface PottyEvent {
  id: ID;
  kind: PottyKind;
  result: PottyResult;
  context?: PottyContext;
  at: ISODateTime;
  byMemberId: ID;
}

// ---------------------------------------------------------------------------
// Training & behaviour
// ---------------------------------------------------------------------------

export type SkillCategory = 'foundation' | 'manners' | 'behaviour' | 'socialization';

export interface TrainingSkill {
  id: ID;
  name: string;
  category: SkillCategory;
  description: string;
  minWeeks: number; // earliest age (weeks) to introduce
  method: string; // positive-reinforcement cue
}

export interface SkillProgress {
  skillId: ID;
  level: 0 | 1 | 2 | 3; // not started / learning / reliable / mastered
  lastPracticed?: ISODateTime;
}

export interface TrainingSession {
  id: ID;
  at: ISODateTime;
  minutes: number;
  skillIds: ID[];
  byMemberId: ID;
  notes?: string;
}

export type BehaviorType =
  | 'biting' | 'barking' | 'jumping' | 'chewing' | 'whining'
  | 'pulling' | 'stealing' | 'guarding' | 'calm' | 'good-response';

export interface BehaviorEvent {
  id: ID;
  type: BehaviorType;
  at: ISODateTime;
  byMemberId: ID;
  note?: string;
}

// ---------------------------------------------------------------------------
// Rest
// ---------------------------------------------------------------------------

export interface RestSession {
  id: ID;
  start: ISODateTime;
  end?: ISODateTime; // undefined = currently resting
  byMemberId: ID;
}

// ---------------------------------------------------------------------------
// Growth
// ---------------------------------------------------------------------------

export interface WeightMeasurement {
  id: ID;
  date: ISODate;
  weightKg: number;
  byMemberId: ID;
}
export interface HeightMeasurement {
  id: ID;
  date: ISODate;
  heightCm: number;
  byMemberId: ID;
}
export interface BCSMeasurement {
  id: ID;
  date: ISODate;
  score: number; // 1-9
  byMemberId: ID;
}

// ---------------------------------------------------------------------------
// Health / vet
// ---------------------------------------------------------------------------

export type HealthKind =
  | 'vaccination' | 'deworming' | 'flea-tick' | 'vet-visit'
  | 'medication' | 'dental' | 'other';

export interface HealthRecord {
  id: ID;
  kind: HealthKind;
  title: string;
  date?: ISODate; // date given / done
  dueDate?: ISODate; // next due
  notes?: string;
  done: boolean;
}

export interface Reminder {
  id: ID;
  title: string;
  dueDate: ISODate;
  kind: HealthKind | 'routine' | 'weight';
  done: boolean;
}

// ---------------------------------------------------------------------------
// Alerts (spec §29 — human-error prevention)
// ---------------------------------------------------------------------------

export type AlertLevel = 'info' | 'warn' | 'urgent';
export interface Alert {
  id: ID;
  level: AlertLevel;
  title: string;
  detail: string;
  icon?: string;
}

// ---------------------------------------------------------------------------
// Routine
// ---------------------------------------------------------------------------

export type RoutineActivity =
  | 'wake' | 'potty' | 'breakfast' | 'lunch' | 'dinner'
  | 'play' | 'training' | 'rest' | 'calm' | 'water' | 'bed';

export interface RoutineStep {
  id: string;
  time: string; // 'HH:mm'
  activity: RoutineActivity;
  title: string;
  detail?: string;
  durationMin?: number;
  linkedSlot?: MealSlot; // for meal steps
}

export interface DailyRoutine {
  wakeTime: string; // 'HH:mm'
  bedTime: string;
  mealsPerDay: number;
  steps: RoutineStep[];
}

// ---------------------------------------------------------------------------
// Settings / meta
// ---------------------------------------------------------------------------

export interface Settings {
  id: 'app';
  wakeTime: string;
  bedTime: string;
  mealsPerDay: number;
  activeMemberId: ID;
  mode: 'simple' | 'admin';
  lastWeeklyCheck?: ISODate;
}
