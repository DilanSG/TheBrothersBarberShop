import React, { useEffect, useState, memo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import GradientButton from '../components/ui/GradientButton';
import { PageContainer } from '../components/layout/PageContainer';
import { Link } from 'react-router-dom';
import { LOGOS, DEFAULT_IMAGES } from '../utils/assets';
import { api } from '../services/api';
import usePerformanceMonitor from '../hooks/usePerformanceMonitor';
import ErrorLogger from '../utils/errorLogger';                    {/* Background con efectos mejorados y mayor transparencia */}
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-900/30 via-black/20 to-gray-900/30">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-500/5 via-transparent to-blue-500/5"></div>
                        <div className="absolute inset-0 opacity-10" style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239BA9B4' fill-opacity='0.05'%3E%3Cpath d='M40 44v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V10h-2v4h-4v2h4v4h2v-4h4v-2h-4zM20 44v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM20 14v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        }}></div>
                        
                        {/* Degradado sutil en los bordes - 2px hacia adentro */}
                        <div className="absolute inset-0" style={{
                            background: `
                                linear-gradient(to right, rgba(17, 24, 39, 0.4) 0px, transparent 2px, transparent calc(100% - 2px), rgba(17, 24, 39, 0.4) 100%),
                                linear-gradient(to bottom, rgba(17, 24, 39, 0.4) 0px, transparent 2px, transparent calc(100% - 2px), rgba(17, 24, 39, 0.4) 100%)
                            `
                        }}></div>
                    </div>

