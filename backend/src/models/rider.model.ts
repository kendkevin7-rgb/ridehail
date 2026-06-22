import { pool } from '../config/database';
import { Rider } from '../types';

export async function createRider(
  id: string,
  userId: string,
  defaultPickupLocation?: Record<string, unknown> | null
): Promise<Rider> {
  const result = await pool.query(
    `INSERT INTO riders (id, user_id, default_pickup_location)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [id, userId, defaultPickupLocation ? JSON.stringify(defaultPickupLocation) : null]
  );
  return result.rows[0];
}

export async function findByUserId(userId: string): Promise<Rider | null> {
  const result = await pool.query(
    'SELECT * FROM riders WHERE user_id = $1',
    [userId]
  );
  return result.rows[0] || null;
}

export async function updateRider(
  id: string,
  updates: Partial<Pick<Rider, 'default_pickup_location' | 'rating'>>
): Promise<Rider | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.default_pickup_location !== undefined) {
    fields.push(`default_pickup_location = $${paramIndex++}`);
    values.push(JSON.stringify(updates.default_pickup_location));
  }
  if (updates.rating !== undefined) {
    fields.push(`rating = $${paramIndex++}`);
    values.push(updates.rating);
  }

  if (fields.length === 0) return null;

  values.push(id);
  const result = await pool.query(
    `UPDATE riders SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function getRideCount(riderId: string): Promise<number> {
  const result = await pool.query(
    'SELECT ride_count FROM riders WHERE id = $1',
    [riderId]
  );
  return result.rows[0]?.ride_count || 0;
}
