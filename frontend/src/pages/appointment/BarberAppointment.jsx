import React, { useState, useEffect } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import GradientText from '../../components/ui/GradientText';
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
  
  // Estados para modal de información
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  
  // Estados para modal de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAppointmentId, setDeleteAppointmentId] = useState(null);
  
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  // Bloquear scroll cuando hay modales abiertos
  useEffect(() => {
    if (showCancelModal || showInfoModal || showDeleteModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showCancelModal, showInfoModal, showDeleteModal]);

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
        showSuccess(`Cita ${newStatus === 'confirmed' ? 'confirmada' : 'actualizada'} exitosamente`);
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
    try {
      const data = await appointmentService.deleteAppointment(appointmentId);
      if (data.success) {
        showSuccess('Reporte de cita eliminado exitosamente');
        fetchBarberAppointments(barberId);
        setShowDeleteModal(false);
        setDeleteAppointmentId(null);
      }
    } catch (error) {
      console.error('Error:', error);
      showError(error.message || 'Error al eliminar el reporte de cita');
    }
  };

  // Funciones para modal de información
  const handleOpenInfoModal = (appointment) => {
    setSelectedAppointment(appointment);
    setShowInfoModal(true);
  };

  const handleCloseInfoModal = () => {
    setShowInfoModal(false);
    setSelectedAppointment(null);
  };

  // Funciones para modal de eliminación
  const handleOpenDeleteModal = (appointmentId) => {
    setDeleteAppointmentId(appointmentId);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteAppointmentId(null);
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

  // Componente para tarjeta de cita compacta
  const AppointmentCard = ({ appointment }) => (
    <div className={`group relative backdrop-blur-sm border rounded-lg p-4 transition-all duration-300 overflow-hidden hover:scale-[1.002] hover:-translate-y-0.5 cursor-pointer mx-1 my-2 ${
      appointment.status === 'confirmed' ? 'border-green-500/30 bg-green-500/5 shadow-sm shadow-green-500/20' :
      appointment.status === 'pending' ? 'border-yellow-500/30 bg-yellow-500/5 shadow-sm shadow-yellow-500/20' :
      appointment.status === 'cancelled' ? 'border-red-500/30 bg-red-500/5 shadow-sm shadow-red-500/20' :
      'border-blue-500/30 bg-blue-500/5 shadow-sm shadow-blue-500/20'
    }`}>
      {/* Efecto de brillo */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-lg"></div>
      
      <div className="relative flex flex-col gap-3">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Scissors className="w-4 h-4 text-purple-400" />
              <span className="text-white">
                {appointment.service?.name || 'Servicio no especificado'}
              </span>
            </h3>
            <StatusBadge status={appointment.status} />
          </div>
          
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-gray-300">Cliente:</span>
              <span className="text-amber-300 font-medium">
                {appointment.user?.name || 'Usuario no disponible'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-gray-300">Fecha:</span>
              <span className="text-blue-300 font-medium">
                {format(new Date(appointment.date), "EEEE d 'de' MMM", { locale: es })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-green-400" />
              <span className="text-gray-300">Hora:</span>
              <span className="text-green-300 font-medium">
                {format(new Date(appointment.date), "HH:mm")}
              </span>
            </div>
          </div>
        </div>
        
        {/* Botones de acción */}
        <div className="flex gap-2 justify-end">
          {/* Botón de información (siempre visible) */}
          <button
            onClick={() => handleOpenInfoModal(appointment)}
            className="p-1.5 bg-blue-500/10 border border-blue-500/30 rounded-md text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 transition-all duration-300 shadow-sm shadow-blue-500/20"
            title="Ver información"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {appointment.status === 'pending' && (
            <>
              <button
                onClick={() => handleStatusChange(appointment._id, 'confirmed')}
                disabled={processingAppointments.has(appointment._id)}
                className={`p-1.5 border rounded-md transition-all duration-300 shadow-sm ${
                  processingAppointments.has(appointment._id)
                    ? 'bg-gray-500/10 border-gray-500/30 text-gray-500 cursor-not-allowed'
                    : 'bg-green-500/10 border-green-500/30 text-green-400 hover:text-green-300 hover:bg-green-500/20 shadow-green-500/20'
                }`}
                title="Confirmar cita"
              >
                {processingAppointments.has(appointment._id) ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={() => handleOpenCancelModal(appointment._id)}
                disabled={processingAppointments.has(appointment._id)}
                className={`p-1.5 border rounded-md transition-all duration-300 shadow-sm ${
                  processingAppointments.has(appointment._id)
                    ? 'bg-gray-500/10 border-gray-500/30 text-gray-500 cursor-not-allowed'
                    : 'bg-red-500/10 border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/20 shadow-red-500/20'
                }`}
                title="Cancelar cita"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {appointment.status === 'confirmed' && (
            <>
              <button
                onClick={() => handleStatusChange(appointment._id, 'completed')}
                disabled={processingAppointments.has(appointment._id)}
                className={`p-1.5 border rounded-md transition-all duration-300 shadow-sm ${
                  processingAppointments.has(appointment._id)
                    ? 'bg-gray-500/10 border-gray-500/30 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 shadow-blue-500/20'
                }`}
                title="Completar cita"
              >
                {processingAppointments.has(appointment._id) ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                ) : (
                  <CheckCircle className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={() => handleOpenCancelModal(appointment._id)}
                className="p-1.5 bg-orange-500/10 border border-orange-500/30 rounded-md text-orange-400 hover:text-orange-300 hover:bg-orange-500/20 transition-all duration-300 shadow-sm shadow-orange-500/20"
                title="Cancelar con motivo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {(appointment.status === 'completed' || appointment.status === 'cancelled') && (
            <button
              onClick={() => handleOpenDeleteModal(appointment._id)}
              className="p-1.5 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all duration-300 shadow-sm shadow-red-500/20"
              title="Eliminar reporte"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const StatusBadge = ({ status }) => {
    const statusStyles = {
      pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
      confirmed: 'bg-green-500/20 text-green-300 border-green-500/40',
      cancelled: 'bg-red-500/20 text-red-300 border-red-500/40',
      completed: 'bg-blue-500/20 text-blue-300 border-blue-500/40'
    };

    const statusText = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      cancelled: 'Cancelada',
      completed: 'Completada'
    };

    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles[status]}`}>
        {statusText[status]}
      </span>
    );
  };

  const TabButton = ({ status, count }) => {
    const getButtonStyles = () => {
      const isSelected = selectedTab === status;
      
      switch (status) {
        case 'pending':
          return isSelected 
            ? 'border-yellow-500/50 bg-yellow-500/10 shadow-xl shadow-yellow-500/20'
            : 'border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-500/50 hover:bg-yellow-500/10';
        case 'confirmed':
          return isSelected 
            ? 'border-green-500/50 bg-green-500/10 shadow-xl shadow-green-500/20'
            : 'border-green-500/30 bg-green-500/5 hover:border-green-500/50 hover:bg-green-500/10';
        case 'completed':
          return isSelected 
            ? 'border-blue-500/50 bg-blue-500/10 shadow-xl shadow-blue-500/20'
            : 'border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50 hover:bg-blue-500/10';
        case 'cancelled':
          return isSelected 
            ? 'border-red-500/50 bg-red-500/10 shadow-xl shadow-red-500/20'
            : 'border-red-500/30 bg-red-500/5 hover:border-red-500/50 hover:bg-red-500/10';
        case 'reports':
          return isSelected 
            ? 'border-purple-500/50 bg-purple-500/10 shadow-xl shadow-purple-500/20'
            : 'border-purple-500/30 bg-purple-500/5 hover:border-purple-500/50 hover:bg-purple-500/10';
        default:
          return isSelected 
            ? 'border-blue-500/50 bg-blue-500/10 shadow-xl shadow-blue-500/20'
            : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10';
      }
    };

    const getTextColor = () => {
      const isSelected = selectedTab === status;
      if (!isSelected) return 'text-white';
      
      switch (status) {
        case 'pending': return 'text-yellow-300';
        case 'confirmed': return 'text-green-300';
        case 'completed': return 'text-blue-300';
        case 'cancelled': return 'text-red-300';
        case 'reports': return 'text-purple-300';
        default: return 'text-blue-300';
      }
    };

    const getBadgeColor = () => {
      const isSelected = selectedTab === status;
      if (!isSelected) return 'bg-white/10 text-gray-300';
      
      switch (status) {
        case 'pending': return 'bg-yellow-500/20 text-yellow-300';
        case 'confirmed': return 'bg-green-500/20 text-green-300';
        case 'completed': return 'bg-blue-500/20 text-blue-300';
        case 'cancelled': return 'bg-red-500/20 text-red-300';
        default: return 'bg-blue-500/20 text-blue-300';
      }
    };

    return (
      <button
        onClick={() => setSelectedTab(status)}
        className={`group relative w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl border cursor-pointer transition-all duration-300 hover:scale-105 overflow-hidden backdrop-blur-sm ${
          status === 'reports' 
            ? 'flex items-center justify-center'
            : 'flex items-center justify-between'
        } ${getButtonStyles()}`}
      >
        <span className={`font-medium text-sm sm:text-base lg:text-lg ${getTextColor()}`}>
          {status === 'pending' ? 'Pendientes' : 
           status === 'confirmed' ? 'Confirmadas' : 
           status === 'cancelled' ? 'Canceladas' : 
           status === 'reports' ? 'Reportes' :
           'Completadas'}
        </span>
        {status !== 'reports' && count > 0 && (
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getBadgeColor()}`}>
            {count}
          </span>
        )}
      </button>
    );
  };

  const filteredAppointments = selectedTab === 'reports' 
    ? appointments.filter(app => app.status === 'completed' || app.status === 'cancelled')
    : appointments.filter(app => app.status === selectedTab);
  const counts = {
    pending: appointments.filter(app => app.status === 'pending').length,
    confirmed: appointments.filter(app => app.status === 'confirmed').length,
    completed: appointments.filter(app => app.status === 'completed').length,
    cancelled: appointments.filter(app => app.status === 'cancelled').length,
    reports: appointments.filter(app => app.status === 'completed' || app.status === 'cancelled').length
  };

  return (
    <PageContainer>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 space-y-8">
        
        {/* Header principal */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/20 shadow-xl shadow-blue-500/20">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-blue-400" />
            </div>
            <GradientText className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold">
              Gestión de Citas
            </GradientText>
          </div>
          <p className="text-gray-300 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed px-2">
            Administra y gestiona todas las citas de tus clientes desde un solo lugar
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
              <p className="text-gray-400 text-sm">Cargando citas...</p>
            </div>
          </div>
        ) : (
          /* Grid de 2 columnas responsivo */
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            
            {/* Columna Izquierda - Tabs y Estadísticas */}
            <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-white/10 shadow-xl shadow-blue-500/20 hover:border-white/40 transition-all duration-300 overflow-hidden">
              {/* Efecto de brillo */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-2xl"></div>
              <div className="relative">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl border border-purple-500/20 shadow-xl shadow-blue-500/20">
                    <CheckCircle className="w-6 h-6 text-purple-400" />
                  </div>
                  <GradientText className="text-xl lg:text-2xl font-bold">
                    Estados de Citas
                  </GradientText>
                </div>
                
                {/* Tabs Compactos */}
                <div className="space-y-3">
                  <TabButton status="pending" count={counts.pending} />
                  <TabButton status="confirmed" count={counts.confirmed} />
                  <TabButton status="completed" count={counts.completed} />
                  <TabButton status="cancelled" count={counts.cancelled} />
                  <TabButton status="reports" count={counts.reports} />
                </div>
              </div>
            </div>
            
            {/* Columna Derecha - Lista de Citas */}
            <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-white/10 shadow-xl shadow-blue-500/20 hover:border-white/40 transition-all duration-300 overflow-hidden">
              {/* Efecto de brillo */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-2xl"></div>
              <div className="relative">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 bg-gradient-to-r from-blue-600/20 to-green-600/20 rounded-xl border border-blue-500/20 shadow-xl shadow-blue-500/20">
                    <Scissors className="w-6 h-6 text-blue-400" />
                  </div>
                  <GradientText className="text-xl lg:text-2xl font-bold">
                    {selectedTab === 'pending' ? 'Citas Pendientes' : 
                     selectedTab === 'confirmed' ? 'Citas Confirmadas' : 
                     selectedTab === 'completed' ? 'Citas Completadas' : 
                     selectedTab === 'cancelled' ? 'Citas Canceladas' :
                     selectedTab === 'reports' ? 'Reportes de Citas' : 
                     'Otras Citas'}
                  </GradientText>
                </div>
                
                {/* Lista de Citas Compacta o Reportes */}
                {selectedTab === 'reports' ? (
                  /* Reportes - Solo 2 divs con totales */
                  <div className="space-y-4">
                    {/* Div de Completadas */}
                    <div className="group relative bg-green-500/5 border border-green-500/30 rounded-xl p-4 backdrop-blur-sm shadow-xl shadow-green-500/20 hover:border-green-500/50 transition-all duration-300 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-xl"></div>
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-500/20 rounded-lg border border-green-500/40">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                          </div>
                          <div>
                            <h3 className="text-base lg:text-lg font-bold text-green-300">Citas Completadas</h3>
                            <p className="text-xs text-green-200/80">Total de servicios finalizados</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl lg:text-3xl font-bold text-green-400">{counts.completed}</div>
                          <div className="text-xs text-green-300/80">servicios</div>
                        </div>
                      </div>
                    </div>

                    {/* Div de Canceladas */}
                    <div className="group relative bg-red-500/5 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm shadow-xl shadow-red-500/20 hover:border-red-500/50 transition-all duration-300 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-xl"></div>
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-500/20 rounded-lg border border-red-500/40">
                            <XCircle className="w-6 h-6 text-red-400" />
                          </div>
                          <div>
                            <h3 className="text-base lg:text-lg font-bold text-red-300">Citas Canceladas</h3>
                            <p className="text-xs text-red-200/80">Total de citas no realizadas</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl lg:text-3xl font-bold text-red-400">{counts.cancelled}</div>
                          <div className="text-xs text-red-300/80">canceladas</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Lista normal de citas */
                  <div className="space-y-1 max-h-96 overflow-y-auto custom-scrollbar pr-2 pt-2">
                    {filteredAppointments.length === 0 ? (
                      <div className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center backdrop-blur-sm shadow-xl shadow-blue-500/20">
                        <div className="inline-block p-4 bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-2xl mb-4">
                          <Calendar className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                          No hay citas {
                            selectedTab === 'pending' ? 'pendientes' : 
                            selectedTab === 'confirmed' ? 'confirmadas' : 
                            selectedTab === 'completed' ? 'completadas' : 
                            selectedTab === 'cancelled' ? 'canceladas' :
                            selectedTab === 'reports' ? 'en reportes' : 
                            'disponibles'
                          }
                        </h3>
                        <p className="text-sm text-gray-400">
                          Las citas aparecerán aquí cuando estén disponibles
                        </p>
                      </div>
                    ) : (
                      filteredAppointments.map((appointment, index) => (
                        <div 
                          key={appointment._id} 
                          style={{ zIndex: filteredAppointments.length - index }}
                        >
                          <AppointmentCard appointment={appointment} />
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cancel with Reason Modal */}
        {showCancelModal && (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 sm:p-6 lg:p-8"
            style={{ overflow: 'hidden' }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCloseCancelModal();
              }
            }}
          >
            <div className="relative w-full max-w-sm sm:max-w-md mx-auto h-[70vh] sm:h-[65vh] lg:h-[60vh] flex flex-col">
              <div className="relative bg-red-500/5 backdrop-blur-md border border-red-500/20 rounded-2xl shadow-2xl shadow-red-500/20 h-full flex flex-col overflow-hidden">
                <div className="relative z-10 flex-shrink-0 p-4 sm:p-6">
                  {/* Header del modal */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-red-500/20">
                        <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-white">Cancelar Cita</h3>
                    </div>
                    <button
                      onClick={handleCloseCancelModal}
                      className="p-1 text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>

                {/* Contenido scrolleable */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-4 sm:px-6 pb-4 sm:pb-6" style={{ minHeight: 0 }}>
                  <div className="space-y-3 sm:space-y-4">
                    {/* Descripción */}
                    <div className="p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                        Como barbero, debe proporcionar un motivo para cancelar la cita. El cliente será notificado.
                      </p>
                    </div>
                    
                    {/* Textarea */}
                    <div className="relative">
                      <textarea
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        placeholder="Escriba el motivo de la cancelación (máximo 100 palabras)..."
                        className="glassmorphism-textarea h-24 sm:h-28 text-xs sm:text-sm"
                        maxLength={500}
                      />
                    </div>
                    
                    <div className="text-right text-xs text-white/60">
                      {cancellationReason.split(' ').filter(word => word.length > 0).length}/100 palabras
                    </div>
                    
                    <div className="flex justify-end gap-2 sm:gap-3 pt-2 sm:pt-4">
                      <button
                        onClick={handleCloseCancelModal}
                        className="px-3 sm:px-4 py-2 text-white/80 hover:text-white transition-all duration-200 text-xs sm:text-sm font-medium"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSubmitCancellation}
                        disabled={!cancellationReason.trim()}
                        className="px-4 sm:px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 text-xs sm:text-sm font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Confirmar Cancelación
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Información de Cita */}
        {showInfoModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 sm:p-6 lg:p-8">
            <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg mx-auto h-[90vh] sm:h-[85vh] lg:h-[80vh] flex flex-col">
              <div className={`relative backdrop-blur-md border rounded-2xl shadow-2xl h-full flex flex-col overflow-hidden ${
                selectedAppointment.status === 'confirmed' ? 'bg-green-500/5 border-green-500/20 shadow-green-500/20' :
                selectedAppointment.status === 'pending' ? 'bg-yellow-500/5 border-yellow-500/20 shadow-yellow-500/20' :
                selectedAppointment.status === 'cancelled' ? 'bg-red-500/5 border-red-500/20 shadow-red-500/20' :
                'bg-blue-500/5 border-blue-500/20 shadow-blue-500/20'
              }`}>
                {/* Header fijo */}
                <div className="relative z-10 flex-shrink-0 p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`p-1.5 sm:p-2 rounded-lg ${
                        selectedAppointment.status === 'confirmed' ? 'bg-green-500/20' :
                        selectedAppointment.status === 'pending' ? 'bg-yellow-500/20' :
                        selectedAppointment.status === 'cancelled' ? 'bg-red-500/20' :
                        'bg-blue-500/20'
                      }`}>
                        <Calendar className={`w-4 h-4 sm:w-5 sm:h-5 ${
                          selectedAppointment.status === 'confirmed' ? 'text-green-400' :
                          selectedAppointment.status === 'pending' ? 'text-yellow-400' :
                          selectedAppointment.status === 'cancelled' ? 'text-red-400' :
                          'text-blue-400'
                        }`} />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-white">Información de Cita</h3>
                    </div>
                    <button 
                      onClick={handleCloseInfoModal}
                      className="p-1 text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
                
                {/* Contenido scrolleable */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-4 sm:px-6 pb-4 sm:pb-6" style={{ minHeight: 0 }}>
                  <div className="space-y-4">
                    {/* Estado */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-white">Estado</h4>
                        <div className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                          selectedAppointment.status === 'confirmed' ? 'bg-green-500/20 text-green-300 border-green-500/40' :
                          selectedAppointment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' :
                          selectedAppointment.status === 'cancelled' ? 'bg-red-500/20 text-red-300 border-red-500/40' :
                          'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        }`}>
                          {selectedAppointment.status === 'pending' ? 'Pendiente' :
                           selectedAppointment.status === 'confirmed' ? 'Confirmada' :
                           selectedAppointment.status === 'cancelled' ? 'Cancelada' :
                           'Completada'}
                        </div>
                      </div>
                      
                      {/* Motivo de cancelación dentro del estado */}
                      {selectedAppointment.status === 'cancelled' && selectedAppointment.cancellationReason && (
                        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <h5 className="text-xs font-semibold text-red-300 mb-1">Motivo de Cancelación</h5>
                              <p className="text-xs text-red-200/80 leading-relaxed">{selectedAppointment.cancellationReason}</p>
                              <p className="text-xs text-red-300/60 mt-1">
                                Cancelada por: {selectedAppointment.cancelledBy === 'barber' ? 'Barbero' : 'Cliente'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Cliente */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <h4 className="text-sm font-semibold text-white mb-2">Cliente</h4>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-300">
                          <User className="w-4 h-4 inline mr-2" />
                          {selectedAppointment.user?.name || 'Usuario no disponible'}
                        </p>
                        {selectedAppointment.user?.email && (
                          <p className="text-sm text-gray-300">
                            📧 {selectedAppointment.user.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Fecha y Hora */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <h4 className="text-sm font-semibold text-white mb-2">Fecha y Hora</h4>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-300">
                          <Calendar className="w-4 h-4 inline mr-2" />
                          {format(new Date(selectedAppointment.date), 'EEEE, d MMMM yyyy', { locale: es })}
                        </p>
                        <p className="text-sm text-gray-300">
                          <Clock className="w-4 h-4 inline mr-2" />
                          {format(new Date(selectedAppointment.date), "HH:mm")}
                        </p>
                      </div>
                    </div>

                    {/* Servicio */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <h4 className="text-sm font-semibold text-white mb-2">Servicio</h4>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-300">
                          <Scissors className="w-4 h-4 inline mr-2" />
                          {selectedAppointment.service?.name || 'Servicio no especificado'}
                        </p>
                        {selectedAppointment.service?.duration && (
                          <p className="text-xs text-gray-400">
                            Duración: {selectedAppointment.service.duration} minutos
                          </p>
                        )}
                        <p className="text-sm font-medium text-green-400">
                          ${selectedAppointment.status === 'cancelled' ? '0' : (selectedAppointment.service?.price?.toLocaleString() || '0')}
                        </p>
                      </div>
                    </div>

                    {/* Notas adicionales */}
                    {selectedAppointment.notes && (
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <h4 className="text-sm font-semibold text-white mb-2">Notas</h4>
                        <p className="text-sm text-gray-300">{selectedAppointment.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmación de Eliminación */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 sm:p-6 lg:p-8">
            <div className="relative w-full max-w-sm sm:max-w-md mx-auto">
              <div className="relative bg-red-500/5 backdrop-blur-md border border-red-500/20 rounded-2xl shadow-2xl shadow-red-500/20 overflow-hidden">
                <div className="relative z-10 p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-red-500/20">
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-white">Eliminar Reporte</h3>
                    </div>
                    <button 
                      onClick={handleCloseDeleteModal}
                      className="p-1 text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                  
                  <div className="mb-6">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
                        <div>
                          <h4 className="text-sm font-semibold text-red-300 mb-1">Acción Irreversible</h4>
                          <p className="text-sm text-red-200/80">Esta acción no se puede deshacer.</p>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-300 mb-2">
                      ¿Estás seguro de que deseas eliminar este reporte de cita?
                    </p>
                    <p className="text-xs text-gray-400">
                      Se eliminará permanentemente del historial y no podrá ser recuperado.
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleCloseDeleteModal}
                      className="flex-1 px-3 sm:px-4 py-2 text-white/80 hover:text-white transition-all duration-200 text-xs sm:text-sm font-medium border border-white/20 rounded-xl hover:border-white/40"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleDeleteAppointment(deleteAppointmentId)}
                      className="flex-1 px-4 sm:px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 text-xs sm:text-sm font-medium shadow-lg"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default BarberAppointment;
