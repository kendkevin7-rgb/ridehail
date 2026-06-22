import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { useAuth } from '../../contexts/AuthContext';
import { useDriver } from '../../contexts/DriverContext';
import clsx from 'clsx';

export function DriverLayout() {
  const { user } = useAuth();
  const { isOnline, toggleOnline } = useDriver();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b border-gray-200 z-30">
        <div className="flex items-center justify-between h-14 px-4 max-w-4xl mx-auto">
          <h1 className="text-lg font-semibold text-gray-900">
            {user?.full_name || 'Driver'}
          </h1>
          <button
            onClick={toggleOnline}
            className={clsx(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              isOnline
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {isOnline ? 'Online' : 'Offline'}
          </button>
        </div>
      </header>
      <main className="pb-20 max-w-lg mx-auto px-4 py-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
