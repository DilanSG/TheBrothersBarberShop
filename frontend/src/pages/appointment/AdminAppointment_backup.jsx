import React, { useState, useEffect } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { api, appointmentService } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
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
      acc[app.status]++;
      return acc;
    }, { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 });
    setStats(newStats);
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      if (newStatus === 'cancelled') {
        // Para cancelar, abrir modal con motivo (opcional para admin)
        handleOpenCancelModal(appointmentId);
        return;
      }

      const data = await api.put(`/appointments/${appointmentId}/status`, { 
        status: newStatus 
      });

      if (data.success) {
        showSuccess(`Cita ${newStatus === 'confirmed' ? 'confirmada' : newStatus === 'completed' ? 'completada' : 'cancelada'} exitosamente`);
        fetchAllAppointments();
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error al cambiar el estado de la cita');
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este reporte de cita? No podrás volver a ver esta información.')) {
      return;
    }

    try {
      const data = await appointmentService.deleteAppointment(appointmentId);
      if (data.success) {
        showSuccess('Reporte de cita eliminado exitosamente');
        fetchAllAppointments();
      }
    } catch (error) {
      console.error('Error:', error);
      showError(error.message || 'Error al eliminar el reporte de cita');
    }
  };

  // Open cancel modal - Admins pueden cancelar con o sin motivo
  const handleOpenCancelModal = (appointmentId) => {
    setCancelAppointmentId(appointmentId);
    setCancellationReason('');
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
      const data = await api.put(`/appointments/${cancelAppointmentId}/cancel`, {
        reason: cancellationReason.trim() || undefined
      });

      if (data.success) {
        showSuccess('Cita cancelada exitosamente por administración.');
        fetchAllAppointments();
        handleCloseCancelModal();
      } else {
        showError(data.message || 'Error al cancelar la cita');
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
    const statusPriority = {
      'completed': 1,    // Prioridad más alta
      'confirmed': 2,
      'pending': 3,
      'cancelled': 4     // Prioridad más baja
    };

    return appointments.sort((a, b) => {
      const priorityA = statusPriority[a.status] || 999;
      const priorityB = statusPriority[b.status] || 999;
      
      // Si tienen la misma prioridad, ordenar por fecha (más recientes primero)
      if (priorityA === priorityB) {
        return new Date(b.date) - new Date(a.date);
      }
      
      return priorityA - priorityB;
    });
  };

  const StatCard = ({ title, value, icon: Icon, gradient, borderColor, textColor }) => (
    <div className={`bg-gradient-to-br ${gradient} backdrop-blur-xl rounded-xl p-6 border ${borderColor} shadow-xl hover:shadow-2xl transition-all duration-300 group`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className={`${textColor} text-3xl font-bold mt-2 group-hover:scale-105 transition-transform duration-200`}>{value}</p>
        </div>
        <div className={`p-3 bg-gradient-to-br ${gradient} rounded-xl border ${borderColor}`}>
          <Icon className={`w-6 h-6 ${textColor}`} />
        </div>
      </div>
    </div>
  );

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
      <div className="bg-gray-800/40 backdrop-blur-xl rounded-xl p-6 border border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 group">
        <div className="flex items-start justify-between mb-4">
          {/* Status Badge */}
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gradient-to-r ${getStatusColor(appointment.status)} border`}>
            {getStatusIcon(appointment.status)}
            <span className="text-sm font-medium text-white">
              {getStatusText(appointment.status)}
            </span>
          </div>

          {/* Priority Indicator */}
          {appointment.status === 'pending' && (
            <div className="px-2 py-1 bg-amber-500/20 border border-amber-500/30 rounded-lg">
              <span className="text-xs font-medium text-amber-300">Requiere Atención</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Client Info */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-400">Cliente</span>
            </div>
            <p className="text-white font-medium">
              {appointment.user?.name || appointment.client?.name || 'N/A'}
            </p>
          </div>

          {/* Barber Info */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Scissors className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400">Barbero</span>
            </div>
            <p className="text-white font-medium">
              {appointment.barber?.name || 'N/A'}
            </p>
          </div>

          {/* Service Info */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-400">Servicio</span>
            </div>
            <p className="text-white font-medium">
              {appointment.service?.name || 'N/A'}
            </p>
          </div>

          {/* Date/Time Info */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-gray-400">Fecha</span>
            </div>
            <p className="text-white font-medium">
              {format(new Date(appointment.date), "d MMM", { locale: es })}
            </p>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-gray-400">
                {format(new Date(appointment.date), "HH:mm")}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-700/50">
          {appointment.status === 'pending' && (
            <>
              <button
                onClick={() => onStatusChange(appointment._id, 'confirmed')}
                className="flex items-center space-x-1 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all duration-200 border border-green-500/30"
                title="Confirmar cita"
              >
                <Check className="w-4 h-4" />
                <span className="text-sm">Confirmar</span>
              </button>
              <button
                onClick={() => onCancel(appointment._id)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all duration-200 border border-red-500/30"
                title="Cancelar cita"
              >
                <X className="w-4 h-4" />
                <span className="text-sm">Cancelar</span>
              </button>
            </>
          )}

          {appointment.status === 'confirmed' && (
            <>
              <button
                onClick={() => onStatusChange(appointment._id, 'completed')}
                className="flex items-center space-x-1 px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-all duration-200 border border-purple-500/30"
                title="Marcar como completada"
              >
                <Check className="w-4 h-4" />
                <span className="text-sm">Completar</span>
              </button>
              <button
                onClick={() => onCancel(appointment._id)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all duration-200 border border-red-500/30"
                title="Cancelar cita"
              >
                <X className="w-4 h-4" />
                <span className="text-sm">Cancelar</span>
              </button>
            </>
          )}

          {appointment.status === 'cancelled' && appointment.cancellationReason && (
            <button
              onClick={() => onViewReason(appointment._id)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all duration-200 border border-blue-500/30"
              title="Ver motivo de cancelación"
            >
              <Eye className="w-4 h-4" />
              <span className="text-sm">Ver Motivo</span>
            </button>
          )}

          {(appointment.status === 'completed' || appointment.status === 'cancelled') && (
            <button
              onClick={() => onDelete(appointment._id)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all duration-200 border border-red-500/30"
              title="Eliminar reporte de cita"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm">Eliminar</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <PageContainer>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
        <div className="container mx-auto px-4 py-8 space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
                <BarChart3 className="w-8 h-8 text-blue-400" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-300 via-purple-300 to-blue-200 bg-clip-text text-transparent">
                Panel Administrativo
              </h1>
            </div>
            <p className="text-gray-400 text-lg">Gestión completa de citas y estadísticas</p>
          </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          <StatCard
            title="Total Citas"
            value={stats.total}
            color="blue"
            icon={(props) => (
              <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            )}
          />
          <StatCard
            title="Pendientes"
            value={stats.pending}
            color="yellow"
            icon={(props) => (
              <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          />
          <StatCard
            title="Confirmadas"
            value={stats.confirmed}
            color="green"
            icon={(props) => (
              <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          />
          <StatCard
            title="Completadas"
            value={stats.completed}
            color="purple"
            icon={(props) => (
              <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          />
          <StatCard
            title="Canceladas"
            value={stats.cancelled}
            color="red"
            icon={(props) => (
              <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          />
        </div>

        {/* Filters */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 mb-8">
          <div className="flex flex-wrap gap-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="bg-gray-800 text-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="confirmed">Confirmadas</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
            </select>

            <input
              type="text"
              placeholder="Buscar por cliente, barbero o servicio..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="bg-gray-800 text-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
            />
          </div>
        </div>

        {/* Appointments Table */}
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-300">
                Lista de Citas ({filteredAppointments.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-800">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Barbero</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Servicio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredAppointments.map(appointment => (
                    <tr key={appointment._id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{appointment.user?.name || appointment.client?.name || 'Cliente'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{appointment.barber?.name || 'Barbero'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{appointment.service?.name || 'Servicio'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {format(new Date(appointment.date), "d 'de' MMMM", { locale: es })}
                          <br />
                          <span className="text-gray-400">{format(new Date(appointment.date), "HH:mm", { locale: es })}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={appointment.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {appointment.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleStatusChange(appointment._id, 'confirmed')}
                              className="text-green-400 hover:text-green-300 transition-colors"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => handleStatusChange(appointment._id, 'cancelled')}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        )}
                        {appointment.status === 'confirmed' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleStatusChange(appointment._id, 'completed')}
                              className="text-purple-400 hover:text-purple-300 transition-colors"
                            >
                              Completar
                            </button>
                            <button
                              onClick={() => handleStatusChange(appointment._id, 'cancelled')}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        )}
                        {(appointment.status === 'completed' || appointment.status === 'cancelled') && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 text-xs">
                              {appointment.status === 'completed' ? 'Finalizada' : 'Cancelada'}
                            </span>
                            {appointment.status === 'cancelled' && appointment.cancellationReason && (
                              <button
                                onClick={() => handleViewCancellationReason(appointment._id)}
                                className="text-blue-400 hover:text-blue-300 transition-colors p-1 rounded"
                                title="Ver motivo de cancelación"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteAppointment(appointment._id)}
                              className="text-red-400 hover:text-red-300 transition-colors p-1 rounded"
                              title="Eliminar reporte de cita"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Cancel with Reason Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold mb-4 text-white">Cancelar Cita (Admin)</h3>
              <p className="text-gray-400 mb-4">
                Como administrador, puede proporcionar un motivo opcional para la cancelación.
              </p>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Motivo de cancelación (opcional)..."
                className="w-full h-32 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500"
                maxLength={500}
              />
              <div className="text-right text-sm text-gray-400 mb-4">
                {cancellationReason.split(' ').filter(word => word.length > 0).length}/100 palabras
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={handleCloseCancelModal}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitCancellation}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Cancelar Cita
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </PageContainer>
  );
};

const StatusBadge = ({ status }) => {
  const statusStyles = {
    pending: 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30',
    confirmed: 'bg-green-600/20 text-green-400 border-green-500/30',
    cancelled: 'bg-red-600/20 text-red-400 border-red-500/30',
    completed: 'bg-purple-600/20 text-purple-400 border-purple-500/30'
  };

  const statusText = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    cancelled: 'Cancelada',
    completed: 'Completada'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyles[status]} border`}>
      {statusText[status]}
    </span>
  );
};

export default AdminAppointment;
