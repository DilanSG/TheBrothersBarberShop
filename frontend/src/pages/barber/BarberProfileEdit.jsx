import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { useAuth } from '../../contexts/AuthContext';
import { api, barberService, serviceService } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import GradientButton from '../../components/ui/GradientButton';
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
  Calendar,
  Settings,
  FileText
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
  monday: { start: '07:00', end: '19:00', available: true },
  tuesday: { start: '07:00', end: '19:00', available: true },
  wednesday: { start: '07:00', end: '19:00', available: true },
  thursday: { start: '07:00', end: '19:00', available: true },
  friday: { start: '07:00', end: '19:00', available: true },
  saturday: { start: '07:00', end: '19:00', available: true },
  sunday: { start: '07:00', end: '19:00', available: false }
};

const BarberProfileEdit = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const fileInputRef = useRef(null);
  
  // Estados principales
  const [barber, setBarber] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [previewImage, setPreviewImage] = useState(null);
  
  // Estados para el formulario del usuario
  const [userFormData, setUserFormData] = useState({
    name: '',
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

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sincronizar el formulario del usuario cuando el contexto cambie
  useEffect(() => {
    if (user) {
      setUserFormData({
        name: user.name || '',
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
          phone: user?.phone || '',
          birthdate: formatDateForInput(user?.birthdate)
        });
        
        const profilePicture = user?.profilePicture || barberInfo.user?.profilePicture;
        if (profilePicture) {
          setPreviewImage(profilePicture);
        }
        
        if (barberInfo.schedule) {
          setSchedule(barberInfo.schedule);
        }
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

  const handleScheduleChange = (day, field, value) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
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
      showError(error.message || 'Error al actualizar la información personal');
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
      
      const response = await barberService.updateMyProfile({ schedule });
      
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
    <PageContainer>
      <div className="relative py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
          {/* Header compacto con estilo de barbería */}
          <div className="text-center mb-12">
            <button
              onClick={() => navigate('/profile')}
              className="group inline-flex items-center gap-2 mb-10 px-4 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full text-white hover:bg-white/20 hover:border-white/40 transition-all duration-300 shadow-lg hover:scale-105"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-medium text-sm">Volver al Perfil</span>
            </button>
            
            <h1 className="text-2xl md:text-3xl font-bold mb-3 text-white leading-tight drop-shadow-lg">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-white to-blue-400">
                Editar Perfil de Barbero
              </span>
            </h1>
            <p className="text-blue-200 text-sm max-w-2xl mx-auto leading-relaxed">
              Gestiona tu información profesional y destaca tus habilidades como barbero
            </p>
          </div>

          {/* Navegación por pestañas */}
          <div className="flex justify-center mb-8">
            <div className="bg-gray-900/80 backdrop-blur-xl border border-red-500/20 rounded-xl p-1.5 flex flex-col sm:flex-row gap-1 shadow-xl w-full max-w-lg">
              {[
                { id: 'personal', label: 'Personal', icon: User, gradient: 'from-blue-600 to-blue-700' },
                { id: 'professional', label: 'Profesional', icon: Star, gradient: 'from-red-600 to-red-700' },
                { id: 'services', label: 'Servicios', icon: Scissors, gradient: 'from-red-500 to-blue-500' },
                { id: 'schedule', label: 'Horarios', icon: Clock, gradient: 'from-blue-500 to-red-500' }
              ].map(({ id, label, icon: Icon, gradient }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`group relative px-3 py-2.5 rounded-lg font-medium text-xs transition-all duration-300 flex items-center justify-center gap-1.5 transform hover:scale-105 flex-1 ${
                    activeTab === id
                      ? `bg-gradient-to-r ${gradient} text-white shadow-md border border-white/20`
                      : 'text-blue-200 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20'
                  }`}
                >
                  <Icon size={14} className="transition-all duration-300 drop-shadow-sm" />
                  <span className="hidden sm:inline drop-shadow-sm">{label}</span>
                  <span className="sm:hidden drop-shadow-sm">{label.substring(0, 4)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
              
            {/* Tab: Información Personal */}
            {activeTab === 'personal' && (
              <div className="space-y-6">
                
                {/* Foto de Perfil con estilo barbería */}
                <div className="bg-gray-900/80 backdrop-blur-xl border border-red-500/30 rounded-2xl p-4 shadow-2xl hover:bg-gray-900/90 hover:border-red-500/50 transition-all duration-300">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-r from-red-600/20 to-blue-600/20 rounded-xl border border-red-500/20 hover:border-blue-500/40 transition-all duration-500">
                      <Upload size={18} className="text-red-400 hover:text-blue-400 transition-colors duration-500" />
                    </div>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-white to-blue-400 drop-shadow-sm">Foto de Perfil</span>
                  </h3>
                  
                  <div className="flex flex-col items-center space-y-3">
                    <div className="relative group">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-blue-900 border-2 border-red-500/30 shadow-xl hover:border-red-500/60 transition-all duration-300">
                        <img
                          src={previewImage || user?.profilePicture || '/images/default-avatar.png'}
                          alt="Foto de perfil"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        
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
                        className="group relative p-2 bg-gradient-to-r from-blue-600/20 to-red-600/20 rounded-lg border border-blue-500/30 hover:border-red-500/40 transition-all duration-300 backdrop-blur-sm hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-red-600/30 transform hover:scale-110"
                        title="Subir foto"
                      >
                        <Upload size={16} className="text-blue-400 group-hover:text-red-400 transition-colors duration-300" />
                      </button>
                      
                      {(user?.profilePicture || previewImage) && (
                        <button
                          onClick={handleRemoveProfilePicture}
                          disabled={saving}
                          className="group relative p-2 bg-gradient-to-r from-red-600/20 to-blue-600/20 rounded-lg border border-red-500/30 hover:border-blue-500/40 transition-all duration-300 backdrop-blur-sm hover:bg-gradient-to-r hover:from-red-600/30 hover:to-blue-600/30 transform hover:scale-110"
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
                <div className="group relative overflow-hidden bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-sm rounded-3xl border border-gray-700/50 hover:border-blue-500/40 transition-all duration-700 transform hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(59,130,246,0.25)]">
                  {/* Efecto de brillo en hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  <div className="relative p-8">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-r from-blue-600/20 to-red-600/20 rounded-xl border border-blue-500/20 group-hover:border-red-500/40 transition-all duration-500">
                        <User size={20} className="text-blue-400 group-hover:text-red-400 transition-colors duration-500" />
                      </div>
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-white to-red-400 drop-shadow-sm">Información Personal</span>
                    </h3>
                  
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="block text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-white to-blue-400 flex items-center gap-2">
                          <User size={16} className="text-red-400" />
                          Nombre Completo
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={userFormData.name}
                          onChange={handleUserInputChange}
                          className="w-full px-4 py-2 bg-gradient-to-r from-red-600/25 to-blue-600/25 border border-red-500/30 rounded-full text-gray-100 placeholder-red-200/70 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/40 hover:border-red-500/40 hover:bg-gradient-to-r hover:from-red-600/35 hover:to-blue-600/35 transition-all duration-300 text-sm font-medium tracking-wider backdrop-blur-sm shadow-inner"
                          placeholder="Tu nombre completo"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="block text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-white to-red-400 flex items-center gap-2">
                          <Phone size={16} className="text-blue-400" />
                          Teléfono
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={userFormData.phone}
                          onChange={handleUserInputChange}
                          className="w-full px-4 py-2 bg-gradient-to-r from-blue-600/25 to-red-600/25 border border-blue-500/30 rounded-full text-gray-100 placeholder-blue-200/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 hover:border-blue-500/40 hover:bg-gradient-to-r hover:from-blue-600/35 hover:to-red-600/35 transition-all duration-300 text-sm font-medium tracking-wider backdrop-blur-sm shadow-inner"
                          placeholder="+57 300 123 4567"
                        />
                      </div>

                      <div className="space-y-3 lg:col-span-2">
                        <label className="block text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-white to-blue-400 flex items-center gap-2">
                          <Calendar size={16} className="text-red-400" />
                          Fecha de Nacimiento
                        </label>
                        <input
                          type="date"
                          name="birthdate"
                          value={userFormData.birthdate}
                          onChange={handleUserInputChange}
                          className="w-full px-4 py-2 bg-gradient-to-r from-red-600/25 to-blue-600/25 border border-red-500/30 rounded-full text-gray-100 placeholder-red-200/70 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/40 hover:border-red-500/40 hover:bg-gradient-to-r hover:from-red-600/35 hover:to-blue-600/35 transition-all duration-300 text-sm font-medium tracking-wider backdrop-blur-sm shadow-inner"
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

            {/* Tab: Información Profesional */}
            {activeTab === 'professional' && (
              <div className="group relative overflow-hidden bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-sm rounded-3xl border border-gray-700/50 hover:border-red-500/40 transition-all duration-700 transform hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(239,68,68,0.25)]">
                {/* Efecto de brillo en hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                <div className="relative p-8">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-r from-red-600/20 to-blue-600/20 rounded-xl border border-red-500/20 group-hover:border-blue-500/40 transition-all duration-500">
                      <Star size={20} className="text-red-400 group-hover:text-blue-400 transition-colors duration-500" />
                    </div>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-white to-blue-400 drop-shadow-sm">Información Profesional</span>
                  </h3>
                
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-white to-blue-400 flex items-center gap-2">
                        <Scissors size={16} className="text-red-400" />
                        Especialidad
                      </label>
                      <input
                        type="text"
                        name="specialty"
                        value={barberFormData.specialty}
                        onChange={handleBarberInputChange}
                        className="w-full px-4 py-2 bg-gradient-to-r from-red-600/25 to-blue-600/25 border border-red-500/30 rounded-full text-gray-100 placeholder-red-200/70 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/40 hover:border-red-500/40 hover:bg-gradient-to-r hover:from-red-600/35 hover:to-blue-600/35 transition-all duration-300 text-sm font-medium tracking-wider backdrop-blur-sm shadow-inner"
                        placeholder="Ej: Cortes clásicos, barbas, etc."
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-white to-red-400 flex items-center gap-2">
                        <Star size={16} className="text-blue-400" />
                        Años de Experiencia
                      </label>
                      <input
                        type="number"
                        name="experience"
                        min="0"
                        value={barberFormData.experience}
                        onChange={handleBarberInputChange}
                        className="w-full px-4 py-2 bg-gradient-to-r from-blue-600/25 to-red-600/25 border border-blue-500/30 rounded-full text-gray-100 placeholder-blue-200/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 hover:border-blue-500/40 hover:bg-gradient-to-r hover:from-blue-600/35 hover:to-red-600/35 transition-all duration-300 text-sm font-medium tracking-wider backdrop-blur-sm shadow-inner"
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-3 lg:col-span-2">
                      <label className="block text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-white to-blue-400 flex items-center gap-2">
                        <FileText size={16} className="text-red-400" />
                        Descripción
                      </label>
                      <textarea
                        name="description"
                        value={barberFormData.description}
                        onChange={handleBarberInputChange}
                        rows={3}
                        className="w-full px-4 py-2 bg-gradient-to-r from-red-600/25 to-blue-600/25 border border-red-500/30 rounded-xl text-gray-100 placeholder-red-200/70 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/40 hover:border-red-500/40 hover:bg-gradient-to-r hover:from-red-600/35 hover:to-blue-600/35 transition-all duration-300 text-sm font-medium tracking-wider backdrop-blur-sm shadow-inner resize-none"
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
              <div className="group relative overflow-hidden bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-sm rounded-3xl border border-gray-700/50 hover:border-red-500/40 transition-all duration-700 transform hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(239,68,68,0.25)]">
                {/* Efecto de brillo en hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                <div className="relative p-8">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-r from-red-600/20 to-blue-600/20 rounded-xl border border-red-500/20 group-hover:border-blue-500/40 transition-all duration-500">
                      <Scissors size={20} className="text-red-400 group-hover:text-blue-400 transition-colors duration-500" />
                    </div>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-white to-blue-400 drop-shadow-sm">Servicios que Ofreces</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {availableServices.map((service) => (
                      <label
                        key={service._id}
                        className={`group relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-500 hover:scale-105 overflow-hidden ${
                          barberFormData.services.includes(service._id)
                            ? 'border-transparent bg-gradient-to-br from-red-500/30 via-white/10 to-blue-500/30 shadow-xl shadow-red-500/30'
                            : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                        }`}
                      >
                        {/* Efecto de brillo para servicios seleccionados */}
                        {barberFormData.services.includes(service._id) && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        )}
                        
                        <input
                          type="checkbox"
                          checked={barberFormData.services.includes(service._id)}
                          onChange={(e) => handleServiceToggle(service._id, e.target.checked)}
                          className="sr-only"
                        />
                        
                        <div className="relative z-10 flex flex-col space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className={`font-bold text-base group-hover:scale-105 transition-transform duration-300 ${
                              barberFormData.services.includes(service._id)
                                ? 'bg-clip-text text-transparent bg-gradient-to-r from-red-300 via-white to-blue-300'
                                : 'text-white'
                            }`}>
                              {service.name}
                            </h4>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                              barberFormData.services.includes(service._id)
                                ? 'border-red-400 bg-gradient-to-r from-red-500 to-blue-500 shadow-lg'
                                : 'border-gray-400 group-hover:border-white'
                            }`}>
                              {barberFormData.services.includes(service._id) && (
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                              )}
                            </div>
                          </div>
                          
                          <p className={`text-sm leading-relaxed ${
                            barberFormData.services.includes(service._id)
                              ? 'text-gray-200'
                              : 'text-gray-300'
                          }`}>
                            {service.description}
                          </p>
                          
                          <div className="flex justify-between items-center pt-2 border-t border-white/20">
                            <span className={`font-bold text-base ${
                              barberFormData.services.includes(service._id)
                                ? 'bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-blue-400'
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
              <div className="group relative overflow-hidden bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-sm rounded-3xl border border-gray-700/50 hover:border-blue-500/40 transition-all duration-700 transform hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(59,130,246,0.25)]">
                {/* Efecto de brillo en hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                <div className="relative p-8">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-r from-blue-600/20 to-red-600/20 rounded-xl border border-blue-500/20 group-hover:border-red-500/40 transition-all duration-500">
                      <Clock size={20} className="text-blue-400 group-hover:text-red-400 transition-colors duration-500" />
                    </div>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-white to-red-400 drop-shadow-sm">Horarios de Trabajo</span>
                  </h3>
                  
                  <div className="space-y-3 mb-6">
                    {Object.entries(schedule).map(([day, daySchedule]) => (
                      <div
                        key={day}
                        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4"
                      >
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
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
                              <input
                                type="time"
                                step="1800"
                                value={daySchedule.start}
                                onChange={(e) => handleScheduleChange(day, 'start', e.target.value)}
                                className="px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              />
                              <span className="text-gray-300 font-medium text-sm">a</span>
                              <input
                                type="time"
                                step="1800"
                                value={daySchedule.end}
                                onChange={(e) => handleScheduleChange(day, 'end', e.target.value)}
                                className="px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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

                  <div className="flex justify-end">
                    <GradientButton
                      onClick={handleScheduleSave}
                      disabled={saving}
                      loading={saving}
                      loadingText="Guardando..."
                      variant="primary"
                      size="md"
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
    </PageContainer>
  );
};

export default BarberProfileEdit;
