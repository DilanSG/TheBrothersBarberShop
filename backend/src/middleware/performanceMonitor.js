// middleware/performanceMonitor.js
export const performanceMonitor = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  const startMemory = process.memoryUsage();

  // Override res.end para capturar métricas
  const originalEnd = res.end;
  res.end = function(...args) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convertir a ms
    const endMemory = process.memoryUsage();
    
    // Métricas de rendimiento
    const metrics = {
      method: req.method,
      route: req.route?.path || req.path,
      statusCode: res.statusCode,
      duration: Math.round(duration * 100) / 100, // Redondear a 2 decimales
      memoryDelta: {
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        external: endMemory.external - startMemory.external,
        rss: endMemory.rss - startMemory.rss
      },
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress
    };

    // Log de rendimiento solo en desarrollo o para requests lentos
    if (process.env.NODE_ENV === 'development' || duration > 1000) {
      console.log(`🚀 Performance: ${req.method} ${req.path} - ${duration}ms`, {
        statusCode: res.statusCode,
        memoryDelta: metrics.memoryDelta.heapUsed
      });
    }

    // En producción, log solo requests muy lentos o con errores
    if (process.env.NODE_ENV === 'production' && (duration > 5000 || res.statusCode >= 400)) {
      console.warn('⚠️ Slow/Error Request:', metrics);
    }

    // Aquí podrías enviar métricas a un servicio externo como DataDog, New Relic, etc.
    // await sendMetricsToService(metrics);

    originalEnd.apply(this, args);
  };

  next();
};
