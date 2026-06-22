import { pool } from '../config/database';
import { Driver } from '../types';

export async function createDriver(
  id: string,
  userId: string,
  licenseNumber: string
): Promise<Driver> {
  const result = await pool.query(
    `INSERT INTO drivers (id, user_id, license_number)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [id, userId, licenseNumber]
  );
  return result.rows[0];
}

export async function findByUserId(userId: string): Promise<Driver | null> {
  const result = await pool.query(
    'SELECT * FROM drivers WHERE user_id = $1',
    [userId]
  );
  return result.rows[0] || null;
}

export async function findById(id: string): Promise<Driver | null> {
  const result = await pool.query(
    'SELECT * FROM drivers WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

export async function updateDriver(
  id: string,
  updates: Partial<Pick<Driver, 'license_number' | 'is_verified' | 'status' | 'current_location' | 'rating' | 'ride_count'>>
): Promise<Driver | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.license_number !== undefined) {
    fields.push(`license_number = $${paramIndex++}`);
    values.push(updates.license_number);
  }
  if (updates.is_verified !== undefined) {
    fields.push(`is_verified = $${paramIndex++}`);
    values.push(updates.is_verified);
  }
  if (updates.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(updates.status);
  }
  if (updates.current_location !== undefined) {
    fields.push(`current_location = $${paramIndex++}`);
    values.push(JSON.stringify(updates.current_location));
  }
  if (updates.rating !== undefined) {
    fields.push(`rating = $${paramIndex++}`);
    values.push(updates.rating);
  }
  if (updates.ride_count !== undefined) {
    fields.push(`ride_count = $${paramIndex++}`);
    values.push(updates.ride_count);
  }

  if (fields.length === 0) return null;

  values.push(id);
  const result = await pool.query(
    `UPDATE drivers SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function updateLocation(
  driverId: string,
  lat: number,
  lng: number
): Promise<Driver | null> {
  const result = await pool.query(
    `UPDATE drivers SET current_location = $1 WHERE id = $2 RETURNING *`,
    [JSON.stringify({ lat, lng }), driverId]
  );
  return result.rows[0] || null;
}

export async function findNearbyDrivers(
  lat: number,
  lng: number,
  radiusKm: number = 5
): Promise<Driver[]> {
  const latDelta = radiusKm / 111.0;
  const lngDelta = radiusKm / (111.0 * Math.cos((lat * Math.PI) / 180));

  const result = await pool.query(
    `SELECT d.*, u.full_name, u.phone, v.id as vehicle_id, v.make, v.model, v.color, v.plate_number, v.vehicle_type
     FROM drivers d
     JOIN users u ON u.id = d.user_id
     LEFT JOIN vehicles v ON v.driver_id = d.id
     WHERE d.status = 'online'
       AND d.is_verified = true
       AND d.current_location IS NOT NULL
       AND (d.current_location->>'lat')::numeric BETWEEN $1 AND $2
       AND (d.current_location->>'lng')::numeric BETWEEN $3 AND $4
     ORDER BY
       (ABS((d.current_location->>'lat')::numeric - $5) +
        ABS((d.current_location->>'lng')::numeric - $6)) ASC
     LIMIT 20`,
    [lat - latDelta, lat + latDelta, lng - lngDelta, lng + lngDelta, lat, lng]
  );
  return result.rows;
}
