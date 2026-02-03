import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/neuralmesh';

// For development, we'll make database optional
let queryClient: ReturnType<typeof postgres> | null = null;
let db: ReturnType<typeof drizzle> | null = null;

try {
  queryClient = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  
  db = drizzle(queryClient, { schema });
} catch (error) {
  console.warn('Database connection not available, running in-memory mode');
}

export { db };

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  if (!queryClient) return false;
  
  try {
    await queryClient`SELECT 1`;
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeDatabaseConnection(): Promise<void> {
  if (!queryClient) return;
  
  try {
    await queryClient.end();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}

// Check if database is available
export function isDatabaseAvailable(): boolean {
  return db !== null;
}
