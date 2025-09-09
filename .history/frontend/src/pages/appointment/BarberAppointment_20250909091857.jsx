import React, { useState, useEffect } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { useAuth } from '../../contexts/AuthContext';
import { api, barberService, appointmentService } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { constructFrom, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, User, Scissors, CheckCircle, XCircle, AlertTriangle, Eye, Trash2, Check, X } from 'lucide-react';

const BarberAppointment = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('pending');
  const [barberProfile, setBarberProfile] = useState(null);
  const [barberId, setBarberId] = useState(null);
  const [processingAppointments, setProcessingAppointments] = useState(new Set());
  
  // Estados para cancelación con motivo
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelAppointmentId, setCancelAppointmentId] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    if (user && user.role === 'barber') {
      fetchBarberProfile();
    }
  }, [user]);

  const fetchBarberProfile = async () => {
    try {
      const data = await barberService.getBarberProfile();
      if (data.success) {
        setBarberProfile(data.data);
        setBarberId(data.data._id);
        fetchBarberAppointments(data.data._id);
      }
    } catch (error) {
      console.error('Error fetching barber profile:', error);
    }
  };

  const fetchBarberAppointments = async (barberId) => {
    try {
      setLoading(true);
      const data = await api.get(`/appointments/barber/${barberId}`);
      if (data.success) {
        setAppointments(data.data);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      showError('Error al cargar las citas');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    if (processingAppointments.has(appointmentId)) return;

    if (newStatus === 'cancelled') {
      handleOpenCancelModal(appointmentId);
      return;
    }

    // Confirmación adicional para completar citas
    if (newStatus === 'completed') {
      const appointment = appointments.find(app => app._id === appointmentId);
      const clientName = appointment?.client?.name || 'Cliente';
      const serviceName = appointment?.service?.name || 'Servicio';
      
      const confirmed = window.confirm(
        `¿Confirmas que has completado el servicio "${serviceName}" para ${clientName}?\n\n` +
        `Esta acción marcará la cita como finalizada y no se podrá revertir.`
      );
      
      if (!confirmed) return;
    }

    try {
      setProcessingAppointments(prev => new Set(prev).add(appointmentId));
      
      console.log(`🔄 Changing appointment ${appointmentId} status to ${newStatus}`);
      
      let response;
      switch (newStatus) {
        case 'confirmed':
          response = await appointmentService.approveAppointment(appointmentId);
          break;
        case 'completed':
          response = await appointmentService.completeAppointment(appointmentId);
          break;
        case 'no-show':
          response = await appointmentService.markNoShow(appointmentId);
          break;
        default:
          throw new Error(`Estado no válido: ${newStatus}`);
      }
      
      if (response.success) {
        const messages = {
          confirmed: 'Cita confirmada exitosamente',
          completed: 'Cita completada exitosamente',
          'no-show': 'Cita marcada como no presentado'
        };
        showSuccess(messages[newStatus] || 'Cita actualizada exitosamente');
        fetchBarberAppointments(barberId);
      }
    } catch (error) {
      console.error('Error:', error);
      showError(error.message || 'Error al actualizar la cita');
    } finally {
      setProcessingAppointments(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este reporte de cita?')) {
      return;
    }

    try {
      const data = await appointmentService.deleteAppointment(appointmentId);
      if (data.success) {
        showSuccess('Reporte de cita eliminado exitosamente');
        fetchBarberAppointments(barberId);
      }
    } catch (error) {
      console.error('Error:', error);
      showError(error.message || 'Error al eliminar el reporte de cita');
    }
  };

  const handleOpenCancelModal = (appointmentId) => {
    setCancelAppointmentId(appointmentId);
    setCancellationReason('');
    setShowCancelModal(true);
  };

  const handleCloseCancelModal = () => {
    setShowCancelModal(false);
    setCancelAppointmentId(null);
    setCancellationReason('');
  };

  const handleSubmitCancellation = async () => {
    if (!cancellationReason || cancellationReason.trim().length === 0) {
      showError('Debe proporcionar un motivo para cancelar la cita');
      return;
    }

    if (cancellationReason.split(' ').length > 100) {
      showError('El motivo no puede exceder las 100 palabras');
      return;
    }

    try {
      const data = await api.put(`/appointments/${cancelAppointmentId}/cancel`, {
        reason: cancellationReason.trim()
      });
      
      if (data.success) {
        showSuccess('Cita cancelada exitosamente. El cliente ha sido notificado.');
        handleCloseCancelModal();
        fetchBarberAppointments(barberId);
      }
    } catch (error) {
      console.error('Error:', error);
      showError(error.message || 'Error al cancelar la cita');
    }
  };

  const handleViewCancellationReason = (appointmentId) => {
    const appointment = appointments.find(apt => apt._id === appointmentId);
    if (appointment && appointment.cancellationReason) {
      alert(`Motivo de cancelación: ${appointment.cancellationReason}`);
    }
  };

  // Componente para tarjeta de cita compacta
  const AppointmentCard = ({ appointment }) => (
    <div className={`bg-gray-800/40 rounded-lg p-4 border transition-all duration-200 relative ${
      appointment.status === 'completed' ? 'border-blue-500/60 bg-blue-500/5' :
      appointment.status === 'confirmed' ? 'border-green-500/40' :
      appointment.status === 'pending' ? 'border-yellow-500/40' :
      appointment.status === 'cancelled' ? 'border-red-500/40 opacity-75' :
      'border-blue-600/40'
    }`}>
      {/* Indicador especial para citas completadas */}
      {appointment.status === 'completed' && (
        <div className="absolute top-2 right-2">
          <div className="flex items-center gap-1 bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs border border-blue-500/30">
            <CheckCircle className="w-3 h-3" />
            <span>Completada</span>
          </div>
        </div>
      )}
      appointment.status === 'cancelled' ? 'border-red-500/40' :
      'border-blue-600/40'
    }`}>
      <div className="flex flex-col gap-3">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold flex items-center gap-1">
              <Scissors className="w-3 h-3 text-purple-400" />
              <span className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                {appointment.service?.name || 'Servicio no especificado'}
              </span>
            </h3>
            <StatusBadge status={appointment.status} />
          </div>
          
          <div className="grid grid-cols-1 gap-1 text-xs">
            <div className="flex items-center gap-2">
              <User className="w-3 h-3 text-amber-400" />
              <span className="text-gray-400">Cliente:</span>
              <span className="bg-gradient-to-r from-amber-300 to-amber-100 bg-clip-text text-transparent font-medium">
                {appointment.user?.name || 'Usuario no disponible'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3 text-blue-400" />
              <span className="text-gray-400">Fecha:</span>
              <span className="bg-gradient-to-r from-blue-300 to-blue-100 bg-clip-text text-transparent font-medium">
                {format(new Date(appointment.date), "EEEE d 'de' MMM", { locale: es })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-green-400" />
              <span className="text-gray-400">Hora:</span>
              <span className="bg-gradient-to-r from-green-300 to-green-100 bg-clip-text text-transparent font-medium">
                {format(new Date(appointment.date), "HH:mm")}
              </span>
            </div>
          </div>
        </div>
        
        {/* Botones de acción */}
        <div className="flex gap-1 justify-end">
          {appointment.status === 'pending' && (
            <>
              <button
                onClick={() => handleStatusChange(appointment._id, 'confirmed')}
                disabled={processingAppointments.has(appointment._id)}
                className={`p-1.5 rounded text-xs transition-all duration-200 flex items-center gap-1 ${
                  processingAppointments.has(appointment._id)
                    ? 'bg-gray-600/20 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-500/50'
                }`}
                title="Confirmar cita"
              >
                {processingAppointments.has(appointment._id) ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                ) : (
                  <Check className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={() => handleOpenCancelModal(appointment._id)}
                disabled={processingAppointments.has(appointment._id)}
                className={`p-1.5 rounded text-xs transition-all duration-200 flex items-center gap-1 ${
                  processingAppointments.has(appointment._id)
                    ? 'bg-gray-600/20 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/50'
                }`}
                title="Cancelar cita"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          )}
          {appointment.status === 'confirmed' && (
            <>
              <button
                onClick={() => handleStatusChange(appointment._id, 'completed')}
                disabled={processingAppointments.has(appointment._id)}
                className={`p-1.5 rounded text-xs transition-all duration-200 flex items-center gap-1 ${
                  processingAppointments.has(appointment._id)
                    ? 'bg-gray-600/20 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/50'
                }`}
                title="Completar cita"
              >
                {processingAppointments.has(appointment._id) ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                ) : (
                  <CheckCircle className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={() => handleOpenCancelModal(appointment._id)}
                disabled={processingAppointments.has(appointment._id)}
                className={`p-1.5 rounded text-xs transition-all duration-200 flex items-center gap-1 ${
                  processingAppointments.has(appointment._id)
                    ? 'bg-gray-600/20 text-gray-500 cursor-not-allowed'
                    : 'bg-orange-600/20 text-orange-400 hover:bg-orange-600/30 border border-orange-500/50'
                }`}
                title="Cancelar cita"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          )}
          {appointment.status === 'cancelled' && (
            <button
              onClick={() => handleDeleteAppointment(appointment._id)}
              className="p-1.5 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-all duration-200 border border-red-500/50"
              title="Cancelar con motivo"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          {appointment.status === 'cancelled' && appointment.cancellationReason && appointment.cancelledBy !== 'barber' && (
            <button
              onClick={() => handleViewCancellationReason(appointment._id)}
              className="p-1.5 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/30 transition-all duration-200 border border-blue-500/50"
              title="Ver motivo de cancelación"
            >
              <Eye className="w-3 h-3" />
            </button>
          )}
          {(appointment.status === 'completed' || appointment.status === 'cancelled') && (
            <button
              onClick={() => handleDeleteAppointment(appointment._id)}
              className="p-1.5 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-all duration-200 border border-red-500/50"
              title="Eliminar reporte"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const StatusBadge = ({ status }) => {
    const statusStyles = {
      pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-500/50',
      confirmed: 'bg-green-900/30 text-green-400 border-green-500/50',
      cancelled: 'bg-red-900/30 text-red-400 border-red-500/50',
      completed: 'bg-blue-900/30 text-blue-400 border-blue-500/50'
    };

    const statusText = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      cancelled: 'Cancelada',
      completed: 'Completada'
    };

    return (
      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${statusStyles[status]}`}>
        {statusText[status]}
      </span>
    );
  };

  const TabButton = ({ status, count }) => (
    <button
      onClick={() => setSelectedTab(status)}
      className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between ${
        selectedTab === status
          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
          : 'text-gray-400 hover:text-white hover:bg-gray-700/50 border border-gray-700/50'
      }`}
    >
      <span>
        {status === 'pending' ? 'Pendientes' : 
         status === 'confirmed' ? 'Confirmadas' : 
         status === 'cancelled' ? 'Canceladas' : 
         'Completadas'}
      </span>
      {count > 0 && (
        <span className={`px-2 py-0.5 rounded-full text-xs ${
          selectedTab === status ? 'bg-white/20' : 'bg-gray-700'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  const filteredAppointments = appointments.filter(app => app.status === selectedTab);
  const counts = {
    pending: appointments.filter(app => app.status === 'pending').length,
    confirmed: appointments.filter(app => app.status === 'confirmed').length,
    completed: appointments.filter(app => app.status === 'completed').length,
    cancelled: appointments.filter(app => app.status === 'cancelled').length
  };

  return (
    <PageContainer>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          
          {/* Título Principal */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent flex items-center justify-center gap-2">
              <Calendar className="w-6 h-6 text-blue-400" />
              Gestión de Citas
            </h1>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            /* Grid de 2 columnas */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Columna Izquierda - Tabs y Estadísticas */}
              <div className="bg-gray-800/20 backdrop-blur-xl rounded-xl p-6 border border-white/10 shadow-xl">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                    <CheckCircle className="w-5 h-5 text-purple-400" />
                  </div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                    Estados de Citas
                  </h2>
                </div>
                
                {/* Tabs Compactos */}
                <div className="space-y-3">
                  <TabButton status="pending" count={counts.pending} />
                  <TabButton status="confirmed" count={counts.confirmed} />
                  <TabButton status="completed" count={counts.completed} />
                  <TabButton status="cancelled" count={counts.cancelled} />
                </div>
                
                {/* Estadísticas Rápidas */}
                <div className="mt-6 p-4 bg-gray-800/30 rounded-lg border border-gray-700/30">
                  <h3 className="text-sm font-semibold mb-3 bg-gradient-to-r from-gray-200 to-gray-400 bg-clip-text text-transparent">
                    Resumen del Día
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="text-center">
                      <div className="text-yellow-400 font-bold text-lg">{counts.pending}</div>
                      <div className="text-gray-400">Pendientes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-green-400 font-bold text-lg">{counts.confirmed}</div>
                      <div className="text-gray-400">Confirmadas</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Columna Derecha - Lista de Citas */}
              <div className="bg-gray-800/20 backdrop-blur-xl rounded-xl p-6 border border-white/10 shadow-xl">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-green-500/20">
                    <Scissors className="w-5 h-5 text-blue-400" />
                  </div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                    {selectedTab === 'pending' ? 'Citas Pendientes' : 
                     selectedTab === 'confirmed' ? 'Citas Confirmadas' : 
                     selectedTab === 'completed' ? 'Citas Completadas' : 
                     'Citas Canceladas'}
                  </h2>
                </div>
                
                {/* Lista de Citas Compacta */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredAppointments.length === 0 ? (
                    <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700/30 text-center">
                      <div className="inline-block p-3 bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-full mb-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="text-gray-400 text-sm">
                        No hay citas {
                          selectedTab === 'pending' ? 'pendientes' : 
                          selectedTab === 'confirmed' ? 'confirmadas' : 
                          selectedTab === 'completed' ? 'completadas' : 
                          'canceladas'
                        }
                      </p>
                    </div>
                  ) : (
                    filteredAppointments.map(appointment => (
                      <AppointmentCard key={appointment._id} appointment={appointment} />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cancel with Reason Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-xl p-4 max-w-md w-full mx-4 border border-gray-700">
              <h3 className="text-lg font-semibold mb-3 bg-gradient-to-r from-white to-red-200 bg-clip-text text-transparent">
                Cancelar Cita
              </h3>
              <p className="text-gray-400 mb-3 text-sm">
                Como barbero, debe proporcionar un motivo para cancelar la cita. El cliente será notificado.
              </p>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Escriba el motivo de la cancelación (máximo 100 palabras)..."
                className="w-full h-24 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:border-red-500 text-sm"
                maxLength={500}
              />
              <div className="text-right text-xs text-gray-400 mb-3">
                {cancellationReason.split(' ').filter(word => word.length > 0).length}/100 palabras
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCloseCancelModal}
                  className="px-3 py-1.5 text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitCancellation}
                  disabled={!cancellationReason.trim()}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed text-sm"
                >
                  Confirmar Cancelación
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default BarberAppointment;
