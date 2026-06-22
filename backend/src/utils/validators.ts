import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 characters').max(20),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  full_name: z.string().min(1, 'Full name is required').max(255),
  role: z.enum(['rider', 'driver']),
  license_number: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const riderProfileSchema = z.object({
  full_name: z.string().min(1).max(255).optional(),
  phone: z.string().min(10).max(20).optional(),
  default_pickup_location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional(),
  }).optional(),
});

export const driverProfileSchema = z.object({
  full_name: z.string().min(1).max(255).optional(),
  phone: z.string().min(10).max(20).optional(),
  license_number: z.string().min(1).max(50).optional(),
});

export const vehicleSchema = z.object({
  make: z.string().min(1, 'Make is required').max(100),
  model: z.string().min(1, 'Model is required').max(100),
  year: z.number().int().min(1900).max(2100),
  color: z.string().min(1, 'Color is required').max(50),
  plate_number: z.string().min(1, 'Plate number is required').max(20),
  vehicle_type: z.enum(['economy', 'standard', 'premium', 'xl']),
});

export const documentUploadSchema = z.object({
  type: z.enum(['license', 'insurance', 'registration', 'profile_photo']),
});

export const rideRequestSchema = z.object({
  pickup_location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional(),
  }),
  dropoff_location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional(),
  }),
  vehicle_type: z.enum(['economy', 'standard', 'premium', 'xl']).optional(),
});

export const rideCancelSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const paymentMethodSchema = z.object({
  stripe_payment_method_id: z.string().min(1),
  card_last4: z.string().length(4),
  card_brand: z.string().min(1).max(50),
  set_default: z.boolean().optional(),
});

export const createPaymentIntentSchema = z.object({
  ride_id: z.string().uuid(),
  amount: z.number().positive(),
});
