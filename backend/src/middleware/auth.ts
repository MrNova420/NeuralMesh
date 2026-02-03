import type { Context, Next } from 'hono';
import { extractTokenFromHeader, verifyAccessToken } from '../utils/auth';
import { logger } from '../utils/logger';

export interface AuthContext {
  userId: string;
  username: string;
  role: string;
}

// Authentication middleware
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return c.json({ error: 'Unauthorized: No token provided' }, 401);
  }

  try {
    const payload = verifyAccessToken(token);
    c.set('auth', payload as AuthContext);
    await next();
  } catch (error) {
    logger.error('Token verification failed:', error);
    return c.json({ error: 'Unauthorized: Invalid token' }, 401);
  }
}

// Role-based authorization middleware
export function requireRole(...allowedRoles: string[]) {
  return async (c: Context, next: Next) => {
    const auth = c.get('auth') as AuthContext | undefined;

    if (!auth) {
      return c.json({ error: 'Unauthorized: Authentication required' }, 401);
    }

    if (!allowedRoles.includes(auth.role)) {
      return c.json({ error: 'Forbidden: Insufficient permissions' }, 403);
    }

    await next();
  };
}

// Optional authentication middleware (doesn't fail if no token)
export async function optionalAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  const token = extractTokenFromHeader(authHeader);

  if (token) {
    try {
      const payload = verifyAccessToken(token);
      c.set('auth', payload as AuthContext);
    } catch (error) {
      // Token invalid, but continue without auth
      logger.warn('Invalid token provided, continuing without authentication');
    }
  }

  await next();
}