// Componente de Tarjeta de Barbero optimizado con memo
const BarberCard = memo(({ barber }) => {
  const handleImageError = (e) => {
    e.target.onerror = null; // Previene loop infinito
    e.target.src = DEFAULT_IMAGES.profile(); // Usa una imagen por defecto
    e.target.classList.add('fallback-image');
  };

  // Función para formatear el rating
  const formatRating = (rating) => {
    if (!rating) return null;
    if (typeof rating === 'object') {
      const average = rating.average || 0;
      const count = rating.count || 0;
      return `${average.toFixed(1)} (${count})`;
    }
    return rating;
  };

  // Obtener datos del usuario asociado al barbero
  const userData = barber.user || {};

  return (
    <div className="group relative overflow-hidden rounded-2xl transform hover:scale-105 transition-all duration-300 bg-gradient-to-br from-gray-800 via-gray-900 to-blue-900">
      <div className="aspect-[4/5] w-full relative">
        {(userData.photo?.url || barber.photo?.url) ? (
          <>
            <img 
              src={userData.photo?.url || barber.photo?.url}
              alt={userData.name || 'Barbero'}
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
              onError={handleImageError}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 via-blue-900/50 to-gray-900">
            <div className="p-4 rounded-full bg-blue-600/10 backdrop-blur">
              <svg className="w-20 h-20 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        )}
      </div>
      <div className="absolute inset-0 flex flex-col justify-end p-6">
        <div className="transform transition-transform group-hover:translate-y-0 translate-y-4">
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
              {userData.name || barber.name || 'Nombre no disponible'}
            </h3>
            <p className="text-gray-300 text-sm">
              {barber.specialty || 'Barbero Profesional'}
            </p>
            <div className="flex flex-wrap gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 delay-100">
              {barber.experience && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-900/50 text-blue-200 border border-blue-700 backdrop-blur-sm">
                  {barber.experience} de experiencia
                </span>
              )}
              {formatRating(barber?.rating) && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-900/50 text-blue-200 border border-blue-700 backdrop-blur-sm">
                  <svg className="w-4 h-4 mr-1 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  {formatRating(barber.rating)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

function Home() {
    const [services, setServices] = useState([]);
    const [barbers, setBarbers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dataLoaded, setDataLoaded] = useState(false);
    const { user, accessToken } = useAuth();
    const { logAction } = usePerformanceMonitor('Home');

    useEffect(() => {
        // Evitar múltiples llamadas
        if (dataLoaded) return;

        const fetchData = async () => {
            const performanceTimer = logAction('data_fetch');
            
            try {
                console.log('Iniciando fetch de datos...');
                
                const [servicesRes, barbersRes] = await Promise.all([
                    api.get('/services'),
                    api.get('/barbers')
                ]);

                console.log('Respuesta de servicios:', servicesRes);
                console.log('Respuesta de barberos:', barbersRes);

                if (!servicesRes.success || !barbersRes.success) {
                    throw new Error('Error al cargar los datos');
                }

                const servicesData = servicesRes.data || [];
                const barbersData = barbersRes.data || [];

                console.log('Datos de barberos recibidos:', barbersData);

                // Filtrar barberos que son realmente barberos y están activos
                const activeBarbers = barbersData.filter(barber => {
                    console.log('Evaluando barbero:', barber);
                    return barber.user && 
                           barber.user.role === 'barber' && 
                           (barber.user.isActive !== false) && 
                           (barber.isActive !== false);
                });

                console.log('Barberos activos filtrados:', activeBarbers);

                // Guardar servicios (máximo 6 servicios)
                setServices(servicesData.slice(0, 6));

                // Guardar barberos filtrados
                setBarbers(activeBarbers);
                setDataLoaded(true);
                
                performanceTimer.end();

            } catch (err) {
                console.error('Error completo:', err);
                ErrorLogger.logError(err, {
                    context: 'Home_fetchData',
                    userId: user?._id,
                    servicesCount: services.length,
                    barbersCount: barbers.length
                });
                setError(err.message);
                performanceTimer.end();
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []); // Removemos accessToken para evitar requests excesivos

    return (
        <PageContainer>
            {/* Hero Section - Solo para usuarios no logueados */}
            {!user && (
                <div className="relative min-h-screen flex flex-col">
                    {/* Background con efectos mejorados y mayor transparencia */}
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-900/30 via-black/20 to-gray-900/30">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-500/5 via-transparent to-blue-500/5"></div>
                        <div className="absolute inset-0 opacity-10" style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239BA9B4' fill-opacity='0.05'%3E%3Cpath d='M40 44v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V10h-2v4h-4v2h4v4h2v-4h4v-2h-4zM20 44v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM20 14v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        }}></div>
                        
                        {/* Degradado sutil en los bordes - 2px hacia adentro */}
                        <div className="absolute inset-0" style={{
                            background: `
                                linear-gradient(to right, rgba(17, 24, 39, 0.3) 0px, transparent 2px, transparent calc(100% - 2px), rgba(17, 24, 39, 0.3) 100%),
                                linear-gradient(to bottom, rgba(17, 24, 39, 0.3) 0px, transparent 2px, transparent calc(100% - 2px), rgba(17, 24, 39, 0.3) 100%)
                            `
                        }}></div>
                    </div>

                    {/* Contenido principal del hero */}
                    <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
                        <div className="text-center max-w-6xl mx-auto">
                            {/* Logo y título principal */}
                            <div className="mb-8 sm:mb-12">
                                <div className="relative mx-auto w-48 sm:w-56 md:w-64 lg:w-72 xl:w-80 mb-6 sm:mb-8 transform hover:scale-105 transition-all duration-500">
                                    <img
                                        src={LOGOS.main()}
                                        alt="The Brothers Barber Shop"
                                        className="w-full h-auto filter drop-shadow-[0_0_30px_rgba(59,130,246,0.6)]"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextElementSibling.style.display = 'block';
                                        }}
                                    />
                                    <div 
                                        className="hidden text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-center tracking-tight"
                                        style={{ textShadow: '0 0 30px rgba(59, 130, 246, 0.6)' }}
                                    >
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-200 to-blue-400">
                                            The Brothers
                                        </span>
                                    </div>
                                </div>

                                {/* Eslogan principal */}
                                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 sm:mb-6 leading-tight px-2">
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-white to-blue-400">
                                        Donde el estilo se encuentra
                                    </span>
                                    <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-red-400">
                                        con la tradición
                                    </span>
                                </h1>
                            </div>

                            {/* Descripción y características */}
                            <div className="mb-8 sm:mb-12 space-y-6 sm:space-y-8 px-2">
                                <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                                    Experimenta un corte de pelo que define tu personalidad.
                                    <span className="block mt-2 text-blue-400 font-medium">
                                        Tradición, calidad y estilo en cada corte.
                                    </span>
                                </p>

                                {/* Características destacadas */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
                                    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-700/30 hover:border-red-500/30 transition-all duration-300">
                                        <div className="mb-3 sm:mb-4 mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-red-600/20 to-blue-600/20 rounded-full flex items-center justify-center">
                                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="font-bold text-white mb-2 text-sm sm:text-base">Reservas Online</h3>
                                        <p className="text-gray-400 text-xs sm:text-sm">Agenda tu cita 24/7</p>
                                    </div>

                                    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-700/30 hover:border-blue-500/30 transition-all duration-300">
                                        <div className="mb-3 sm:mb-4 mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-600/20 to-red-600/20 rounded-full flex items-center justify-center">
                                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                            </svg>
                                        </div>
                                        <h3 className="font-bold text-white mb-2 text-sm sm:text-base">Barberos Expertos</h3>
                                        <p className="text-gray-400 text-xs sm:text-sm">Profesionales certificados</p>
                                    </div>

                                    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-700/30 hover:border-red-500/30 transition-all duration-300">
                                        <div className="mb-3 sm:mb-4 mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-red-600/20 to-blue-600/20 rounded-full flex items-center justify-center">
                                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="font-bold text-white mb-2 text-sm sm:text-base">Calidad Premium</h3>
                                        <p className="text-gray-400 text-xs sm:text-sm">Los mejores productos</p>
                                    </div>
                                </div>
                            </div>

                            {/* Call to Action */}
                            <div className="space-y-4 sm:space-y-6 px-2">
                                <div className="flex justify-center">
                                    <GradientButton 
                                        variant="primary"
                                        size="lg"
                                        className="inline-flex items-center justify-center whitespace-nowrap px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl sm:rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300 min-w-fit"
                                        onClick={() => window.location.href = '/appointment'}
                                    >
                                        <span className="flex items-center gap-2 sm:gap-3">
                                            <span className="hidden sm:inline">Reserva tu cita ahora</span>
                                            <span className="sm:hidden">Reservar cita</span>
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </span>
                                    </GradientButton>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 lg:gap-8 text-xs sm:text-sm text-gray-400">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Sin compromiso
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Cancelación gratuita
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Confirmación inmediata
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Indicador de scroll */}
                    <div className="relative z-10 pb-8 flex justify-center">
                        <div className="animate-bounce">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                        </div>
                    </div>
                </div>
            )}

            {/* Services Section - Rediseñada */}
            <section className={`${user ? 'py-6 sm:py-8 lg:py-12' : 'py-16 sm:py-24 lg:py-32'} px-4 relative bg-gradient-to-b from-black via-gray-900 to-black`}>
                {/* Background con efectos */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-900/8 via-blue-900/8 to-red-900/8"></div>
                <div className="absolute inset-0 opacity-30" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%235a67d8' fill-opacity='0.1'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}></div>
                
                <div className="container mx-auto relative">
                    {/* Header con información del usuario - Solo para usuarios logueados */}
                    {user && (
                        <div className="relative z-10 mb-6 sm:mb-8 px-2 sm:px-0">
                            <div className="flex justify-end">
                                <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xl max-w-full">
                                    <div className="flex items-center gap-2 sm:gap-4">
                                        <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-600/20 to-red-600/20 border border-blue-500/30 flex-shrink-0">
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-white text-xs sm:text-sm truncate">Bienvenido,</p>
                                            <p className="font-bold text-blue-400 text-sm sm:text-base truncate">{user.username || user.name || user.email}</p>
                                            {user.role === 'admin' && (
                                                <span className="inline-block mt-0.5 sm:mt-1 px-1.5 sm:px-2 py-0.5 bg-gradient-to-r from-blue-600/30 to-red-600/30 border border-blue-500/30 text-blue-400 rounded-full text-xs font-medium">
                                                    {user.role}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Header de la sección */}
                    <div className={`text-center max-w-4xl mx-auto ${user ? 'mb-8 sm:mb-12' : 'mb-12 sm:mb-20'} px-2 sm:px-0`}>
                        <div className="mb-6">
                            <span className="inline-block px-4 py-2 bg-gradient-to-r from-red-600/20 to-blue-600/20 border border-red-500/30 rounded-full text-red-400 text-sm font-medium uppercase tracking-wider">
                                Nuestros Servicios
                            </span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 sm:mb-8 leading-tight">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-white to-blue-400">
                                Servicios Profesionales
                            </span>
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-red-400">
                                de Barbería
                            </span>
                        </h2>
                        <p className="text-base sm:text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto">
                            Ofrecemos una amplia gama de servicios de barbería profesional 
                            <span className="block mt-2 text-blue-400 font-medium">
                                para que luzcas tu mejor versión
                            </span>
                        </p>
                    </div>

                    {/* Contenido de servicios */}
                    {loading ? (
                        <div className="flex justify-center py-16">
                            <div className="relative w-16 h-16">
                                <div className="absolute inset-0">
                                    <div className="w-full h-full border-4 border-blue-500/20 rounded-full"></div>
                                    <div className="w-full h-full border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                                </div>
                            </div>
                        </div>
                    ) : services.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="mb-6 mx-auto w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-gray-500 text-lg">No hay servicios disponibles en este momento.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 px-2 sm:px-0">
                            {services.slice(0, 6).map((service, index) => (
                                <div key={service._id} 
                                    className={`group relative overflow-hidden bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-gray-700/50 hover:border-red-500/40 transition-all duration-700 transform hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(220,38,38,0.25)] ${
                                        index === 0 ? 'md:col-span-2 lg:col-span-1' : ''
                                    }`}
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    {/* Efecto de brillo en hover */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                    
                                    <div className="relative p-4 sm:p-6 lg:p-8">
                                        {/* Icono del servicio */}
                                        <div className="mb-4 sm:mb-6 relative">
                                            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-gradient-to-br from-red-600/20 to-blue-600/20 rounded-xl sm:rounded-2xl flex items-center justify-center border border-red-500/20 group-hover:border-blue-500/40 transition-all duration-500">
                                                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-400 group-hover:text-blue-400 transition-colors duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                                                        d="M15.414 5l5.293 5.293a1 1 0 0 1 0 1.414L15.414 17H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h9.414z M12 12h.01" />
                                                </svg>
                                            </div>
                                            {/* Indicador de popularidad para el primer servicio */}
                                            {index === 0 && (
                                                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-gradient-to-r from-red-600 to-blue-600 text-white text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                                                    Popular
                                                </div>
                                            )}
                                        </div>

                                        {/* Contenido del servicio */}
                                        <div className="text-center mb-4 sm:mb-6">
                                            <h3 className="font-bold text-xl sm:text-2xl lg:text-3xl mb-2 sm:mb-3 text-white group-hover:text-blue-400 transition-colors duration-500 leading-tight">
                                                {service.name}
                                            </h3>
                                            <p className="text-gray-400 text-sm sm:text-base leading-relaxed line-clamp-3">
                                                {service.description}
                                            </p>
                                        </div>

                                        {/* Footer del servicio */}
                                        <div className="flex items-center justify-between">
                                            <div className="text-left">
                                                <p className="text-blue-400 font-bold text-2xl sm:text-3xl">${service.price}</p>
                                                <p className="text-gray-500 text-xs sm:text-sm">Precio final</p>
                                            </div>
                                            <Link 
                                                to="/appointment" 
                                                className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-red-600/20 to-blue-600/20 hover:from-red-600/40 hover:to-blue-600/40 border border-red-500/30 hover:border-blue-500/50 rounded-full text-red-400 hover:text-blue-400 transition-all duration-500 transform hover:scale-110 flex-shrink-0"
                                            >
                                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                                        d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                </svg>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Barbers Section - Rediseñada */}
            <section className="py-16 sm:py-24 lg:py-32 px-4 bg-gradient-to-b from-black via-gray-900 to-black relative overflow-hidden">
                {/* Background con efectos mejorados */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-900/10 via-blue-900/10 to-red-900/10"></div>
                <div className="absolute inset-0 opacity-25" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23dc2626' fill-opacity='0.08'%3E%3Ccircle cx='60' cy='60' r='2'/%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3Ccircle cx='90' cy='30' r='1'/%3E%3Ccircle cx='30' cy='90' r='1'/%3E%3Ccircle cx='90' cy='90' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}></div>
                
                <div className="container mx-auto relative">
                    {/* Header de la sección mejorado */}
                    <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-20 px-2 sm:px-0">
                        <div className="mb-6">
                            <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-600/20 to-red-600/20 border border-blue-500/30 rounded-full text-blue-400 text-sm font-medium uppercase tracking-wider">
                                Nuestro Equipo
                            </span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 sm:mb-8 leading-tight">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-red-400">
                                Barberos Expertos
                            </span>
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-white to-blue-400">
                                Maestros del Arte
                            </span>
                        </h2>
                        <p className="text-base sm:text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto">
                            Conoce a nuestro equipo de profesionales expertos en el arte de la barbería
                            <span className="block mt-2 text-blue-400 font-medium">
                                Pasión, técnica y dedicación en cada corte
                            </span>
                        </p>
                    </div>

                    {/* Contenido de barberos mejorado */}
                    {loading ? (
                        <div className="flex justify-center items-center min-h-[400px]">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full border-4 border-blue-500/20"></div>
                                <div className="w-20 h-20 rounded-full border-4 border-transparent border-t-blue-500 animate-spin absolute inset-0"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20"></div>
                                </div>
                            </div>
                        </div>
                    ) : barbers.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="mb-8 mx-auto w-20 h-20 bg-gradient-to-br from-blue-600/20 to-red-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                                <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                        d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-300 mb-4">Estamos construyendo nuestro equipo</h3>
                            <p className="text-gray-400 text-lg max-w-md mx-auto">
                                Pronto agregaremos nuevos profesionales especializados a nuestro equipo de barberos expertos
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 px-2 sm:px-0">
                            {barbers.map((barber, index) => (
                                <div key={barber._id || barber.id} 
                                    className="transform hover:scale-105 transition-all duration-500"
                                    style={{ animationDelay: `${index * 150}ms` }}
                                >
                                    <BarberCard barber={barber} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Call to action adicional */}
                    {barbers.length > 0 && (
                        <div className="text-center mt-16">
                            <p className="text-gray-400 mb-6">¿Quieres conocer más sobre nuestros barberos?</p>
                            <GradientButton 
                                variant="outline"
                                size="md"
                                className="px-8 py-3"
                                onClick={() => window.location.href = '/barbers'}
                            >
                                Ver todos los barberos
                                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </GradientButton>
                        </div>
                    )}
                </div>
            </section>

            {/* Contact/Location Section - Rediseñada */}
            <section className="py-16 sm:py-24 lg:py-32 px-4 bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
                {/* Background con efectos mejorados */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/8 via-red-900/8 to-blue-900/8"></div>
                <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232563eb' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}></div>
                
                <div className="container mx-auto relative">
                    {/* Header de la sección */}
                    <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-20 px-2 sm:px-0">
                        <div className="mb-6">
                            <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-600/20 to-red-600/20 border border-blue-500/30 rounded-full text-blue-400 text-sm font-medium uppercase tracking-wider">
                                Visítanos
                            </span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 sm:mb-8 leading-tight">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-red-400">
                                Encuéntranos
                            </span>
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-white to-blue-400">
                                Te Esperamos
                            </span>
                        </h2>
                        <p className="text-base sm:text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto">
                            Estamos ubicados en el corazón de la ciudad
                            <span className="block mt-2 text-blue-400 font-medium">
                                Ven y experimenta la diferencia por ti mismo
                            </span>
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 xl:gap-16 items-center px-2 sm:px-0">
                        {/* Información de contacto mejorada */}
                        <div className="relative order-2 lg:order-1 w-full">
                            {/* Efectos de fondo */}
                            <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-red-600/20 via-blue-600/20 to-red-600/20 rounded-2xl sm:rounded-3xl blur-xl sm:blur-2xl opacity-30"></div>
                            <div className="absolute -inset-1 sm:-inset-2 bg-gradient-to-br from-gray-900/50 to-gray-800/50 rounded-xl sm:rounded-2xl blur-lg sm:blur-xl"></div>
                            
                            <div className="relative bg-gradient-to-br from-gray-900/95 to-gray-800/95 border border-gray-700/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 backdrop-blur-xl shadow-2xl min-h-[380px] sm:h-[400px] lg:h-[600px] flex flex-col overflow-hidden">
                                {/* Header de la tarjeta */}
                                <div className="mb-4 sm:mb-6 flex-shrink-0">
                                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600/20 to-red-600/20 rounded-lg sm:rounded-xl flex items-center justify-center border border-blue-500/30 flex-shrink-0">
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg sm:text-xl font-bold text-white">Información de Contacto</h3>
                                    </div>
                                    <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                                        Estamos aquí para atenderte con la mejor experiencia de barbería.
                                    </p>
                                </div>

                                {/* Lista de contacto mejorada */}
                                <div className="space-y-3 sm:space-y-4 flex-1 overflow-y-auto">
                                    <div className="group">
                                        <div className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-700/50 border border-gray-600/30 hover:border-blue-500/40 transition-all duration-300">
                                            <div className="flex-shrink-0">
                                                <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-600/20 to-red-600/20 rounded-md sm:rounded-lg border border-blue-500/30 group-hover:border-blue-400/50 transition-all duration-300">
                                                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 group-hover:text-blue-300 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-sm sm:text-base font-semibold text-white mb-1 group-hover:text-blue-300 transition-colors duration-300">Dirección</h4>
                                                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed break-words">Cra 77vBis #52 A - 08</p>
                                                <p className="text-xs text-gray-500">Bogotá D.C, Cundinamarca.</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="group">
                                        <div className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-700/50 border border-gray-600/30 hover:border-red-500/40 transition-all duration-300">
                                            <div className="flex-shrink-0">
                                                <div className="p-1.5 sm:p-2 bg-gradient-to-br from-red-600/20 to-blue-600/20 rounded-md sm:rounded-lg border border-red-500/30 group-hover:border-red-400/50 transition-all duration-300">
                                                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-red-400 group-hover:text-red-300 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-sm sm:text-base font-semibold text-white mb-1 group-hover:text-red-300 transition-colors duration-300">Teléfono</h4>
                                                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed break-words">+57 311 588 2528</p>
                                                <p className="text-xs text-gray-500">WhatsApp disponible</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="group">
                                        <div className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-700/50 border border-gray-600/30 hover:border-blue-500/40 transition-all duration-300">
                                            <div className="flex-shrink-0">
                                                <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-600/20 to-red-600/20 rounded-md sm:rounded-lg border border-blue-500/30 group-hover:border-blue-400/50 transition-all duration-300">
                                                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 group-hover:text-blue-300 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-sm sm:text-base font-semibold text-white mb-1 group-hover:text-blue-300 transition-colors duration-300">Horario de Atención</h4>
                                                <div className="space-y-0.5">
                                                    <p className="text-gray-400 text-xs sm:text-sm break-words">Lunes - Sábado: 9:00 AM - 8:00 PM</p>
                                                    <p className="text-gray-400 text-xs sm:text-sm break-words">Domingo: 10:00 AM - 6:00 PM</p>
                                                </div>
                                                <p className="text-xs text-gray-500">Reservas recomendadas</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Call to action */}
                                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-700/50 flex-shrink-0">
                                    <GradientButton 
                                        variant="primary"
                                        size="md"
                                        className="w-full py-2 sm:py-2.5 text-sm sm:text-base"
                                        onClick={() => window.location.href = '/appointment'}
                                    >
                                        Reservar una cita
                                        <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </GradientButton>
                                </div>
                            </div>
                        </div>

                        {/* Mapa mejorado */}
                        <div className="relative order-1 lg:order-2 w-full">
                            <div className="absolute -inset-1 sm:-inset-2 bg-gradient-to-r from-blue-600/20 via-red-600/20 to-blue-600/20 rounded-2xl sm:rounded-3xl blur-lg sm:blur-xl opacity-50"></div>
                            <div className="relative h-[300px] sm:h-[400px] lg:h-[600px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(37,99,235,0.3)] border border-gray-700/50 backdrop-blur-sm">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15907.448844294731!2d-74.16188815134278!3d4.618659698034156!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e3f9fadb32531a3%3A0xad47ce8d546359c!2sThe%20brothers%20barber!5e0!3m2!1ses!2sco!4v1756390613507!5m2!1ses!2sco"
                                    className="w-full h-full"
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    style={{ filter: 'grayscale(20%) contrast(1.1)' }}
                                ></iframe>
                                
                                {/* Overlay decorativo */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </PageContainer>
    );
}

export default Home;
