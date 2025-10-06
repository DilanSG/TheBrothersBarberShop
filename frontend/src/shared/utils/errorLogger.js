/**
import logger from '../utils/logger';
 * Sistema de logging de errores para The Brothers Barbershop
 * Captura, categoriza y reporta errores del frontend
 */

class ErrorLogger {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.errors = [];
    this.maxErrors = 100; // Límite de errores en memoria
    
    this.init();
  }

  init() {
    // Capturar errores globales
    this.setupGlobalErrorHandling();
    
    // Capturar errores de promesas rechazadas
    this.setupUnhandledRejections();
    
    // Capturar errores de React (si está disponible)
    this.setupReactErrorBoundary();

    logger.debug('🚨 ErrorLogger inicializado');
  }

  /**
   * Configurar captura global de errores
   */
  setupGlobalErrorHandling() {
    if (typeof window === 'undefined') return;

    window.addEventListener('error', (event) => {
      this.logError({
        type: 'javascript_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        severity: 'error'
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'unhandled_promise_rejection',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        severity: 'error'
      });
    });
  }

  setupUnhandledRejections() {
    if (typeof window === 'undefined') return;

    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'promise_rejection',
        message: `Unhandled promise rejection: ${event.reason}`,
        severity: 'error',
        context: {
          reason: event.reason
        }
      });
    });
  }

  setupReactErrorBoundary() {
    // Se implementará con React Error Boundary en componentes
  }

  /**
   * Logging principal de errores
   */
  logError(errorData) {
    const error = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      ...errorData
    };

    // Agregar a memoria local
    this.errors.unshift(error);
    
    // Mantener límite de errores
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log en consola
    this.logToConsole(error);

    // Enviar a servidor si es producción
    if (this.isProduction) {
      this.sendToServer(error);
    }

    return error.id;
  }

  /**
   * Categorías específicas de errores
   */
  api = {
    error: (endpoint, statusCode, message, responseData = null) => {
      this.logError({
        type: 'api_error',
        message: `API Error: ${message}`,
        severity: statusCode >= 500 ? 'critical' : 'error',
        context: {
          endpoint,
          statusCode,
          responseData
        }
      });
    },

    timeout: (endpoint, timeout) => {
      this.logError({
        type: 'api_timeout',
        message: `API Timeout: ${endpoint}`,
        severity: 'warning',
        context: { endpoint, timeout }
      });
    },

    networkError: (endpoint, error) => {
      this.logError({
        type: 'network_error',
        message: `Network Error: ${endpoint}`,
        severity: 'error',
        context: { endpoint, error: error.message }
      });
    }
  };

  auth = {
    loginFailed: (reason) => {
      this.logError({
        type: 'auth_login_failed',
        message: `Login failed: ${reason}`,
        severity: 'warning',
        context: { reason }
      });
    },

    tokenExpired: () => {
      this.logError({
        type: 'auth_token_expired',
        message: 'JWT token expired',
        severity: 'info'
      });
    },

    unauthorized: (endpoint) => {
      this.logError({
        type: 'auth_unauthorized',
        message: `Unauthorized access attempt: ${endpoint}`,
        severity: 'warning',
        context: { endpoint }
      });
    }
  };

  ui = {
    componentError: (componentName, error) => {
      this.logError({
        type: 'component_error',
        message: `Component Error in ${componentName}: ${error.message}`,
        severity: 'error',
        stack: error.stack,
        context: { componentName }
      });
    },

    formValidationError: (formName, errors) => {
      this.logError({
        type: 'form_validation_error',
        message: `Form validation failed: ${formName}`,
        severity: 'info',
        context: { formName, errors }
      });
    },

    routeError: (route, error) => {
      this.logError({
        type: 'route_error',
        message: `Route error: ${route}`,
        severity: 'error',
        context: { route, error: error.message }
      });
    }
  };

  business = {
    appointmentBookingFailed: (reason, appointmentData) => {
      this.logError({
        type: 'appointment_booking_failed',
        message: `Appointment booking failed: ${reason}`,
        severity: 'error',
        context: { reason, appointmentData }
      });
    },

    paymentError: (reason, amount) => {
      this.logError({
        type: 'payment_error',
        message: `Payment failed: ${reason}`,
        severity: 'critical',
        context: { reason, amount }
      });
    },

    inventoryError: (action, productId, error) => {
      this.logError({
        type: 'inventory_error',
        message: `Inventory ${action} failed for product ${productId}`,
        severity: 'error',
        context: { action, productId, error }
      });
    }
  };

  /**
   * Utilidades
   */
  generateErrorId() {
    return 'err_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  logToConsole(error) {
    const style = this.getConsoleStyle(error.severity);
    
    console.group(`%c🚨 ${error.type.toUpperCase()}`, style);
    console.error('Message:', error.message);
    console.error('Timestamp:', error.timestamp);
    if (error.stack) console.error('Stack:', error.stack);
    if (error.context) console.error('Context:', error.context);
    console.groupEnd();
  }

  getConsoleStyle(severity) {
    const styles = {
      critical: 'color: white; background-color: #dc2626; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
      error: 'color: white; background-color: #ea580c; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
      warning: 'color: black; background-color: #fbbf24; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
      info: 'color: white; background-color: #3b82f6; padding: 2px 6px; border-radius: 3px; font-weight: bold;'
    };
    return styles[severity] || styles.error;
  }

  async sendToServer(error) {
    try {
      await fetch('/api/v1/errors/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(error)
      });
    } catch (err) {
      // No hacer nada si falla el envío para evitar loops
      console.warn('Failed to send error to server:', err);
    }
  }

  /**
   * Obtener errores por filtros
   */
  getErrors(filters = {}) {
    let filteredErrors = [...this.errors];

    if (filters.type) {
      filteredErrors = filteredErrors.filter(err => err.type === filters.type);
    }

    if (filters.severity) {
      filteredErrors = filteredErrors.filter(err => err.severity === filters.severity);
    }

    if (filters.since) {
      const since = new Date(filters.since);
      filteredErrors = filteredErrors.filter(err => new Date(err.timestamp) >= since);
    }

    return filteredErrors;
  }

  /**
   * Obtener estadísticas de errores
   */
  getStats() {
    const now = new Date();
    const lastHour = new Date(now - 60 * 60 * 1000);
    const lastDay = new Date(now - 24 * 60 * 60 * 1000);

    return {
      total: this.errors.length,
      lastHour: this.errors.filter(err => new Date(err.timestamp) >= lastHour).length,
      lastDay: this.errors.filter(err => new Date(err.timestamp) >= lastDay).length,
      bySeverity: {
        critical: this.errors.filter(err => err.severity === 'critical').length,
        error: this.errors.filter(err => err.severity === 'error').length,
        warning: this.errors.filter(err => err.severity === 'warning').length,
        info: this.errors.filter(err => err.severity === 'info').length
      },
      byType: this.errors.reduce((acc, err) => {
        acc[err.type] = (acc[err.type] || 0) + 1;
        return acc;
      }, {})
    };
  }

  /**
   * Limpiar errores
   */
  clear() {
    this.errors = [];
  }
}

// Instancia global
const errorLogger = new ErrorLogger();

// Error Boundary para React
export const ErrorBoundary = ({ children, componentName = 'Unknown' }) => {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const handleError = (error, errorInfo) => {
      errorLogger.ui.componentError(componentName, error);
      setHasError(true);
    };

    return () => {
      // Cleanup si es necesario
    };
  }, [componentName]);

  if (hasError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-semibold">Algo salió mal</h3>
        <p className="text-red-600 text-sm mt-1">
          Ha ocurrido un error en el componente {componentName}. 
          El equipo técnico ha sido notificado.
        </p>
        <button 
          onClick={() => setHasError(false)}
          className="mt-2 text-red-800 underline text-sm"
        >
          Intentar de nuevo
        </button>
      </div>
    );
  }

  return children;
};

export default errorLogger;

