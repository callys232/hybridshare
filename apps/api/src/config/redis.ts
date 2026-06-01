import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;

export function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      password: env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 10) {
          logger.error('Redis connection failed after 10 retries');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
      enableReadyCheck: true,
      lazyConnect: false,
    });

    redisClient.on('connect', () => logger.info('Redis connected'));
    redisClient.on('error', (err) => logger.error('Redis error', { error: err.message }));
    redisClient.on('close', () => logger.warn('Redis connection closed'));
    redisClient.on('reconnecting', () => logger.info('Redis reconnecting'));
  }
  return redisClient;
}

export async function checkRedisHealth(): Promise<boolean> {
  try {
    const pong = await getRedis().ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  const redis = getRedis();
  const serialized = JSON.stringify(value);
  if (ttlSeconds) {
    await redis.setex(key, ttlSeconds, serialized);
  } else {
    await redis.set(key, serialized);
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  const value = await redis.get(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function cacheDel(key: string): Promise<void> {
  await getRedis().del(key);
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  const redis = getRedis();
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

export async function setBlacklist(token: string, ttlSeconds: number): Promise<void> {
  await getRedis().setex(`blacklist:${token}`, ttlSeconds, '1');
}

export async function isBlacklisted(token: string): Promise<boolean> {
  const result = await getRedis().exists(`blacklist:${token}`);
  return result === 1;
}
