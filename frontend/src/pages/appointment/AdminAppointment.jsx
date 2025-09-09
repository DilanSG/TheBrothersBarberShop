import React, { useState, useEffect } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { api, appointmentService } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Helper function para manejar fechas con timezone correctamente
const formatAppointmentDate = (dateStr, formatStr) => {
  if (dateStr.includes('T') && dateStr.includes('-05:00')) {
    // Extraer la fecha y hora local sin conversión de timezone
    const [datePart, timePart] = dateStr.split('T');
    
    if (formatStr.includes('HH:mm')) {
      // Para mostrar hora
      return timePart.split('.')[0].substring(0, 5); // Obtener solo HH:mm
    } else {
      // Para mostrar fecha
      return format(new Date(datePart + 'T00:00:00'), formatStr, { locale: es });
    }
  }
  // Fallback para formato anterior
  return format(new Date(dateStr), formatStr, { locale: es });
};

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
  Activity
} from 'lucide-react';
import GradientButton from '../../components/ui/GradientButton';

const AdminAppointment = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError } = useNotification();
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
    if (!confirm('¿Está seguro de que desea eliminar este reporte de cita?')) return;

    try {
      const data = await appointmentService.deleteAppointment(appointmentId);
      if (data.success) {
        showSuccess('Reporte de cita eliminado exitosamente');
        fetchAllAppointments();
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error al eliminar el reporte de cita');
    }
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
        
        alert(`Motivo de cancelación por ${cancelledByText}:\n\n${reason}\n\nCancelada el: ${new Date(cancelledAt).toLocaleString('es-ES')}`);
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
    <div className={`bg-gradient-to-br ${gradient} backdrop-blur-xl rounded-lg p-3 border ${borderColor} shadow-lg hover:shadow-xl transition-all duration-300 group`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-xs font-medium">{title}</p>
          <p className={`${textColor} text-xl font-bold mt-1 group-hover:scale-105 transition-transform duration-200`}>{value}</p>
        </div>
        <div className={`p-2 bg-gradient-to-br ${gradient} rounded-lg border ${borderColor}`}>
          <Icon className={`w-4 h-4 ${textColor}`} />
        </div>
      </div>
    </div>
  );

  const AppointmentCard = ({ appointment, onStatusChange, onCancel, onViewReason, onDelete }) => {
    const getStatusIcon = (status) => {
      switch (status) {
        case 'pending': return <AlertCircle className="w-4 h-4" />;
        case 'confirmed': return <CheckCircle className="w-4 h-4" />;
        case 'completed': return <Check className="w-4 h-4" />;
        case 'cancelled': return <XCircle className="w-4 h-4" />;
        default: return <AlertCircle className="w-4 h-4" />;
      }
    };

    const getStatusColor = (status) => {
      switch (status) {
        case 'pending': return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30';
        case 'confirmed': return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
        case 'completed': return 'from-purple-500/20 to-violet-500/20 border-purple-500/30';
        case 'cancelled': return 'from-red-500/20 to-pink-500/20 border-red-500/30';
        default: return 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
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
      <div className="bg-gray-800/40 backdrop-blur-xl rounded-lg p-4 border border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 group">
        <div className="flex items-start justify-between mb-3">
          {/* Status Badge */}
          <div className={`flex items-center space-x-1.5 px-2 py-1 rounded-md bg-gradient-to-r ${getStatusColor(appointment.status)} border text-xs`}>
            {getStatusIcon(appointment.status)}
            <span className="font-medium text-white">
              {getStatusText(appointment.status)}
            </span>
          </div>

          {/* Priority Indicator */}
          {appointment.status === 'pending' && (
            <div className="px-2 py-1 bg-amber-500/20 border border-amber-500/30 rounded-md">
              <span className="text-xs font-medium text-amber-300">Atención</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          {/* Client Info */}
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <User className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-gray-400">Cliente</span>
            </div>
            <p className="text-white text-sm font-medium truncate">
              {appointment.user?.name || appointment.client?.name || 'Sin nombre'}
            </p>
          </div>

          {/* Barber Info */}
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <Scissors className="w-3 h-3 text-green-400" />
              <span className="text-xs text-gray-400">Barbero</span>
            </div>
            <p className="text-white text-sm font-medium truncate">
              {appointment.barber?.user?.name || appointment.barber?.name || 'Sin asignar'}
            </p>
          </div>

          {/* Service Info */}
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <Activity className="w-3 h-3 text-purple-400" />
              <span className="text-xs text-gray-400">Servicio</span>
            </div>
            <p className="text-white text-sm font-medium truncate">
              {appointment.service?.name || 'Sin servicio'}
            </p>
          </div>

          {/* Date/Time Info */}
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-orange-400" />
              <span className="text-xs text-gray-400">Fecha</span>
            </div>
            <div className="text-white text-sm font-medium">
              <div>{formatAppointmentDate(appointment.date, "d MMM")}</div>
              <div className="flex items-center space-x-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                <span>{formatAppointmentDate(appointment.date, "HH:mm")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-1.5 pt-3 border-t border-gray-700/50">
          {appointment.status === 'pending' && (
            <>
              <button
                onClick={() => onStatusChange(appointment._id, 'confirmed')}
                className="flex items-center space-x-1 px-2 py-1 bg-green-500/20 text-green-400 rounded-md hover:bg-green-500/30 transition-all duration-200 border border-green-500/30"
                title="Confirmar cita"
              >
                <Check className="w-3 h-3" />
                <span className="text-xs">Confirmar</span>
              </button>
              <button
                onClick={() => onCancel(appointment._id)}
                className="flex items-center space-x-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/30 transition-all duration-200 border border-red-500/30"
                title="Cancelar cita"
              >
                <X className="w-3 h-3" />
                <span className="text-xs">Cancelar</span>
              </button>
            </>
          )}

          {appointment.status === 'confirmed' && (
            <>
              <button
                onClick={() => onStatusChange(appointment._id, 'completed')}
                className="flex items-center space-x-1 px-2 py-1 bg-purple-500/20 text-purple-400 rounded-md hover:bg-purple-500/30 transition-all duration-200 border border-purple-500/30"
                title="Marcar como completada"
              >
                <Check className="w-3 h-3" />
                <span className="text-xs">Completar</span>
              </button>
              <button
                onClick={() => onCancel(appointment._id)}
                className="flex items-center space-x-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/30 transition-all duration-200 border border-red-500/30"
                title="Cancelar cita"
              >
                <X className="w-3 h-3" />
                <span className="text-xs">Cancelar</span>
              </button>
            </>
          )}

          {appointment.status === 'cancelled' && appointment.cancellationReason && (
            <button
              onClick={() => onViewReason(appointment._id)}
              className="flex items-center space-x-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded-md hover:bg-blue-500/30 transition-all duration-200 border border-blue-500/30"
              title="Ver motivo de cancelación"
            >
              <Eye className="w-3 h-3" />
              <span className="text-xs">Ver Motivo</span>
            </button>
          )}

          {(appointment.status === 'completed' || appointment.status === 'cancelled') && (
            <button
              onClick={() => onDelete(appointment._id)}
              className="flex items-center space-x-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/30 transition-all duration-200 border border-red-500/30"
              title="Eliminar reporte de cita"
            >
              <Trash2 className="w-3 h-3" />
              <span className="text-xs">Eliminar</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const filteredAppointments = sortAppointmentsByPriority(
    appointments.filter(app => {
      if (filters.status !== 'all' && app.status !== filters.status) return false;
      if (filters.search) {
        const clientName = app.user?.name || app.client?.name || '';
        const barberName = app.barber?.name || '';
        const serviceName = app.service?.name || '';
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
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
        <div className="container mx-auto px-4 py-6 space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
                <BarChart3 className="w-5 h-5 text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-300 via-purple-300 to-blue-200 bg-clip-text text-transparent">
                Panel Administrativo
              </h1>
            </div>
            <p className="text-gray-400 text-sm">Gestión de Reservas y estadísticas</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
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
              gradient="from-purple-500/20 to-violet-500/20"
              borderColor="border-purple-500/30"
              textColor="text-purple-300"
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
          <div className="bg-gray-800/30 backdrop-blur-xl rounded-lg p-4 border border-white/10 shadow-lg">
            <div className="flex items-center space-x-2 mb-3">
              <Filter className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold bg-gradient-to-r from-blue-300 to-blue-100 bg-clip-text text-transparent">
                Filtros y Búsqueda
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({...prev, search: e.target.value}))}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                />
              </div>

              {/* Status Filter */}
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({...prev, status: e.target.value}))}
                className="px-3 py-2 text-sm bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="confirmed">Confirmadas</option>
                <option value="completed">Completadas</option>
                <option value="cancelled">Canceladas</option>
              </select>

              {/* Date Filter */}
              <select
                value={filters.date}
                onChange={(e) => setFilters(prev => ({...prev, date: e.target.value}))}
                className="px-3 py-2 text-sm bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
              >
                <option value="all">Todas las fechas</option>
                <option value="today">Hoy</option>
                <option value="week">Esta semana</option>
                <option value="month">Este mes</option>
              </select>
            </div>
          </div>

          {/* Appointments Grid */}
          <div className="bg-gray-800/30 backdrop-blur-xl rounded-lg p-4 border border-white/10 shadow-lg">
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-semibold bg-gradient-to-r from-purple-300 to-purple-100 bg-clip-text text-transparent">
                Lista de Citas ({filteredAppointments.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                <span className="ml-2 text-gray-400 text-sm">Cargando citas...</span>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No hay citas que coincidan con los filtros</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredAppointments.map(appointment => (
                  <AppointmentCard
                    key={appointment._id}
                    appointment={appointment}
                    onStatusChange={handleStatusChange}
                    onCancel={handleOpenCancelModal}
                    onViewReason={handleViewCancellationReason}
                    onDelete={handleDeleteAppointment}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Cancel Modal */}
          {showCancelModal && (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-3">
              <div className="bg-gray-800/90 backdrop-blur-xl rounded-lg p-4 border border-red-500/30 shadow-xl max-w-md w-full">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="p-1 rounded-lg bg-red-500/20 border border-red-500/30">
                    <XCircle className="w-4 h-4 text-red-400" />
                  </div>
                  <h3 className="text-base font-semibold text-white">Cancelar Cita</h3>
                </div>
                
                <p className="text-gray-300 mb-3 text-sm">
                  ¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer.
                </p>
                
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Motivo de cancelación (opcional)
                  </label>
                  <textarea
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="Ingresa el motivo de la cancelación..."
                    rows={2}
                    className="w-full px-2 py-1 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 resize-none text-sm"
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleCloseCancelModal}
                    className="flex-1 px-3 py-1 bg-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-600/50 transition-all duration-200 border border-gray-600/50 text-sm"
                  >
                    Mantener Cita
                  </button>
                  <GradientButton
                    onClick={handleSubmitCancellation}
                    variant="danger"
                    className="flex-1 px-3 py-1 text-sm"
                  >
                    Cancelar Cita
                  </GradientButton>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default AdminAppointment;
