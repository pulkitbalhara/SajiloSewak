import { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, Check, RotateCcw, Moon } from 'lucide-react';
import { useData } from '@/hooks/useData';
import { Card, SectionTitle, Button, useToast, cn, Pill } from '@/components/ui';
import { logTrainingSession, logBehavior, startRest, endRest } from '@/db/actions';
import { TRAINING_SKILLS, skillsForAge } from '@/data/trainingSkills';
import { BEHAVIOR_META, behaviorInsights } from '@/services/insights';
import type { BehaviorType, SkillCategory } from '@/types';

const CAT_LABEL: Record<SkillCategory, string> = {
  foundation: 'Foundation', manners: 'Household manners', behaviour: 'Puppy behaviour', socialization: 'Socialization',
};
const LEVELS = ['Not started', 'Learning', 'Reliable', 'Mastered'];

export default function Train() {
  const data = useData();
  if (data.loading || !data.derived) return <div className="py-20 text-center text-ink-400">Loading…</div>;
  const d = data.derived;

  return (
    <div className="space-y-4 pt-1">
      <div className="px-1">
        <h1 className="text-2xl font-semibold tracking-tight">Train</h1>
        <p className="text-sm text-ink-400">Reward-based only · {d.stage.trainingMinutes} min/day · evolves with age</p>
      </div>

      <TodaySession data={data} />
      <RestCoach data={data} />
      <BehaviorTracker data={data} />
      <SkillProgress data={data} />

      {/* Positive-methods note (spec §19) */}
      <div className="rounded-2xl bg-moss-500/10 border border-moss-500/20 p-3 text-xs text-moss-600">
        <b>We only use kind, reward-based methods.</b> No hitting, yelling, alpha-rolls, or fear. Rewarding the behaviour you
        want is safer and works better (AVSAB).
      </div>
      <div className="h-2" />
    </div>
  );
}

