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

  const statusColors: Record<RideStatus, string> = {
    [RideStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [RideStatus.ACCEPTED]: 'bg-blue-100 text-blue-800',
    [RideStatus.ARRIVED]: 'bg-green-100 text-green-800',
    [RideStatus.IN_PROGRESS]: 'bg-green-100 text-green-800',
    [RideStatus.COMPLETED]: 'bg-gray-100 text-gray-800',
    [RideStatus.CANCELLED]: 'bg-red-100 text-red-800',
  };

  const canCancel = ride.status === RideStatus.PENDING || ride.status === RideStatus.ACCEPTED;
  const canTrack = ride.status === RideStatus.IN_PROGRESS;

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <span className={clsx('px-3 py-1 rounded-full text-sm font-medium', statusColors[ride.status])}>
          {statusLabels[ride.status]}
        </span>
        <span className="text-lg font-bold text-gray-900">${ride.fare.toFixed(2)}</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 shrink-0" />
          <div>
            <p className="text-sm text-gray-500">Pickup</p>
            <p className="text-sm font-medium text-gray-900">{ride.pickup_location.address}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0" />
          <div>
            <p className="text-sm text-gray-500">Dropoff</p>
            <p className="text-sm font-medium text-gray-900">{ride.dropoff_location.address}</p>
          </div>
        </div>
      </div>

      {ride.driver && (
        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">
              {ride.driver.full_name.charAt(0)}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{ride.driver.full_name}</p>
            {ride.driver.vehicle && (
              <p className="text-xs text-gray-500">{ride.driver.vehicle.make} {ride.driver.vehicle.model}</p>
            )}
          </div>
          {ride.driver.rating > 0 && (
            <div className="ml-auto flex items-center gap-1">
              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm text-gray-600">{ride.driver.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500 pt-1">
        <span>{ride.distance.toFixed(1)} km</span>
        <span>{ride.duration} min</span>
      </div>

      <div className="flex gap-2 pt-1">
        {canTrack && onTrack && (
          <Button variant="primary" size="sm" fullWidth onClick={() => onTrack(ride.id)}>
            Track
          </Button>
        )}
        {canCancel && onCancel && (
          <Button variant="danger" size="sm" fullWidth onClick={() => onCancel(ride.id)}>
            Cancel Ride
          </Button>
        )}
      </div>
    </div>
  );
}
