import type { Food, TreatOption } from '@/types';

// ============================================================================
// Food database — spec §13, §31. Includes an Indian-household focus.
//
// Nutrition philosophy (spec §6, §9, §11):
//  - Only a "primary-complete" food is treated as the nutritionally complete
//    diet. Household foods are toppers / treats / occasional, never the base.
//  - Where reliable nutrient data is not available we leave fields undefined
//    rather than inventing numbers.
//  - kcalPerKg for fresh foods are rough as-fed estimates for portioning only.
// ============================================================================

let n = 0;
const fid = () => `food-${++n}`;

export const DEFAULT_FOODS: Food[] = [
  // --- PRIMARY COMPLETE FOODS ---------------------------------------------
  {
    id: fid(),
    name: 'Large-Breed Puppy Kibble (complete & balanced)',
    category: 'primary-complete',
    safety: 'ok',
    kcalPerKg: 3700, // typical; user edits to match their label
    proteinPct: 28,
    fatPct: 14,
    puppySuitability: 'Formulated for large-breed growth',
    suitableAge: '8 weeks – 12+ months',
    maxContributionPct: 100,
    safetyNotes:
      'Use a food labelled complete & balanced for GROWTH (or "all life stages including growth of large-size dogs"). Enter the kcal/kg from YOUR bag — values vary by brand.',
    source: 'manufacturer',
    preparation: 'Measured by weight, split across meals.',
  },
  {
    id: fid(),
    name: 'Complete Puppy Food — Wet/Canned',
    category: 'primary-complete',
    safety: 'ok',
    kcalPerKg: 1100,
    puppySuitability: 'Complete & balanced growth wet food',
    maxContributionPct: 100,
    safetyNotes: 'Higher moisture means far more grams per calorie than kibble.',
    source: 'manufacturer',
  },

  // --- TOPPERS (small additions to a complete diet) ------------------------
  {
    id: fid(), name: 'Plain Curd / Dahi (unsweetened)', category: 'topper', safety: 'occasional',
    kcalPerKg: 980, proteinPct: 3.5, fatPct: 3.3, indian: true,
    maxContributionPct: 10, suitableAge: 'Small amounts',
    preparation: 'Plain, unsweetened, full-fat or low-fat.',
    safetyNotes: 'Some dogs are lactose-sensitive; start tiny. A spoonful as a topper, not a meal.',
    servingNote: '1–2 tsp for a puppy this size',
  },
  {
    id: fid(), name: 'Paneer (plain, unsalted)', category: 'topper', safety: 'occasional',
    kcalPerKg: 2650, proteinPct: 18, fatPct: 20, indian: true,
    maxContributionPct: 8, preparation: 'Plain, unsalted, small cubes.',
    safetyNotes: 'Calorie-dense and fatty — a little goes a long way. Great as a high-value training reward.',
    servingNote: 'A pea-sized cube or two',
  },
  {
    id: fid(), name: 'Boiled Egg', category: 'topper', safety: 'ok',
    kcalPerKg: 1550, proteinPct: 13, fatPct: 11, indian: true,
    maxContributionPct: 10, preparation: 'Fully cooked, plain, no salt/oil/spice.',
    safetyNotes: 'Cook thoroughly (avoid raw). Occasional, per spec — eggs may be available sometimes.',
    servingNote: '¼–½ egg occasionally',
  },
  {
    id: fid(), name: 'Cooked Pumpkin (plain)', category: 'topper', safety: 'ok',
    kcalPerKg: 260, indian: true, maxContributionPct: 10,
    preparation: 'Plain steamed/boiled, mashed, no spice/salt/sugar.',
    safetyNotes: 'Gentle fibre — can help firm up loose stool. Small amounts.',
    servingNote: '1–2 tsp',
  },
  {
    id: fid(), name: 'Cooked Carrot', category: 'topper', safety: 'ok',
    kcalPerKg: 410, indian: true, maxContributionPct: 10,
    preparation: 'Steamed soft, or raw sticks as a low-cal chew.',
    safetyNotes: 'Low calorie. Raw carrot sticks make a good teething chew (supervised).',
  },
  {
    id: fid(), name: 'Cooked Sweet Potato', category: 'topper', safety: 'occasional',
    kcalPerKg: 900, indian: true, maxContributionPct: 10,
    preparation: 'Plain boiled/steamed, no spice/salt.',
    safetyNotes: 'Starchy — keep portions small.',
  },
  {
    id: fid(), name: 'Plain Cooked Oats', category: 'topper', safety: 'occasional',
    kcalPerKg: 700, indian: true, maxContributionPct: 8,
    preparation: 'Plain, water-cooked, no sugar/milk.',
    safetyNotes: 'Carbohydrate topper only — not a meal replacement.',
  },
  {
    id: fid(), name: 'Plain Cooked Rice', category: 'topper', safety: 'occasional',
    kcalPerKg: 1300, indian: true, maxContributionPct: 8,
    preparation: 'Plain white/brown, no salt/spice/ghee.',
    safetyNotes: 'Bland-diet staple during mild tummy upsets (with vet guidance). Otherwise a small topper.',
  },
  {
    id: fid(), name: 'Plain Roti (small piece)', category: 'occasional', safety: 'occasional',
    kcalPerKg: 2700, indian: true, maxContributionPct: 5,
    preparation: 'Plain, no salt/ghee/spice.',
    safetyNotes: 'Wheat-based, calorie-dense. Occasional small piece only; some dogs are wheat-sensitive.',
  },
  {
    id: fid(), name: 'Cooked Green Beans / Bottle Gourd (lauki)', category: 'topper', safety: 'ok',
    kcalPerKg: 200, indian: true, maxContributionPct: 10,
    preparation: 'Plain steamed, no spice/salt.',
    safetyNotes: 'Very low calorie — useful bulk for a hungry, growing pup.',
  },
  {
    id: fid(), name: 'Apple (no seeds/core)', category: 'occasional', safety: 'ok',
    kcalPerKg: 520, indian: true, maxContributionPct: 5,
    preparation: 'Deseeded, cored, small slices.',
    safetyNotes: 'Remove all seeds and the core (seeds contain trace cyanogenic compounds). Flesh is fine in small amounts.',
  },
  {
    id: fid(), name: 'Banana (small slice)', category: 'occasional', safety: 'occasional',
    kcalPerKg: 890, indian: true, maxContributionPct: 5,
    safetyNotes: 'Sugary — a thin slice as a treat only.',
  },
  {
    id: fid(), name: 'Watermelon (no seeds/rind)', category: 'occasional', safety: 'ok',
    kcalPerKg: 300, indian: true, maxContributionPct: 5,
    preparation: 'Deseeded, no rind.',
    safetyNotes: 'Hydrating summer treat. Remove seeds and rind.',
  },

  // --- NOT APPROPRIATE / DANGEROUS (toxicity depends on dose — flagged, not
  //     labelled a flat "unsafe amount") ------------------------------------
  {
    id: fid(), name: 'Grapes', category: 'not-appropriate', safety: 'toxic', kcalPerKg: 690, indian: true,
    safetyNotes: 'Can cause acute kidney injury in dogs; the toxic dose is unpredictable and can be small. Never feed. If eaten, contact a vet promptly.',
    maxContributionPct: 0,
  },
  {
    id: fid(), name: 'Raisins / Kishmish', category: 'not-appropriate', safety: 'toxic', kcalPerKg: 3000, indian: true,
    safetyNotes: 'Same kidney risk as grapes, concentrated. Common in Indian sweets/kheer — keep those away from the puppy.',
    maxContributionPct: 0,
  },
  {
    id: fid(), name: 'Onion (incl. powder/gravy)', category: 'not-appropriate', safety: 'toxic', indian: true, kcalPerKg: 400,
    safetyNotes: 'Damages red blood cells; effect builds with repeated exposure. Most Indian gravies/sabzis contain onion — do not share table food.',
    maxContributionPct: 0,
  },
  {
    id: fid(), name: 'Garlic (incl. powder/paste)', category: 'not-appropriate', safety: 'toxic', indian: true, kcalPerKg: 1490,
    safetyNotes: 'Same family as onion; more potent by weight. Present in most Indian cooking. Avoid.',
    maxContributionPct: 0,
  },
  {
    id: fid(), name: 'Chocolate', category: 'not-appropriate', safety: 'toxic', kcalPerKg: 5000,
    safetyNotes: 'Theobromine is toxic; darker chocolate is more dangerous. Amount matters — for any suspected ingestion, contact a vet with the type and quantity.',
    maxContributionPct: 0,
  },
  {
    id: fid(), name: 'Xylitol (sugar-free sweetener)', category: 'not-appropriate', safety: 'toxic', kcalPerKg: 2400,
    safetyNotes: 'Even small amounts can cause dangerous blood-sugar drop and liver injury. Found in sugar-free gum, some peanut butters and mints. Emergency.',
    maxContributionPct: 0,
  },
  {
    id: fid(), name: 'Caffeine (tea/coffee)', category: 'not-appropriate', safety: 'toxic', kcalPerKg: 0, indian: true,
    safetyNotes: 'Chai, coffee and their grounds are stimulants toxic to dogs. Keep cups out of reach.',
    maxContributionPct: 0,
  },
  {
    id: fid(), name: 'Alcohol', category: 'not-appropriate', safety: 'toxic', kcalPerKg: 0,
    safetyNotes: 'Toxic even in small amounts. Never give; includes fermenting/raw dough.',
    maxContributionPct: 0,
  },
  {
    id: fid(), name: 'Macadamia Nuts', category: 'not-appropriate', safety: 'toxic', kcalPerKg: 7200,
    safetyNotes: 'Cause weakness, tremors and hyperthermia in dogs. Avoid; contact a vet if eaten.',
    maxContributionPct: 0,
  },
  {
    id: fid(), name: 'Cooked Bones', category: 'not-appropriate', safety: 'avoid', kcalPerKg: 0, indian: true,
    safetyNotes: 'Cooked bones (incl. chicken/mutton from meals) splinter and can perforate the gut or cause obstruction. Never give.',
    maxContributionPct: 0,
  },
  {
    id: fid(), name: 'Heavily Spiced / Masala Food', category: 'not-appropriate', safety: 'avoid', indian: true, kcalPerKg: 0,
    safetyNotes: 'Chilli, garam masala, onion, garlic and oil upset the stomach and often hide toxic ingredients. Keep the puppy on plain food.',
    maxContributionPct: 0,
  },
  {
    id: fid(), name: 'Very Salty / Fried Snacks (namkeen, chips)', category: 'not-appropriate', safety: 'avoid', indian: true, kcalPerKg: 5000,
    safetyNotes: 'Excess salt and fat; fried snacks can trigger pancreatitis. Avoid.',
    maxContributionPct: 0,
  },
  {
    id: fid(), name: 'Milk (cow/buffalo, as a drink)', category: 'occasional', safety: 'occasional', indian: true, kcalPerKg: 600,
    safetyNotes: 'Many pups are lactose-intolerant — can cause loose stool. Curd/paneer are better tolerated. Not a substitute for water.',
    maxContributionPct: 5,
  },
];

