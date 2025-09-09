import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import BarberProfileEdit from './barber/BarberProfileEdit';
import { UserProfileEdit } from '../components/user';

const ProfileEdit = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-red-900/20 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-4 text-white/80">Cargando...</p>
        </div>
      </div>
    );
  }

  // Renderizar el componente específico según el rol del usuario
  if (user.role === 'barber') {
    return <BarberProfileEdit />;
  }

  // Para usuarios normales y admins, usar el componente completo
  return <UserProfileEdit />;
};

export default ProfileEdit;
