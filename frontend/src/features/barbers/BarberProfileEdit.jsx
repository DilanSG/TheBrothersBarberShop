import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@components/layout/PageContainer';
import { useAuth } from '@contexts/AuthContext';
import { useSocioStatus } from '@hooks/useSocioStatus';
import { api, barberService, serviceService } from '@services/api';
import { useNotification } from '@contexts/NotificationContext';
import GradientButton from '@components/ui/GradientButton';
import GradientText from '@components/ui/GradientText';
import logger from '@utils/logger';
import { 
  User, 
  Camera, 
  Upload, 
  X, 
  Save, 
  ArrowLeft,
  Scissors,
  Clock,
  Star,
  Phone,
  Mail,
  Calendar,
  Settings,
  ChevronDown,
  FileText,
  Lock,
  Eye,
  EyeOff,
  Crown
} from 'lucide-react';

const daysInSpanish = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo'
};

const defaultSchedule = {
  monday: { start: '07:00', end: '22:00', available: true },
  tuesday: { start: '07:00', end: '22:00', available: true },
  wednesday: { start: '07:00', end: '22:00', available: true },
  thursday: { start: '07:00', end: '22:00', available: true },
  friday: { start: '07:00', end: '22:00', available: true },
  saturday: { start: '07:00', end: '22:00', available: true },
  sunday: { start: '07:00', end: '22:00', available: false }
};

const BarberProfileEdit = () => {
  const { user, setUser } = useAuth();
  const { isSocio, tipoSocio, isFounder } = useSocioStatus();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const fileInputRef = useRef(null);
  
  // Estados principales
  const [barber, setBarber] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [previewImage, setPreviewImage] = useState(null);
const [scheduleLoaded, setScheduleLoaded] = useState(false);
  
  // Estados para el formulario del usuario
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birthdate: ''
  });
  
// Estados para el formulario del barbero
  const [barberFormData, setBarberFormData] = useState({
    specialty: '',
    experience: '',
    description: '',
    services: []
  });
  
