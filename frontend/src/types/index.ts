export enum UserRole {
  RIDER = 'rider',
  DRIVER = 'driver',
}

export enum RideStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  ARRIVED = 'arrived',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum DriverStatus {
  OFFLINE = 'offline',
  ONLINE = 'online',
  BUSY = 'busy',
}

export enum DocumentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export interface User {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface Rider extends User {
  default_pickup_location?: Location;
  rating: number;
  ride_count: number;
}

export interface Driver extends User {
  license_number: string;
  is_verified: boolean;
  current_location?: Location;
  status: DriverStatus;
  rating: number;
  ride_count: number;
  vehicle?: Vehicle;
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

export interface DriverDocument {
  id: string;
  driver_id: string;
  type: string;
  file_url: string;
  status: DocumentStatus;
  uploaded_at: string;
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface Ride {
  id: string;
  rider_id: string;
  driver_id?: string;
  pickup_location: Location;
  dropoff_location: Location;
  status: RideStatus;
  fare: number;
  distance: number;
  duration: number;
  driver?: Driver;
  rider?: Rider;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  stripe_payment_method_id: string;
  card_last4: string;
  card_brand: string;
  is_default: boolean;
}

export interface Payment {
  id: string;
  ride_id: string;
  rider_id: string;
  amount: number;
  stripe_payment_intent_id: string;
  status: PaymentStatus;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
