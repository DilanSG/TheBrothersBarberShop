import { Suspense, lazy } from 'react';

// ⚡ Frontend Performance Optimization
// Remove console.logs and debug statements in production

// Utils para optimización
export const removeConsoleLogsInProduction = () => {
  if (process.env.NODE_ENV === 'production') {
    console.log = () => {};
    console.debug = () => {};
    console.info = () => {};
    console.warn = () => {};
  }
};

// React Performance optimizations
export const LazyComponentWrapper = ({ children, fallback = null }) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
};

// Lazy loading para páginas
export const LazyHome = lazy(() => import('../pages/Home'));
export const LazyProfile = lazy(() => import('../pages/Profile'));
export const LazyServices = lazy(() => import('../pages/Services'));
