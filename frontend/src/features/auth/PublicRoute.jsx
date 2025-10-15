import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from '@contexts/AuthContext";

// Este componente redirige a usuarios autenticados fuera de rutas públicas
export const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { state } = location;
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }
  
  // Si el usuario está autenticado, redirigir según su rol y la ruta actual
  if (user) {
    // Si hay una ruta anterior guardada, redirigir allí
    if (state?.from) {
      return <Navigate to={state.from} replace />;
    }
    
    // Si está en la página de inicio, redirigir al home (ya está logueado)
    if (location.pathname === '/') {
      return <Navigate to="/" replace />;
    }
    
    // Para otras rutas públicas (login, register), redirigir según el rol
    switch (user.role) {
      case 'admin':
        return <Navigate to="/" replace />;
      case 'barber':
        return <Navigate to="/" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  // Si no está autenticado, mostrar el contenido normal
  return children;
};
