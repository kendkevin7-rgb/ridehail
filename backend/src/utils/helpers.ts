import { v4 as uuidv4 } from 'uuid';

export function generateId(): string {
  return uuidv4();
}

export function calculateFare(distanceKm: number, durationMin: number, vehicleType: string): number {
  const rates: Record<string, { base: number; perKm: number; perMin: number }> = {
    economy: { base: 2.5, perKm: 1.0, perMin: 0.15 },
    standard: { base: 3.5, perKm: 1.5, perMin: 0.2 },
    premium: { base: 5.0, perKm: 2.5, perMin: 0.35 },
    xl: { base: 4.0, perKm: 2.0, perMin: 0.25 },
  };

  const rate = rates[vehicleType.toLowerCase()] || rates.standard;
  const fare = rate.base + rate.perKm * distanceKm + rate.perMin * durationMin;
  return Math.round(fare * 100) / 100;
}

export function formatResponse(data: unknown, message?: string) {
  const response: { success: boolean; data: unknown; message?: string } = {
    success: true,
    data,
  };
  if (message) response.message = message;
  return response;
}

export function formatError(message: string, code?: string, details?: unknown) {
  const error: { success: false; error: { message: string; code?: string; details?: unknown } } = {
    success: false,
    error: { message },
  };
  if (code) error.error.code = code;
  if (details !== undefined) error.error.details = details;
  return error;
}
