import { v4 as uuidv4 } from 'uuid';
import * as PaymentModel from '../models/payment.model';
import * as RideModel from '../models/ride.model';
import * as RiderModel from '../models/rider.model';
import { stripe } from '../config/stripe';
import { AppError } from '../middleware/errorHandler';

export async function createPaymentIntent(
  rideId: string,
  riderUserId: string,
  amount: number
) {
  const rider = await RiderModel.findByUserId(riderUserId);
  if (!rider) {
    throw new AppError('Rider profile not found', 404, 'NOT_FOUND');
  }

  const ride = await RideModel.findById(rideId);
  if (!ride) {
    throw new AppError('Ride not found', 404, 'NOT_FOUND');
  }

  if (ride.rider_id !== rider.id) {
    throw new AppError('This ride does not belong to you', 403, 'FORBIDDEN');
  }

  let paymentIntentId: string;

  if (stripe) {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      metadata: { ride_id: rideId },
    });
    paymentIntentId = paymentIntent.id;
  } else {
    paymentIntentId = `pi_sim_${uuidv4()}`;
  }

  const payment = await PaymentModel.createPayment(
    uuidv4(),
    rideId,
    rider.id,
    amount,
    paymentIntentId
  );

  return {
    paymentId: payment.id,
    paymentIntentId,
    amount,
    clientSecret: stripe
      ? undefined
      : `sim_secret_${paymentIntentId}`,
  };
}

export async function confirmPayment(paymentIntentId: string) {
  if (stripe) {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status === 'succeeded') {
      await PaymentModel.updatePaymentStatusByIntent(paymentIntentId, 'succeeded');
      return { success: true };
    }
    await PaymentModel.updatePaymentStatusByIntent(paymentIntentId, 'failed');
    return { success: false };
  }

  await PaymentModel.updatePaymentStatusByIntent(paymentIntentId, 'succeeded');
  return { success: true };
}

export async function processRidePayment(rideId: string) {
  const ride = await RideModel.findById(rideId);
  if (!ride) {
    throw new AppError('Ride not found', 404, 'NOT_FOUND');
  }

  if (ride.status !== 'completed') {
    throw new AppError('Ride is not yet completed', 400, 'RIDE_NOT_COMPLETED');
  }

  const existingPayment = await PaymentModel.findByRideId(rideId);
  if (existingPayment) {
    return existingPayment;
  }

  if (!ride.fare) {
    throw new AppError('Ride fare is not set', 400, 'NO_FARE');
  }

  const rider = await RiderModel.findByUserId(
    (await import('../models/user.model')).findById(ride.rider_id).then(u => u?.id || '')
  );

  let paymentIntentId: string;

  if (stripe) {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(ride.fare * 100),
      currency: 'usd',
      metadata: { ride_id: rideId },
    });
    paymentIntentId = paymentIntent.id;
  } else {
    paymentIntentId = `pi_sim_${uuidv4()}`;
  }

  const payment = await PaymentModel.createPayment(
    uuidv4(),
    rideId,
    ride.rider_id,
    ride.fare,
    paymentIntentId
  );

  if (!stripe) {
    await PaymentModel.updatePaymentStatus(payment.id, 'succeeded');
  }

  return payment;
}

export async function refundPayment(paymentId: string) {
  const payment = await PaymentModel.findByRideId(paymentId);
  if (!payment) {
    throw new AppError('Payment not found', 404, 'NOT_FOUND');
  }

  if (payment.status !== 'succeeded') {
    throw new AppError('Payment cannot be refunded', 400, 'REFUND_NOT_ALLOWED');
  }

  if (stripe && payment.stripe_payment_intent_id) {
    await stripe.refunds.create({
      payment_intent: payment.stripe_payment_intent_id,
    });
  }

  await PaymentModel.updatePaymentStatus(payment.id, 'refunded');
  return { success: true };
}