// Quick-pick treat options for the treat calculator (spec §12)
export const TREAT_OPTIONS: TreatOption[] = [
  { id: 't-small', name: 'Small kibble piece', kcal: 2, emoji: '🔸', note: 'A single piece of their own food' },
  { id: 't-train', name: 'Training treat', kcal: 4, emoji: '🦴', note: 'Tiny commercial training treat' },
  { id: 't-biscuit', name: 'Dog biscuit', kcal: 25, emoji: '🍪', note: 'One standard biscuit' },
  { id: 't-paneer', name: 'Paneer cube (pea-size)', kcal: 12, emoji: '🧀', note: 'High-value reward' },
  { id: 't-egg', name: '¼ boiled egg', kcal: 18, emoji: '🥚', note: 'Occasional' },
  { id: 't-carrot', name: 'Carrot stick', kcal: 5, emoji: '🥕', note: 'Low-calorie, good for teething' },
  { id: 't-curd', name: 'Curd (1 tsp)', kcal: 5, emoji: '🥛', note: 'Plain, unsweetened' },
  { id: 't-apple', name: 'Apple slice', kcal: 6, emoji: '🍎', note: 'No seeds/core' },
];

export const SAFETY_META: Record<Food['safety'], { label: string; className: string; short: string }> = {
  ok: { label: 'OK in appropriate portions', className: 'bg-moss-500/15 text-moss-600', short: 'OK' },
  occasional: { label: 'Occasional / portion control', className: 'bg-gold-200/40 text-gold-700', short: 'Occasional' },
  avoid: { label: 'Avoid', className: 'bg-orange-200/50 text-orange-700', short: 'Avoid' },
  toxic: { label: 'Potentially toxic — contact vet', className: 'bg-red-200/50 text-red-700', short: 'Toxic' },
};

export const CATEGORY_META: Record<Food['category'], { label: string }> = {
  'primary-complete': { label: 'Primary complete food' },
  topper: { label: 'Topper' },
  treat: { label: 'Treat' },
  occasional: { label: 'Occasional food' },
  'not-appropriate': { label: 'Not appropriate' },
};
