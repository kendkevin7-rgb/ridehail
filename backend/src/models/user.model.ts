import { pool } from '../config/database';
import { User } from '../types';

export async function createUser(
  id: string,
  email: string,
  phone: string,
  passwordHash: string,
  fullName: string,
  role: 'rider' | 'driver'
): Promise<User> {
  const result = await pool.query(
    `INSERT INTO users (id, email, phone, password_hash, full_name, role)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [id, email, phone, passwordHash, fullName, role]
  );
  return result.rows[0];
}

export async function findByEmail(email: string): Promise<User | null> {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
}

export async function findById(id: string): Promise<User | null> {
  const result = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

export async function updateUser(
  id: string,
  updates: Partial<Pick<User, 'full_name' | 'phone' | 'email'>>
): Promise<User | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.full_name !== undefined) {
    fields.push(`full_name = $${paramIndex++}`);
    values.push(updates.full_name);
  }
  if (updates.phone !== undefined) {
    fields.push(`phone = $${paramIndex++}`);
    values.push(updates.phone);
  }
  if (updates.email !== undefined) {
    fields.push(`email = $${paramIndex++}`);
    values.push(updates.email);
  }

  if (fields.length === 0) return null;

  values.push(id);
  const result = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}
