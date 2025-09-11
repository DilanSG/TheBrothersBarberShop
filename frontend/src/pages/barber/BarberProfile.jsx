import React from 'react';
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import {PageContainer} from '../../components/layout/PageContainer';
import { 
  User, 
  Clock, 
  Phone, 
  Mail, 
  MapPin, 
  Star, 
  Scissors, 
  Calendar, 
  Award,
  TrendingUp,
  BarChart3,
  DollarSign
} from 'lucide-react';
import GradientText from '../../components/ui/GradientText';
import GradientButton from '../../components/ui/GradientButton';

export default function BarberProfile() {
  const { id } = useParams();
  const [barber, setBarber] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchBarberData();
  }, [id]);

  const fetchBarberData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/barbers/${id}`);
      
      if (response.success) {
        console.log('Datos del barbero recibidos:', response.data);
        setBarber(response.data);
        
        // Si es admin, obtener estadísticas
        if (user?.role === 'admin') {
          try {
            const statsResponse = await api.get(`/barbers/${id}/stats`);
            if (statsResponse.success) {
              setStats(statsResponse.data);
            }
          } catch (statsError) {
            console.warn('No se pudieron cargar las estadísticas:', statsError);
          }
        }
      } else {
        setError('Error al cargar los datos del barbero');
      }
    } catch (error) {
      console.error('Error fetching barber data:', error);
      if (error.response?.status === 404) {
        setError('Barbero no encontrado');
      } else {
        setError('Error al conectar con el servidor');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center min-h-[60vh] p-4">
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/40 rounded-2xl p-8 shadow-xl shadow-blue-500/20 text-center">
            <div className="w-16 h-16 border-t-4 border-blue-400/40 rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-white mb-2">Cargando perfil...</h3>
            <p className="text-gray-400">Obteniendo información del barbero</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="flex flex-col justify-center items-center min-h-[60vh] p-4">
          <div className="bg-red-500/5 backdrop-blur-md border border-red-500/20 rounded-2xl shadow-2xl shadow-red-500/20 p-8 max-w-lg w-full text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-red-300 mb-4">{error}</h3>
            <Link
              to="/barbers"
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-medium hover:from-red-500 hover:to-red-400 transition-all duration-300 shadow-xl shadow-red-500/20"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver a barberos
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!barber) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center min-h-[60vh] p-4">
          <div className="bg-yellow-500/5 backdrop-blur-md border border-yellow-500/20 rounded-2xl shadow-2xl shadow-yellow-500/20 p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-yellow-300 mb-2">Barbero no encontrado</h3>
            <p className="text-gray-300 mb-6">El barbero que buscas no existe o ha sido eliminado.</p>
            <Link
              to="/barbers"
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white rounded-xl font-medium hover:from-yellow-500 hover:to-yellow-400 transition-all duration-300 shadow-xl shadow-yellow-500/20"
            >
              Ver barberos disponibles
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 space-y-8">
        
        {/* Header con botón de volver */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6">
          <Link
            to="/barbers"
            className="group p-2.5 sm:p-3 bg-gradient-to-r from-gray-800/60 to-gray-700/60 hover:from-gray-700/70 hover:to-gray-600/70 rounded-xl border border-gray-600/30 hover:border-blue-500/50 transition-all duration-300 shadow-xl shadow-blue-500/20"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 group-hover:text-blue-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/20 shadow-xl shadow-blue-500/20">
              <User className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-blue-400" />
            </div>
            <GradientText className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold leading-tight">
              Perfil del Barbero
            </GradientText>
          </div>
        </div>

        {/* Perfil Principal */}
        <div className="group relative backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/20">
          {/* Efecto de brillo */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-2xl"></div>
          
          <div className="relative p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4 sm:gap-6">
              {/* Foto de perfil */}
              <div className="relative">
                {(() => {
                  const isCurrentUser = user && barber && (user._id === barber.user?._id || user._id === barber._id);
                  const profilePicture = isCurrentUser 
                    ? user.profilePicture 
                    : (barber?.user?.profilePicture || barber?.photo?.url);
                  
                  return profilePicture ? (
                    <img
                      src={profilePicture}
                      alt={barber?.user?.name || barber?.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-full object-cover shadow-xl shadow-blue-500/20 border-2 border-blue-500/20"
                    />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center shadow-xl shadow-blue-500/20 border-2 border-blue-500/20">
                      <User className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-blue-400" />
                    </div>
                  );
                })()}
              </div>

              {/* Información principal */}
              <div className="flex-1 text-center lg:text-left w-full">
                <GradientText className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mb-2 leading-tight">
                  {barber?.user?.name || barber?.name || 'Cargando...'}
                </GradientText>
                
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" />
                  <span className="text-gray-300 font-medium text-sm sm:text-base">{barber?.specialty || 'Barbero Profesional'}</span>
                </div>

                {/* Información de contacto en grid responsive */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 max-w-lg mx-auto lg:mx-0">
                  {(barber?.user?.email || barber?.email) && (
                    <div className="flex items-center gap-2 sm:gap-3 text-gray-300 p-2 bg-white/5 rounded-lg">
                      <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span className="truncate text-xs sm:text-sm">{barber?.user?.email || barber?.email}</span>
                    </div>
                  )}
                  {(barber?.user?.phone || barber?.phone) && (
                    <div className="flex items-center gap-2 sm:gap-3 text-gray-300 p-2 bg-white/5 rounded-lg">
                      <Phone className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">{barber?.user?.phone || barber?.phone}</span>
                    </div>
                  )}
                  {barber?.experience && (
                    <div className="flex items-center gap-2 sm:gap-3 text-gray-300 p-2 bg-white/5 rounded-lg">
                      <Award className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">{barber.experience} años de experiencia</span>
                    </div>
                  )}
                  {barber?.rating?.average > 0 && (
                    <div className="flex items-center gap-2 sm:gap-3 text-gray-300 p-2 bg-white/5 rounded-lg">
                      <Star className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">{barber.rating.average.toFixed(1)} ⭐ ({barber.rating.count} reseñas)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Descripción */}
            {barber?.description && (
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/10">
                <h3 className="text-base sm:text-lg font-bold flex items-center justify-center lg:justify-start gap-2 mb-3">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                  <GradientText>Sobre mí</GradientText>
                </h3>
                <p className="text-gray-300 leading-relaxed bg-white/5 rounded-xl p-3 sm:p-4 text-sm sm:text-base text-center lg:text-left">
                  {barber.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Horario de Atención */}
        <div className="group relative backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/20">
          {/* Efecto de brillo */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-2xl"></div>
          
          <div className="relative p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-center lg:justify-start gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl border border-purple-500/20 shadow-xl shadow-blue-500/20">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
              </div>
              <GradientText className="text-lg sm:text-xl lg:text-2xl font-bold">
                Horario de Atención
              </GradientText>
            </div>
            
            {barber?.schedule ? (
              <>
                <div className={`grid gap-2 sm:gap-3 ${
                  Object.keys(barber.schedule).length === 1 ? 'grid-cols-1 max-w-xs mx-auto' :
                  Object.keys(barber.schedule).length === 2 ? 'grid-cols-2 max-w-sm mx-auto' :
                  Object.keys(barber.schedule).length === 3 ? 'grid-cols-2 sm:grid-cols-3 max-w-md mx-auto' :
                  Object.keys(barber.schedule).length === 4 ? 'grid-cols-2 sm:grid-cols-4 max-w-lg mx-auto' :
                  Object.keys(barber.schedule).length === 5 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' :
                  Object.keys(barber.schedule).length === 6 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6' :
                  'grid-cols-2 sm:grid-cols-4 lg:grid-cols-7'
                }`}>
                  {Object.entries(barber.schedule).map(([day, info]) => {
                    const dayNames = {
                      monday: 'Lun',
                      tuesday: 'Mar',
                      wednesday: 'Mié',
                      thursday: 'Jue',
                      friday: 'Vie',
                      saturday: 'Sáb',
                      sunday: 'Dom'
                    };
                    
                    return (
                      <div 
                        key={day} 
                        className={`group relative backdrop-blur-sm border rounded-lg p-1.5 sm:p-2 transition-all duration-300 hover:scale-[1.02] overflow-hidden shadow-lg shadow-blue-500/20 h-14 sm:h-16 flex flex-col justify-center ${
                          info.available 
                            ? 'border-green-500/30 bg-green-500/5' 
                            : 'border-gray-500/30 bg-gray-500/5'
                        }`}
                      >
                        {/* Efecto de brillo en cards */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-lg"></div>
                        
                        <div className="relative text-center">
                          <div className={`font-bold text-xs sm:text-sm mb-0.5 sm:mb-1 ${
                            info.available ? 'text-green-300' : 'text-gray-400'
                          }`}>
                            {dayNames[day]}
                          </div>
                          
                          {info.available ? (
                            <div className="text-white text-xs sm:text-sm font-medium whitespace-nowrap h-3 sm:h-4 flex items-center justify-center">
                              {info.start} - {info.end}
                            </div>
                          ) : (
                            <div className="text-gray-400 text-xs sm:text-sm h-3 sm:h-4 flex items-center justify-center">
                              Cerrado
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Resumen de días disponibles */}
                {(() => {
                  const availableDays = Object.values(barber.schedule).filter(day => day.available).length;
                  const totalDays = Object.keys(barber.schedule).length;
                  return availableDays > 0 && availableDays < totalDays ? (
                    <div className="text-center text-gray-400 text-sm mt-4">
                      Disponible {availableDays} de {totalDays} días
                    </div>
                  ) : null;
                })()}
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Horario no disponible</p>
              </div>
            )}
          </div>
        </div>

        {/* Servicios Disponibles */}
        <div className="group relative backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/20">
          {/* Efecto de brillo */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-2xl"></div>
          
          <div className="relative p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-xl border border-green-500/20 shadow-xl shadow-blue-500/20">
                <Scissors className="w-6 h-6 text-green-400" />
              </div>
              <GradientText className="text-xl lg:text-2xl font-bold">
                Servicios Disponibles
              </GradientText>
            </div>
            
            {barber?.services?.length > 0 ? (
              <>
                <div className={`grid gap-3 mb-6 ${
                  barber.services.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
                  barber.services.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto' :
                  barber.services.length === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
                  barber.services.length === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' :
                  barber.services.length === 5 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5' :
                  'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3'
                }`}>
                  {barber.services.slice(0, 6).map((service, idx) => (
                    <div 
                      key={idx} 
                      className="group relative backdrop-blur-sm border border-white/10 rounded-lg p-3 hover:scale-[1.02] transition-all duration-300 overflow-hidden shadow-lg shadow-blue-500/20"
                    >
                      {/* Efecto de brillo en cards */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-lg"></div>
                      
                      <div className="relative">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-semibold text-white text-sm leading-tight flex-1">
                            {service.name}
                          </h4>
                          <div className="flex-shrink-0 px-2 py-1 bg-white/10 text-white border border-white/20 rounded-md text-xs font-medium">
                            ${service.price}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          {service.duration && (
                            <div className="flex items-center gap-1 text-gray-400">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              <span>{service.duration} min</span>
                            </div>
                          )}
                          
                          {service.description && (
                            <div className="text-gray-400 text-right flex-1 ml-2">
                              <span className="line-clamp-1 text-xs">
                                {service.description.length > 25 
                                  ? `${service.description.substring(0, 25)}...` 
                                  : service.description
                                }
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Mostrar mensaje si hay más de 6 servicios */}
                {barber.services.length > 6 && (
                  <div className="text-center text-gray-400 text-sm mb-4">
                    Mostrando 6 de {barber.services.length} servicios disponibles
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Scissors className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay servicios disponibles</p>
              </div>
            )}

            {/* Botón de reserva para usuarios */}
            {user && user.role === 'user' && (
              <div className="pt-4 sm:pt-6 border-t border-white/10">
                <Link to={`/appointment?barberId=${barber?._id}`} className="block">
                  <GradientButton
                    variant="primary"
                    size="lg"
                    className="w-full shadow-xl shadow-blue-500/20 h-12 sm:h-auto"
                  >
                    <div className="flex items-center justify-center gap-2 sm:gap-3">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform duration-300" />
                      <span className="font-semibold text-sm sm:text-base">Reservar Cita</span>
                    </div>
                  </GradientButton>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Estadísticas (solo para admin) */}
        {user?.role === 'admin' && (
          <div className="group relative backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/20">
            {/* Efecto de brillo */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-2xl"></div>
            
            <div className="relative p-4 sm:p-6 lg:p-8">
              <div className="flex items-center justify-center lg:justify-start gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="p-2 sm:p-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl border border-purple-500/20 shadow-xl shadow-blue-500/20">
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                </div>
                <GradientText className="text-lg sm:text-xl lg:text-2xl font-bold">
                  Estadísticas
                </GradientText>
              </div>
              
              {stats ? (
                <div className="space-y-4 sm:space-y-6">
                  {/* Grid de estadísticas principales */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="group relative backdrop-blur-sm border border-white/10 rounded-xl p-3 sm:p-4 hover:scale-105 transition-all duration-300 overflow-hidden shadow-lg shadow-blue-500/20">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-xl"></div>
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                          <span className="text-xs sm:text-sm text-gray-400">Total Citas</span>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-white">
                          {stats.totalAppointments || 0}
                        </div>
                      </div>
                    </div>
                    
                    <div className="group relative backdrop-blur-sm border border-white/10 rounded-xl p-3 sm:p-4 hover:scale-105 transition-all duration-300 overflow-hidden shadow-lg shadow-blue-500/20">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-xl"></div>
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" />
                          <span className="text-xs sm:text-sm text-gray-400">Ingresos</span>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-green-400">
                          ${stats.totalRevenue || 0}
                        </div>
                      </div>
                    </div>
                    
                    <div className="group relative backdrop-blur-sm border border-white/10 rounded-xl p-3 sm:p-4 hover:scale-105 transition-all duration-300 overflow-hidden shadow-lg shadow-blue-500/20">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-xl"></div>
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
                          <span className="text-xs sm:text-sm text-gray-400">Este Mes</span>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-purple-400">
                          {stats.currentMonthAppointments || 0}
                        </div>
                      </div>
                    </div>

                    <div className="group relative backdrop-blur-sm border border-white/10 rounded-xl p-3 sm:p-4 hover:scale-105 transition-all duration-300 overflow-hidden shadow-lg shadow-blue-500/20">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-xl"></div>
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm text-gray-400">Rating</span>
                        </div>
                        <div className="text-2xl font-bold text-yellow-400">
                          {stats.averageRating || '0.0'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Servicios más solicitados */}
                  {stats.appointmentsByService && stats.appointmentsByService.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Star className="w-5 h-5 text-blue-400" />
                        <GradientText className="text-lg font-bold">
                          Servicios Populares
                        </GradientText>
                      </div>
                      <div className="space-y-3">
                        {stats.appointmentsByService.map((s, idx) => (
                          <div key={idx} className="group relative backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:scale-105 transition-all duration-300 overflow-hidden shadow-lg shadow-blue-500/20">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-xl"></div>
                            <div className="relative">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium text-gray-200 group-hover:text-white">
                                    {s.service}
                                  </div>
                                  <div className="text-green-400 text-sm font-medium">
                                    ${s.revenue}
                                  </div>
                                </div>
                                <span className="text-blue-400 bg-blue-500/20 px-3 py-1 rounded-full text-sm border border-blue-500/40">
                                  {s.count} citas
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Estadísticas no disponibles</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
