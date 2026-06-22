import { pool } from '../config/database';
import { PaymentMethod, Payment } from '../types';

export async function createPaymentMethod(
  id: string,
  userId: string,
  stripePaymentMethodId: string,
  cardLast4: string,
  cardBrand: string,
  isDefault: boolean
): Promise<PaymentMethod> {
  if (isDefault) {
    await pool.query(
      'UPDATE payment_methods SET is_default = false WHERE user_id = $1',
      [userId]
    );
  }

  const result = await pool.query(
    `INSERT INTO payment_methods (id, user_id, stripe_payment_method_id, card_last4, card_brand, is_default)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [id, userId, stripePaymentMethodId, cardLast4, cardBrand, isDefault]
  );

  if (!isDefault) {
    const count = await pool.query(
      'SELECT COUNT(*) FROM payment_methods WHERE user_id = $1',
      [userId]
    );
    if (parseInt(count.rows[0].count) === 1) {
      await pool.query(
        'UPDATE payment_methods SET is_default = true WHERE id = $1',
        [result.rows[0].id]
      );
      result.rows[0].is_default = true;
    }
  }

  return result.rows[0];
}

export async function findMethodsByUserId(userId: string): Promise<PaymentMethod[]> {
  const result = await pool.query(
    'SELECT * FROM payment_methods WHERE user_id = $1 ORDER BY is_default DESC, id ASC',
    [userId]
  );
  return result.rows;
}

export async function deleteMethod(id: string, userId: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM payment_methods WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return (result.rowCount || 0) > 0;
}

export async function setDefault(id: string, userId: string): Promise<PaymentMethod | null> {
  await pool.query(
    'UPDATE payment_methods SET is_default = false WHERE user_id = $1',
    [userId]
  );
  const result = await pool.query(
    'UPDATE payment_methods SET is_default = true WHERE id = $1 AND user_id = $2 RETURNING *',
    [id, userId]
  );
  return result.rows[0] || null;
}

export async function createPayment(
  id: string,
  rideId: string,
  riderId: string,
  amount: number,
  stripePaymentIntentId: string
): Promise<Payment> {
  const result = await pool.query(
    `INSERT INTO payments (id, ride_id, rider_id, amount, stripe_payment_intent_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [id, rideId, riderId, amount, stripePaymentIntentId]
  );
  return result.rows[0];
}

export async function findByRideId(rideId: string): Promise<Payment | null> {
  const result = await pool.query(
    'SELECT * FROM payments WHERE ride_id = $1',
    [rideId]
  );
  return result.rows[0] || null;
}

export async function findByUserId(userId: string): Promise<Payment[]> {
  const rider = await pool.query('SELECT id FROM riders WHERE user_id = $1', [userId]);
  if (!rider.rows[0]) return [];

  const result = await pool.query(
    'SELECT * FROM payments WHERE rider_id = $1 ORDER BY created_at DESC',
    [rider.rows[0].id]
  );
  return result.rows;
}

export async function updatePaymentStatus(
  id: string,
  status: 'pending' | 'succeeded' | 'failed' | 'refunded'
): Promise<Payment | null> {
  const result = await pool.query(
    'UPDATE payments SET status = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );
  return result.rows[0] || null;
}

export async function updatePaymentStatusByIntent(
  stripePaymentIntentId: string,
  status: 'pending' | 'succeeded' | 'failed' | 'refunded'
): Promise<Payment | null> {
  const result = await pool.query(
    'UPDATE payments SET status = $1 WHERE stripe_payment_intent_id = $2 RETURNING *',
    [status, stripePaymentIntentId]
  );
  return result.rows[0] || null;
}
