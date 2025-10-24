// healthRoutes.js - The Brothers Barber Shop Health Check & Monitoring Routes
// Comprehensive health monitoring for Docker and production environments

import express from 'express';
import { asyncHandler } from '../middleware/index.js';
import databaseConnection from '../../infrastructure/database/connection.js';
import smartCache from '../../infrastructure/cache/SmartCacheAdapter.js';
import cloudinaryService from '../../infrastructure/external/cloudinary.js';
import { logger } from '../../shared/utils/logger.js';

const router = express.Router();

/**
 * @desc    Basic health check
 * @route   GET /api/health
 * @access  Public
 */
router.get('/', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    response_time: Date.now() - startTime
  };

  res.status(200).json(health);
}));

/**
 * @desc    Comprehensive health check with all services
 * @route   GET /api/health/detailed
 * @access  Public
 */
router.get('/detailed', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  // Parallel health checks for better performance
  const [dbStatus, cacheStatus, cloudinaryStatus, memoryStatus] = await Promise.allSettled([
    checkDatabase(),
    checkCache(),
    checkCloudinary(),
    checkMemory()
  ]);

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: getSettledResult(dbStatus),
      cache: getSettledResult(cacheStatus),
      cloudinary: getSettledResult(cloudinaryStatus),
      memory: getSettledResult(memoryStatus)
    },
    response_time: Date.now() - startTime
  };

  // Determine overall status
  const hasUnhealthyService = Object.values(health.services).some(
    service => service.status !== 'healthy'
  );

  if (hasUnhealthyService) {
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
}));

/**
 * @desc    Database-specific health check
 * @route   GET /api/health/database
 * @access  Public
 */
router.get('/database', asyncHandler(async (req, res) => {
  const dbHealth = await checkDatabase();
  
  const statusCode = dbHealth.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(dbHealth);
}));

/**
 * @desc    Cache-specific health check
 * @route   GET /api/health/cache
 * @access  Public
 */
router.get('/cache', asyncHandler(async (req, res) => {
  const cacheHealth = await checkCache();
  
  const statusCode = cacheHealth.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(cacheHealth);
}));

/**
 * @desc    System metrics for monitoring
 * @route   GET /api/health/metrics
 * @access  Public
 */
router.get('/metrics', asyncHandler(async (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      platform: process.platform,
      node_version: process.version,
      environment: process.env.NODE_ENV
    },
    database: databaseConnection.getConnectionStatus(),
    cache: smartCache.getStats(),
    cloudinary: cloudinaryService.getStats()
  };

  res.status(200).json(metrics);
}));

/**
 * @desc    Readiness probe for Kubernetes/Docker
 * @route   GET /api/health/ready
 * @access  Public
 */
router.get('/ready', asyncHandler(async (req, res) => {
  const ready = {
    status: 'ready',
    timestamp: new Date().toISOString(),
    checks: {
      database: databaseConnection.isHealthy(),
      cache: smartCache.isHealthy()
    }
  };

  const isReady = Object.values(ready.checks).every(check => check === true);
  
  if (!isReady) {
    ready.status = 'not_ready';
  }

  const statusCode = isReady ? 200 : 503;
  res.status(statusCode).json(ready);
}));

/**
 * @desc    Liveness probe for Kubernetes/Docker
 * @route   GET /api/health/live
 * @access  Public
 */
router.get('/live', asyncHandler(async (req, res) => {
  // Simple liveness check - just verify the process is running
  const live = {
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid
  };

  res.status(200).json(live);
}));

// Helper functions

/**
 * Check database connection health
 */
async function checkDatabase() {
  try {
    const isHealthy = databaseConnection.isHealthy();
    
    if (!isHealthy) {
      return {
        status: 'unhealthy',
        message: 'Database not connected'
      };
    }

    // Test actual database operation
    await databaseConnection.testConnection();
    
    return {
      status: 'healthy',
      connection: databaseConnection.getConnectionStatus()
    };
  } catch (error) {
    logger.error('[HEALTH] Database check failed:', error);
    return {
      status: 'unhealthy',
      message: error.message
    };
  }
}

/**
 * Check cache health
 */
async function checkCache() {
  try {
    const isHealthy = smartCache.isHealthy();
    
    if (!isHealthy) {
      return {
        status: 'unhealthy',
        message: 'Cache error rate too high'
      };
    }

    // Test cache operations
    const testKey = 'health_check_test';
    const testValue = { timestamp: Date.now() };
    
    smartCache.set(testKey, testValue, 10);
    const retrieved = smartCache.get(testKey);
    smartCache.del(testKey);
    
    if (!retrieved) {
      throw new Error('Cache set/get test failed');
    }

    return {
      status: 'healthy',
      stats: smartCache.getStats()
    };
  } catch (error) {
    logger.error('[HEALTH] Cache check failed:', error);
    return {
      status: 'unhealthy',
      message: error.message
    };
  }
}

/**
 * Check Cloudinary service health
 */
async function checkCloudinary() {
  try {
    const health = await cloudinaryService.healthCheck();
    return health;
  } catch (error) {
    logger.error('[HEALTH] Cloudinary check failed:', error);
    return {
      status: 'unhealthy',
      message: error.message
    };
  }
}

/**
 * Check memory usage
 */
async function checkMemory() {
  try {
    const memory = process.memoryUsage();
    const totalMemory = memory.heapTotal + memory.external;
    const usedMemory = memory.heapUsed;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    let status = 'healthy';
    let message = 'Memory usage normal';

    if (memoryUsagePercent > 85) {
      status = 'unhealthy';
      message = 'High memory usage detected';
    } else if (memoryUsagePercent > 70) {
      status = 'degraded';
      message = 'Moderate memory usage';
    }

    return {
      status,
      message,
      memory: {
        ...memory,
        usage_percent: memoryUsagePercent.toFixed(2)
      }
    };
  } catch (error) {
    logger.error('[HEALTH] Memory check failed:', error);
    return {
      status: 'unhealthy',
      message: error.message
    };
  }
}

/**
 * Helper to extract result from Promise.allSettled
 */
function getSettledResult(settledResult) {
  if (settledResult.status === 'fulfilled') {
    return settledResult.value;
  } else {
    return {
      status: 'unhealthy',
      message: settledResult.reason?.message || 'Unknown error'
    };
  }
}

export default router;