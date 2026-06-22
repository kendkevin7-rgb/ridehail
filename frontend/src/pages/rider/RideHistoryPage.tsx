import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRide } from '../../contexts/RideContext';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { RideStatusCard } from '../../components/shared/RideStatusCard';
import { PaginatedResponse, Ride } from '../../types';
import { get, getErrorMessage } from '../../services/api';

const PAGE_LIMIT = 10;

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function groupRidesByDate(rides: Ride[]): Map<string, Ride[]> {
  const groups = new Map<string, Ride[]>();
  for (const ride of rides) {
    const key = formatDateGroup(ride.created_at);
    const existing = groups.get(key) || [];
    existing.push(ride);
    groups.set(key, existing);
  }
  return groups;
}

function SkeletonCard() {
  return (
    <div className="glass rounded-3xl p-5 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="skeleton h-6 w-20 rounded-full" />
        <div className="skeleton h-6 w-16 rounded-lg" />
      </div>
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <div className="skeleton w-2 h-2 rounded-full mt-2 shrink-0" />
          <div className="skeleton h-4 w-3/4 rounded-lg" />
        </div>
        <div className="flex items-start gap-2">
          <div className="skeleton w-2 h-2 rounded-full mt-2 shrink-0" />
          <div className="skeleton h-4 w-2/3 rounded-lg" />
        </div>
      </div>
      <div className="skeleton h-4 w-1/3 rounded-lg" />
    </div>
  );
}

export function RideHistoryPage() {
  const { rideHistory, fetchHistory, isLoading } = useRide();
  const navigate = useNavigate();

  const [allRides, setAllRides] = useState<Ride[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        await fetchHistory(1);
      } catch (e) {
        setError(getErrorMessage(e, 'Failed to load ride history'));
      } finally {
        setInitialLoad(false);
      }
    };
    load();
  }, [fetchHistory]);

  useEffect(() => {
    if (rideHistory.length > 0) {
      setAllRides(rideHistory);
      setPage(1);
    }
  }, [rideHistory]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      await fetchHistory(1);
    } catch (e) {
      setError(getErrorMessage(e, 'Failed to refresh'));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    setError(null);
    try {
      const nextPage = page + 1;
      const result = await get<PaginatedResponse<Ride>>('/rides', { page: nextPage, limit: PAGE_LIMIT });
      if (result.data.length === 0) {
        setHasMore(false);
      } else {
        setAllRides((prev) => [...prev, ...result.data]);
        setPage(nextPage);
      }
    } catch (e) {
      setError(getErrorMessage(e, 'Failed to load more rides'));
    } finally {
      setLoadingMore(false);
    }
  };

  if (initialLoad && isLoading) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-surface-900">Your Rides</h1>
            <p className="text-sm text-surface-500 mt-1">View your past trips</p>
          </div>
        </div>
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error && allRides.length === 0 && !isLoading) {
    return <ErrorState message={error} onRetry={handleRefresh} />;
  }

  const rideGroups = groupRidesByDate(allRides);

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-surface-900">Your Rides</h1>
          <p className="text-sm text-surface-500 mt-1">View your past trips</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2.5 text-surface-400 hover:text-brand-600 transition-colors rounded-xl hover:bg-brand-50"
          aria-label="Refresh"
        >
          <svg
            className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {error && allRides.length > 0 && (
        <div className="p-4 glass-strong rounded-2xl border border-red-200/50 bg-red-50/80 text-sm flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 underline text-xs font-medium">
            Dismiss
          </button>
        </div>
      )}

      {allRides.length > 0 ? (
        <div className="space-y-6">
          {Array.from(rideGroups.entries()).map(([dateLabel, rides]) => (
            <div key={dateLabel} className="space-y-2">
              <div className="flex items-center gap-3">
                <h3 className="text-xs font-bold text-surface-400 uppercase tracking-wider font-display">
                  {dateLabel}
                </h3>
                <div className="flex-1 h-px bg-surface-200" />
              </div>
              <div className="space-y-3">
                {rides.map((ride, index) => (
                  <div
                    key={ride.id}
                    className="animate-fade-up"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <RideStatusCard ride={ride} />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {hasMore && (
            <div className="pt-2">
              <Button
                variant="secondary"
                fullWidth
                loading={loadingMore}
                onClick={handleLoadMore}
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}

          {!hasMore && allRides.length > 0 && (
            <p className="text-center text-sm text-surface-400 py-4">
              You've reached the end of your ride history
            </p>
          )}
        </div>
      ) : (
        !initialLoad && !isLoading && (
          <div className="animate-scale-in">
            <EmptyState
              icon={
                <div className="w-20 h-20 rounded-full gradient-success flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              }
              title="No rides yet"
              description="You haven't taken any rides yet. Book your first ride to get started."
              action={{
                label: 'Book Your First Ride',
                onClick: () => navigate('/rider/book'),
              }}
            />
          </div>
        )
      )}
    </div>
  );
}
