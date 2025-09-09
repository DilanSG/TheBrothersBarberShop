import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import {PageContainer} from '../components/layout/PageContainer';
import { User, Mail, Phone, Calendar, Edit3 } from 'lucide-react';

function Profile() {
  const { user } = useAuth();

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

      <div className="relative z-10 max-w-4xl mx-auto space-y-8">
        {/* Header con degradado sutil */}
        <div className="relative">
          <div className="relative bg-gray-800/30 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-xl shadow-blue-500/10">
            <div className="flex items-center space-x-6">
              {/* Foto de perfil */}
              <div className="relative">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt="Foto de perfil"
                    className="w-28 h-28 rounded-full object-cover ring-4 ring-blue-500/30 shadow-lg shadow-blue-500/20"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-2xl font-bold ring-4 ring-blue-500/30 shadow-lg shadow-blue-500/20">
                    <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                      {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                {/* Badge de rol */}
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-3 py-1 rounded-full shadow-lg">
                  <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent font-medium">
                    {user.role === 'admin' ? 'Admin' : user.role === 'barber' ? 'Barbero' : 'Cliente'}
                  </span>
                </div>
              </div>
              
              {/* Información básica */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-2">
                  {user.name || 'Sin nombre'}
                </h1>
                <p className="text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {user.email}
                </p>
              </div>

              {/* Botón de editar mejorado */}
              <Link
                to="/profile-edit"
                className="group relative inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-500/30 transition-all duration-300 text-white space-x-2 shadow-lg hover:shadow-blue-500/20 hover:scale-105"
              >
                <Edit3 className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                <span className="font-medium bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  Editar Perfil
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Detalles del perfil con grid mejorado */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Información de contacto */}
          <div className="group bg-gray-800/20 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:border-blue-500/20">
            <h2 className="text-xl font-bold mb-6 flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                <Mail className="w-6 h-6 text-blue-400" />
              </div>
              <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Información de Contacto
              </span>
            </h2>
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-gray-700/20 border border-white/5">
                <p className="text-sm font-medium mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Correo electrónico
                </p>
                <p className="text-lg bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent break-all">
                  {user.email}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gray-700/20 border border-white/5">
                <p className="text-sm font-medium mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Teléfono
                </p>
                <p className="text-lg bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {user.phone || 'No especificado'}
                </p>
              </div>
            </div>
          </div>

          {/* Información personal */}
          <div className="group bg-gray-800/20 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-xl hover:shadow-purple-500/10 transition-all duration-300 hover:border-purple-500/20">
            <h2 className="text-xl font-bold mb-6 flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                <User className="w-6 h-6 text-purple-400" />
              </div>
              <span className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Información Personal
              </span>
            </h2>
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-gray-700/20 border border-white/5">
                <p className="text-sm font-medium mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Nombre completo
                </p>
                <p className="text-lg bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {user.name || 'No especificado'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gray-700/20 border border-white/5">
                <p className="text-sm font-medium mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Fecha de nacimiento
                </p>
                <p className="text-lg bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {formatDate(user.birthdate)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

export default Profile;
