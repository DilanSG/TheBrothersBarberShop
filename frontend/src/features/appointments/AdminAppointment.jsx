import React, { useState, useEffect } from 'react';
import { PageContainer } from '../../shared/components/layout/PageContainer';
import GradientText from '../../shared/components/ui/GradientText';
import { StatusBadge } from '../../shared/components/ui/StatusBadge';
import { api, appointmentService } from '../../shared/services/api';
import { useNotification } from '../../shared/contexts/NotificationContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Calendar, 
  Clock, 
  User, 
  Scissors, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Eye, 
  Trash2, 
  Check, 
  X,
  BarChart3,
  Users,
  Activity,
  Info,
  AlertTriangle,
  DollarSign,
  MapPin
} from 'lucide-react';
import GradientButton from '../../shared/components/ui/GradientButton';

const AdminAppointment = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError, showInfo } = useNotification();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0
  });
  const [filters, setFilters] = useState({
    status: 'all',
    date: 'all'
  });

  // Estados para cancelación con motivo
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelAppointmentId, setCancelAppointmentId] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');

  // Estados para modales de información
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Estados para modal de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAppointmentId, setDeleteAppointmentId] = useState(null);

  useEffect(() => {
    fetchAllAppointments();
  }, []);

  const fetchAllAppointments = async () => {
    try {
      const data = await api.get('/appointments');
      if (data.success) {
        setAppointments(data.data);
        updateStats(data.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (appointments) => {
    const newStats = appointments.reduce((acc, app) => {
      acc.total++;
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 });
    
    setStats(newStats);
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      let response;
      switch (newStatus) {
        case 'confirmed':
          response = await appointmentService.approveAppointment(appointmentId);
          break;
        case 'completed':
          response = await appointmentService.completeAppointment(appointmentId);
          break;
        case 'cancelled':
          handleOpenCancelModal(appointmentId);
          return;
        default:
          showError('Estado no válido');
          return;
      }

      if (response.success) {
        showSuccess(`Cita ${newStatus === 'confirmed' ? 'confirmada' : 'actualizada'} exitosamente`);
        fetchAllAppointments();
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error al actualizar la cita');
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    setDeleteAppointmentId(appointmentId);
    setShowDeleteModal(true);
  };

  const confirmDeleteAppointment = async () => {
    try {
      const data = await appointmentService.deleteAppointment(deleteAppointmentId);
      if (data.success) {
        showSuccess('Reporte de cita eliminado exitosamente');
        fetchAllAppointments();
        setShowDeleteModal(false);
        setDeleteAppointmentId(null);
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error al eliminar el reporte de cita');
    }
  };

  // Open info modal
  const handleOpenInfoModal = (appointment) => {
    setSelectedAppointment(appointment);
    setShowInfoModal(true);
  };

  // Close info modal
  const handleCloseInfoModal = () => {
    setShowInfoModal(false);
    setSelectedAppointment(null);
  };

  // Open cancel modal
  const handleOpenCancelModal = (appointmentId) => {
    setCancelAppointmentId(appointmentId);
    setShowCancelModal(true);
  };

  // Close cancel modal
  const handleCloseCancelModal = () => {
    setShowCancelModal(false);
    setCancelAppointmentId(null);
    setCancellationReason('');
  };

  // Submit cancellation with optional reason
  const handleSubmitCancellation = async () => {
    try {
      const response = await appointmentService.cancelAppointment(
        cancelAppointmentId, 
        cancellationReason.trim() || undefined
      );

      if (response.success) {
        showSuccess('Cita cancelada exitosamente por administración.');
        fetchAllAppointments();
        handleCloseCancelModal();
      } else {
        showError(response.message || 'Error al cancelar la cita');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error al cancelar la cita');
    }
  };

  // View cancellation reason
  const handleViewCancellationReason = async (appointmentId) => {
    try {
      const data = await api.get(`/appointments/${appointmentId}/cancellation-reason`);
      
      if (data.success) {
        const { reason, cancelledBy, cancelledAt } = data.data;
        const cancelledByText = cancelledBy === 'user' ? 'el cliente' : 
                               cancelledBy === 'barber' ? 'el barbero' : 'administración';
        
        showInfo(
          `${reason}\n\nCancelada el: ${new Date(cancelledAt).toLocaleString('es-ES')}`,
          `Motivo de cancelación por ${cancelledByText}`
        );
      } else {
        showError('No se pudo obtener el motivo de cancelación');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('No se pudo obtener el motivo de cancelación');
    }
  };

  // Función para obtener sombra por color del estado
  const getStatusShadowClass = (status) => {
    const shadows = {
      'pending': 'drop-shadow-[0_1px_2px_rgba(251,146,60,0.3)]',
      'confirmed': 'drop-shadow-[0_1px_2px_rgba(34,197,94,0.3)]', 
      'completed': 'drop-shadow-[0_1px_2px_rgba(59,130,246,0.3)]',
      'cancelled': 'drop-shadow-[0_1px_2px_rgba(239,68,68,0.3)]'
    };
    return shadows[status] || 'drop-shadow-sm';
  };

  // Función para ordenar citas por prioridad
  const sortAppointmentsByPriority = (appointments) => {
    return appointments.sort((a, b) => {
      const priorityOrder = { pending: 0, confirmed: 1, completed: 2, cancelled: 3 };
      return priorityOrder[a.status] - priorityOrder[b.status];
    });
  };

  const StatCard = ({ title, value, icon: Icon, gradient, borderColor, textColor, filterValue, isActive, onClick }) => (
    <button
      onClick={() => onClick(filterValue)}
      className={`group relative bg-white/5 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border shadow-xl hover:border-white/40 transition-all duration-300 overflow-hidden cursor-pointer hover:scale-[1.02] w-full ${
        isActive ? 'border-blue-500/50 bg-blue-500/10 shadow-blue-500/20' : 'border-white/10 shadow-blue-500/20'
      }`}
    >
      {/* Efecto de brillo */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-2xl"></div>
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className={`p-2 bg-gradient-to-r ${gradient} rounded-lg border ${borderColor} shadow-lg`}>
            <Icon className={`w-4 h-4 ${textColor}`} />
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs font-medium">{title}</p>
            <p className={`${isActive ? 'text-blue-300' : textColor} text-lg sm:text-xl font-bold group-hover:scale-105 transition-transform duration-200`}>{value}</p>
          </div>
        </div>
      </div>
    </button>
  );

  const AppointmentCard = ({ appointment, onStatusChange, onCancel, onViewReason, onDelete, onInfo }) => {
    const getStatusIcon = (status) => {
      switch (status) {
        case 'pending': return <AlertCircle className="w-4 h-4" />;
        case 'confirmed': return <CheckCircle className="w-4 h-4" />;
        case 'completed': return <Check className="w-4 h-4" />;
        case 'cancelled': return <XCircle className="w-4 h-4" />;
        default: return <AlertCircle className="w-4 h-4" />;
      }
    };

    const getStatusColorClasses = (status) => {
      switch (status) {
        case 'pending': return 'border-yellow-500/30 bg-yellow-500/5 shadow-sm shadow-yellow-500/20';
        case 'confirmed': return 'border-green-500/30 bg-green-500/5 shadow-sm shadow-green-500/20';
        case 'completed': return 'border-blue-500/30 bg-blue-500/5 shadow-sm shadow-blue-500/20';
        case 'cancelled': return 'border-red-500/30 bg-red-500/5 shadow-sm shadow-red-500/20';
        default: return 'border-gray-500/30 bg-gray-500/5 shadow-sm shadow-gray-500/20';
      }
    };

    const getStatusText = (status) => {
      switch (status) {
        case 'pending': return 'Pendiente';
        case 'confirmed': return 'Confirmada';
        case 'completed': return 'Completada';
        case 'cancelled': return 'Cancelada';
        default: return 'Desconocido';
      }
    };

    return (
      <div className={`group relative backdrop-blur-sm border rounded-lg p-4 transition-all duration-300 overflow-hidden hover:scale-[1.002] hover:-translate-y-0.5 cursor-pointer mx-1 my-2 ${getStatusColorClasses(appointment.status)}`}>
        {/* Efecto de brillo */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-lg"></div>
        
        <div className="relative">
          {/* Layout horizontal: datos a la izquierda, estado y acciones a la derecha */}
          <div className="flex items-center justify-between">
            {/* Información compacta a la izquierda */}
            <div className="flex-1 grid grid-cols-2 lg:grid-cols-5 gap-4 text-sm mr-6">
              <div className="flex items-center gap-2">
                <User className="w-3 h-3 text-amber-400 flex-shrink-0 drop-shadow-[0_1px_2px_rgba(251,191,36,0.3)]" />
                <div className="min-w-0">
                  <span className="text-gray-400 text-xs block leading-tight">Cliente</span>
                  <span className="text-amber-300 font-medium truncate block leading-tight">
                    {appointment.user?.name || appointment.client?.name || 'Sin nombre'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Scissors className="w-3 h-3 text-green-400 flex-shrink-0 drop-shadow-[0_1px_2px_rgba(74,222,128,0.3)]" />
                <div className="min-w-0">
                  <span className="text-gray-400 text-xs block leading-tight">Barbero</span>
                  <span className="text-green-300 font-medium truncate block leading-tight">
                    {appointment.barber?.user?.name || appointment.barber?.name || 'Sin asignar'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-3 h-3 text-purple-400 flex-shrink-0 drop-shadow-[0_1px_2px_rgba(196,181,253,0.3)]" />
                <div className="min-w-0">
                  <span className="text-gray-400 text-xs block leading-tight">Servicio</span>
                  <span className="text-purple-300 font-medium truncate block leading-tight">
                    {appointment.service?.name || 'Sin servicio'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3 text-blue-400 flex-shrink-0 drop-shadow-[0_1px_2px_rgba(96,165,250,0.3)]" />
                <div className="min-w-0">
                  <span className="text-gray-400 text-xs block leading-tight">Fecha</span>
                  <span className="text-blue-300 font-medium block leading-tight">
                    {format(new Date(appointment.date), "d MMM", { locale: es })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-orange-400 flex-shrink-0 drop-shadow-[0_1px_2px_rgba(251,146,60,0.3)]" />
                <div className="min-w-0">
                  <span className="text-gray-400 text-xs block leading-tight">Hora</span>
                  <span className="text-orange-300 font-medium block leading-tight">
                    {format(new Date(appointment.date), "HH:mm")}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Badge e Iconos de acción a la derecha */}
            <div className="flex flex-col items-end gap-3 flex-shrink-0">
              <div className={getStatusShadowClass(appointment.status)}>
                <StatusBadge status={appointment.status} size="sm" />
              </div>
              
              <div className="flex items-center gap-1">
                {/* Botón de información */}
                <button
                  onClick={() => onInfo(appointment)}
                  className="p-1.5 bg-blue-500/10 border border-blue-500/30 rounded-md text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 transition-all duration-300 shadow-sm shadow-blue-500/20 drop-shadow-[0_1px_2px_rgba(96,165,250,0.3)]"
                  title="Ver información completa"
                >
                  <Info className="w-3 h-3" />
                </button>

                {/* Iconos de acciones según el estado */}
                {appointment.status === 'pending' && (
                  <>
                    <button
                      onClick={() => onStatusChange(appointment._id, 'confirmed')}
                      className="p-1.5 bg-green-500/10 border border-green-500/30 rounded-md text-green-400 hover:text-green-300 hover:bg-green-500/20 transition-all duration-300 shadow-sm shadow-green-500/20 drop-shadow-[0_1px_2px_rgba(34,197,94,0.3)]"
                      title="Confirmar cita"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onCancel(appointment._id)}
                      className="p-1.5 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all duration-300 shadow-sm shadow-red-500/20 drop-shadow-[0_1px_2px_rgba(239,68,68,0.3)]"
                      title="Cancelar cita"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                )}

                {appointment.status === 'confirmed' && (
                  <>
                    <button
                      onClick={() => onStatusChange(appointment._id, 'completed')}
                      className="p-1.5 bg-blue-500/10 border border-blue-500/30 rounded-md text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 transition-all duration-300 shadow-sm shadow-blue-500/20 drop-shadow-[0_1px_2px_rgba(96,165,250,0.3)]"
                      title="Marcar como completada"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onCancel(appointment._id)}
                      className="p-1.5 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all duration-300 shadow-sm shadow-red-500/20 drop-shadow-[0_1px_2px_rgba(239,68,68,0.3)]"
                      title="Cancelar cita"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                )}

                {appointment.status === 'cancelled' && appointment.cancellationReason && (
                  <button
                    onClick={() => onViewReason(appointment._id)}
                    className="p-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-md text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20 transition-all duration-300 shadow-sm shadow-yellow-500/20 drop-shadow-[0_1px_2px_rgba(251,191,36,0.3)]"
                    title="Ver motivo de cancelación"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                )}

                {(appointment.status === 'completed' || appointment.status === 'cancelled') && (
                  <button
                    onClick={() => onDelete(appointment._id)}
                    className="p-1.5 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all duration-300 shadow-sm shadow-red-500/20 drop-shadow-[0_1px_2px_rgba(239,68,68,0.3)]"
                    title="Eliminar reporte de cita"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const filteredAppointments = sortAppointmentsByPriority(
    appointments.filter(app => {
      if (filters.status !== 'all' && app.status !== filters.status) return false;
      return true;
    })
  );

  return (
    <PageContainer>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 space-y-8">
        
        {/* Header principal */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/20 shadow-xl shadow-blue-500/20">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-blue-400" />
            </div>
            <GradientText className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold">
              Panel Administrativo
            </GradientText>
          </div>
          <p className="text-gray-300 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed px-2">
            Gestión completa de citas y estadísticas del sistema
          </p>
        </div>

        {/* Filtros de Estadísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard
            title="Todas"
            value={stats.total}
            icon={Activity}
            gradient="from-blue-500/20 to-cyan-500/20"
            borderColor="border-blue-500/30"
            textColor="text-blue-300"
            filterValue="all"
            isActive={filters.status === 'all'}
            onClick={(value) => setFilters(prev => ({...prev, status: value}))}
          />
          <StatCard
            title="Pendientes"
            value={stats.pending}
            icon={AlertCircle}
            gradient="from-yellow-500/20 to-orange-500/20"
            borderColor="border-yellow-500/30"
            textColor="text-yellow-300"
            filterValue="pending"
            isActive={filters.status === 'pending'}
            onClick={(value) => setFilters(prev => ({...prev, status: value}))}
          />
          <StatCard
            title="Confirmadas"
            value={stats.confirmed}
            icon={CheckCircle}
            gradient="from-green-500/20 to-emerald-500/20"
            borderColor="border-green-500/30"
            textColor="text-green-300"
            filterValue="confirmed"
            isActive={filters.status === 'confirmed'}
            onClick={(value) => setFilters(prev => ({...prev, status: value}))}
          />
          <StatCard
            title="Completadas"
            value={stats.completed}
            icon={Check}
            gradient="from-purple-500/20 to-violet-500/20"
            borderColor="border-purple-500/30"
            textColor="text-purple-300"
            filterValue="completed"
            isActive={filters.status === 'completed'}
            onClick={(value) => setFilters(prev => ({...prev, status: value}))}
          />
          <StatCard
            title="Canceladas"
            value={stats.cancelled}
            icon={XCircle}
            gradient="from-red-500/20 to-pink-500/20"
            borderColor="border-red-500/30"
            textColor="text-red-300"
            filterValue="cancelled"
            isActive={filters.status === 'cancelled'}
            onClick={(value) => setFilters(prev => ({...prev, status: value}))}
          />
        </div>

        {/* Lista de Citas */}
        <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/10 shadow-xl shadow-blue-500/20 hover:border-white/40 transition-all duration-300 overflow-hidden">
          {/* Efecto de brillo */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-2xl"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl border border-purple-500/20 shadow-xl shadow-purple-500/20">
                <Calendar className="w-4 h-4 text-purple-400" />
              </div>
              <GradientText className="text-base sm:text-lg font-bold">
                Lista de Citas ({filteredAppointments.length})
              </GradientText>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                <span className="ml-3 text-gray-400">Cargando citas...</span>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No hay citas que coincidan con los filtros</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                {filteredAppointments.map((appointment, index) => (
                  <div
                    key={appointment._id}
                    style={{ zIndex: filteredAppointments.length - index }}
                  >
                    <AppointmentCard
                      appointment={appointment}
                      onStatusChange={handleStatusChange}
                      onCancel={handleOpenCancelModal}
                      onViewReason={handleViewCancellationReason}
                      onDelete={handleDeleteAppointment}
                      onInfo={handleOpenInfoModal}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modales */}
        
        {/* Modal de Información */}
        {showInfoModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl max-w-sm sm:max-w-md lg:max-w-lg w-full border border-white/20 shadow-2xl shadow-blue-500/20 overflow-hidden">
              <div className="sticky top-0 bg-white/5 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 py-4 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/20 shadow-xl shadow-blue-500/20">
                      <Info className="w-5 h-5 text-blue-400" />
                    </div>
                    <GradientText className="text-lg font-bold">
                      Información de la Cita
                    </GradientText>
                  </div>
                  <button
                    onClick={handleCloseInfoModal}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {/* Estado */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-300">Estado de la Cita</h4>
                    <StatusBadge status={selectedAppointment.status} />
                  </div>
                  
                  {/* Motivo de cancelación dentro del estado */}
                  {selectedAppointment.status === 'cancelled' && selectedAppointment.cancellationReason && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h5 className="text-xs font-semibold text-red-300 mb-1">Motivo de Cancelación</h5>
                          <p className="text-xs text-red-200/80 leading-relaxed">{selectedAppointment.cancellationReason}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Información del Cliente */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-400" />
                    Información del Cliente
                  </h4>
                  <div className="bg-white/5 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Nombre:</span>
                      <span className="text-xs text-white font-medium">{selectedAppointment.user?.name || selectedAppointment.client?.name || 'Sin nombre'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Email:</span>
                      <span className="text-xs text-white">{selectedAppointment.user?.email || selectedAppointment.client?.email || 'Sin email'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Teléfono:</span>
                      <span className="text-xs text-white">{selectedAppointment.user?.phone || selectedAppointment.client?.phone || 'Sin teléfono'}</span>
                    </div>
                  </div>
                </div>

                {/* Información del Barbero */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-green-400" />
                    Información del Barbero
                  </h4>
                  <div className="bg-white/5 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Nombre:</span>
                      <span className="text-xs text-white font-medium">{selectedAppointment.barber?.user?.name || selectedAppointment.barber?.name || 'Sin asignar'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Especialidad:</span>
                      <span className="text-xs text-white">{selectedAppointment.barber?.specialty || 'Sin especialidad'}</span>
                    </div>
                  </div>
                </div>

                {/* Información del Servicio */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-400" />
                    Información del Servicio
                  </h4>
                  <div className="bg-white/5 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Servicio:</span>
                      <span className="text-xs text-white font-medium">{selectedAppointment.service?.name || 'Sin servicio'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Precio:</span>
                      <span className="text-xs text-green-400 font-semibold flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {selectedAppointment.status === 'cancelled' ? '0.00' : (selectedAppointment.service?.price || '0.00')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Duración:</span>
                      <span className="text-xs text-white">{selectedAppointment.service?.duration || 'Sin duración'} min</span>
                    </div>
                  </div>
                </div>

                {/* Información de Fecha y Hora */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-400" />
                    Fecha y Hora
                  </h4>
                  <div className="bg-white/5 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Fecha:</span>
                      <span className="text-xs text-white font-medium">{format(new Date(selectedAppointment.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-400">Hora:</span>
                      <span className="text-xs text-white font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(selectedAppointment.date), "HH:mm")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Cancelación */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl max-w-md w-full border border-red-500/30 shadow-2xl shadow-red-500/20 overflow-hidden">
              <div className="sticky top-0 bg-red-500/10 backdrop-blur-xl border-b border-red-500/20 px-4 sm:px-6 py-4 z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-red-600/20 to-red-600/20 rounded-xl border border-red-500/20 shadow-xl shadow-red-500/20">
                    <XCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <GradientText className="text-lg font-bold">
                    Cancelar Cita
                  </GradientText>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-4">
                <p className="text-gray-300 text-sm leading-relaxed">
                  ¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer.
                </p>
                
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-300">
                    Motivo de cancelación (opcional)
                  </label>
                  <textarea
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="Ingresa el motivo de la cancelación..."
                    rows={3}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 resize-none text-sm backdrop-blur-sm"
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleCloseCancelModal}
                    className="flex-1 px-4 py-2 bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 transition-all duration-200 border border-white/10 text-sm font-medium"
                  >
                    Mantener Cita
                  </button>
                  <GradientButton
                    onClick={handleSubmitCancellation}
                    variant="danger"
                    className="flex-1 px-4 py-2 text-sm font-medium"
                  >
                    Cancelar Cita
                  </GradientButton>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Eliminación */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl max-w-md w-full border border-red-500/30 shadow-2xl shadow-red-500/20 overflow-hidden">
              <div className="sticky top-0 bg-red-500/10 backdrop-blur-xl border-b border-red-500/20 px-4 sm:px-6 py-4 z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-red-600/20 to-red-600/20 rounded-xl border border-red-500/20 shadow-xl shadow-red-500/20">
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </div>
                  <GradientText className="text-lg font-bold">
                    Eliminar Reporte
                  </GradientText>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium mb-2">¿Confirmar eliminación?</h4>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Esta acción eliminará permanentemente el reporte de esta cita del sistema. 
                      Esta acción no se puede deshacer.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-4 py-2 bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 transition-all duration-200 border border-white/10 text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <GradientButton
                    onClick={confirmDeleteAppointment}
                    variant="danger"
                    className="flex-1 px-4 py-2 text-sm font-medium"
                  >
                    Eliminar Reporte
                  </GradientButton>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </PageContainer>
  );
};

export default AdminAppointment;
