// config/redis.js
const redis = require('redis');

let redisClient = null;

const connectRedis = async () => {
  if (process.env.NODE_ENV === 'production' && process.env.REDIS_URL) {
    try {
      redisClient = redis.createClient({
        url: process.env.REDIS_URL,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            return new Error('Redis server refuses connection');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Retry time exhausted');
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      await redisClient.connect();
      console.log('Redis connected successfully');
    } catch (error) {
      console.warn('Redis connection failed, continuing without cache:', error.message);
      redisClient = null;
    }
  }
};

const getFromCache = async (key) => {
  if (!redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn('Redis get error:', error.message);
    return null;
  }
};

const setCache = async (key, data, ttl = 300) => {
  if (!redisClient) return;
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(data));
  } catch (error) {
    console.warn('Redis set error:', error.message);
  }
};

const clearCache = async (pattern) => {
  if (!redisClient) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.warn('Redis clear error:', error.message);
  }
};

module.exports = {
  connectRedis,
  getFromCache,
  setCache,
  clearCache
};
