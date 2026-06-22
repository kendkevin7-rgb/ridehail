import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';

export function RiderLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey((prev) => prev + 1);
  }, [location.pathname]);

  return (
    <div className="min-h-screen gradient-surface">
      <header className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-white/20 z-30">
        <div className="flex items-center justify-between h-16 px-5 max-w-4xl mx-auto">
          <h1 className="text-lg font-display font-bold text-surface-900">
            {user?.full_name || 'Rider'}
          </h1>
          <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-brand-500/25">
            {(user?.full_name || 'R').charAt(0)}
          </div>
        </div>
      </header>
      <main key={key} className="pb-24 max-w-lg mx-auto px-4 py-5 animate-fade-in">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
