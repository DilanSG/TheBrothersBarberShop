import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageContainer } from '@components/layout/PageContainer';
import { useAuth } from '@contexts/AuthContext';
import { appointmentService, serviceService, barberService } from '@services/api';
import { useNotification } from '@contexts/NotificationContext';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import GradientButton from '@components/ui/GradientButton';
import GradientText from '@components/ui/GradientText';
import { Calendar, Clock, User, Scissors, ArrowLeft, Save } from 'lucide-react';

/**
 * Componente para editar una cita existente
 * Ruta: /appointment/edit/:id
 */
const AppointmentEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  // Estados del formulario
  const [appointment, setAppointment] = useState(null);
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Estados del formulario de edición
  const [selectedService, setSelectedService] = useState('');
  const [selectedBarber, setSelectedBarber] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  // Cargar datos iniciales
  useEffect(() => {
    if (id && user) {
      loadAppointmentData();
      fetchServices();
      fetchBarbers();
    }
  }, [id, user]);

  // Cargar horarios cuando cambian fecha y barbero
  useEffect(() => {
    if (selectedDate && selectedBarber && appointment) {
      fetchAvailableTimes();
    }
  }, [selectedDate, selectedBarber, appointment]);

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

      // Verificar permisos (solo el usuario propietario puede editar)
      if (appointmentData.user._id !== user._id && user.role !== 'admin') {
        showError('No tienes permisos para editar esta cita');
        navigate('/appointment');
        return;
      }

      setAppointment(appointmentData);
      
      // Establecer valores iniciales del formulario
      setSelectedService(appointmentData.service._id);
      setSelectedBarber(appointmentData.barber._id);
      setSelectedDate(format(new Date(appointmentData.date), 'yyyy-MM-dd'));
      setSelectedTime(appointmentData.time);

    } catch (error) {
      console.error('Error loading appointment:', error);
      showError('Error al cargar los datos de la cita');
      navigate('/appointment');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await serviceService.getServices();
      setServices(response.data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      showError('Error al cargar los servicios');
    }
  };

  const fetchBarbers = async () => {
    try {
      const response = await barberService.getBarbers();
      setBarbers(response.data || []);
    } catch (error) {
      console.error('Error fetching barbers:', error);
      showError('Error al cargar los barberos');
    }
  };

  const fetchAvailableTimes = async () => {
    try {
      const response = await appointmentService.getAvailableTimes(
        selectedBarber,
        selectedDate
      );
      
      // Incluir el horario actual de la cita en las opciones disponibles
      const currentTime = appointment.time;
      const availableOptions = response.data || [];
      
      if (!availableOptions.includes(currentTime)) {
        availableOptions.push(currentTime);
        availableOptions.sort();
      }
      
      setAvailableTimes(availableOptions);
    } catch (error) {
      console.error('Error fetching available times:', error);
      setAvailableTimes([appointment.time]); // Mantener al menos el horario actual
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime) {
      showError('Por favor completa todos los campos');
      return;
    }

    try {
      setSubmitting(true);
      
      const updateData = {
        service: selectedService,
        barber: selectedBarber,
        date: selectedDate,
        time: selectedTime
      };

      await appointmentService.updateAppointment(id, updateData);
      showSuccess('Cita actualizada exitosamente');
      navigate('/appointment');
      
    } catch (error) {
      console.error('Error updating appointment:', error);
      const errorMessage = error.response?.data?.message || 'Error al actualizar la cita';
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/appointment');
  };

  // Obtener el mínimo de fecha (hoy)
  const today = format(new Date(), 'yyyy-MM-dd');

  if (loading) {
    return (
      <PageContainer>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-300">Cargando datos de la cita...</p>
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

  return (
    <PageContainer>
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 space-y-8">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/20 shadow-xl shadow-blue-500/20">
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
            </div>
            <GradientText className="text-xl sm:text-2xl lg:text-3xl font-bold">
              Editar Cita
            </GradientText>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-transparent border border-white/10 rounded-2xl backdrop-blur-sm shadow-2xl shadow-blue-500/20">
          <div className="p-6 lg:p-8">
            
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Información actual de la cita */}
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mb-6">
                <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center gap-2">
                  <Info size={18} />
                  Información Actual
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Servicio:</span>
                    <p className="text-white font-medium">{appointment.service?.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Barbero:</span>
                    <p className="text-white font-medium">{appointment.barber?.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Fecha:</span>
                    <p className="text-white font-medium">
                      {format(new Date(appointment.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Hora:</span>
                    <p className="text-white font-medium">{appointment.time}</p>
                  </div>
                </div>
              </div>

              {/* Selección de servicio */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Scissors className="inline w-4 h-4 mr-2" />
                  Servicio
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="glassmorphism-select"
                  required
                >
                  <option value="">Seleccionar servicio</option>
                  {services.map(service => (
                    <option key={service._id} value={service._id}>
                      {service.name} - ${service.price}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selección de barbero */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <User className="inline w-4 h-4 mr-2" />
                  Barbero
                </label>
                <select
                  value={selectedBarber}
                  onChange={(e) => setSelectedBarber(e.target.value)}
                  className="glassmorphism-select"
                  required
                >
                  <option value="">Seleccionar barbero</option>
                  {barbers.map(barber => (
                    <option key={barber._id} value={barber._id}>
                      {barber.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selección de fecha */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Calendar className="inline w-4 h-4 mr-2" />
                  Fecha
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={today}
                  className="glassmorphism-input"
                  required
                />
              </div>

              {/* Selección de hora */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Clock className="inline w-4 h-4 mr-2" />
                  Hora
                </label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="glassmorphism-select"
                  required
                  disabled={!selectedDate || !selectedBarber || availableTimes.length === 0}
                >
                  <option value="">Seleccionar hora</option>
                  {availableTimes.map(time => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
                {selectedDate && selectedBarber && availableTimes.length === 0 && (
                  <p className="mt-2 text-sm text-yellow-400">
                    Cargando horarios disponibles...
                  </p>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <GradientButton
                  type="button"
                  onClick={handleCancel}
                  variant="secondary"
                  size="md"
                  className="shadow-xl shadow-blue-500/20 flex-1"
                >
                  <div className="flex items-center justify-center gap-2">
                    <ArrowLeft size={18} />
                    <span>Cancelar</span>
                  </div>
                </GradientButton>
                
                <GradientButton
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={submitting || !selectedService || !selectedBarber || !selectedDate || !selectedTime}
                  className="shadow-xl shadow-blue-500/20 flex-1"
                >
                  <div className="flex items-center justify-center gap-2">
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Actualizando...</span>
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        <span>Guardar Cambios</span>
                      </>
                    )}
                  </div>
                </GradientButton>
              </div>
              
            </form>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default AppointmentEdit;
