import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { PageContainer } from '../components/layout/PageContainer';
import { Star, Clock, MapPin, Calendar, Users, Award, Scissors } from 'lucide-react';

// Header de página simplificado
const PageHeader = ({ title, description }) => (
  <div className="py-16 sm:py-20 px-4 relative bg-gradient-to-b from-black via-gray-900 to-black">
    {/* Background con efectos de puntos */}
    <div className="absolute inset-0 bg-gradient-to-r from-red-900/8 via-blue-900/8 to-red-900/8"></div>
    
    {/* Pattern de puntos mejorado - más visible */}
    <div className="absolute inset-0 opacity-40" style={{
      backgroundImage: `radial-gradient(circle, rgba(59, 130, 246, 0.3) 1px, transparent 1px)`,
      backgroundSize: '30px 30px',
      backgroundPosition: '0 0, 15px 15px'
    }}></div>
    
    {/* Pattern de puntos secundario para más densidad */}
    <div className="absolute inset-0 opacity-20" style={{
      backgroundImage: `radial-gradient(circle, rgba(239, 68, 68, 0.4) 1px, transparent 1px)`,
      backgroundSize: '20px 20px',
      backgroundPosition: '10px 10px'
    }}></div>
    
    {/* Pattern de puntos terciario para efecto de profundidad */}
    <div className="absolute inset-0 opacity-15" style={{
      backgroundImage: `radial-gradient(circle, rgba(168, 85, 247, 0.5) 0.8px, transparent 0.8px)`,
      backgroundSize: '40px 40px',
      backgroundPosition: '20px 0'
    }}></div>
    
    <div className="container mx-auto relative z-10">
      <div className="text-center max-w-4xl mx-auto">
        <div className="mb-4">
          <span className="inline-block px-4 py-2 bg-gradient-to-r from-red-600/20 to-blue-600/20 border border-red-500/30 rounded-full text-sm font-medium uppercase tracking-wider backdrop-blur-sm">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-blue-400">
              Nuestro Equipo
            </span>
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight relative">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-white to-blue-400 relative z-10">
            {title}
          </span>
        </h1>
        <p className="text-xl leading-relaxed max-w-2xl mx-auto relative z-10">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-300 via-white to-gray-300">
            {description}
          </span>
        </p>
      </div>
    </div>
  </div>
);

// Componente de loading mejorado
const LoadingSpinner = () => (
  <PageContainer>
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-full border-4 border-blue-500/20"></div>
        <div className="w-20 h-20 rounded-full border-4 border-blue-500 border-t-transparent animate-spin absolute top-0 left-0"></div>
      </div>
      <div className="text-center space-y-4">
        <h3 className="text-2xl font-bold text-white">Cargando barberos...</h3>
        <p className="text-gray-400 max-w-md">Estamos preparando la mejor selección de profesionales para ti</p>
      </div>
    </div>
  </PageContainer>
);

