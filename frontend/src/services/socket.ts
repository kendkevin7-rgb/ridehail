import { io, Socket } from 'socket.io-client';
import { Ride } from '../types';

let socket: Socket | null = null;

export function connect(): void {
  if (socket?.connected) return;
  const token = localStorage.getItem('access_token');
  socket = io('/', {
    autoConnect: false,
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });
  socket.connect();
}

export function disconnect(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function onRideAccepted(callback: (ride: Ride) => void): void {
  socket?.on('ride_accepted', callback);
}

export function onDriverLocationUpdate(callback: (location: { lat: number; lng: number }) => void): void {
  socket?.on('driver_location_update', callback);
}

export function onRideStatusChanged(callback: (ride: Ride) => void): void {
  socket?.on('ride_status_changed', callback);
}

export function offAll(): void {
  if (socket) {
    socket.off('ride_accepted');
    socket.off('driver_location_update');
    socket.off('ride_status_changed');
  }
}
