import { Router, Response, NextFunction } from 'express';
import { verifyToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { riderProfileSchema } from '../utils/validators';
import { formatResponse } from '../utils/helpers';
import { AuthenticatedRequest } from '../types';
import * as RiderModel from '../models/rider.model';
import * as UserModel from '../models/user.model';

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

      const rider = await RiderModel.findByUserId(user.id);
      res.status(200).json(
        formatResponse({
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            full_name: user.full_name,
            role: user.role,
          },
          rider,
        })
      );
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/profile',
  validate(riderProfileSchema),
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

      const rider = await RiderModel.findByUserId(user.id);
      if (rider && req.body.default_pickup_location) {
        await RiderModel.updateRider(rider.id, {
          default_pickup_location: req.body.default_pickup_location,
        });
      }

      const updatedUser = await UserModel.findById(user.id);
      const updatedRider = rider ? await RiderModel.findByUserId(user.id) : null;

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
          rider: updatedRider,
        })
      );
    } catch (err) {
      next(err);
    }
  }
);

export default router;
