import { createClient } from 'redis';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

let redisClient = null;

// Configuración de Redis
const redisConfig = {
  host: config.redis?.host || 'localhost',
  port: config.redis?.port || 6379,
  password: config.redis?.password || undefined,
  db: config.redis?.db || 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true
};

/**
 * Inicializar conexión a Redis
 */
export const initRedis = async () => {
  try {
    if (process.env.NODE_ENV === 'development' && !process.env.REDIS_URL) {
      logger.info('Redis no configurado - modo desarrollo sin caché');
      return null;
    }

    redisClient = createClient({
      url: process.env.REDIS_URL || `redis://${redisConfig.host}:${redisConfig.port}`,
      ...redisConfig
    });

    redisClient.on('error', (err) => {
      logger.error('Redis connection error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    redisClient.on('ready', () => {
      logger.info('Redis ready to use');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Redis:', error);
    return null;
  }
};

/**
 * Obtener cliente Redis
 */
export const getRedisClient = () => redisClient;

/**
 * Verificar si Redis está disponible
 */
export const isRedisAvailable = () => {
  return redisClient && redisClient.isReady;
};

/**
 * Cache wrapper con fallback
 */
export const cache = {
  async get(key) {
    if (!isRedisAvailable()) return null;
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis GET error:', error);
      return null;
    }
  },

  async set(key, value, ttl = 3600) {
    if (!isRedisAvailable()) return false;
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Redis SET error:', error);
      return false;
    }
  },

  async del(key) {
    if (!isRedisAvailable()) return false;
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error('Redis DEL error:', error);
      return false;
    }
  },

  async invalidatePattern(pattern) {
    if (!isRedisAvailable()) return false;
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return true;
    } catch (error) {
      logger.error('Redis INVALIDATE error:', error);
      return false;
    }
  }
};

/**
 * Cerrar conexión Redis
 */
export const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};

export default {
  initRedis,
  getRedisClient,
  isRedisAvailable,
  cache,
  closeRedis
};
