import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import BarberProfileEdit from './barber/BarberProfileEdit';
import UserProfileEdit from './UserProfileEdit';

const ProfileEdit = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-red-900/20 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 text-center">
          <div className="group relative p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm shadow-xl shadow-blue-500/20">
            {/* Efecto de brillo en hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-2xl"></div>
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
              <p className="mt-4 text-white font-medium">Cargando perfil...</p>
            </div>
          </div>
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
