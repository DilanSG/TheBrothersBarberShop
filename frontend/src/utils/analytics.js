// utils/analytics.js
class Analytics {
  static track(event, properties = {}) {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', event, properties);
      return;
    }

    // Implementar Google Analytics, Mixpanel, etc.
    if (typeof gtag !== 'undefined') {
      gtag('event', event, {
        custom_properties: properties,
        timestamp: new Date().toISOString()
      });
    }
  }

  static trackPageView(page) {
    this.track('page_view', { page });
  }

  static trackUserAction(action, category = 'user_interaction') {
    this.track(action, { category });
  }

  static trackBusinessMetric(metric, value, unit = 'count') {
    this.track('business_metric', { 
      metric, 
      value, 
      unit,
      timestamp: new Date().toISOString()
    });
  }

  static trackError(error, context = {}) {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      context,
      severity: 'error'
    });
  }

  static trackPerformance(name, duration, metadata = {}) {
    this.track('performance', {
      metric_name: name,
      duration_ms: duration,
      metadata
    });
  }
}

export default Analytics;
