import type { Context, Next } from 'hono';

// Simple in-memory rate limiter
const requestCounts = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

export function rateLimiter(options: RateLimitOptions) {
  const { windowMs, maxRequests } = options;

  return async (c: Context, next: Next) => {
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const now = Date.now();

    // Clean up expired entries
    for (const [key, value] of requestCounts.entries()) {
      if (now > value.resetTime) {
        requestCounts.delete(key);
      }
    }

    const record = requestCounts.get(ip);

    if (!record || now > record.resetTime) {
      // New window
      requestCounts.set(ip, {
        count: 1,
        resetTime: now + windowMs,
      });
      return await next();
    }

    if (record.count >= maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      c.header('Retry-After', retryAfter.toString());
      return c.json(
        {
          error: 'Too many requests',
          retryAfter,
        },
        429
      );
    }

    record.count++;
    return await next();
  };
}

// Different rate limits for different purposes
export const strictRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 requests per 15 minutes
});

export const normalRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
});

export const relaxedRateLimit = rateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
});
