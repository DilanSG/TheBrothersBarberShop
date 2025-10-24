import React from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useSocioStatus } from '@hooks/useSocioStatus';
import { Link } from 'react-router-dom';
import {PageContainer} from '@components/layout/PageContainer';
import GradientButton from '@components/ui/GradientButton';
import { User, Mail, Phone, Calendar, Edit3, Crown } from 'lucide-react';

function Profile() {
  const { user } = useAuth();
  const { isSocio, tipoSocio, isFounder } = useSocioStatus();

  if (!user) return <p className="text-center text-red-500 mt-10">No has iniciado sesión.</p>;

  const formatDate = (dateString) => {
    if (!dateString) return 'No especificado';
    const date = new Date(dateString);
    // Ajustar por zona horaria para mostrar la fecha correcta
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() + (offset * 60 * 1000));
    return adjustedDate.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <PageContainer>
      {/* Fondo de puntos característico */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `radial-gradient(circle, rgba(59, 130, 246, 0.15) 1px, transparent 1px)`,
        backgroundSize: '30px 30px',
        backgroundPosition: '0 0, 15px 15px'
      }}></div>
      
      <div className="absolute inset-0 opacity-8" style={{
        backgroundImage: `radial-gradient(circle, rgba(239, 68, 68, 0.12) 1px, transparent 1px)`,
        backgroundSize: '20px 20px',
        backgroundPosition: '10px 10px'
      }}></div>
      
      <div className="absolute inset-0 opacity-6" style={{
        backgroundImage: `radial-gradient(circle, rgba(168, 85, 247, 0.1) 0.8px, transparent 0.8px)`,
        backgroundSize: '40px 40px',
        backgroundPosition: '20px 0'
      }}></div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header con degradado sutil */}
        <div className="relative">
          <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/10 shadow-xl shadow-blue-500/20 overflow-hidden">
            {/* Efecto de brillo */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-2xl"></div>
            <div className="relative flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              {/* Foto de perfil */}
              <div className="relative">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt="Foto de perfil"
                    className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full object-cover ring-4 ring-blue-500/30 shadow-lg shadow-blue-500/20"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-lg sm:text-xl lg:text-2xl font-bold ring-4 ring-blue-500/30 shadow-lg shadow-blue-500/20">
                    <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                      {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                {/* Badges de rol y socio compactas */}
                <div className="absolute -bottom-1 -right-1 flex gap-1">
                  {/* Badge de rol principal */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs px-2 py-1 rounded-full shadow-lg shadow-blue-500/30 border border-blue-400/30 backdrop-blur-sm">
                    <span className="font-semibold text-white drop-shadow-sm">
                      Admin
                    </span>
                  </div>
                  
                  {/* Badge de socio */}
                  {isSocio && (
                    <div className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white text-xs px-2 py-1 rounded-full shadow-lg shadow-yellow-500/30 border border-yellow-400/30 backdrop-blur-sm">
                      <span className="font-semibold text-white drop-shadow-sm flex items-center gap-0.5">
                        {isFounder && <Crown className="w-2 h-2" />}
                        {isFounder ? 'F' : 'S'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Información básica */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-2">
                  {user.name || 'Sin nombre'}
                </h1>
                <p className="text-sm sm:text-base lg:text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent break-words">
                  {user.email}
                </p>
              </div>

              {/* Botón de editar mejorado */}
              <div className="w-full sm:w-auto">
                <Link to="/profile-edit" className="block w-full sm:w-auto">
                  <GradientButton
                    variant="primary"
                    size="md"
                    className="shadow-xl shadow-blue-500/20 w-full sm:w-auto"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Edit3 size={16} sm:size={18} />
                      <span className="text-sm sm:text-base">Editar Perfil</span>
                    </div>
                  </GradientButton>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Detalles del perfil con grid mejorado */}
        <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-2">
          {/* Información de contacto */}
          <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/10 shadow-xl shadow-blue-500/20 hover:border-white/40 transition-all duration-300 overflow-hidden">
            {/* Efecto de brillo */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-2xl"></div>
            <div className="relative">
              <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                  <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                </div>
                <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  Información de Contacto
                </span>
              </h2>
              <div className="space-y-4 sm:space-y-6">
                <div className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-xl shadow-blue-500/20">
                  <p className="text-xs sm:text-sm font-medium mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Correo electrónico
                  </p>
                  <p className="text-sm sm:text-base lg:text-lg bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent break-all">
                    {user.email}
                  </p>
                </div>
                <div className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-xl shadow-blue-500/20">
                  <p className="text-xs sm:text-sm font-medium mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Teléfono
                  </p>
                  <p className="text-sm sm:text-base lg:text-lg bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {user.phone || 'No especificado'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Información personal */}
          <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/10 shadow-xl shadow-blue-500/20 hover:border-white/40 transition-all duration-300 overflow-hidden">
            {/* Efecto de brillo */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-2xl"></div>
            <div className="relative">
              <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                </div>
                <span className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  Información Personal
                </span>
              </h2>
              <div className="space-y-4 sm:space-y-6">
                <div className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-xl shadow-blue-500/20">
                  <p className="text-xs sm:text-sm font-medium mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    Nombre completo
                  </p>
                  <p className="text-sm sm:text-base lg:text-lg bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {user.name || 'No especificado'}
                  </p>
                </div>
                <div className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-xl shadow-blue-500/20">
                  <p className="text-xs sm:text-sm font-medium mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    Fecha de nacimiento
                  </p>
                  <p className="text-sm sm:text-base lg:text-lg bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {formatDate(user.birthdate)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

export default Profile;
