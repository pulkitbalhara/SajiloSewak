import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import { TrendingUp, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { useData } from '@/hooks/useData';
import { Card, SectionTitle, Button, WhyThis, cn } from '@/components/ui';
import { calculateGrowthVelocity, calculateWeightChange } from '@/services/calc';
import { calculateAge } from '@/services/age';
import { generateWeeklyReport } from '@/services/insights';
import { WeeklyCheckSheet } from '@/components/sheets/WeeklyCheckSheet';

export default function Grow() {
  const data = useData();
  const [checkOpen, setCheckOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  if (data.loading || !data.derived || !data.dog) return <div className="py-20 text-center text-ink-400">Loading…</div>;
  const dog = data.dog;

  const weightData = data.weights.map((w) => ({
    date: format(new Date(w.date), 'MMM d'),
    ageWk: +(calculateAge(dog.dob, new Date(w.date)).weeks).toFixed(1),
    kg: w.weightKg,
  }));

  const weeklyDelta = (() => {
    const out: { date: string; delta: number }[] = [];
    const s = [...data.weights].sort((a, b) => a.date.localeCompare(b.date));
    for (let i = 1; i < s.length; i++) out.push({ date: format(new Date(s[i].date), 'MMM d'), delta: +(s[i].weightKg - s[i - 1].weightKg).toFixed(2) });
    return out;
  })();

  const heightData = data.heights.map((h) => ({ ageWk: +(calculateAge(dog.dob, new Date(h.date)).weeks).toFixed(1), cm: h.heightCm }));
  const bcsData = data.bcs.map((b) => ({ date: format(new Date(b.date), 'MMM d'), score: b.score }));

  const velocity = calculateGrowthVelocity(data.weights);
  const change = calculateWeightChange(data.weights);

  return (
    <div className="space-y-4 pt-1">
      <div className="px-1 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Grow</h1>
          <p className="text-sm text-ink-400">Steady, lean growth — not maximum weight</p>
        </div>
        <Button variant="soft" onClick={() => setCheckOpen(true)}>+ Weekly check</Button>
      </div>

      {/* headline stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center"><div className="text-[11px] text-ink-400 uppercase tracking-wider">Weight</div><div className="stat-num mt-1">{dog.weightKg}</div><div className="text-xs text-ink-400">kg</div></Card>
        <Card className="text-center"><div className="text-[11px] text-ink-400 uppercase tracking-wider">Height</div><div className="stat-num mt-1">{dog.heightCm ?? '—'}</div><div className="text-xs text-ink-400">cm withers</div></Card>
        <Card className="text-center"><div className="text-[11px] text-ink-400 uppercase tracking-wider">Gain/wk</div><div className="stat-num mt-1 text-moss-600">{velocity.value != null ? `+${velocity.value}` : '—'}</div><div className="text-xs text-ink-400">kg/week</div></Card>
      </div>

      {/* trajectory analysis (spec §15 — analyse, don't prescribe a target) */}
      <Card>
        <div className="flex items-center gap-2 text-sm font-semibold"><TrendingUp size={16} className="text-moss-500" /> Growth trajectory</div>
        <p className="mt-1.5 text-sm text-ink-600">
          {change.deltaKg != null
            ? <>Golden gained <b>{change.deltaKg} kg</b> over the last {change.daysBetween} days ({velocity.value} kg/week). That's a
              {velocity.value != null && velocity.value <= 0.9 ? ' healthy, steady' : ' brisk'} pace for a large-breed puppy.</>
            : 'Add a second weekly weight to see the growth rate.'}
        </p>
        <p className="mt-1 text-xs text-ink-400">We look at the <b>trend</b>, not a single "correct" weight. Aim for steady gain with a lean body condition — rapid gain can strain growing joints.</p>
        <WhyThis formula={velocity.formula} basis={velocity.basis} assumptions={velocity.assumptions} limitations={velocity.limitations} />
      </Card>

      {/* Weight vs age */}
      <ChartCard title="Weight vs age">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={weightData} margin={{ top: 8, right: 10, bottom: 0, left: 4 }}>
            <CartesianGrid stroke="#F3ECD9" vertical={false} />
            <XAxis dataKey="ageWk" tick={{ fontSize: 10, fill: '#8A8175' }} tickLine={false} axisLine={false} unit="w" />
            <YAxis tick={{ fontSize: 10, fill: '#8A8175' }} tickLine={false} axisLine={false} width={38} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} kg`, 'Weight']} labelFormatter={(l) => `${l} weeks`} />
            <Line type="monotone" dataKey="kg" stroke="#C9861E" strokeWidth={3} dot={{ r: 3, fill: '#C9861E' }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Weekly change */}
      <ChartCard title="Weekly weight change">
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={weeklyDelta} margin={{ top: 8, right: 10, bottom: 0, left: 4 }}>
            <CartesianGrid stroke="#F3ECD9" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8A8175' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#8A8175' }} tickLine={false} axisLine={false} width={38} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`+${v} kg`, 'Gain']} />
            <Bar dataKey="delta" fill="#5E9450" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 gap-4">
        {/* Height */}
        <ChartCard title="Height vs age">
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={heightData} margin={{ top: 8, right: 10, bottom: 0, left: 4 }}>
              <CartesianGrid stroke="#F3ECD9" vertical={false} />
              <XAxis dataKey="ageWk" tick={{ fontSize: 10, fill: '#8A8175' }} tickLine={false} axisLine={false} unit="w" />
              <YAxis tick={{ fontSize: 10, fill: '#8A8175' }} tickLine={false} axisLine={false} width={38} domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} cm`, 'Height']} />
              <Line type="monotone" dataKey="cm" stroke="#A66A16" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* BCS */}
        <ChartCard title="Body condition score (target 4–5/9)">
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={bcsData} margin={{ top: 8, right: 10, bottom: 0, left: 4 }}>
              <CartesianGrid stroke="#F3ECD9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8A8175' }} tickLine={false} axisLine={false} />
              <YAxis domain={[1, 9]} ticks={[1, 3, 5, 7, 9]} tick={{ fontSize: 10, fill: '#8A8175' }} tickLine={false} axisLine={false} width={20} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}/9`, 'BCS']} />
              <Line type="monotone" dataKey="score" stroke="#B4685B" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Weekly report entry (spec §27) */}
      <button onClick={() => setReportOpen(true)}
        className="btn-press w-full rounded-3xl bg-gradient-to-br from-gold-400 to-gold-500 p-4 text-left text-white shadow-pop">
        <div className="flex items-center gap-2 text-sm font-semibold"><Sparkles size={16} /> Golden's week</div>
        <p className="text-sm text-gold-50/90 mt-1">See this week's growth, potty, training & behaviour report with plain-language insights and next steps.</p>
      </button>

      <div className="h-2" />
      <WeeklyCheckSheet open={checkOpen} onClose={() => setCheckOpen(false)} data={data} />
      {reportOpen && <WeeklyReportModal data={data} onClose={() => setReportOpen(false)} />}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <Card><SectionTitle>{title}</SectionTitle>{children}</Card>;
}
const tooltipStyle = { borderRadius: 14, border: '1px solid #F3ECD9', fontSize: 12, boxShadow: '0 8px 24px -12px rgba(42,37,30,0.2)' };

// ---- Weekly report (spec §27) ----------------------------------------------
function WeeklyReportModal({ data, onClose }: { data: ReturnType<typeof useData>; onClose: () => void }) {
  const d = data.derived!;
  const report = useMemo(() => generateWeeklyReport({
    weights: data.weights, heights: data.heights, bcs: data.bcs,
    feedings: data.feedings, plannedMeals: d.mealsPlanned, treats: data.treats,
    potty: data.potty, sessions: data.sessions, rests: data.rests, behaviors: data.behaviors,
  }), [data]);

  return (
    <div className="fixed inset-0 z-50 bg-cream-50 overflow-y-auto animate-fade">
      <div className="mx-auto max-w-md px-4 py-5 pb-24">
        <div className="flex items-center justify-between mb-4">
          <div><h2 className="text-2xl font-semibold">Golden's week</h2>
            <p className="text-sm text-ink-400">{format(report.from, 'MMM d')} – {format(report.to, 'MMM d')}</p></div>
          <button onClick={onClose} className="rounded-full bg-white border border-cream-200 px-4 py-2 text-sm font-semibold">Close</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ReportStat label="Weight" value={report.weight.start != null && report.weight.end != null ? `${report.weight.start} → ${report.weight.end} kg` : '—'} />
          <ReportStat label="Height" value={report.height.start != null && report.height.end != null ? `${report.height.start} → ${report.height.end} cm` : '—'} />
          <ReportStat label="Meals completed" value={`${report.meals.completed} / ${report.meals.planned}`} />
          <ReportStat label="Treat calories" value={`${report.treatKcal} kcal`} />
          <ReportStat label="Potty successes" value={`${report.potty.success}`} good />
          <ReportStat label="Accidents" value={`${report.potty.accidents}`} />
          <ReportStat label="Training" value={`${report.training.minutes} min · ${report.training.skills} skills`} />
          <ReportStat label="Avg rest" value={report.restAvgHours != null ? `${report.restAvgHours} h/day` : '—'} />
        </div>

        <div className="mt-5 rounded-3xl bg-white border border-cream-200 p-4">
          <div className="text-sm font-semibold flex items-center gap-2"><Sparkles size={15} className="text-gold-500" /> 3 key insights</div>
          <ol className="mt-2 space-y-2 list-decimal ml-4 text-sm text-ink-600">{report.insights.map((i, k) => <li key={k}>{i}</li>)}</ol>
        </div>
        <div className="mt-3 rounded-3xl bg-moss-500/10 border border-moss-500/20 p-4">
          <div className="text-sm font-semibold text-moss-600">3 actions for next week</div>
          <ol className="mt-2 space-y-2 list-decimal ml-4 text-sm text-ink-600">{report.actions.map((a, k) => <li key={k}>{a}</li>)}</ol>
        </div>
        {report.behaviorTop && <p className="mt-3 text-xs text-ink-400 text-center">Most-logged challenge this week: {report.behaviorTop}. Presented as an observation, not a diagnosis.</p>}
      </div>
    </div>
  );
}
function ReportStat({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return <div className="rounded-2xl bg-white border border-cream-200 p-3"><div className="text-[11px] uppercase tracking-wider text-ink-400">{label}</div><div className={cn('text-base font-semibold mt-0.5 tnum', good && 'text-moss-600')}>{value}</div></div>;
}