// Estados para servicios y horarios
  const [availableServices, setAvailableServices] = useState([]);
  const [schedule, setSchedule] = useState(defaultSchedule);
  
  // Estados para contraseñas
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Debug: Monitorear cambios en el schedule
  useEffect(() => {
    logger.debug('Schedule actualizado:', schedule);
  }, [schedule]);

  // Sincronizar el formulario del usuario cuando el contexto cambie
  useEffect(() => {
    if (user) {
      setUserFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        birthdate: formatDateForInput(user.birthdate)
      });
      
      // Actualizar también la foto de preview si cambió en el contexto
      if (user.profilePicture && !previewImage) {
        setPreviewImage(user.profilePicture);
      }
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    setScheduleLoaded(false);
    try {
      const [barberData, servicesData] = await Promise.all([
        barberService.getBarberProfile(),
        serviceService.getAllServices()
      ]);
      
      if (barberData.success) {
        const barberInfo = barberData.data;
        setBarber(barberInfo);
        
        setBarberFormData({
          specialty: barberInfo.specialty || '',
          experience: barberInfo.experience?.toString() || '',
          description: barberInfo.description || '',
          services: barberInfo.services?.map(s => s._id) || []
        });
        
        setUserFormData({
          name: user?.name || '',
          email: user?.email || '',
          phone: user?.phone || '',
          birthdate: formatDateForInput(user?.birthdate)
        });
        
        const profilePicture = user?.profilePicture || barberInfo.user?.profilePicture;
        if (profilePicture) {
          setPreviewImage(profilePicture);
        }
        
        if (barberInfo.schedule) {
          logger.debug('Cargando horario desde BD:', barberInfo.schedule);
          // Validar que el schedule tenga la estructura correcta
          const validSchedule = { ...defaultSchedule };
          Object.keys(validSchedule).forEach(day => {
            if (barberInfo.schedule[day]) {
              validSchedule[day] = {
                start: barberInfo.schedule[day].start || validSchedule[day].start,
                end: barberInfo.schedule[day].end || validSchedule[day].end,
                available: barberInfo.schedule[day].available !== undefined 
                  ? barberInfo.schedule[day].available 
                  : validSchedule[day].available
              };
            }
          });
          setSchedule(validSchedule);
        } else {
          logger.debug('No hay horario en BD, usando horario por defecto');
          setSchedule(defaultSchedule);
        }
        setScheduleLoaded(true);
      }
      
      if (servicesData.success) {
        setAvailableServices(servicesData.data || []);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Error al cargar los datos del perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleUserInputChange = (e) => {
    const { name, value } = e.target;
    setUserFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBarberInputChange = (e) => {
    const { name, value } = e.target;
    setBarberFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleServiceToggle = (serviceId, isChecked) => {
    setBarberFormData(prev => ({
      ...prev,
      services: isChecked 
        ? [...prev.services, serviceId]
        : prev.services.filter(id => id !== serviceId)
    }));
  };

  // Función para generar opciones de tiempo
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 7; hour <= 22; hour++) {
      options.push({
        value: `${hour.toString().padStart(2, '0')}:00`,
        label: `${hour === 12 ? 12 : hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`
      });
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // Componente de selector personalizado
  const CustomTimeSelector = ({ value, onChange, options, placeholder, dayKey, field }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);

    const filteredOptions = options.filter(option => 
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedOption = options.find(option => option.value === value);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
            buttonRef.current && !buttonRef.current.contains(event.target)) {
          setIsOpen(false);
          setSearchTerm('');
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

// Agregar clase al contenedor padre cuando se abre
    useEffect(() => {
      const dayContainer = document.querySelector(`[data-day="${dayKey}"]`);
      if (dayContainer) {
        if (isOpen) {
          dayContainer.style.zIndex = '99998';
          dayContainer.style.position = 'relative';
          dayContainer.style.overflow = 'visible';
        } else {
          dayContainer.style.zIndex = '';
          dayContainer.style.position = '';
          dayContainer.style.overflow = '';
        }
      }
    }, [isOpen, dayKey]);

    const handleSelect = (option) => {
      onChange(option.value);
      setIsOpen(false);
      setSearchTerm('');
    };

    return (
      <div className="relative w-full" style={{ zIndex: 1000 }}>
        <button
          ref={buttonRef}
          type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm backdrop-blur-sm placeholder-gray-400 focus:border-blue-500/50 hover:border-blue-500/50 transition-all duration-300 text-left flex items-center justify-between shadow-xl shadow-blue-500/20"
        >
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
          <ChevronDown 
            size={16} 
            className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          />
        </button>

        {isOpen && (
          <div 
            ref={dropdownRef}
            className="absolute w-full mt-1 bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl border border-red-500/30 rounded-2xl shadow-2xl shadow-red-500/10 max-h-64 overflow-visible"
            style={{ zIndex: 99999, position: 'absolute' }}
          >
{/* Barra de búsqueda */}
            <div className="p-3 border-b border-gray-700/50">
              <input
                type="text"
                placeholder="Buscar hora..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500/50 focus:border-red-500/50 text-sm shadow-xl shadow-blue-500/20"
              />
            </div>
            
{/* Lista de opciones */}
            <div className="max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-red-600/20 hover:to-blue-600/20 transition-all duration-200 text-sm font-medium border-b border-gray-700/30 last:border-b-0 flex items-center justify-between group ${
                      value === option.value 
                        ? 'bg-gradient-to-r from-red-600/30 to-blue-600/30 text-white' 
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    <span>{option.label}</span>
                    {value === option.value && (
                      <div className="w-2 h-2 bg-gradient-to-r from-red-400 to-blue-400 rounded-full"></div>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-gray-400 text-sm">
No se encontraron opciones
</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Función para ajustar horarios a intervalos de 1 hora
  const adjustTimeToInterval = (timeString) => {
    const [hours] = timeString.split(':').map(Number);
    return `${hours.toString().padStart(2, '0')}:00`;
  };

  // Función para validar que el horario sea lógico (hora de fin después de inicio)
  const validateTimeRange = (timeString, field, currentSchedule) => {
    // Solo ajustar a intervalos de 30 minutos, sin restricciones de rango
    return timeString;
  };

  const handleScheduleChange = (day, field, value) => {
    if (field === 'available') {
      // Cambiar disponibilidad del día
      setSchedule(prev => ({
        ...prev,
        [day]: {
          ...prev[day],
          available: value
        }
      }));
      return;
    }

    // Ajustar a intervalos de 30 minutos
    let adjustedValue = adjustTimeToInterval(value);
    
    setSchedule(prev => {
      const currentDaySchedule = prev[day];
      let newSchedule = {
        ...prev,
        [day]: {
          ...currentDaySchedule,
          [field]: adjustedValue
        }
      };

      // Validar que la hora de fin sea después de la hora de inicio
      const startTime = field === 'start' ? adjustedValue : currentDaySchedule.start;
      const endTime = field === 'end' ? adjustedValue : currentDaySchedule.end;
      
      // Convertir a minutos para comparar
      const getMinutes = (timeStr) => {
        const [hours] = timeStr.split(':').map(Number);
        return hours * 60;
      };
      
      const startMinutes = getMinutes(startTime);
      const endMinutes = getMinutes(endTime);
      const timeDifference = endMinutes - startMinutes;
      
      // Si la diferencia es menor a 1 hora o negativa, desmarcar el día
      if (timeDifference < 60) {
        newSchedule[day].available = false;
      } else {
        // Si había una diferencia válida, asegurar que el día esté marcado como disponible
        newSchedule[day].available = true;
      }
      
      return newSchedule;
    });
  };

  // Manejo de foto de perfil
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
if (file.size > 5 * 1024 * 1024) {
        showError('La imagen no puede ser mayor a 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        showError('Solo se permiten archivos de imagen');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveProfilePicture = () => {
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadProfilePicture = async (file) => {
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      const response = await api.upload('/users/upload-profile-picture', formData);
      return response.profilePictureUrl;
    } catch (error) {
      throw new Error(error.message || 'Error al subir la imagen');
    }
  };

  // Guardar información personal
  const handlePersonalSave = async () => {
    try {
      setSaving(true);
      
      let profilePictureUrl = user?.profilePicture;

      if (fileInputRef.current?.files[0]) {
        profilePictureUrl = await uploadProfilePicture(fileInputRef.current.files[0]);
      }

      const updatedData = {};
      
      if (userFormData.name && userFormData.name.trim()) {
        updatedData.name = userFormData.name.trim();
      }
      
      if (userFormData.email && userFormData.email.trim()) {
        updatedData.email = userFormData.email.trim();
      }
      
      if (userFormData.phone && userFormData.phone.trim()) {
        updatedData.phone = userFormData.phone.trim();
      }
      
      if (userFormData.birthdate && userFormData.birthdate.trim()) {
        updatedData.birthdate = userFormData.birthdate.trim();
      }
      
      if (profilePictureUrl) {
        updatedData.profilePicture = profilePictureUrl;
      }

      const response = await api.put('/users/profile', updatedData);
      const userData = response.data || response;
      const updatedUser = {
        ...user,
        ...userData,
        profilePicture: profilePictureUrl
      };
      
      setUser(updatedUser);
      
      // Actualizar el formulario local con los datos actualizados
      setUserFormData({
        name: updatedUser.name || '',
        email: updatedUser.email || '',
        phone: updatedUser.phone || '',
        birthdate: formatDateForInput(updatedUser.birthdate)
      });
      
      // Si se subió una nueva foto, actualizar el preview para mostrarla
      if (profilePictureUrl && profilePictureUrl !== user?.profilePicture) {
        setPreviewImage(profilePictureUrl);
      } else {
        setPreviewImage(null);
        }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      showSuccess('Información personal actualizada correctamente');
    } catch (error) {
      console.error('Error al actualizar información personal:', error);
      
      // Manejo específico para email duplicado
      if (error.message && error.message.includes('duplicate key error') && error.message.includes('email')) {
        showError('Este email ya está siendo usado por otro usuario. Por favor, elige un email diferente.');
      } else {
        showError(error.message || 'Error al actualizar la información personal');
      }
    } finally {
      setSaving(false);
    }
  };

// Guardar información profesional
  const handleProfessionalSave = async () => {
    try {
      setSaving(true);
      
      const updateData = {
        ...barberFormData,
        experience: parseInt(barberFormData.experience) || 0
      };
      
      const response = await barberService.updateMyProfile(updateData);
      
      if (response.success) {
        showSuccess('Información profesional actualizada exitosamente');
      
        // Actualizar el estado local sin necesidad de recargar todo
        setBarber(prev => ({
          ...prev,
          ...updateData
        }));
        
        // Solo recargar si necesitamos datos actualizados del servidor
        // await fetchData();
      } else {
        showError(response.message || 'Error al actualizar la información profesional');
      }
    } catch (error) {
      console.error('Error updating professional info:', error);
      showError('Error al actualizar la información profesional');
          } finally {
      setSaving(false);
    }
  };

// Guardar horarios
  const handleScheduleSave = async () => {
    try {
      setSaving(true);
      
const response =       await barberService.updateMyProfile({ schedule });
      
      if (response.success) {
        showSuccess('Horarios actualizados exitosamente');
      
        // Actualizar el estado local
        setBarber(prev => ({
          ...prev,
          schedule
        }));
        
        // Solo recargar si necesitamos datos actualizados del servidor
        // await fetchData();
      } else {
        showError(response.message || 'Error al actualizar los horarios');
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      showError('Error al actualizar los horarios');
          } finally {
      setSaving(false);
    }
  };

  // Funciones para manejar contraseñas
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordSave = async () => {
    try {
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        showError('Todos los campos de contraseña son obligatorios');
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        showError('Las contraseñas nuevas no coinciden');
        return;
      }

      if (passwordData.newPassword.length < 6) {
        showError('La nueva contraseña debe tener al menos 6 caracteres');
        return;
      }

      setSaving(true);

      await api.put('/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      showSuccess('Contraseña actualizada correctamente');
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      showError(error.message || 'Error al cambiar la contraseña');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-red-900/20 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
            <p className="mt-4 text-white/80">Cargando perfil...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black via-gray-900 to-black overflow-hidden">
      {/* Background con efectos de gradientes */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-900/8 via-blue-900/8 to-red-900/8"></div>
      
      {/* Efectos de puntos en toda la página - múltiples capas */}
      <div className="absolute inset-0 opacity-40" style={{
        backgroundImage: `radial-gradient(circle, rgba(59, 130, 246, 0.3) 1px, transparent 1px)`,
        backgroundSize: '30px 30px',
        backgroundPosition: '0 0, 15px 15px'
      }}></div>
      
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `radial-gradient(circle, rgba(239, 68, 68, 0.4) 1px, transparent 1px)`,
        backgroundSize: '20px 20px',
        backgroundPosition: '10px 10px'
      }}></div>
      
      <div className="absolute inset-0 opacity-15" style={{
        backgroundImage: `radial-gradient(circle, rgba(168, 85, 247, 0.5) 0.8px, transparent 0.8px)`,
        backgroundSize: '40px 40px',
        backgroundPosition: '20px 0'
      }}></div>

      {/* Contenido principal */}
      <div className="relative z-10">
        <PageContainer>
          <div className="relative py-6">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header compacto con estilo de barbería */}
        <div className="text-center py-8">
          <button
              onClick={() => navigate('/profile')}
              className="group inline-flex items-center gap-2 mb-10 px-4 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full text-white hover:bg-white/20 hover:border-white/40 transition-all duration-300 shadow-lg hover:scale-105"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-medium text-sm">Volver al Perfil</span>
            </button>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <GradientText className="text-4xl md:text-5xl font-bold">
                <User className="w-10 h-10 mx-auto mb-3" />
                Editar Perfil de Barbero
              </GradientText>
            </h1>
            <p className="text-gray-300 text-sm max-w-2xl mx-auto leading-relaxed">
              Gestiona tu información profesional y destaca tus habilidades como barbero
            </p>
        </div>

        {/* Navegación por pestañas */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm shadow-lg p-1 flex flex-col sm:flex-row gap-1 w-full max-w-xs sm:max-w-lg">
            {[
              { id: 'personal', label: 'Personal', icon: User },
              { id: 'security', label: 'Seguridad', icon: Lock },
              { id: 'professional', label: 'Profesional', icon: Star },
              { id: 'services', label: 'Servicios', icon: Scissors },
              { id: 'schedule', label: 'Horarios', icon: Clock }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`group relative px-3 py-2.5 rounded-xl border cursor-pointer transition-all duration-300 hover:scale-105 overflow-hidden backdrop-blur-sm flex-1 flex items-center justify-center gap-1.5 ${
                  activeTab === id
                    ? 'border-blue-500/50 bg-blue-500/10 shadow-xl shadow-blue-500/20'
                    : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                }`}
              >
                <Icon size={14} className={`transition-all duration-300 ${
                  activeTab === id ? 'text-blue-300' : 'text-white'
                }`} />
                <span className={`font-medium text-xs sm:text-xs whitespace-nowrap ${
                  activeTab === id ? 'text-blue-300' : 'text-white'
                }`}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-transparent border border-white/10 rounded-2xl backdrop-blur-sm shadow-2xl shadow-blue-500/20">
          <div className="divide-y divide-white/10">
              
            {/* Tab: Información Personal */}
            {activeTab === 'personal' && (
              <div className="group relative px-4 py-4 transition-colors backdrop-blur-sm border-b border-white/5 overflow-hidden rounded-lg">
                {/* Efecto de brillo en hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-lg"></div>
                <div className="relative p-2">
                  {/* Foto de Perfil con estilo barbería */}
                  <div className="mb-8">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-r from-red-600/20 to-blue-600/20 rounded-xl border border-red-500/20 group-hover:border-blue-500/40 transition-all duration-500">
                        <Upload size={18} className="text-red-400 group-hover:text-blue-400 transition-colors duration-500" />
                      </div>
                      <GradientText className="text-lg font-bold">Foto de Perfil</GradientText>
                    </h3>
                    
                    <div className="flex flex-col items-center space-y-3">
                      <div className="relative group">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-blue-900 border-2 border-red-500/30 shadow-xl hover:border-red-500/60 transition-all duration-300">
                          {(previewImage || user?.profilePicture) ? (
                            <img
                              src={previewImage || user?.profilePicture}
                              alt="Foto de perfil"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                const fallback = e.target.parentElement.querySelector('.profile-fallback');
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          
                          {/* Fallback avatar */}
                          <div 
                            className="profile-fallback w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-600/20"
                            style={{ display: (previewImage || user?.profilePicture) ? 'none' : 'flex' }}
                          >
                            <span className="text-lg font-bold text-white">
                              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                            </span>
                          </div>
                          
                          {/* Overlay de hover con estilo barbería */}
                          <div 
                            className="absolute inset-0 bg-gradient-to-t from-black/60 via-red-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <div className="p-2 bg-red-600/80 rounded-full backdrop-blur-sm border border-white/30">
                              <Camera size={16} className="text-white drop-shadow-lg" />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={saving}
                          className="group relative p-2 bg-gradient-to-r from-blue-600/20 to-red-600/20 rounded-lg border border-blue-500/30 hover:border-red-500/40 transition-all duration-300 backdrop-blur-sm hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-red-600/30 transform hover:scale-110 shadow-xl shadow-blue-500/20"
                          title="Subir foto"
                        >
                          <Upload size={16} className="text-blue-400 group-hover:text-red-400 transition-colors duration-300" />
                        </button>
                        
                        {(user?.profilePicture || previewImage) && (
                          <button
                            onClick={handleRemoveProfilePicture}
                            disabled={saving}
                            className="group relative p-2 bg-gradient-to-r from-red-600/20 to-blue-600/20 rounded-lg border border-red-500/30 hover:border-blue-500/40 transition-all duration-300 backdrop-blur-sm hover:bg-gradient-to-r hover:from-red-600/30 hover:to-blue-600/30 transform hover:scale-110 shadow-xl shadow-blue-500/20"
                            title="Eliminar foto"
                          >
                            <X size={16} className="text-red-400 group-hover:text-blue-400 transition-colors duration-300" />
                          </button>
                        )}
                      </div>
                      
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Campos del formulario con estilo barbería */}
                  <div className="mt-8">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-r from-blue-600/20 to-red-600/20 rounded-xl border border-blue-500/20 group-hover:border-red-500/40 transition-all duration-500">
                        <User size={20} className="text-blue-400 group-hover:text-red-400 transition-colors duration-500" />
                      </div>
                      <GradientText className="text-xl font-bold">Información Personal</GradientText>
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-2">
                          <User size={16} className="text-red-400" />
                          Nombre Completo
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={userFormData.name}
                          onChange={handleUserInputChange}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm backdrop-blur-sm placeholder-gray-400 focus:border-blue-500/50 shadow-xl shadow-blue-500/20"
                          placeholder="Tu nombre completo"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-2">
                          <Mail size={16} className="text-blue-400" />
                          Correo Electrónico
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={userFormData.email}
                          onChange={handleUserInputChange}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm backdrop-blur-sm placeholder-gray-400 focus:border-blue-500/50 shadow-xl shadow-blue-500/20"
                          placeholder="tu@email.com"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-2">
                          <Phone size={16} className="text-blue-400" />
                          Teléfono
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={userFormData.phone}
                          onChange={handleUserInputChange}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm backdrop-blur-sm placeholder-gray-400 focus:border-blue-500/50 shadow-xl shadow-blue-500/20"
                          placeholder="+57 300 123 4567"
                        />
                      </div>

                      <div className="space-y-3 lg:col-span-2">
                        <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-2">
                          <Calendar size={16} className="text-red-400" />
                          Fecha de Nacimiento
                        </label>
                        <input
                          type="date"
                          name="birthdate"
                          value={userFormData.birthdate}
                          onChange={handleUserInputChange}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm backdrop-blur-sm placeholder-gray-400 focus:border-blue-500/50 shadow-xl shadow-blue-500/20"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end mt-6">
                      <GradientButton
                        onClick={handlePersonalSave}
                        disabled={saving}
                        loading={saving}
                        loadingText="Guardando..."
                        variant="primary"
                        size="md"
                        className="shadow-xl shadow-blue-500/20"
                      >
                        <div className="flex items-center gap-2">
                          <Save size={18} />
                          <span>Guardar Cambios</span>
                        </div>
                      </GradientButton>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Seguridad */}
            {activeTab === 'security' && (
              <div className="group relative px-4 py-4 transition-colors backdrop-blur-sm border-b border-white/5 overflow-hidden rounded-lg">
                {/* Efecto de brillo en hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-lg"></div>
                <div className="relative p-2">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-r from-red-600/20 to-blue-600/20 rounded-xl border border-red-500/20 hover:border-blue-500/40 transition-all duration-500">
                      <Lock size={20} className="text-red-400 hover:text-blue-400 transition-colors duration-500" />
                    </div>
                    <GradientText className="text-xl font-bold">Cambiar Contraseña</GradientText>
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-white to-blue-400 flex items-center gap-2">
                        <Lock size={16} className="text-red-400" />
                        Contraseña Actual
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm backdrop-blur-sm placeholder-gray-400 focus:border-blue-500/50 shadow-xl shadow-blue-500/20 pr-12"
                          placeholder="Tu contraseña actual"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-red-300 hover:text-red-400 transition-colors duration-300"
                        >
                          {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-white to-red-400 flex items-center gap-2">
                        <Lock size={16} className="text-blue-400" />
                        Nueva Contraseña
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm backdrop-blur-sm placeholder-gray-400 focus:border-blue-500/50 shadow-xl shadow-blue-500/20 pr-12"
                          placeholder="Tu nueva contraseña"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-blue-400 transition-colors duration-300"
                        >
                          {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-white to-blue-400 flex items-center gap-2">
                        <Lock size={16} className="text-red-400" />
                        Confirmar Nueva Contraseña
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm backdrop-blur-sm placeholder-gray-400 focus:border-blue-500/50 shadow-xl shadow-blue-500/20 pr-12"
                          placeholder="Confirma tu nueva contraseña"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-red-300 hover:text-red-400 transition-colors duration-300"
                        >
                          {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end mt-6">
                      <GradientButton
                        onClick={handlePasswordSave}
                        disabled={saving}
                        loading={saving}
                        loadingText="Actualizando..."
                        variant="primary"
                        size="md"
                        className="shadow-xl shadow-blue-500/20"
                      >
                        <div className="flex items-center gap-2">
                          <Save size={18} />
                          <span>Cambiar Contraseña</span>
                        </div>
                      </GradientButton>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Información Profesional */}
            {activeTab === 'professional' && (
              <div className="group relative px-4 py-4 transition-colors backdrop-blur-sm border-b border-white/5 overflow-hidden rounded-lg">
                {/* Efecto de brillo en hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-lg"></div>
                <div className="relative p-2">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-r from-red-600/20 to-blue-600/20 rounded-xl border border-red-500/20 group-hover:border-blue-500/40 transition-all duration-500">
                      <Star size={20} className="text-red-400 group-hover:text-blue-400 transition-colors duration-500" />
                    </div>
                    <GradientText className="text-xl font-bold">Información Profesional</GradientText>
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-2">
                        <Scissors size={16} className="text-red-400" />
                        Especialidad
                      </label>
                      <input
                        type="text"
                        name="specialty"
                        value={barberFormData.specialty}
                        onChange={handleBarberInputChange}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm backdrop-blur-sm placeholder-gray-400 focus:border-blue-500/50 shadow-xl shadow-blue-500/20"
                        placeholder="Ej: Cortes clásicos, barbas, etc."
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-2">
                        <Star size={16} className="text-blue-400" />
                        Años de Experiencia
                      </label>
                      <input
                        type="number"
                        name="experience"
                        min="0"
                        value={barberFormData.experience}
                        onChange={handleBarberInputChange}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm backdrop-blur-sm placeholder-gray-400 focus:border-blue-500/50 shadow-xl shadow-blue-500/20"
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-3 lg:col-span-2">
                      <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-2">
                        <FileText size={16} className="text-red-400" />
                        Descripción
                      </label>
                      <textarea
                        name="description"
                        value={barberFormData.description}
                        onChange={handleBarberInputChange}
                        rows={3}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm backdrop-blur-sm placeholder-gray-400 focus:border-blue-500/50 resize-none shadow-xl shadow-blue-500/20"
                        placeholder="Cuéntanos sobre tu experiencia y estilo de trabajo..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <GradientButton
                      onClick={handleProfessionalSave}
                      disabled={saving}
                      loading={saving}
                      loadingText="Guardando..."
                      variant="primary"
                      size="md"
                      className="shadow-xl shadow-blue-500/20"
                    >
                      <div className="flex items-center gap-2">
                        <Save size={18} />
                        <span>Guardar Cambios</span>
                      </div>
                    </GradientButton>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Servicios */}
            {activeTab === 'services' && (
              <div className="group relative px-4 py-4 transition-colors backdrop-blur-sm border-b border-white/5 overflow-hidden rounded-lg">
                {/* Efecto de brillo en hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-lg"></div>
                <div className="relative p-2">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-r from-red-600/20 to-blue-600/20 rounded-xl border border-red-500/20 group-hover:border-blue-500/40 transition-all duration-500">
                      <Scissors size={20} className="text-red-400 group-hover:text-blue-400 transition-colors duration-500" />
                    </div>
                    <GradientText className="text-xl font-bold">Servicios que Ofreces</GradientText>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {availableServices.map((service) => (
                        <label
                          key={service._id}
                          className={`group relative p-4 rounded-xl border cursor-pointer transition-all duration-300 hover:scale-105 overflow-hidden backdrop-blur-sm ${
                            barberFormData.services.includes(service._id)
                              ? 'border-blue-500/50 bg-blue-500/10 shadow-xl shadow-blue-500/20'
                              : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={barberFormData.services.includes(service._id)}
                          onChange={(e) => handleServiceToggle(service._id, e.target.checked)}
                          className="sr-only"
                        />
                        
                        <div className="relative z-10 flex flex-col space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className={`font-medium text-base group-hover:scale-105 transition-transform duration-300 ${
                              barberFormData.services.includes(service._id)
                                ? 'text-blue-300'
                                : 'text-white'
                            }`}>
                              <GradientText className="font-medium text-base">{service.name}</GradientText>
                            </h4>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                              barberFormData.services.includes(service._id)
                                ? 'border-blue-400 bg-blue-500 shadow-lg'
                                : 'border-gray-400 group-hover:border-white'
                            }`}>
                            {barberFormData.services.includes(service._id) && (
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            )}
                          </div>
                        </div>
                      
                          <p className={`text-sm leading-relaxed ${
                            barberFormData.services.includes(service._id)
                              ? 'text-blue-200'
                              : 'text-gray-300'
                          }`}>
                            {service.description}
                          </p>
                          
                          <div className="flex justify-between items-center pt-2 border-t border-white/20">
                            <span className={`font-bold text-base ${
                              barberFormData.services.includes(service._id)
                                ? 'text-blue-400'
                                : 'text-blue-400'
                            }`}>
                              ${service.price}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              barberFormData.services.includes(service._id)
                                ? 'bg-white/20 text-white'
                                : 'bg-gray-600/50 text-gray-400'
                            }`}>
                              {service.duration} min
                            </span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <GradientButton
                      onClick={handleProfessionalSave}
                      disabled={saving}
                      loading={saving}
                      loadingText="Guardando..."
                      variant="primary"
                      size="md"
                      className="shadow-xl shadow-blue-500/20"
                    >
                      <div className="flex items-center gap-2">
                        <Save size={18} />
                        <span>Guardar Servicios</span>
                      </div>
                    </GradientButton>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Horarios */}
            {activeTab === 'schedule' && (
              <div className="group relative px-4 py-4 transition-colors backdrop-blur-sm border-b border-white/5 rounded-lg overflow-hidden">
                {/* Efecto de brillo en hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-lg"></div>
                <div className="relative p-2" style={{ overflow: 'visible', zIndex: 10 }}>
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-r from-blue-600/20 to-red-600/20 rounded-xl border border-blue-500/20 group-hover:border-red-500/40 transition-all duration-500">
                      <Clock size={20} className="text-blue-400 group-hover:text-red-400 transition-colors duration-500" />
                    </div>
                    <GradientText className="text-xl font-bold">Horarios de Trabajo</GradientText>
                  </h3>

                  <div className="space-y-3 mb-6 relative" style={{ zIndex: 100 }}>
                    {Object.entries(schedule).map(([day, daySchedule], index) => (
                      <div
                        key={day}
                        data-day={day}
                        className="group relative px-4 py-4 transition-colors backdrop-blur-sm border border-white/10 rounded-lg shadow-lg hover:shadow-xl overflow-hidden"
                        style={{ zIndex: 100 + index, position: 'relative' }}
                      >
                        {/* Efecto de brillo en hover para cada día */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-lg"></div>
                        <div className="relative flex flex-col md:flex-row md:items-center gap-3">
                          <div className="flex items-center gap-3 min-w-0 md:w-40">
                            <input
                              type="checkbox"
                              checked={daySchedule.available}
                              onChange={(e) => handleScheduleChange(day, 'available', e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-white font-medium text-base">
                              {daysInSpanish[day]}
                            </span>
                          </div>

                        {daySchedule.available && (
                          <div className="flex items-center gap-3 flex-1">
                              <CustomTimeSelector
                                value={daySchedule.start || '07:00'}
                                onChange={(value) => handleScheduleChange(day, 'start', value)}
                                options={timeOptions}
                                placeholder="Hora de inicio"
                                dayKey={day}
                                field="start"
                              />
                            <span className="text-gray-300 font-medium text-sm px-2">a</span>
                              <CustomTimeSelector
                                value={daySchedule.end || '19:00'}
                                onChange={(value) => handleScheduleChange(day, 'end', value)}
                                options={timeOptions}
                                placeholder="Hora de fin"
                                dayKey={day}
                                field="end"
                              />
                            </div>
                          )}
                          
                          {!daySchedule.available && (
                            <div className="flex-1">
                              <span className="text-gray-400 italic text-sm">No disponible</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => {
                        setSchedule(defaultSchedule);
                        showSuccess('Horarios restablecidos a 7AM-10PM');
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/50 rounded-lg text-yellow-400 hover:from-yellow-600/30 hover:to-orange-600/30 transition-all duration-300 text-sm font-medium shadow-xl shadow-blue-500/20"
                    >
                      🔄 Restablecer a 7AM-10PM
                    </button>
                    
                    <GradientButton
                      onClick={handleScheduleSave}
                      disabled={saving}
                      loading={saving}
                      loadingText="Guardando..."
                      variant="primary"
                      size="md"
                      className="shadow-xl shadow-blue-500/20"
                    >
                      <div className="flex items-center gap-2">
                        <Save size={18} />
                        <span>Guardar Horarios</span>
                      </div>
                    </GradientButton>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
            </div>
          </div>
        </PageContainer>
      </div>
    </div>
  );
};

export default BarberProfileEdit;