const ErrorMessage = ({ message }) => (
  <PageContainer>
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-gradient-to-br from-red-900/50 to-red-800/30 backdrop-blur-sm border border-red-500/30 rounded-3xl p-8">
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-red-300 mb-4">Error al cargar</h3>
          <p className="text-gray-300 mb-6">{message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-medium hover:from-red-500 hover:to-red-400 transition-all duration-300"
          >
            Reintentar
          </button>
        </div>
      </div>
    </div>
  </PageContainer>
);

const BarberCard = ({ barber }) => {
  const { user } = useAuth();

  if (!barber || !barber.user) {
    console.error('Barbero inválido:', barber);
    return null;
  }

  // Solo mostrar botón de reservar a usuarios normales
  const canBook = user && user.role === 'user';
  
  // Función para determinar disponibilidad en tiempo real
  const getBarberAvailability = () => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // 'HH:MM'
    
    // Obtener día actual
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDayName = dayNames[now.getDay()];
    
    if (!barber.schedule || !barber.schedule[currentDayName]) {
      return { available: false, reason: 'Sin horario definido' };
    }
    
    const todaySchedule = barber.schedule[currentDayName];
    
    // Verificar si el barbero trabaja hoy
    if (!todaySchedule.available) {
      return { available: false, reason: 'No trabaja hoy' };
    }
    
    // Verificar si la hora actual está dentro del horario
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
  
  // Determinar el estado del barbero
  const availability = getBarberAvailability();
  const isAvailable = barber.isActive && availability.available;

  return (
    <article className="group relative overflow-hidden rounded-3xl transform hover:scale-[1.02] transition-all duration-500 bg-gradient-to-br from-gray-800/40 via-gray-900/60 to-black/40 backdrop-blur-sm border border-gray-700/50 hover:border-blue-500/50 shadow-2xl hover:shadow-blue-500/20 flex flex-col h-full">
      {/* Header con imagen mejorado */}
      <div className="relative h-80 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent z-10"></div>
        {barber.photo?.url || barber.user?.photo?.url ? (
          <img
            src={barber.photo?.url || barber.user?.photo?.url}
            alt={barber.user?.name}
            className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-700 via-blue-900/50 to-gray-800 flex items-center justify-center">
            <div className="p-4 rounded-full bg-blue-600/10 backdrop-blur">
              <svg className="w-24 h-24 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        )}
          
          {/* Estado de disponibilidad mejorado */}
          <div className="absolute top-6 left-6 z-20">
            <div className={`flex items-center px-4 py-2 rounded-2xl text-sm font-medium text-white shadow-lg backdrop-blur-sm transition-all duration-300 border
              ${isAvailable 
                ? 'bg-emerald-500/90 border-emerald-400/30 group-hover:bg-emerald-400/90' 
                : 'bg-red-500/90 border-red-400/30 group-hover:bg-red-400/90'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-white animate-pulse' : 'bg-white/80'}`}></div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold leading-tight">
                    {isAvailable ? 'Disponible' : 'No disponible'}
                  </span>
                  <span className="text-xs opacity-90 leading-tight">
                    {availability.reason}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Badges flotantes mejorados */}
          <div className="absolute top-6 right-6 flex flex-col gap-3 z-20">
            {/* Rating con diseño mejorado */}
            {barber.rating?.average > 0 && (
              <div className="bg-gradient-to-r from-yellow-600/90 to-orange-600/90 backdrop-blur-sm px-4 py-2 rounded-2xl text-sm font-semibold text-white shadow-lg flex items-center gap-2 group-hover:from-yellow-500/90 group-hover:to-orange-500/90 transition-all duration-300 border border-yellow-400/30">
                <Star className="w-4 h-4 fill-current" />
                <span>{barber.rating.average.toFixed(1)}</span>
                {barber.rating.count > 0 && (
                  <span className="text-xs text-yellow-100/75">({barber.rating.count})</span>
                )}
              </div>
            )}
            
            {/* Experiencia con icono */}
            {barber.experience > 0 && (
              <div className="bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-sm px-4 py-2 rounded-2xl text-sm font-medium text-white shadow-lg group-hover:from-blue-500/90 group-hover:to-purple-500/90 transition-all duration-300 flex items-center gap-2 border border-blue-400/30">
                <Award className="w-4 h-4" />
                <span>{barber.experience} años</span>
              </div>
            )}
          </div>

          {/* Nombre y especialidad con fondo gradiente mejorado */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-gray-900/95 to-transparent z-20">
            <h2 className="text-2xl font-bold mb-2 transition-all duration-300">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-white to-blue-400 
                group-hover:from-blue-400 group-hover:via-white group-hover:to-red-400">
                {barber.user?.name}
              </span>
            </h2>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-400 group-hover:text-red-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-300 group-hover:text-gray-100 transition-colors duration-300 font-medium">
                {barber.specialty || 'Barbero Profesional'}
              </p>
            </div>
          </div>
        </div>

        {/* Contenido y botones con flex para botones siempre abajo */}
        <div className="p-6 flex flex-col flex-grow">
          {/* Servicios populares con diseño moderno */}
          <div className="flex-grow">
            {barber.services && barber.services.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-red-400 
                    group-hover:from-red-400 group-hover:to-blue-400 transition-all duration-300">
                    Servicios destacados
                  </span>
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </h3>
              <div className="grid grid-cols-2 gap-2">
                {barber.services.slice(0, 4).map((service, index) => (
                  <div key={`${barber._id}-service-${service._id}-${index}`} 
                    className="px-4 py-2 bg-gradient-to-br from-gray-800/60 via-gray-700/40 to-gray-800/60 
                    border border-gray-600/30 rounded-xl text-sm backdrop-blur-sm
                    hover:from-gray-700/70 hover:via-gray-600/50 hover:to-gray-700/70 
                    hover:border-blue-500/40 transition-all cursor-default group/service
                    hover:shadow-lg hover:shadow-blue-500/10">
                    <div className="font-bold mb-1 transition-all duration-300">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-white 
                        group-hover/service:from-white group-hover/service:to-blue-400">
                        {service.name}
                      </span>
                    </div>
                    <div className="font-semibold">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400 
                        group-hover/service:from-emerald-300 group-hover/service:to-blue-300 
                        transition-all duration-300">
                        ${service.price}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {barber.services.length > 4 && (
                <p className="text-sm text-center font-medium text-gray-400">
                  Y {barber.services.length - 4} servicios más...
                </p>
              )}
              </div>
            )}
          </div>

          {/* Botones de acción con diseño moderno mejorado - siempre en la parte inferior */}
          <div className="flex gap-3 pt-4 mt-auto">
            <Link
              to={`/barbers/${barber._id}`}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-800/60 via-gray-700/70 to-gray-800/60 
              hover:from-gray-700/70 hover:via-gray-600/80 hover:to-gray-700/70 rounded-xl font-bold text-center 
              transition-all duration-300 border border-gray-600/30 hover:border-gray-500/50 backdrop-blur-sm
              flex items-center justify-center gap-2 group hover:shadow-lg hover:-translate-y-0.5
              hover:shadow-gray-500/20"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200 
                group-hover:from-blue-400 group-hover:to-white transition-all duration-300">
                Ver Perfil
              </span>
              <svg className="w-4 h-4 transform transition-all duration-300 group-hover:translate-x-1 text-gray-300 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            {canBook && isAvailable && (
              <Link
                to={`/appointment?barberId=${barber._id}`}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600/90 to-red-600/90 
                hover:from-blue-500/90 hover:to-red-500/90 rounded-xl font-bold text-center 
                transition-all duration-300 border border-blue-500/50 hover:border-red-400/50 
                backdrop-blur-sm flex items-center justify-center gap-2 group
                hover:shadow-lg hover:-translate-y-0.5 hover:shadow-blue-500/20"
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-100 
                  group-hover:from-white group-hover:to-red-100 transition-all duration-300">
                  Reservar
                </span>
                <svg className="w-4 h-4 transform transition-all duration-300 group-hover:translate-x-1 text-white group-hover:text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </article>
  );
};

const PublicBarbers = () => {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now()); // Para forzar re-render

  useEffect(() => {
    const fetchBarbers = async () => {
      try {
        // Agregar timestamp para evitar caché del navegador
        const timestamp = Date.now();
        const response = await api.get(`/barbers?_t=${timestamp}`);
        
        if (!response.success) {
          throw new Error('La respuesta no fue exitosa');
        }
        
        if (!Array.isArray(response.data)) {
          throw new Error('Los datos de barberos no son válidos');
        }
        
        // Filtrar barberos que son realmente barberos y están activos
        const activeBarbers = response.data.filter(barber => 
          barber.user && 
          barber.user.role === 'barber' && 
          barber.isActive
        );
        
        setBarbers(activeBarbers);
        setLoading(false);
      } catch (error) {
        setError(error.message || 'Error al cargar los barberos');
        setLoading(false);
      }
    };

    fetchBarbers();
    
    // También refrescar cuando la página vuelve a ser visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('📱 Página visible de nuevo, refrescando barberos...');
        fetchBarbers();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Actualizar disponibilidad cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(Date.now());
    }, 60000); // Cada 60 segundos

    return () => clearInterval(interval);
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 p-4">
        <ErrorMessage message={error} />
      </div>
    );
  }

  const filteredBarbers = [...barbers].sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0));

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black via-gray-900 to-black overflow-hidden">
      {/* Background con efectos de gradientes como el header */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-900/8 via-blue-900/8 to-red-900/8"></div>
      
      {/* Efectos de puntos en toda la página - múltiples capas */}
      <div className="absolute inset-0 opacity-40" style={{
        backgroundImage: `radial-gradient(circle, rgba(59, 130, 246, 0.3) 1px, transparent 1px)`,
        backgroundSize: '30px 30px',
        backgroundPosition: '0 0, 15px 15px'
      }}></div>
      
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `radial-gradient(circle, rgba(239, 68, 68, 0.4) 1px, transparent 1px)`,
        backgroundSize: '20px 20px',
        backgroundPosition: '10px 10px'
      }}></div>
      
      <div className="absolute inset-0 opacity-15" style={{
        backgroundImage: `radial-gradient(circle, rgba(168, 85, 247, 0.5) 0.8px, transparent 0.8px)`,
        backgroundSize: '40px 40px',
        backgroundPosition: '20px 0'
      }}></div>
      
      {/* Contenido principal con z-index alto */}
      <div className="relative z-10">
        <PageHeader
          title="Nuestros Barberos"
          description="Conoce a nuestro equipo de profesionales expertos en el arte del cuidado masculino"
        />
        
        {/* Sección de tarjetas con el mismo estilo del header */}
        <div className="py-6 px-4 relative">
          {/* Background adicional para la sección de tarjetas */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/30 to-transparent"></div>
          
          <div className="container mx-auto relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
              {filteredBarbers.map(barber => (
                <BarberCard key={`${barber._id}-${lastUpdate}`} barber={barber} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicBarbers;
