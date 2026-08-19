import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { isSeeded, seedDatabase } from '@/data/seed';
import { ToastProvider } from '@/components/ui';
import { AppShell } from '@/components/AppShell';
import Today from '@/pages/Today';
import Diet from '@/pages/Diet';
import Train from '@/pages/Train';
import Grow from '@/pages/Grow';
import Health from '@/pages/Health';
import Admin from '@/pages/Admin';

export default function App() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    (async () => {
      if (!(await isSeeded())) await seedDatabase();
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-cream-50">
        <div className="text-5xl animate-pop">🐶</div>
        <div className="text-ink-400 text-sm">Waking Golden up…</div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <AppShell>
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/diet" element={<Diet />} />
          <Route path="/train" element={<Train />} />
          <Route path="/grow" element={<Grow />} />
          <Route path="/health" element={<Health />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AppShell>
    </ToastProvider>
  );
}
