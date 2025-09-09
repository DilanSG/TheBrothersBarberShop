// Debug utilities para desarrollo
export const debugLog = (component, action, data = null) => {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔍 [${component}] ${action}`);
    if (data) {
      console.log('Data:', data);
    }
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
  }
};

// Performance monitoring
export const performanceMonitor = {
  start: (name) => {
    if (process.env.NODE_ENV === 'development') {
      console.time(`⚡ ${name}`);
    }
  },
  
  end: (name) => {
    if (process.env.NODE_ENV === 'development') {
      console.timeEnd(`⚡ ${name}`);
    }
  }
};

// Error boundary helper
export const logError = (error, errorInfo) => {
  console.error('🚨 Error Boundary caught an error:', error);
  console.error('📍 Error Info:', errorInfo);
  
  // En producción, enviar a servicio de monitoreo
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrar con servicio de monitoreo (Sentry, LogRocket, etc.)
  }
};
