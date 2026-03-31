import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

type CacheEntry<T> = {
  value: T;
  expiry: number;
};

class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  set<T>(key: string, value: T, ttlSeconds: number): void {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiry });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

class RedisCache {
  private redis: Redis | null = null;
  private fallback: SimpleCache = new SimpleCache();
  private isConnected: boolean = false;

  constructor() {
    try {
      this.redis = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (times > 3) {
            this.isConnected = false;
            return null; // Stop retrying
          }
          return Math.min(times * 50, 2000);
        },
      });

      this.redis.on("connect", () => {
        console.log("Redis connected successfully");
        this.isConnected = true;
      });

      this.redis.on("error", (err) => {
        console.error("Redis connection error:", err.message);
        this.isConnected = false;
      });
    } catch (error) {
      console.error("Failed to initialize Redis:", error);
      this.isConnected = false;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (this.isConnected && this.redis) {
      try {
        await this.redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
        return;
      } catch (error) {
        console.error("Redis SET error, falling back to memory:", error);
      }
    }
    this.fallback.set(key, value, ttlSeconds);
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.isConnected && this.redis) {
      try {
        const data = await this.redis.get(key);
        if (data) return JSON.parse(data) as T;
      } catch (error) {
        console.error("Redis GET error, falling back to memory:", error);
      }
    }
    return this.fallback.get<T>(key);
  }

  async delete(key: string): Promise<void> {
    if (this.isConnected && this.redis) {
      try {
        await this.redis.del(key);
      } catch (error) {
        console.error("Redis DEL error:", error);
      }
    }
    this.fallback.delete(key);
  }
}

// Persist the cache instance across hot reloads in development
const globalForCache = global as unknown as { cache: RedisCache };
export const cache = globalForCache.cache || new RedisCache();

if (process.env.NODE_ENV !== "production") globalForCache.cache = cache;
