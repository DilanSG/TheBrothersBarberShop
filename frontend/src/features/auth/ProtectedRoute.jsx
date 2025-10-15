import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from '@contexts/AuthContext";
import { useEffect } from "react";

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading, error, refreshToken } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    // Solo intentar refresh si tenemos un token pero no un usuario
    const token = localStorage.getItem('token');
    if (!loading && token && !user && !error) {
      refreshToken().catch(() => {
        // Error manejado por el AuthContext
      });
    }
  }, [loading, user, error, refreshToken]);

  if (loading) {
    // Aquí podrías mostrar un spinner o loading state
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }
  
  if (!user) {
    // Guardar la ubicación actual para redirigir después del login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  if (requiredRole) {
    // Convertir requiredRole en array si es string
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    if (!requiredRoles.includes(user.role)) {
      console.warn(`Acceso denegado: se requiere uno de estos roles [${requiredRoles.join(', ')}], usuario tiene rol ${user.role}`);
      return <Navigate to="/" replace />;
    }
  }
  
  return children;
}

export default ProtectedRoute;
