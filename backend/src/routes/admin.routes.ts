import { Router, Response, NextFunction } from 'express';
import { verifyToken } from '../middleware/auth';
import { formatResponse } from '../utils/helpers';
import { AuthenticatedRequest } from '../types';
import * as DriverModel from '../models/driver.model';
import { AppError } from '../middleware/errorHandler';
import { pool } from '../config/database';

const router = Router();

router.use(verifyToken);

router.get(
  '/drivers/pending',
  async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await pool.query(
        `SELECT d.*, u.full_name, u.email, u.phone
         FROM drivers d
         JOIN users u ON u.id = d.user_id
         WHERE d.is_verified = false
         ORDER BY d.ride_count ASC`
      );
      res.status(200).json(formatResponse(result.rows));
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/drivers/:id/verify',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const driver = await DriverModel.findById(id);
      if (!driver) {
        throw new AppError('Driver not found', 404, 'NOT_FOUND');
      }

      const { verified } = req.body;
      const isVerified = verified !== false;

      const updated = await DriverModel.updateDriver(id, {
        is_verified: isVerified,
      });

      res.status(200).json(formatResponse(updated));
    } catch (err) {
      next(err);
    }
  }
);

export default router;
