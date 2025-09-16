import Redis from 'ioredis';
import { logger } from '../utils/logger.js';

let redisClient = null;

const createRedisClient = () => {
  try {
    // Configuración de Redis
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: process.env.REDIS_DB || 0,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      connectTimeout: 10000,
      commandTimeout: 5000,
    };

    // Solo crear cliente si Redis está configurado
    if (process.env.REDIS_ENABLED === 'true') {
      redisClient = new Redis(redisConfig);

      redisClient.on('connect', () => {
        logger.info('✅ Conectado a Redis');
      });

      redisClient.on('ready', () => {
        logger.info('🚀 Redis listo para usar');
      });

      redisClient.on('error', (error) => {
        logger.warn('❌ Error de conexión a Redis:', error.message);
        logger.warn('🔄 Continuando sin cache Redis...');
      });

      redisClient.on('close', () => {
        logger.warn('🔌 Conexión a Redis cerrada');
      });

      redisClient.on('reconnecting', () => {
        logger.info('🔄 Reintentando conexión a Redis...');
      });

      // Intentar conectar
      redisClient.connect().catch(error => {
        logger.warn('❌ No se pudo conectar a Redis:', error.message);
        logger.warn('🔄 Continuando sin cache Redis...');
        redisClient = null;
      });
    } else {
      logger.info('ℹ️ Redis deshabilitado en configuración');
    }

  } catch (error) {
    logger.warn('❌ Error configurando Redis:', error.message);
    logger.warn('🔄 Continuando sin cache Redis...');
    redisClient = null;
  }

  return redisClient;
};

// Inicializar cliente Redis
if (!redisClient) {
  createRedisClient();
}

// Función para verificar si Redis está disponible
const isRedisAvailable = () => {
  return redisClient && redisClient.status === 'ready';
};

// Función para obtener el cliente Redis
const getRedisClient = () => {
  return redisClient;
};

// Función para cerrar la conexión
const closeRedisConnection = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('🔌 Conexión a Redis cerrada correctamente');
    } catch (error) {
      logger.error('❌ Error cerrando conexión a Redis:', error);
    }
  }
};

export {
  redisClient,
  isRedisAvailable,
  getRedisClient,
  closeRedisConnection,
  createRedisClient
};
