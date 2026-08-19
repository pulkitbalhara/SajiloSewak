import { useMemo, useState } from 'react';
import { Search, AlertTriangle, ShieldCheck, Pencil } from 'lucide-react';
import { useData } from '@/hooks/useData';
import { Card, SectionTitle, WhyThis, Button, Sheet, useToast, cn, Pill } from '@/components/ui';
import { calculateFoodGrams, calculateMealAllocation } from '@/services/calc';
import { SAFETY_META, CATEGORY_META } from '@/data/foods';
import { saveDietPlan, saveFood, updateSettings, updateDog } from '@/db/actions';
import type { Food, DietPlan } from '@/types';

export default function Diet() {
  const data = useData();
  const toast = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [foodOpen, setFoodOpen] = useState(false);

  if (data.loading || !data.derived || !data.plan) return <div className="py-20 text-center text-ink-400">Loading…</div>;
  const d = data.derived;
  const plan = data.plan;
  const primary = data.foodMap[plan.primaryFoodId];
  const totalGrams = plan.meals.reduce((a, m) => a + m.components.reduce((x, c) => x + c.grams, 0), 0);

  return (
    <div className="space-y-4 pt-1">
      <div className="px-1">
        <h1 className="text-2xl font-semibold tracking-tight">Diet</h1>
        <p className="text-sm text-ink-400">Measured meals · complete nutrition · healthy lean growth</p>
      </div>

      {/* Daily energy target (parent-friendly, spec §30) */}
      <Card>
        <SectionTitle>Daily energy target</SectionTitle>
        <div className="flex items-end gap-2">
          <div className="stat-num text-4xl">~{d.energy.value}</div>
          <div className="text-ink-400 mb-1">kcal / day</div>
        </div>
        <p className="mt-1 text-sm text-ink-500">
          Calculated automatically from {data.dog!.name}'s age, weight and growth stage ({d.stage.label}).
          This is a <b>starting estimate</b> — we fine-tune it from the weekly weight trend and body condition.
        </p>
        <WhyThis formula={d.energy.formula} basis={d.energy.basis} assumptions={d.energy.assumptions} limitations={d.energy.limitations} />
      </Card>

      {/* Today's food (spec §8) */}
      <Card>
        <div className="flex items-center justify-between">
          <SectionTitle>Today's food</SectionTitle>
          <button onClick={() => setEditOpen(true)} className="text-xs font-semibold text-gold-600 flex items-center gap-1 mb-2"><Pencil size={12} /> Standard diet</button>
        </div>
        <div className="flex items-end gap-2">
          <div className="stat-num text-3xl">{totalGrams}</div><div className="text-ink-400 mb-1">g total</div>
        </div>
        <div className="text-xs text-ink-400">{primary?.name} @ {primary?.kcalPerKg} kcal/kg</div>
        <div className="mt-3 space-y-2">
          {plan.meals.map((m) => {
            const g = m.components.reduce((a, c) => a + c.grams, 0);
            return (
              <div key={m.slot} className="flex items-center justify-between rounded-2xl bg-cream-100 px-3 py-2.5">
                <div><div className="text-sm font-semibold">{m.label}</div><div className="text-[11px] text-ink-400">{m.timeHint}</div></div>
                <div className="text-right"><div className="text-lg font-semibold tnum">{g} g</div></div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 rounded-2xl bg-gold-50 border border-gold-200 p-3 text-xs text-gold-700 flex gap-2">
          <ShieldCheck size={16} className="shrink-0 mt-0.5" />
          <span>Weigh food on a kitchen scale for accuracy. If you change the food or its label kcal/kg, the app recalculates grams automatically.</span>
        </div>
      </Card>

      {/* Complete-nutrition principle (spec §6/§11) */}
      <div className="rounded-3xl border border-gold-200 bg-gradient-to-br from-cream-100 to-gold-50 p-4">
        <div className="flex items-center gap-2 text-gold-700 font-semibold text-sm"><AlertTriangle size={16} /> Calories ≠ complete nutrition</div>
        <p className="mt-1.5 text-sm text-ink-600">
          Meeting the calorie target does <b>not</b> mean the diet is nutritionally complete. Golden's base must be a
          <b> complete &amp; balanced large-breed puppy food</b>. Household foods are toppers or treats — not the main diet.
        </p>
        <div className="mt-3 rounded-2xl bg-white/70 p-3 text-sm">
          <div className="font-semibold text-ink-700">🚫 Do NOT add calcium just because this is a puppy.</div>
          <p className="text-xs text-ink-500 mt-1">
            On a complete puppy food, routine calcium / phosphorus / vitamin D / multivitamins are usually unnecessary and can be
            harmful for large-breed pups. Add supplements only if your vet specifically advises it. (Merck)
          </p>
        </div>
      </div>

      {/* Treat budget (spec §12) */}
      <Card>
        <SectionTitle>Today's treats</SectionTitle>
        <div className="flex items-center justify-between">
          <div><div className="stat-num text-2xl">{Math.round(d.treatKcalToday)}<span className="text-sm font-normal text-ink-400"> kcal</span></div>
            <div className="text-xs text-ink-400">of ~{Math.round(d.treatBudget.value)} kcal budget (≤{plan.treatBudgetPct}%)</div></div>
          <div className="text-right"><div className="text-lg font-semibold text-moss-600 tnum">{Math.max(0, Math.round(d.treatBudget.value - d.treatKcalToday))}</div><div className="text-xs text-ink-400">kcal left</div></div>
        </div>
        <div className="mt-2 h-2.5 rounded-full bg-cream-100 overflow-hidden">
          <div className={cn('h-full rounded-full', d.treatKcalToday > d.treatBudget.value ? 'bg-red-400' : 'bg-gold-400')}
            style={{ width: `${Math.min(100, (d.treatKcalToday / (d.treatBudget.value || 1)) * 100)}%` }} />
        </div>
        <WhyThis formula={d.treatBudget.formula} basis={d.treatBudget.basis} assumptions={d.treatBudget.assumptions} limitations={d.treatBudget.limitations} />
      </Card>

      {/* Food safety database (spec §13) */}
      <SectionTitle right={<button onClick={() => setFoodOpen(true)} className="text-xs font-semibold text-gold-600 mb-2">Open full list</button>}>Food safety</SectionTitle>
      <FoodSafetyPreview foods={data.foods} onOpen={() => setFoodOpen(true)} />

      <div className="h-2" />

      <StandardDietSheet open={editOpen} onClose={() => setEditOpen(false)} data={data} />
      <FoodDatabaseSheet open={foodOpen} onClose={() => setFoodOpen(false)} foods={data.foods} />
    </div>
  );
}

function FoodSafetyPreview({ foods, onOpen }: { foods: Food[]; onOpen: () => void }) {
  const toxic = foods.filter((f) => f.safety === 'toxic').slice(0, 4);
  return (
    <Card onClick={onOpen}>
      <div className="flex items-center gap-2 text-red-600 text-sm font-semibold"><AlertTriangle size={15} /> Keep these away from Golden</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {toxic.map((f) => <Pill key={f.id} className="bg-red-100 text-red-700">{f.name}</Pill>)}
      </div>
      <p className="mt-2 text-xs text-ink-400">Tap to search any Indian-kitchen food for puppy safety →</p>
    </Card>
  );
}

// ---- Standard diet editor (spec §10) ---------------------------------------
function StandardDietSheet({ open, onClose, data }: { open: boolean; onClose: () => void; data: ReturnType<typeof useData> }) {
  const toast = useToast();
  const plan = data.plan!;
  const d = data.derived!;
  const [primaryId, setPrimaryId] = useState(plan.primaryFoodId);
  const [kcalPerKg, setKcalPerKg] = useState(data.foodMap[plan.primaryFoodId]?.kcalPerKg ?? 3700);
  const [meals, setMeals] = useState(plan.mealsPerDay);
  const [treatPct, setTreatPct] = useState(plan.treatBudgetPct);
  const [autoScale, setAutoScale] = useState(plan.autoScaleWithGrowth);
  const [manualGrams, setManualGrams] = useState<number | null>(null);

  const primaries = data.foods.filter((f) => f.category === 'primary-complete');
  const foodKcalTarget = d.energy.value - Math.round(d.treatBudget.value * 0.5);
  const autoGrams = calculateFoodGrams(foodKcalTarget, { ...data.foodMap[primaryId], kcalPerKg } as Food).value;
  const totalGrams = manualGrams ?? autoGrams;
  const timeHints = meals === 3 ? ['07:30', '13:00', '19:00'] : meals === 4 ? ['07:00', '12:00', '16:00', '20:00'] : ['08:00', '19:00'];
  const slots = meals === 3 ? ['breakfast', 'lunch', 'dinner'] : meals === 4 ? ['breakfast', 'lunch', 'snack', 'dinner'] : ['breakfast', 'dinner'];
  const alloc = calculateMealAllocation(totalGrams, meals);

  function save() {
    const food = { ...data.foodMap[primaryId], kcalPerKg };
    const newPlan: DietPlan = {
      ...plan, primaryFoodId: primaryId, mealsPerDay: meals, treatBudgetPct: treatPct,
      autoScaleWithGrowth: autoScale, energyTargetKcal: d.energy.value, updatedAt: new Date().toISOString(),
      meals: slots.map((slot, i) => ({
        slot: slot as any, label: slot[0].toUpperCase() + slot.slice(1), timeHint: timeHints[i],
        components: [{ foodId: primaryId, grams: alloc[i], auto: manualGrams == null }],
      })),
    };
    // persist edited kcal on the food too
    saveDietPlan(newPlan);
    saveFood(food as Food);
    updateSettings({ mealsPerDay: meals });
    updateDog({ currentFoodId: primaryId });
    toast('Standard diet saved for the whole family', '✅');
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Set our standard diet">
      <p className="text-sm text-ink-400 -mt-1 mb-4">Configure once. The family just follows it — and the app re-scales grams as Golden grows.</p>

      <label className="block mb-3">
        <span className="text-sm font-semibold">Primary complete food</span>
        <select value={primaryId} onChange={(e) => { setPrimaryId(e.target.value); setKcalPerKg(data.foodMap[e.target.value]?.kcalPerKg ?? 3700); }}
          className="mt-1 w-full rounded-2xl border border-cream-200 bg-white px-3 py-3 text-sm">
          {primaries.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </label>

      <label className="block mb-3">
        <span className="text-sm font-semibold">Label energy (kcal/kg from your bag)</span>
        <input type="number" inputMode="numeric" value={kcalPerKg} onChange={(e) => setKcalPerKg(+e.target.value)}
          className="mt-1 w-full rounded-2xl border border-cream-200 bg-white px-4 py-3 text-lg tnum" />
        <span className="text-xs text-ink-400">Enter the value printed on the packaging for accurate grams.</span>
      </label>

      <div className="mb-3">
        <span className="text-sm font-semibold">Meals per day</span>
        <div className="mt-1 flex gap-2">
          {[2, 3, 4].map((n) => (
            <button key={n} onClick={() => setMeals(n)} className={cn('flex-1 rounded-2xl border py-2.5 text-sm font-semibold', meals === n ? 'border-gold-300 bg-gold-50 text-gold-700' : 'border-cream-200')}>{n}</button>
          ))}
        </div>
        <span className="text-xs text-ink-400">Suggested for {d.stage.label}: {d.stage.recommendedMeals} meals.</span>
      </div>

      <div className="rounded-2xl bg-cream-100 p-3 mb-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">Daily total</span>
          <span className="tnum text-lg font-semibold">{totalGrams} g</span>
        </div>
        <div className="mt-2 space-y-1.5">
          {slots.map((s, i) => (
            <div key={s} className="flex items-center justify-between text-sm">
              <span className="capitalize text-ink-500">{s} · {timeHints[i]}</span>
              <span className="tnum font-medium">{alloc[i]} g</span>
            </div>
          ))}
        </div>
        {manualGrams != null
          ? <button onClick={() => setManualGrams(null)} className="mt-2 text-xs text-gold-600 font-semibold">↺ Back to auto-calculated ({autoGrams} g)</button>
          : <button onClick={() => setManualGrams(autoGrams)} className="mt-2 text-xs text-gold-600 font-semibold">Set grams manually</button>}
        {manualGrams != null && (
          <input type="number" value={manualGrams} onChange={(e) => setManualGrams(+e.target.value)}
            className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-3 py-2 text-sm tnum" />
        )}
      </div>

      <label className="block mb-3">
        <span className="text-sm font-semibold">Treat budget: {treatPct}% of daily calories</span>
        <input type="range" min={0} max={15} value={treatPct} onChange={(e) => setTreatPct(+e.target.value)} className="mt-2 w-full accent-gold-500" />
      </label>

      <label className="flex items-center justify-between rounded-2xl border border-cream-200 p-3 mb-4">
        <div><div className="text-sm font-semibold">Auto-scale with growth</div><div className="text-xs text-ink-400">Recalculate grams as weight increases</div></div>
        <input type="checkbox" checked={autoScale} onChange={(e) => setAutoScale(e.target.checked)} className="h-5 w-5 accent-gold-500" />
      </label>

      <Button className="w-full" onClick={save}>Lock in standard diet</Button>
    </Sheet>
  );
}

// ---- Full food database (spec §13, §31) ------------------------------------
function FoodDatabaseSheet({ open, onClose, foods }: { open: boolean; onClose: () => void; foods: Food[] }) {
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState<Food | null>(null);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = s ? foods.filter((f) => f.name.toLowerCase().includes(s)) : foods;
    const order: Food['safety'][] = ['toxic', 'avoid', 'occasional', 'ok'];
    return [...list].sort((a, b) => order.indexOf(a.safety) - order.indexOf(b.safety));
  }, [foods, q]);

  return (
    <Sheet open={open} onClose={onClose} title="Food safety database">
      <div className="sticky -top-0 z-10">
        <div className="flex items-center gap-2 rounded-2xl border border-cream-200 bg-white px-3 py-2.5 mb-3">
          <Search size={17} className="text-ink-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search onion, curd, paneer, grapes…"
            className="flex-1 bg-transparent text-sm outline-none" />
        </div>
      </div>
      <div className="space-y-2">
        {filtered.map((f) => {
          const meta = SAFETY_META[f.safety];
          return (
            <button key={f.id} onClick={() => setDetail(f)} className="btn-press w-full text-left rounded-2xl border border-cream-200 bg-white p-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm flex items-center gap-2">{f.name} {f.indian && <span className="text-[10px] text-ink-400">🇮🇳</span>}</div>
                <span className={cn('pill', meta.className)}>{meta.short}</span>
              </div>
              <div className="text-xs text-ink-400 mt-0.5">{CATEGORY_META[f.category].label}{f.kcalPerKg ? ` · ${f.kcalPerKg} kcal/kg` : ''}</div>
            </button>
          );
        })}
        {filtered.length === 0 && <div className="text-center text-sm text-ink-400 py-8">No match. When in doubt, don't feed it — ask your vet.</div>}
      </div>

      <Sheet open={!!detail} onClose={() => setDetail(null)} title={detail?.name}>
        {detail && <FoodDetail food={detail} />}
      </Sheet>
    </Sheet>
  );
}

function FoodDetail({ food }: { food: Food }) {
  const meta = SAFETY_META[food.safety];
  const rows: [string, string | undefined][] = [
    ['Category', CATEGORY_META[food.category].label],
    ['Energy', food.kcalPerKg ? `${food.kcalPerKg} kcal/kg` : undefined],
    ['Protein', food.proteinPct != null ? `${food.proteinPct}%` : undefined],
    ['Fat', food.fatPct != null ? `${food.fatPct}%` : undefined],
    ['Max share of diet', food.maxContributionPct != null ? `${food.maxContributionPct}%` : undefined],
    ['Serving', food.servingNote],
    ['Preparation', food.preparation],
    ['Suitable age', food.suitableAge],
  ];
  return (
    <div>
      <span className={cn('pill mb-3', meta.className)}>{meta.label}</span>
      {food.safetyNotes && (
        <div className={cn('rounded-2xl p-3 text-sm mb-3', food.safety === 'toxic' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-cream-100 text-ink-600')}>
          {food.safetyNotes}
        </div>
      )}
      <div className="rounded-2xl border border-cream-200 divide-y divide-cream-200 overflow-hidden">
        {rows.filter(([, v]) => v).map(([k, v]) => (
          <div key={k} className="flex items-center justify-between px-3 py-2 text-sm"><span className="text-ink-400">{k}</span><span className="font-medium text-right">{v}</span></div>
        ))}
      </div>
      {food.source && <p className="mt-2 text-xs text-ink-400">Basis: {food.source === 'manufacturer' ? 'Manufacturer feeding guide' : food.source}</p>}
      <p className="mt-1 text-[11px] text-ink-400">Nutrient values, where shown, are typical estimates for portioning — not a lab analysis of your exact product.</p>
    </div>
  );
}
