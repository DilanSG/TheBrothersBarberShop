import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { api } from '../services/api';
import GradientButton from '../components/ui/GradientButton';
import {PageContainer} from '../components/layout/PageContainer';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Camera, 
  Save, 
  ArrowLeft,
  Upload,
  X,
  Eye,
  EyeOff,
  Settings,
  Bell,
  Lock
} from 'lucide-react';

const UserProfileEdit = () => {
  const { user, setUser } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [previewImage, setPreviewImage] = useState(null);

  // Función para formatear fecha sin desfase de zona horaria
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() + (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    birthdate: formatDateForInput(user?.birthdate),
    profilePicture: user?.profilePicture || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [preferencesData, setPreferencesData] = useState({
    emailNotifications: user?.preferences?.emailNotifications ?? true,
    marketingEmails: user?.preferences?.marketingEmails ?? false
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Sincronizar el estado del formulario cuando el usuario se actualice
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        birthdate: formatDateForInput(user.birthdate),
        profilePicture: user.profilePicture || ''
      });
      
      setPreferencesData({
        emailNotifications: user.preferences?.emailNotifications ?? true,
        marketingEmails: user.preferences?.marketingEmails ?? false
      });
    }
  }, [user]);

  // Manejar cambios en los campos del formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePreferencesChange = (e) => {
    const { name, checked } = e.target;
    setPreferencesData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Manejar selección de archivo para foto de perfil
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

  // Remover foto de perfil
  const handleRemoveProfilePicture = () => {
    setPreviewImage(null);
    setFormData(prev => ({ ...prev, profilePicture: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Subir foto de perfil
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

  // Guardar cambios del perfil
  const handleProfileSave = async () => {
    try {
      setLoading(true);

      let profilePictureUrl = formData.profilePicture;

      if (fileInputRef.current?.files[0]) {
        profilePictureUrl = await uploadProfilePicture(fileInputRef.current.files[0]);
      }

      const updatedData = {};
      
      if (formData.name && formData.name.trim()) {
        updatedData.name = formData.name.trim();
      }
      
      if (formData.email && formData.email.trim()) {
        updatedData.email = formData.email.trim();
      }
      
      if (formData.phone && formData.phone.trim()) {
        updatedData.phone = formData.phone.trim();
      }
      
      if (formData.birthdate && formData.birthdate.trim()) {
        updatedData.birthdate = formData.birthdate.trim();
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

      setFormData({
        name: updatedUser.name || '',
        email: updatedUser.email || '',
        phone: updatedUser.phone || '',
        birthdate: formatDateForInput(updatedUser.birthdate),
        profilePicture: updatedUser.profilePicture || ''
      });

      setPreviewImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      showSuccess('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      showError(error.message || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  // Cambiar contraseña
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

      setLoading(true);

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
      setLoading(false);
    }
  };

  // Guardar preferencias
  const handlePreferencesSave = async () => {
    try {
      setLoading(true);

      const response = await api.put('/users/preferences', preferencesData);
      const userData = response.data || response;
      
      setUser(prev => ({
        ...prev,
        preferences: userData.preferences || preferencesData
      }));

      showSuccess('Preferencias actualizadas correctamente');
    } catch (error) {
      console.error('Error al actualizar preferencias:', error);
      showError(error.message || 'Error al actualizar las preferencias');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className="relative py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
          {/* Header compacto con estilo de barbería */}
          <div className="text-center mb-12">
            <button
              onClick={() => navigate('/dashboard')}
              className="group inline-flex items-center gap-2 mb-10 px-4 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full text-white hover:bg-white/20 hover:border-white/40 transition-all duration-300 shadow-lg hover:scale-105"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-medium text-sm">Volver al Dashboard</span>
            </button>
            
            <h1 className="text-2xl md:text-3xl font-bold mb-3 text-white leading-tight drop-shadow-lg">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-white to-blue-400">
                Editar Perfil de Usuario
              </span>
            </h1>
            <p className="text-blue-200 text-sm max-w-2xl mx-auto leading-relaxed">
              Gestiona tu información personal y preferencias de la cuenta con total seguridad
            </p>
          </div>

            {/* Navegación por pestañas más compacta */}
            <div className="flex justify-center mb-8">
              <div className="bg-gray-900/80 backdrop-blur-xl border border-red-500/20 rounded-xl p-1.5 flex flex-col sm:flex-row gap-1 shadow-xl w-full max-w-md">
                {[
                  { id: 'personal', label: 'Personal', icon: User, gradient: 'from-blue-600 to-blue-700' },
                  { id: 'security', label: 'Seguridad', icon: Lock, gradient: 'from-red-600 to-red-700' },
                  { id: 'preferences', label: 'Preferencias', icon: Bell, gradient: 'from-red-500 to-blue-500' }
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

            {/* Content compacto */}
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
                            src={previewImage || formData.profilePicture || '/images/default-avatar.png'}
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
                          disabled={loading}
                          className="group relative p-2 bg-gradient-to-r from-blue-600/20 to-red-600/20 rounded-lg border border-blue-500/30 hover:border-red-500/40 transition-all duration-300 backdrop-blur-sm hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-red-600/30 transform hover:scale-110"
                          title="Subir foto"
                        >
                          <Upload size={16} className="text-blue-400 group-hover:text-red-400 transition-colors duration-300" />
                        </button>
                        
                        {(formData.profilePicture || previewImage) && (
                          <button
                            onClick={handleRemoveProfilePicture}
                            disabled={loading}
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
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 bg-gradient-to-r from-red-600/25 to-blue-600/25 border border-red-500/30 rounded-full text-gray-100 placeholder-red-200/70 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/40 hover:border-red-500/40 hover:bg-gradient-to-r hover:from-red-600/35 hover:to-blue-600/35 transition-all duration-300 text-sm font-medium tracking-wider backdrop-blur-sm shadow-inner"
                            placeholder="Tu nombre completo"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="block text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-white to-red-400 flex items-center gap-2">
                            <Mail size={16} className="text-blue-400" />
                            Correo Electrónico
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 bg-gradient-to-r from-blue-600/25 to-red-600/25 border border-blue-500/30 rounded-full text-gray-100 placeholder-blue-200/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 hover:border-blue-500/40 hover:bg-gradient-to-r hover:from-blue-600/35 hover:to-red-600/35 transition-all duration-300 text-sm font-medium tracking-wider backdrop-blur-sm shadow-inner"
                            placeholder="tu@email.com"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="block text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-white to-blue-400 flex items-center gap-2">
                            <Phone size={16} className="text-red-400" />
                            Teléfono
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 bg-gradient-to-r from-red-600/25 to-blue-600/25 border border-red-500/30 rounded-full text-gray-100 placeholder-red-200/70 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/40 hover:border-red-500/40 hover:bg-gradient-to-r hover:from-red-600/35 hover:to-blue-600/35 transition-all duration-300 text-sm font-medium tracking-wider backdrop-blur-sm shadow-inner"
                            placeholder="+57 300 123 4567"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="block text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-white to-red-400 flex items-center gap-2">
                            <Calendar size={16} className="text-blue-400" />
                            Fecha de Nacimiento
                          </label>
                          <input
                            type="date"
                            name="birthdate"
                            value={formData.birthdate}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 bg-gradient-to-r from-blue-600/25 to-red-600/25 border border-blue-500/30 rounded-full text-gray-100 placeholder-blue-200/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 hover:border-blue-500/40 hover:bg-gradient-to-r hover:from-blue-600/35 hover:to-red-600/35 transition-all duration-300 text-sm font-medium tracking-wider backdrop-blur-sm shadow-inner"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end mt-6">
                        <GradientButton
                          onClick={handleProfileSave}
                          disabled={loading}
                          loading={loading}
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

              {/* Tab: Seguridad con estilo barbería */}
              {activeTab === 'security' && (
                <div className="group relative overflow-hidden bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-sm rounded-3xl border border-gray-700/50 hover:border-red-500/40 transition-all duration-700 transform hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(220,38,38,0.25)]">
                  {/* Efecto de brillo en hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  <div className="relative p-8">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-r from-red-600/20 to-blue-600/20 rounded-xl border border-red-500/20 group-hover:border-blue-500/40 transition-all duration-500">
                        <Lock size={20} className="text-red-400 group-hover:text-blue-400 transition-colors duration-500" />
                      </div>
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-white to-blue-400 drop-shadow-sm">Cambiar Contraseña</span>
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
                            className="w-full px-4 py-2 bg-gradient-to-r from-red-600/25 to-blue-600/25 border border-red-500/30 rounded-full text-gray-100 placeholder-red-200/70 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/40 hover:border-red-500/40 hover:bg-gradient-to-r hover:from-red-600/35 hover:to-blue-600/35 transition-all duration-300 pr-12 text-sm font-medium tracking-wider backdrop-blur-sm shadow-inner"
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
                            className="w-full px-4 py-2 bg-gradient-to-r from-red-600/25 to-blue-600/25 border border-red-500/30 rounded-full text-gray-100 placeholder-blue-200/70 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/40 hover:border-red-500/40 hover:bg-gradient-to-r hover:from-red-600/35 hover:to-blue-600/35 transition-all duration-300 pr-12 text-sm font-medium tracking-wider backdrop-blur-sm shadow-inner"
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
                            className="w-full px-4 py-2 bg-gradient-to-r from-red-600/25 to-blue-600/25 border border-red-500/30 rounded-full text-gray-100 placeholder-red-200/70 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/40 hover:border-red-500/40 hover:bg-gradient-to-r hover:from-red-600/35 hover:to-blue-600/35 transition-all duration-300 pr-12 text-sm font-medium tracking-wider backdrop-blur-sm shadow-inner"
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
                          disabled={loading}
                          loading={loading}
                          loadingText="Actualizando..."
                          variant="primary"
                          size="md"
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

              {/* Tab: Preferencias con estilo barbería */}
              {activeTab === 'preferences' && (
                <div className="group relative overflow-hidden bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-sm rounded-3xl border border-gray-700/50 hover:border-blue-500/40 transition-all duration-700 transform hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(59,130,246,0.25)]">
                  {/* Efecto de brillo en hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  <div className="relative p-8">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-r from-blue-600/20 to-red-600/20 rounded-xl border border-blue-500/20 group-hover:border-red-500/40 transition-all duration-500">
                        <Bell size={20} className="text-blue-400 group-hover:text-red-400 transition-colors duration-500" />
                      </div>
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-white to-red-400 drop-shadow-sm">Preferencias de Notificaciones</span>
                    </h3>
                  
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-600/25 to-blue-600/25 rounded-full border border-red-500/30 hover:border-red-500/40 hover:bg-gradient-to-r hover:from-red-600/35 hover:to-blue-600/35 transition-all duration-300 backdrop-blur-sm">
                        <div>
                          <h4 className="text-white font-semibold text-sm">Notificaciones por Email</h4>
                          <p className="text-blue-200 text-xs mt-1">Recibe notificaciones importantes por correo electrónico</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="emailNotifications"
                            checked={preferencesData.emailNotifications}
                            onChange={handlePreferencesChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600/80 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-red-500 peer-checked:to-red-600 shadow-lg backdrop-blur-sm"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600/25 to-red-600/25 rounded-full border border-blue-500/30 hover:border-blue-500/40 hover:bg-gradient-to-r hover:from-blue-600/35 hover:to-red-600/35 transition-all duration-300 backdrop-blur-sm">
                        <div>
                          <h4 className="text-white font-semibold text-sm">Emails de Marketing</h4>
                          <p className="text-blue-200 text-xs mt-1">Recibe información sobre promociones y novedades</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="marketingEmails"
                            checked={preferencesData.marketingEmails}
                            onChange={handlePreferencesChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600/80 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-blue-600 shadow-lg backdrop-blur-sm"></div>
                        </label>
                      </div>

                      <div className="flex justify-end mt-6">
                        <GradientButton
                          onClick={handlePreferencesSave}
                          disabled={loading}
                          loading={loading}
                          loadingText="Guardando..."
                          variant="primary"
                          size="md"
                        >
                          <div className="flex items-center gap-2">
                            <Save size={18} />
                            <span>Guardar Preferencias</span>
                          </div>
                        </GradientButton>
                      </div>
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

export default UserProfileEdit;
