/**
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
    console.log(`🏁 Iniciando test de rendimiento: ${testType}`);
  }

  endTest() {
    if (!this.currentTest || !this.startTime) return;
    
    const endTime = performance.now();
    const loadTime = endTime - this.startTime;
    
    this.metrics[this.currentTest].loadTimes.push(loadTime);
    
    console.log(`🏆 Test ${this.currentTest} completado en ${loadTime.toFixed(2)}ms`);
    
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
    
    console.log('\n📊 REPORTE DE RENDIMIENTO');
    console.log('==========================');
    console.log('\n🔴 HOOK ORIGINAL:');
    console.log(`• Tiempo promedio: ${comparison.original.avgLoadTime}ms`);
    console.log(`• Requests totales: ${comparison.original.totalRequests}`);
    console.log(`• Cache hits: ${comparison.original.cacheHits}`);
    console.log(`• Errores: ${comparison.original.errors}`);
    
    console.log('\n🟢 HOOK OPTIMIZADO:');
    console.log(`• Tiempo promedio: ${comparison.optimized.avgLoadTime}ms`);
    console.log(`• Requests totales: ${comparison.optimized.totalRequests}`);
    console.log(`• Cache hits: ${comparison.optimized.cacheHits}`);
    console.log(`• Errores: ${comparison.optimized.errors}`);
    
    console.log('\n📈 MEJORAS:');
    console.log(`• Reducción tiempo carga: ${comparison.improvement.loadTime}`);
    console.log(`• Reducción requests: ${comparison.improvement.requestReduction}`);
    console.log(`• Eficiencia cache: ${comparison.improvement.cacheEfficiency}`);
    
    return comparison;
  }

  reset() {
    this.metrics = {
      original: { requests: 0, loadTimes: [], cacheHits: 0, errors: 0 },
      optimized: { requests: 0, loadTimes: [], cacheHits: 0, errors: 0 }
    };
    console.log('🔄 Métricas de rendimiento reseteadas');
  }
}

// Crear instancia global para testing
const performanceTracker = new PerformanceTracker();

// Exponer en window para debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.performanceTracker = performanceTracker;
  console.log('🐛 performanceTracker expuesto en window.performanceTracker para testing');
}

export default performanceTracker;
