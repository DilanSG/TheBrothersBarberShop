import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageContainer } from '@components/layout/PageContainer';
import { useAuth } from '@contexts/AuthContext';
import { appointmentService } from '@services/api';
import { useNotification } from '@contexts/NotificationContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import GradientButton from '@components/ui/GradientButton';
import GradientText from '@components/ui/GradientText';
import { 
  Calendar, 
  Clock, 
  User, 
  Scissors,
  ArrowLeft, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Phone,
  Mail,
  DollarSign
} from 'lucide-react';

// Formatear precio
const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price || 0);
};

/**
 * Componente para ver el detalle completo de una cita
 * Ruta: /appointment/view/:id
 */
const AppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id && user) {
      loadAppointmentData();
    }
  }, [id, user]);

  // Bloquear scroll del body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const loadAppointmentData = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getAppointments();
      const appointmentData = response.data.find(app => app._id === id);
      
      if (!appointmentData) {
        showError('Cita no encontrada');
        navigate('/appointment');
        return;
      }

      // Verificar permisos de acceso
      const hasAccess = 
        appointmentData.user._id === user._id || // Propietario
        user.role === 'admin' || // Admin
        (user.role === 'barber' && appointmentData.barber._id === user._id); // Barbero asignado

      if (!hasAccess) {
        showError('No tienes permisos para ver esta cita');
        navigate('/appointment');
        return;
      }

      setAppointment(appointmentData);
    } catch (error) {
      console.error('Error loading appointment:', error);
      showError('Error al cargar los datos de la cita');
      navigate('/appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus, reason = '') => {
    if (!appointment) return;

    try {
      setActionLoading(true);
      
      const updateData = { 
        status: newStatus,
        ...(reason && { cancellationReason: reason })
      };

      await appointmentService.updateAppointment(appointment._id, updateData);
      
      const statusMessages = {
        confirmed: 'Cita confirmada exitosamente',
        cancelled: 'Cita cancelada exitosamente',
        completed: 'Cita marcada como completada'
      };

      showSuccess(statusMessages[newStatus] || 'Estado actualizado');
      
      // Recargar datos
      await loadAppointmentData();
      
    } catch (error) {
      console.error('Error updating appointment status:', error);
      const errorMessage = error.response?.data?.message || 'Error al actualizar el estado';
      showError(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/appointment/edit/${appointment._id}`);
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta cita? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setActionLoading(true);
      await appointmentService.deleteAppointment(appointment._id);
      showSuccess('Cita eliminada exitosamente');
      navigate('/appointment');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      const errorMessage = error.response?.data?.message || 'Error al eliminar la cita';
      showError(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        color: 'text-yellow-300',
        bg: 'bg-yellow-500/20',
        border: 'border-yellow-500/40',
        icon: AlertCircle,
        label: 'Pendiente'
      },
      confirmed: {
        color: 'text-green-300',
        bg: 'bg-green-500/20',
        border: 'border-green-500/40',
        icon: CheckCircle,
        label: 'Confirmada'
      },
      cancelled: {
        color: 'text-red-300',
        bg: 'bg-red-500/20',
        border: 'border-red-500/40',
        icon: XCircle,
        label: 'Cancelada'
      },
      completed: {
        color: 'text-blue-300',
        bg: 'bg-blue-500/20',
        border: 'border-blue-500/40',
        icon: CheckCircle,
        label: 'Completada'
      }
    };
    return configs[status] || configs.pending;
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-300">Cargando detalles de la cita...</p>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!appointment) {
    return (
      <PageContainer>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <div className="text-center">
            <p className="text-gray-300">Cita no encontrada</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  const statusConfig = getStatusConfig(appointment.status);
  const StatusIcon = statusConfig.icon;

  return (
    <PageContainer>
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 space-y-8">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className={`p-3 rounded-xl border shadow-xl shadow-blue-500/20 ${statusConfig.bg} ${statusConfig.border}`}>
              <StatusIcon className={`w-6 h-6 sm:w-8 sm:h-8 ${statusConfig.color}`} />
            </div>
            <GradientText className="text-xl sm:text-2xl lg:text-3xl font-bold">
              Detalle de Cita
            </GradientText>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="bg-transparent border border-white/10 rounded-2xl backdrop-blur-sm shadow-2xl shadow-blue-500/20">
          <div className="p-6 lg:p-8">
            
            {/* Estado de la cita */}
            <div className={`flex items-center justify-center gap-3 p-4 rounded-xl mb-6 ${statusConfig.bg} ${statusConfig.border}`}>
              <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
              <span className={`text-lg font-semibold ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>

            {/* Información principal */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              
              {/* Información de la cita */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-300 mb-4 flex items-center gap-2">
                  <Calendar size={18} />
                  Información de la Cita
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Scissors className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-400">Servicio</p>
                      <p className="text-white font-medium">{appointment.service?.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-400">Fecha</p>
                      <p className="text-white font-medium">
                        {format(new Date(appointment.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-400">Hora</p>
                      <p className="text-white font-medium">{appointment.time}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-400">Precio</p>
                      <p className="text-white font-medium">{formatPrice(appointment.service?.price)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información del barbero */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-purple-300 mb-4 flex items-center gap-2">
                  <User size={18} />
                  Información del Barbero
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-400">Nombre</p>
                      <p className="text-white font-medium">{appointment.barber?.name}</p>
                    </div>
                  </div>
                  
                  {appointment.barber?.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-400">Teléfono</p>
                        <p className="text-white font-medium">{appointment.barber.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {appointment.barber?.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-400">Email</p>
                        <p className="text-white font-medium">{appointment.barber.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Información adicional */}
            {(appointment.notes || appointment.cancellationReason) && (
              <div className="border-t border-white/10 pt-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-300 mb-4">
                  Información Adicional
                </h3>
                
                {appointment.notes && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-1">Notas:</p>
                    <p className="text-white">{appointment.notes}</p>
                  </div>
                )}
                
                {appointment.cancellationReason && (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                    <p className="text-sm text-red-400 mb-1">Motivo de cancelación:</p>
                    <p className="text-red-300">{appointment.cancellationReason}</p>
                  </div>
                )}
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/10">
              
              {/* Botón volver */}
              <GradientButton
                onClick={() => navigate('/appointment')}
                variant="secondary"
                size="md"
                className="shadow-xl shadow-blue-500/20"
              >
                <div className="flex items-center justify-center gap-2">
                  <ArrowLeft size={18} />
                  <span>Volver</span>
                </div>
              </GradientButton>

              {/* Acciones según rol y estado */}
              {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                <>
                  {(user.role === 'admin' || appointment.user._id === user._id) && (
                    <GradientButton
                      onClick={handleEdit}
                      variant="primary"
                      size="md"
                      disabled={actionLoading}
                      className="shadow-xl shadow-blue-500/20"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Edit size={18} />
                        <span>Editar</span>
                      </div>
                    </GradientButton>
                  )}

                  {(user.role === 'admin' || user.role === 'barber') && appointment.status === 'pending' && (
                    <GradientButton
                      onClick={() => handleStatusChange('confirmed')}
                      variant="primary"
                      size="md"
                      disabled={actionLoading}
                      className="shadow-xl shadow-green-500/20 bg-gradient-to-r from-green-600/20 to-green-700/20 hover:from-green-600/30 hover:to-green-700/30"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle size={18} />
                        <span>Confirmar</span>
                      </div>
                    </GradientButton>
                  )}
                </>
              )}

              {/* Botón eliminar (solo admin) */}
              {user.role === 'admin' && (
                <GradientButton
                  onClick={handleDelete}
                  variant="secondary"
                  size="md"
                  disabled={actionLoading}
                  className="shadow-xl shadow-red-500/20 bg-gradient-to-r from-red-600/20 to-red-700/20 hover:from-red-600/30 hover:to-red-700/30 border-red-500/30"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Trash2 size={18} />
                    <span>Eliminar</span>
                  </div>
                </GradientButton>
              )}
            </div>

          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default AppointmentDetail;
