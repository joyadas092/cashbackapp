import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis?: Redis | null };

/**
 * Lazily-created Redis client. Returns null (never throws) when REDIS_URL is
 * unset so `npm run dev` never hard-depends on a running Redis instance.
 */
export function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) return null;

  if (globalForRedis.redis === undefined) {
    globalForRedis.redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
    globalForRedis.redis.on("error", (err) => {
      console.warn("[redis] connection error, continuing without cache:", err.message);
    });
  }

  return globalForRedis.redis;
}
