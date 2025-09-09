
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import NotificationContainer from './components/notifications/NotificationContainer';
import { useApiNotifications } from './hooks/useApiNotifications';
import { InventoryProvider } from './contexts/InventoryContext';

// Pages críticas (carga inmediata)
import Home from './pages/Home';
import Profile from './pages/Profile';
import ProfileEdit from './pages/ProfileEdit';
import AppointmentRouter from './pages/appointment/AppointmentRouter';
import Services from './pages/Services';
import PublicBarbers from './pages/PublicBarbers';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Lazy load para páginas admin (usando archivos que realmente existen)
const LazyAdminBarbers = lazy(() => import('./pages/admin/AdminBarbers'));
const LazyInventory = lazy(() => import('./pages/admin/Inventory'));
const LazyInventoryLogs = lazy(() => import('./pages/admin/InventoryLogs'));
const LazyReports = lazy(() => import('./pages/admin/Reports'));
const LazyUserRoleManager = lazy(() => import('./pages/admin/UserRoleManager'));

// Componente de loading mejorado
const PageLoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">Cargando...</p>
    </div>
  </div>
);

// Barber Pages (carga inmediata para flujo crítico)
import Barbers from './pages/barber/Barbers';
import BarberProfile from './pages/barber/BarberProfile';
import BarberSales from './pages/barber/BarberSales';

// Admin Pages - mantenemos las importaciones directas por ahora
import UserRoleManager from './pages/admin/UserRoleManager';
import Inventory from './pages/admin/Inventory';
import AdminBarbers from './pages/admin/AdminBarbers';
import Reports from './pages/admin/Reports';

// Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import RequireAuth from './components/auth/RequireAuth';
import { PublicRoute } from './components/auth/PublicRoute';

function App() {
  // Configurar notificaciones para el API service
  useApiNotifications();

  return (
    <InventoryProvider>
      <Routes>
      <Route element={<MainLayout />}>
        {/* Rutas públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/barbers" element={<PublicBarbers />} />
        <Route path="/barbers/:id" element={<BarberProfile />} />
        
        {/* Rutas de autenticación */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Rutas protegidas para cualquier usuario autenticado */}
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile-edit" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
        
        {/* Rutas protegidas para admin y barber */}
        {/* Ruta base de administración */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole={["admin", "barber"]}>
              <Outlet />
            </ProtectedRoute>
          }
        >
          {/* Redirección por defecto según rol */}
          <Route 
            index 
            element={
              <RequireAuth>
                {({ user }) => (
                  <Navigate 
                    to={user.role === "barber" ? "/admin/sales" : "/admin/barbers"} 
                    replace 
                  />
                )}
              </RequireAuth>
            }
          />

          {/* Ruta de inventario - accesible para admin y barber */}
          <Route 
            path="inventory" 
            element={
              <Suspense fallback={<PageLoadingSpinner />}>
                <Inventory />
              </Suspense>
            } 
          />
          
          {/* Ruta de ventas - accesible para admin y barber */}
          <Route 
            path="sales" 
            element={<BarberSales />} 
          />
          
          {/* Rutas exclusivas para admin */}
          <Route
            element={
              <ProtectedRoute requiredRole={["admin"]}>
                <Outlet />
              </ProtectedRoute>
            }
          >
            <Route 
              path="services" 
              element={
                <Suspense fallback={<PageLoadingSpinner />}>
                  <ServiceManagement />
                </Suspense>
              } 
            />
            <Route 
              path="roles" 
              element={
                <Suspense fallback={<PageLoadingSpinner />}>
                  <RoleManagement />
                </Suspense>
              } 
            />
            <Route 
              path="barbers" 
              element={
                <Suspense fallback={<PageLoadingSpinner />}>
                  <BarberManagement />
                </Suspense>
              } 
            />
            <Route path="barbers/:id" element={<BarberProfile />} />
            <Route 
              path="reports" 
              element={
                <Suspense fallback={<PageLoadingSpinner />}>
                  <AdminReports />
                </Suspense>
              } 
            />
          </Route>

        </Route>

        {/* Ruta de citas - accesible para todos los usuarios autenticados */}
        <Route 
          path="/appointment" 
          element={
            <ProtectedRoute>
              <AppointmentRouter />
            </ProtectedRoute>
          }
        />

        {/* Ruta para manejar URLs no encontradas */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
    <NotificationContainer />
    </InventoryProvider>
  );
}

				export default App;
