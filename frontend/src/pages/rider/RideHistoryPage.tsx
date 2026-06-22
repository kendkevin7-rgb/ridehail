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

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (initialLoad && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && allRides.length === 0 && !isLoading) {
    return <ErrorState message={error} onRetry={handleRefresh} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ride History</h1>
          <p className="text-sm text-gray-500 mt-1">View your past trips</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 underline text-xs">
            Dismiss
          </button>
        </div>
      )}

      {allRides.length > 0 ? (
        <div className="space-y-4">
          {allRides.map((ride) => (
            <div key={ride.id} className="space-y-1">
              <p className="text-xs text-gray-400 px-1">{formatDate(ride.created_at)}</p>
              <RideStatusCard ride={ride} />
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
            <p className="text-center text-sm text-gray-400 py-4">
              You've reached the end of your ride history
            </p>
          )}
        </div>
      ) : (
        !initialLoad && !isLoading && (
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="No rides yet"
            description="You haven't taken any rides yet. Book your first ride to get started."
            action={{
              label: 'Book Your First Ride',
              onClick: () => navigate('/rider/book'),
            }}
          />
        )
      )}
    </div>
  );
}
