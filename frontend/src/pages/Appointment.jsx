import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@components/layout/PageContainer';
import { useAuth } from '@contexts/AuthContext';
import { appointmentService } from '../services/api';
import { toast } from 'react-toastify';

function AppointmentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancelId, setCancelId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');

  // Cargar citas
  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await appointmentService.getAppointments();
      setAppointments(data.data);

      // Cargar estadísticas si es barbero o admin
      if (user.role === 'barber' || user.role === 'admin') {
        const statsData = await appointmentService.getAppointmentStats();
        setStats(statsData.data);
      }
    } catch (err) {
      toast.error('Error al cargar las citas');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user.role]);

  // Cargar citas al montar
  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Filtrar citas
  const filteredAppointments = useMemo(() => {
    if (!appointments.length) return [];
    const now = new Date();
    return appointments.filter(app => {
      const appDate = new Date(app.date);
      return activeTab === 'upcoming' 
        ? (appDate >= now && ['pending', 'confirmed'].includes(app.status))
        : (appDate < now || ['completed', 'cancelled', 'no_show'].includes(app.status));
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [appointments, activeTab]);

  // Manejadores de acciones
  const handleCancel = async (appointmentId) => {
    try {
      setSubmitting(true);
      await appointmentService.cancelAppointment(appointmentId, cancelReason);
      toast.success('Cita cancelada exitosamente');
      setCancelId(null);
      setCancelReason('');
      loadAppointments();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (appointmentId) => {
    try {
      setSubmitting(true);
      await appointmentService.completeAppointment(appointmentId);
      toast.success('Cita marcada como completada');
      loadAppointments();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNoShow = async (appointmentId) => {
    try {
      setSubmitting(true);
      await appointmentService.markNoShow(appointmentId);
      toast.success('Cita marcada como no show');
      loadAppointments();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white py-4 sm:py-8">
      <div className="container mx-auto px-3 sm:px-4 max-w-6xl">
        <div id="appointments-list" className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
            <h3 className="text-xl sm:text-2xl font-semibold text-blue-400">Historial de Reservas</h3>
            <div className="w-full sm:w-auto bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-1">
              <div className="grid grid-cols-2 sm:flex">
                <button
                  onClick={() => setActiveTab('upcoming')}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'upcoming'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Próximas
                </button>
                <button
                  onClick={() => setActiveTab('past')}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'past'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Historial
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Statistics for barbers and admins */}
            {(user.role === 'barber' || user.role === 'admin') && stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-800/50 rounded-xl p-4 border border-green-700">
                  <h4 className="text-green-400 text-sm font-medium mb-1">Completadas</h4>
                  <p className="text-2xl font-bold text-white">{stats.byStatus?.completed?.count || 0}</p>
                  <p className="text-sm text-green-300">${stats.byStatus?.completed?.revenue || 0}</p>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 border border-yellow-700">
                  <h4 className="text-yellow-400 text-sm font-medium mb-1">Pendientes</h4>
                  <p className="text-2xl font-bold text-white">{stats.byStatus?.pending?.count || 0}</p>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 border border-red-700">
                  <h4 className="text-red-400 text-sm font-medium mb-1">Canceladas</h4>
                  <p className="text-2xl font-bold text-white">{stats.byStatus?.cancelled?.count || 0}</p>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                  <h4 className="text-gray-400 text-sm font-medium mb-1">No Show</h4>
                  <p className="text-2xl font-bold text-white">{stats.byStatus?.no_show?.count || 0}</p>
                </div>
              </div>
            )}

            {loading ? (
              <div className="bg-gray-800/50 rounded-xl p-8 sm:p-12 border border-gray-700">
                <div className="flex flex-col items-center justify-center">
                  <div className="relative w-12 sm:w-16 h-12 sm:h-16">
                    <div className="absolute inset-0">
                      <div className="w-full h-full border-4 border-blue-500/20 rounded-full"></div>
                      <div className="w-full h-full border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                  </div>
                  <p className="mt-4 text-base sm:text-lg text-blue-400">Cargando tus reservas...</p>
                </div>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="bg-gray-800/50 rounded-xl p-8 sm:p-12 border border-gray-700">
                <div className="text-center">
                  <div className="bg-gray-700/50 w-12 sm:w-16 h-12 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 sm:w-8 h-6 sm:h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-400 mb-2">
                    {activeTab === 'upcoming' ? 'No tienes citas próximas' : 'No hay historial de citas'}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-500">
                    {activeTab === 'upcoming' 
                      ? 'Agenda una nueva cita con nuestros barberos profesionales'
                      : 'Tus citas completadas y canceladas aparecerán aquí'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-6">
                {filteredAppointments.map(app => {
                  const appointmentDate = new Date(app.date);
                  const isToday = new Date().toDateString() === appointmentDate.toDateString();
                  const isPast = appointmentDate < new Date();

                  return (
                    <div 
                      key={app._id} 
                      className={`bg-gray-800/50 rounded-xl border ${
                        app.status === 'confirmed' && isToday ? 'border-green-500/50' :
                        app.status === 'pending' ? 'border-yellow-500/30' :
                        'border-gray-700'
                      } hover:border-blue-500/50 transition-all duration-300 group`}
                    >
                      <div className="p-4 sm:p-6">
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col sm:flex-row gap-4">
                            {/* Service and date info */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-lg sm:text-xl font-semibold text-blue-400 mb-2 truncate">
                                {app.serviceName}
                              </h4>
                              <div className="space-y-2">
                                <p className="flex items-center text-sm sm:text-base text-gray-300">
                                  <svg className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span>
                                    {isToday ? 'Hoy' : appointmentDate.toLocaleDateString()},
                                    {' '}
                                    <span className="font-semibold">
                                      {appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </span>
                                </p>
                                {app.barberName && (
                                  <p className="flex items-center text-sm sm:text-base text-gray-300">
                                    <svg className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    {app.barberName}
                                  </p>
                                )}
                                {app.notes && (
                                  <p className="flex items-start text-sm sm:text-base text-gray-400">
                                    <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="line-clamp-2">{app.notes}</span>
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Status */}
                            <div className="flex flex-col items-start sm:items-end gap-4">
                              <span className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm font-medium ${
                                app.status === 'pending' ? 'bg-yellow-900/50 text-yellow-200 border border-yellow-700' :
                                app.status === 'confirmed' ? 'bg-green-900/50 text-green-200 border border-green-700' :
                                app.status === 'cancelled' ? 'bg-red-900/50 text-red-200 border border-red-700' :
                                app.status === 'completed' ? 'bg-blue-900/50 text-blue-200 border border-blue-700' :
                                'bg-gray-900/50 text-gray-200 border border-gray-700'
                              }`}>
                                {app.status === 'pending' ? 'Pendiente' :
                                 app.status === 'confirmed' ? 'Confirmada' :
                                 app.status === 'cancelled' ? 'Cancelada' :
                                 app.status === 'completed' ? 'Completada' :
                                 app.status}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                            {/* Barber actions */}
                            {user?.role === 'barber' && !isPast && (app.status === 'pending' || app.status === 'confirmed') && (
                              <>
                                <button 
                                  onClick={() => handleComplete(app._id)}
                                  disabled={submitting}
                                  className="inline-flex items-center px-3 py-1.5 text-sm bg-green-600/20 text-green-400 rounded-lg border border-green-600/30 hover:bg-green-600/30 transition-colors group-hover:border-green-500 disabled:opacity-50"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                      d="M5 13l4 4L19 7" />
                                  </svg>
                                  Completar
                                </button>
                                <button 
                                  onClick={() => handleNoShow(app._id)}
                                  disabled={submitting}
                                  className="inline-flex items-center px-3 py-1.5 text-sm bg-yellow-600/20 text-yellow-400 rounded-lg border border-yellow-600/30 hover:bg-yellow-600/30 transition-colors group-hover:border-yellow-500 disabled:opacity-50"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  No Show
                                </button>
                                <button 
                                  onClick={() => setCancelId(app._id)}
                                  disabled={submitting}
                                  className="inline-flex items-center px-3 py-1.5 text-sm bg-red-600/20 text-red-400 rounded-lg border border-red-600/30 hover:bg-red-600/30 transition-colors group-hover:border-red-500 disabled:opacity-50"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                      d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  Cancelar
                                </button>
                              </>
                            )}

                            {/* Admin actions */}
                            {user?.role === 'admin' && (
                              <>
                                <button 
                                  onClick={() => navigate(`/appointment/edit/${app._id}`)}
                                  className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600/20 text-blue-400 rounded-lg border border-blue-600/30 hover:bg-blue-600/30 transition-colors group-hover:border-blue-500"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Editar
                                </button>
                              </>
                            )}
                            
                            {/* User cancel action */}
                            {user?.role === 'user' && !isPast && (app.status === 'pending' || app.status === 'confirmed') && (
                              <button 
                                onClick={() => setCancelId(app._id)}
                                disabled={submitting}
                                className="inline-flex items-center px-3 py-1.5 text-sm bg-red-600/20 text-red-400 rounded-lg border border-red-600/30 hover:bg-red-600/30 transition-colors group-hover:border-red-500 disabled:opacity-50"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                    d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Cancelar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Cancellation Modal */}
        {cancelId && (
          <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
              onClick={() => {setCancelId(null); setCancelReason('');}}
            />
            
            {/* Modal */}
            <div className="absolute inset-0 overflow-y-auto">
              <div className="flex min-h-full items-end sm:items-center justify-center p-4">
                <div className="relative bg-gray-800 border border-gray-700 rounded-xl shadow-xl w-full max-w-lg transform transition-all animate-modal">
                  {/* Header */}
                  <div className="border-b border-gray-700 px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="mr-3 flex-shrink-0">
                          <div className="flex h-10 sm:h-12 w-10 sm:w-12 items-center justify-center rounded-full bg-red-900/50 border border-red-700">
                            <svg className="h-5 sm:h-6 w-5 sm:w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold text-blue-400">Cancelar Reserva</h3>
                          <p className="mt-1 text-xs sm:text-sm text-gray-400">Esta acción no se puede deshacer</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {setCancelId(null); setCancelReason('');}}
                        className="rounded-lg p-1 text-gray-400 hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-4 sm:px-6 py-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Motivo de la cancelación
                    </label>
                    <textarea 
                      className="w-full bg-gray-700/50 text-white border border-gray-600 rounded-xl px-3 sm:px-4 py-2 sm:py-3 focus:outline-none focus:border-blue-500 min-h-[100px] sm:min-h-[120px] resize-none text-sm sm:text-base"
                      value={cancelReason} 
                      onChange={(e) => setCancelReason(e.target.value)} 
                      placeholder="Por favor, indícanos el motivo por el cual deseas cancelar esta cita..."
                    />
                    {!cancelReason.trim() && (
                      <p className="mt-2 text-xs sm:text-sm text-red-400">
                        El motivo de cancelación es requerido
                      </p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="border-t border-gray-700 px-4 sm:px-6 py-4">
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                      <button 
                        className="w-full sm:w-auto px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500/50 text-sm sm:text-base"
                        onClick={() => {setCancelId(null); setCancelReason('');}}
                      >
                        Volver
                      </button>
                      <button 
                        className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm sm:text-base"
                        onClick={handleCancelWithReason}
                        disabled={!cancelReason.trim()}
                      >
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Confirmar Cancelación
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <style>{`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fade-in 0.3s ease-out;
          }

          @keyframes fade-in-right {
            from { opacity: 0; transform: translateX(20px); }
            to { opacity: 1; transform: translateX(0); }
          }
          .animate-fade-in-right {
            animation: fade-in-right 0.3s ease-out;
          }

          @keyframes modal {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-modal {
            animation: modal 0.2s ease-out;
          }

          input[type="datetime-local"]::-webkit-calendar-picker-indicator {
            filter: invert(1);
          }

          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          ::-webkit-scrollbar-track {
            background: rgba(31, 41, 55, 0.5);
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb {
            background: rgba(59, 130, 246, 0.5);
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(59, 130, 246, 0.7);
          }
        `}</style>
      </div>
    </PageContainer>
  );
}

export default AppointmentPage;
