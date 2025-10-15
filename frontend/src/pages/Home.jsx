import React, { useEffect, useState } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useSocioStatus } from '@hooks/useSocioStatus';
import GradientButton from '@components/ui/GradientButton';
import GradientText from '@components/ui/GradientText';
import { PageContainer } from '@components/layout/PageContainer';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@services/api';
import { LOGOS, DEFAULT_IMAGES } from '@utils/assets';
import logger from '@utils/logger';
import { 
  Scissors, 
  Clock, 
  MapPin, 
  Phone, 
  Star, 
  ArrowRight,
  Calendar,
  Check,
  Users,
  Award,
  Heart,
  Settings,
  User,
  Crown
} from 'lucide-react';                    {/* Background con efectos mejorados y mayor transparencia */}
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

// Componente de Tarjeta de Barbero con glassmorphism unificado
const BarberCard = ({ barber }) => {
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
    <div className="group relative backdrop-blur-sm border border-white/10 rounded-2xl transition-all duration-300 overflow-hidden hover:scale-[1.002] hover:-translate-y-0.5 bg-white/5 shadow-xl shadow-blue-500/20 hover:border-white/20">
      {/* Efecto de brillo */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-2xl"></div>
      
      <div className="relative aspect-[4/5] w-full">
        {(userData.profilePicture || barber.photo?.url) ? (
          <>
            <img 
              src={userData.profilePicture || barber.photo?.url}
              alt={userData.name || 'Barbero'}
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity rounded-t-2xl"
              onError={handleImageError}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent rounded-t-2xl"></div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-t-2xl">
            <div className="p-4 rounded-full bg-blue-600/10 backdrop-blur-sm border border-blue-500/20 shadow-lg shadow-blue-500/20">
              <Users className="w-16 h-16 text-blue-400 drop-shadow-[0_1px_2px_rgba(96,165,250,0.3)]" />
            </div>
          </div>
        )}
      </div>
      
      <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6">
        <div className="transform transition-transform group-hover:translate-y-0 translate-y-2">
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
              {userData.name || barber.name || 'Nombre no disponible'}
            </h3>
            <p className="text-gray-300 text-xs sm:text-sm">
              {barber.specialty || 'Barbero Profesional'}
            </p>
            <div className="flex flex-wrap gap-1 sm:gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 delay-100">
              {barber.experience && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 backdrop-blur-sm shadow-sm shadow-blue-500/20">
                  <Award className="w-3 h-3 mr-1 drop-shadow-[0_1px_2px_rgba(96,165,250,0.3)]" />
                  {barber.experience}
                </span>
              )}
              {formatRating(barber?.rating) && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 backdrop-blur-sm shadow-sm shadow-yellow-500/20">
                  <Star className="w-3 h-3 mr-1 text-yellow-400 drop-shadow-[0_1px_2px_rgba(251,191,36,0.3)]" fill="currentColor" />
                  {formatRating(barber.rating)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function Home() {
    const [services, setServices] = useState([]);
    const [barbers, setBarbers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dataLoaded, setDataLoaded] = useState(false);
    const { user, accessToken } = useAuth();
    const { isSocio, tipoSocio, isFounder } = useSocioStatus();
    const navigate = useNavigate();

    const handleProfileNavigation = () => {
        if (!user) return;
        
        // Usar la ruta unificada que decide automáticamente el componente según el rol
        navigate('/profile-edit');
    };

    useEffect(() => {
        // Evitar múltiples llamadas
        if (dataLoaded) return;

        const fetchData = async () => {
            try {
                // logger.debug('Iniciando fetch de datos...');
                
                const [servicesRes, barbersRes] = await Promise.all([
                    api.get('/services'),
                    api.get(`/barbers?_t=${Date.now()}`) // Force refresh con timestamp
                ]);

                logger.debug('Respuesta de servicios:', servicesRes);
                logger.debug('Respuesta de barberos:', barbersRes);

                if (!servicesRes.success || !barbersRes.success) {
                    throw new Error('Error al cargar los datos');
                }

                const servicesData = servicesRes.data || [];
                const barbersData = barbersRes.data || [];

                logger.debug('Datos de barberos recibidos:', barbersData);

                // Filtrar barberos que son realmente barberos y están activos
                const activeBarbers = barbersData.filter(barber => {
                    logger.debug('Evaluando barbero:', barber);
                    return barber.user && 
                           barber.user.role === 'barber' && 
                           (barber.user.isActive !== false) && 
                           (barber.isActive !== false);
                });

                logger.debug('🏠 [Home] Barberos activos filtrados:', activeBarbers.length);

                // Filtrar barberos principales (isMainBarber: true)
                const mainBarbers = activeBarbers.filter(barber => barber.isMainBarber === true);
                logger.debug('🎯 [Home] Barberos principales encontrados:', mainBarbers.length);
                logger.debug('🎯 [Home] Lista de principales:', mainBarbers.map(b => `${b.user?.name}: ${b.isMainBarber}`));

                // Si no hay barberos principales, mostrar los primeros 3 activos
                const barbersToShow = mainBarbers.length > 0 ? mainBarbers : activeBarbers.slice(0, 3);
                logger.debug('📺 [Home] Barberos finales a mostrar:', barbersToShow.length);
                logger.debug('📺 [Home] Barberos a mostrar:', barbersToShow.map(b => b.user?.name));

                // Filtrar servicios que están marcados para mostrar en Home (máximo 3)
                const homeServices = servicesData.filter(service => service.showInHome === true).slice(0, 3);
                setServices(homeServices);

                // Guardar barberos para mostrar
                setBarbers(barbersToShow);
                setDataLoaded(true);

            } catch (err) {
                console.error('Error completo:', err);
                setError(err.message);
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
                    {/* Contenido principal del hero */}
                    <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
                        <div className="text-center max-w-4xl lg:max-w-6xl mx-auto">
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
                                        className="hidden text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-center tracking-tight"
                                        style={{ textShadow: '0 0 30px rgba(59, 130, 246, 0.6)' }}
                                    >
                                        <GradientText>The Brothers</GradientText>
                                    </div>
                                </div>

                                {/* Eslogan principal con GradientText */}
                                <div className="space-y-2 sm:space-y-4">
                                    <GradientText className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight">
                                        Donde el estilo se encuentra con la tradición
                                    </GradientText>
                                </div>
                            </div>

                            {/* Descripción y características */}
                            <div className="mb-8 sm:mb-12 space-y-6 sm:space-y-8">
                                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 max-w-2xl lg:max-w-3xl mx-auto leading-relaxed px-4">
                                    Experimenta un corte de pelo que define tu personalidad.
                                    <span className="block mt-2 text-blue-400 font-medium">
                                        Tradición, calidad y estilo en cada corte.
                                    </span>
                                </p>

                                {/* Características destacadas con glassmorphism */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-3xl lg:max-w-4xl mx-auto px-4">
                                    <div className="group relative backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6 transition-all duration-300 bg-white/5 shadow-xl shadow-blue-500/20 hover:border-white/20 hover:scale-105">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-xl"></div>
                                        <div className="relative">
                                            <div className="mb-3 sm:mb-4 mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-red-600/20 to-blue-600/20 rounded-xl border border-red-500/20 flex items-center justify-center shadow-lg shadow-red-500/20">
                                                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 drop-shadow-[0_1px_2px_rgba(239,68,68,0.3)]" />
                                            </div>
                                            <h3 className="font-bold text-white text-sm sm:text-base mb-1 sm:mb-2">Reservas Online</h3>
                                            <p className="text-gray-400 text-xs sm:text-sm">Agenda tu cita 24/7</p>
                                        </div>
                                    </div>

                                    <div className="group relative backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6 transition-all duration-300 bg-white/5 shadow-xl shadow-blue-500/20 hover:border-white/20 hover:scale-105">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-xl"></div>
                                        <div className="relative">
                                            <div className="mb-3 sm:mb-4 mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/20 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                                <Scissors className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 drop-shadow-[0_1px_2px_rgba(96,165,250,0.3)]" />
                                            </div>
                                            <h3 className="font-bold text-white text-sm sm:text-base mb-1 sm:mb-2">Barberos Expertos</h3>
                                            <p className="text-gray-400 text-xs sm:text-sm">Profesionales certificados</p>
                                        </div>
                                    </div>

                                    <div className="group relative backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6 transition-all duration-300 bg-white/5 shadow-xl shadow-blue-500/20 hover:border-white/20 hover:scale-105">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-xl"></div>
                                        <div className="relative">
                                            <div className="mb-3 sm:mb-4 mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-red-600/20 to-purple-600/20 rounded-xl border border-red-500/20 flex items-center justify-center shadow-lg shadow-red-500/20">
                                                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 drop-shadow-[0_1px_2px_rgba(239,68,68,0.3)]" />
                                            </div>
                                            <h3 className="font-bold text-white text-sm sm:text-base mb-1 sm:mb-2">Calidad Premium</h3>
                                            <p className="text-gray-400 text-xs sm:text-sm">Los mejores productos</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Call to Action */}
                            <div className="space-y-4 sm:space-y-6 px-4">
                                <div className="flex justify-center">
                                    <GradientButton 
                                        variant="primary"
                                        size="lg"
                                        className="inline-flex items-center justify-center whitespace-nowrap px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-2xl shadow-xl shadow-blue-500/20 transform hover:scale-105 transition-all duration-300 min-w-fit"
                                        onClick={() => navigate('/appointment')}
                                    >
                                        <span className="flex items-center gap-2 sm:gap-3">
                                            Reserva tu cita ahora
                                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform flex-shrink-0" />
                                        </span>
                                    </GradientButton>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 lg:gap-8 text-xs sm:text-sm text-gray-400">
                                    <div className="flex items-center gap-2">
                                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 drop-shadow-[0_1px_2px_rgba(34,197,94,0.3)]" />
                                        Sin compromiso
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 drop-shadow-[0_1px_2px_rgba(34,197,94,0.3)]" />
                                        Cancelación gratuita
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 drop-shadow-[0_1px_2px_rgba(34,197,94,0.3)]" />
                                        Confirmación inmediata
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Indicador de scroll */}
                    <div className="relative z-10 pb-6 sm:pb-8 flex justify-center">
                        <div className="animate-bounce">
                            <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 rotate-90 drop-shadow-sm" />
                        </div>
                    </div>
                </div>
            )}

            {/* Services Section - Rediseñada con glassmorphism */}
            <section className={`${user ? 'py-8 sm:py-12' : 'py-16 sm:py-24'} px-4 sm:px-6 lg:px-8 relative`}>
                <div className="container mx-auto relative max-w-7xl">
                    {/* Header del usuario - Solo para usuarios logueados */}
                    {user && (
                        <div className="absolute -top-6 sm:-top-8 -right-2 sm:-right-8 z-20">
                            <div className="group relative backdrop-blur-md border border-white/20 rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-2xl shadow-blue-500/20 bg-gradient-to-br from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 transition-all duration-500 overflow-hidden min-w-0 max-w-[280px] sm:max-w-none">
                                {/* Efecto de brillo */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[3%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-lg sm:rounded-xl"></div>
                                
                                <div className="relative flex items-center gap-1.5 sm:gap-2">
                                    {/* Avatar compacto */}
                                    <div className="relative flex-shrink-0">
                                        <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600/30 to-red-600/30 border border-blue-500/40 shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/40 transition-all duration-500">
                                            <Users className="w-3 h-3 sm:w-4 sm:h-4 text-blue-300 drop-shadow-[0_2px_4px_rgba(96,165,250,0.4)]" />
                                        </div>
                                        {/* Indicador de status online */}
                                        <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 border border-white/20 rounded-full shadow-lg shadow-green-500/50"></div>
                                    </div>
                                    
                                    {/* Información del usuario compacta */}
                                    <div className="flex-1 min-w-0">
                                        <div className="space-y-0.5">
                                            <p className="font-medium text-gray-300 text-[10px] sm:text-xs leading-none">Bienvenido,</p>
                                            <p className="font-bold text-white text-xs sm:text-sm truncate group-hover:text-blue-300 transition-colors duration-300 leading-none">
                                                {user.username || user.name || user.email}
                                            </p>
                                            
                                            {/* Badges compactos */}
                                            <div className="flex flex-wrap gap-0.5 sm:gap-1">
                                                {user.role === 'admin' && (
                                                    <span className="inline-flex items-center gap-0.5 px-1 sm:px-1.5 py-0.5 bg-gradient-to-r from-blue-600/40 to-purple-600/40 border border-blue-400/50 text-blue-200 rounded text-[9px] sm:text-xs font-medium shadow-lg shadow-blue-500/30 backdrop-blur-sm leading-none">
                                                        <svg className="w-1.5 h-1.5 sm:w-2 sm:h-2" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                        <span className="hidden sm:inline">Admin</span>
                                                        <span className="sm:hidden">A</span>
                                                    </span>
                                                )}
                                                {isSocio && (
                                                    <span className="inline-flex items-center gap-0.5 px-1 sm:px-1.5 py-0.5 bg-gradient-to-r from-yellow-600/40 to-orange-600/40 border border-yellow-400/50 text-yellow-200 rounded text-[9px] sm:text-xs font-medium shadow-lg shadow-yellow-500/30 backdrop-blur-sm leading-none">
                                                        {isFounder ? (
                                                            <Crown className="w-1.5 h-1.5 sm:w-2 sm:h-2" />
                                                        ) : (
                                                            <svg className="w-1.5 h-1.5 sm:w-2 sm:h-2" viewBox="0 0 20 20" fill="currentColor">
                                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                            </svg>
                                                        )}
                                                        <span className="hidden sm:inline">{isFounder ? 'Fundador' : 'Socio'}</span>
                                                        <span className="sm:hidden">S</span>
                                                    </span>
                                                )}
                                                {user.role === 'barber' && (
                                                    <span className="inline-flex items-center gap-0.5 px-1 sm:px-1.5 py-0.5 bg-gradient-to-r from-red-600/40 to-orange-600/40 border border-red-400/50 text-red-200 rounded text-[9px] sm:text-xs font-medium shadow-lg shadow-red-500/30 backdrop-blur-sm leading-none">
                                                        <Scissors className="w-1.5 h-1.5 sm:w-2 sm:h-2" />
                                                        <span className="hidden sm:inline">Barbero</span>
                                                        <span className="sm:hidden">B</span>
                                                    </span>
                                                )}
                                                {user.role === 'user' && (
                                                    <span className="inline-flex items-center gap-0.5 px-1 sm:px-1.5 py-0.5 bg-gradient-to-r from-green-600/40 to-blue-600/40 border border-green-400/50 text-green-200 rounded text-[9px] sm:text-xs font-medium shadow-lg shadow-green-500/30 backdrop-blur-sm leading-none">
                                                        <User className="w-1.5 h-1.5 sm:w-2 sm:h-2" />
                                                        <span className="hidden sm:inline">Cliente</span>
                                                        <span className="sm:hidden">C</span>
                                                    </span>
                                                )}
                                                
                                                {/* Badge de tiempo online compacto */}
                                                <span className="inline-flex items-center gap-0.5 px-1 sm:px-1.5 py-0.5 bg-gradient-to-r from-gray-600/30 to-gray-700/30 border border-gray-500/40 text-gray-300 rounded text-[9px] sm:text-xs font-medium shadow-sm backdrop-blur-sm leading-none">
                                                    <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                                                    <span className="hidden sm:inline">Online</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Botón settings compacto */}
                                    <button 
                                        onClick={handleProfileNavigation}
                                        className="flex-shrink-0 p-1 bg-gradient-to-r from-blue-600/20 to-red-600/20 hover:from-blue-600/30 hover:to-red-600/30 border border-blue-500/30 hover:border-blue-400/50 rounded text-blue-400 hover:text-blue-300 transition-all duration-300 transform hover:scale-110 shadow-lg shadow-blue-500/20"
                                        title="Editar Perfil"
                                    >
                                        <Settings className="w-2.5 h-2.5 sm:w-3 sm:h-3 drop-shadow-[0_1px_2px_rgba(96,165,250,0.3)]" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Header de la sección */}
                    <div className="text-center max-w-3xl lg:max-w-4xl mx-auto mb-12 sm:mb-20 pt-16 sm:pt-12">
                        <div className="space-y-2 sm:space-y-4 mb-6 sm:mb-8">
                            <GradientText className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                                Nuestros Servicios 
                            </GradientText>
                        </div>
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 leading-relaxed max-w-xl lg:max-w-2xl mx-auto px-4">
                            Ofrecemos una amplia gama de servicios de barbería profesional 
                            <span className="block mt-2 text-blue-400 font-medium">
                                para que luzcas tu mejor versión
                            </span>
                        </p>
                    </div>

                    {/* Contenido de servicios */}
                    {loading ? (
                        <div className="flex justify-center py-12 sm:py-16">
                            <div className="relative w-12 h-12 sm:w-16 sm:h-16">
                                <div className="absolute inset-0">
                                    <div className="w-full h-full border-4 border-blue-500/20 rounded-full"></div>
                                    <div className="w-full h-full border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                                </div>
                            </div>
                        </div>
                    ) : services.length === 0 ? (
                        <div className="text-center py-12 sm:py-16">
                            <div className="mb-4 sm:mb-6 mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gray-800/50 rounded-xl border border-white/10 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Scissors className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500 drop-shadow-sm" />
                            </div>
                            <p className="text-gray-500 text-base sm:text-lg">No hay servicios disponibles en este momento.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
                            {services.map((service, index) => (
                                <div key={service._id} 
                                    className={`group relative backdrop-blur-sm border border-white/10 rounded-2xl lg:rounded-3xl transition-all duration-700 transform hover:-translate-y-2 hover:scale-[1.002] bg-white/5 shadow-xl shadow-blue-500/20 hover:border-white/20 hover:shadow-2xl hover:shadow-red-500/20 ${
                                        index === 0 ? 'md:col-span-2 lg:col-span-1' : ''
                                    }`}
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    {/* Efecto de brillo en hover */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-2xl lg:rounded-3xl"></div>
                                    
                                    <div className="relative p-6 sm:p-8 h-full flex flex-col">
                                        {/* Icono del servicio */}
                                        <div className="mb-4 sm:mb-6 relative">
                                            <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 mx-auto bg-gradient-to-br from-red-600/20 to-blue-600/20 rounded-xl lg:rounded-2xl flex items-center justify-center border border-red-500/20 group-hover:border-blue-500/40 transition-all duration-500 shadow-lg shadow-red-500/20">
                                                <Scissors className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-red-400 group-hover:text-blue-400 transition-colors duration-500 drop-shadow-[0_1px_2px_rgba(239,68,68,0.3)] group-hover:drop-shadow-[0_1px_2px_rgba(96,165,250,0.3)]" />
                                            </div>
                                            {/* Indicador de popularidad para el primer servicio */}
                                            {index === 0 && (
                                                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-600 to-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg shadow-red-500/20">
                                                    Popular
                                                </div>
                                            )}
                                        </div>

                                        {/* Contenido del servicio - Flex grow para ocupar espacio disponible */}
                                        <div className="text-center mb-6 sm:mb-8 flex-grow">
                                            <h3 className="font-bold text-lg sm:text-xl lg:text-2xl xl:text-3xl mb-3 sm:mb-4 text-white group-hover:text-blue-400 transition-colors duration-500">
                                                {service.name}
                                            </h3>
                                            <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                                                {service.description}
                                            </p>
                                        </div>

                                        {/* Call to action mejorado */}
                                        <div className="text-center mt-auto">
                                            <Link 
                                                to="/appointment" 
                                                className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-red-600/20 to-blue-600/20 hover:from-red-600/40 hover:to-blue-600/40 border border-red-500/30 hover:border-blue-500/50 rounded-xl text-red-400 hover:text-blue-400 transition-all duration-500 transform hover:scale-105 shadow-lg shadow-red-500/20 hover:shadow-blue-500/20 font-medium text-sm sm:text-base"
                                            >
                                                <span>Reservar ahora</span>
                                                <ArrowRight className="w-4 h-4 drop-shadow-[0_1px_2px_rgba(239,68,68,0.3)] group-hover:drop-shadow-[0_1px_2px_rgba(96,165,250,0.3)]" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Barbers Section - Rediseñada con glassmorphism */}
            <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                <div className="container mx-auto relative max-w-7xl">
                    {/* Header de la sección mejorado */}
                    <div className="text-center max-w-3xl lg:max-w-4xl mx-auto mb-12 sm:mb-20">
                        <div className="space-y-2 sm:space-y-4 mb-6 sm:mb-8">
                            <GradientText className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                                Barberos Expertos
                            </GradientText>
                        </div>
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 leading-relaxed max-w-xl lg:max-w-2xl mx-auto px-4">
                            Conoce a nuestro equipo de profesionales expertos en el arte de la barbería
                            <span className="block mt-2 text-blue-400 font-medium">
                                Pasión, técnica y dedicación en cada corte
                            </span>
                        </p>
                    </div>

                    {/* Contenido de barberos mejorado */}
                    {loading ? (
                        <div className="flex justify-center items-center min-h-[300px] sm:min-h-[400px]">
                            <div className="relative">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-blue-500/20"></div>
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-transparent border-t-blue-500 animate-spin absolute inset-0"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-500/20"></div>
                                </div>
                            </div>
                        </div>
                    ) : barbers.length === 0 ? (
                        <div className="text-center py-16 sm:py-20">
                            <div className="mb-6 sm:mb-8 mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-600/20 to-red-600/20 rounded-xl lg:rounded-2xl flex items-center justify-center border border-blue-500/30 shadow-xl shadow-blue-500/20">
                                <Users className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400 drop-shadow-[0_1px_2px_rgba(96,165,250,0.3)]" />
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-300 mb-3 sm:mb-4">Estamos construyendo nuestro equipo</h3>
                            <p className="text-gray-400 text-sm sm:text-base lg:text-lg max-w-sm sm:max-w-md mx-auto px-4">
                                Pronto agregaremos nuevos profesionales especializados a nuestro equipo de barberos expertos
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
                            {barbers.map((barber, index) => (
                                <div key={barber._id || barber.id} 
                                    className="transform hover:scale-[1.002] hover:-translate-y-1 transition-all duration-500"
                                    style={{ animationDelay: `${index * 150}ms` }}
                                >
                                    <BarberCard barber={barber} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Call to action adicional */}
                    {barbers.length > 0 && (
                        <div className="text-center mt-12 sm:mt-16">
                            <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-6">¿Quieres conocer más sobre nuestros barberos?</p>
                            <GradientButton 
                                variant="primary"
                                size="md"
                                className="px-6 sm:px-8 py-2.5 sm:py-3 shadow-xl shadow-blue-500/20"
                                onClick={() => navigate('/barbers')}
                            >
                                <span className="flex items-center gap-2">
                                    Ver todos los barberos
                                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 drop-shadow-[0_1px_2px_rgba(96,165,250,0.3)]" />
                                </span>
                            </GradientButton>
                        </div>
                    )}
                </div>
            </section>

            {/* Contact/Location Section - Rediseñada con glassmorphism */}
            <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                <div className="container mx-auto relative max-w-7xl">
                    {/* Header de la sección */}
                    <div className="text-center max-w-3xl lg:max-w-4xl mx-auto mb-12 sm:mb-20">
                        <div className="space-y-2 sm:space-y-4 mb-6 sm:mb-8">
                            <GradientText className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                                Encuéntranos, Te esperamos
                            </GradientText>
                        </div>
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 leading-relaxed max-w-xl lg:max-w-2xl mx-auto px-4">
                            Conoce nuestra ubicación, visita nuestro espacio
                            <span className="block mt-2 text-blue-400 font-medium">
                                Ven y experimenta la diferencia por ti mismo
                            </span>
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
                        {/* Información de contacto mejorada */}
                        <div className="relative order-2 lg:order-1">
                            <div className="relative backdrop-blur-sm border border-white/10 rounded-2xl lg:rounded-3xl p-4 sm:p-6 shadow-2xl shadow-blue-500/20 bg-white/5 h-[400px] sm:h-[500px] lg:h-[600px] flex flex-col">
                                {/* Efecto de brillo */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000 rounded-2xl lg:rounded-3xl"></div>
                                
                                <div className="relative z-10 flex flex-col h-full">
                                    {/* Header de la tarjeta */}
                                    <div className="mb-4 sm:mb-6">
                                        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600/20 to-red-600/20 rounded-lg xl:rounded-xl flex items-center justify-center border border-blue-500/30 shadow-lg shadow-blue-500/20">
                                                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 drop-shadow-[0_1px_2px_rgba(96,165,250,0.3)]" />
                                            </div>
                                            <h3 className="text-lg sm:text-xl font-bold text-white">Información de Contacto</h3>
                                        </div>
                                        <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                                            Estamos aquí para atenderte con la mejor experiencia de barbería.
                                        </p>
                                    </div>

                                    {/* Lista de contacto mejorada */}
                                    <div className="space-y-3 sm:space-y-4 flex-1">
                                        <div className="group">
                                            <div className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg xl:rounded-xl bg-gradient-to-r from-gray-800/30 to-gray-700/30 border border-gray-600/20 hover:border-blue-500/40 transition-all duration-300 backdrop-blur-sm">
                                                <div className="flex-shrink-0">
                                                    <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-600/20 to-red-600/20 rounded-md lg:rounded-lg border border-blue-500/30 group-hover:border-blue-400/50 transition-all duration-300 shadow-sm shadow-blue-500/20">
                                                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 group-hover:text-blue-300 transition-colors duration-300 drop-shadow-[0_1px_2px_rgba(96,165,250,0.3)]" />
                                                    </div>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="text-sm sm:text-base font-semibold text-white mb-1 group-hover:text-blue-300 transition-colors duration-300">Dirección</h4>
                                                    <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">Cra 77vBis #52 A - 08</p>
                                                    <p className="text-xs text-gray-500">Bogotá D.C, Cundinamarca.</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="group">
                                            <div className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg xl:rounded-xl bg-gradient-to-r from-gray-800/30 to-gray-700/30 border border-gray-600/20 hover:border-red-500/40 transition-all duration-300 backdrop-blur-sm">
                                                <div className="flex-shrink-0">
                                                    <div className="p-1.5 sm:p-2 bg-gradient-to-br from-red-600/20 to-blue-600/20 rounded-md lg:rounded-lg border border-red-500/30 group-hover:border-red-400/50 transition-all duration-300 shadow-sm shadow-red-500/20">
                                                        <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-red-400 group-hover:text-red-300 transition-colors duration-300 drop-shadow-[0_1px_2px_rgba(239,68,68,0.3)]" />
                                                    </div>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="text-sm sm:text-base font-semibold text-white mb-1 group-hover:text-red-300 transition-colors duration-300">Teléfono</h4>
                                                    <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">+57 311 588 2528</p>
                                                    <p className="text-xs text-gray-500">WhatsApp disponible</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="group">
                                            <div className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg xl:rounded-xl bg-gradient-to-r from-gray-800/30 to-gray-700/30 border border-gray-600/20 hover:border-blue-500/40 transition-all duration-300 backdrop-blur-sm">
                                                <div className="flex-shrink-0">
                                                    <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-600/20 to-red-600/20 rounded-md lg:rounded-lg border border-blue-500/30 group-hover:border-blue-400/50 transition-all duration-300 shadow-sm shadow-blue-500/20">
                                                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 group-hover:text-blue-300 transition-colors duration-300 drop-shadow-[0_1px_2px_rgba(96,165,250,0.3)]" />
                                                    </div>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="text-sm sm:text-base font-semibold text-white mb-1 group-hover:text-blue-300 transition-colors duration-300">Horario de Atención</h4>
                                                    <div className="space-y-0.5">
                                                        <p className="text-gray-400 text-xs sm:text-sm">Lunes - Sábado: 9:00 AM - 8:00 PM</p>
                                                        <p className="text-gray-400 text-xs sm:text-sm">Domingo: 10:00 AM - 6:00 PM</p>
                                                    </div>
                                                    <p className="text-xs text-gray-500">Reservas recomendadas</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Call to action */}
                                    <div className="mt-4 pt-3 sm:pt-4 border-t border-gray-700/50">
                                        <GradientButton 
                                            variant="primary"
                                            size="md"
                                            className="w-full py-2 sm:py-2.5 shadow-xl shadow-blue-500/20"
                                            onClick={() => navigate('/appointment')}
                                        >
                                            <span className="flex items-center justify-center gap-2">
                                                Reservar una cita
                                                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 drop-shadow-[0_1px_2px_rgba(96,165,250,0.3)]" />
                                            </span>
                                        </GradientButton>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mapa mejorado */}
                        <div className="relative order-1 lg:order-2">
                            <div className="relative h-[400px] sm:h-[500px] lg:h-[600px] rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/20 border border-white/10 backdrop-blur-sm">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15907.448844294731!2d-74.16188815134278!3d4.618659698034156!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e3f9fadb32531a3%3A0xad47ce8d546359c!2sThe%20brothers%20barber!5e0!3m2!1ses!2sco!4v1756390613507!5m2!1ses!2sco"
                                    className="w-full h-full"
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    style={{ filter: 'grayscale(20%) contrast(1.1)' }}
                                ></iframe>
                                
                                {/* Overlay decorativo */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none rounded-2xl lg:rounded-3xl"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </PageContainer>
    );
}

export default Home;

