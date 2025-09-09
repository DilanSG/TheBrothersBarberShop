
import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import NotificationContainer from './components/notifications/NotificationContainer';
import { useApiNotifications } from './hooks/useApiNotifications';
import { InventoryProvider } from './contexts/InventoryContext';

// Pages
import Home from './pages/Home';
import Profile from './pages/Profile';
import ProfileEdit from './pages/ProfileEdit';
import AppointmentRouter from './pages/appointment/AppointmentRouter';
import Services from './pages/Services';
import PublicBarbers from './pages/PublicBarbers';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Barber Pages
import Barbers from './pages/barber/Barbers';
import BarberProfile from './pages/barber/BarberProfile';
import BarberSales from './pages/barber/BarberSales';

// Admin Pages
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
            element={<Inventory />} 
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
            <Route path="services" element={<Services />} />
            <Route path="roles" element={<UserRoleManager />} />
            <Route path="barbers" element={<AdminBarbers />} />
            <Route path="barbers/:id" element={<BarberProfile />} />
            <Route path="reports" element={<Reports />} />
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
