import { useEffect, useMemo, useState, useCallback } from 'react';
import clsx from 'clsx';
import { RideStatus } from '../../types';
import { useDriver } from '../../contexts/DriverContext';
import { useRide } from '../../contexts/RideContext';
import { useAuth } from '../../contexts/AuthContext';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Modal } from '../../components/ui/Modal';

export default function DriverDashboardPage() {
  const { profile, isOnline, isLoading: driverLoading, toggleOnline } = useDriver();
  const { activeRide, rideHistory, isLoading: rideLoading, fetchHistory } = useRide();
  const { user } = useAuth();
  const { latitude, longitude, isLoading: geoLoading, requestLocation } = useGeolocation();
  const { showToast } = useToast();

  const [pageError, setPageError] = useState<string | null>(null);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await fetchProfile();
        await fetchHistory();
      } catch {
        setPageError('Failed to load dashboard data');
      }
    };
    init();
  }, []);

  const handleToggleOnline = useCallback(async () => {
    if (!isOnline && !latitude && !longitude) {
      setShowLocationModal(true);
      return;
    }
    setTogglingOnline(true);
    try {
      await toggleOnline();
      showToast(
        isOnline ? 'You are now offline' : 'You are now online and accepting rides',
        isOnline ? 'info' : 'success',
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change status';
      showToast(message, 'error');
    } finally {
      setTogglingOnline(false);
    }
  }, [isOnline, latitude, longitude, toggleOnline, showToast]);

  const handleAllowLocation = useCallback(() => {
    requestLocation();
    setShowLocationModal(false);
  }, [requestLocation]);

  const isLoading = driverLoading && !profile;

  const stats = useMemo(() => {
    const completed = rideHistory.filter((r) => r.status === RideStatus.COMPLETED);
    const today = new Date();
    const todayStr = today.toDateString();
    const todayCompleted = completed.filter((r) => {
      if (!r.completed_at) return false;
      return new Date(r.completed_at).toDateString() === todayStr;
    });
    const earningsToday = todayCompleted.reduce((sum, r) => sum + r.fare, 0);
    const totalMinutes = completed.reduce((sum, r) => sum + (r.duration || 0), 0);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return {
      earningsToday,
      rideCount: completed.length,
      rating: profile?.rating ?? 0,
      onlineTime: `${hours}h ${mins}m`,
    };
  }, [rideHistory, profile]);

  if (isLoading) {
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

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Welcome back, {profile?.full_name || user?.full_name || 'Driver'}
          </p>
        </div>
      </div>

      <Card className="!p-6">
        <div className="flex flex-col items-center text-center">
          <div
            className={clsx(
              'w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-all duration-300',
              isOnline ? 'bg-green-100' : 'bg-gray-100',
            )}
          >
            <div
              className={clsx(
                'w-12 h-12 rounded-full transition-all duration-300',
                isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400',
              )}
            />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            {isOnline ? 'You are Online' : 'You are Offline'}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {isOnline
              ? 'Waiting for ride requests...'
              : 'Go online to start receiving ride requests'}
          </p>
          <Button
            variant={isOnline ? 'secondary' : 'primary'}
            size="lg"
            onClick={handleToggleOnline}
            loading={togglingOnline}
          >
            {isOnline ? 'Go Offline' : 'Go Online'}
          </Button>
        </div>
      </Card>

      {activeRide &&
        activeRide.status !== RideStatus.COMPLETED &&
        activeRide.status !== RideStatus.CANCELLED && (
          <Card className="!p-6 border-l-4 border-l-primary-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Active Ride</h3>
              <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-full capitalize">
                {activeRide.status.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pickup</p>
                  <p className="text-sm font-medium text-gray-900">
                    {activeRide.pickup_location.address}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Dropoff</p>
                  <p className="text-sm font-medium text-gray-900">
                    {activeRide.dropoff_location.address}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
              <span className="text-gray-500">ETA: ~{activeRide.duration} min</span>
              <span className="font-semibold text-gray-900">
                ${activeRide.fare.toFixed(2)}
              </span>
            </div>
          </Card>
        )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="!p-4">
          <p className="text-xs text-gray-500 mb-1">Today's Earnings</p>
          <p className="text-xl font-bold text-gray-900">
            ${stats.earningsToday.toFixed(2)}
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-gray-500 mb-1">Rides Completed</p>
          <p className="text-xl font-bold text-gray-900">{stats.rideCount}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-gray-500 mb-1">Rating</p>
          <p className="text-xl font-bold text-gray-900">
            {stats.rating > 0 ? stats.rating.toFixed(1) : '—'}
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-gray-500 mb-1">Online Time</p>
          <p className="text-xl font-bold text-gray-900">{stats.onlineTime}</p>
        </Card>
      </div>

      <Modal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        title="Location Required"
      >
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-6">
            You need to allow location access to go online. Your location helps us
            find nearby ride requests.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={() => setShowLocationModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAllowLocation} loading={geoLoading}>
              Allow Location
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
