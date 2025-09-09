// hooks/usePerformanceMonitor.js
import { useEffect, useRef } from 'react';
import ErrorLogger from '../utils/errorLogger';

export const usePerformanceMonitor = (componentName) => {
  const mountTime = useRef(Date.now());
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    
    // Log del primer render (mount)
    if (renderCount.current === 1) {
      const mountDuration = Date.now() - mountTime.current;
      ErrorLogger.logPerformance(`${componentName}_mount`, mountDuration, {
        component: componentName,
        type: 'mount'
      });
    }

    // Cleanup para log de unmount
    return () => {
      if (renderCount.current === 1) {
        const totalTime = Date.now() - mountTime.current;
        ErrorLogger.logPerformance(`${componentName}_total_time`, totalTime, {
          component: componentName,
          type: 'total_lifecycle',
          renders: renderCount.current
        });
      }
    };
  });

  const logAction = (actionName, metadata = {}) => {
    const start = performance.now();
    
    return {
      end: () => {
        const duration = performance.now() - start;
        ErrorLogger.logPerformance(`${componentName}_${actionName}`, duration, {
          component: componentName,
          action: actionName,
          ...metadata
        });
      }
    };
  };

  return { logAction, renderCount: renderCount.current };
};

export default usePerformanceMonitor;
