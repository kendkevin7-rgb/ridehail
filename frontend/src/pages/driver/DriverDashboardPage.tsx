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
      <div className="animate-fade-up flex flex-col gap-4 p-4">
        <div className="skeleton h-10 w-48 rounded-lg" />
        <div className="skeleton h-48 w-full rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-24 w-full rounded-2xl" />
          ))}
        </div>
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

  const hasActiveRide =
    activeRide &&
    activeRide.status !== RideStatus.COMPLETED &&
    activeRide.status !== RideStatus.CANCELLED;

  return (
    <div className="animate-fade-up space-y-5 p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Dashboard</h1>
          <p className="text-sm text-surface-400">
            Welcome back, {profile?.full_name || user?.full_name || 'Driver'}
          </p>
        </div>
        <div
          className={clsx(
            'flex items-center gap-3 px-5 py-2.5 rounded-full transition-all duration-300 cursor-pointer select-none',
            isOnline
              ? 'gradient-brand shadow-lg shadow-brand-500/30'
              : 'bg-surface-800 hover:bg-surface-700',
          )}
          onClick={handleToggleOnline}
        >
          <span
            className={clsx(
              'w-3 h-3 rounded-full',
              isOnline
                ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse-slow'
                : 'bg-surface-400',
            )}
          />
          <span className={clsx('text-sm font-semibold', isOnline ? 'text-white' : 'text-surface-300')}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {hasActiveRide ? (
        <Card className="relative overflow-hidden !p-0">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 gradient-brand" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-white">Active Ride</h3>
              <span className="badge badge-info capitalize text-xs">
                {activeRide.status.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-surface-400">Pickup</p>
                  <p className="text-sm font-medium text-white">{activeRide.pickup_location.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-amber-500/20 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-surface-400">Dropoff</p>
                  <p className="text-sm font-medium text-white">{activeRide.dropoff_location.address}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-surface-700 flex items-center justify-between text-sm">
              <span className="text-surface-400">ETA: ~{activeRide.duration} min</span>
              <span className="font-semibold text-white text-gradient">${activeRide.fare.toFixed(2)}</span>
            </div>
          </div>
        </Card>
      ) : isOnline ? (
        <Card className="!p-8 text-center">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 mb-5 text-brand-400 animate-float">
              <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
                <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" strokeDasharray="8 4" opacity="0.3" />
                <path d="M30 55 L45 35 L55 35 L70 55 L65 60 L55 50 L45 50 L35 60 Z" fill="currentColor" opacity="0.8" />
                <circle cx="38" cy="62" r="5" fill="currentColor" opacity="0.6" />
                <circle cx="62" cy="62" r="5" fill="currentColor" opacity="0.6" />
              </svg>
            </div>
            <h2 className="font-display text-xl font-bold text-white mb-2">Waiting for ride requests...</h2>
            <p className="text-surface-400 text-sm mb-1">Your car is ready. We'll notify you when a ride comes in.</p>
            <span className="inline-flex items-center gap-2 mt-3 text-emerald-400 text-xs animate-pulse-slow">
              <span className="w-2 h-2 bg-emerald-400 rounded-full" />
              Listening for requests
            </span>
          </div>
        </Card>
      ) : (
        <Card className="!p-8 text-center">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 mb-5 text-surface-500">
              <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
                <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" strokeDasharray="8 4" />
                <path d="M35 40 L50 30 L65 40 L55 45 L50 40 L45 45 Z" fill="currentColor" opacity="0.5" />
              </svg>
            </div>
            <h2 className="font-display text-xl font-bold text-white mb-2">You're Offline</h2>
            <p className="text-surface-400 text-sm">Go online to start earning and receive ride requests.</p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="!p-4 text-center">
          <p className="text-xs text-surface-400 mb-1 font-medium">Today's Earnings</p>
          <p className="text-2xl font-display font-bold text-white">${stats.earningsToday.toFixed(2)}</p>
        </Card>
        <Card className="!p-4 text-center">
          <p className="text-xs text-surface-400 mb-1 font-medium">Rides</p>
          <p className="text-2xl font-display font-bold text-white">{stats.rideCount}</p>
        </Card>
        <Card className="!p-4 text-center">
          <p className="text-xs text-surface-400 mb-1 font-medium">Rating</p>
          <p className="text-2xl font-display font-bold text-white">
            {stats.rating > 0 ? (
              <span className="flex items-center justify-center gap-1">
                {stats.rating.toFixed(1)}
                <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </span>
            ) : '—'}
          </p>
        </Card>
        <Card className="!p-4 text-center">
          <p className="text-xs text-surface-400 mb-1 font-medium">Online Time</p>
          <p className="text-2xl font-display font-bold text-white">{stats.onlineTime}</p>
        </Card>
      </div>

      <Modal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        title="Location Required"
        size="sm"
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-sm text-surface-400 mb-6">
            You need to allow location access to go online. Your location helps us find nearby ride requests.
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
