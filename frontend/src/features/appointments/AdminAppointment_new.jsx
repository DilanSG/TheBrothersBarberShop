import React, { useState, useEffect } from 'react';
import { PageContainer } from '@components/layout/PageContainer';
import GradientText from '@components/ui/GradientText';
import { api, appointmentService } from '@services/api';
import { useNotification } from '@contexts/NotificationContext';
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
  Search,
  Filter,
  BarChart3,
  Users,
  Activity,
  Info,
  AlertTriangle,
  MapPin,
  Phone,
  DollarSign
} from 'lucide-react';
import GradientButton from '@components/ui/GradientButton';

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
    date: 'all',
    search: ''
  });

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

  // Bloquear scroll del body cuando hay modales abiertos
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
    fetchAllAppointments();
  }, []);

  const fetchAllAppointments = async () => {
    try {
      setLoading(true);
      const data = await appointmentService.getAllAppointments();
      
      if (data.success) {
        setAppointments(data.data);
        calculateStats(data.data);
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error al cargar las citas');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (appointmentList) => {
    const stats = appointmentList.reduce(
      (acc, appointment) => {
        acc.total++;
        acc[appointment.status]++;
        return acc;
      },
      { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 }
    );
    setStats(stats);
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      const data = await appointmentService.updateAppointmentStatus(appointmentId, newStatus);
      if (data.success) {
        showSuccess(`Cita ${newStatus === 'confirmed' ? 'confirmada' : 'completada'} exitosamente`);
        fetchAllAppointments();
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error al actualizar la cita');
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    try {
      const data = await appointmentService.deleteAppointment(appointmentId);
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

  // Abrir modal de información
  const handleShowInfo = (appointment) => {
    setSelectedAppointment(appointment);
    setShowInfoModal(true);
  };

  // Abrir modal de eliminación
  const handleOpenDeleteModal = (appointmentId) => {
    setDeleteAppointmentId(appointmentId);
    setShowDeleteModal(true);
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

  // Función para ordenar citas por prioridad
  const sortAppointmentsByPriority = (appointments) => {
    return appointments.sort((a, b) => {
      const priorityOrder = { pending: 0, confirmed: 1, completed: 2, cancelled: 3 };
      return priorityOrder[a.status] - priorityOrder[b.status];
    });
  };

  const StatCard = ({ title, value, icon: Icon, gradient, borderColor, textColor }) => (
    <div className={`group relative bg-gradient-to-br ${gradient} backdrop-blur-sm rounded-xl p-3 sm:p-4 border ${borderColor} shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden`}>
      {/* Efecto de brillo */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-xl"></div>
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-xs font-medium">{title}</p>
          <p className={`${textColor} text-lg sm:text-xl font-bold mt-1 group-hover:scale-105 transition-transform duration-200`}>{value}</p>
        </div>
        <div className={`p-2 bg-gradient-to-br ${gradient} rounded-lg border ${borderColor}`}>
          <Icon className={`w-4 h-4 ${textColor}`} />
        </div>
      </div>
    </div>
  );

  const AppointmentCard = ({ appointment, onStatusChange, onCancel, onViewReason, onDelete, onShowInfo }) => {
    const getStatusIcon = (status) => {
      switch (status) {
        case 'pending': return <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />;
        case 'confirmed': return <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />;
        case 'completed': return <Check className="w-4 h-4 sm:w-5 sm:h-5" />;
        case 'cancelled': return <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />;
        default: return <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />;
      }
    };

    const getStatusColor = (status) => {
      switch (status) {
        case 'pending': return 'border-yellow-500/30 bg-yellow-500/5 shadow-sm shadow-yellow-500/20';
        case 'confirmed': return 'border-green-500/30 bg-green-500/5 shadow-sm shadow-green-500/20';
        case 'completed': return 'border-blue-500/30 bg-blue-500/5 shadow-sm shadow-blue-500/20';
        case 'cancelled': return 'border-red-500/30 bg-red-500/5 shadow-sm shadow-red-500/20';
        default: return 'border-gray-500/30 bg-gray-500/5 shadow-sm shadow-gray-500/20';
      }
    };

    const getStatusBadgeColor = (status) => {
      switch (status) {
        case 'pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
        case 'confirmed': return 'bg-green-500/20 text-green-300 border-green-500/40';
        case 'completed': return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
        case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/40';
        default: return 'bg-gray-500/20 text-gray-300 border-gray-500/40';
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
      <div className={`group relative backdrop-blur-sm border rounded-lg p-4 transition-all duration-300 overflow-hidden hover:scale-[1.002] hover:-translate-y-0.5 cursor-pointer mx-1 my-2 ${getStatusColor(appointment.status)}`}>
        {/* Efecto de brillo */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-lg"></div>
        
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            {/* Status Badge */}
            <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(appointment.status)}`}>
              {getStatusIcon(appointment.status)}
              <span>{getStatusText(appointment.status)}</span>
            </div>

            {/* Priority Indicator */}
            {appointment.status === 'pending' && (
              <div className="px-2 py-1 bg-amber-500/20 border border-amber-500/30 rounded-md">
                <span className="text-xs font-medium text-amber-300">Atención</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {/* Client Info */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <User className="w-3 h-3 text-blue-400 flex-shrink-0" />
                <span className="text-xs text-gray-400">Cliente</span>
              </div>
              <p className="text-sm font-medium text-white truncate">{appointment.clientId?.name || 'N/A'}</p>
            </div>

            {/* Barber Info */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Scissors className="w-3 h-3 text-purple-400 flex-shrink-0" />
                <span className="text-xs text-gray-400">Barbero</span>
              </div>
              <p className="text-sm font-medium text-white truncate">{appointment.barberId?.name || 'N/A'}</p>
            </div>

            {/* Date & Time */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-green-400 flex-shrink-0" />
                <span className="text-xs text-gray-400">Fecha</span>
              </div>
              <p className="text-sm font-medium text-white">
                {format(new Date(appointment.date), 'dd MMM', { locale: es })}
              </p>
            </div>

            {/* Service */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                <span className="text-xs text-gray-400">Hora</span>
              </div>
              <p className="text-sm font-medium text-white">{appointment.time}</p>
            </div>
          </div>

          {/* Service and Price */}
          <div className="flex items-center justify-between mb-4 p-2 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-white">{appointment.serviceId?.name || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-300">
                ${appointment.status === 'cancelled' ? '0' : (appointment.serviceId?.price || 0)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {/* Botón de información siempre visible */}
              <button
                onClick={() => onShowInfo(appointment)}
                className="group relative p-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg border border-blue-500/30 hover:border-purple-500/40 transition-all duration-300 backdrop-blur-sm hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-purple-600/30 transform hover:scale-110 shadow-xl shadow-blue-500/20"
                title="Ver información completa"
              >
                <Info className="w-4 h-4 text-blue-400 group-hover:text-purple-400 transition-colors duration-300" />
              </button>

              {/* Status change buttons */}
              {appointment.status === 'pending' && (
                <>
                  <button
                    onClick={() => onStatusChange(appointment._id, 'confirmed')}
                    className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-md hover:bg-green-500/30 transition-all duration-200 border border-green-500/30 text-xs"
                    title="Confirmar cita"
                  >
                    <Check className="w-3 h-3" />
                    <span>Confirmar</span>
                  </button>
                  <button
                    onClick={() => onCancel(appointment._id)}
                    className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/30 transition-all duration-200 border border-red-500/30 text-xs"
                    title="Cancelar cita"
                  >
                    <X className="w-3 h-3" />
                    <span>Cancelar</span>
                  </button>
                </>
              )}

              {appointment.status === 'confirmed' && (
                <>
                  <button
                    onClick={() => onStatusChange(appointment._id, 'completed')}
                    className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded-md hover:bg-blue-500/30 transition-all duration-200 border border-blue-500/30 text-xs"
                    title="Marcar como completada"
                  >
                    <Check className="w-3 h-3" />
                    <span>Completar</span>
                  </button>
                  <button
                    onClick={() => onCancel(appointment._id)}
                    className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/30 transition-all duration-200 border border-red-500/30 text-xs"
                    title="Cancelar cita"
                  >
                    <X className="w-3 h-3" />
                    <span>Cancelar</span>
                  </button>
                </>
              )}
            </div>

            {/* Delete button - solo para citas completadas o canceladas */}
            {(appointment.status === 'completed' || appointment.status === 'cancelled') && (
              <button
                onClick={() => onDelete(appointment._id)}
                className="group relative p-2 bg-gradient-to-r from-red-600/20 to-pink-600/20 rounded-lg border border-red-500/30 hover:border-pink-500/40 transition-all duration-300 backdrop-blur-sm hover:bg-gradient-to-r hover:from-red-600/30 hover:to-pink-600/30 transform hover:scale-110 shadow-xl shadow-red-500/20"
                title="Eliminar reporte de cita"
              >
                <Trash2 className="w-4 h-4 text-red-400 group-hover:text-pink-400 transition-colors duration-300" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const filteredAppointments = sortAppointmentsByPriority(
    appointments.filter(app => {
      if (filters.status !== 'all' && app.status !== filters.status) return false;
      if (filters.search) {
        const clientName = app.clientId?.name || '';
        const barberName = app.barberId?.name || '';
        const serviceName = app.serviceId?.name || '';
        const searchTerm = filters.search.toLowerCase();
        
        return clientName.toLowerCase().includes(searchTerm) ||
               barberName.toLowerCase().includes(searchTerm) ||
               serviceName.toLowerCase().includes(searchTerm);
      }
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

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
          <StatCard
            title="Total"
            value={stats.total}
            icon={Activity}
            gradient="from-blue-500/20 to-cyan-500/20"
            borderColor="border-blue-500/30"
            textColor="text-blue-300"
          />
          <StatCard
            title="Pendientes"
            value={stats.pending}
            icon={AlertCircle}
            gradient="from-yellow-500/20 to-orange-500/20"
            borderColor="border-yellow-500/30"
            textColor="text-yellow-300"
          />
          <StatCard
            title="Confirmadas"
            value={stats.confirmed}
            icon={CheckCircle}
            gradient="from-green-500/20 to-emerald-500/20"
            borderColor="border-green-500/30"
            textColor="text-green-300"
          />
          <StatCard
            title="Completadas"
            value={stats.completed}
            icon={Check}
            gradient="from-blue-500/20 to-violet-500/20"
            borderColor="border-blue-500/30"
            textColor="text-blue-300"
          />
          <StatCard
            title="Canceladas"
            value={stats.cancelled}
            icon={XCircle}
            gradient="from-red-500/20 to-pink-500/20"
            borderColor="border-red-500/30"
            textColor="text-red-300"
          />
        </div>

        {/* Filters Section */}
        <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-white/10 shadow-xl shadow-blue-500/20 hover:border-white/40 transition-all duration-300 overflow-hidden">
          {/* Efecto de brillo */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-2xl"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl border border-purple-500/20 shadow-xl shadow-blue-500/20">
                <Filter className="w-5 h-5 text-purple-400" />
              </div>
              <GradientText className="text-lg sm:text-xl lg:text-2xl font-bold">
                Filtros y Búsqueda
              </GradientText>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {/* Search Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Buscar citas
                </label>
                <input
                  type="text"
                  placeholder="Cliente, barbero o servicio..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="glassmorphism-input"
                />
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Estado
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="glassmorphism-select"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendientes</option>
                  <option value="confirmed">Confirmadas</option>
                  <option value="completed">Completadas</option>
                  <option value="cancelled">Canceladas</option>
                </select>
              </div>

              {/* Date Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Período
                </label>
                <select
                  value={filters.date}
                  onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                  className="glassmorphism-select"
                >
                  <option value="all">Todas las fechas</option>
                  <option value="today">Hoy</option>
                  <option value="week">Esta semana</option>
                  <option value="month">Este mes</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-white/10 shadow-xl shadow-blue-500/20 hover:border-white/40 transition-all duration-300 overflow-hidden">
          {/* Efecto de brillo */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-2xl"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-xl border border-green-500/20 shadow-xl shadow-blue-500/20">
                <Users className="w-5 h-5 text-green-400" />
              </div>
              <GradientText className="text-lg sm:text-xl lg:text-2xl font-bold">
                Lista de Citas ({filteredAppointments.length})
              </GradientText>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No hay citas que coincidan con los filtros</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar pl-1 pt-2 rounded-xl">
                {filteredAppointments.map((appointment, index) => (
                  <div key={appointment._id} style={{ zIndex: filteredAppointments.length - index }}>
                    <AppointmentCard
                      appointment={appointment}
                      onStatusChange={handleStatusChange}
                      onCancel={handleOpenCancelModal}
                      onDelete={handleOpenDeleteModal}
                      onViewReason={handleViewCancellationReason}
                      onShowInfo={handleShowInfo}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal de información de cita */}
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
                        {selectedAppointment.status === 'confirmed' ? (
                          <CheckCircle className={`w-4 h-4 sm:w-5 sm:h-5 text-green-400`} />
                        ) : selectedAppointment.status === 'pending' ? (
                          <AlertCircle className={`w-4 h-4 sm:w-5 sm:h-5 text-yellow-400`} />
                        ) : selectedAppointment.status === 'cancelled' ? (
                          <XCircle className={`w-4 h-4 sm:w-5 sm:h-5 text-red-400`} />
                        ) : (
                          <Check className={`w-4 h-4 sm:w-5 sm:h-5 text-blue-400`} />
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-white">Información de Cita</h3>
                    </div>
                    <button 
                      onClick={() => setShowInfoModal(false)}
                      className="p-1 text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>

                {/* Contenido scrolleable */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-4 sm:px-6 pb-4 sm:pb-6" style={{ minHeight: 0 }}>
                  <div className="space-y-4 sm:space-y-6">
                    
                    {/* Estado de la cita */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Estado de la Cita
                      </h4>
                      <div className="flex items-center gap-3">
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
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Información del cliente */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Información del Cliente
                      </h4>
                      <div className="bg-white/5 rounded-lg p-3 space-y-2">
                        <p className="text-sm">
                          <span className="text-gray-400">Nombre:</span>
                          <span className="text-white ml-2 font-medium">{selectedAppointment.clientId?.name || 'N/A'}</span>
                        </p>
                        {selectedAppointment.clientId?.email && (
                          <p className="text-sm">
                            <span className="text-gray-400">Email:</span>
                            <span className="text-white ml-2">{selectedAppointment.clientId.email}</span>
                          </p>
                        )}
                        {selectedAppointment.clientId?.phone && (
                          <p className="text-sm flex items-center gap-2">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span className="text-white">{selectedAppointment.clientId.phone}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Información del barbero */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Scissors className="w-4 h-4" />
                        Barbero Asignado
                      </h4>
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-sm">
                          <span className="text-gray-400">Nombre:</span>
                          <span className="text-white ml-2 font-medium">{selectedAppointment.barberId?.name || 'N/A'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Fecha y hora */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Fecha y Hora
                      </h4>
                      <div className="bg-white/5 rounded-lg p-3 space-y-2">
                        <p className="text-sm">
                          <span className="text-gray-400">Fecha:</span>
                          <span className="text-white ml-2 font-medium">
                            {format(new Date(selectedAppointment.date), 'EEEE, dd MMMM yyyy', { locale: es })}
                          </span>
                        </p>
                        <p className="text-sm">
                          <span className="text-gray-400">Hora:</span>
                          <span className="text-white ml-2 font-medium">{selectedAppointment.time}</span>
                        </p>
                      </div>
                    </div>

                    {/* Servicio y precio */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Scissors className="w-4 h-4" />
                        Servicio Solicitado
                      </h4>
                      <div className="bg-white/5 rounded-lg p-3 space-y-2">
                        <p className="text-sm">
                          <span className="text-gray-400">Servicio:</span>
                          <span className="text-white ml-2 font-medium">{selectedAppointment.serviceId?.name || 'N/A'}</span>
                        </p>
                        <p className="text-sm flex items-center gap-2">
                          <DollarSign className="w-3 h-3 text-green-400" />
                          <span className="text-gray-400">Precio:</span>
                          <span className="text-green-300 ml-2 font-bold">
                            ${selectedAppointment.status === 'cancelled' ? '0' : (selectedAppointment.serviceId?.price || 0)}
                          </span>
                        </p>
                        {selectedAppointment.serviceId?.description && (
                          <p className="text-xs text-gray-300 leading-relaxed mt-2">
                            {selectedAppointment.serviceId.description}
                          </p>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación de eliminación */}
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
                      onClick={() => setShowDeleteModal(false)}
                      className="p-1 text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-white font-medium mb-1">¿Está seguro?</p>
                        <p className="text-xs text-red-200/80 leading-relaxed">
                          Esta acción eliminará permanentemente el reporte de esta cita del sistema.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowDeleteModal(false)}
                        className="flex-1 px-3 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition-all duration-200 border border-gray-500/30 text-sm font-medium"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleDeleteAppointment(deleteAppointmentId)}
                        className="flex-1 px-3 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-all duration-200 border border-red-500/30 text-sm font-medium"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 sm:p-6 lg:p-8">
            <div className="relative w-full max-w-sm sm:max-w-md mx-auto">
              <div className="relative bg-red-500/5 backdrop-blur-md border border-red-500/20 rounded-2xl shadow-2xl shadow-red-500/20 overflow-hidden">
                <div className="relative z-10 p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
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
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-white font-medium mb-1">Acción Administrativa</p>
                        <p className="text-xs text-yellow-200/80 leading-relaxed">
                          Está a punto de cancelar esta cita como administrador.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">
                        Motivo de cancelación (opcional)
                      </label>
                      <textarea
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        placeholder="Ingresa el motivo de la cancelación..."
                        rows={3}
                        className="glassmorphism-textarea"
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={handleCloseCancelModal}
                        className="flex-1 px-3 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition-all duration-200 border border-gray-500/30 text-sm font-medium"
                      >
                        Mantener Cita
                      </button>
                      <button
                        onClick={handleSubmitCancellation}
                        className="flex-1 px-3 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-all duration-200 border border-red-500/30 text-sm font-medium"
                      >
                        Cancelar Cita
                      </button>
                    </div>
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

export default AdminAppointment;
