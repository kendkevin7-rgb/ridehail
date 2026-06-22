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

  if (hasActiveRide) {
    return (
      <div className="space-y-6 p-4 md:p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">Ride Requests</h1>
        <Card className="!p-6 border-l-4 border-l-primary-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">You have an active ride</p>
              <p className="text-sm text-gray-500">
                Complete your current ride before accepting new requests.
              </p>
            </div>
          </div>
          {activeRide && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Pickup: {activeRide.pickup_location.address}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Dropoff: {activeRide.dropoff_location.address}
              </p>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ride Requests</h1>
        {!isOnline && (
          <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Offline
          </span>
        )}
      </div>

      {pendingRequests.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          }
          title="No ride requests"
          description={
            isOnline
              ? 'Waiting for incoming ride requests. They will appear here automatically.'
              : 'Go online to start receiving ride requests.'
          }
        />
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((request) => (
            <Card key={request.id} className="!p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {request.rider?.full_name || 'Rider'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {request.pickup_location.address}
                  </p>
                </div>
                <span className="text-xs text-gray-500 shrink-0 ml-3">
                  {new Date(request.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {request.distance.toFixed(1)} mi
                </span>
                <span className="flex items-center gap-1 font-semibold text-gray-900">
                  ${request.fare.toFixed(2)}
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
                >
                  Decline
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
