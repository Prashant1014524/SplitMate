import Redis from 'ioredis';

class CacheService {
  constructor() {
    this.client = null;
    this.memoryCache = new Map();
    this.isRedisConnected = false;

    const redisUrl = process.env.REDIS_URL;
    if (redisUrl && redisUrl.trim()) {
      try {
        this.client = new Redis(redisUrl, {
          maxRetriesPerRequest: 1,
          connectTimeout: 5000,
        });

        this.client.on('connect', () => {
          this.isRedisConnected = true;
          console.log('⚡ Redis Cache Connected Successfully');
        });

        this.client.on('error', (err) => {
          this.isRedisConnected = false;
          console.warn('⚠️ Redis connection unavailable, using in-memory cache fallback:', err.message);
        });
      } catch (e) {
        console.warn('⚠️ Redis initialization failed, using in-memory fallback.');
      }
    } else {
      console.log('ℹ️ No REDIS_URL provided. Running with high-speed in-memory cache.');
    }
  }

  async get(key) {
    if (this.isRedisConnected && this.client) {
      try {
        const val = await this.client.get(key);
        return val ? JSON.parse(val) : null;
      } catch (err) {
        console.warn(`Redis GET error for key ${key}, falling back to memory.`);
      }
    }

    const item = this.memoryCache.get(key);
    if (!item) return null;
    if (item.expiry && item.expiry < Date.now()) {
      this.memoryCache.delete(key);
      return null;
    }
    return item.data;
  }

  async set(key, value, ttlSeconds = 300) {
    if (this.isRedisConnected && this.client) {
      try {
        await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        return;
      } catch (err) {
        console.warn(`Redis SET error for key ${key}, saving to memory.`);
      }
    }

    this.memoryCache.set(key, {
      data: value,
      expiry: Date.now() + ttlSeconds * 1000
    });
  }

  async del(key) {
    if (this.isRedisConnected && this.client) {
      try {
        await this.client.del(key);
      } catch (err) {
        console.warn(`Redis DEL error for key ${key}`);
      }
    }
    this.memoryCache.delete(key);
  }

  async delPattern(pattern) {
    // Delete keys matching pattern e.g. "group:balances:*"
    if (this.isRedisConnected && this.client) {
      try {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } catch (err) {
        console.warn(`Redis DEL pattern error for ${pattern}`);
      }
    }

    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern.replace('*', ''))) {
        this.memoryCache.delete(key);
      }
    }
  }
}

export default new CacheService();
