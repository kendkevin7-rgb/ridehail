import { Router, Response, NextFunction } from 'express';
import { verifyToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { driverProfileSchema, vehicleSchema } from '../utils/validators';
import { upload } from '../middleware/upload';
import { formatResponse, generateId } from '../utils/helpers';
import { AuthenticatedRequest } from '../types';
import * as DriverModel from '../models/driver.model';
import * as UserModel from '../models/user.model';
import * as VehicleModel from '../models/vehicle.model';
import * as DocumentModel from '../models/driver-document.model';

const router = Router();

router.use(verifyToken);

router.get(
  '/profile',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = await UserModel.findById(req.user!.userId);
      if (!user) {
        res.status(404).json({
          success: false,
          error: { message: 'User not found', code: 'NOT_FOUND' },
        });
        return;
      }

      const driver = await DriverModel.findByUserId(user.id);
      const vehicles = driver ? await VehicleModel.findByDriverId(driver.id) : [];

      res.status(200).json(
        formatResponse({
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            full_name: user.full_name,
            role: user.role,
          },
          driver,
          vehicles,
        })
      );
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/profile',
  validate(driverProfileSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = await UserModel.findById(req.user!.userId);
      if (!user) {
        res.status(404).json({
          success: false,
          error: { message: 'User not found', code: 'NOT_FOUND' },
        });
        return;
      }

      if (req.body.full_name || req.body.phone) {
        await UserModel.updateUser(user.id, {
          full_name: req.body.full_name,
          phone: req.body.phone,
        });
      }

      const driver = await DriverModel.findByUserId(user.id);
      if (driver && req.body.license_number) {
        await DriverModel.updateDriver(driver.id, {
          license_number: req.body.license_number,
        });
      }

      const updatedUser = await UserModel.findById(user.id);
      const updatedDriver = driver ? await DriverModel.findByUserId(user.id) : null;

      res.status(200).json(
        formatResponse({
          user: updatedUser
            ? {
                id: updatedUser.id,
                email: updatedUser.email,
                phone: updatedUser.phone,
                full_name: updatedUser.full_name,
                role: updatedUser.role,
              }
            : null,
          driver: updatedDriver,
        })
      );
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/documents',
  upload.single('file'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: { message: 'File is required', code: 'VALIDATION_ERROR' },
        });
        return;
      }

      const { type } = req.body;
      if (!type) {
        res.status(400).json({
          success: false,
          error: { message: 'Document type is required', code: 'VALIDATION_ERROR' },
        });
        return;
      }

      const user = await UserModel.findById(req.user!.userId);
      const driver = await DriverModel.findByUserId(user!.id);
      if (!driver) {
        res.status(404).json({
          success: false,
          error: { message: 'Driver profile not found', code: 'NOT_FOUND' },
        });
        return;
      }

      const fileUrl = `/uploads/documents/${generateId()}-${req.file.originalname}`;

      const document = await DocumentModel.createDocument(
        generateId(),
        driver.id,
        type,
        fileUrl
      );

      res.status(201).json(formatResponse(document));
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/documents',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = await UserModel.findById(req.user!.userId);
      const driver = await DriverModel.findByUserId(user!.id);
      if (!driver) {
        res.status(404).json({
          success: false,
          error: { message: 'Driver profile not found', code: 'NOT_FOUND' },
        });
        return;
      }

      const documents = await DocumentModel.findByDriverId(driver.id);
      res.status(200).json(formatResponse(documents));
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/vehicles',
  validate(vehicleSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = await UserModel.findById(req.user!.userId);
      const driver = await DriverModel.findByUserId(user!.id);
      if (!driver) {
        res.status(404).json({
          success: false,
          error: { message: 'Driver profile not found', code: 'NOT_FOUND' },
        });
        return;
      }

      const existing = await VehicleModel.findByDriverId(driver.id);

      if (existing.length > 0) {
        const updated = await VehicleModel.updateVehicle(existing[0].id, req.body);
        res.status(200).json(formatResponse(updated));
      } else {
        const created = await VehicleModel.createVehicle(
          generateId(),
          driver.id,
          req.body.make,
          req.body.model,
          req.body.year,
          req.body.color,
          req.body.plate_number,
          req.body.vehicle_type
        );
        res.status(201).json(formatResponse(created));
      }
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/location',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { lat, lng } = req.body;

      if (lat === undefined || lng === undefined) {
        res.status(400).json({
          success: false,
          error: { message: 'lat and lng are required', code: 'VALIDATION_ERROR' },
        });
        return;
      }

      const user = await UserModel.findById(req.user!.userId);
      const driver = await DriverModel.findByUserId(user!.id);
      if (!driver) {
        res.status(404).json({
          success: false,
          error: { message: 'Driver profile not found', code: 'NOT_FOUND' },
        });
        return;
      }

      const updated = await DriverModel.updateLocation(driver.id, lat, lng);

      if (driver.status === 'offline') {
        await DriverModel.updateDriver(driver.id, { status: 'online' });
      }

      res.status(200).json(formatResponse(updated));
    } catch (err) {
      next(err);
    }
  }
);

export default router;
