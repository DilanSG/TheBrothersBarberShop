// SmartCacheAdapter.js - The Brothers Barber Shop Advanced Cache System
// Optimized for Docker containers and production environments

import NodeCache from 'node-cache';
import { logger } from '../../shared/utils/logger.js';
import config from '../../shared/config/index.js';

class SmartCacheAdapter {
  constructor() {
    // Initialize Node-cache with production-optimized settings
    this.cache = new NodeCache({
      stdTTL: config.cache?.ttl || 300, // 5 minutes default
      checkperiod: Math.floor((config.cache?.ttl || 300) / 3),
      useClones: false, // Performance optimization
      deleteOnExpire: true,
      maxKeys: config.cache?.maxKeys || 1000,
      // Docker container memory optimization
      forceString: false,
      objectValueSize: process.env.NODE_ENV === 'production' ? 1024 * 1024 : undefined // 1MB limit in prod
    });

    // Performance and monitoring stats
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      invalidations: 0,
      errors: 0,
      startTime: Date.now()
    };

    // Cache hit ratio tracking
    this.hitRatioWindow = [];
    this.maxWindowSize = 100;

    this.setupEventHandlers();
    this.startPerformanceMonitoring();
    
    logger.info(`[CACHE] SmartCache initialized for ${process.env.NODE_ENV} environment`, {
      ttl: config.cache?.ttl || 300,
      maxKeys: config.cache?.maxKeys || 1000,
      environment: process.env.NODE_ENV
    });
  }

  /**
   * Setup cache event handlers
   */
  setupEventHandlers() {
    // Key expiration
    this.cache.on('expired', (key, value) => {
      logger.debug(`[CACHE] Key expired: ${key}`);
    });

    // Key deletion
    this.cache.on('del', (key, value) => {
      this.stats.deletes++;
      logger.debug(`[CACHE] Key deleted: ${key}`);
    });

    // Cache flush
    this.cache.on('flush', () => {
      logger.info('[CACHE] Cache flushed');
      this.resetStats();
    });

    // Error handling
    this.cache.on('error', (err) => {
      this.stats.errors++;
      logger.error('[CACHE] Cache error:', err);
    });
  }

  /**
   * Start performance monitoring
   */
  startPerformanceMonitoring() {
    // Log performance stats every 5 minutes in production
    if (process.env.NODE_ENV === 'production') {
      setInterval(() => {
        this.logPerformanceStats();
      }, 5 * 60 * 1000);
    }
  }

  /**
   * Get value from cache with performance tracking
   */
  get(key) {
    try {
      const startTime = Date.now();
      const value = this.cache.get(key);
      const duration = Date.now() - startTime;

      if (value !== undefined) {
        this.stats.hits++;
        this.updateHitRatio(true);
        
        logger.debug(`[CACHE] Hit: ${key}`, { duration });
        return value;
      } else {
        this.stats.misses++;
        this.updateHitRatio(false);
        
        logger.debug(`[CACHE] Miss: ${key}`, { duration });
        return null;
      }
    } catch (error) {
      this.stats.errors++;
      logger.error(`[CACHE] Error getting key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL and compression
   */
  set(key, value, ttl) {
    try {
      const startTime = Date.now();
      
      // Validate value size in production
      if (process.env.NODE_ENV === 'production') {
        const size = JSON.stringify(value).length;
        if (size > 1024 * 1024) { // 1MB
          logger.warn(`[CACHE] Large value detected for key ${key}: ${size} bytes`);
        }
      }

      const success = this.cache.set(key, value, ttl);
      const duration = Date.now() - startTime;
      
      if (success) {
        this.stats.sets++;
        logger.debug(`[CACHE] Set: ${key}`, { ttl: ttl || 'default', duration });
      } else {
        this.stats.errors++;
        logger.warn(`[CACHE] Failed to set: ${key}`);
      }
      
      return success;
    } catch (error) {
      this.stats.errors++;
      logger.error(`[CACHE] Error setting key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete specific key
   */
  del(key) {
    try {
      const result = this.cache.del(key);
      logger.debug(`[CACHE] Delete key: ${key}`, { success: result > 0 });
      return result > 0;
    } catch (error) {
      this.stats.errors++;
      logger.error(`[CACHE] Error deleting key ${key}:`, error);
      return false;
    }
  }

  /**
   * Invalidate cache by pattern
   */
  invalidatePattern(pattern) {
    try {
      const keys = this.cache.keys();
      const regex = new RegExp(pattern);
      let invalidated = 0;

      keys.forEach(key => {
        if (regex.test(key)) {
          this.cache.del(key);
          invalidated++;
        }
      });

      this.stats.invalidations += invalidated;
      logger.info(`[CACHE] Invalidated ${invalidated} keys matching pattern: ${pattern}`);
      
      return invalidated;
    } catch (error) {
      this.stats.errors++;
      logger.error(`[CACHE] Error invalidating pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Get or set with fallback function
   */
  async getOrSet(key, fallbackFn, ttl) {
    try {
      // Try to get from cache first
      let value = this.get(key);
      
      if (value !== null) {
        return value;
      }

      // Execute fallback function
      const startTime = Date.now();
      value = await fallbackFn();
      const duration = Date.now() - startTime;

      // Cache the result
      this.set(key, value, ttl);
      
      logger.debug(`[CACHE] Fallback executed for ${key}`, { duration });
      return value;
    } catch (error) {
      this.stats.errors++;
      logger.error(`[CACHE] Error in getOrSet for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Bulk operations for better performance
   */
  mget(keys) {
    const result = {};
    keys.forEach(key => {
      result[key] = this.get(key);
    });
    return result;
  }

  mset(keyValuePairs, ttl) {
    let successCount = 0;
    
    Object.entries(keyValuePairs).forEach(([key, value]) => {
      if (this.set(key, value, ttl)) {
        successCount++;
      }
    });
    
    return successCount;
  }

  /**
   * Update hit ratio tracking
   */
  updateHitRatio(isHit) {
    this.hitRatioWindow.push(isHit ? 1 : 0);
    
    if (this.hitRatioWindow.length > this.maxWindowSize) {
      this.hitRatioWindow.shift();
    }
  }

  /**
   * Calculate current hit ratio
   */
  getHitRatio() {
    if (this.hitRatioWindow.length === 0) return 0;
    
    const hits = this.hitRatioWindow.reduce((sum, hit) => sum + hit, 0);
    return (hits / this.hitRatioWindow.length) * 100;
  }

  /**
   * Get comprehensive cache statistics
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRatio = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
    const uptime = Date.now() - this.stats.startTime;

    return {
      ...this.stats,
      totalRequests,
      hitRatio: hitRatio.toFixed(2),
      currentHitRatio: this.getHitRatio().toFixed(2),
      uptime: Math.floor(uptime / 1000),
      keyCount: this.cache.keys().length,
      memory: process.memoryUsage()
    };
  }

  /**
   * Log performance statistics
   */
  logPerformanceStats() {
    const stats = this.getStats();
    logger.info('[CACHE] Performance statistics:', stats);
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      invalidations: 0,
      errors: 0,
      startTime: Date.now()
    };
    this.hitRatioWindow = [];
  }

  /**
   * Health check for monitoring
   */
  isHealthy() {
    const errorRate = this.stats.errors / (this.stats.hits + this.stats.misses + this.stats.sets);
    return errorRate < 0.05; // Less than 5% error rate
  }

  /**
   * Get cache keys with optional pattern
   */
  keys(pattern) {
    try {
      const allKeys = this.cache.keys();
      
      if (pattern) {
        const regex = new RegExp(pattern);
        return allKeys.filter(key => regex.test(key));
      }
      
      return allKeys;
    } catch (error) {
      this.stats.errors++;
      logger.error('[CACHE] Error getting keys:', error);
      return [];
    }
  }

  /**
   * Flush all cache
   */
  flush() {
    try {
      this.cache.flushAll();
      logger.info('[CACHE] Cache flushed');
      return true;
    } catch (error) {
      this.stats.errors++;
      logger.error('[CACHE] Error flushing cache:', error);
      return false;
    }
  }

  /**
   * Graceful shutdown
   */
  close() {
    logger.info('[CACHE] Closing SmartCache...');
    this.cache.close();
    this.logPerformanceStats();
  }
}

// Create and export singleton instance
const smartCache = new SmartCacheAdapter();

// Graceful shutdown
process.on('SIGINT', () => smartCache.close());
process.on('SIGTERM', () => smartCache.close());

export default smartCache;