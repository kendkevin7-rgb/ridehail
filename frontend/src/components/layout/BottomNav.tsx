import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import clsx from 'clsx';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
}

function HomeIcon({ active }: { active?: boolean }) {
  return (
    <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      {!active && <polyline points="9 22 9 12 15 12 15 22" />}
      {active && <path d="M9 22V12h6v10" />}
    </svg>
  );
}

function BookIcon({ active }: { active?: boolean }) {
  return (
    <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="10" r="3" />
      <path d="M12 2a8 8 0 0 0-8 8c0 5.4 8 12 8 12s8-6.6 8-12a8 8 0 0 0-8-8z" />
    </svg>
  );
}

function HistoryIcon({ active }: { active?: boolean }) {
  return (
    <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      {!active && <polyline points="12 6 12 12 16 14" />}
      {active && <path d="M12 6v6l4 2" />}
    </svg>
  );
}

function ProfileIcon({ active }: { active?: boolean }) {
  return (
    <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function DashboardIcon({ active }: { active?: boolean }) {
  return (
    <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function RequestsIcon({ active }: { active?: boolean }) {
  return (
    <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      {!active && <>
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </>}
      {active && <>
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </>}
    </svg>
  );
}

function EarningsIcon({ active }: { active?: boolean }) {
  return (
    <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

export function BottomNav() {
  const { user } = useAuth();

  if (!user) return null;

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'relative flex flex-col items-center gap-1 pt-2 pb-1 text-[10px] font-semibold transition-colors duration-200',
      isActive ? 'text-brand-600' : 'text-surface-400 hover:text-surface-600'
    );

  if (user.role === UserRole.RIDER) {
    const riderNavItems: NavItem[] = [
      { to: '/rider', label: 'Home', icon: <HomeIcon />, activeIcon: <HomeIcon active /> },
      { to: '/rider/book', label: 'Book', icon: <BookIcon />, activeIcon: <BookIcon active /> },
      { to: '/rider/history', label: 'History', icon: <HistoryIcon />, activeIcon: <HistoryIcon active /> },
      { to: '/rider/profile', label: 'Profile', icon: <ProfileIcon />, activeIcon: <ProfileIcon active /> },
    ];

    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-white/20 z-40 safe-bottom shadow-glass">
        <div className="flex justify-around items-end h-16 max-w-lg mx-auto px-2">
          {riderNavItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/rider'} className={navLinkClass}>
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute top-0 w-6 h-1 rounded-full gradient-brand" />}
                  <span className={isActive ? 'drop-shadow-sm' : ''}>
                    {isActive ? item.activeIcon : item.icon}
                  </span>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    );
  }

  const driverNavItems: NavItem[] = [
    { to: '/driver', label: 'Home', icon: <DashboardIcon />, activeIcon: <DashboardIcon active /> },
    { to: '/driver/requests', label: 'Requests', icon: <RequestsIcon />, activeIcon: <RequestsIcon active /> },
    { to: '/driver/earnings', label: 'Earnings', icon: <EarningsIcon />, activeIcon: <EarningsIcon active /> },
    { to: '/driver/profile', label: 'Profile', icon: <ProfileIcon />, activeIcon: <ProfileIcon active /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-white/20 z-40 safe-bottom shadow-glass">
      <div className="flex justify-around items-end h-16 max-w-lg mx-auto px-2">
        {driverNavItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/driver'} className={navLinkClass}>
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute top-0 w-6 h-1 rounded-full gradient-brand" />}
                <span className={isActive ? 'drop-shadow-sm' : ''}>
                  {isActive ? item.activeIcon : item.icon}
                </span>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
