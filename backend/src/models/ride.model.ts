import { pool } from '../config/database';
import { Ride, RideStatusLog } from '../types';

export async function createRide(
  id: string,
  riderId: string,
  pickupLocation: Record<string, unknown>,
  dropoffLocation: Record<string, unknown>,
  fare: number | null,
  distance: number | null,
  duration: number | null
): Promise<Ride> {
  const result = await pool.query(
    `INSERT INTO rides (id, rider_id, pickup_location, dropoff_location, fare, distance, duration)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      id,
      riderId,
      JSON.stringify(pickupLocation),
      JSON.stringify(dropoffLocation),
      fare,
      distance,
      duration,
    ]
  );

  await createStatusLog(result.rows[0].id, 'pending', null);

  return result.rows[0];
}

export async function findById(id: string): Promise<Ride | null> {
  const result = await pool.query(
    `SELECT r.*,
            u_rider.full_name as rider_name,
            u_rider.phone as rider_phone,
            u_driver.full_name as driver_name,
            u_driver.phone as driver_phone
     FROM rides r
     JOIN riders rd ON rd.id = r.rider_id
     JOIN users u_rider ON u_rider.id = rd.user_id
     LEFT JOIN drivers dr ON dr.id = r.driver_id
     LEFT JOIN users u_driver ON u_driver.id = dr.user_id
     WHERE r.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function findByRiderId(
  riderId: string,
  limit: number = 20,
  offset: number = 0
): Promise<Ride[]> {
  const result = await pool.query(
    `SELECT r.*,
            u_driver.full_name as driver_name
     FROM rides r
     LEFT JOIN drivers dr ON dr.id = r.driver_id
     LEFT JOIN users u_driver ON u_driver.id = dr.user_id
     WHERE r.rider_id = $1
     ORDER BY r.created_at DESC
     LIMIT $2 OFFSET $3`,
    [riderId, limit, offset]
  );
  return result.rows;
}

export async function findByDriverId(
  driverId: string,
  limit: number = 20,
  offset: number = 0
): Promise<Ride[]> {
  const result = await pool.query(
    `SELECT r.*,
            u_rider.full_name as rider_name
     FROM rides r
     JOIN riders rd ON rd.id = r.rider_id
     JOIN users u_rider ON u_rider.id = rd.user_id
     WHERE r.driver_id = $1
     ORDER BY r.created_at DESC
     LIMIT $2 OFFSET $3`,
    [driverId, limit, offset]
  );
  return result.rows;
}

export async function updateStatus(
  rideId: string,
  status: string,
  location?: Record<string, unknown> | null
): Promise<Ride | null> {
  const timestampFields: Record<string, string> = {
    accepted: 'started_at',
    completed: 'completed_at',
    cancelled: 'cancelled_at',
  };

  const extraField = timestampFields[status];

  let query: string;
  const params: unknown[] = [status, rideId];

  if (extraField) {
    query = `UPDATE rides SET status = $1, ${extraField} = NOW() WHERE id = $2 RETURNING *`;
  } else {
    query = `UPDATE rides SET status = $1 WHERE id = $2 RETURNING *`;
  }

  const result = await pool.query(query, params);

  if (result.rows[0]) {
    await createStatusLog(rideId, status, location || null);
  }

  return result.rows[0] || null;
}

export async function findActiveRideByDriver(driverId: string): Promise<Ride | null> {
  const result = await pool.query(
    `SELECT * FROM rides
     WHERE driver_id = $1
       AND status NOT IN ('completed', 'cancelled')
     ORDER BY created_at DESC
     LIMIT 1`,
    [driverId]
  );
  return result.rows[0] || null;
}

export async function findActiveRideByRider(riderId: string): Promise<Ride | null> {
  const result = await pool.query(
    `SELECT * FROM rides
     WHERE rider_id = $1
       AND status NOT IN ('completed', 'cancelled')
     ORDER BY created_at DESC
     LIMIT 1`,
    [riderId]
  );
  return result.rows[0] || null;
}

export async function getRideHistory(
  userId: string,
  role: 'rider' | 'driver',
  limit: number = 20,
  offset: number = 0
): Promise<Ride[]> {
  if (role === 'rider') {
    const rider = await pool.query('SELECT id FROM riders WHERE user_id = $1', [userId]);
    if (!rider.rows[0]) return [];
    return findByRiderId(rider.rows[0].id, limit, offset);
  } else {
    const driver = await pool.query('SELECT id FROM drivers WHERE user_id = $1', [userId]);
    if (!driver.rows[0]) return [];
    return findByDriverId(driver.rows[0].id, limit, offset);
  }
}

async function createStatusLog(
  rideId: string,
  status: string,
  location: Record<string, unknown> | null
): Promise<RideStatusLog> {
  const result = await pool.query(
    `INSERT INTO ride_status_log (id, ride_id, status, location)
     VALUES (gen_random_uuid(), $1, $2, $3)
     RETURNING *`,
    [rideId, status, location ? JSON.stringify(location) : null]
  );
  return result.rows[0];
}

export async function getStatusLogs(rideId: string): Promise<RideStatusLog[]> {
  const result = await pool.query(
    'SELECT * FROM ride_status_log WHERE ride_id = $1 ORDER BY timestamp ASC',
    [rideId]
  );
  return result.rows;
}

export async function assignDriver(
  rideId: string,
  driverId: string
): Promise<Ride | null> {
  const result = await pool.query(
    'UPDATE rides SET driver_id = $1 WHERE id = $2 RETURNING *',
    [driverId, rideId]
  );
  return result.rows[0] || null;
}
