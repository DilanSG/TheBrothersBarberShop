import React from 'react';
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { api } from '../../services/api';

export default function BarberProfile() {
  const { id } = useParams();
  const [barber, setBarber] = useState(null);
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchBarberAndStats = async () => {
      try {
        const [barberRes, statsRes] = await Promise.all([
          api.get(`/barbers/${id}`),
          user?.role === 'admin' || user?._id === id ? 
            api.get(`/barbers/${id}/stats`) : null
        ].filter(Boolean));

        if (!barberRes.success) {
          throw new Error(barberRes.message || 'Error al cargar el barbero');
        }

        setBarber(barberRes.data);

        if (statsRes && statsRes.success) {
          setStats(statsRes.data);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setError(error.message || 'Error al cargar el perfil del barbero');
        setLoading(false);
      }
    };

    fetchBarberAndStats();
  }, [id, token, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex justify-center items-center">
        <div className="relative">
          <div className="w-16 h-16 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-t-4 border-blue-400/40 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col justify-center items-center p-4">
        <div className="bg-red-900/50 border border-red-700 rounded-xl p-8 max-w-lg w-full text-center">
          <div className="bg-red-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-red-400 mb-4">{error}</h3>
          <Link
            to="/barbers"
            className="inline-flex items-center justify-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a la lista de barberos
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex justify-center items-center p-4">
        <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 text-red-400 px-6 py-4 rounded-xl relative max-w-md w-full shadow-2xl">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      </div>
    );
  }

  if (!barber) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex justify-center items-center p-4">
        <div className="bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/20 text-yellow-400 px-6 py-4 rounded-xl relative max-w-md w-full shadow-2xl">
          No se encontró el barbero
        </div>
      </div>
    );
  }

  const canEdit = user && (user.role === 'admin' || user._id === barber.user?._id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Barra de acciones para admin/propio barbero */}
        {canEdit && (
          <div className="mb-8 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 rounded-xl p-4 flex justify-end space-x-4 shadow-2xl border border-gray-700/50 backdrop-blur-sm">
            <Link
              to={user.role === 'admin' ? `/admin/barbers/edit/${barber._id}` : `/profile-edit`}
              className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              <span className="relative group-hover:translate-x-1 transition-transform duration-300">
                {user.role === 'admin' ? 'Editar Barbero' : 'Editar Perfil'}
              </span>
            </Link>
          </div>
        )}

        <div className={`grid grid-cols-1 ${user?.role === 'admin' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-8`}>
          {/* Columna izquierda - Información personal */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-8 border border-gray-700/50 backdrop-blur-sm transform transition-all duration-300 hover:shadow-blue-500/10">
              <div className="flex flex-col items-center">
                <div className="relative group mb-6">
                  {barber.photo?.url || barber.user?.photo?.url ? (
                    <img 
                      src={barber.photo?.url || barber.user?.photo?.url}
                      alt={barber.user?.name} 
                      className="w-36 h-36 rounded-full object-cover border-4 border-blue-500/50 shadow-xl transition-transform duration-300 group-hover:scale-105 group-hover:border-blue-400"
                    />
                  ) : (
                    <div className="w-36 h-36 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-gray-400 border-4 border-blue-500/50 shadow-xl transition-all duration-300 group-hover:scale-105 group-hover:border-blue-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent mb-3">{barber.user?.name}</h2>
                <div className="flex items-center mb-6 bg-blue-500/10 px-4 py-2 rounded-full">
                  <span className="text-yellow-400 text-xl mr-2">★</span>
                  <span className="text-white font-bold">
                    {typeof barber.rating === 'number' ? barber.rating.toFixed(2) : 'Sin calificación'}
                  </span>
                </div>

                <div className="w-full space-y-6">
                  <div className="group transition-all duration-300 hover:transform hover:translate-x-2">
                    <h3 className="text-blue-400 font-semibold mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Especialidad
                    </h3>
                    <p className="text-white bg-gray-800/50 rounded-xl p-4 shadow-inner transition-all duration-300 group-hover:bg-gray-800/70">
                      {barber.specialty || 'No especificada'}
                    </p>
                  </div>
                  <div className="group transition-all duration-300 hover:transform hover:translate-x-2">
                    <h3 className="text-blue-400 font-semibold mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Experiencia
                    </h3>
                    <p className="text-white bg-gray-800/50 rounded-xl p-4 shadow-inner transition-all duration-300 group-hover:bg-gray-800/70">
                      {barber.experience ? `${barber.experience} años` : 'No especificada'}
                    </p>
                  </div>
                  <div className="group transition-all duration-300 hover:transform hover:translate-x-2">
                    <h3 className="text-blue-400 font-semibold mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Descripción
                    </h3>
                    <p className="text-white bg-gray-800/50 rounded-xl p-4 shadow-inner transition-all duration-300 group-hover:bg-gray-800/70">
                      {barber.description || 'Sin descripción'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna central - Servicios y Reservas */}
          <div className="lg:col-span-1">
            {/* Sección de Servicios */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-8 border border-gray-700/50 backdrop-blur-sm mb-8">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent mb-6 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Servicios Disponibles
              </h3>
              <div className="space-y-3">
                {barber.services?.length > 0 ? (
                  barber.services.map((service, idx) => (
                    <div key={idx} className="group bg-gray-800/50 p-4 rounded-xl text-white flex justify-between items-center transform transition-all duration-300 hover:bg-gray-800/70 hover:translate-x-2">
                      <span className="font-medium">{service.name}</span>
                      <span className="text-blue-400 font-bold bg-blue-500/10 px-3 py-1 rounded-full group-hover:scale-110 transition-transform duration-300">
                        ${service.price}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-8 bg-gray-800/30 rounded-xl">No hay servicios disponibles</p>
                )}
              </div>
            </div>

            {/* Botón de reserva para usuarios */}
            {user && user.role === 'user' && (
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-8 border border-gray-700/50 backdrop-blur-sm mb-8">
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent mb-2">¿Listo para tu corte?</h3>
                  <p className="text-gray-400">Reserva tu cita ahora y luce un nuevo estilo</p>
                </div>
                <Link
                  to={`/appointment?barberId=${barber._id}`}
                  className="group w-full inline-flex items-center justify-center px-6 py-4 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl hover:from-green-500 hover:to-green-600 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 group-hover:animate-bounce" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-lg font-medium">Reservar Cita Ahora</span>
                </Link>
              </div>
            )}
          </div>

          {/* Nueva columna - Horario */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-8 border border-gray-700/50 backdrop-blur-sm">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent mb-6 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Horario de Atención
              </h3>
              {barber.schedule && (
                <div className="space-y-3">
                  {Object.entries(barber.schedule).map(([day, info]) => (
                    <div key={day} className={`group p-4 rounded-xl transition-all duration-300 transform hover:translate-x-2 ${
                      info.available ? 'bg-gray-800/50 hover:bg-gray-800/70' : 'bg-gray-900/30'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className={`font-medium capitalize ${info.available ? 'text-blue-400' : 'text-gray-500'}`}>
                          {day}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          info.available
                            ? 'text-white bg-blue-500/10 group-hover:scale-110 transition-transform duration-300'
                            : 'text-gray-500 bg-gray-800/30'
                        }`}>
                          {info.available ? `${info.start} - ${info.end}` : 'No disponible'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha - Acciones y estadísticas (solo para admin) */}
          {user?.role === 'admin' && (
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl p-8 border border-gray-700/50 backdrop-blur-sm">
                {stats && (
                <>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent mb-6 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Estadísticas
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-5 rounded-xl transform transition-all duration-300 hover:translate-y-[-4px] hover:shadow-xl hover:shadow-blue-500/10">
                      <div className="text-blue-400 text-sm mb-1 group-hover:text-blue-300 transition-colors duration-300">Citas totales</div>
                      <div className="text-3xl font-bold text-white group-hover:scale-110 transition-transform duration-300 origin-left">
                        {stats.totalAppointments || 0}
                      </div>
                    </div>
                    <div className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-5 rounded-xl transform transition-all duration-300 hover:translate-y-[-4px] hover:shadow-xl hover:shadow-blue-500/10">
                      <div className="text-blue-400 text-sm mb-1 group-hover:text-blue-300 transition-colors duration-300">Este mes</div>
                      <div className="text-3xl font-bold text-white group-hover:scale-110 transition-transform duration-300 origin-left">
                        {stats.thisMonth || 0}
                      </div>
                    </div>
                    <div className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-5 rounded-xl transform transition-all duration-300 hover:translate-y-[-4px] hover:shadow-xl hover:shadow-blue-500/10">
                      <div className="text-blue-400 text-sm mb-1 group-hover:text-blue-300 transition-colors duration-300">Esta semana</div>
                      <div className="text-3xl font-bold text-white group-hover:scale-110 transition-transform duration-300 origin-left">
                        {stats.thisWeek || 0}
                      </div>
                    </div>
                    <div className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-5 rounded-xl transform transition-all duration-300 hover:translate-y-[-4px] hover:shadow-xl hover:shadow-green-500/10">
                      <div className="text-blue-400 text-sm mb-1 group-hover:text-blue-300 transition-colors duration-300">Ingresos totales</div>
                      <div className="text-3xl font-bold text-green-400 group-hover:scale-110 transition-transform duration-300 origin-left">
                        ${stats.totalRevenue || 0}
                      </div>
                    </div>
                  </div>

                  {stats.appointmentsByService && stats.appointmentsByService.length > 0 && (
                    <div>
                      <h4 className="text-xl font-semibold text-blue-400 mb-4">Servicios más solicitados</h4>
                      <div className="space-y-3">
                        {stats.appointmentsByService.map((s, idx) => (
                          <div key={idx} className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-4 rounded-xl transform transition-all duration-300 hover:translate-x-2">
                            <div className="flex justify-between items-center">
                              <span className="text-white group-hover:text-blue-300 transition-colors duration-300">{s.service}</span>
                              <span className="text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full text-sm group-hover:scale-110 transition-transform duration-300">
                                {s.count} citas
                              </span>
                            </div>
                            <div className="text-right text-green-400 text-sm mt-2 font-medium group-hover:scale-110 transition-transform duration-300 origin-right">
                              ${s.revenue}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}