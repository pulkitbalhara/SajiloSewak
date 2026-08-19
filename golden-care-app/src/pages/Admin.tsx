import { useState } from 'react';
import { format } from 'date-fns';
import { RotateCcw, BookOpen } from 'lucide-react';
import { useData } from '@/hooks/useData';
import { Card, SectionTitle, Button, useToast, cn, WhyThis } from '@/components/ui';
import { updateDog, updateSettings } from '@/db/actions';
import { resetDatabase } from '@/data/seed';
import { SOURCES } from '@/data/sources';
import type { ActivityLevel, NeuterStatus, Sex } from '@/types';

export default function Admin() {
  const data = useData();
  const toast = useToast();
  if (data.loading || !data.dog || !data.settings || !data.derived) return <div className="py-20 text-center text-ink-400">Loading…</div>;
  const dog = data.dog;
  const s = data.settings;
  const d = data.derived;

  const [allergy, setAllergy] = useState('');

  return (
    <div className="space-y-4 pt-1">
      <div className="px-1">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="text-sm text-ink-400">Detailed controls & scientific transparency</p>
      </div>

      {/* Energy transparency */}
      <Card>
        <SectionTitle>Energy calculation</SectionTitle>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Metric label="RER" value={`${d.energy.rer}`} unit="kcal" />
          <Metric label="Factor" value={`×${d.energy.factor.toFixed(1)}`} unit={d.stage.label} />
          <Metric label="Target" value={`${d.energy.value}`} unit="kcal/day" />
        </div>
        <WhyThis formula={d.energy.formula} basis={d.energy.basis} assumptions={d.energy.assumptions} limitations={d.energy.limitations} />
      </Card>

      {/* Profile editor (spec §1) */}
      <Card>
        <SectionTitle>Dog profile</SectionTitle>
        <div className="space-y-3">
          <Field label="Name"><input value={dog.name} onChange={(e) => updateDog({ name: e.target.value })} className={inp} /></Field>
          <Field label="Breed"><input value={dog.breed} onChange={(e) => updateDog({ breed: e.target.value })} className={inp} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date of birth"><input type="date" value={dog.dob} onChange={(e) => updateDog({ dob: e.target.value })} className={inp} /></Field>
            <Field label="Sex">
              <select value={dog.sex} onChange={(e) => updateDog({ sex: e.target.value as Sex })} className={inp}>
                <option value="male">Male</option><option value="female">Female</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Weight (kg)"><input type="number" step="0.1" value={dog.weightKg} onChange={(e) => updateDog({ weightKg: +e.target.value })} className={inp} /></Field>
            <Field label="Height (cm)"><input type="number" value={dog.heightCm ?? ''} onChange={(e) => updateDog({ heightCm: +e.target.value })} className={inp} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Activity">
              <select value={dog.activity} onChange={(e) => updateDog({ activity: e.target.value as ActivityLevel })} className={inp}>
                <option value="low">Low</option><option value="moderate">Moderate</option><option value="active">Active</option><option value="very-active">Very active</option>
              </select>
            </Field>
            <Field label="Neuter status">
              <select value={dog.neuter} onChange={(e) => updateDog({ neuter: e.target.value as NeuterStatus })} className={inp}>
                <option value="intact">Intact</option><option value="neutered">Neutered</option>
              </select>
            </Field>
          </div>
          <Field label="Current food">
            <select value={dog.currentFoodId ?? ''} onChange={(e) => updateDog({ currentFoodId: e.target.value })} className={inp}>
              {data.foods.filter((f) => f.category === 'primary-complete').map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </Field>
          <Field label="Health notes"><textarea value={dog.healthNotes} onChange={(e) => updateDog({ healthNotes: e.target.value })} className={cn(inp, 'h-20 resize-none')} /></Field>
          <Field label="Allergies / intolerances">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {dog.allergies.map((a, i) => (
                <span key={i} className="pill bg-red-100 text-red-700">{a}
                  <button onClick={() => updateDog({ allergies: dog.allergies.filter((_, k) => k !== i) })} className="ml-1">×</button></span>
              ))}
              {dog.allergies.length === 0 && <span className="text-xs text-ink-400">None recorded</span>}
            </div>
            <div className="flex gap-2">
              <input value={allergy} onChange={(e) => setAllergy(e.target.value)} placeholder="e.g. chicken" className={inp} />
              <Button variant="soft" onClick={() => { if (allergy.trim()) { updateDog({ allergies: [...dog.allergies, allergy.trim()] }); setAllergy(''); } }}>Add</Button>
            </div>
          </Field>
        </div>
      </Card>

      {/* Routine config (spec §23) */}
      <Card>
        <SectionTitle>Routine configuration</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Wake time"><input type="time" value={s.wakeTime} onChange={(e) => updateSettings({ wakeTime: e.target.value })} className={inp} /></Field>
          <Field label="Bedtime"><input type="time" value={s.bedTime} onChange={(e) => updateSettings({ bedTime: e.target.value })} className={inp} /></Field>
        </div>
        <p className="mt-2 text-xs text-ink-400">The full daily routine (potty, meals, play, training, rest) regenerates automatically from these plus the diet's meals/day. It also shifts as Golden ages.</p>
      </Card>

      {/* Family (spec §3) */}
      <Card>
        <SectionTitle>Family</SectionTitle>
        <div className="space-y-2">
          {data.family.map((m) => (
            <div key={m.id} className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full text-lg" style={{ background: m.color + '22' }}>{m.emoji}</span>
              <div className="flex-1"><div className="text-sm font-semibold">{m.name}</div><div className="text-xs text-ink-400 capitalize">{m.role}</div></div>
              {m.id === s.activeMemberId && <span className="text-xs text-gold-600 font-semibold">Active</span>}
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-400">Everyone shares one dog state — feeding, potty and treats are visible to all to prevent double-feeding.</p>
      </Card>

      {/* Sources & assumptions (spec §32) */}
      <Card>
        <SectionTitle right={<BookOpen size={15} className="text-ink-400 mb-2" />}>Sources & assumptions</SectionTitle>
        <p className="text-xs text-ink-400 mb-3">The scientific basis for this app's guidance. We reference established veterinary authorities and do not fabricate specific citations.</p>
        <div className="space-y-2">
          {Object.values(SOURCES).map((src) => (
            <details key={src.key} className="rounded-2xl border border-cream-200 bg-white p-3">
              <summary className="text-sm font-semibold cursor-pointer">{src.org}</summary>
              <p className="mt-1.5 text-xs text-ink-500">{src.summary}</p>
            </details>
          ))}
        </div>
        <div className="mt-3 rounded-2xl bg-cream-100 p-3 text-xs text-ink-500">
          <b>Key assumptions:</b> energy factors are life-stage starting points (Merck) adjusted to the individual; the primary
          food is assumed complete & balanced for large-breed growth; nutrient values shown for household foods are typical
          estimates for portioning, not lab analyses; BCS targets a lean 4–5/9 (WSAVA). None of this replaces your veterinarian.
        </div>
      </Card>

      {/* Reset */}
      <Card>
        <SectionTitle>Demo data</SectionTitle>
        <Button variant="danger" className="w-full" onClick={async () => { await resetDatabase(); toast('Demo data reset', '🔄'); }}>
          <RotateCcw size={15} className="inline -mt-0.5 mr-1" /> Reset to demo seed
        </Button>
        <p className="mt-2 text-xs text-ink-400">Restores Golden's profile and a fresh week of realistic sample data.</p>
      </Card>

      <div className="h-2" />
    </div>
  );
}

const inp = 'w-full rounded-2xl border border-cream-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-gold-300';
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs font-semibold text-ink-500">{label}</span><div className="mt-1">{children}</div></label>;
}
function Metric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return <div className="rounded-2xl bg-cream-100 p-2"><div className="text-[10px] uppercase tracking-wider text-ink-400">{label}</div><div className="text-lg font-semibold tnum">{value}</div><div className="text-[10px] text-ink-400">{unit}</div></div>;
}
