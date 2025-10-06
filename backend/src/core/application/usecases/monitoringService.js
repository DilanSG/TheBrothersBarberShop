import os from 'os';
import { logger } from '../../../shared/utils/logger.js';

class MonitoringService {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        errors: 0,
        byEndpoint: new Map()
      },
      responseTime: {
        avg: 0,
        max: 0,
        min: Infinity
      },
      memory: {
        usage: [],
        maxUsage: 0
      },
      cpu: {
        usage: [],
        maxUsage: 0
      },
      errors: {
        count: 0,
        byType: new Map()
      },
      cache: {
        hits: 0,
        misses: 0,
        ratio: 0
      }
    };

    // Iniciar monitoreo de recursos
    this.startResourceMonitoring();
  }

  // Monitoreo de recursos del sistema
  async startResourceMonitoring() {
    setInterval(async () => {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = await this.getCPUUsage();

      // Memoria
      this.metrics.memory.usage.push({
        timestamp: Date.now(),
        value: memoryUsage.heapUsed / 1024 / 1024 // MB
      });

      this.metrics.memory.maxUsage = Math.max(
        this.metrics.memory.maxUsage,
        memoryUsage.heapUsed / 1024 / 1024
      );

      // CPU
      this.metrics.cpu.usage.push({
        timestamp: Date.now(),
        value: cpuUsage
      });

      this.metrics.cpu.maxUsage = Math.max(
        this.metrics.cpu.maxUsage,
        cpuUsage
      );

      // Mantener solo últimos 100 registros
      if (this.metrics.memory.usage.length > 100) {
        this.metrics.memory.usage.shift();
      }
      if (this.metrics.cpu.usage.length > 100) {
        this.metrics.cpu.usage.shift();
      }

      // Log SOLO si hay uso REALMENTE alto de recursos
      if (cpuUsage > 90 || (memoryUsage.heapUsed / 1024 / 1024) > 100) {
        logger.warn('Alto uso de recursos detectado', {
          cpu: cpuUsage,
          memory: memoryUsage.heapUsed / 1024 / 1024,
          module: 'monitoring'
        });
      }
    }, 300000); // Cada 5 minutos en lugar de cada minuto
  }

  // Calcula uso de CPU
  async getCPUUsage() {
    const startMeasure = os.cpus().map(cpu => ({
      idle: cpu.times.idle,
      total: Object.values(cpu.times).reduce((acc, tv) => acc + tv, 0)
    }));

    await new Promise(resolve => setTimeout(resolve, 100));

    const endMeasure = os.cpus().map(cpu => ({
      idle: cpu.times.idle,
      total: Object.values(cpu.times).reduce((acc, tv) => acc + tv, 0)
    }));

    const cpuUsage = startMeasure.map((start, i) => {
      const end = endMeasure[i];
      const idle = end.idle - start.idle;
      const total = end.total - start.total;
      return ((1 - idle / total) * 100).toFixed(1);
    });

    return parseFloat(cpuUsage.reduce((acc, usage) => acc + parseFloat(usage), 0) / cpuUsage.length);
  }

  // Registra una request
  trackRequest(req, startTime) {
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    
    if (!this.metrics.requests.byEndpoint.has(endpoint)) {
      this.metrics.requests.byEndpoint.set(endpoint, {
        count: 0,
        errors: 0,
        totalTime: 0
      });
    }

    const endpointMetrics = this.metrics.requests.byEndpoint.get(endpoint);
    endpointMetrics.count++;
    
    this.metrics.requests.total++;
    
    return {
      endpointMetrics,
      endpoint,
      startTime
    };
  }

  // Registra una respuesta exitosa
  trackSuccess(tracking, responseTime) {
    this.metrics.requests.success++;
    tracking.endpointMetrics.totalTime += responseTime;

    // Actualizar tiempos de respuesta
    this.metrics.responseTime.avg = (
      (this.metrics.responseTime.avg * (this.metrics.requests.total - 1) + responseTime) /
      this.metrics.requests.total
    );
    this.metrics.responseTime.max = Math.max(this.metrics.responseTime.max, responseTime);
    this.metrics.responseTime.min = Math.min(this.metrics.responseTime.min, responseTime);

    // Log si el tiempo de respuesta es alto
    if (responseTime > 1000) {
      logger.warn('Tiempo de respuesta alto detectado', {
        endpoint: tracking.endpoint,
        responseTime,
        module: 'monitoring'
      });
    }
  }

  // Registra un error
  trackError(tracking, error) {
    this.metrics.requests.errors++;
    tracking.endpointMetrics.errors++;
    this.metrics.errors.count++;

    const errorType = error.name || 'UnknownError';
    const errorCount = this.metrics.errors.byType.get(errorType) || 0;
    this.metrics.errors.byType.set(errorType, errorCount + 1);

    // Log de errores frecuentes
    if (errorCount > 10) {
      logger.error('Error frecuente detectado', {
        type: errorType,
        count: errorCount,
        module: 'monitoring'
      });
    }
  }

  // Registra eventos de caché
  trackCache(hit) {
    if (hit) {
      this.metrics.cache.hits++;
    } else {
      this.metrics.cache.misses++;
    }
    
    const total = this.metrics.cache.hits + this.metrics.cache.misses;
    this.metrics.cache.ratio = (this.metrics.cache.hits / total) * 100;
  }

  // Obtiene todas las métricas
  getMetrics() {
    const now = new Date();
    const uptime = process.uptime();
    
    return {
      timestamp: now.toISOString(),
      uptime: uptime,
      requests: {
        total: this.metrics.requests.total,
        success: this.metrics.requests.success,
        errors: this.metrics.requests.errors,
        byEndpoint: Object.fromEntries(this.metrics.requests.byEndpoint)
      },
      responseTime: this.metrics.responseTime,
      memory: {
        current: process.memoryUsage().heapUsed / 1024 / 1024,
        max: this.metrics.memory.maxUsage,
        history: this.metrics.memory.usage
      },
      cpu: {
        current: this.metrics.cpu.usage[this.metrics.cpu.usage.length - 1]?.value || 0,
        max: this.metrics.cpu.maxUsage,
        history: this.metrics.cpu.usage
      },
      errors: {
        total: this.metrics.errors.count,
        byType: Object.fromEntries(this.metrics.errors.byType)
      },
      cache: this.metrics.cache
    };
  }
}

// Singleton
export default new MonitoringService();
