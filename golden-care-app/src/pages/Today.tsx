import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Check, Utensils, Droplet, Dog as DogIcon, GraduationCap, Gamepad2,
  Moon, Pill, Scale, ChevronRight, CheckCircle2, Circle, Clock,
} from 'lucide-react';
import { useData } from '@/hooks/useData';
import { useToast, Card, Ring, SectionTitle, BigButton, Sheet, Button, Pill as UIPill, cn } from '@/components/ui';
import {
  logFeeding, logWater, logPotty, logTreat, startRest, endRest,
} from '@/db/actions';
import { buildAlerts } from '@/services/alerts';
import { periodOf, type Period, type TodayStep } from '@/services/today';
import { TREAT_OPTIONS } from '@/data/foods';
import type { MealSlot } from '@/types';
import { PottySheet } from '@/components/sheets/PottySheet';
import { WeeklyCheckSheet } from '@/components/sheets/WeeklyCheckSheet';

const ACTIVITY_ICON: Record<string, any> = {
  wake: DogIcon, potty: DogIcon, breakfast: Utensils, lunch: Utensils, dinner: Utensils,
  play: Gamepad2, training: GraduationCap, rest: Moon, calm: Moon, water: Droplet, bed: Moon,
};

export default function Today() {
  const data = useData();
  const toast = useToast();
  const nav = useNavigate();
  const [feedOpen, setFeedOpen] = useState(false);
  const [treatOpen, setTreatOpen] = useState(false);
  const [pottyOpen, setPottyOpen] = useState(false);
  const [weeklyOpen, setWeeklyOpen] = useState(false);

  if (data.loading || !data.derived || !data.dog) {
    return <div className="py-20 text-center text-ink-400">Loading…</div>;
  }
  const d = data.derived;
  const dog = data.dog;
  const simple = data.settings?.mode === 'simple';

  const planTimes = data.plan!.meals.map((m) => m.timeHint);
  const alerts = buildAlerts({
    feedings: data.feedings, memberName: data.memberName,
    treatKcalToday: d.treatKcalToday, treatBudget: d.treatBudget.value,
    mealsPlanned: d.mealsPlanned, planTimes, reminders: data.reminders,
    settings: data.settings!, primaryFood: data.foodMap[data.plan!.primaryFoodId],
  });

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  // ---- complete the NEXT step -------------------------------------------
  function completeStep(step: TodayStep) {
    switch (step.activity) {
      case 'breakfast': case 'lunch': case 'dinner': {
        const slot = step.linkedSlot as MealSlot;
        const meal = data.plan!.meals.find((m) => m.slot === slot);
        const grams = meal?.components.reduce((a, c) => a + c.grams, 0);
        const kcal = meal?.components.reduce((a, c) => {
          const f = data.foodMap[c.foodId]; return a + (f ? (c.grams / 1000) * f.kcalPerKg : 0);
        }, 0);
        logFeeding(slot, step.title, grams, kcal ? Math.round(kcal) : undefined);
        toast(`${cap(slot)} done — great!`, '🍽️');
        break;
      }
      case 'potty':
        setPottyOpen(true); break;
      case 'training':
        nav('/train'); break;
      case 'water':
        logWater(); toast('Water refreshed', '💧'); break;
      case 'rest': case 'calm':
        startRest(); toast('Rest started', '😴'); break;
      default:
        toast('Done ✓');
    }
  }

  // ---- checklist grouping -----------------------------------------------
  const periods: Period[] = ['Morning', 'Afternoon', 'Evening', 'Night'];
  const byPeriod = ((): Record<Period, TodayStep[]> => {
    const map: Record<Period, TodayStep[]> = { Morning: [], Afternoon: [], Evening: [], Night: [] };
    d.today.steps.forEach((s) => map[periodOf(s)].push(s));
    return map;
  })();

  const next = d.today.next;
  const NextIcon = next ? ACTIVITY_ICON[next.activity] ?? Clock : Clock;

  return (
    <div className="space-y-4 pt-1">
      {/* Greeting */}
      <div className="px-1">
        <h1 className="text-2xl font-semibold tracking-tight">{greeting}</h1>
        <p className="text-sm text-ink-400">
          {dog.name} is {d.age.label} old · {d.stage.label} · a lean, growing pup 🌱
        </p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(0, 3).map((a) => (
            <div key={a.id} className={cn('flex items-start gap-3 rounded-2xl border p-3 text-sm animate-pop',
              a.level === 'warn' ? 'bg-gold-50 border-gold-200 text-gold-700'
                : a.level === 'urgent' ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-cream-100 border-cream-200 text-ink-600')}>
              <span className="text-lg leading-none mt-0.5">{a.icon}</span>
              <div><div className="font-semibold">{a.title}</div><div className="opacity-80 text-[13px]">{a.detail}</div></div>
            </div>
          ))}
        </div>
      )}

      {/* NEXT ACTION — the hero (spec §2) */}
      <div className="rounded-3xl bg-gradient-to-br from-gold-400 to-gold-500 p-5 text-white shadow-pop">
        <div className="flex items-center gap-2 text-gold-50/90 text-xs font-semibold uppercase tracking-wider">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20"><Clock size={12} /></span>
          Next for {dog.name}
        </div>
        {next ? (
          <>
            <div className="mt-2 flex items-end justify-between">
              <div>
                <div className="text-4xl font-semibold tracking-tight tnum">{fmt12(next.time)}</div>
                <div className="mt-1 flex items-center gap-2 text-lg font-medium">
                  <NextIcon size={20} /> {next.title}
                </div>
              </div>
            </div>
            {next.detail && <p className="mt-2 text-sm text-gold-50/90">{next.detail}</p>}
            <button onClick={() => completeStep(next)}
              className="btn-press mt-4 w-full rounded-2xl bg-white/95 py-3.5 text-gold-700 font-semibold flex items-center justify-center gap-2">
              <Check size={19} strokeWidth={2.6} /> DONE
            </button>
          </>
        ) : (
          <div className="mt-3 text-lg font-medium">All done for today — nice work! 🌙</div>
        )}
        {/* Up next preview */}
        <UpNext steps={d.today.steps} />
      </div>

      {/* Quick actions (spec §4 Simple mode) */}
      <div>
        <SectionTitle>Quick actions</SectionTitle>
        <div className="grid grid-cols-4 gap-2.5">
          <BigButton emoji="🍽️" label="Feed" onClick={() => setFeedOpen(true)} />
          <BigButton emoji="💧" label="Water" tone="neutral" onClick={() => { logWater(); toast('Water refreshed', '💧'); }} />
          <BigButton emoji="🐕" label="Potty" tone="moss" onClick={() => setPottyOpen(true)} />
          <BigButton emoji="🎓" label="Train" tone="neutral" onClick={() => nav('/train')} />
          <BigButton emoji="🎾" label="Play" tone="neutral" onClick={() => toast('Play time! Have fun 🎾')} />
          <BigButton emoji="😴" label={d.activeRest ? 'End rest' : 'Rest'} tone="neutral"
            onClick={() => { if (d.activeRest) { endRest(); toast('Rest ended'); } else { startRest(); toast('Resting 😴'); } }} />
          <BigButton emoji="💊" label="Medicine" tone="neutral" onClick={() => nav('/health')} />
          <BigButton emoji="⚖️" label="Weigh" tone="neutral" onClick={() => setWeeklyOpen(true)} />
        </div>
        <button onClick={() => setTreatOpen(true)}
          className="btn-press mt-2.5 w-full rounded-2xl border border-cream-200 bg-white p-3 flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-medium"><span>🦴</span> Give a treat</span>
          <span className="text-xs text-ink-400">
            {Math.round(d.treatKcalToday)} / {Math.round(d.treatBudget.value)} kcal used
          </span>
        </button>
      </div>

      {/* Dashboard grid (spec §5) */}
      <SectionTitle>Golden's day</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        {/* Food */}
        <Card onClick={() => nav('/diet')}>
          <MiniHead icon={<Utensils size={15} />} title="Food" />
          <div className="mt-1 flex items-center gap-3">
            <Ring value={d.mealsCompleted} max={d.mealsPlanned} size={54} color="#C9861E">
              <span className="text-sm font-semibold tnum">{d.mealsCompleted}/{d.mealsPlanned}</span>
            </Ring>
            <div className="text-xs text-ink-400 leading-tight">
              meals given<br />today
            </div>
          </div>
        </Card>
        {/* Calories */}
        <Card onClick={() => nav('/diet')}>
          <MiniHead icon={<span className="text-[13px]">🔥</span>} title="Energy" />
          <div className="mt-1">
            <div className="stat-num">{d.consumedKcal}<span className="text-sm font-normal text-ink-400"> kcal</span></div>
            <div className="text-xs text-ink-400">of ~{d.energy.value} target · {d.remainingKcal} left</div>
          </div>
        </Card>
        {/* Potty */}
        <Card onClick={() => setPottyOpen(true)}>
          <MiniHead icon={<DogIcon size={15} />} title="Potty" />
          <div className="mt-1 text-xs text-ink-500 space-y-0.5">
            <div>Last pee: <b>{d.lastPee ? fmtAgo(d.lastPee.at) : '—'}</b></div>
            <div>Last poop: <b>{d.lastPoop ? fmtAgo(d.lastPoop.at) : '—'}</b></div>
            <div className="text-gold-600 font-medium mt-1">{d.pottyWindow.message}</div>
          </div>
        </Card>
        {/* Training */}
        <Card onClick={() => nav('/train')}>
          <MiniHead icon={<GraduationCap size={15} />} title="Training" />
          <div className="mt-1 flex items-center gap-3">
            <Ring value={d.trainedTodayMin} max={d.trainingTarget} size={54} color="#5E9450" track="#E3EEDD">
              <span className="text-xs font-semibold tnum">{d.trainedTodayMin}m</span>
            </Ring>
            <div className="text-xs text-ink-400 leading-tight">of {d.trainingTarget} min<br />today</div>
          </div>
        </Card>
        {/* Growth */}
        <Card onClick={() => nav('/grow')}>
          <MiniHead icon={<Scale size={15} />} title="Growth" />
          <div className="mt-1">
            <div className="stat-num">{dog.weightKg}<span className="text-sm font-normal text-ink-400"> kg</span></div>
            <div className="text-xs text-ink-400">
              {d.weightChange.deltaKg != null
                ? <>{d.weightChange.deltaKg >= 0 ? '+' : ''}{d.weightChange.deltaKg} kg vs last check</>
                : 'first weigh-in'}
            </div>
          </div>
        </Card>
        {/* Rest */}
        <Card>
          <MiniHead icon={<Moon size={15} />} title="Rest" />
          <div className="mt-1">
            {d.activeRest
              ? <><div className="text-lg font-semibold text-moss-600">Resting 😴</div><div className="text-xs text-ink-400">since {fmt12t(d.activeRest.start)}</div></>
              : <><div className="text-lg font-semibold">Active</div><div className="text-xs text-ink-400">tap Rest when winding down</div></>}
          </div>
        </Card>
      </div>

      {/* Today's status (spec §5) */}
      <StatusStrip data={data} alertsCount={alerts.length} />

      {/* Daily checklist (spec §28) */}
      <SectionTitle>Today's checklist</SectionTitle>
      <Card className="p-0 overflow-hidden">
        {periods.map((p) => byPeriod[p].length > 0 && (
          <div key={p} className="border-b border-cream-200/70 last:border-0">
            <div className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-400">{p}</div>
            <div className="pb-1">
              {byPeriod[p].map((s) => {
                const Icon = ACTIVITY_ICON[s.activity] ?? Circle;
                return (
                  <div key={s.id} className={cn('flex items-center gap-3 px-4 py-2', s.isNext && 'bg-gold-50/60')}>
                    {s.done ? <CheckCircle2 size={19} className="text-moss-500 shrink-0" />
                      : <Circle size={19} className={cn('shrink-0', s.isNext ? 'text-gold-500' : 'text-cream-200')} />}
                    <span className="text-xs tnum text-ink-400 w-12">{fmt12(s.time)}</span>
                    <Icon size={15} className="text-ink-400 shrink-0" />
                    <span className={cn('text-sm flex-1', s.done ? 'text-ink-400 line-through' : 'font-medium')}>{s.title}</span>
                    {s.doneBy && <span className="text-[11px] text-ink-400">{s.doneBy}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </Card>

      <div className="h-2" />

      {/* Sheets */}
      <FeedSheet open={feedOpen} onClose={() => setFeedOpen(false)} data={data} />
      <TreatSheet open={treatOpen} onClose={() => setTreatOpen(false)} data={data} />
      <PottySheet open={pottyOpen} onClose={() => setPottyOpen(false)} />
      <WeeklyCheckSheet open={weeklyOpen} onClose={() => setWeeklyOpen(false)} data={data} />
    </div>
  );
}

// ---- sub components ---------------------------------------------------------
function MiniHead({ icon, title }: { icon: any; title: string }) {
  return <div className="flex items-center gap-1.5 text-ink-400"><span>{icon}</span><span className="text-[11px] font-semibold uppercase tracking-wider">{title}</span></div>;
}

function UpNext({ steps }: { steps: TodayStep[] }) {
  const upcoming = steps.filter((s) => !s.done).slice(0, 4).slice(1, 4);
  if (upcoming.length === 0) return null;
  return (
    <div className="mt-4 border-t border-white/20 pt-3 flex gap-4 overflow-x-auto no-scrollbar">
      {upcoming.map((s) => (
        <div key={s.id} className="shrink-0">
          <div className="text-[11px] text-gold-50/80 tnum">{fmt12(s.time)}</div>
          <div className="text-[13px] font-medium">{s.title}</div>
        </div>
      ))}
    </div>
  );
}

function StatusStrip({ data, alertsCount }: { data: ReturnType<typeof useData>; alertsCount: number }) {
  const d = data.derived!;
  const items = [
    { ok: d.mealsCompleted >= 1, label: d.mealsCompleted >= d.mealsPlanned ? 'All meals given' : 'Feeding on schedule' },
    { ok: true, label: 'Potty improving' },
    { ok: d.trainedTodayMin > 0, label: d.trainedTodayMin > 0 ? 'Training done' : 'Training pending', warn: d.trainedTodayMin === 0 },
    { ok: alertsCount === 0, label: alertsCount === 0 ? 'No alerts' : `${alertsCount} to check`, warn: alertsCount > 0 },
  ];
  return (
    <Card>
      <MiniHead icon={<span>📋</span>} title="Today's status" />
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className={cn('h-2.5 w-2.5 rounded-full', it.warn ? 'bg-amber2-500' : it.ok ? 'bg-moss-500' : 'bg-cream-200')} />
            <span className="text-ink-600">{it.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---- Feed sheet (with duplicate-feed prevention, spec §29) -----------------
function FeedSheet({ open, onClose, data }: { open: boolean; onClose: () => void; data: ReturnType<typeof useData> }) {
  const toast = useToast();
  const d = data.derived!;
  const startToday = (() => { const x = new Date(); x.setHours(0, 0, 0, 0); return +x; })();
  const todayFeed = data.feedings.filter((f) => +new Date(f.at) >= startToday);
  return (
    <Sheet open={open} onClose={onClose} title="Feed a meal">
      <p className="text-sm text-ink-400 -mt-1 mb-3">Tap the meal you're giving. Portions come from your standard diet.</p>
      <div className="space-y-2.5">
        {data.plan!.meals.map((meal) => {
          const grams = meal.components.reduce((a, c) => a + c.grams, 0);
          const already = todayFeed.find((f) => f.slot === meal.slot);
          const kcal = meal.components.reduce((a, c) => { const f = data.foodMap[c.foodId]; return a + (f ? (c.grams / 1000) * f.kcalPerKg : 0); }, 0);
          return (
            <div key={meal.slot} className={cn('rounded-2xl border p-3', already ? 'bg-moss-500/5 border-moss-500/25' : 'border-cream-200 bg-white')}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{meal.label} <span className="text-ink-400 font-normal text-sm">· {meal.timeHint}</span></div>
                  <div className="text-xs text-ink-400">{grams} g · ~{Math.round(kcal)} kcal</div>
                </div>
                {already ? (
                  <div className="text-right">
                    <div className="text-xs font-semibold text-moss-600 flex items-center gap-1"><Check size={14} /> Given</div>
                    <div className="text-[11px] text-ink-400">by {data.memberName(already.byMemberId)} · {fmt12t(already.at)}</div>
                  </div>
                ) : (
                  <Button variant="soft" onClick={() => { logFeeding(meal.slot, meal.label, grams, Math.round(kcal)); toast(`${meal.label} given — logged for everyone`, '🍽️'); onClose(); }}>
                    Feed
                  </Button>
                )}
              </div>
              {already && <div className="mt-2 text-[12px] text-moss-600 bg-moss-500/10 rounded-xl px-2.5 py-1.5">✓ Already given — no need to feed again.</div>}
            </div>
          );
        })}
        <div className="rounded-2xl border border-dashed border-cream-200 p-3 flex items-center justify-between">
          <div className="text-sm"><div className="font-medium">Small topper</div><div className="text-xs text-ink-400">e.g. a spoon of curd / pumpkin</div></div>
          <Button variant="ghost" onClick={() => { logFeeding('topper', 'Topper'); toast('Topper logged', '🥣'); onClose(); }}>Add</Button>
        </div>
      </div>
    </Sheet>
  );
}

// ---- Treat sheet (spec §12) ------------------------------------------------
function TreatSheet({ open, onClose, data }: { open: boolean; onClose: () => void; data: ReturnType<typeof useData> }) {
  const toast = useToast();
  const d = data.derived!;
  const remaining = Math.max(0, d.treatBudget.value - d.treatKcalToday);
  return (
    <Sheet open={open} onClose={onClose} title="Give a treat">
      <div className="rounded-2xl bg-gold-50 border border-gold-200 p-3 mb-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gold-700 font-semibold">Treat budget today</span>
          <span className="tnum text-gold-700">{Math.round(d.treatKcalToday)} / {Math.round(d.treatBudget.value)} kcal</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-gold-100 overflow-hidden">
          <div className="h-full bg-gold-400 rounded-full" style={{ width: `${Math.min(100, (d.treatKcalToday / (d.treatBudget.value || 1)) * 100)}%` }} />
        </div>
        <div className="mt-1 text-xs text-gold-700">{remaining} kcal left · keep treats ≤10% of daily calories.</div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {TREAT_OPTIONS.map((t) => {
          const over = t.kcal > remaining;
          return (
            <button key={t.id} onClick={() => { logTreat(t.name, t.kcal); toast(`${t.name} · ${t.kcal} kcal`, t.emoji); if (t.kcal > remaining) toast('Heads up: over today’s treat budget', '🦴'); onClose(); }}
              className={cn('btn-press rounded-2xl border p-3 text-left', over ? 'border-gold-200 bg-gold-50/50' : 'border-cream-200 bg-white')}>
              <div className="text-xl">{t.emoji}</div>
              <div className="mt-1 text-sm font-medium leading-tight">{t.name}</div>
              <div className="text-xs text-ink-400">{t.kcal} kcal{over ? ' · over budget' : ''}</div>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}

// ---- helpers ----------------------------------------------------------------
function cap(s: string) { return s[0].toUpperCase() + s.slice(1); }
function fmt12(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, '0')} ${ampm}`;
}
function fmt12t(iso: string) { return format(new Date(iso), 'h:mm a'); }
function fmtAgo(iso: string) {
  const mins = Math.round((Date.now() - +new Date(iso)) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return format(new Date(iso), 'MMM d');
}
