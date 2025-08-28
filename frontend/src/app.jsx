
import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';

// Pages
import Home from './pages/Home';
import Profile from './pages/Profile';
import ProfileEdit from './pages/ProfileEdit';
import Appointment from './pages/Appointment';
import Services from './pages/Services';
import PublicBarbers from './pages/PublicBarbers';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Barber Pages
import Barbers from './pages/barber/Barbers';
import BarberProfile from './pages/barber/BarberProfile';

// Admin Pages
import UserRoleManager from './pages/admin/UserRoleManager';
import Inventory from './pages/admin/Inventory';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import RequireAuth from './components/RequireAuth';
import { PublicRoute } from './components/PublicRoute';

function App() {
  return (
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
                    to={user.role === "barber" ? "/admin/inventory" : "/admin/barbers"} 
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
            <Route path="barbers" element={<Barbers />} />
            <Route path="barbers/:id" element={<BarberProfile />} />
          </Route>

        </Route>

        {/* Rutas protegidas para clientes */}
        <Route 
          path="/appointment" 
          element={
            <ProtectedRoute roles={["user"]}>
              <Appointment />
            </ProtectedRoute>
          }
        />

        {/* Ruta para manejar URLs no encontradas */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

				export default App;
