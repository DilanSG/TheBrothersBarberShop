/**
import logger from '../utils/logger';
 * Utilidad para medir y comparar rendimiento entre hook original y optimizado
 */
class PerformanceTracker {
  constructor() {
    this.metrics = {
      original: { requests: 0, loadTimes: [], cacheHits: 0, errors: 0 },
      optimized: { requests: 0, loadTimes: [], cacheHits: 0, errors: 0 }
    };
    this.currentTest = null;
    this.startTime = null;
  }

  startTest(testType) {
    this.currentTest = testType; // 'original' or 'optimized'
    this.startTime = performance.now();
    logger.debug(`🏁 Iniciando test de rendimiento: ${testType}`);
  }

  endTest() {
    if (!this.currentTest || !this.startTime) return;
    
    const endTime = performance.now();
    const loadTime = endTime - this.startTime;
    
    this.metrics[this.currentTest].loadTimes.push(loadTime);
    
    logger.debug(`🏆 Test ${this.currentTest} completado en ${loadTime.toFixed(2)}ms`);
    
    this.currentTest = null;
    this.startTime = null;
  }

  recordRequest(testType = this.currentTest) {
    if (testType && this.metrics[testType]) {
      this.metrics[testType].requests++;
    }
  }

  recordCacheHit(testType = this.currentTest) {
    if (testType && this.metrics[testType]) {
      this.metrics[testType].cacheHits++;
    }
  }

  recordError(testType = this.currentTest) {
    if (testType && this.metrics[testType]) {
      this.metrics[testType].errors++;
    }
  }

  getComparison() {
    const original = this.metrics.original;
    const optimized = this.metrics.optimized;

    const avgLoadTimeOriginal = original.loadTimes.length > 0 
      ? original.loadTimes.reduce((a, b) => a + b, 0) / original.loadTimes.length 
      : 0;
    
    const avgLoadTimeOptimized = optimized.loadTimes.length > 0 
      ? optimized.loadTimes.reduce((a, b) => a + b, 0) / optimized.loadTimes.length 
      : 0;

    const improvement = avgLoadTimeOriginal > 0 
      ? ((avgLoadTimeOriginal - avgLoadTimeOptimized) / avgLoadTimeOriginal * 100).toFixed(1)
      : 0;

    return {
      original: {
        avgLoadTime: avgLoadTimeOriginal.toFixed(2),
        totalRequests: original.requests,
        cacheHits: original.cacheHits,
        errors: original.errors
      },
      optimized: {
        avgLoadTime: avgLoadTimeOptimized.toFixed(2),
        totalRequests: optimized.requests,
        cacheHits: optimized.cacheHits,
        errors: optimized.errors
      },
      improvement: {
        loadTime: `${improvement}%`,
        requestReduction: original.requests > 0 
          ? `${((original.requests - optimized.requests) / original.requests * 100).toFixed(1)}%`
          : '0%',
        cacheEfficiency: optimized.cacheHits > 0 
          ? `${(optimized.cacheHits / (optimized.requests + optimized.cacheHits) * 100).toFixed(1)}%`
          : '0%'
      }
    };
  }

  printReport() {
    const comparison = this.getComparison();
    
    logger.debug('\n📊 REPORTE DE RENDIMIENTO');
    logger.debug('==========================');
    logger.debug('\n🔴 HOOK ORIGINAL:');
    logger.debug(`• Tiempo promedio: ${comparison.original.avgLoadTime}ms`);
    logger.debug(`• Requests totales: ${comparison.original.totalRequests}`);
    logger.debug(`• Cache hits: ${comparison.original.cacheHits}`);
    logger.debug(`• Errores: ${comparison.original.errors}`);
    
    logger.debug('\n🟢 HOOK OPTIMIZADO:');
    logger.debug(`• Tiempo promedio: ${comparison.optimized.avgLoadTime}ms`);
    logger.debug(`• Requests totales: ${comparison.optimized.totalRequests}`);
    logger.debug(`• Cache hits: ${comparison.optimized.cacheHits}`);
    logger.debug(`• Errores: ${comparison.optimized.errors}`);
    
    logger.debug('\n📈 MEJORAS:');
    logger.debug(`• Reducción tiempo carga: ${comparison.improvement.loadTime}`);
    logger.debug(`• Reducción requests: ${comparison.improvement.requestReduction}`);
    logger.debug(`• Eficiencia cache: ${comparison.improvement.cacheEfficiency}`);
    
    return comparison;
  }

  reset() {
    this.metrics = {
      original: { requests: 0, loadTimes: [], cacheHits: 0, errors: 0 },
      optimized: { requests: 0, loadTimes: [], cacheHits: 0, errors: 0 }
    };
    logger.debug('🔄 Métricas de rendimiento reseteadas');
  }
}

// Crear instancia global para testing
const performanceTracker = new PerformanceTracker();

// Exponer en window para debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.performanceTracker = performanceTracker;
  logger.debug('🐛 performanceTracker expuesto en window.performanceTracker para testing');
}

export default performanceTracker;

