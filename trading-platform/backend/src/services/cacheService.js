import Redis from 'ioredis';
import crypto from 'crypto';

class CacheService {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.ttl = parseInt(process.env.REDIS_CACHE_TTL) || 3600; // Default 1 hour
    this.initialize();
  }

  initialize() {
    try {
      const config = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      };

      if (process.env.REDIS_PASSWORD) {
        config.password = process.env.REDIS_PASSWORD;
      }

      this.redis = new Redis(config);

      this.redis.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.isConnected = true;
      });

      this.redis.on('error', (err) => {
        console.error('❌ Redis connection error:', err.message);
        this.isConnected = false;
      });

      this.redis.on('close', () => {
        console.log('⚠️  Redis connection closed');
        this.isConnected = false;
      });

    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      this.isConnected = false;
    }
  }

  /**
   * Generate a cache key from request parameters
   */
  generateKey(prefix, data) {
    const hash = crypto
      .createHash('md5')
      .update(JSON.stringify(data))
      .digest('hex');
    return `${prefix}:${hash}`;
  }

  /**
   * Get cached data
   */
  async get(key) {
    if (!this.isConnected) return null;

    try {
      const data = await this.redis.get(key);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set cached data with TTL
   */
  async set(key, data, customTTL = null) {
    if (!this.isConnected) return false;

    try {
      const ttl = customTTL || this.ttl;
      await this.redis.setex(key, ttl, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete cached data
   */
  async delete(key) {
    if (!this.isConnected) return false;

    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Delete all keys matching a pattern
   */
  async deletePattern(pattern) {
    if (!this.isConnected) return false;

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return false;
    }
  }

  /**
   * Get or set cached data with a callback
   */
  async getOrSet(key, callback, customTTL = null) {
    // Try to get from cache
    const cached = await this.get(key);
    if (cached !== null) {
      return { data: cached, fromCache: true };
    }

    // If not in cache, execute callback
    const data = await callback();

    // Store in cache
    await this.set(key, data, customTTL);

    return { data, fromCache: false };
  }

  /**
   * Increment a counter
   */
  async increment(key, ttl = null) {
    if (!this.isConnected) return 0;

    try {
      const value = await this.redis.incr(key);
      if (ttl && value === 1) {
        await this.redis.expire(key, ttl);
      }
      return value;
    } catch (error) {
      console.error('Cache increment error:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    if (!this.isConnected) {
      return { connected: false };
    }

    try {
      const info = await this.redis.info('stats');
      const dbSize = await this.redis.dbsize();

      return {
        connected: true,
        dbSize,
        info: info.split('\r\n').reduce((acc, line) => {
          const [key, value] = line.split(':');
          if (key && value) {
            acc[key] = value;
          }
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { connected: false, error: error.message };
    }
  }

  /**
   * Flush all cache
   */
  async flush() {
    if (!this.isConnected) return false;

    try {
      await this.redis.flushdb();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }

  /**
   * Close connection
   */
  async close() {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

// Export singleton instance
export default new CacheService();
