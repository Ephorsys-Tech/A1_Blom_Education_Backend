import Redis from 'ioredis';
import logger from './logger.js';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

logger.info(`Initializing Redis connection to: ${redisUrl.split('@').pop()}`); // Log host without password details

let redis;

try {
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
    // If using SSL/TLS (e.g. Upstash rediss://), enable TLS options if needed.
    // ioredis handles tls automatically when the protocol is rediss://.
    tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined
  });

  redis.on('connect', () => {
    logger.info('Redis client connecting...');
  });

  redis.on('ready', () => {
    logger.info('Redis client ready and connected successfully.');
  });

  redis.on('error', (err) => {
    logger.error('Redis client error:', err);
  });

  redis.on('close', () => {
    logger.warn('Redis connection closed.');
  });

  redis.on('reconnecting', (time) => {
    logger.info(`Redis reconnecting... Attempt: ${time}`);
  });

  // Define custom command for Token Bucket Rate Limiter using Lua script
  redis.defineCommand('rateLimitTokenBucket', {
    numberOfKeys: 1,
    lua: `
      local key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local fill_rate = tonumber(ARGV[2]) -- tokens per millisecond
      local now = tonumber(ARGV[3])       -- current timestamp in ms
      local cost = tonumber(ARGV[4]) or 1

      -- Retrieve current bucket state (tokens and last update timestamp)
      local data = redis.call('HMGET', key, 'tokens', 'last_updated')
      local tokens = tonumber(data[1])
      local last_updated = tonumber(data[2])

      -- If the bucket doesn't exist, initialize it
      if not tokens or not last_updated then
        tokens = capacity
        last_updated = now
      else
        -- Calculate elapsed time and generate new tokens
        local elapsed = math.max(0, now - last_updated)
        tokens = math.min(capacity, tokens + (elapsed * fill_rate))
      end

      -- Check if we have enough tokens
      if tokens >= cost then
        tokens = tokens - cost
        last_updated = now
        
        -- Save new state
        redis.call('HMSET', key, 'tokens', tokens, 'last_updated', last_updated)
        
        -- Set TTL to when the bucket will be completely full again
        local ttl = math.ceil(capacity / fill_rate / 1000)
        redis.call('EXPIRE', key, ttl)
        
        return {1, tokens} -- [Allowed = true, remaining tokens]
      else
        return {0, tokens} -- [Allowed = false, remaining tokens]
      end
    `
  });

} catch (error) {
  logger.error('Failed to create Redis client instance:', error);
}

export default redis;
