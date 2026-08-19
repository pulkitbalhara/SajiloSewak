import { useState } from 'react';
import { Sheet, Button, useToast, cn } from '@/components/ui';
import { logPotty } from '@/db/actions';
import type { PottyContext } from '@/types';

const CONTEXTS: { value: PottyContext; label: string; emoji: string }[] = [
  { value: 'woke-up', label: 'Woke up', emoji: '🌅' },
  { value: 'after-eating', label: 'After eating', emoji: '🍽️' },
  { value: 'after-drinking', label: 'After drinking', emoji: '💧' },
  { value: 'after-play', label: 'After play', emoji: '🎾' },
  { value: 'after-training', label: 'After training', emoji: '🎓' },
  { value: 'after-nap', label: 'After nap', emoji: '😴' },
  { value: 'routine', label: 'Routine', emoji: '🕐' },
];

export function PottySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const [ctx, setCtx] = useState<PottyContext>('routine');

  function log(kind: 'pee' | 'poop', result: 'outside' | 'accident') {
    logPotty(kind, result, ctx);
    toast(result === 'outside' ? `${kind === 'pee' ? 'Pee' : 'Poop'} outside — good job! 🎉` : 'Accident logged — no worries', result === 'outside' ? '✅' : '🧽');
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Potty log">
      <p className="text-sm text-ink-400 -mt-1 mb-3">One tap. The coach learns Golden's timing from these.</p>

      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">What just happened?</div>
      <div className="grid grid-cols-2 gap-2.5">
        <button onClick={() => log('pee', 'outside')} className="btn-press rounded-2xl border border-moss-500/30 bg-moss-500/10 p-4 text-moss-600 font-semibold">
          <div className="text-2xl">💦</div><div className="mt-1">Pee — outside</div>
        </button>
        <button onClick={() => log('poop', 'outside')} className="btn-press rounded-2xl border border-moss-500/30 bg-moss-500/10 p-4 text-moss-600 font-semibold">
          <div className="text-2xl">💩</div><div className="mt-1">Poop — outside</div>
        </button>
        <button onClick={() => log('pee', 'accident')} className="btn-press rounded-2xl border border-gold-200 bg-gold-50 p-4 text-gold-700 font-semibold">
          <div className="text-2xl">🌧️</div><div className="mt-1">Accident (pee)</div>
        </button>
        <button onClick={() => log('poop', 'accident')} className="btn-press rounded-2xl border border-gold-200 bg-gold-50 p-4 text-gold-700 font-semibold">
          <div className="text-2xl">😬</div><div className="mt-1">Accident (poop)</div>
        </button>
      </div>

      <div className="mt-4 mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">Context (optional)</div>
      <div className="flex flex-wrap gap-2">
        {CONTEXTS.map((c) => (
          <button key={c.value} onClick={() => setCtx(c.value)}
            className={cn('rounded-full border px-3 py-1.5 text-sm', ctx === c.value ? 'border-gold-300 bg-gold-50 text-gold-700' : 'border-cream-200 bg-white text-ink-500')}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
