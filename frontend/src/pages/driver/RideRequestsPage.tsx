import { useEffect, useState, useCallback } from 'react';
import { RideStatus } from '../../types';
import { useRide } from '../../contexts/RideContext';
import { useDriver } from '../../contexts/DriverContext';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';

export default function RideRequestsPage() {
  const { activeRide, rideHistory, isLoading, fetchHistory, setActiveRide } = useRide();
  const { isOnline } = useDriver();
  const { showToast } = useToast();

  const [pageError, setPageError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await fetchHistory();
      } catch {
        setPageError('Failed to load ride requests');
      }
    };
    init();
  }, []);

  const pendingRequests = rideHistory.filter(
    (r) => r.status === RideStatus.PENDING && !r.driver_id,
  );
  const hasActiveRide =
    activeRide !== null &&
    activeRide.status !== RideStatus.COMPLETED &&
    activeRide.status !== RideStatus.CANCELLED;

  const handleAccept = useCallback(
    async (rideId: string) => {
      setAcceptingId(rideId);
      try {
        const ride = rideHistory.find((r) => r.id === rideId);
        if (ride) {
          setActiveRide({ ...ride, status: RideStatus.ACCEPTED });
          showToast('Ride accepted! Navigate to the pickup location.', 'success');
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to accept ride';
        showToast(message, 'error');
      } finally {
        setAcceptingId(null);
      }
    },
    [rideHistory, setActiveRide, showToast],
  );

  const handleDecline = useCallback(
    async (rideId: string) => {
      setDecliningId(rideId);
      try {
        showToast('Ride request declined', 'info');
      } catch {
        // no-op
      } finally {
        setDecliningId(null);
      }
    },
    [showToast],
  );

  if (isLoading && rideHistory.length === 0) {
    return (
      <div className="animate-fade-up space-y-4 p-4 max-w-2xl mx-auto">
        <div className="skeleton h-10 w-48 rounded-lg" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-32 w-full rounded-2xl" />
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

  if (hasActiveRide) {
    return (
      <div className="animate-fade-up space-y-5 p-4 md:p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-display font-bold text-white">Ride Requests</h1>
        <Card className="relative overflow-hidden !p-0">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 gradient-brand" />
          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-500/20 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-display font-semibold text-white">You're on a ride</p>
                <p className="text-sm text-surface-400">Complete your current ride before accepting new requests.</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-surface-700 space-y-2">
              <p className="text-sm text-surface-400 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {activeRide.pickup_location.address}
              </p>
              <p className="text-sm text-surface-400 flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {activeRide.dropoff_location.address}
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-5 p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-white">Ride Requests</h1>
        <div className="flex items-center gap-2">
          {!isOnline && (
            <span className="badge badge-warning text-xs">Offline</span>
          )}
          {pendingRequests.length > 0 && (
            <span className="badge badge-error text-xs">{pendingRequests.length} new</span>
          )}
        </div>
      </div>

      {!isOnline && pendingRequests.length === 0 && (
        <EmptyState
          icon={
            <svg className="w-14 h-14 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          }
          title="You're offline"
          description="Go online to start receiving ride requests."
        />
      )}

      {isOnline && pendingRequests.length === 0 && (
        <EmptyState
          icon={
            <svg className="w-14 h-14 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
          title="No requests right now"
          description="Waiting for incoming ride requests. They'll appear here automatically."
        />
      )}

      {pendingRequests.length > 0 && (
        <div className="space-y-4">
          {pendingRequests.map((request, index) => (
            <Card key={request.id} className="relative overflow-hidden !p-0 animate-fade-up">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 gradient-warm" />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">
                        {request.rider?.full_name || 'Rider'}
                      </p>
                      {index === 0 && (
                        <span className="badge badge-warning text-[10px] px-1.5 py-0.5">New Request</span>
                      )}
                    </div>
                    <p className="text-xs text-surface-400 mt-1 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {request.pickup_location.address}
                    </p>
                  </div>
                  <span className="text-xs text-surface-500 shrink-0 ml-3">
                    {new Date(request.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-5 text-sm mb-4">
                  <span className="flex items-center gap-1.5 text-surface-300">
                    <svg className="w-4 h-4 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    {request.distance.toFixed(1)} mi
                  </span>
                  <span className="flex items-center gap-1.5 font-display font-bold text-lg text-white">
                    <span className="text-brand-400">$</span>
                    {request.fare.toFixed(2)}
                  </span>
                  <span className="flex items-center gap-1.5 text-surface-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {request.duration} min
                  </span>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={() => handleAccept(request.id)}
                    loading={acceptingId === request.id}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth
                    onClick={() => handleDecline(request.id)}
                    loading={decliningId === request.id}
                    className="!text-red-400 hover:!text-red-300 !bg-red-500/10 hover:!bg-red-500/20"
                  >
                    Decline
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
