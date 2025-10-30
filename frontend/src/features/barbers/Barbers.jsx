import React, { useEffect, useState } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { Link } from 'react-router-dom';
import { api } from '@services/api';
import { User, Star, Calendar, Scissors } from 'lucide-react';
import {PageContainer} from '@components/layout/PageContainer';
import GradientText from '@components/ui/GradientText';

import logger from '@utils/logger';
// Componente de Card de Barbero para usuarios
const BarberCardForUsers = ({ barber, userRole }) => {
  const handleImageError = (e) => {
    e.target.onerror = null;
    // Ocultar la imagen fallida y mostrar el fallback
    e.target.style.display = 'none';
  };

  const userData = barber.user || {};
  const profileImage = userData.profilePicture || barber.photo?.url;

  const formatRating = (rating) => {
    if (!rating) return '0.0';
    if (typeof rating === 'object') {
      const average = rating.average || 0;
      return average.toFixed(1);
    }
    return rating;
  };

  // Función para determinar disponibilidad en tiempo real
  const getBarberAvailability = () => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDayName = dayNames[now.getDay()];
    
    if (!barber.schedule || !barber.schedule[currentDayName]) {
      return { available: false, reason: 'Sin horario' };
    }
    
    const todaySchedule = barber.schedule[currentDayName];
    if (!todaySchedule.available) {
      return { available: false, reason: 'No trabaja hoy' };
    }
    
    const startTime = todaySchedule.start;
    const endTime = todaySchedule.end;
    
    if (currentTime < startTime) {
      return { available: false, reason: `Abre a las ${startTime}` };
    }
    if (currentTime > endTime) {
      return { available: false, reason: `Cerró a las ${endTime}` };
    }
    
    return { available: true, reason: `Hasta las ${endTime}` };
  };

  const availability = getBarberAvailability();
  const isAvailable = barber.isActive && availability.available;

  return (
    <article className="group relative overflow-hidden rounded-2xl sm:rounded-3xl transform hover:scale-[1.02] transition-all duration-500 bg-gradient-to-br from-gray-800/40 via-gray-900/60 to-black/40 backdrop-blur-sm border border-gray-700/50 hover:border-blue-500/50 shadow-2xl hover:shadow-blue-500/20 flex flex-col h-full">
      {/* Efecto de brillo */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-2xl sm:rounded-3xl"></div>
      
      {/* Header con imagen */}
      <div className="relative h-48 sm:h-56 lg:h-64 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent z-10"></div>
        {profileImage ? (
          <img 
            src={profileImage}
            alt={userData.name || 'Barbero'}
            className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-700 via-blue-900/50 to-gray-800 flex items-center justify-center">
            <div className="p-3 sm:p-4 rounded-full bg-blue-600/10 backdrop-blur">
              <User className="w-12 h-12 sm:w-16 sm:h-16 text-blue-400" />
            </div>
          </div>
        )}
        
        {/* Estado de disponibilidad */}
        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-20">
          <div className={`flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium text-white shadow-lg backdrop-blur-sm transition-all duration-300 border
            ${isAvailable 
              ? 'bg-emerald-500/90 border-emerald-400/30' 
              : 'bg-red-500/90 border-red-400/30'}`}>
            <div className={`w-1.5 h-1.5 rounded-full mr-1.5 sm:mr-2 ${isAvailable ? 'bg-white animate-pulse' : 'bg-white/80'}`}></div>
            <span className="text-xs">{isAvailable ? 'Disponible' : availability.reason}</span>
          </div>
        </div>

        {/* Rating badge */}
        {barber.rating?.average > 0 && (
          <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20">
            <div className="bg-gradient-to-r from-yellow-600/90 to-orange-600/90 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold text-white shadow-lg flex items-center gap-1 border border-yellow-400/30">
              <Star className="w-3 h-3 fill-current" />
              <span className="text-xs">{barber.rating.average.toFixed(1)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="relative flex-1 p-4 sm:p-6 flex flex-col">
        {/* Información principal */}
        <div className="flex-1">
          <h3 className="mb-2">
            <GradientText className="text-lg sm:text-xl font-bold leading-tight">
              {userData.name || barber.name || 'Nombre no disponible'}
            </GradientText>
          </h3>
          
          <div className="space-y-2 mb-4">
            {barber.specialty && (
              <div className="flex items-center gap-2 text-gray-300">
                <Scissors className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span className="text-sm leading-tight">{barber.specialty}</span>
              </div>
            )}
            
            {barber.experience && (
              <div className="flex items-center gap-2 text-gray-300">
                <Star className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span className="text-sm leading-tight">{barber.experience} años de experiencia</span>
              </div>
            )}
          </div>
          
          {/* Descripción */}
          {barber.description && (
            <p className="text-gray-400 text-sm mb-4 line-clamp-3 leading-relaxed">
              {barber.description}
            </p>
          )}
        </div>
        
        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3 mt-auto">
          <Link
            to={`/barber-profile/${barber._id}`}
            className={`${(userRole === 'user' || !userRole) ? 'flex-1' : 'w-full'} group relative overflow-hidden bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/30 rounded-xl px-3 sm:px-4 py-3 text-center transition-all duration-300 text-sm font-medium text-white backdrop-blur-sm shadow-lg hover:shadow-blue-500/20 hover:scale-105 min-h-[44px] flex items-center justify-center`}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <User className="w-4 h-4" />
              Ver Perfil
            </span>
          </Link>
          
          {userRole === 'user' && (
            <Link
              to={`/appointment?barberId=${barber._id}`}
              className="flex-1 group relative overflow-hidden bg-gradient-to-r from-green-600/20 to-emerald-600/20 hover:from-green-600/30 hover:to-emerald-600/30 border border-green-500/30 rounded-xl px-3 sm:px-4 py-3 text-center transition-all duration-300 text-sm font-medium text-white backdrop-blur-sm shadow-lg hover:shadow-green-500/20 hover:scale-105 min-h-[44px] flex items-center justify-center"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4" />
                Reservar
              </span>
            </Link>
          )}
          
          {!userRole && (
            <Link
              to="/login"
              className="flex-1 group relative overflow-hidden bg-gradient-to-r from-green-600/20 to-emerald-600/20 hover:from-green-600/30 hover:to-emerald-600/30 border border-green-500/30 rounded-xl px-3 sm:px-4 py-3 text-center transition-all duration-300 text-sm font-medium text-white backdrop-blur-sm shadow-lg hover:shadow-green-500/20 hover:scale-105 min-h-[44px] flex items-center justify-center"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4" />
                Reservar
              </span>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
};

function BarbersPage() {
  const { user } = useAuth();
  const [barbers, setBarbers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBarbers();
  }, []);

  const fetchBarbers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/barbers?_t=${Date.now()}`); // Force refresh con timestamp
      logger.debug('Respuesta de barberos:', response);
      
      if (response.success) {
        const barbersData = response.data || [];
        logger.debug('Barberos obtenidos del backend:', barbersData.length);
        
        // Filtrar barberos activos
        const activeBarbers = barbersData.filter(barber => {
          const isActive = barber.user && 
                 barber.user.role === 'barber' && 
                 (barber.user.isActive !== false) && 
                 (barber.isActive !== false);
          logger.debug(`👤 [Barbers] ${barber.user?.name}: isActive=${isActive}, isMainBarber=${barber.isMainBarber}`);
          return isActive;
        });

        logger.debug('Barberos activos:', activeBarbers.length);

        // Filtrar barberos principales (isMainBarber: true)
        const mainBarbers = activeBarbers.filter(barber => barber.isMainBarber === true);
        logger.debug('Barberos principales encontrados:', mainBarbers.length);
        logger.debug('Lista de principales:', mainBarbers.map(b => b.user?.name));

        // Si no hay barberos principales, mostrar los primeros 3 activos
        const barbersToShow = mainBarbers.length > 0 ? mainBarbers : activeBarbers.slice(0, 3);
        logger.debug('Barberos finales a mostrar:', barbersToShow.length);
        logger.debug('Lista final:', barbersToShow.map(b => b.user?.name));

        // DEBUG:Verificar si estamos configurando más de 3 barberos
        if (barbersToShow.length > 3) {
          console.error('ERROR: Se están configurando más de 3 barberos!', barbersToShow.length);
          console.error('Detalles:', barbersToShow.map(b => ({
            name: b.user?.name,
            isMainBarber: b.isMainBarber,
            id: b._id
          })));
        }
        
        setBarbers(barbersToShow);
      } else {
        throw new Error(response.message || "Error al cargar barberos");
      }
    } catch (error) {
      console.error('Error en fetchBarbers:', error);
      setError(error.message || "No se pudieron cargar los barberos.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center min-h-[60vh] p-4">
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/40 rounded-2xl p-8 shadow-xl text-center">
            <div className="w-16 h-16 border-t-4 border-blue-400/40 rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-white mb-2">Cargando barberos...</h3>
            <p className="text-gray-400">Estamos preparando la mejor selección de profesionales para ti</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="relative py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/20 shadow-xl shadow-blue-500/20">
                <User className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
              </div>
              <GradientText className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                Nuestros Barberos
              </GradientText>
            </div>
            <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Conoce a nuestro equipo de profesionales expertos en el arte del cuidado masculino y reserva tu cita con el mejor
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6">
              <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 backdrop-blur-sm shadow-xl shadow-red-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  </div>
                  <span className="text-red-300 font-medium">{error}</span>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          {barbers.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/40 rounded-2xl p-8 sm:p-12 max-w-md mx-auto shadow-xl">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <User className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3">No hay barberos disponibles</h3>
                <p className="text-gray-400 leading-relaxed text-sm sm:text-base">
                  No hay barberos disponibles en este momento. Por favor, vuelve más tarde.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
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
      </div>
    </PageContainer>
  );
}

export default BarbersPage;

