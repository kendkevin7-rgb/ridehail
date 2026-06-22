import { Pool, QueryResult } from 'pg';
import { config } from './env';

const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err: Error) => {
  console.error('Unexpected database pool error:', err.message);
  process.exit(-1);
});

async function testConnection(): Promise<void> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('Database connected successfully');
  } catch (err) {
    console.error('Database connection failed:', (err as Error).message);
    throw err;
  }
}

export { pool, testConnection };
export type QueryResultType = QueryResult;
