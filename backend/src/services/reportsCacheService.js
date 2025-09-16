import { logger } from '../utils/logger.js';

// Variables para Redis (se inicializarán condicionalmente)
let redisClient = null;
let isRedisAvailable = () => false;

// Función para inicializar Redis de forma segura
const initializeRedis = async () => {
  try {
    if (process.env.REDIS_ENABLED === 'true') {
      const redisModule = await import('../config/redis.js');
      redisClient = redisModule.redisClient;
      isRedisAvailable = redisModule.isRedisAvailable;
      logger.info('✅ Redis inicializado para cache de reportes');
    } else {
      logger.info('ℹ️ Redis deshabilitado, cache de reportes funcionará en memoria');
    }
  } catch (error) {
    logger.warn('⚠️ Redis no disponible, continuando sin cache persistente:', error.message);
  }
};

// Inicializar Redis de forma asíncrona
initializeRedis();

/**
 * Servicio de Cache para Reportes Detallados
 * Implementa cache inteligente con TTL dinámico y invalidación automática
 */
class ReportsCacheService {
  constructor() {
    this.defaultTTL = 15 * 60; // 15 minutos por defecto
    this.keyPrefix = 'reports:';
  }

  /**
   * Generar clave de cache única para reportes
   */
  generateCacheKey(type, barberId, startDate, endDate) {
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    return `${this.keyPrefix}${type}:${barberId}:${start}:${end}`;
  }

  /**
   * Obtener TTL dinámico basado en el rango de fechas
   */
  calculateTTL(startDate, endDate) {
    const now = new Date();
    const isToday = endDate.toDateString() === now.toDateString();
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    if (isToday) {
      // Datos del día actual: cache por 5 minutos
      return 5 * 60;
    } else if (daysDiff === 1) {
      // Datos de un día: cache por 30 minutos
      return 30 * 60;
    } else if (daysDiff <= 7) {
      // Datos de una semana: cache por 1 hora
      return 60 * 60;
    } else {
      // Datos históricos: cache por 4 horas
      return 4 * 60 * 60;
    }
  }

  /**
   * Obtener datos del cache
   */
  async get(type, barberId, startDate, endDate) {
    try {
      if (!isRedisAvailable()) {
        return null;
      }

      const key = this.generateCacheKey(type, barberId, startDate, endDate);
      const cachedData = await redisClient.get(key);
      
      if (cachedData) {
        logger.info(`Cache HIT para reporte ${type}:${barberId}`);
        return JSON.parse(cachedData);
      }

      logger.info(`Cache MISS para reporte ${type}:${barberId}`);
      return null;
    } catch (error) {
      logger.error('Error al obtener del cache de reportes:', error);
      return null;
    }
  }

  /**
   * Guardar datos en el cache
   */
  async set(type, barberId, startDate, endDate, data) {
    try {
      if (!isRedisAvailable()) {
        return false;
      }

      const key = this.generateCacheKey(type, barberId, startDate, endDate);
      const ttl = this.calculateTTL(startDate, endDate);
      
      await redisClient.setex(key, ttl, JSON.stringify(data));
      logger.info(`Cache SET para reporte ${type}:${barberId} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      logger.error('Error al guardar en cache de reportes:', error);
      return false;
    }
  }

  /**
   * Invalidar cache de un barbero específico
   */
  async invalidateBarber(barberId) {
    try {
      if (!isRedisAvailable()) {
        return false;
      }

      const pattern = `${this.keyPrefix}*:${barberId}:*`;
      const keys = await redisClient.keys(pattern);
      
      if (keys.length > 0) {
        await redisClient.del(...keys);
        logger.info(`Cache invalidado para barbero ${barberId}: ${keys.length} keys`);
      }
      
      return true;
    } catch (error) {
      logger.error('Error al invalidar cache de barbero:', error);
      return false;
    }
  }

  /**
   * Invalidar cache de reportes por tipo
   */
  async invalidateReportType(type) {
    try {
      if (!isRedisAvailable()) {
        return false;
      }

      const pattern = `${this.keyPrefix}${type}:*`;
      const keys = await redisClient.keys(pattern);
      
      if (keys.length > 0) {
        await redisClient.del(...keys);
        logger.info(`Cache invalidado para tipo ${type}: ${keys.length} keys`);
      }
      
      return true;
    } catch (error) {
      logger.error('Error al invalidar cache por tipo:', error);
      return false;
    }
  }

  /**
   * Limpiar todo el cache de reportes
   */
  async clearAll() {
    try {
      if (!isRedisAvailable()) {
        return false;
      }

      const pattern = `${this.keyPrefix}*`;
      const keys = await redisClient.keys(pattern);
      
      if (keys.length > 0) {
        await redisClient.del(...keys);
        logger.info(`Cache de reportes limpiado: ${keys.length} keys eliminadas`);
      }
      
      return true;
    } catch (error) {
      logger.error('Error al limpiar cache de reportes:', error);
      return false;
    }
  }

  /**
   * Wrapper para ejecutar función con cache
   */
  async withCache(type, barberId, startDate, endDate, fetchFunction) {
    // Intentar obtener del cache primero
    const cachedData = await this.get(type, barberId, startDate, endDate);
    if (cachedData) {
      return cachedData;
    }

    // Si no hay cache, ejecutar la función y guardar resultado
    const data = await fetchFunction();
    await this.set(type, barberId, startDate, endDate, data);
    
    return data;
  }
}

// Instancia singleton
const reportsCacheService = new ReportsCacheService();

export { reportsCacheService, ReportsCacheService };
