import { Ride, RideStatus } from '../../types';
import { Button } from '../ui/Button';
import clsx from 'clsx';

interface RideStatusCardProps {
  ride: Ride;
  onTrack?: (rideId: string) => void;
  onCancel?: (rideId: string) => void;
}

export function RideStatusCard({ ride, onTrack, onCancel }: RideStatusCardProps) {
  const statusLabels: Record<RideStatus, string> = {
    [RideStatus.PENDING]: 'Pending',
    [RideStatus.ACCEPTED]: 'Accepted',
    [RideStatus.ARRIVED]: 'Arrived',
    [RideStatus.IN_PROGRESS]: 'In Progress',
    [RideStatus.COMPLETED]: 'Completed',
    [RideStatus.CANCELLED]: 'Cancelled',
  };

  const statusBadge: Record<RideStatus, string> = {
    [RideStatus.PENDING]: 'badge-warning',
    [RideStatus.ACCEPTED]: 'badge-info',
    [RideStatus.ARRIVED]: 'badge-success',
    [RideStatus.IN_PROGRESS]: 'badge-success',
    [RideStatus.COMPLETED]: 'badge bg-surface-100 text-surface-600',
    [RideStatus.CANCELLED]: 'badge-error',
  };

  const statusIcon: Record<RideStatus, React.ReactNode> = {
    [RideStatus.PENDING]: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    [RideStatus.ACCEPTED]: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    [RideStatus.ARRIVED]: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
      </svg>
    ),
    [RideStatus.IN_PROGRESS]: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    [RideStatus.COMPLETED]: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    [RideStatus.CANCELLED]: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  };

  const canCancel = ride.status === RideStatus.PENDING || ride.status === RideStatus.ACCEPTED;
  const canTrack = ride.status === RideStatus.IN_PROGRESS;

  return (
    <div className="glass rounded-3xl p-5 space-y-4 animate-fade-up shadow-soft">
      <div className="flex items-center justify-between">
        <span className={clsx('flex items-center gap-1.5', statusBadge[ride.status])}>
          {statusIcon[ride.status]}
          {statusLabels[ride.status]}
        </span>
        <span className="text-xl font-display font-bold text-surface-900">${ride.fare.toFixed(2)}</span>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-0.5 mt-0.5">
            <div className="w-2.5 h-2.5 rounded-full bg-brand-500 ring-2 ring-brand-100" />
            <div className="w-0.5 h-8 bg-gradient-to-b from-brand-300 to-surface-200" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
          </div>
          <div className="flex-1 space-y-5">
            <div>
              <p className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider">Pickup</p>
              <p className="text-sm font-medium text-surface-800 mt-0.5">{ride.pickup_location.address}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider">Dropoff</p>
              <p className="text-sm font-medium text-surface-800 mt-0.5">{ride.dropoff_location.address}</p>
            </div>
          </div>
        </div>
      </div>

      {ride.driver && (
        <div className="flex items-center gap-3 pt-3 border-t border-surface-100">
          <div className="w-11 h-11 rounded-full gradient-brand flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-md shadow-brand-500/25">
            {ride.driver.full_name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-surface-900 truncate">{ride.driver.full_name}</p>
            {ride.driver.vehicle && (
              <p className="text-xs text-surface-400 truncate">{ride.driver.vehicle.color} {ride.driver.vehicle.make} {ride.driver.vehicle.model}</p>
            )}
          </div>
          {ride.driver.rating > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-semibold text-surface-700">{ride.driver.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-surface-400 pt-1">
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {ride.distance.toFixed(1)} km
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {ride.duration} min
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        {canTrack && onTrack && (
          <Button variant="primary" size="md" fullWidth onClick={() => onTrack(ride.id)}>
            Track Ride
          </Button>
        )}
        {canCancel && onCancel && (
          <Button variant="danger" size="md" fullWidth onClick={() => onCancel(ride.id)}>
            Cancel Ride
          </Button>
        )}
      </div>
    </div>
  );
}
