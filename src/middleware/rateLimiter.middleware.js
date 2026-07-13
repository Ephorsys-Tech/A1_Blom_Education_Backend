import redis from '../config/redis.config.js';
import logger from '../config/logger.js';

/**
 * Factory to create a Token Bucket Rate Limiting Middleware.
 * 
 * @param {Object} options
 * @param {number} options.capacity - Maximum capacity of the bucket (max burst requests).
 * @param {number} options.ratePerSec - Refill rate of the bucket in tokens per second.
 * @param {function} [options.keyGenerator] - Function to generate custom rate limit keys (defaults to IP address).
 * @param {string} [options.message] - Custom error message when rate limited.
 */
export const rateLimiter = ({
  capacity,
  ratePerSec,
  keyGenerator,
  message = 'Too many requests. Please try again later.'
}) => {
  return async (req, res, next) => {
    // 1. Check if Redis is initialized and ready
    if (!redis || redis.status !== 'ready') {
      logger.warn(`Redis client not ready (status: ${redis ? redis.status : 'undefined'}). Rate limiter falling open.`);
      return next();
    }

    // 2. Determine rate limit key identifier
    let identifier;
    if (keyGenerator) {
      try {
        identifier = keyGenerator(req);
      } catch (err) {
        logger.error('Error in custom rate limiter keyGenerator:', err);
      }
    }

    // Fallback key: client IP address
    if (!identifier) {
      identifier = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress || 'unknown-ip';
    }

    const key = `rl:tb:${identifier}`;
    const now = Date.now();
    const fillRatePerMs = ratePerSec / 1000;
    const cost = 1;

    try {
      // 3. Execute the atomic Lua script in Redis
      const [allowed, remainingTokens] = await redis.rateLimitTokenBucket(
        key,
        capacity,
        fillRatePerMs,
        now,
        cost
      );

      // 4. Set response headers
      res.setHeader('X-RateLimit-Limit', capacity);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, Math.floor(remainingTokens)));

      if (allowed === 1) {
        // Request allowed, proceed
        return next();
      } else {
        // Request blocked (too many requests)
        const missingTokens = cost - remainingTokens;
        const retryAfter = Math.ceil(missingTokens / ratePerSec);

        res.setHeader('Retry-After', retryAfter);
        return res.status(429).json({
          success: false,
          message,
          retryAfter
        });
      }
    } catch (error) {
      logger.error(`Rate limiter execution error for key ${key}:`, error);
      // Fail-open: proceed if Redis execution errors out
      return next();
    }
  };
};

// Global API Rate Limiter: 100 requests per minute
export const apiRateLimiter = rateLimiter({
  capacity: 10,
  ratePerSec: 1 / 60,
  message: "Too many requests. Please try again in a minute."
});

// Stricter Rate Limiter for sensitive Auth/Verification endpoints: 10 requests per minute
export const authRateLimiter = rateLimiter({
  capacity: 10,
  ratePerSec: 1 / 60,
  message: "Too many login or verification attempts. Please try again in a minute."
});

