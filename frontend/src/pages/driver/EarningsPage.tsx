import { useEffect, useState, useMemo, useCallback } from 'react';
import clsx from 'clsx';
import { RideStatus } from '../../types';
import type { Ride } from '../../types';
import { useRide } from '../../contexts/RideContext';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';

type Period = 'today' | 'week' | 'month';

const PERIOD_TABS: { key: Period; label: string; icon: string }[] = [
  { key: 'today', label: 'Today', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { key: 'week', label: 'Week', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { key: 'month', label: 'Month', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
];

function getPeriodFilter(period: Period): (date: Date) => boolean {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  switch (period) {
    case 'today':
      return (date: Date) => date >= startOfDay;
    case 'week':
      return (date: Date) => date >= startOfWeek;
    case 'month':
      return (date: Date) => date >= startOfMonth;
  }
}

export default function EarningsPage() {
  const { rideHistory, isLoading, fetchHistory } = useRide();

  const [pageError, setPageError] = useState<string | null>(null);
  const [activePeriod, setActivePeriod] = useState<Period>('week');

  useEffect(() => {
    const init = async () => {
      try {
        await fetchHistory();
      } catch {
        setPageError('Failed to load earnings data');
      }
    };
    init();
  }, []);

  const completedRides = useMemo(
    () => rideHistory.filter((r) => r.status === RideStatus.COMPLETED),
    [rideHistory],
  );

  const filteredRides = useMemo(() => {
    const filterFn = getPeriodFilter(activePeriod);
    return completedRides.filter((r) => {
      if (!r.completed_at) return false;
      return filterFn(new Date(r.completed_at));
    });
  }, [completedRides, activePeriod]);

  const summaries = useMemo(() => {
    const filterToday = getPeriodFilter('today');
    const filterWeek = getPeriodFilter('week');
    const filterMonth = getPeriodFilter('month');

    const calc = (filter: (d: Date) => boolean) =>
      completedRides
        .filter((r) => r.completed_at && filter(new Date(r.completed_at)))
        .reduce((sum, r) => sum + r.fare, 0);

    return {
      today: calc(filterToday),
      week: calc(filterWeek),
      month: calc(filterMonth),
    };
  }, [completedRides]);

  const handleFilterChange = useCallback((period: Period) => {
    setActivePeriod(period);
  }, []);

  if (isLoading && rideHistory.length === 0) {
    return (
      <div className="animate-fade-up space-y-4 p-4 max-w-2xl mx-auto">
        <div className="skeleton h-10 w-40 rounded-lg" />
        <div className="skeleton h-44 w-full rounded-2xl" />
        <div className="skeleton h-10 w-full rounded-lg" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-24 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="animate-fade-up">
        <ErrorState message={pageError} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (completedRides.length === 0) {
    return (
      <div className="animate-fade-up space-y-5 p-4 md:p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-display font-bold text-white">Earnings</h1>
        <div className="rounded-2xl p-6 gradient-brand">
          <p className="text-xs text-white/70 font-medium uppercase tracking-wider">Total Earnings</p>
          <p className="text-4xl font-display font-bold text-white mt-1">$0.00</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <MiniSummaryCard label="Today" amount={0} />
          <MiniSummaryCard label="This Week" amount={0} />
          <MiniSummaryCard label="This Month" amount={0} />
        </div>
        <EmptyState
          icon={
            <svg className="w-14 h-14 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="No earnings yet"
          description="Complete rides to see your earnings."
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-5 p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-white">Earnings</h1>

      <div className="rounded-2xl p-6 gradient-brand">
        <p className="text-xs text-white/70 font-medium uppercase tracking-wider">Total Earnings</p>
        <p className="text-4xl font-display font-bold text-white mt-1">
          ${summaries[activePeriod].toFixed(2)}
        </p>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <MiniSummaryCard label="Today" amount={summaries.today} />
          <MiniSummaryCard label="This Week" amount={summaries.week} />
          <MiniSummaryCard label="This Month" amount={summaries.month} />
        </div>
      </div>

      <div className="flex gap-2 p-1 rounded-xl bg-surface-800">
        {PERIOD_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleFilterChange(tab.key)}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              activePeriod === tab.key
                ? 'gradient-brand text-white shadow-lg shadow-brand-500/30'
                : 'text-surface-400 hover:text-white',
            )}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {filteredRides.length === 0 ? (
        <div className="text-center py-10">
          <svg className="w-12 h-12 mx-auto text-surface-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-surface-400 text-sm">No rides in this period</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRides.map((ride, index) => (
            <EarningsRow key={ride.id} ride={ride} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}

function MiniSummaryCard({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
      <p className="text-[10px] text-white/60 font-medium uppercase tracking-wider">{label}</p>
      <p className="text-lg font-display font-bold text-white mt-0.5">${amount.toFixed(2)}</p>
    </div>
  );
}

function EarningsRow({ ride, index }: { ride: Ride; index: number }) {
  const date = ride.completed_at
    ? new Date(ride.completed_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

  const time = ride.completed_at
    ? new Date(ride.completed_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className="animate-fade-up">
      <Card className="!p-0">
        <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-surface-400">{date}</span>
            <span className="text-surface-600">&middot;</span>
            <span className="text-surface-400">{time}</span>
          </div>
          <span className="badge badge-success text-[10px]">Completed</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-surface-300 mb-2">
          <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{ride.pickup_location.address}</span>
          <svg className="w-3.5 h-3.5 text-surface-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
          <span className="truncate">{ride.dropoff_location.address}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-surface-700">
          <div className="flex items-center gap-3 text-xs text-surface-400">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              {ride.distance.toFixed(1)} mi
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {ride.duration} min
            </span>
          </div>
          <p className="font-display font-bold text-white text-lg">
            <span className="text-emerald-400">$</span>{ride.fare.toFixed(2)}
          </p>
        </div>
        </div>
      </Card>
    </div>
  );
}
