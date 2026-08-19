import { useState } from 'react';
import { format, differenceInCalendarDays } from 'date-fns';
import { Syringe, Bug, Bath, Stethoscope, Pill, Check, AlertCircle, Phone, ChevronRight } from 'lucide-react';
import { useData } from '@/hooks/useData';
import { Card, SectionTitle, Button, Sheet, cn, Pill as UIPill } from '@/components/ui';
import { toggleHealth, toggleReminder } from '@/db/actions';
import { RED_FLAGS, TRIAGE_META, type Triage } from '@/data/redFlags';
import type { HealthKind, HealthRecord } from '@/types';

const KIND_META: Record<HealthKind, { label: string; icon: any }> = {
  vaccination: { label: 'Vaccination', icon: Syringe },
  deworming: { label: 'Deworming', icon: Bug },
  'flea-tick': { label: 'Flea / tick', icon: Bug },
  'vet-visit': { label: 'Vet visit', icon: Stethoscope },
  medication: { label: 'Medication', icon: Pill },
  dental: { label: 'Dental', icon: Bath },
  other: { label: 'Other', icon: Stethoscope },
};

export default function Health() {
  const data = useData();
  const [flagOpen, setFlagOpen] = useState(false);
  if (data.loading || !data.dog) return <div className="py-20 text-center text-ink-400">Loading…</div>;

  const upcoming = data.reminders.filter((r) => !r.done).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const records = [...data.health].sort((a, b) => (b.date ?? b.dueDate ?? '').localeCompare(a.date ?? a.dueDate ?? ''));

  return (
    <div className="space-y-4 pt-1">
      <div className="px-1">
        <h1 className="text-2xl font-semibold tracking-tight">Health</h1>
        <p className="text-sm text-ink-400">Reminders & records · not a substitute for your vet</p>
      </div>

      {/* Red-flag CTA (spec §26) */}
      <button onClick={() => setFlagOpen(true)}
        className="btn-press w-full rounded-3xl bg-gradient-to-br from-red-500 to-red-600 p-4 text-left text-white shadow-pop">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold"><Phone size={18} /> Should I call the vet?</div>
          <ChevronRight size={18} />
        </div>
        <p className="text-sm text-red-50/90 mt-1">Quick symptom check — emergency, prompt, or monitor. Educational triage, never a diagnosis.</p>
      </button>

      {/* Reminders */}
      <div>
        <SectionTitle>Upcoming</SectionTitle>
        <Card className="p-0 overflow-hidden">
          {upcoming.length === 0 && <div className="p-4 text-sm text-ink-400">Nothing due — all caught up ✓</div>}
          {upcoming.map((r) => {
            const days = differenceInCalendarDays(new Date(r.dueDate + 'T00:00:00'), new Date());
            const overdue = days < 0;
            return (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3 border-b border-cream-200/70 last:border-0">
                <span className={cn('grid h-9 w-9 place-items-center rounded-xl', overdue ? 'bg-red-100 text-red-600' : 'bg-gold-50 text-gold-600')}>
                  <AlertCircle size={17} />
                </span>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{r.title}</div>
                  <div className={cn('text-xs', overdue ? 'text-red-600' : 'text-ink-400')}>
                    {overdue ? `Overdue by ${-days} day(s)` : days === 0 ? 'Due today' : `Due in ${days} day(s)`} · {format(new Date(r.dueDate + 'T00:00:00'), 'MMM d')}
                  </div>
                </div>
                <button onClick={() => toggleReminder(r)} className="rounded-full bg-moss-500/15 text-moss-600 px-3 py-1.5 text-xs font-semibold">Mark done</button>
              </div>
            );
          })}
        </Card>
      </div>

      {/* Records */}
      <div>
        <SectionTitle>Records</SectionTitle>
        <div className="space-y-2">
          {records.map((rec) => {
            const meta = KIND_META[rec.kind];
            return (
              <Card key={rec.id} className="flex items-center gap-3">
                <span className={cn('grid h-9 w-9 place-items-center rounded-xl', rec.done ? 'bg-moss-500/15 text-moss-600' : 'bg-cream-100 text-ink-400')}><meta.icon size={17} /></span>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{rec.title}</div>
                  <div className="text-xs text-ink-400">
                    {rec.date && <>Done {format(new Date(rec.date + 'T00:00:00'), 'MMM d')}</>}
                    {rec.dueDate && <> · next {format(new Date(rec.dueDate + 'T00:00:00'), 'MMM d')}</>}
                    {rec.notes && <> · {rec.notes}</>}
                  </div>
                </div>
                <button onClick={() => toggleHealth(rec)} className={cn('grid h-8 w-8 place-items-center rounded-full', rec.done ? 'bg-moss-500 text-white' : 'border border-cream-200 text-ink-400')}>
                  <Check size={15} />
                </button>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Weight & BCS quick links live under Grow */}
      <div className="rounded-2xl bg-cream-100 p-3 text-xs text-ink-400">
        Weight & body-condition tracking live under the <b>Grow</b> tab. This app gives educational guidance and reminders — it does not diagnose or prescribe treatment.
      </div>

      <div className="h-2" />
      <RedFlagSheet open={flagOpen} onClose={() => setFlagOpen(false)} />
    </div>
  );
}

// ---- Red-flag triage (spec §26) --------------------------------------------
function RedFlagSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const groups: Triage[] = ['emergency', 'prompt', 'monitor'];
  return (
    <Sheet open={open} onClose={onClose} title="Should I call the vet?">
      <p className="text-sm text-ink-400 -mt-1 mb-3">Find the sign that best matches. This is educational triage to help you decide how urgently to seek care — it is <b>not</b> a diagnosis.</p>
      <div className="space-y-4">
        {groups.map((g) => {
          const meta = TRIAGE_META[g];
          return (
            <div key={g}>
              <div className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold mb-2', meta.className)}>
                {g === 'emergency' ? '🚨' : g === 'prompt' ? '⏱️' : '👀'} {meta.label}
              </div>
              <div className="space-y-2">
                {RED_FLAGS.filter((f) => f.triage === g).map((f) => (
                  <div key={f.id} className={cn('rounded-2xl border p-3', g === 'emergency' ? 'border-red-200 bg-red-50' : g === 'prompt' ? 'border-orange-200 bg-orange-50' : 'border-cream-200 bg-white')}>
                    <div className="text-sm font-semibold">{f.symptom}</div>
                    <div className="text-xs text-ink-500 mt-0.5">{f.note}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 rounded-2xl bg-ink-900 text-white p-3 text-xs">
        When in doubt, call your veterinarian or a local emergency clinic. For suspected poisoning, contact a vet or pet poison line immediately with the substance and amount.
      </div>
    </Sheet>
  );
}
