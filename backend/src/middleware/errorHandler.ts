import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { formatError } from '../utils/helpers';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: unknown;

  constructor(message: string, statusCode: number = 500, code?: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'INTERNAL_ERROR';
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(formatError(err.message, err.code, err.details));
    return;
  }

  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    res.status(400).json(formatError('Validation failed', 'VALIDATION_ERROR', details));
    return;
  }

  if (err.name === 'MulterError') {
    res.status(400).json(formatError(err.message, 'UPLOAD_ERROR'));
    return;
  }

  console.error('Unhandled error:', err.message);
  res.status(500).json(formatError('Internal server error', 'INTERNAL_ERROR'));
}
