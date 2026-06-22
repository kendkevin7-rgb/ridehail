import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { config } from '../config/env';

let io: Server | null = null;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  const rideTracking = io.of('/ride-tracking');

  rideTracking.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('joinRide', (rideId: string) => {
      socket.join(`ride:${rideId}`);
    });

    socket.on('leaveRide', (rideId: string) => {
      socket.leave(`ride:${rideId}`);
    });

    socket.on('driverLocationUpdate', (data: { rideId?: string; lat: number; lng: number }) => {
      if (data.rideId) {
        rideTracking.to(`ride:${data.rideId}`).emit('driverLocationUpdated', {
          driverId: socket.data.driverId,
          lat: data.lat,
          lng: data.lng,
        });
      }
    });

    socket.on('requestRide', (data: {
      pickup: { lat: number; lng: number; address?: string };
      dropoff: { lat: number; lng: number; address?: string };
      vehicleType?: string;
    }) => {
      rideTracking.to('drivers').emit('newRideRequest', data);
    });

    socket.on('rideAccepted', (data: { rideId: string; driverId: string }) => {
      rideTracking.to(`ride:${data.rideId}`).emit('rideAccepted', data);
    });

    socket.on('rideStatusChanged', (data: { rideId: string; status: string }) => {
      rideTracking.to(`ride:${data.rideId}`).emit('rideStatusChanged', data);
    });

    socket.on('joinDrivers', () => {
      socket.join('drivers');
    });

    socket.on('leaveDrivers', () => {
      socket.leave('drivers');
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): Server | null {
  return io;
}
