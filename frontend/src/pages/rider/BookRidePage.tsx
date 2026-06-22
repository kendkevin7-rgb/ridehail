import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRide } from '../../contexts/RideContext';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Modal } from '../../components/ui/Modal';
import { RideStatusCard } from '../../components/shared/RideStatusCard';
import { RideStatus, Location } from '../../types';
import clsx from 'clsx';
import { getErrorMessage } from '../../services/api';

type BookingStep = 'form' | 'searching' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'error';

const SEARCH_TIMEOUT_MS = 30000;

const PinIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const FlagIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
  </svg>
);

const statusTimeline = [
  { key: 'accepted', label: 'Driver Accepted' },
  { key: 'arrived', label: 'Driver Arrived' },
  { key: 'in_progress', label: 'On the Way' },
  { key: 'completed', label: 'Completed' },
];

export function BookRidePage() {
  const { activeRide, nearbyDrivers, requestRide, cancelRide } = useRide();
  const { latitude, longitude, isLoading: locLoading, error: locError, requestLocation } = useGeolocation();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [pickupError, setPickupError] = useState<string | null>(null);
  const [dropoffError, setDropoffError] = useState<string | null>(null);
  const [step, setStep] = useState<BookingStep>('form');
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showNoDrivers, setShowNoDrivers] = useState(false);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepRef = useRef(step);
  stepRef.current = step;

  const syncStepFromRide = useCallback(() => {
    if (!activeRide) {
      setStep('form');
      return;
    }
    switch (activeRide.status) {
      case RideStatus.PENDING:
        setStep('searching');
        break;
      case RideStatus.ACCEPTED:
      case RideStatus.ARRIVED:
        setStep('accepted');
        break;
      case RideStatus.IN_PROGRESS:
        setStep('in_progress');
        break;
      case RideStatus.COMPLETED:
        setStep('completed');
        break;
      case RideStatus.CANCELLED:
        setStep('cancelled');
        break;
    }
  }, [activeRide]);

  useEffect(() => {
    syncStepFromRide();
  }, [syncStepFromRide]);

  useEffect(() => {
    if (step === 'searching') {
      searchTimeoutRef.current = setTimeout(() => {
        if (stepRef.current === 'searching') {
          setShowNoDrivers(true);
        }
      }, SEARCH_TIMEOUT_MS);
    } else {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
      setShowNoDrivers(false);
    }
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [step]);

  const handleUseCurrentLocation = () => {
    requestLocation();
  };

  useEffect(() => {
    if (latitude && longitude) {
      setPickupAddress(`Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
      setPickupError(null);
    }
  }, [latitude, longitude]);

  const validateForm = (): boolean => {
    let valid = true;
    if (!pickupAddress.trim()) {
      setPickupError('Pickup location is required');
      valid = false;
    } else {
      setPickupError(null);
    }
    if (!dropoffAddress.trim()) {
      setDropoffError('Dropoff location is required');
      valid = false;
    } else {
      setDropoffError(null);
    }
    return valid;
  };

  const getLocationFromAddress = (address: string): Location => ({
    lat: latitude ?? 0,
    lng: longitude ?? 0,
    address: address.trim(),
  });

  const handleFindRide = async () => {
    if (!validateForm()) return;
    setError(null);
    setStep('searching');
    try {
      await requestRide(getLocationFromAddress(pickupAddress), getLocationFromAddress(dropoffAddress));
    } catch (e) {
      setError(getErrorMessage(e, 'Failed to find a ride'));
      setStep('error');
    }
  };

  const handleCancelRide = async () => {
    if (!activeRide) return;
    setCancelling(true);
    try {
      await cancelRide(activeRide.id);
      showToast('Ride cancelled', 'info');
    } catch (e) {
      setError(getErrorMessage(e, 'Failed to cancel ride'));
    } finally {
      setCancelling(false);
      setShowCancelModal(false);
    }
  };

  const handleBookAnother = () => {
    setStep('form');
    setPickupAddress('');
    setDropoffAddress('');
    setError(null);
    setShowNoDrivers(false);
  };

  const renderDriverInfo = () => {
    if (!activeRide?.driver) return null;
    const { driver } = activeRide;
    return (
      <div className="glass rounded-3xl p-5 space-y-4 animate-scale-in">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/20">
            <span className="text-2xl font-bold text-white">
              {driver.full_name.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-surface-900 font-display truncate">{driver.full_name}</p>
            {driver.vehicle && (
              <p className="text-sm text-surface-500 mt-0.5">
                {driver.vehicle.color} {driver.vehicle.make} {driver.vehicle.model} &middot; {driver.vehicle.plate_number}
              </p>
            )}
            <div className="flex items-center gap-1 mt-1.5">
              <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-medium text-surface-700">{driver.rating.toFixed(1)}</span>
              <span className="text-xs text-surface-400 ml-2">{activeRide.distance.toFixed(1)} km away</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-surface-400 font-medium">ETA</p>
            <p className="font-bold text-2xl text-surface-900 font-display">{activeRide.duration}</p>
            <p className="text-xs text-surface-400">min</p>
          </div>
        </div>
      </div>
    );
  };

  const renderFareEstimate = () => {
    if (!activeRide) return null;
    return (
      <div className="flex items-center justify-between glass rounded-2xl px-5 py-4">
        <span className="text-sm text-surface-500">Estimated fare</span>
        <span className="text-xl font-bold text-surface-900 font-display">${activeRide.fare.toFixed(2)}</span>
      </div>
    );
  };

  const renderForm = () => (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-display font-bold text-surface-900">Book a Ride</h1>
        <p className="text-sm text-surface-500 mt-1">Enter your trip details</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-1 pt-3">
            <div className="w-3.5 h-3.5 rounded-full bg-brand-500 shrink-0 ring-4 ring-brand-100" />
            <div className="w-0.5 h-12 bg-gradient-to-b from-brand-300 to-surface-300" />
            <div className="w-3.5 h-3.5 rounded-full bg-red-500 shrink-0 ring-4 ring-red-100" />
          </div>
          <div className="flex-1 space-y-4">
            <Input
              label="Pickup Location"
              value={pickupAddress}
              onChange={(e) => { setPickupAddress(e.target.value); setPickupError(null); }}
              error={pickupError || undefined}
              placeholder="Enter pickup address"
              fullWidth
              disabled={step !== 'form'}
              icon={<PinIcon />}
            />
            <Input
              label="Dropoff Location"
              value={dropoffAddress}
              onChange={(e) => { setDropoffAddress(e.target.value); setDropoffError(null); }}
              error={dropoffError || undefined}
              placeholder="Enter destination"
              fullWidth
              disabled={step !== 'form'}
              icon={<FlagIcon />}
            />
          </div>
        </div>

        <button
          onClick={handleUseCurrentLocation}
          disabled={locLoading || step !== 'form'}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl glass text-sm font-medium text-brand-600 hover:bg-brand-50 disabled:opacity-50 transition-all duration-200"
        >
          {locLoading ? (
            <Spinner size="sm" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
          Use current location
        </button>

        {locError && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {locError}
          </p>
        )}
      </div>

      <div className="gradient-brand rounded-3xl h-48 flex items-center justify-center bg-mesh shadow-lg shadow-brand-500/10">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <p className="text-white/80 text-sm font-medium">Map will be displayed here</p>
          {pickupAddress && <p className="text-white/50 text-xs mt-1">Pickup: {pickupAddress}</p>}
          {dropoffAddress && <p className="text-white/50 text-xs">Dropoff: {dropoffAddress}</p>}
        </div>
      </div>

      <Button variant="primary" size="lg" fullWidth onClick={handleFindRide}>
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Find a Ride
      </Button>
    </div>
  );

  const renderSearching = () => {
    const driverCount = nearbyDrivers?.length ?? 0;

    if (showNoDrivers) {
      return (
        <div className="animate-fade-up">
          <EmptyState
            icon={
              <div className="w-20 h-20 rounded-full gradient-warm flex items-center justify-center shadow-lg shadow-orange-500/20">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
              </div>
            }
            title="No nearby drivers"
            description="We couldn't find any available drivers nearby. Please try again."
            action={{ label: 'Try Again', onClick: () => { setShowNoDrivers(false); setStep('form'); } }}
          />
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-fade-up">
        <div className="text-center py-8">
          <div className="w-20 h-20 rounded-full gradient-brand flex items-center justify-center mx-auto animate-float shadow-lg shadow-brand-500/20">
            <svg className="w-10 h-10 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-surface-900 mt-6 font-display">Finding nearby drivers...</h2>
          <p className="text-sm text-surface-500 mt-2">Please wait while we match you with a driver</p>
          {driverCount > 0 && (
            <span className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-full bg-brand-50 text-brand-700 text-sm font-medium">
              <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
              {driverCount} driver{driverCount !== 1 ? 's' : ''} nearby
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div className="skeleton h-20 rounded-3xl" />
          <div className="skeleton h-20 rounded-3xl" />
          <div className="skeleton h-20 rounded-3xl" />
        </div>

        <Card className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-500 mt-2 shrink-0 ring-2 ring-brand-100" />
            <div>
              <p className="text-xs text-surface-400 font-medium uppercase tracking-wider">Pickup</p>
              <p className="text-sm font-semibold text-surface-900">{pickupAddress || activeRide?.pickup_location?.address || '...'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-2 shrink-0 ring-2 ring-red-100" />
            <div>
              <p className="text-xs text-surface-400 font-medium uppercase tracking-wider">Dropoff</p>
              <p className="text-sm font-semibold text-surface-900">{dropoffAddress || activeRide?.dropoff_location?.address || '...'}</p>
            </div>
          </div>
        </Card>

        <Button
          variant="danger"
          size="md"
          fullWidth
          onClick={() => setShowCancelModal(true)}
        >
          Cancel Request
        </Button>
      </div>
    );
  };

  const renderAccepted = () => (
    <div className="space-y-6 animate-fade-up">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full gradient-success flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20 animate-scale-in">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-surface-900 font-display">Driver Accepted!</h2>
        <p className="text-sm text-surface-500 mt-1">Your driver is on the way</p>
      </div>

      {renderDriverInfo()}
      {renderFareEstimate()}

      {/* Status Timeline */}
      <div className="glass rounded-3xl p-5">
        <h3 className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-4">Trip Progress</h3>
        <div className="space-y-4">
          {statusTimeline.map((item, i) => {
            const isActive = item.key === 'accepted' || item.key === 'arrived';
            const isCurrent = item.key === 'arrived';
            return (
              <div key={item.key} className="flex items-center gap-3">
                <div className={clsx(
                  'w-3 h-3 rounded-full shrink-0 ring-4 transition-all duration-300',
                  isActive ? 'bg-emerald-500 ring-emerald-100' : 'bg-surface-200 ring-surface-100'
                )}>
                  {isCurrent && <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping absolute" />}
                </div>
                <span className={clsx(
                  'text-sm font-medium transition-colors duration-300',
                  isActive ? 'text-surface-900' : 'text-surface-400'
                )}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <RideStatusCard ride={activeRide!} />

      <div className="flex gap-3">
        <Button
          variant="secondary"
          fullWidth
          onClick={() => navigate('/rider/history')}
        >
          View Details
        </Button>
        <Button
          variant="danger"
          fullWidth
          onClick={() => setShowCancelModal(true)}
        >
          Cancel Ride
        </Button>
      </div>
    </div>
  );

  const renderInProgress = () => (
    <div className="space-y-6 animate-fade-up">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full gradient-brand flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/20 animate-float">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-surface-900 font-display">On Your Way</h2>
        <p className="text-sm text-surface-500 mt-1">Your ride is in progress</p>
      </div>

      {renderDriverInfo()}
      {renderFareEstimate()}

      <div className="gradient-brand rounded-3xl h-48 flex items-center justify-center bg-mesh shadow-lg shadow-brand-500/10">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <p className="text-white/80 text-sm font-medium">Live tracking map</p>
          <p className="text-white/50 text-xs mt-1">Status: {activeRide?.status.replace('_', ' ')}</p>
        </div>
      </div>

      <RideStatusCard ride={activeRide!} />
    </div>
  );

  const renderCompleted = () => (
    <div className="animate-scale-in">
      <EmptyState
        icon={
          <div className="w-20 h-20 rounded-full gradient-success flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        }
        title="Trip Completed!"
        description={activeRide ? `Your trip cost $${activeRide.fare.toFixed(2)}. Thank you for riding with us!` : 'Your trip has been completed.'}
        action={{ label: 'Book Another Ride', onClick: handleBookAnother }}
      />
    </div>
  );

  const renderCancelled = () => (
    <div className="animate-scale-in">
      <EmptyState
        icon={
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        }
        title="Ride Cancelled"
        description="Your ride has been cancelled. If you were charged, the amount will be refunded."
        action={{ label: 'Book Again', onClick: handleBookAnother }}
      />
    </div>
  );

  const renderError = () => (
    <ErrorState
      message={error || 'Something went wrong. Please try again.'}
      onRetry={handleFindRide}
    />
  );

  const renderStep = () => {
    switch (step) {
      case 'form':
        return renderForm();
      case 'searching':
        return renderSearching();
      case 'accepted':
        return renderAccepted();
      case 'in_progress':
        return renderInProgress();
      case 'completed':
        return renderCompleted();
      case 'cancelled':
        return renderCancelled();
      case 'error':
        return renderError();
    }
  };

  return (
    <div className="space-y-6">
      {renderStep()}

      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
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
            <Button variant="secondary" fullWidth onClick={() => setShowCancelModal(false)}>
              Keep Ride
            </Button>
            <Button variant="danger" fullWidth loading={cancelling} onClick={handleCancelRide}>
              Yes, Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

