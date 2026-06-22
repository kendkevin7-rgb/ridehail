import { pool } from '../config/database';
import { Vehicle } from '../types';

export async function createVehicle(
  id: string,
  driverId: string,
  make: string,
  model: string,
  year: number,
  color: string,
  plateNumber: string,
  vehicleType: string
): Promise<Vehicle> {
  const result = await pool.query(
    `INSERT INTO vehicles (id, driver_id, make, model, year, color, plate_number, vehicle_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [id, driverId, make, model, year, color, plateNumber, vehicleType]
  );
  return result.rows[0];
}

export async function findByDriverId(driverId: string): Promise<Vehicle[]> {
  const result = await pool.query(
    'SELECT * FROM vehicles WHERE driver_id = $1 ORDER BY year DESC',
    [driverId]
  );
  return result.rows;
}

export async function updateVehicle(
  id: string,
  updates: Partial<Pick<Vehicle, 'make' | 'model' | 'year' | 'color' | 'plate_number' | 'vehicle_type'>>
): Promise<Vehicle | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.make !== undefined) {
    fields.push(`make = $${paramIndex++}`);
    values.push(updates.make);
  }
  if (updates.model !== undefined) {
    fields.push(`model = $${paramIndex++}`);
    values.push(updates.model);
  }
  if (updates.year !== undefined) {
    fields.push(`year = $${paramIndex++}`);
    values.push(updates.year);
  }
  if (updates.color !== undefined) {
    fields.push(`color = $${paramIndex++}`);
    values.push(updates.color);
  }
  if (updates.plate_number !== undefined) {
    fields.push(`plate_number = $${paramIndex++}`);
    values.push(updates.plate_number);
  }
  if (updates.vehicle_type !== undefined) {
    fields.push(`vehicle_type = $${paramIndex++}`);
    values.push(updates.vehicle_type);
  }

  if (fields.length === 0) return null;

  values.push(id);
  const result = await pool.query(
    `UPDATE vehicles SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}
