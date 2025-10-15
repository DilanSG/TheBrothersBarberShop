import { logger } from "../../../shared/utils/logger.js";
import NodeCache from "node-cache";

class ReportsCacheService {
  constructor() {
    this.cache = new NodeCache({
      stdTTL: 900,
      checkperiod: 120,
      useClones: false
    });
    this.keyPrefix = "reports:";
    logger.info("Smart cache de reportes inicializado (node-cache)");
  }

  generateCacheKey(type, barberId, startDate, endDate) {
    const start = startDate.toISOString().split("T")[0];
    const end = endDate.toISOString().split("T")[0];
    return `${this.keyPrefix}${type}:${barberId}:${start}:${end}`;
  }

  calculateTTL(startDate, endDate) {
    const now = new Date();
    const isToday = endDate.toDateString() === now.toDateString();
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    if (isToday) return 300;
    else if (daysDiff === 1) return 1800;
    else if (daysDiff <= 7) return 3600;
    else return 14400;
  }

  async get(type, barberId, startDate, endDate) {
    try {
      const key = this.generateCacheKey(type, barberId, startDate, endDate);
      const cachedData = this.cache.get(key);
      if (cachedData) {
        logger.info(`Cache HIT: ${type}:${barberId}`);
        return cachedData;
      }
      return null;
    } catch (error) {
      logger.error("Error en cache:", error);
      return null;
    }
  }

  async set(type, barberId, startDate, endDate, data) {
    try {
      const key = this.generateCacheKey(type, barberId, startDate, endDate);
      const ttl = this.calculateTTL(startDate, endDate);
      return this.cache.set(key, data, ttl);
    } catch (error) {
      logger.error("Error guardando cache:", error);
      return false;
    }
  }

  async invalidateBarber(barberId) {
    try {
      const keys = this.cache.keys().filter(k => k.includes(`:${barberId}:`));
      if (keys.length > 0) this.cache.del(keys);
      return true;
    } catch (error) {
      return false;
    }
  }

  async invalidateReportType(type) {
    try {
      const keys = this.cache.keys().filter(k => k.startsWith(`${this.keyPrefix}${type}:`));
      if (keys.length > 0) this.cache.del(keys);
      return true;
    } catch (error) {
      return false;
    }
  }

  async clearAll() {
    try {
      const keys = this.cache.keys().filter(k => k.startsWith(this.keyPrefix));
      if (keys.length > 0) this.cache.del(keys);
      return true;
    } catch (error) {
      return false;
    }
  }

  async withCache(type, barberId, startDate, endDate, dataGenerator) {
    const cachedData = await this.get(type, barberId, startDate, endDate);
    if (cachedData) return cachedData;
    const freshData = await dataGenerator();
    await this.set(type, barberId, startDate, endDate, freshData);
    return freshData;
  }

  getStats() {
    const stats = this.cache.getStats();
    return {
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hits > 0 ? stats.hits / (stats.hits + stats.misses) : 0
    };
  }
}

export const reportsCacheService = new ReportsCacheService();
export default ReportsCacheService;