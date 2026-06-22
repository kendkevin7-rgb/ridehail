import { v4 as uuidv4 } from 'uuid';
import * as RideModel from '../models/ride.model';
import * as DriverModel from '../models/driver.model';
import * as RiderModel from '../models/rider.model';
import { calculateFare } from '../utils/helpers';
import { AppError } from '../middleware/errorHandler';
import { getIO } from './socket.service';

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function estimateDuration(distanceKm: number): number {
  const avgSpeedKmh = 30;
  return Math.round((distanceKm / avgSpeedKmh) * 60);
}

export async function calculateRideFare(
  pickup: { lat: number; lng: number },
  dropoff: { lat: number; lng: number },
  vehicleType: string = 'standard'
) {
  const distance = haversineDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
  const duration = estimateDuration(distance);
  const fare = calculateFare(distance, duration, vehicleType);

  return {
    distance: Math.round(distance * 100) / 100,
    duration,
    fare,
    vehicleType,
  };
}

export async function findNearbyDrivers(pickup: { lat: number; lng: number }) {
  return DriverModel.findNearbyDrivers(pickup.lat, pickup.lng);
}

export async function requestRide(
  riderUserId: string,
  pickup: { lat: number; lng: number; address?: string },
  dropoff: { lat: number; lng: number; address?: string },
  vehicleType: string = 'standard'
) {
  const rider = await RiderModel.findByUserId(riderUserId);
  if (!rider) {
    throw new AppError('Rider profile not found', 404, 'NOT_FOUND');
  }

  const activeRide = await RideModel.findActiveRideByRider(rider.id);
  if (activeRide) {
    throw new AppError('You already have an active ride', 400, 'ACTIVE_RIDE_EXISTS');
  }

  const fareInfo = await calculateRideFare(pickup, dropoff, vehicleType);

  const ride = await RideModel.createRide(
    uuidv4(),
    rider.id,
    pickup as Record<string, unknown>,
    dropoff as Record<string, unknown>,
    fareInfo.fare,
    fareInfo.distance,
    fareInfo.duration
  );

  const io = getIO();
  if (io) {
    io.to('drivers').emit('newRide', {
      rideId: ride.id,
      pickup,
      dropoff,
      fare: fareInfo.fare,
      distance: fareInfo.distance,
      duration: fareInfo.duration,
      vehicleType,
    });
  }

  return ride;
}

export async function acceptRide(driverUserId: string, rideId: string) {
  const driver = await DriverModel.findByUserId(driverUserId);
  if (!driver) {
    throw new AppError('Driver profile not found', 404, 'NOT_FOUND');
  }

  if (!driver.is_verified) {
    throw new AppError('Driver is not verified', 403, 'NOT_VERIFIED');
  }

  const ride = await RideModel.findById(rideId);
  if (!ride) {
    throw new AppError('Ride not found', 404, 'NOT_FOUND');
  }

  if (ride.status !== 'pending') {
    throw new AppError('Ride is no longer available', 400, 'RIDE_NOT_AVAILABLE');
  }

  const activeRide = await RideModel.findActiveRideByDriver(driver.id);
  if (activeRide) {
    throw new AppError('You already have an active ride', 400, 'ACTIVE_RIDE_EXISTS');
  }

  await RideModel.assignDriver(rideId, driver.id);
  const updatedRide = await RideModel.updateStatus(rideId, 'accepted');

  await DriverModel.updateDriver(driver.id, { status: 'busy' });

  const io = getIO();
  if (io) {
    io.to(`ride:${rideId}`).emit('rideAccepted', {
      rideId,
      driverId: driver.id,
      driverName: driverUserId, // Will be populated on client
      estimatedArrival: ride.distance ? Math.round(ride.distance / 0.5) : 5,
    });
  }

  return updatedRide;
}

export async function updateRideStatus(
  rideId: string,
  status: string,
  location?: { lat: number; lng: number }
) {
  const validTransitions: Record<string, string[]> = {
    accepted: ['arrived'],
    arrived: ['in_progress'],
    in_progress: ['completed'],
  };

  const ride = await RideModel.findById(rideId);
  if (!ride) {
    throw new AppError('Ride not found', 404, 'NOT_FOUND');
  }

  if (status === 'cancelled') {
    throw new AppError('Use the cancel endpoint for cancellations', 400, 'INVALID_TRANSITION');
  }

  const allowedNext = validTransitions[ride.status];
  if (!allowedNext || !allowedNext.includes(status)) {
    throw new AppError(
      `Cannot transition from ${ride.status} to ${status}`,
      400,
      'INVALID_TRANSITION'
    );
  }

  const updatedRide = await RideModel.updateStatus(
    rideId,
    status,
    location ? (location as Record<string, unknown>) : null
  );

  if (status === 'completed') {
    await DriverModel.updateDriver(ride.driver_id!, { status: 'online' });
    await RideModel.updateStatus(rideId, 'completed');

    const rider = await RiderModel.findByUserId(
      (await import('../models/user.model')).findById(ride.rider_id).then(
        // We'll handle this differently - just update ride count
        () => {}
      )
    );
  }

  if (status === 'completed' && ride.driver_id) {
    const driver = await DriverModel.findById(ride.driver_id);
    if (driver) {
      const newRideCount = (driver.ride_count || 0) + 1;
      await DriverModel.updateDriver(ride.driver_id, { ride_count: newRideCount, status: 'online' });
    }
  }

  const io = getIO();
  if (io) {
    io.to(`ride:${rideId}`).emit('rideStatusChanged', {
      rideId,
      status,
      location,
    });
  }

  return updatedRide;
}

export async function cancelRide(rideId: string, userId: string) {
  const ride = await RideModel.findById(rideId);
  if (!ride) {
    throw new AppError('Ride not found', 404, 'NOT_FOUND');
  }

  if (!['pending', 'accepted'].includes(ride.status)) {
    throw new AppError('Ride cannot be cancelled at this stage', 400, 'CANCELLATION_NOT_ALLOWED');
  }

  const updatedRide = await RideModel.updateStatus(rideId, 'cancelled');

  if (ride.driver_id) {
    await DriverModel.updateDriver(ride.driver_id, { status: 'online' });
  }

  const io = getIO();
  if (io) {
    io.to(`ride:${rideId}`).emit('rideCancelled', { rideId });
  }

  return updatedRide;
}
