import { useState } from 'react';
import { Sheet, Button, useToast, cn, WhyThis } from '@/components/ui';
import { addWeeklyCheck } from '@/db/actions';
import { BCS_QUESTIONS, estimateBcs } from '@/services/bcs';
import type { useData } from '@/hooks/useData';

// Weekly puppy check (spec §14, §16) — weight, height, and a guided BCS.
export function WeeklyCheckSheet({ open, onClose, data }: { open: boolean; onClose: () => void; data: ReturnType<typeof useData> }) {
  const toast = useToast();
  const dog = data.dog;
  const [weight, setWeight] = useState(dog?.weightKg?.toString() ?? '');
  const [height, setHeight] = useState(dog?.heightCm?.toString() ?? '');
  const [bcsAnswers, setBcsAnswers] = useState<Record<string, number>>({});
  const [showBcs, setShowBcs] = useState(false);

  const answered = Object.keys(bcsAnswers).length;
  const bcsResult = answered === BCS_QUESTIONS.length ? estimateBcs(Object.values(bcsAnswers)) : null;

  function save() {
    const w = parseFloat(weight);
    if (!w || w <= 0) { toast('Enter a valid weight'); return; }
    addWeeklyCheck(w, height ? parseFloat(height) : undefined, bcsResult?.score);
    toast('Weekly check saved — nicely done!', '📈');
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Weekly puppy check">
      <p className="text-sm text-ink-400 -mt-1 mb-4">Weekly monitoring keeps large-breed growth steady & lean (Merck).</p>

      <label className="block mb-3">
        <span className="text-sm font-semibold">Weight</span>
        <div className="mt-1 flex items-center gap-2">
          <input type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)}
            className="flex-1 rounded-2xl border border-cream-200 bg-white px-4 py-3 text-lg tnum" placeholder="9.0" />
          <span className="text-ink-400">kg</span>
        </div>
      </label>

      <label className="block mb-4">
        <span className="text-sm font-semibold">Height at withers <span className="text-ink-400 font-normal">(optional)</span></span>
        <div className="mt-1 flex items-center gap-2">
          <input type="number" inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)}
            className="flex-1 rounded-2xl border border-cream-200 bg-white px-4 py-3 text-lg tnum" placeholder="33" />
          <span className="text-ink-400">cm</span>
        </div>
      </label>

      {/* Guided BCS */}
      <div className="rounded-2xl border border-cream-200 bg-white p-3 mb-4">
        <button onClick={() => setShowBcs((s) => !s)} className="w-full flex items-center justify-between">
          <span className="text-sm font-semibold">Body condition (optional guided)</span>
          <span className="text-xs text-gold-600">{showBcs ? 'Hide' : bcsResult ? `${bcsResult.score}/9` : 'Start'}</span>
        </button>
        {showBcs && (
          <div className="mt-3 space-y-4 animate-fade">
            {BCS_QUESTIONS.map((q) => (
              <div key={q.id}>
                <div className="text-sm font-medium mb-1.5">{q.q}</div>
                <div className="space-y-1.5">
                  {q.options.map((o, i) => (
                    <button key={i} onClick={() => setBcsAnswers((a) => ({ ...a, [q.id]: o.weight }))}
                      className={cn('w-full text-left rounded-xl border px-3 py-2 text-sm',
                        bcsAnswers[q.id] === o.weight ? 'border-gold-300 bg-gold-50 text-gold-700' : 'border-cream-200')}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {bcsResult && (
              <div className="rounded-xl bg-moss-500/10 p-3 text-sm">
                <div className="font-semibold text-moss-600">Estimated BCS ≈ {bcsResult.score}/9 · {bcsResult.band}</div>
                <div className="text-ink-500 text-xs mt-1">{bcsResult.note}</div>
                <WhyThis basis="WSAVA body-condition assessment"
                  formula="Average of rib feel, waist & abdominal tuck answers"
                  assumptions={['1–9 scale, target lean 4–5/9']}
                  limitations="A guided estimate — your vet's hands-on assessment is the reference." />
              </div>
            )}
          </div>
        )}
      </div>

      <Button className="w-full" onClick={save}>Save weekly check</Button>
    </Sheet>
  );
}
