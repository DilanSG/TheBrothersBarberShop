// utils/lazyComponents.js
import { lazy } from 'react';

// Lazy load para rutas menos críticas
export const LazyAdminReports = lazy(() => import('../pages/admin/AdminReports'));
export const LazyInventoryManagement = lazy(() => import('../pages/admin/InventoryManagement'));
export const LazyBarberManagement = lazy(() => import('../pages/admin/BarberManagement'));
export const LazyServiceManagement = lazy(() => import('../pages/admin/ServiceManagement'));
export const LazyRoleManagement = lazy(() => import('../pages/admin/RoleManagement'));
export const LazyAdminSales = lazy(() => import('../pages/admin/AdminSales'));

// Wrapper con Suspense
export const withSuspense = (Component) => (props) => (
  <Suspense fallback={
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
    </div>
  }>
    <Component {...props} />
  </Suspense>
);
