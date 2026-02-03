import Redis from 'ioredis';
import { logger } from './logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let redis: Redis | null = null;

try {
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) {
        logger.warn('Redis connection failed after 3 retries, caching disabled');
        return null;
      }
      return Math.min(times * 200, 1000);
    },
  });

  redis.on('connect', () => {
    logger.info('Redis connection established');
  });

  redis.on('error', (err) => {
    logger.error('Redis error:', err);
  });
} catch (error) {
  logger.warn('Redis not available, running without cache');
}

export class CacheService {
  private readonly defaultTTL = 60; // 60 seconds

  async get<T>(key: string): Promise<T | null> {
    if (!redis) return null;

    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<boolean> {
    if (!redis) return false;

    try {
      await redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!redis) return false;

    try {
      await redis.del(key);
      return true;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (!redis || keys.length === 0) return [];

    try {
      const values = await redis.mget(...keys);
      return values.map((v) => (v ? JSON.parse(v) : null));
    } catch (error) {
      logger.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  async mset(entries: Record<string, any>, ttl: number = this.defaultTTL): Promise<boolean> {
    if (!redis) return false;

    try {
      const pipeline = redis.pipeline();
      
      for (const [key, value] of Object.entries(entries)) {
        pipeline.setex(key, ttl, JSON.stringify(value));
      }
      
      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error('Cache mset error:', error);
      return false;
    }
  }

  async invalidatePattern(pattern: string): Promise<number> {
    if (!redis) return 0;

    try {
      const keys = await redis.keys(pattern);
      if (keys.length === 0) return 0;
      
      await redis.del(...keys);
      return keys.length;
    } catch (error) {
      logger.error(`Cache invalidate pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!redis) return false;

    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  async incr(key: string, ttl?: number): Promise<number> {
    if (!redis) return 0;

    try {
      const value = await redis.incr(key);
      if (ttl) {
        await redis.expire(key, ttl);
      }
      return value;
    } catch (error) {
      logger.error(`Cache incr error for key ${key}:`, error);
      return 0;
    }
  }

  isAvailable(): boolean {
    return redis !== null && redis.status === 'ready';
  }
}

export const cache = new CacheService();
