import { type ReactNode, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Utensils, GraduationCap, TrendingUp, HeartPulse, Settings2 } from 'lucide-react';
import { useData } from '@/hooks/useData';
import { setActiveMember, setMode } from '@/db/actions';
import { Sheet, Segmented, cn } from '@/components/ui';

const TABS = [
  { to: '/', label: 'Today', icon: Home },
  { to: '/diet', label: 'Diet', icon: Utensils },
  { to: '/train', label: 'Train', icon: GraduationCap },
  { to: '/grow', label: 'Grow', icon: TrendingUp },
  { to: '/health', label: 'Health', icon: HeartPulse },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { dog, settings, family, activeMember } = useData();
  const [memberOpen, setMemberOpen] = useState(false);
  const loc = useLocation();

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <header className="pt-safe sticky top-0 z-30 bg-cream-50/85 backdrop-blur-lg">
        <div className="mx-auto max-w-md px-4 pt-3 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gold-100 text-xl shadow-sm">
              {dog?.photo ?? '🐶'}
            </div>
            <div className="leading-tight">
              <div className="text-[15px] font-semibold">{dog?.name ?? 'Golden'}</div>
              <div className="text-[11px] text-ink-400">{dog?.breed}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {settings?.mode === 'admin' && (
              <NavLink to="/admin" className={({ isActive }) => cn('grid h-9 w-9 place-items-center rounded-xl border text-ink-500',
                isActive ? 'bg-gold-50 border-gold-200 text-gold-700' : 'border-cream-200 bg-white')}>
                <Settings2 size={17} />
              </NavLink>
            )}
            <button onClick={() => setMemberOpen(true)}
              className="btn-press flex items-center gap-1.5 rounded-full border border-cream-200 bg-white pl-1 pr-3 py-1 shadow-sm">
              <span className="grid h-7 w-7 place-items-center rounded-full text-base" style={{ background: (activeMember?.color ?? '#eee') + '22' }}>
                {activeMember?.emoji ?? '🧑'}
              </span>
              <span className="text-[13px] font-medium">{activeMember?.name ?? '—'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-md px-4 pb-safe">{children}</main>

      {/* Tab bar */}
      <nav className="fixed bottom-0 inset-x-0 z-30">
        <div className="mx-auto max-w-md px-3 pb-[env(safe-area-inset-bottom)]">
          <div className="mb-2 grid grid-cols-5 rounded-3xl border border-cream-200 bg-white/95 backdrop-blur shadow-pop">
            {TABS.map((t) => (
              <NavLink key={t.to} to={t.to} end={t.to === '/'}
                className={({ isActive }) => cn('flex flex-col items-center gap-0.5 py-2.5 rounded-3xl',
                  isActive ? 'text-gold-600' : 'text-ink-400')}>
                {({ isActive }) => (
                  <>
                    <t.icon size={21} strokeWidth={isActive ? 2.4 : 1.9} />
                    <span className={cn('text-[10px]', isActive ? 'font-semibold' : 'font-medium')}>{t.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Member + mode switcher */}
      <Sheet open={memberOpen} onClose={() => setMemberOpen(false)} title="Who's using the app?">
        <p className="text-sm text-ink-400 -mt-1 mb-3">Everyone shares one plan for {dog?.name}. Actions are attributed to you.</p>
        <div className="space-y-2">
          {family.map((m) => (
            <button key={m.id} onClick={() => { setActiveMember(m.id); setMemberOpen(false); }}
              className={cn('btn-press w-full flex items-center gap-3 rounded-2xl border p-3 text-left',
                m.id === activeMember?.id ? 'border-gold-300 bg-gold-50' : 'border-cream-200 bg-white')}>
              <span className="grid h-10 w-10 place-items-center rounded-full text-xl" style={{ background: m.color + '22' }}>{m.emoji}</span>
              <div className="flex-1">
                <div className="font-semibold text-sm">{m.name}</div>
                <div className="text-xs text-ink-400 capitalize">{m.role}</div>
              </div>
              {m.id === activeMember?.id && <span className="text-gold-600 text-sm font-semibold">Active</span>}
            </button>
          ))}
        </div>
        <div className="mt-5 rounded-2xl bg-cream-100 p-3">
          <div className="text-[13px] font-semibold mb-2">App mode</div>
          <Segmented
            value={settings?.mode ?? 'simple'}
            onChange={(v) => setMode(v)}
            options={[{ value: 'simple', label: '👵 Simple' }, { value: 'admin', label: '⚙️ Admin' }]}
          />
          <p className="mt-2 text-xs text-ink-400">
            {settings?.mode === 'simple'
              ? 'Simple mode: big buttons, minimal text — ideal for parents.'
              : 'Admin mode: detailed controls, calories, and the ⚙️ settings tab.'}
          </p>
        </div>
      </Sheet>
    </div>
  );
}
