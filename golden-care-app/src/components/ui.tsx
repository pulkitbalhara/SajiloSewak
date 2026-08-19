import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { X, ChevronDown, Info } from 'lucide-react';

// ============================================================================
// Reusable UI primitives — calm, premium, mobile-first (spec §33).
// ============================================================================

export function cn(...parts: (string | false | undefined | null)[]) {
  return parts.filter(Boolean).join(' ');
}

// --- Card -------------------------------------------------------------------
export function Card({ className, children, onClick }: { className?: string; children: ReactNode; onClick?: () => void }) {
  return (
    <div className={cn('card p-4', onClick && 'btn-press cursor-pointer', className)} onClick={onClick}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-1 mb-2 mt-1">
      <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-400">{children}</h2>
      {right}
    </div>
  );
}

// --- Pill -------------------------------------------------------------------
export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('pill', className)}>{children}</span>;
}

// --- Big action button (Simple mode) ---------------------------------------
export function BigButton({
  label, emoji, sub, onClick, tone = 'gold', disabled,
}: { label: string; emoji: string; sub?: string; onClick?: () => void; tone?: 'gold' | 'moss' | 'neutral' | 'red'; disabled?: boolean }) {
  const tones: Record<string, string> = {
    gold: 'bg-gold-50 border-gold-200/70 text-gold-700',
    moss: 'bg-moss-500/10 border-moss-500/25 text-moss-600',
    neutral: 'bg-cream-100 border-cream-200 text-ink-700',
    red: 'bg-red-50 border-red-200 text-red-600',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'btn-press flex flex-col items-center justify-center gap-1 rounded-3xl border p-4 h-[92px] text-center disabled:opacity-40',
        tones[tone],
      )}
    >
      <span className="text-[26px] leading-none">{emoji}</span>
      <span className="text-[13px] font-semibold leading-tight">{label}</span>
      {sub && <span className="text-[10px] opacity-70 leading-none">{sub}</span>}
    </button>
  );
}

export function Button({
  children, onClick, variant = 'primary', className, disabled, type,
}: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'ghost' | 'soft' | 'danger'; className?: string; disabled?: boolean; type?: 'button' | 'submit' }) {
  const styles: Record<string, string> = {
    primary: 'bg-gold-500 text-white shadow-sm hover:bg-gold-600',
    soft: 'bg-gold-50 text-gold-700 border border-gold-200/70',
    ghost: 'bg-transparent text-ink-500 hover:bg-cream-100',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };
  return (
    <button
      type={type ?? 'button'}
      onClick={onClick}
      disabled={disabled}
      className={cn('btn-press rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-40', styles[variant], className)}
    >
      {children}
    </button>
  );
}

// --- Progress ring ----------------------------------------------------------
export function Ring({ value, max, size = 64, stroke = 7, color = '#C9861E', track = '#F3ECD9', children }: {
  value: number; max: number; size?: number; stroke?: number; color?: string; track?: string; children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

// --- Bottom sheet -----------------------------------------------------------
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  useEffect(() => {
    if (open) { document.body.style.overflow = 'hidden'; }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-ink-900/30 animate-fade" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-cream-50 rounded-t-3xl sm:rounded-3xl shadow-pop max-h-[90vh] flex flex-col animate-sheet sm:animate-pop">
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="h-1.5 w-10 rounded-full bg-cream-200 absolute left-1/2 -translate-x-1/2 top-2 sm:hidden" />
          <h3 className="text-lg font-semibold mt-2">{title}</h3>
          <button onClick={onClose} className="mt-2 rounded-full p-1.5 text-ink-400 hover:bg-cream-100"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto no-scrollbar px-5 pb-6">{children}</div>
      </div>
    </div>
  );
}

// --- "Why this number?" disclosure (spec §30) ------------------------------
export function WhyThis({ title = 'Why this number?', formula, basis, assumptions, limitations }: {
  title?: string; formula?: string; basis?: string; assumptions?: string[]; limitations?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1 text-xs font-medium text-gold-600">
        <Info size={13} /> {title} <ChevronDown size={13} className={cn('transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="mt-2 rounded-2xl bg-cream-100 p-3 text-xs text-ink-500 space-y-1.5 animate-fade">
          {formula && <div><span className="font-semibold text-ink-700">Formula:</span> <span className="tnum">{formula}</span></div>}
          {basis && <div><span className="font-semibold text-ink-700">Basis:</span> {basis}</div>}
          {assumptions && assumptions.length > 0 && (
            <div><span className="font-semibold text-ink-700">Assumptions:</span>
              <ul className="list-disc ml-4 mt-0.5">{assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul>
            </div>
          )}
          {limitations && <div><span className="font-semibold text-ink-700">Note:</span> {limitations}</div>}
        </div>
      )}
    </div>
  );
}

// --- Toast ------------------------------------------------------------------
interface Toast { id: number; text: string; emoji?: string }
const ToastCtx = createContext<(text: string, emoji?: string) => void>(() => {});
export function useToast() { return useContext(ToastCtx); }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const push = useCallback((text: string, emoji?: string) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, text, emoji }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 6rem)' }}>
        {toasts.map((t) => (
          <div key={t.id} className="animate-pop flex items-center gap-2 rounded-full bg-ink-900 text-white px-4 py-2.5 text-sm font-medium shadow-pop max-w-[90vw]">
            {t.emoji && <span>{t.emoji}</span>}<span>{t.text}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// --- Segmented control ------------------------------------------------------
export function Segmented<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-2xl bg-cream-100 p-1">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={cn('rounded-xl px-3 py-1.5 text-sm font-medium transition-colors',
            value === o.value ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-400')}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
