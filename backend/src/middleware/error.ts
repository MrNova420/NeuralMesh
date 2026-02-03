import type { Context, Next } from 'hono';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export async function errorHandler(c: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    logger.error('Request error:', error);

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return c.json(
        {
          error: 'Validation failed',
          details: error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        },
        400
      );
    }

    // Handle generic errors
    if (error instanceof Error) {
      const statusCode = (error as any).statusCode || 500;
      return c.json(
        {
          error: error.message || 'Internal server error',
        },
        statusCode
      );
    }

    // Unknown error
    return c.json({ error: 'Internal server error' }, 500);
  }
}
