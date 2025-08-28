import { Navigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

// Este componente redirige a usuarios autenticados fuera de rutas públicas
export const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  
  // Si el usuario está autenticado, redirigir según su rol
  if (user) {
    switch (user.role) {
      case 'admin':
        return <Navigate to="/manage/barbers" replace />;
      case 'barber':
        return <Navigate to="/profile" replace />;
      default:
        return <Navigate to="/profile" replace />;
    }
  }

  // Si no está autenticado, mostrar el contenido normal
  return children;
};
