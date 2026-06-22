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
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-surface-900">
            Welcome, {user?.full_name?.split(' ')[0] || 'Rider'}
          </h1>
          <p className="text-sm text-surface-500 mt-1">Where are you going today?</p>
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

      {error && (
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

      {/* Active Ride */}
      {activeRide && (
        <section className="animate-scale-in">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xs font-bold text-surface-500 uppercase tracking-wider font-display">
              Current Ride
            </h2>
          </div>
          <RideStatusCard
            ride={activeRide}
            onTrack={(id) => navigate(`/rider/book`)}
            onCancel={handleCancelClick}
          />
        </section>
      )}

      {/* Quick Stats */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-xs font-bold text-surface-500 uppercase tracking-wider font-display">
            Quick Actions
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Card hoverable onClick={() => navigate('/rider/book')} className="text-center py-6 group">
            <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-3 shadow-md shadow-brand-500/20 group-hover:scale-110 transition-transform duration-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-sm font-bold text-surface-900 font-display">Quick Book</p>
            <p className="text-xs text-surface-400 mt-1">Go anywhere</p>
          </Card>

          <Card hoverable onClick={() => navigate('/rider/history')} className="text-center py-6 group">
            <div className="w-12 h-12 rounded-2xl gradient-success flex items-center justify-center mx-auto mb-3 shadow-md shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-bold text-surface-900 font-display">My Rides</p>
            <p className="text-xs text-surface-400 mt-1">View history</p>
          </Card>

          <Card hoverable onClick={() => navigate('/rider/payments')} className="text-center py-6 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 flex items-center justify-center mx-auto mb-3 shadow-md shadow-orange-500/20 group-hover:scale-110 transition-transform duration-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <p className="text-sm font-bold text-surface-900 font-display">Payments</p>
            <p className="text-xs text-surface-400 mt-1">Manage methods</p>
          </Card>

          <Card hoverable onClick={() => navigate('/rider/profile')} className="text-center py-6 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-600 flex items-center justify-center mx-auto mb-3 shadow-md shadow-purple-500/20 group-hover:scale-110 transition-transform duration-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-sm font-bold text-surface-900 font-display">Profile</p>
            <p className="text-xs text-surface-400 mt-1">Your account</p>
          </Card>
        </div>
      </section>

      {/* Recent Rides */}
      {hasRecentRides && (
        <section className="animate-fade-up">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-xs font-bold text-surface-500 uppercase tracking-wider font-display">
              Recent Rides
            </h2>
          </div>
          <div className="space-y-3">
            {rideHistory.slice(0, 3).map((ride) => (
              <RideStatusCard key={ride.id} ride={ride} />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {!activeRide && !hasRecentRides && !error && (
        <div className="animate-scale-in">
          <EmptyState
            icon={
              <div className="w-20 h-20 rounded-full gradient-warm flex items-center justify-center shadow-lg shadow-orange-500/20">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            }
            title="Ready to ride?"
            description="Book your first ride and we'll take you wherever you need to go."
            action={{ label: 'Book a Ride', onClick: () => navigate('/rider/book') }}
          />
        </div>
      )}

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => { setShowCancelModal(false); setCancelTargetId(null); }}
        title="Cancel Ride"
        size="sm"
      >
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-surface-600 mb-6">
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
        </div>
      </Modal>
    </div>
  );
}
