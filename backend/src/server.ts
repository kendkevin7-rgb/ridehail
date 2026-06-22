import http from 'http';
import app from './app';
import { config } from './config/env';
import { testConnection } from './config/database';
import { initSocket } from './services/socket.service';

async function start(): Promise<void> {
  try {
    await testConnection();

    const server = http.createServer(app);

    initSocket(server);

    server.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', (err as Error).message);
    process.exit(1);
  }
}

start();
