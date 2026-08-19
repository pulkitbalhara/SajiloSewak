import Dexie, { type Table } from 'dexie';
import type {
  Dog, FamilyMember, Food, DietPlan, FeedingEvent, TreatEvent, WaterEvent,
  PottyEvent, TrainingSession, SkillProgress, BehaviorEvent, RestSession,
  WeightMeasurement, HeightMeasurement, BCSMeasurement, HealthRecord,
  Reminder, Settings,
} from '@/types';

// ============================================================================
// Local persistence (spec §35) — IndexedDB via Dexie. Structured so a backend
// (e.g. Supabase/Postgres) can later replace it table-for-table.
// ============================================================================

export class GoldenDB extends Dexie {
  dogs!: Table<Dog, string>;
  family!: Table<FamilyMember, string>;
  foods!: Table<Food, string>;
  dietPlans!: Table<DietPlan, string>;
  feedings!: Table<FeedingEvent, string>;
  treats!: Table<TreatEvent, string>;
  water!: Table<WaterEvent, string>;
  potty!: Table<PottyEvent, string>;
  sessions!: Table<TrainingSession, string>;
  skillProgress!: Table<SkillProgress, string>;
  behaviors!: Table<BehaviorEvent, string>;
  rests!: Table<RestSession, string>;
  weights!: Table<WeightMeasurement, string>;
  heights!: Table<HeightMeasurement, string>;
  bcs!: Table<BCSMeasurement, string>;
  health!: Table<HealthRecord, string>;
  reminders!: Table<Reminder, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super('golden-care');
    this.version(1).stores({
      dogs: 'id',
      family: 'id, role',
      foods: 'id, category, safety',
      dietPlans: 'id, dogId',
      feedings: 'id, at, slot',
      treats: 'id, at',
      water: 'id, at',
      potty: 'id, at, result',
      sessions: 'id, at',
      skillProgress: 'skillId',
      behaviors: 'id, at, type',
      rests: 'id, start',
      weights: 'id, date',
      heights: 'id, date',
      bcs: 'id, date',
      health: 'id, kind, dueDate',
      reminders: 'id, dueDate',
      settings: 'id',
    });
  }
}

export const db = new GoldenDB();

export function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
