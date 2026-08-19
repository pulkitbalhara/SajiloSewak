import { db, uid } from './db';
import { format } from 'date-fns';
import type {
  MealSlot, PottyKind, PottyResult, PottyContext, BehaviorType, Settings,
  Dog, DietPlan, Food, HealthRecord, Reminder,
} from '@/types';

// ============================================================================
// Mutations — all state changes go through here (spec §35 clean state layer).
// ============================================================================

async function activeMember(): Promise<string> {
  const s = await db.settings.get('app');
  return s?.activeMemberId ?? 'm-owner';
}

export async function logFeeding(slot: MealSlot | 'topper', label: string, grams?: number, kcal?: number) {
  await db.feedings.put({ id: uid('f'), slot, label, grams, kcal, at: new Date().toISOString(), byMemberId: await activeMember() });
}
export async function undoLastFeeding(slot: MealSlot) {
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const list = (await db.feedings.where('slot').equals(slot).toArray())
    .filter((f) => new Date(f.at) >= todayStart)
    .sort((a, b) => b.at.localeCompare(a.at));
  if (list[0]) await db.feedings.delete(list[0].id);
}

export async function logTreat(name: string, kcal: number) {
  await db.treats.put({ id: uid('t'), name, kcal, at: new Date().toISOString(), byMemberId: await activeMember() });
}
export async function logWater() {
  await db.water.put({ id: uid('wa'), at: new Date().toISOString(), byMemberId: await activeMember() });
}

export async function logPotty(kind: PottyKind, result: PottyResult, context?: PottyContext) {
  await db.potty.put({ id: uid('p'), kind, result, context, at: new Date().toISOString(), byMemberId: await activeMember() });
}

export async function logBehavior(type: BehaviorType, note?: string) {
  await db.behaviors.put({ id: uid('bh'), type, note, at: new Date().toISOString(), byMemberId: await activeMember() });
}

export async function logTrainingSession(minutes: number, skillIds: string[], notes?: string) {
  const now = new Date().toISOString();
  await db.sessions.put({ id: uid('s'), at: now, minutes, skillIds, notes, byMemberId: await activeMember() });
  // bump skill progress
  for (const id of skillIds) {
    const cur = await db.skillProgress.get(id);
    const level = Math.min(3, (cur?.level ?? 0) + 1) as 0 | 1 | 2 | 3;
    await db.skillProgress.put({ skillId: id, level, lastPracticed: now });
  }
}
export async function setSkillLevel(skillId: string, level: 0 | 1 | 2 | 3) {
  await db.skillProgress.put({ skillId, level, lastPracticed: new Date().toISOString() });
}

export async function startRest() {
  const active = (await db.rests.toArray()).find((r) => !r.end);
  if (active) return;
  await db.rests.put({ id: uid('r'), start: new Date().toISOString(), byMemberId: await activeMember() });
}
export async function endRest() {
  const active = (await db.rests.toArray()).find((r) => !r.end);
  if (active) await db.rests.put({ ...active, end: new Date().toISOString() });
}

export async function addWeeklyCheck(weightKg: number, heightCm?: number, bcs?: number) {
  const by = await activeMember();
  const date = format(new Date(), 'yyyy-MM-dd');
  await db.weights.put({ id: uid('w'), date, weightKg, byMemberId: by });
  if (heightCm != null) await db.heights.put({ id: uid('h'), date, heightCm, byMemberId: by });
  if (bcs != null) await db.bcs.put({ id: uid('b'), date, score: bcs, byMemberId: by });
  // update dog mirror
  const dog = await db.dogs.get('dog-1');
  if (dog) await db.dogs.put({ ...dog, weightKg, heightCm: heightCm ?? dog.heightCm });
  // clear weekly reminder
  const s = await db.settings.get('app');
  if (s) await db.settings.put({ ...s, lastWeeklyCheck: date });
  const rem = (await db.reminders.toArray()).find((r) => r.kind === 'weight' && !r.done);
  if (rem) await db.reminders.put({ ...rem, done: true });
}

export async function updateSettings(patch: Partial<Settings>) {
  const s = await db.settings.get('app');
  if (s) await db.settings.put({ ...s, ...patch });
}
export async function setActiveMember(id: string) { await updateSettings({ activeMemberId: id }); }
export async function setMode(mode: 'simple' | 'admin') { await updateSettings({ mode }); }

export async function updateDog(patch: Partial<Dog>) {
  const dog = await db.dogs.get('dog-1');
  if (dog) await db.dogs.put({ ...dog, ...patch });
}

export async function saveDietPlan(plan: DietPlan) { await db.dietPlans.put(plan); }

export async function saveFood(food: Food) { await db.foods.put(food); }
export async function deleteFood(id: string) { await db.foods.delete(id); }

export async function toggleHealth(rec: HealthRecord) {
  await db.health.put({ ...rec, done: !rec.done });
}
export async function saveHealth(rec: HealthRecord) { await db.health.put(rec); }
export async function toggleReminder(rem: Reminder) {
  await db.reminders.put({ ...rem, done: !rem.done });
}
