import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { useAuth } from '../../contexts/AuthContext';
import { api, appointmentService, serviceService, barberService } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { format, parse, isAfter, isBefore, startOfDay, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import GradientButton from '../../components/ui/GradientButton';
import GradientText from '../../components/ui/GradientText';
import { Calendar, Clock, User, Scissors, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

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
  
  // Estado para modal de eliminar
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAppointmentId, setDeleteAppointmentId] = useState(null);
  
  // Estado para modal de información de cita
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [viewInfoData, setViewInfoData] = useState(null);
  
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

  // Bloquear scroll del body cuando cualquier modal está abierto
  useEffect(() => {
  const isAnyModalOpen = showInfoModal || showCancelModal || showDeleteModal || cancelId;
  
  if (isAnyModalOpen) {
    // Bloquear scroll del body
    document.body.style.overflow = 'hidden';
  } else {
    // Restaurar scroll del body
    document.body.style.overflow = 'auto';
  }
  
  // Cleanup al desmontar el componente
  return () => {
    document.body.style.overflow = 'auto';
  };
}, [showInfoModal, showCancelModal, showDeleteModal, cancelId]);

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

      // Validar que selectedTime contiene una fecha válida
      if (!selectedTime || !new Date(selectedTime).getTime()) {
        setError('Por favor selecciona un horario válido');
        return;
      }

      const appointmentData = {
        serviceId: selectedService,
        barberId: selectedBarber,
        date: selectedTime  // selectedTime contiene el datetime completo (fecha + hora)
      };

      console.log('📤 Sending appointment data:', appointmentData);
      console.log('📤 Selected date from input:', selectedDate);
      console.log('📤 Selected time (datetime):', selectedTime);
      console.log('📤 Date object from selectedTime:', new Date(selectedTime));

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

  const handleDeleteAppointment = (appointmentId) => {
    setDeleteAppointmentId(appointmentId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteAppointmentId) return;

    try {
      const response = await appointmentService.deleteAppointment(deleteAppointmentId);
      if (response.success) {
        showSuccess('Reporte de cita eliminado exitosamente');
        await fetchAppointments();
      } else {
        showError(response.message || 'Error al eliminar el reporte de la cita');
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      showError('Error al eliminar el reporte de la cita');
    } finally {
      setShowDeleteModal(false);
      setDeleteAppointmentId(null);
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteAppointmentId(null);
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

  const handleViewAppointmentInfo = (appointmentId) => {
    const appointment = appointments.find(apt => apt._id === appointmentId);
    if (appointment) {
      setViewInfoData({
        service: appointment.service?.name || 'Servicio',
        price: appointment.service?.price || 0,
        barber: appointment.barber?.user?.name || appointment.barber?.name || 'Barbero',
        date: appointment.date,
        time: format(new Date(appointment.date), "HH:mm"),
        status: appointment.status,
        totalPrice: appointment.service?.price || 0,
        cancellationReason: appointment.cancellationReason,
        cancelledBy: appointment.cancelledBy,
        createdAt: appointment.createdAt
      });
      setShowInfoModal(true);
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

  // Obtener fecha mínima (hoy en zona horaria de Colombia)
  const today = new Date();
  // Crear fecha en zona horaria de Colombia correctamente
  const colombiaDate = new Date(today.toLocaleString("en-US", {timeZone: "America/Bogota"}));
  const minDate = format(colombiaDate, 'yyyy-MM-dd');

  console.log('📅 Hora actual UTC:', today.toISOString());
  console.log('📅 Hora actual en Colombia (calculada):', colombiaDate.toLocaleString("es-ES", {timeZone: "America/Bogota"}));
  console.log('📅 MinDate para input:', minDate);

  return (
    <PageContainer>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 space-y-8">
        
        {/* Header principal */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/20 shadow-xl shadow-blue-500/20">
              <Calendar className="w-8 h-8 text-blue-400" />
            </div>
            <GradientText className="text-3xl sm:text-4xl font-bold">
              Sistema de Reservas
            </GradientText>
          </div>
          <p className="text-gray-300 text-sm max-w-2xl mx-auto leading-relaxed">
            Agenda tu cita con nuestros barberos profesionales y gestiona tus reservas
          </p>
        </div>
          
        {/* Grid de 2 columnas responsivo */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          
          {/* Formulario de Nueva Cita */}
          <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-white/10 shadow-xl shadow-blue-500/20 hover:border-white/40 transition-all duration-300 overflow-hidden">
            {/* Efecto de brillo */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-2xl"></div>
            <div className="relative">
              <div className="flex items-center space-x-3 mb-8">
                <div className="p-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/20 shadow-xl shadow-blue-500/20">
                  <Calendar className="w-6 h-6 text-blue-400" />
                </div>
                <GradientText className="text-xl lg:text-2xl font-bold">
                  Agendar Nueva Cita
                </GradientText>
              </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Service Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold bg-gradient-to-r from-purple-400 to-white bg-clip-text text-transparent flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-purple-400" />
                  Servicio
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => {
                    console.log('Service selected:', e.target.value);
                    setSelectedService(e.target.value);
                  }}
                  className="glassmorphism-select"
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
              <div className="space-y-3">
                <label className="block text-sm font-semibold bg-gradient-to-r from-blue-400 to-white bg-clip-text text-transparent flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-400" />
                  Barbero
                </label>
                <select
                  value={selectedBarber}
                  onChange={(e) => {
                    console.log('Barber selected:', e.target.value);
                    setSelectedBarber(e.target.value);
                  }}
                  className="glassmorphism-select"
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

              {/* Date Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold bg-gradient-to-r from-green-400 to-white bg-clip-text text-transparent flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-400" />
                  Fecha
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    console.log('Date selected:', e.target.value);
                    setSelectedDate(e.target.value);
                  }}
                  min={minDate}
                  className="glassmorphism-input"
                  required
                />
              </div>

              {/* Time Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold bg-gradient-to-r from-orange-400 to-white bg-clip-text text-transparent flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-400" />
                  Horarios Disponibles
                </label>
                {!selectedDate || !selectedBarber ? (
                  <div className="p-4 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm shadow-xl shadow-blue-500/20">
                    <p className="text-sm text-gray-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      Selecciona fecha y barbero para ver horarios disponibles
                    </p>
                  </div>
                ) : selectedDate && selectedBarber && (!Array.isArray(availableTimes) || availableTimes.length === 0) ? (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg backdrop-blur-sm shadow-xl shadow-red-500/20">
                    <p className="text-sm text-red-300 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      {availabilityReason || 'Sin horarios disponibles'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Array.isArray(availableTimes) && availableTimes.map((timeSlot, index) => (
                      <button
                        key={`${timeSlot.time}-${index}`}
                        type="button"
                        onClick={() => {
                          console.log('🕐 Time slot selected:', timeSlot);
                          setSelectedTime(timeSlot.datetime);
                        }}
                        className={`group relative p-3 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 overflow-hidden backdrop-blur-sm border ${
                          selectedTime === timeSlot.datetime 
                            ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-300 border-orange-500/50 shadow-xl shadow-orange-500/20' 
                            : 'bg-white/5 text-gray-300 border-white/10 hover:border-orange-500/50 hover:bg-white/10 shadow-xl shadow-blue-500/20'
                        }`}
                      >
                        {selectedTime === timeSlot.datetime && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-lg"></div>
                        )}
                        <span className="relative">{timeSlot.time}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Messages */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg backdrop-blur-sm shadow-xl shadow-red-500/20">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-red-300 text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg backdrop-blur-sm shadow-xl shadow-green-500/20">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <p className="text-green-300 text-sm font-medium">{success}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <GradientButton
                  type="submit"
                  disabled={submitting || !selectedService || !selectedBarber || !selectedDate || !selectedTime}
                  variant="primary"
                  size="lg"
                  className="w-full shadow-xl shadow-blue-500/20"
                  onClick={(e) => {
                    console.log('🔘 Button clicked!', e);
                    // El handleSubmit se ejecutará automáticamente por el type="submit"
                  }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Calendar size={18} />
                    <span>{submitting ? 'Agendando...' : 'Agendar Cita'}</span>
                  </div>
                </GradientButton>
              </div>
            </form>
            </div>
          </div>
          
          {/* Sección de Citas Existentes */}
          <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-white/10 shadow-xl shadow-blue-500/20 hover:border-white/40 transition-all duration-300 overflow-hidden">
            {/* Efecto de brillo */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-2xl"></div>
            <div className="relative">
              {/* Título centrado */}
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="p-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl border border-purple-500/20 shadow-xl shadow-blue-500/20">
                    <Calendar className="w-6 h-6 text-purple-400" />
                  </div>
                  <GradientText className="text-xl lg:text-2xl font-bold">
                    Mis Citas
                  </GradientText>
                </div>
              </div>

              {/* Tabs responsivos centrados */}
              <div className="flex justify-center mb-6">
                <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm shadow-lg p-1 flex gap-1">
                  <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`group relative px-4 py-2.5 rounded-xl border cursor-pointer transition-all duration-300 hover:scale-105 overflow-hidden backdrop-blur-sm flex items-center gap-1.5 ${
                      activeTab === 'upcoming'
                        ? 'border-blue-500/50 bg-blue-500/10 shadow-xl shadow-blue-500/20'
                        : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                    }`}
                  >
                    <Calendar size={14} className={`transition-all duration-300 ${
                      activeTab === 'upcoming' ? 'text-blue-300' : 'text-white'
                    }`} />
                    <span className={`font-medium text-xs whitespace-nowrap ${
                      activeTab === 'upcoming' ? 'text-blue-300' : 'text-white'
                    }`}>Próximas</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`group relative px-4 py-2.5 rounded-xl border cursor-pointer transition-all duration-300 hover:scale-105 overflow-hidden backdrop-blur-sm flex items-center gap-1.5 ${
                      activeTab === 'history'
                        ? 'border-blue-500/50 bg-blue-500/10 shadow-xl shadow-blue-500/20'
                        : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                    }`}
                  >
                    <Clock size={14} className={`transition-all duration-300 ${
                      activeTab === 'history' ? 'text-blue-300' : 'text-white'
                    }`} />
                    <span className={`font-medium text-xs whitespace-nowrap ${
                      activeTab === 'history' ? 'text-blue-300' : 'text-white'
                    }`}>Historial</span>
                  </button>
                </div>
              </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                  <p className="text-gray-400 text-sm">Cargando citas...</p>
                </div>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center backdrop-blur-sm shadow-xl shadow-blue-500/20">
                <div className="inline-block p-4 bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-2xl mb-4">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {activeTab === 'upcoming' ? 'No tienes citas próximas' : 'No hay historial de citas'}
                </h3>
                <p className="text-sm text-gray-400">
                  {activeTab === 'upcoming' 
                    ? 'Agenda una nueva cita usando el formulario de la izquierda'
                    : 'Tus citas completadas y canceladas aparecerán aquí'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar pl-1 pt-2 rounded-xl">
                {filteredAppointments.map((appointment, index) => (
                  <div
                    key={appointment._id}
                    className={`group relative backdrop-blur-sm border rounded-lg p-4 transition-all duration-300 overflow-hidden hover:scale-[1.002] hover:-translate-y-0.5 cursor-pointer ml-1 mr-1 ${
                      appointment.status === 'confirmed' ? 'border-green-500/30 bg-green-500/5 shadow-sm shadow-green-500/20' :
                      appointment.status === 'pending' ? 'border-yellow-500/30 bg-yellow-500/5 shadow-sm shadow-yellow-500/20' :
                      appointment.status === 'cancelled' ? 'border-red-500/30 bg-red-500/5 shadow-sm shadow-red-500/20' :
                      'border-blue-500/30 bg-blue-500/5 shadow-sm shadow-blue-500/20'
                    }`}
                    style={{ zIndex: filteredAppointments.length - index }}
                  >
                    {/* Efecto de brillo */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-lg"></div>
                    
                    <div className="relative">
                      {/* Header con servicio y status */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 p-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg border border-purple-500/20 shadow-sm shadow-purple-500/20">
                            <Scissors className="w-4 h-4 text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-white truncate">
                              {appointment.service?.name || 'Servicio'}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-purple-300">
                              <span>${appointment.service?.price || 'N/A'}</span>
                              <span>•</span>
                              <span className="truncate">
                                {appointment.barber?.user?.name || appointment.barber?.name || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Status badge */}
                        <div className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                          appointment.status === 'confirmed' ? 'bg-green-500/20 text-green-300 border-green-500/40' :
                          appointment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' :
                          appointment.status === 'cancelled' ? 'bg-red-500/20 text-red-300 border-red-500/40' :
                          'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        }`}>
                          {appointment.status === 'confirmed' ? 'Confirmada' :
                           appointment.status === 'pending' ? 'Pendiente' :
                           appointment.status === 'cancelled' ? 'Cancelada' :
                           'Completada'}
                        </div>
                      </div>

                      {/* Información de fecha/hora y botones */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-gray-300">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-blue-400" />
                            {format(new Date(appointment.date), "d MMM", { locale: es })}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-green-400" />
                            {format(new Date(appointment.date), "HH:mm")}
                          </span>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex items-center gap-1.5">
                          {/* Botón de información (todos los estados) */}
                          <button
                            onClick={() => handleViewAppointmentInfo(appointment._id)}
                            className={`p-1.5 border rounded-md transition-all duration-300 shadow-sm ${
                              appointment.status === 'confirmed' ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:text-green-300 hover:bg-green-500/20 shadow-green-500/20' :
                              appointment.status === 'pending' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20 shadow-yellow-500/20' :
                              appointment.status === 'cancelled' ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/20 shadow-red-500/20' :
                              'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 shadow-blue-500/20'
                            }`}
                            title="Ver información"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>

                          {appointment.status === 'pending' && (
                            <button
                              onClick={() => setCancelId(appointment._id)}
                              className="p-1.5 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all duration-300 shadow-sm shadow-red-500/20"
                              title="Cancelar cita"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {appointment.status === 'confirmed' && (
                            <button
                              onClick={() => handleOpenCancelModal(appointment._id)}
                              className="p-1.5 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all duration-300 shadow-sm shadow-red-500/20"
                              title="Cancelar con motivo"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {(appointment.status === 'completed' || appointment.status === 'cancelled') && (
                            <button
                              onClick={() => handleDeleteAppointment(appointment._id)}
                              className="p-1.5 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all duration-300 shadow-sm shadow-red-500/20"
                              title="Eliminar"
                            >
                              <XCircle className="w-3.5 h-3.5" />
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
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 sm:p-6 lg:p-8"
            style={{ overflow: 'hidden' }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowCancelModal(false);
                setCancelAppointmentId(null);
                setCancellationReason('');
              }
            }}
          >
            <div className="relative w-full max-w-sm sm:max-w-md mx-auto">
              <div className="relative bg-red-500/5 backdrop-blur-md border border-red-500/20 rounded-2xl shadow-2xl shadow-red-500/20 overflow-hidden">
                <div className="relative z-10 p-4 sm:p-6">
                  {/* Header del modal */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-red-500/20">
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-white">Cancelar Cita Confirmada</h3>
                    </div>
                    <button
                      onClick={handleCloseCancelModal}
                      className="p-1 text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>

                  {/* Contenido del modal */}
                  <div className="space-y-3 sm:space-y-4">
                    {/* Mensaje explicativo */}
                    <div className="p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                        Para cancelar una cita confirmada, debe proporcionar un motivo. El barbero será notificado.
                      </p>
                    </div>
                    
                    {/* Campo de texto para el motivo */}
                    <div className="space-y-2">
                      <textarea
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        placeholder="Escriba el motivo de la cancelación (máximo 100 palabras)..."
                        className="w-full h-24 sm:h-28 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs sm:text-sm backdrop-blur-sm placeholder-gray-400 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 focus:bg-white/10 transition-all duration-300 resize-none shadow-lg shadow-red-500/20"
                        maxLength={500}
                      />
                      <div className="text-right text-xs text-white/60">
                        {cancellationReason.split(' ').filter(word => word.length > 0).length}/100 palabras
                      </div>
                    </div>
                    
                    {/* Botones de acción */}
                    <div className="flex justify-end gap-2 sm:gap-3 pt-2 sm:pt-4">
                      <button
                        onClick={handleCloseCancelModal}
                        className="px-3 sm:px-4 py-2 text-white/80 hover:text-white transition-all duration-200 text-xs sm:text-sm font-medium"
                      >
                        Volver
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

        {/* Cancel Modal */}
        {cancelId && (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 sm:p-6 lg:p-8"
            style={{ overflow: 'hidden' }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setCancelId(null);
              }
            }}
          >
            <div className="relative w-full max-w-sm sm:max-w-md mx-auto">
              <div className="relative bg-red-500/5 backdrop-blur-md border border-red-500/20 rounded-2xl shadow-2xl shadow-red-500/20 overflow-hidden">
                <div className="relative z-10 p-4 sm:p-6">
                  {/* Header del modal */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-red-500/20">
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-white">Cancelar Cita</h3>
                    </div>
                    <button
                      onClick={() => setCancelId(null)}
                      className="p-1 text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>

                  {/* Contenido del modal */}
                  <div className="space-y-3 sm:space-y-4">
                    {/* Mensaje de confirmación */}
                    <div className="p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10 text-center">
                      <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                        ¿Estás seguro de que deseas cancelar esta cita?
                      </p>
                      <p className="text-red-300 text-xs sm:text-sm mt-2 font-medium">
                        Esta acción no se puede deshacer.
                      </p>
                    </div>
                    
                    {/* Botones de acción */}
                    <div className="flex justify-end gap-2 sm:gap-3 pt-2 sm:pt-4">
                      <button
                        onClick={() => setCancelId(null)}
                        className="px-3 sm:px-4 py-2 text-white/80 hover:text-white transition-all duration-200 text-xs sm:text-sm font-medium"
                      >
                        Volver
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-4 sm:px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 text-xs sm:text-sm font-medium shadow-lg"
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

        {/* Delete Modal */}
        {showDeleteModal && (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 sm:p-6 lg:p-8"
            style={{ overflow: 'hidden' }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCloseDeleteModal();
              }
            }}
          >
            <div className="relative w-full max-w-sm sm:max-w-md mx-auto">
              <div className="relative bg-red-500/5 backdrop-blur-md border border-red-500/20 rounded-2xl shadow-2xl shadow-red-500/20 overflow-hidden">
                <div className="relative z-10 p-4 sm:p-6">
                  {/* Header del modal */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-red-500/20">
                        <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
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

                  {/* Contenido del modal */}
                  <div className="space-y-3 sm:space-y-4">
                    {/* Mensaje de confirmación */}
                    <div className="p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10 text-center">
                      <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                        ¿Estás seguro de que deseas eliminar el reporte de esta cita?
                      </p>
                      <p className="text-red-300 text-xs sm:text-sm mt-2 font-medium">
                        Esta acción no se puede deshacer.
                      </p>
                    </div>
                    
                    {/* Botones de acción */}
                    <div className="flex justify-end gap-2 sm:gap-3 pt-2 sm:pt-4">
                      <button
                        onClick={handleCloseDeleteModal}
                        className="px-3 sm:px-4 py-2 text-white/80 hover:text-white transition-all duration-200 text-xs sm:text-sm font-medium"
                      >
                        Volver
                      </button>
                      <button
                        onClick={handleConfirmDelete}
                        className="px-4 sm:px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 text-xs sm:text-sm font-medium shadow-lg"
                      >
                        Confirmar Eliminación
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de información de citas */}
        {showInfoModal && viewInfoData && (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 sm:p-6 lg:p-8"
            style={{ overflow: 'hidden' }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowInfoModal(false);
                setViewInfoData(null);
              }
            }}
          >
            <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg mx-auto h-[90vh] sm:h-[85vh] lg:h-[80vh] flex flex-col">
              <div className={`relative backdrop-blur-md border rounded-2xl shadow-2xl h-full flex flex-col overflow-hidden ${
                viewInfoData.status === 'confirmed' ? 'bg-green-500/5 border-green-500/20 shadow-green-500/20' :
                viewInfoData.status === 'pending' ? 'bg-yellow-500/5 border-yellow-500/20 shadow-yellow-500/20' :
                viewInfoData.status === 'cancelled' ? 'bg-red-500/5 border-red-500/20 shadow-red-500/20' :
                'bg-blue-500/5 border-blue-500/20 shadow-blue-500/20'
              }`}>
                <div className="relative z-10 flex-shrink-0 p-4 sm:p-6">
                  {/* Header del modal */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`p-1.5 sm:p-2 rounded-lg ${
                        viewInfoData.status === 'confirmed' ? 'bg-green-500/20' :
                        viewInfoData.status === 'pending' ? 'bg-yellow-500/20' :
                        viewInfoData.status === 'cancelled' ? 'bg-red-500/20' :
                        'bg-blue-500/20'
                      }`}>
                        <Info className={`w-4 h-4 sm:w-5 sm:h-5 ${
                          viewInfoData.status === 'confirmed' ? 'text-green-400' :
                          viewInfoData.status === 'pending' ? 'text-yellow-400' :
                          viewInfoData.status === 'cancelled' ? 'text-red-400' :
                          'text-blue-400'
                        }`} />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-white">Información de la cita</h3>
                    </div>
                    <button
                      onClick={() => {
                        setShowInfoModal(false);
                        setViewInfoData(null);
                      }}
                      className="p-1 text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>

                {/* Contenido scrolleable */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-4 sm:px-6 pb-4 sm:pb-6" style={{ minHeight: 0 }}>

                  {/* Contenido del modal */}
                  <div className="space-y-3 sm:space-y-4">
                    {/* Estado */}
                    <div className="flex items-center justify-between p-2.5 sm:p-3 bg-white/5 rounded-lg border border-white/10">
                      <span className="text-gray-300 text-xs sm:text-sm font-medium">Estado:</span>
                      <div className={`px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium border ${
                        viewInfoData.status === 'confirmed' ? 'bg-green-500/20 text-green-300 border-green-500/40' :
                        viewInfoData.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' :
                        viewInfoData.status === 'cancelled' ? 'bg-red-500/20 text-red-300 border-red-500/40' :
                        'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      }`}>
                        {viewInfoData.status === 'confirmed' ? 'Confirmada' :
                         viewInfoData.status === 'pending' ? 'Pendiente' :
                         viewInfoData.status === 'cancelled' ? 'Cancelada' : 'Completada'}
                      </div>
                    </div>

                    {/* Fecha y Hora */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <div className="p-2.5 sm:p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                          <span className="text-gray-300 text-xs font-medium">Fecha:</span>
                        </div>
                        <p className="text-white text-xs sm:text-sm">{format(new Date(viewInfoData.date), "d 'de' MMM 'de' yyyy", { locale: es })}</p>
                      </div>
                      <div className="p-2.5 sm:p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                          <span className="text-gray-300 text-xs font-medium">Hora:</span>
                        </div>
                        <p className="text-white text-xs sm:text-sm">{viewInfoData.time}</p>
                      </div>
                    </div>

                    {/* Barbero */}
                    <div className="p-2.5 sm:p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                        <span className="text-gray-300 text-xs font-medium">Barbero:</span>
                      </div>
                      <p className="text-white text-xs sm:text-sm">{viewInfoData.barber?.name || viewInfoData.barber || 'No asignado'}</p>
                    </div>

                    {/* Servicios */}
                    <div className="p-2.5 sm:p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Scissors className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                        <span className="text-gray-300 text-xs font-medium">Servicios:</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-white text-xs sm:text-sm">{viewInfoData.service || 'Servicio no especificado'}</span>
                          <span className="text-blue-400 text-xs sm:text-sm font-medium">
                            {viewInfoData.status === 'cancelled' ? '-' : `$${viewInfoData.price || 0}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="p-2.5 sm:p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-300 text-xs sm:text-sm font-medium">Total:</span>
                        <span className="text-white text-base sm:text-lg font-bold">
                          {viewInfoData.status === 'cancelled' ? '-' : `$${viewInfoData.totalPrice || 0}`}
                        </span>
                      </div>
                    </div>

                    {/* Motivo de cancelación según quien canceló */}
                    {viewInfoData.status === 'cancelled' && (
                      <div className="p-2.5 sm:p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
                          <span className="text-red-300 text-xs font-medium">
                            {viewInfoData.cancelledBy === 'user' ? 'Cancelada por ti' :
                             viewInfoData.cancelledBy === 'barber' ? 'Cancelada por el barbero' :
                             viewInfoData.cancelledBy === 'system' ? 'Cancelada por el sistema' : 'Motivo de cancelación'}:
                          </span>
                        </div>
                        <p className="text-white text-xs sm:text-sm">
                          {viewInfoData.cancelledBy === 'user' ? 'Cancelaste esta cita.' :
                           viewInfoData.cancelledBy === 'system' ? 'La cita expiró automáticamente.' :
                           viewInfoData.cancellationReason || 'Sin motivo especificado.'}
                        </p>
                      </div>
                    )}

                    {/* Botón de cerrar */}
                    <div className="pt-2 sm:pt-4">
                      <GradientButton
                        variant="primary"
                        size="md"
                        onClick={() => {
                          setShowInfoModal(false);
                          setViewInfoData(null);
                        }}
                        className="shadow-xl shadow-blue-500/20 text-xs sm:text-sm px-4 sm:px-6 py-2 w-full"
                      >
                        Cerrar
                      </GradientButton>
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

export default UserAppointment;
