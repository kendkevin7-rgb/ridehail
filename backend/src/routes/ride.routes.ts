import { Router, Response, NextFunction } from 'express';
import { verifyToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { rideRequestSchema, rideCancelSchema } from '../utils/validators';
import { formatResponse } from '../utils/helpers';
import { AuthenticatedRequest } from '../types';
import * as RideService from '../services/ride.service';
import * as RideModel from '../models/ride.model';
import * as RiderModel from '../models/rider.model';

const router = Router();

router.use(verifyToken);

router.post(
  '/',
  validate(rideRequestSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { pickup_location, dropoff_location, vehicle_type } = req.body;
      const ride = await RideService.requestRide(
        req.user!.userId,
        pickup_location,
        dropoff_location,
        vehicle_type
      );
      res.status(201).json(formatResponse(ride, 'Ride requested'));
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/nearby-drivers',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { lat, lng } = req.query;
      if (!lat || !lng) {
        res.status(400).json({
          success: false,
          error: { message: 'lat and lng query params are required', code: 'VALIDATION_ERROR' },
        });
        return;
      }
      const drivers = await RideService.findNearbyDrivers({
        lat: parseFloat(lat as string),
        lng: parseFloat(lng as string),
      });
      res.status(200).json(formatResponse(drivers));
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/history',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const rides = await RideModel.getRideHistory(
        req.user!.userId,
        req.user!.role,
        limit,
        offset
      );
      res.status(200).json(formatResponse(rides));
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:id',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const ride = await RideModel.findById(req.params.id);
      if (!ride) {
        res.status(404).json({
          success: false,
          error: { message: 'Ride not found', code: 'NOT_FOUND' },
        });
        return;
      }
      res.status(200).json(formatResponse(ride));
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/:id/cancel',
  validate(rideCancelSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const ride = await RideService.cancelRide(req.params.id, req.user!.userId);
      res.status(200).json(formatResponse(ride, 'Ride cancelled'));
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/:id/status',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { status, location } = req.body;
      if (!status) {
        res.status(400).json({
          success: false,
          error: { message: 'Status is required', code: 'VALIDATION_ERROR' },
        });
        return;
      }
      const ride = await RideService.updateRideStatus(req.params.id, status, location);
      res.status(200).json(formatResponse(ride, `Ride ${status}`));
    } catch (err) {
      next(err);
    }
  }
);

export default router;
