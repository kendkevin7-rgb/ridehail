import { pool } from '../config/database';
import { DriverDocument } from '../types';

export async function createDocument(
  id: string,
  driverId: string,
  type: string,
  fileUrl: string
): Promise<DriverDocument> {
  const result = await pool.query(
    `INSERT INTO driver_documents (id, driver_id, type, file_url)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [id, driverId, type, fileUrl]
  );
  return result.rows[0];
}

export async function findByDriverId(driverId: string): Promise<DriverDocument[]> {
  const result = await pool.query(
    'SELECT * FROM driver_documents WHERE driver_id = $1 ORDER BY uploaded_at DESC',
    [driverId]
  );
  return result.rows;
}

export async function updateStatus(
  id: string,
  status: 'pending' | 'approved' | 'rejected'
): Promise<DriverDocument | null> {
  const result = await pool.query(
    'UPDATE driver_documents SET status = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );
  return result.rows[0] || null;
}
