import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { MainLayout } from './MainLayout';

/**
 * Layout protegido para barberos
 * Solo permite acceso a usuarios con rol 'barber' o 'admin'
 */
export const BarberLayout = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-300">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Verificar que el usuario esté autenticado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Verificar que tenga permisos de barbero o admin
  if (user.role !== 'barber' && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
};
