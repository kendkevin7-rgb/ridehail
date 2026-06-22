import { Router, Response, NextFunction } from 'express';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../utils/validators';
import { formatResponse } from '../utils/helpers';
import * as AuthService from '../services/auth.service';
import { AuthenticatedRequest } from '../types';

const router = Router();

router.post(
  '/register',
  validate(registerSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json(formatResponse(result, 'Registration successful'));
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/login',
  validate(loginSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      res.status(200).json(formatResponse(result, 'Login successful'));
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/refresh',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;
      if (!token) {
        res.status(400).json({
          success: false,
          error: { message: 'Refresh token is required', code: 'VALIDATION_ERROR' },
        });
        return;
      }
      const tokens = await AuthService.refreshToken(token);
      res.status(200).json(formatResponse(tokens, 'Token refreshed'));
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/logout',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;
      if (token) {
        await AuthService.logout(token);
      }
      res.status(200).json(formatResponse(null, 'Logout successful'));
    } catch (err) {
      next(err);
    }
  }
);

export default router;
