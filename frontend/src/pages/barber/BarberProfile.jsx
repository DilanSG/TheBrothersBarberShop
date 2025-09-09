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
          <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700/40 rounded-2xl p-8 shadow-xl text-center">
            <div className="text-blue-400 mb-4">
              <div className="w-16 h-16 border-t-4 border-blue-400/40 rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="flex flex-col justify-center items-center min-h-[60vh] p-4">
          <div className="bg-red-900/30 border border-red-500/50 rounded-2xl p-8 max-w-lg w-full text-center shadow-xl shadow-red-500/10">
            <div className="bg-red-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-red-400 mb-4">{error}</h3>
            <Link
              to="/barbers"
              className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-gray-700/50 to-gray-600/50 hover:from-gray-600/50 hover:to-gray-500/50 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver a la lista de barberos
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
          <div className="bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/40 text-yellow-400 px-8 py-6 rounded-2xl relative max-w-md w-full shadow-xl text-center">
            <div className="bg-yellow-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Barbero no encontrado</h3>
            <p className="text-yellow-300 mb-4">El barbero que buscas no existe o ha sido eliminado.</p>
            <Link
              to="/barbers"
              className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-gray-700/50 to-gray-600/50 hover:from-gray-600/50 hover:to-gray-500/50 text-white rounded-lg transition-all duration-300"
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
      <div className="min-h-screen relative">
        {/* Header del perfil */}
        <div className="mb-8">
          <div className="bg-gray-800/30 border border-gray-700/30 rounded-2xl p-8 backdrop-blur-sm">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
              {/* Foto de perfil */}
              <div className="relative">
                {(() => {
                  // Si es el perfil del usuario actual, usar la foto del contexto (siempre actualizada)
                  const isCurrentUser = user && barber && (user._id === barber.user?._id || user._id === barber._id);
                  const profilePicture = isCurrentUser ? user.profilePicture : (barber?.user?.photo || barber?.profilePicture);
                  
                  return profilePicture ? (
                    <img
                      src={profilePicture}
                      alt={barber?.user?.name || barber?.name}
                      className="w-32 h-32 rounded-full object-cover shadow-xl"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center shadow-xl">
                      <User className="w-16 h-16 text-blue-400" />
                    </div>
                  );
                })()}
              </div>

              {/* Información principal */}
              <div className="flex-1">
                <GradientText className="text-4xl font-bold mb-2">
                  {barber?.user?.name || barber?.name || 'Cargando...'}
                </GradientText>
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-300 font-medium">Barbero Profesional</span>
                </div>

                {/* Información de contacto */}
                <div className="grid grid-cols-1 gap-4">
                  {(barber?.user?.email || barber?.email) && (
                    <div className="flex items-center gap-3 text-gray-300">
                      <Mail className="w-5 h-5 text-blue-400" />
                      <span>{barber?.user?.email || barber?.email}</span>
                    </div>
                  )}
                  {(barber?.user?.phone || barber?.phone) && (
                    <div className="flex items-center gap-3 text-gray-300">
                      <Phone className="w-5 h-5 text-blue-400" />
                      <span>{barber?.user?.phone || barber?.phone}</span>
                    </div>
                  )}
                  {barber?.specialties && barber.specialties.length > 0 && (
                    <div className="flex items-center gap-3 text-gray-300">
                      <Star className="w-5 h-5 text-blue-400" />
                      <span>{barber.specialties.join(', ')}</span>
                    </div>
                  )}
                  {barber?.experience && (
                    <div className="flex items-center gap-3 text-gray-300">
                      <Award className="w-5 h-5 text-blue-400" />
                      <span>{barber.experience} años de experiencia</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Descripción */}
            {barber?.description && (
              <div className="mt-6 pt-6 border-t border-gray-700/30">
                <h3 className="text-xl font-semibold text-blue-400 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Sobre mí
                </h3>
                <p className="text-gray-300 leading-relaxed bg-gray-800/20 rounded-xl p-4">
                  {barber.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Secciones principales */}
        <div className="space-y-8">
          {/* Horario */}
          <div className="w-full">
            <div className="bg-gray-800/30 border border-gray-700/30 rounded-2xl p-8 backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <GradientText>
                  <Clock className="w-6 h-6" />
                  Horario de Atención
                </GradientText>
              </h3>
              
              {barber?.schedule ? (
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-7 gap-2 min-w-max">
                    {/* Nombres de los días */}
                    {Object.entries(barber.schedule).map(([day, info]) => {
                      const dayNames = {
                        monday: 'LUN',
                        tuesday: 'MAR',
                        wednesday: 'MIÉ',
                        thursday: 'JUE',
                        friday: 'VIE',
                        saturday: 'SÁB',
                        sunday: 'DOM'
                      };
                      
                      return (
                        <div key={day} className="text-center min-w-[80px]">
                          {/* Día */}
                          <div className={`p-2 rounded-t-lg font-semibold text-sm ${
                            info.available 
                              ? 'bg-blue-500/20 text-blue-300 border-b-2 border-blue-500/50' 
                              : 'bg-gray-800/30 text-gray-500 border-b-2 border-gray-600/30'
                          }`}>
                            {dayNames[day]}
                          </div>
                          
                          {/* Horario */}
                          <div className={`p-3 rounded-b-lg text-xs leading-tight min-h-[60px] flex flex-col justify-center ${
                            info.available
                              ? 'bg-gray-700/30 text-gray-200 border border-t-0 border-gray-600/20'
                              : 'bg-gray-900/30 text-gray-500 border border-t-0 border-gray-800/20'
                          }`}>
                            {info.available ? (
                              <>
                                <div className="font-medium">
                                  <GradientText className="text-sm font-bold">
                                    {info.start}
                                  </GradientText>
                                </div>
                                <div className="text-gray-400">a</div>
                                <div className="font-medium">
                                  <GradientText className="text-sm font-bold">
                                    {info.end}
                                  </GradientText>
                                </div>
                              </>
                            ) : (
                              <div className="text-center">Cerrado</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Horario no disponible</p>
                </div>
              )}
            </div>
          </div>

          {/* Servicios */}
          <div className="w-full">
            <div className="bg-gray-800/30 border border-gray-700/30 rounded-2xl p-8 backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <GradientText>
                  <Scissors className="w-6 h-6" />
                  Servicios Disponibles
                </GradientText>
              </h3>
              
              {barber?.services?.length > 0 ? (
                <div className="overflow-x-auto">
                  <div className="flex gap-4 pb-2 w-max">
                    {barber.services.map((service, idx) => (
                      <div key={idx} className="group bg-gray-800/20 hover:bg-gray-800/40 p-4 rounded-xl transition-all duration-300 border border-gray-700/20 hover:border-blue-500/30 flex-shrink-0 min-w-[200px]">
                        <div className="text-center">
                          <div className="font-medium mb-2 text-sm">
                            <GradientText className="font-bold">
                              {service.name}
                            </GradientText>
                          </div>
                          <div className="text-blue-400 font-bold bg-blue-500/10 px-3 py-2 rounded-full group-hover:bg-blue-500/20 transition-all duration-300 text-lg">
                            ${service.price}
                          </div>
                          {service.duration && (
                            <div className="text-xs text-gray-400 mt-2">
                              {service.duration} min
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Scissors className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay servicios disponibles</p>
                </div>
              )}

              {/* Botón de reserva para usuarios */}
              {user && user.role === 'user' && (
                <div className="mt-6 pt-6 border-t border-gray-700/30">
                  <Link
                    to={`/appointment?barberId=${barber?._id}`}
                    className="group w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25"
                  >
                    <Calendar className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="font-semibold">Reservar Cita</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Estadísticas (solo para admin) */}
          {user?.role === 'admin' && (
            <div className="w-full">
              <div className="bg-gray-800/30 border border-gray-700/30 rounded-2xl p-8 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <GradientText>
                    <BarChart3 className="w-6 h-6" />
                    Estadísticas
                  </GradientText>
                </h3>
                
                {stats ? (
                  <div className="space-y-6">
                    {/* Grid de estadísticas principales */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="group bg-gray-800/20 hover:bg-gray-800/40 p-4 rounded-xl transition-all duration-300 border border-gray-700/20 hover:border-blue-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-blue-400" />
                          <span className="text-sm text-gray-400">Total Citas</span>
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {stats.totalAppointments || 0}
                        </div>
                      </div>
                      
                      <div className="group bg-gray-800/20 hover:bg-gray-800/40 p-4 rounded-xl transition-all duration-300 border border-gray-700/20 hover:border-green-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-gray-400">Ingresos</span>
                        </div>
                        <div className="text-2xl font-bold text-green-400">
                          ${stats.totalRevenue || 0}
                        </div>
                      </div>
                      
                      <div className="group bg-gray-800/20 hover:bg-gray-800/40 p-4 rounded-xl transition-all duration-300 border border-gray-700/20 hover:border-purple-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-purple-400" />
                          <span className="text-sm text-gray-400">Este Mes</span>
                        </div>
                        <div className="text-2xl font-bold text-purple-400">
                          {stats.currentMonthAppointments || 0}
                        </div>
                      </div>

                      <div className="group bg-gray-800/20 hover:bg-gray-800/40 p-4 rounded-xl transition-all duration-300 border border-gray-700/20 hover:border-yellow-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm text-gray-400">Rating</span>
                        </div>
                        <div className="text-2xl font-bold text-yellow-400">
                          {stats.averageRating || '0.0'}
                        </div>
                      </div>
                    </div>

                    {/* Servicios más solicitados */}
                    {stats.appointmentsByService && stats.appointmentsByService.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
                          <Star className="w-5 h-5" />
                          Servicios Populares
                        </h4>
                        <div className="space-y-3">
                          {stats.appointmentsByService.map((s, idx) => (
                            <div key={idx} className="group bg-gray-800/20 hover:bg-gray-800/40 p-4 rounded-xl transition-all duration-300 border border-gray-700/20 hover:border-blue-500/30">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium text-gray-200 group-hover:text-white">
                                    {s.service}
                                  </div>
                                  <div className="text-green-400 text-sm font-medium">
                                    ${s.revenue}
                                  </div>
                                </div>
                                <span className="text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full text-sm">
                                  {s.count} citas
                                </span>
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
      </div>
    </PageContainer>
  );
}
