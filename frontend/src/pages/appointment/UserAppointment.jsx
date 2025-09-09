import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { useAuth } from '../../contexts/AuthContext';
import { api, appointmentService, serviceService, barberService } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { format, parse, isAfter, isBefore, startOfDay, isSameDay, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import '../../styles/dayPicker.css';
import GradientButton from '../../components/ui/GradientButton';
import { Calendar, Clock, User, Scissors, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

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

const UserAppointment = () => {
  const [searchParams] = useSearchParams();
  const [appointments, setAppointments] = useState([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancelId, setCancelId] = useState(null);
  const [selectedService, setSelectedService] = useState('');
  const [selectedBarber, setSelectedBarber] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDateObj, setSelectedDateObj] = useState(null); // Para el DayPicker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [availabilityReason, setAvailabilityReason] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');
  
  // Estados para cancelación con motivo
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelAppointmentId, setCancelAppointmentId] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  // Cargar datos iniciales
  useEffect(() => {
    console.log('Component mounted, user:', user);
    fetchAppointments();
    fetchServices();
    fetchBarbers();
  }, [user]);

  // Efecto para monitorear cambios en services y barbers
  useEffect(() => {
    console.log('🔄 Services state changed:', services);
  }, [services]);

  useEffect(() => {
    console.log('🔄 Barbers state changed:', barbers);
  }, [barbers]);

  // Manejar barberId desde URL params
  useEffect(() => {
    const barberId = searchParams.get('barberId');
    if (barberId && barbers.length > 0) {
      // Verificar que el barbero existe en la lista
      const barberExists = barbers.find(b => b._id === barberId);
      if (barberExists) {
        setSelectedBarber(barberId);
      }
    }
  }, [searchParams, barbers]);

  // Cargar horarios cuando se selecciona fecha y barbero
  useEffect(() => {
    if (selectedDate && selectedBarber) {
      console.log('🔄 Date or barber changed, fetching available times');
      fetchAvailableTimes();
    } else {
      console.log('🔄 Clearing available times - missing date or barber');
      setAvailableTimes([]);
      setSelectedTime('');
    }
  }, [selectedDate, selectedBarber]);

  // Limpiar tiempo seleccionado si ya no está disponible
  useEffect(() => {
    if (selectedTime && availableTimes.length > 0) {
      const isTimeStillAvailable = availableTimes.some(timeSlot => 
        typeof timeSlot === 'object' ? timeSlot.datetime === selectedTime : timeSlot === selectedTime
      );
      if (!isTimeStillAvailable) {
        console.log('🔄 Selected time no longer available, clearing selection');
        setSelectedTime('');
      }
    }
  }, [availableTimes, selectedTime]);

  // Monitorear estado del botón de envío
  useEffect(() => {
    const isButtonDisabled = submitting || !selectedService || !selectedBarber || !selectedDate || !selectedTime;
    console.log('🎯 Button state check:', {
      submitting,
      selectedService: !!selectedService,
      selectedBarber: !!selectedBarber, 
      selectedDate: !!selectedDate,
      selectedTime: !!selectedTime,
      isButtonDisabled
    });
  }, [submitting, selectedService, selectedBarber, selectedDate, selectedTime]);

  const fetchAppointments = async () => {
    if (!user?._id) return;
    
    try {
      setLoading(true);
      const response = await appointmentService.getAppointments();
      if (response.success) {
        setAppointments(response.data || []);
      } else {
        setError(response.message || 'Error al cargar las citas');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Error al cargar las citas');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      console.log('Fetching services...');
      const response = await serviceService.getAllServices();
      console.log('Services response:', response);
      
      // Manejar diferentes estructuras de respuesta
      if (response.success) {
        setServices(response.data || []);
        console.log('Services loaded (success):', response.data);
      } else if (response.data && response.data.success) {
        setServices(response.data.data || []);
        console.log('Services loaded (data.success):', response.data.data);
      } else if (Array.isArray(response.data)) {
        setServices(response.data);
        console.log('Services loaded (array):', response.data);
      } else if (Array.isArray(response)) {
        setServices(response);
        console.log('Services loaded (direct array):', response);
      } else {
        console.warn('Unexpected services response format:', response);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchBarbers = async () => {
    try {
      console.log('Fetching barbers...');
      const response = await barberService.getAllBarbers();
      console.log('Barbers response:', response);
      
      // Manejar diferentes estructuras de respuesta
      if (response.success) {
        setBarbers(response.data || []);
        console.log('Barbers loaded (success):', response.data);
      } else if (response.data && response.data.success) {
        setBarbers(response.data.data || []);
        console.log('Barbers loaded (data.success):', response.data.data);
      } else if (Array.isArray(response.data)) {
        setBarbers(response.data);
        console.log('Barbers loaded (array):', response.data);
      } else if (Array.isArray(response)) {
        setBarbers(response);
        console.log('Barbers loaded (direct array):', response);
      } else {
        console.warn('Unexpected barbers response format:', response);
      }
    } catch (error) {
      console.error('Error fetching barbers:', error);
    }
  };

  const fetchAvailableTimes = async () => {
    if (!selectedDate || !selectedBarber) return;
    
    try {
      console.log('🕐 Fetching available times for:', { selectedBarber, selectedDate });
      const response = await appointmentService.getAvailableTimes(selectedBarber, selectedDate);
      console.log('🕐 Available times response:', response);
      
      let timesArray = [];
      
      if (response.success && response.data && Array.isArray(response.data.slots)) {
        timesArray = response.data.slots;
        setAvailabilityReason(response.data.reason || '');
        console.log('🕐 Available times loaded (slots):', response.data.slots);
        console.log('🕐 Barber name:', response.data.barber);
        console.log('🕐 Date:', response.data.date);
        if (response.data.reason) {
          console.log('🕐 Reason:', response.data.reason);
        }
      } else if (response.data && response.data.success && Array.isArray(response.data.data)) {
        timesArray = response.data.data;
        console.log('Available times loaded (nested success + array):', response.data.data);
      } else if (Array.isArray(response.data)) {
        timesArray = response.data;
        console.log('Available times loaded (direct array):', response.data);
      } else if (Array.isArray(response)) {
        timesArray = response;
        console.log('Available times loaded (response is array):', response);
      } else {
        console.warn('Available times response structure unexpected:', response);
        timesArray = [];
      }
      
      setAvailableTimes(timesArray);
      console.log('🕐 Final available times set:', timesArray);
    } catch (error) {
      console.error('❌ Error fetching available times:', error);
      setAvailableTimes([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🚀 Submit button clicked! Form state:', {
      selectedService,
      selectedBarber,
      selectedDate,
      selectedTime,
      submitting
    });
    
    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime) {
      console.log('❌ Missing required fields');
      setError('Por favor completa todos los campos');
      return;
    }

    // Verificar que el tiempo seleccionado está disponible
    const isTimeAvailable = availableTimes.some(timeSlot => 
      typeof timeSlot === 'object' ? timeSlot.datetime === selectedTime : timeSlot === selectedTime
    );
    
    console.log('🔍 Validating time availability:', {
      selectedTime,
      availableTimes,
      isTimeAvailable
    });
    
    if (!isTimeAvailable) {
      setError('El horario seleccionado ya no está disponible');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const appointmentData = {
        serviceId: selectedService,
        barberId: selectedBarber,
        date: selectedTime  // selectedTime ahora contiene el datetime completo
      };

      console.log('📤 Sending appointment data:', appointmentData);

      const response = await appointmentService.createAppointment(appointmentData);
      
      if (response.success) {
        setSuccess('Cita agendada exitosamente. El barbero confirmará tu cita pronto.');
        showSuccess('Cita agendada exitosamente');
        
        // Limpiar formulario
        setSelectedService('');
        setSelectedBarber('');
        setSelectedDate('');
        setSelectedTime('');
        setAvailableTimes([]);
        
        // Recargar citas
        await fetchAppointments();
      } else {
        throw new Error(response.message || 'Error al agendar la cita');
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error al agendar la cita';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelId) return;

    try {
      const response = await appointmentService.cancelAppointment(cancelId);
      if (response.success) {
        showSuccess('Cita cancelada exitosamente');
        setCancelId(null);
        await fetchAppointments();
      } else {
        showError(response.message || 'Error al cancelar la cita');
      }
    } catch (error) {
      console.error('Error canceling appointment:', error);
      showError('Error al cancelar la cita');
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar el reporte de esta cita?')) {
      return;
    }

    try {
      const response = await appointmentService.deleteAppointment(appointmentId);
      if (response.success) {
        showSuccess('Reporte de cita eliminado exitosamente');
        await fetchAppointments();
      } else {
        showError(response.message || 'Error al eliminar el reporte de la cita');
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      showError('Error al eliminar el reporte de la cita');
    }
  };

  // Funciones para modal de cancelación con motivo
  const handleOpenCancelModal = (appointmentId) => {
    setCancelAppointmentId(appointmentId);
    setShowCancelModal(true);
    setCancellationReason('');
  };

  const handleCloseCancelModal = () => {
    setShowCancelModal(false);
    setCancelAppointmentId(null);
    setCancellationReason('');
  };

  const handleSubmitCancellation = async () => {
    if (!cancellationReason.trim()) {
      showError('Debe proporcionar un motivo para la cancelación');
      return;
    }

    const wordCount = cancellationReason.split(' ').filter(word => word.length > 0).length;
    if (wordCount > 100) {
      showError('El motivo no puede exceder las 100 palabras');
      return;
    }

    try {
      const response = await appointmentService.cancelAppointment(cancelAppointmentId, cancellationReason);
      if (response.success) {
        showSuccess('Cita cancelada exitosamente. El barbero ha sido notificado.');
        handleCloseCancelModal();
        await fetchAppointments();
      } else {
        showError(response.message || 'Error al cancelar la cita');
      }
    } catch (error) {
      console.error('Error canceling confirmed appointment:', error);
      showError('Error al cancelar la cita');
    }
  };

  const handleViewCancellationReason = (appointmentId) => {
    const appointment = appointments.find(apt => apt._id === appointmentId);
    if (appointment && appointment.cancellationReason) {
      alert(`Motivo de cancelación: ${appointment.cancellationReason}`);
    }
  };

  // Filtrar citas según la pestaña activa
  const filteredAppointments = useMemo(() => {
    if (!appointments.length) return [];

    const now = new Date();
    
    if (activeTab === 'upcoming') {
      return appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return (apt.status === 'pending' || apt.status === 'confirmed') && 
               (isAfter(aptDate, now) || isSameDay(aptDate, now));
      });
    } else {
      return appointments.filter(apt => 
        apt.status === 'completed' || 
        apt.status === 'cancelled' ||
        (apt.status !== 'completed' && apt.status !== 'cancelled' && isBefore(new Date(apt.date), startOfDay(now)))
      );
    }
  }, [appointments, activeTab]);

  // Obtener fecha mínima (hoy) y configuración para el DayPicker
  const today = new Date();
  const minDate = format(today, 'yyyy-MM-dd');
  const maxDate = addDays(today, 30); // Permitir reservas hasta 30 días en el futuro
  
  // Función para manejar la selección de fecha del DayPicker
  const handleDateSelect = (date) => {
    if (date) {
      setSelectedDateObj(date);
      setSelectedDate(format(date, 'yyyy-MM-dd'));
      setShowDatePicker(false);
      console.log('📅 Fecha seleccionada:', format(date, 'yyyy-MM-dd'));
    }
  };

  // Deshabilitar fechas pasadas y domingos (ejemplo)
  const disabledDays = [
    { before: today },
    { after: maxDate },
    { dayOfWeek: [0] } // Deshabilitar domingos (0 = domingo)
  ];

  return (
    <PageContainer>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          
          {/* Grid de 2 columnas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Formulario de Nueva Cita */}
            <div className="bg-gray-800/20 backdrop-blur-xl rounded-xl p-6 border border-white/10 shadow-xl">
              <div className="flex items-center space-x-2 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                  <Calendar className="w-5 h-5 text-blue-400" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  Agendar Nueva Cita
                </h1>
              </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Service Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <div className="flex items-center space-x-2">
                    <Scissors className="w-4 h-4 text-purple-400" />
                    <span className="bg-gradient-to-r from-purple-300 to-purple-100 bg-clip-text text-transparent">Servicio</span>
                  </div>
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => {
                    console.log('Service selected:', e.target.value);
                    setSelectedService(e.target.value);
                  }}
                  className="w-full h-10 px-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all duration-200"
                  required
                >
                  <option value="">Selecciona un servicio</option>
                  {services.length === 0 ? (
                    <option disabled>Cargando servicios...</option>
                  ) : (
                    services.map(service => (
                      <option key={service._id} value={service._id}>
                        {service.name} - ${service.price}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Barber Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-blue-400" />
                    <span className="bg-gradient-to-r from-blue-300 to-blue-100 bg-clip-text text-transparent">Barbero</span>
                  </div>
                </label>
                <select
                  value={selectedBarber}
                  onChange={(e) => {
                    console.log('Barber selected:', e.target.value);
                    setSelectedBarber(e.target.value);
                  }}
                  className="w-full h-10 px-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50 transition-all duration-200"
                  required
                >
                  <option value="">Selecciona un barbero</option>
                  {barbers.length === 0 ? (
                    <option disabled>Cargando barberos...</option>
                  ) : (
                    barbers.map(barber => (
                      <option key={barber._id} value={barber._id}>
                        {barber.user?.name || barber.name || 'Barbero'}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Date Selection with DayPicker */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-green-400" />
                    <span className="bg-gradient-to-r from-green-300 to-green-100 bg-clip-text text-transparent">Fecha</span>
                  </div>
                </label>
                
                {/* Input que muestra la fecha seleccionada y abre el picker */}
                <div className="relative">
                  <input
                    type="text"
                    value={selectedDate ? format(new Date(selectedDate), 'dd/MM/yyyy', { locale: es }) : ''}
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    placeholder="Selecciona una fecha"
                    className="w-full h-10 px-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-green-500/50 transition-all duration-200 cursor-pointer"
                    readOnly
                    required
                  />
                  
                  {/* DayPicker Popup */}
                  {showDatePicker && (
                    <div className="absolute top-full left-0 mt-2 z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-4">
                      <DayPicker
                        mode="single"
                        selected={selectedDateObj}
                        onSelect={handleDateSelect}
                        disabled={disabledDays}
                        locale={es}
                        className="rdp-custom"
                        style={{
                          '--rdp-cell-size': '35px',
                          '--rdp-accent-color': '#10b981',
                          '--rdp-background-color': '#1f2937',
                          '--rdp-accent-color-dark': '#059669',
                          '--rdp-background-color-dark': '#111827',
                          '--rdp-outline': '2px solid var(--rdp-accent-color)',
                          color: 'white'
                        }}
                        modifiersStyles={{
                          selected: {
                            backgroundColor: '#10b981',
                            color: 'white'
                          },
                          today: {
                            backgroundColor: '#374151',
                            color: '#10b981',
                            fontWeight: 'bold'
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowDatePicker(false)}
                        className="mt-2 w-full px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                      >
                        Cerrar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-orange-400" />
                    <span className="bg-gradient-to-r from-orange-300 to-orange-100 bg-clip-text text-transparent">Horarios</span>
                  </div>
                </label>
                {!selectedDate || !selectedBarber ? (
                  <div className="p-3 bg-gray-800/30 border border-gray-700/30 rounded-lg">
                    <p className="text-xs text-gray-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      Selecciona fecha y barbero
                    </p>
                  </div>
                ) : selectedDate && selectedBarber && (!Array.isArray(availableTimes) || availableTimes.length === 0) ? (
                  <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                    <p className="text-xs text-red-400 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      {availabilityReason || 'Sin horarios disponibles'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {Array.isArray(availableTimes) && availableTimes.map((timeSlot, index) => (
                      <button
                        key={`${timeSlot.time}-${index}`}
                        type="button"
                        onClick={() => {
                          console.log('🕐 Time slot selected:', timeSlot);
                          setSelectedTime(timeSlot.datetime);
                        }}
                        className={`p-2 rounded-lg text-xs font-medium transition-all duration-200 border ${
                          selectedTime === timeSlot.datetime 
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400' 
                            : 'bg-gray-800/50 text-gray-300 border-gray-700/50 hover:bg-gray-700/50'
                        }`}
                      >
                        {timeSlot.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Messages */}
              {error && (
                <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-center gap-2">
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-900/30 border border-green-500/50 rounded-lg text-green-400 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  {success}
                </div>
              )}

              {/* Submit Button */}
              <GradientButton
                type="submit"
                disabled={submitting || !selectedService || !selectedBarber || !selectedDate || !selectedTime}
                className="w-full h-10 text-sm font-semibold"
                onClick={(e) => {
                  console.log('🔘 Button clicked!', e);
                  // El handleSubmit se ejecutará automáticamente por el type="submit"
                }}
              >
                {submitting ? 'Agendando...' : 'Agendar Cita'}
              </GradientButton>
            </form>
            </div>
          
          {/* Sección de Citas Existentes */}
          <div className="bg-gray-800/20 backdrop-blur-xl rounded-xl p-6 border border-white/10 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                  <Calendar className="w-4 h-4 text-purple-400" />
                </div>
                <span className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  Mis Citas
                </span>
              </h2>
              
              {/* Tabs */}
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-0.5">
                <div className="flex space-x-0.5">
                  <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                      activeTab === 'upcoming'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    Próximas
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                      activeTab === 'history'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    Historial
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700/30 text-center">
                <div className="inline-block p-3 bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-full mb-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-gray-400 text-sm mb-1">
                  {activeTab === 'upcoming' ? 'No tienes citas próximas' : 'No hay historial de citas'}
                </p>
                <p className="text-xs text-gray-500">
                  {activeTab === 'upcoming' 
                    ? 'Agenda una nueva cita'
                    : 'Tus citas aparecerán aquí'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredAppointments.map(appointment => (
                  <div
                    key={appointment._id}
                    className={`bg-gray-800/40 rounded-lg p-4 border transition-all duration-200 ${
                      appointment.status === 'confirmed' ? 'border-green-500/40' :
                      appointment.status === 'pending' ? 'border-yellow-500/40' :
                      appointment.status === 'cancelled' ? 'border-red-500/40' :
                      'border-gray-600/40'
                    }`}
                  >
                    <div className="flex flex-col gap-3">
                      <div>
                        <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                          <Scissors className="w-3 h-3 text-purple-400" />
                          <span className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                            {appointment.service?.name || 'Servicio no disponible'}
                          </span>
                        </h3>
                        <div className="grid grid-cols-1 gap-1 text-xs">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-blue-400" />
                            <span className="text-gray-400">Fecha:</span>
                            <span className="bg-gradient-to-r from-blue-300 to-blue-100 bg-clip-text text-transparent font-medium">
                              {formatAppointmentDate(appointment.date, "d 'de' MMM")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-green-400" />
                            <span className="text-gray-400">Hora:</span>
                            <span className="bg-gradient-to-r from-green-300 to-green-100 bg-clip-text text-transparent font-medium">
                              {formatAppointmentDate(appointment.date, "HH:mm")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3 text-amber-400" />
                            <span className="text-gray-400">Barbero:</span>
                            <span className="bg-gradient-to-r from-amber-300 to-amber-100 bg-clip-text text-transparent font-medium">
                              {appointment.barber?.user?.name || appointment.barber?.name || 'No asignado'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium border ${
                          appointment.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-500/50' :
                          appointment.status === 'confirmed' ? 'bg-green-900/30 text-green-400 border-green-500/50' :
                          appointment.status === 'cancelled' ? 'bg-red-900/30 text-red-400 border-red-500/50' :
                          'bg-blue-900/30 text-blue-400 border-blue-500/50'
                        }`}>
                          {appointment.status === 'pending' ? 'Pendiente' :
                           appointment.status === 'confirmed' ? 'Confirmada' :
                           appointment.status === 'cancelled' ? 'Cancelada' :
                           'Completada'}
                        </span>
                        
                        <div className="flex gap-1">
                          {appointment.status === 'pending' && (
                            <button
                              onClick={() => setCancelId(appointment._id)}
                              className="p-1 text-red-400 hover:text-red-300 border border-red-500/50 rounded text-xs transition-all duration-200"
                              title="Cancelar"
                            >
                              <XCircle className="w-3 h-3" />
                            </button>
                          )}
                          {appointment.status === 'confirmed' && (
                            <button
                              onClick={() => handleOpenCancelModal(appointment._id)}
                              className="p-1 text-orange-400 hover:text-orange-300 border border-orange-500/50 rounded text-xs transition-all duration-200"
                              title="Cancelar con motivo"
                            >
                              <AlertCircle className="w-3 h-3" />
                            </button>
                          )}
                          {appointment.status === 'cancelled' && appointment.cancellationReason && appointment.cancelledBy !== 'user' && (
                            <button
                              onClick={() => handleViewCancellationReason(appointment._id)}
                              className="p-1 text-blue-400 hover:text-blue-300 border border-blue-500/50 rounded text-xs transition-all duration-200"
                              title="Ver motivo"
                            >
                              <AlertCircle className="w-3 h-3" />
                            </button>
                          )}
                          {(appointment.status === 'completed' || appointment.status === 'cancelled') && (
                            <button
                              onClick={() => handleDeleteAppointment(appointment._id)}
                              className="p-1 text-red-400 hover:text-red-300 border border-red-500/50 rounded text-xs transition-all duration-200"
                              title="Eliminar"
                            >
                              <XCircle className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Cancel with Reason Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-xl p-4 max-w-md w-full mx-4 border border-gray-700">
              <h3 className="text-lg font-semibold mb-3 bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">Cancelar Cita Confirmada</h3>
              <p className="text-gray-400 mb-3 text-sm">
                Para cancelar una cita confirmada, debe proporcionar un motivo. El barbero será notificado.
              </p>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Escriba el motivo de la cancelación (máximo 100 palabras)..."
                className="w-full h-24 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:border-orange-500 text-sm"
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
                  className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed text-sm"
                >
                  Cancelar Cita
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Modal */}
        {cancelId && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-xl p-4 max-w-md w-full mx-4 border border-gray-700">
              <h3 className="text-lg font-semibold mb-3 bg-gradient-to-r from-white to-red-200 bg-clip-text text-transparent">Cancelar Cita</h3>
              <p className="text-gray-400 mb-4 text-sm">
                ¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setCancelId(null)}
                  className="px-3 py-1.5 text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Volver
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
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

export default UserAppointment;
