/**
import logger from '../utils/logger';
 * Sistema de Analytics para The Brothers Barbershop
 * Trackea eventos críticos de negocio y métricas de performance
 */

class Analytics {
  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production';
    this.events = [];
    this.metrics = {
      pageViews: {},
      userActions: {},
      businessMetrics: {},
      performance: {}
    };
    
    // Inicializar
    this.init();
  }

  init() {
    if (!this.isEnabled) {
      logger.debug('📊 Analytics en modo desarrollo - eventos se logean pero no se envían');
      return;
    }

    // Configurar tracking automático
    this.setupPageTracking();
    this.setupPerformanceTracking();
  }

  /**
   * Trackear evento genérico
   */
  track(eventName, properties = {}) {
    const event = {
      name: eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        sessionId: this.getSessionId()
      }
    };

    this.events.push(event);
    
    if (this.isEnabled) {
      this.sendEvent(event);
    } else {
      logger.debug('📊 Analytics Event:', eventName, properties);
    }
  }

  /**
   * Eventos de negocio críticos
   */
  business = {
    // Citas
    appointmentCreated: (appointmentData) => {
      this.track('appointment_created', {
        barberId: appointmentData.barberId,
        serviceId: appointmentData.serviceId,
        date: appointmentData.date,
        price: appointmentData.price
      });
    },

    appointmentCancelled: (appointmentId, reason) => {
      this.track('appointment_cancelled', {
        appointmentId,
        reason,
        cancelledBy: 'user'
      });
    },

    appointmentCompleted: (appointmentData) => {
      this.track('appointment_completed', {
        appointmentId: appointmentData._id,
        barberId: appointmentData.barberId,
        serviceId: appointmentData.serviceId,
        revenue: appointmentData.price
      });
    },

    // Ventas
    saleRecorded: (saleData) => {
      this.track('sale_recorded', {
        type: saleData.type,
        productId: saleData.productId,
        barberId: saleData.barberId,
        quantity: saleData.quantity,
        revenue: saleData.totalAmount
      });
    },

    // Usuario
    userRegistered: (userRole) => {
      this.track('user_registered', {
        role: userRole
      });
    },

    userLoggedIn: (userRole) => {
      this.track('user_logged_in', {
        role: userRole
      });
    },

    // Inventario
    inventoryLowStock: (productId, currentStock, minStock) => {
      this.track('inventory_low_stock', {
        productId,
        currentStock,
        minStock,
        severity: currentStock === 0 ? 'critical' : 'warning'
      });
    }
  };

  /**
   * Métricas de UX y Performance
   */
  ux = {
    pageView: (pageName) => {
      this.metrics.pageViews[pageName] = (this.metrics.pageViews[pageName] || 0) + 1;
      this.track('page_view', { page: pageName });
    },

    buttonClick: (buttonName, context) => {
      this.track('button_click', { button: buttonName, context });
    },

    formSubmitted: (formName, success = true) => {
      this.track('form_submitted', { form: formName, success });
    },

    searchPerformed: (query, resultsCount) => {
      this.track('search_performed', { query, resultsCount });
    },

    errorOccurred: (errorType, errorMessage, context) => {
      this.track('error_occurred', {
        errorType,
        errorMessage,
        context,
        severity: 'error'
      });
    },

    // Conversión
    conversionFunnel: (step, data = {}) => {
      this.track('conversion_funnel', {
        step, // 'viewed_services', 'selected_barber', 'selected_time', 'confirmed_appointment'
        ...data
      });
    }
  };

  /**
   * Performance tracking
   */
  performance = {
    // Time to Interactive
    timeToInteractive: (time) => {
      this.track('performance_tti', { time });
    },

    // API Response times
    apiResponse: (endpoint, responseTime, success = true) => {
      this.track('api_response', {
        endpoint,
        responseTime,
        success
      });
    },

    // Page load time
    pageLoad: (pageName, loadTime) => {
      this.track('page_load_time', { page: pageName, loadTime });
    }
  };

  /**
   * Setup automático
   */
  setupPageTracking() {
    // Trackear cambios de ruta (React Router)
    if (typeof window !== 'undefined') {
      const originalPushState = history.pushState;
      history.pushState = function(...args) {
        originalPushState.apply(history, args);
        setTimeout(() => {
          const pageName = window.location.pathname;
          analytics.ux.pageView(pageName);
        }, 100);
      };
    }
  }

  setupPerformanceTracking() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType('navigation')[0];
          if (perfData) {
            this.performance.pageLoad(
              window.location.pathname,
              perfData.loadEventEnd - perfData.loadEventStart
            );
          }
        }, 1000);
      });
    }
  }

  /**
   * Utilidades
   */
  getSessionId() {
    if (typeof window === 'undefined') return 'server';
    
    let sessionId = sessionStorage.getItem('analytics_session');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('analytics_session', sessionId);
    }
    return sessionId;
  }

  async sendEvent(event) {
    try {
      // En producción, enviar a servicio de analytics (Google Analytics, Mixpanel, etc.)
      await fetch('/api/v1/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.warn('Error enviando evento de analytics:', error);
    }
  }

  /**
   * Obtener métricas actuales
   */
  getMetrics() {
    return {
      ...this.metrics,
      totalEvents: this.events.length,
      session: this.getSessionId()
    };
  }

  /**
   * Limpiar datos
   */
  clear() {
    this.events = [];
    this.metrics = {
      pageViews: {},
      userActions: {},
      businessMetrics: {},
      performance: {}
    };
  }
}

// Instancia global
const analytics = new Analytics();

export default analytics;

