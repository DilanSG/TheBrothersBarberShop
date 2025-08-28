import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole) {
    // Convertir requiredRole en array si es string
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    if (!requiredRoles.includes(user.role)) {
      console.log(`Acceso denegado: se requiere uno de estos roles [${requiredRoles.join(', ')}], usuario tiene rol ${user.role}`);
      return <Navigate to="/" replace />;
    }
  }
  
  return children;
}

export default ProtectedRoute;
