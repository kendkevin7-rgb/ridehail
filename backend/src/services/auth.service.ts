import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env';
import { pool } from '../config/database';
import { AuthPayload } from '../types';
import * as UserModel from '../models/user.model';
import * as RiderModel from '../models/rider.model';
import * as DriverModel from '../models/driver.model';
import { AppError } from '../middleware/errorHandler';

function generateAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, config.jwtAccessSecret, {
    expiresIn: config.jwtAccessExpiry,
  } as jwt.SignOptions);
}

function generateRefreshToken(payload: AuthPayload): string {
  return jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiry,
  } as jwt.SignOptions);
}

export async function generateTokens(userId: string, role: 'rider' | 'driver') {
  const payload: AuthPayload = { userId, role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await pool.query(
    'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)',
    [uuidv4(), userId, refreshToken, expiresAt]
  );

  return { accessToken, refreshToken };
}

export async function register(userData: {
  email: string;
  phone: string;
  password: string;
  full_name: string;
  role: 'rider' | 'driver';
  license_number?: string;
}) {
  const existingEmail = await UserModel.findByEmail(userData.email);
  if (existingEmail) {
    throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
  }

  const existingPhone = await pool.query(
    'SELECT id FROM users WHERE phone = $1',
    [userData.phone]
  );
  if (existingPhone.rows.length > 0) {
    throw new AppError('Phone number already registered', 409, 'PHONE_EXISTS');
  }

  const passwordHash = await bcrypt.hash(userData.password, 10);
  const userId = uuidv4();

  const user = await UserModel.createUser(
    userId,
    userData.email,
    userData.phone,
    passwordHash,
    userData.full_name,
    userData.role
  );

  if (userData.role === 'rider') {
    await RiderModel.createRider(uuidv4(), userId);
  } else if (userData.role === 'driver') {
    if (!userData.license_number) {
      throw new AppError('License number is required for drivers', 400, 'VALIDATION_ERROR');
    }
    await DriverModel.createDriver(uuidv4(), userId, userData.license_number);
  }

  const tokens = await generateTokens(userId, userData.role);

  return {
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      full_name: user.full_name,
      role: user.role,
    },
    ...tokens,
  };
}

export async function login(email: string, password: string) {
  const user = await UserModel.findByEmail(email);
  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const tokens = await generateTokens(user.id, user.role);

  return {
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      full_name: user.full_name,
      role: user.role,
    },
    ...tokens,
  };
}

export async function refreshToken(token: string) {
  const stored = await pool.query(
    'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
    [token]
  );

  if (stored.rows.length === 0) {
    throw new AppError('Invalid or expired refresh token', 401, 'TOKEN_INVALID');
  }

  try {
    const decoded = jwt.verify(token, config.jwtRefreshSecret) as AuthPayload;

    await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);

    const tokens = await generateTokens(decoded.userId, decoded.role);
    return tokens;
  } catch {
    await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
    throw new AppError('Invalid or expired refresh token', 401, 'TOKEN_INVALID');
  }
}

export async function logout(token: string) {
  await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
}
