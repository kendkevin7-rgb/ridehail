import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRide } from '../../contexts/RideContext';
import { RideStatusCard } from '../../components/shared/RideStatusCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Modal } from '../../components/ui/Modal';
import { getErrorMessage } from '../../services/api';

export function HomePage() {
  const { user } = useAuth();
  const { activeRide, rideHistory, fetchHistory, isLoading, cancelRide } = useRide();
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        await fetchHistory(1);
      } catch (e) {
        setError(getErrorMessage(e, 'Failed to load data'));
      } finally {
        setInitialLoad(false);
      }
    };
    load();
  }, [fetchHistory]);

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

  const handleCancelClick = (rideId: string) => {
    setCancelTargetId(rideId);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelTargetId) return;
    setCancellingId(cancelTargetId);
    try {
      await cancelRide(cancelTargetId);
    } catch (e) {
      setError(getErrorMessage(e, 'Failed to cancel ride'));
    } finally {
      setCancellingId(null);
      setShowCancelModal(false);
      setCancelTargetId(null);
    }
  };

  const hasRecentRides = rideHistory.length > 0;

  if (initialLoad && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && !activeRide && !hasRecentRides) {
    return <ErrorState message={error} onRetry={handleRefresh} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {user?.full_name?.split(' ')[0] || 'Rider'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Where are you going today?</p>
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 underline text-xs">
            Dismiss
          </button>
        </div>
      )}

      {activeRide && (
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Current Ride
          </h2>
          <RideStatusCard
            ride={activeRide}
            onTrack={(id) => navigate(`/rider/book`)}
            onCancel={handleCancelClick}
          />
        </section>
      )}

      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Card hoverable onClick={() => navigate('/rider/book')} className="text-center py-6">
            <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-900">Book a Ride</p>
            <p className="text-xs text-gray-500 mt-1">Go anywhere</p>
          </Card>

          <Card hoverable onClick={() => navigate('/rider/history')} className="text-center py-6">
            <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-900">Ride History</p>
            <p className="text-xs text-gray-500 mt-1">View past trips</p>
          </Card>
        </div>
      </section>

      {!activeRide && !hasRecentRides && !error && (
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          title="Ready to ride?"
          description="Book your first ride and we'll take you wherever you need to go."
          action={{ label: 'Book a Ride', onClick: () => navigate('/rider/book') }}
        />
      )}

      <Modal
        isOpen={showCancelModal}
        onClose={() => { setShowCancelModal(false); setCancelTargetId(null); }}
        title="Cancel Ride"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to cancel this ride? You may be charged a cancellation fee.
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => { setShowCancelModal(false); setCancelTargetId(null); }}
          >
            Keep Ride
          </Button>
          <Button
            variant="danger"
            fullWidth
            loading={cancellingId !== null}
            onClick={handleConfirmCancel}
          >
            Yes, Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}
