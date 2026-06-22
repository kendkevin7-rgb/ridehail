import { useEffect, useState, useMemo, useCallback } from 'react';
import { RideStatus } from '../../types';
import type { Ride } from '../../types';
import { useRide } from '../../contexts/RideContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';

type Period = 'today' | 'week' | 'month';

const PERIOD_TABS: { key: Period; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (pageError) {
    return (
      <ErrorState message={pageError} onRetry={() => window.location.reload()} />
    );
  }

  if (completedRides.length === 0) {
    return (
      <div className="space-y-6 p-4 md:p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
        <div className="grid grid-cols-3 gap-4">
          <SummaryCard label="Today" amount={0} />
          <SummaryCard label="This Week" amount={0} />
          <SummaryCard label="This Month" amount={0} />
        </div>
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          title="No earnings yet"
          description="Complete rides to see your earnings."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>

      <div className="grid grid-cols-3 gap-4">
        <SummaryCard label="Today" amount={summaries.today} />
        <SummaryCard label="This Week" amount={summaries.week} />
        <SummaryCard label="This Month" amount={summaries.month} />
      </div>

      <div className="flex gap-2">
        {PERIOD_TABS.map((tab) => (
          <Button
            key={tab.key}
            variant={activePeriod === tab.key ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => handleFilterChange(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {filteredRides.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          }
          title="No rides in this period"
          description="No completed rides found for the selected period."
        />
      ) : (
        <div className="space-y-3">
          {filteredRides.map((ride) => (
            <EarningsRow key={ride.id} ride={ride} />
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, amount }: { label: string; amount: number }) {
  return (
    <Card className="!p-4 text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-gray-900">${amount.toFixed(2)}</p>
    </Card>
  );
}

function EarningsRow({ ride }: { ride: Ride }) {
  const date = ride.completed_at
    ? new Date(ride.completed_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

  return (
    <Card className="!p-4">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 truncate">
            {ride.pickup_location.address} → {ride.dropoff_location.address}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {date} &middot; {ride.distance.toFixed(1)} mi &middot;{' '}
            {ride.duration} min
          </p>
        </div>
        <p className="text-base font-bold text-gray-900 shrink-0 ml-4">
          ${ride.fare.toFixed(2)}
        </p>
      </div>
    </Card>
  );
}
