import rateLimit from 'express-rate-limit';
import cacheService from '../services/cacheService.js';

/**
 * Custom rate limit store using Redis
 */
class RedisStore {
  constructor(options = {}) {
    this.prefix = options.prefix || 'rl:';
    this.windowMs = options.windowMs || 60000;
  }

  async increment(key) {
    const fullKey = `${this.prefix}${key}`;
    const ttlSeconds = Math.ceil(this.windowMs / 1000);

    const hits = await cacheService.increment(fullKey, ttlSeconds);

    if (hits === 1) {
      return {
        totalHits: hits,
        resetTime: new Date(Date.now() + this.windowMs)
      };
    }

    const ttl = await cacheService.redis?.ttl(fullKey);
    const resetTime = new Date(Date.now() + (ttl * 1000));

    return {
      totalHits: hits,
      resetTime
    };
  }

  async decrement(key) {
    const fullKey = `${this.prefix}${key}`;
    if (cacheService.isConnected) {
      await cacheService.redis.decr(fullKey);
    }
  }

  async resetKey(key) {
    const fullKey = `${this.prefix}${key}`;
    await cacheService.delete(fullKey);
  }
}

/**
 * AI-specific rate limiter
 */
export const aiRateLimiter = rateLimit({
  windowMs: parseInt(process.env.AI_RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  max: parseInt(process.env.AI_RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many AI requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use Redis store if available, otherwise fall back to memory
  store: cacheService.isConnected ? new RedisStore({
    prefix: 'rl:ai:',
    windowMs: parseInt(process.env.AI_RATE_LIMIT_WINDOW_MS) || 900000
  }) : undefined,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many AI requests',
      message: 'You have exceeded the rate limit for AI endpoints. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime.getTime() / 1000)
    });
  },
  skip: (req) => {
    // Skip rate limiting for authenticated premium users (future enhancement)
    return false;
  }
});

/**
 * General API rate limiter
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 100,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: cacheService.isConnected ? new RedisStore({
    prefix: 'rl:api:',
    windowMs: 60000
  }) : undefined
});

/**
 * Strict rate limiter for expensive operations
 */
export const strictRateLimiter = rateLimit({
  windowMs: 3600000, // 1 hour
  max: 10,
  message: {
    error: 'Too many requests for this operation, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: cacheService.isConnected ? new RedisStore({
    prefix: 'rl:strict:',
    windowMs: 3600000
  }) : undefined
});

export default {
  aiRateLimiter,
  apiRateLimiter,
  strictRateLimiter
};
