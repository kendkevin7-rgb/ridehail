import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { useAuth } from '../../contexts/AuthContext';
import { useDriver } from '../../contexts/DriverContext';
import clsx from 'clsx';
import { useEffect, useState } from 'react';

export function DriverLayout() {
  const { user } = useAuth();
  const { isOnline, toggleOnline } = useDriver();
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
            {user?.full_name || 'Driver'}
          </h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={clsx(
                'w-2 h-2 rounded-full',
                isOnline ? 'bg-emerald-500 animate-pulse-slow' : 'bg-surface-300'
              )} />
              <button
                onClick={toggleOnline}
                className={clsx(
                  'relative px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200',
                  isOnline
                    ? 'gradient-success text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-surface-100 text-surface-500 hover:bg-surface-200'
                )}
              >
                {isOnline ? 'Online' : 'Offline'}
              </button>
            </div>
            <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-brand-500/25">
              {(user?.full_name || 'D').charAt(0)}
            </div>
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
