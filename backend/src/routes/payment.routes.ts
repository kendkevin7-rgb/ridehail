import { Router, Response, NextFunction } from 'express';
import { verifyToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { paymentMethodSchema, createPaymentIntentSchema } from '../utils/validators';
import { formatResponse, generateId } from '../utils/helpers';
import { AuthenticatedRequest } from '../types';
import * as PaymentModel from '../models/payment.model';
import * as PaymentService from '../services/payment.service';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.use(verifyToken);

router.post(
  '/methods',
  validate(paymentMethodSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { stripe_payment_method_id, card_last4, card_brand, set_default } = req.body;
      const method = await PaymentModel.createPaymentMethod(
        generateId(),
        req.user!.userId,
        stripe_payment_method_id,
        card_last4,
        card_brand,
        set_default || false
      );
      res.status(201).json(formatResponse(method, 'Payment method added'));
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/methods',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const methods = await PaymentModel.findMethodsByUserId(req.user!.userId);
      res.status(200).json(formatResponse(methods));
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/methods/:id',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const deleted = await PaymentModel.deleteMethod(req.params.id, req.user!.userId);
      if (!deleted) {
        throw new AppError('Payment method not found', 404, 'NOT_FOUND');
      }
      res.status(200).json(formatResponse(null, 'Payment method deleted'));
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/methods/:id/default',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const method = await PaymentModel.setDefault(req.params.id, req.user!.userId);
      if (!method) {
        throw new AppError('Payment method not found', 404, 'NOT_FOUND');
      }
      res.status(200).json(formatResponse(method, 'Default payment method updated'));
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/create-intent',
  validate(createPaymentIntentSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { ride_id, amount } = req.body;
      const intent = await PaymentService.createPaymentIntent(
        ride_id,
        req.user!.userId,
        amount
      );
      res.status(201).json(formatResponse(intent, 'Payment intent created'));
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/confirm',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { payment_intent_id } = req.body;
      if (!payment_intent_id) {
        res.status(400).json({
          success: false,
          error: { message: 'payment_intent_id is required', code: 'VALIDATION_ERROR' },
        });
        return;
      }
      const result = await PaymentService.confirmPayment(payment_intent_id);
      res.status(200).json(formatResponse(result, 'Payment confirmed'));
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/history',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const payments = await PaymentModel.findByUserId(req.user!.userId);
      res.status(200).json(formatResponse(payments));
    } catch (err) {
      next(err);
    }
  }
);

export default router;
