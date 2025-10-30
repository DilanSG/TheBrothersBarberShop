
import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import NotificationContainer from './shared/components/notifications/NotificationContainer';
import { useApiNotifications } from './shared/hooks/useApiNotifications';
import { InventoryProvider } from './shared/contexts/InventoryContext';
import { PaymentMethodsProvider } from './shared/contexts/PaymentMethodsContext';

// Pages
import Home from './pages/Home';
import Profile from './pages/Profile';
import ProfileEdit from './pages/ProfileEdit';
import AppointmentRouter from './features/appointments/AppointmentRouter';
import PublicBarbers from './pages/PublicBarbers';
import Dashboard from './pages/Dashboard';

// Review Pages
import CreateReview from './features/reviews/CreateReview';

// Auth Pages
import Login from './features/auth/Login';
import Register from './features/auth/Register';

// Barber Pages
import Barbers from './features/barbers/Barbers';
import BarberProfile from './features/barbers/BarberProfile';
import BarberSales from './features/barbers/BarberSales';
import CartInvoices from './pages/CartInvoices';

// Admin Pages
import UserRoleManager from './features/admin/UserRoleManager';
import Inventory from './features/admin/Inventory';
import AdminBarbers from './features/admin/AdminBarbers';
import AdminServices from './features/admin/AdminServices';
import Reports from './features/admin/Reports';

// Components
import ProtectedRoute from './features/auth/ProtectedRoute';
import RequireAuth from './features/auth/RequireAuth';
import { PublicRoute } from './features/auth/PublicRoute';

function App() {
  // Configurar notificaciones para el API service
  useApiNotifications();

  return (
    <PaymentMethodsProvider>
      <InventoryProvider>
        <Routes>
      <Route element={<MainLayout />}>
        {/* Rutas públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/barbers" element={<PublicBarbers />} />
        <Route path="/barbers/:id" element={<BarberProfile />} />
        
        {/* Rutas de autenticación */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Rutas protegidas para cualquier usuario autenticado */}
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile-edit" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        
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
          
          {/* Ruta de facturas de carrito - accesible para admin y barber */}
          <Route 
            path="cart-invoices" 
            element={<CartInvoices />} 
          />
          
          {/* Rutas exclusivas para admin */}
          <Route
            element={
              <ProtectedRoute requiredRole={["admin"]}>
                <Outlet />
              </ProtectedRoute>
            }
          >
            <Route path="services" element={<AdminServices />} />
            <Route path="roles" element={<UserRoleManager />} />
            <Route path="barbers" element={<AdminBarbers />} />
            <Route path="barbers/:id" element={<BarberProfile />} />
            <Route path="reports" element={<Reports />} />
          </Route>

        </Route>

        {/* Ruta de citas - accesible para todos los usuarios autenticados */}
        <Route 
          path="/appointment/*" 
          element={
            <ProtectedRoute>
              <AppointmentRouter />
            </ProtectedRoute>
          }
        />

        {/* Rutas de reseñas - accesible para clientes autenticados */}
        <Route 
          path="/reviews/create/:appointmentId" 
          element={
            <ProtectedRoute>
              <CreateReview />
            </ProtectedRoute>
          }
        />

        {/* Ruta para manejar URLs no encontradas */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
    <NotificationContainer />
    </InventoryProvider>
    </PaymentMethodsProvider>
  );
}

				export default App;
