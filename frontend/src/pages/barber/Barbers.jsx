import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

// Componente de Card de Barbero para usuarios
const BarberCardForUsers = ({ barber, userRole }) => {
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = '/images/default-avatar.png';
    e.target.classList.add('fallback-image');
  };

  const userData = barber.user || {};
  const profileImage = userData.profilePicture || barber.profilePicture || userData.photo?.url || barber.photo?.url;

  const formatRating = (rating) => {
    if (!rating) return '0.0';
    if (typeof rating === 'object') {
      const average = rating.average || 0;
      return average.toFixed(1);
    }
    return rating;
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur rounded-xl shadow-lg border border-gray-700 overflow-hidden group hover:shadow-2xl transition-all duration-300">
      <div className="relative">
        {/* Imagen del barbero */}
        <div className="aspect-[4/3] w-full relative overflow-hidden">
          {profileImage ? (
            <img 
              src={profileImage}
              alt={userData.name || 'Barbero'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
              <div className="p-4 rounded-full bg-blue-600/20">
                <svg className="w-16 h-16 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        </div>
        
        {/* Información del barbero */}
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-white mb-2">
              {userData.name || barber.name || 'Nombre no disponible'}
            </h3>
            <p className="text-gray-300 text-sm mb-2">
              {barber.specialty || 'Barbero Profesional'}
            </p>
            {barber.experience && (
              <p className="text-gray-400 text-sm">
                {barber.experience} años de experiencia
              </p>
            )}
          </div>
          
          {/* Rating */}
          {barber.rating && (
            <div className="flex items-center mb-4">
              <div className="flex text-yellow-400 mr-2">
                {'★'.repeat(Math.floor(barber.rating.average || 0))}
                {'☆'.repeat(5 - Math.floor(barber.rating.average || 0))}
              </div>
              <span className="text-gray-300 text-sm">
                {formatRating(barber.rating)} ({barber.rating.count || 0} reseñas)
              </span>
            </div>
          )}
          
          {/* Descripción corta */}
          {barber.description && (
            <p className="text-gray-400 text-sm mb-4 line-clamp-2">
              {barber.description}
            </p>
          )}
          
          {/* Botones de acción */}
          <div className="flex space-x-3">
            <Link
              to={`/barber-profile/${barber._id}`}
              className={`${(userRole === 'user' || !userRole) ? 'flex-1' : 'w-full'} bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-center transition-colors duration-200 text-sm font-medium`}
            >
              Ver Perfil
            </Link>
            {userRole === 'user' && (
              <Link
                to={`/appointment/new?barberId=${barber._id}`}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-center transition-colors duration-200 text-sm font-medium"
              >
                Reservar
              </Link>
            )}
            {!userRole && (
              <Link
                to="/login"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-center transition-colors duration-200 text-sm font-medium"
              >
                Reservar
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function BarbersPage() {
  const { user } = useAuth();
  const [barbers, setBarbers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBarbers();
  }, []);

  const fetchBarbers = async () => {
    try {
      const response = await api.get('/barbers/active');
      console.log('Respuesta de barberos:', response);
      
      if (response.success) {
        const barbersData = response.data || [];
        console.log('Barberos obtenidos:', barbersData);
        setBarbers(barbersData);
      } else {
        throw new Error(response.message || "Error al cargar barberos");
      }
    } catch (error) {
      console.error('Error en fetchBarbers:', error);
      setError(error.message || "No se pudieron cargar los barberos.");
      setTimeout(() => setError(""), 2500);
    }
  };

  // Vista pública de barberos para todos los usuarios
  return (
    <div className="min-h-screen bg-gray-900 text-white pb-10">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-blue-400 mb-2">Nuestros Barberos</h2>
          <p className="text-gray-300">Conoce a nuestro equipo de profesionales y reserva tu cita</p>
        </div>

        {error && (
          <div className="mb-4">
            <div className="bg-red-500/20 text-red-300 p-4 rounded-lg border border-red-500/50">
              {error}
            </div>
          </div>
        )}

        {barbers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">No hay barberos disponibles en este momento</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {barbers.map((barber) => (
              <BarberCardForUsers 
                key={barber._id} 
                barber={barber}
                userRole={user?.role}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

export default BarbersPage;
