import { Request } from 'express';

export interface User {
  id: string;
  email: string;
  phone: string;
  password_hash: string;
  full_name: string;
  role: 'rider' | 'driver';
  created_at: Date;
}

export interface Rider {
  id: string;
  user_id: string;
  default_pickup_location: Record<string, unknown> | null;
  rating: number;
  ride_count: number;
}

export interface Driver {
  id: string;
  user_id: string;
  license_number: string;
  is_verified: boolean;
  current_location: Record<string, unknown> | null;
  status: 'offline' | 'online' | 'busy';
  rating: number;
  ride_count: number;
}

export interface DriverDocument {
  id: string;
  driver_id: string;
  type: string;
  file_url: string;
  status: 'pending' | 'approved' | 'rejected';
  uploaded_at: Date;
}

export interface Vehicle {
  id: string;
  driver_id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  plate_number: string;
  vehicle_type: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  stripe_payment_method_id: string | null;
  card_last4: string | null;
  card_brand: string | null;
  is_default: boolean;
}

export interface Ride {
  id: string;
  rider_id: string;
  driver_id: string | null;
  pickup_location: Record<string, unknown>;
  dropoff_location: Record<string, unknown>;
  status: 'pending' | 'accepted' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';
  fare: number | null;
  distance: number | null;
  duration: number | null;
  created_at: Date;
  started_at: Date | null;
  completed_at: Date | null;
  cancelled_at: Date | null;
}

export interface RideStatusLog {
  id: string;
  ride_id: string;
  status: string;
  timestamp: Date;
  location: Record<string, unknown> | null;
}

export interface Payment {
  id: string;
  ride_id: string;
  rider_id: string;
  amount: number;
  stripe_payment_intent_id: string | null;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  created_at: Date;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
}

export interface AuthPayload {
  userId: string;
  role: 'rider' | 'driver';
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}
