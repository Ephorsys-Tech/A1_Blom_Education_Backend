import redis from '../config/redis.config.js';
import logger from '../config/logger.js';

/**
 * Retrieve parsed data from Redis cache
 * @param {string} key 
 * @returns {Promise<any|null>}
 */
export const getCachedData = async (key) => {
  if (!redis || redis.status !== 'ready') return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger.error(`Error reading from Redis cache (key: ${key}):`, err);
    return null;
  }
};

/**
 * Save data to Redis cache
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttl - Time to live in seconds
 */
export const setCachedData = async (key, value, ttl = 300) => {
  if (!redis || redis.status !== 'ready') return;
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } catch (err) {
    logger.error(`Error writing to Redis cache (key: ${key}):`, err);
  }
};

/**
 * Delete a specific key from Redis cache
 * @param {string} key 
 */
export const deleteCachedData = async (key) => {
  if (!redis || redis.status !== 'ready') return;
  try {
    await redis.del(key);
  } catch (err) {
    logger.error(`Error deleting from Redis cache (key: ${key}):`, err);
  }
};

/**
 * Invalidate multiple cache keys using a non-blocking SCAN pattern.
 * @param {string} pattern - e.g. "blogs", "courses"
 */
export const invalidateCachePattern = async (pattern) => {
  if (!redis || redis.status !== 'ready') return;

  const matchPattern = `cache:${pattern}:*`;
  logger.info(`Invalidating cache pattern: ${matchPattern}`);

  let cursor = '0';
  let deletedCount = 0;
  try {
    do {
      const reply = await redis.scan(cursor, 'MATCH', matchPattern, 'COUNT', 100);
      cursor = reply[0];
      const keys = reply[1];
      if (keys.length > 0) {
        await redis.del(...keys);
        deletedCount += keys.length;
      }
    } while (cursor !== '0');
    logger.info(`Successfully deleted ${deletedCount} cached keys matching pattern: ${matchPattern}`);
  } catch (err) {
    logger.error(`Error during cache invalidation for pattern ${matchPattern}:`, err);
  }
};

/**
 * Express middleware to cache responses.
 * @param {string} keyPrefix - Namespace for the keys (e.g. "blogs")
 * @param {number} ttl - Cache TTL in seconds
 */
export const cacheMiddleware = (keyPrefix, ttl = 10) => {
  return async (req, res, next) => {
    if (!redis || redis?.status !== 'ready') {
      return next();
    }

    const url = req?.originalUrl || req.url;
    const cacheKey = `cache:${keyPrefix}:${url}`;

    try {
      const cached = await redis.get(cacheKey);
      console.log("Cache key :" , cached)
      if (cached) {
        logger.info(`Cache hit for key: ${cacheKey}`);
        return res.status(200).json(JSON.parse(cached));
      }

      logger.info(`Cache miss for key: ${cacheKey}. Fetching from database.`);

      // Intercept res.json
      const originalJson = res.json;
      res.json = function (body) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300 && body && body.success !== false) {
          redis.set(cacheKey, JSON.stringify(body), 'EX', ttl)
            .catch(err => logger.error(`Failed to cache response in middleware (key: ${cacheKey}):`, err));
        }
        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      logger.error(`Error in cacheMiddleware for key ${cacheKey}:`, error);
      next();
    }
  };
};

/**
 * Express middleware to invalidate a cache pattern on successful database mutations.
 * @param {string} keyPrefix - Namespace for the keys (e.g. "blogs")
 */
export const invalidateCacheMiddleware = (keyPrefix) => {
  return async (req, res, next) => {
    if (!redis || redis.status !== 'ready') {
      return next();
    }

    // Intercept response to clear cache only on successful mutations
    const originalJson = res.json;
    res.json = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        invalidateCachePattern(keyPrefix)
          .catch(err => logger.error(`Failed to invalidate cache prefix ${keyPrefix} on response:`, err));
      }
      return originalJson.call(this, body);
    };

    next();
  };
};