// ---- Today's session with timer (spec §20) ---------------------------------
function TodaySession({ data }: { data: ReturnType<typeof useData> }) {
  const toast = useToast();
  const d = data.derived!;
  const weeks = d.age.weeks;

  // choose 5 age-appropriate skills, prioritising least-practised
  const plan = useMemo(() => {
    const avail = skillsForAge(weeks);
    const progById: Record<string, number> = {};
    data.skillProgress.forEach((p) => (progById[p.skillId] = p.level));
    const sorted = [...avail].sort((a, b) => (progById[a.id] ?? 0) - (progById[b.id] ?? 0));
    const foundation = sorted.filter((s) => s.category === 'foundation').slice(0, 3);
    const rest = sorted.filter((s) => s.category !== 'foundation').slice(0, 2);
    const picks = [...foundation, ...rest].slice(0, 5);
    return picks.map((s) => ({ ...s, minutes: 2 }));
  }, [weeks, data.skillProgress]);

  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState((plan[0]?.minutes ?? 2) * 60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState<boolean[]>(() => plan.map(() => false));
  const timer = useRef<number>();

  useEffect(() => {
    if (running) {
      timer.current = window.setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) { advance(); return 0; }
          return r - 1;
        });
      }, 1000);
      return () => clearInterval(timer.current);
    }
  }, [running, idx]);

  function advance() {
    clearInterval(timer.current);
    setDone((ds) => ds.map((v, i) => (i === idx ? true : v)));
    if (idx < plan.length - 1) {
      const ni = idx + 1;
      setIdx(ni); setRemaining(plan[ni].minutes * 60);
    } else {
      setRunning(false); finish();
    }
  }
  function finish() {
    const total = plan.reduce((a, s) => a + s.minutes, 0);
    logTrainingSession(total, plan.map((s) => s.id));
    toast(`Nice! ${total}-minute session logged 🎓`, '⭐');
  }
  function reset() { setIdx(0); setRemaining((plan[0]?.minutes ?? 2) * 60); setRunning(false); setDone(plan.map(() => false)); }

  const allDone = done.every(Boolean);
  const current = plan[idx];
  const totalMin = plan.reduce((a, s) => a + s.minutes, 0);

  return (
    <Card>
      <SectionTitle right={<Pill className="bg-gold-100 text-gold-700 mb-2">{totalMin} min</Pill>}>Today's session</SectionTitle>
      {/* current skill hero */}
      {!allDone && current && (
        <div className="rounded-2xl bg-gradient-to-br from-moss-500/15 to-gold-50 p-4 mb-3">
          <div className="text-xs text-ink-400">Step {idx + 1} of {plan.length}</div>
          <div className="text-xl font-semibold mt-0.5">{current.name}</div>
          <div className="text-xs text-ink-500 mt-1">{current.method}</div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-4xl font-semibold tnum">{fmtTime(remaining)}</div>
            <div className="flex gap-2">
              {!running
                ? <Button variant="primary" onClick={() => setRunning(true)}><Play size={16} className="inline -mt-0.5" /> {idx === 0 && remaining === current.minutes * 60 ? 'Start' : 'Resume'}</Button>
                : <Button variant="soft" onClick={() => setRunning(false)}><Pause size={16} className="inline -mt-0.5" /> Pause</Button>}
              <Button variant="ghost" onClick={advance}><Check size={16} className="inline -mt-0.5" /> Done</Button>
            </div>
          </div>
        </div>
      )}
      {allDone && (
        <div className="rounded-2xl bg-moss-500/10 p-4 mb-3 text-center">
          <div className="text-3xl">🎉</div>
          <div className="font-semibold text-moss-600 mt-1">Session complete!</div>
          <button onClick={reset} className="mt-2 text-xs text-gold-600 font-semibold flex items-center gap-1 mx-auto"><RotateCcw size={12} /> Run again</button>
        </div>
      )}
      {/* steps list */}
      <div className="space-y-1.5">
        {plan.map((s, i) => (
          <div key={s.id} className={cn('flex items-center gap-3 rounded-xl px-3 py-2', i === idx && !allDone ? 'bg-gold-50' : '')}>
            <span className={cn('grid h-6 w-6 place-items-center rounded-full text-xs font-semibold',
              done[i] ? 'bg-moss-500 text-white' : 'bg-cream-100 text-ink-400')}>{done[i] ? <Check size={13} /> : i + 1}</span>
            <span className="text-sm flex-1 font-medium">{s.name}</span>
            <span className="text-xs text-ink-400">{s.minutes} min</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---- Rest coach (spec §22) -------------------------------------------------
function RestCoach({ data }: { data: ReturnType<typeof useData> }) {
  const toast = useToast();
  const d = data.derived!;
  const active = d.activeRest;
  const todayRests = data.rests.filter((r) => { const s = new Date(); s.setHours(0, 0, 0, 0); return +new Date(r.start) >= +s; });
  const napHours = todayRests.filter((r) => r.end).reduce((a, r) => a + (+new Date(r.end!) - +new Date(r.start)) / 3600000, 0);

  return (
    <Card>
      <SectionTitle>Rest coach</SectionTitle>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-ink-500">{active ? 'Currently resting 😴' : 'Awake & active'}</div>
          <div className="text-xs text-ink-400 mt-0.5">~{napHours.toFixed(1)}h napped today · puppies need a lot of sleep</div>
        </div>
        {active
          ? <Button variant="soft" onClick={() => { endRest(); toast('Nap ended'); }}>End nap</Button>
          : <Button variant="soft" onClick={() => { startRest(); toast('Nap started 😴'); }}><Moon size={15} className="inline -mt-0.5" /> Nap start</Button>}
      </div>
      <p className="mt-2 text-xs text-ink-400">After a very active or bitey spell, a quiet nap usually settles a puppy far better than more play.</p>
    </Card>
  );
}

// ---- Behavior tracker (spec §21) -------------------------------------------
const BEHAVIOR_ORDER: BehaviorType[] = ['biting', 'barking', 'jumping', 'chewing', 'whining', 'pulling', 'stealing', 'guarding', 'calm', 'good-response'];

function BehaviorTracker({ data }: { data: ReturnType<typeof useData> }) {
  const toast = useToast();
  const insights = useMemo(() => behaviorInsights(data.behaviors), [data.behaviors]);
  return (
    <Card>
      <SectionTitle>Behaviour log</SectionTitle>
      <p className="text-xs text-ink-400 -mt-1 mb-2">One tap. Builds patterns — an observation, not a diagnosis.</p>
      <div className="grid grid-cols-5 gap-1.5">
        {BEHAVIOR_ORDER.map((t) => {
          const m = BEHAVIOR_META[t];
          return (
            <button key={t} onClick={() => { logBehavior(t); toast(`${m.label} logged`, m.emoji); }}
              className={cn('btn-press rounded-2xl border p-2 flex flex-col items-center gap-0.5',
                m.positive ? 'border-moss-500/25 bg-moss-500/5' : 'border-cream-200 bg-white')}>
              <span className="text-lg">{m.emoji}</span>
              <span className="text-[9px] font-medium leading-tight text-center text-ink-500">{m.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 space-y-1.5">
        {insights.map((ins, i) => (
          <div key={i} className="rounded-xl bg-cream-100 px-3 py-2 text-xs text-ink-600">💡 {ins}</div>
        ))}
      </div>
    </Card>
  );
}

// ---- Skill progress --------------------------------------------------------
function SkillProgress({ data }: { data: ReturnType<typeof useData> }) {
  const d = data.derived!;
  const progById: Record<string, number> = {};
  data.skillProgress.forEach((p) => (progById[p.skillId] = p.level));
  const cats: SkillCategory[] = ['foundation', 'manners', 'behaviour', 'socialization'];
  return (
    <div>
      <SectionTitle>Skill progress</SectionTitle>
      <div className="space-y-3">
        {cats.map((cat) => {
          const skills = TRAINING_SKILLS.filter((s) => s.category === cat);
          return (
            <Card key={cat}>
              <div className="text-[13px] font-semibold mb-2">{CAT_LABEL[cat]}</div>
              <div className="space-y-2">
                {skills.map((s) => {
                  const lvl = progById[s.id] ?? 0;
                  const locked = d.age.weeks < s.minWeeks;
                  return (
                    <div key={s.id} className={cn('flex items-center gap-2', locked && 'opacity-40')}>
                      <span className="text-sm flex-1">{s.name}{locked && <span className="text-[10px] text-ink-400"> · from {s.minWeeks}w</span>}</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3].map((n) => (
                          <span key={n} className={cn('h-1.5 w-6 rounded-full', lvl >= n ? 'bg-gold-400' : 'bg-cream-200')} />
                        ))}
                      </div>
                      <span className="text-[10px] text-ink-400 w-14 text-right">{LEVELS[lvl]}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function fmtTime(s: number) { const m = Math.floor(s / 60); const ss = s % 60; return `${m}:${String(ss).padStart(2, '0')}`; }
