// utils/errorLogger.js
class ErrorLogger {
  static logError(error, context = {}) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Solo en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.group('🔴 Error Log');
      console.error('Error:', error);
      console.table(context);
      console.groupEnd();
    }

    // En producción, enviar a servicio de logging
    if (process.env.NODE_ENV === 'production') {
      // Implementar envío a Sentry, LogRocket, etc.
      this.sendToLoggingService(errorInfo);
    }
  }

  static sendToLoggingService(errorInfo) {
    // Placeholder para servicio de logging externo
    // fetch('/api/logs/error', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorInfo)
    // });
  }

  static logPerformance(name, duration, metadata = {}) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ Performance: ${name} took ${duration}ms`, metadata);
    }
  }
}

export default ErrorLogger;
