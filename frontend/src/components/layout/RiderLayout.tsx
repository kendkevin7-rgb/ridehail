import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { useAuth } from '../../contexts/AuthContext';

export function RiderLayout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b border-gray-200 z-30">
        <div className="flex items-center justify-between h-14 px-4 max-w-4xl mx-auto">
          <h1 className="text-lg font-semibold text-gray-900">
            {user?.full_name || 'Rider'}
          </h1>
        </div>
      </header>
      <main className="pb-20 max-w-lg mx-auto px-4 py-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
