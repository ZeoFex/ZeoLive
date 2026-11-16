import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis?: Redis | null;
  redisWarned?: boolean;
};

function createRedisClient(): Redis | null {
  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    if (process.env.NODE_ENV === "development" && !globalForRedis.redisWarned) {
      globalForRedis.redisWarned = true;
      console.info("[redis] No REDIS_URL set. This server keeps class data in memory.");
    }
    return null;
  }
  return new Redis(url, { maxRetriesPerRequest: 2, lazyConnect: true });
}

function getRedis() {
  if (globalForRedis.redis !== undefined) return globalForRedis.redis;
  globalForRedis.redis = createRedisClient();
  return globalForRedis.redis;
}

export const redis = getRedis();

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds = 300
): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    /* ignore cache write failures */
  }
}

export async function cacheDel(key: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    /* ignore */
  }
}
