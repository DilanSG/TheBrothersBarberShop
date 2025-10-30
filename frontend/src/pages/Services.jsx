import React, { useEffect, useState } from 'react';
import { 
  Plus, Edit, Trash2, Clock, DollarSign, 
  AlertTriangle, CheckCircle, ChevronUp, Settings, 
  Palette, Sparkles, User, Package2, Scissors, Home, Eye, EyeOff,
  Users, Star, X
} from 'lucide-react';
import { useAuth } from '@contexts/AuthContext';
import { api } from '@services/api';
import { PageContainer } from '@components/layout/PageContainer';
import GradientButton from '@components/ui/GradientButton';
import GradientText from '@components/ui/GradientText';
import UserAvatar from '@components/ui/UserAvatar';
import { useNavigationCache } from '@hooks/useNavigationCache';

import logger from '@utils/logger';

// Formatear precio
const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price || 0);
};

function ServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [showBarberModal, setShowBarberModal] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: 0, duration: 30, category: 'corte' });
  const [editing, setEditing] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null); // 'form'
  
  // Verificar que solo admin acceda
  if (user?.role !== 'admin') {
    return (
      <PageContainer>
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 p-4 bg-red-500/20 rounded-full border border-red-500/30">
            <Scissors className="w-full h-full text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Acceso Denegado</h2>
          <p className="text-gray-400 mb-6">
            Esta página es exclusiva para administradores.
          </p>
          <p className="text-gray-500 text-sm">
            Los servicios están disponibles en la página de inicio y en los perfiles de barberos.
          </p>
        </div>
      </PageContainer>
    );
  }
  
  // Hook de caché para optimizar carga de datos
  const { 
    getCachedRouteData, 
    cacheRouteData, 
    hasCachedData,
    invalidatePattern 
  } = useNavigationCache();

  useEffect(() => {
    fetchServices();
    fetchBarbers();
  }, []);

  const fetchBarbers = async () => {
    try {
      // Intentar obtener datos del caché primero
      const cachedBarbers = getCachedRouteData('/barbers');
      if (cachedBarbers) {
        const activeBarbers = cachedBarbers.filter(barber => {
          return barber.user && 
                 barber.user.role === 'barber' && 
                 (barber.user.isActive !== false) && 
                 (barber.isActive !== false);
        });
        // Solo los primeros 3 barberos principales
        setBarbers(activeBarbers.slice(0, 3));
        logger.debug('📦 Barbers loaded from cache');
        return;
      }

      const response = await api.get('/barbers');
      
      if (response.success) {
        const barbersData = response.data || [];
        
        // Filtrar barberos activos (mismo filtro que en Home)
        const activeBarbers = barbersData.filter(barber => {
          return barber.user && 
                 barber.user.role === 'barber' && 
                 (barber.user.isActive !== false) && 
                 (barber.isActive !== false);
        });

        // Solo los primeros 3 barberos principales (como en Home)
        const mainBarbers = activeBarbers.slice(0, 3);
        setBarbers(mainBarbers);
        
        // Cachear los datos por 5 minutos
        cacheRouteData('/barbers', barbersData, 5 * 60 * 1000);
        logger.debug('🗄️ Barbers cached for future use');
      } else {
        throw new Error(response.message || 'Error al cargar barberos');
      }
    } catch (error) {
      console.error('Error en fetchBarbers:', error);
      // No mostrar error aquí, los barberos son opcionales
    }
  };

  const fetchServices = async () => {
    try {
      setLoading(true);
      
      // Intentar obtener datos del caché primero
      const cachedServices = getCachedRouteData('/services');
      if (cachedServices) {
        setServices(cachedServices);
        setLoading(false);
        logger.debug('📦 Services loaded from cache');
        return;
      }
      
      const response = await api.get('/services');
      
      if (response.success) {
        const servicesData = response.data || [];
        setServices(servicesData);
        
        // Cachear los datos por 3 minutos
        cacheRouteData('/services', servicesData, 3 * 60 * 1000);
        logger.debug('🗄️ Services cached for future use');
      } else {
        throw new Error(response.message || 'Error al cargar servicios');
      }
    } catch (error) {
      console.error('Error en fetchServices:', error);
      setError(error.message || 'Error al cargar servicios.');
      setTimeout(() => setError(''), 2500);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = e => {
    const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setForm(prev => ({ ...prev, [e.target.name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      logger.debug('Enviando formulario:', form);
      let response;
      
      if (editing) {
        logger.debug('Actualizando servicio:', editing._id);
        response = await api.put(`/services/${editing._id}`, form);
      } else {
        logger.debug('Creando nuevo servicio');
        response = await api.post('/services', form);
      }
      
      logger.debug('Respuesta:', response);

      if (response.success) {
        setSuccess(editing ? '✅ Servicio actualizado exitosamente' : '✅ Servicio creado exitosamente');
        setTimeout(() => setSuccess(''), 3000);
        
        // Limpiar formulario y cerrar
        setEditing(null);
        setForm({ name: '', description: '', price: 0, duration: 30, category: 'corte' });
        setExpandedSection(null);
        
        // Invalidar caché después de cambios
        invalidatePattern('/services');
        invalidatePattern('/'); // También invalidar home por si afecta los servicios mostrados
        logger.debug('🗑️ Services cache invalidated after update');
        
        // Recargar servicios para mostrar cambios
        fetchServices();
      } else {
        throw new Error(response.message || 'Error al guardar servicio');
      }
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      setError(error.message || 'Error al guardar servicio');
      setTimeout(() => setError(''), 2500);
    }
  };

  const handleEdit = service => {
    logger.debug('🔧 Editando servicio:', service);
    if (!service || !service._id) {
      setError('Error: Servicio no válido para editar');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setEditing(service);
    setForm({
      name: service.name || '',
      description: service.description || '',
      price: service.price || 0,
      duration: service.duration || 30,
      category: service.category || 'corte'
    });
    setExpandedSection('form');
    // Limpiar mensajes existentes
    setError('');
    setSuccess('');
    logger.debug('✅ Formulario de edición configurado correctamente');
  };

  const handleDelete = async id => {
    console.log('🗑️ HandleDelete called with id:', id);
    if (!id) {
      console.log('❌ Invalid service ID');
      setError('ID de servicio inválido');
      setTimeout(() => setError(''), 2500);
      return;
    }

    if (!window.confirm('¿Seguro que deseas eliminar este servicio?')) {
      console.log('❌ Delete cancelled by user');
      return;
    }
    
    console.log('✅ Delete confirmed, proceeding...');

    try {
      logger.debug('Eliminando servicio:', id);
      const response = await api.delete(`/services/${id}`);
      logger.debug('Respuesta de eliminación:', response);

      if (response.success) {
        // Actualizar el estado local inmediatamente
        setServices(prevServices => prevServices.filter(service => service._id !== id));
        
        setSuccess('✅ Servicio eliminado.');
        setTimeout(() => setSuccess(''), 2500);
        
        // Invalidar caché después de eliminación
        invalidatePattern('/services');
        logger.debug('🗑️ Services cache invalidated after deletion');
        
        // Si estábamos editando este servicio, limpiar el formulario
        if (editing?._id === id) {
          setEditing(null);
          setForm({ name: '', description: '', price: 0, duration: 30, category: 'corte' });
        }
      } else {
        throw new Error(response.message || 'Error al eliminar servicio');
      }
    } catch (error) {
      console.error('Error en handleDelete:', error);
      setError(error.message || 'Error al eliminar servicio');
      setTimeout(() => setError(''), 2500);
    }
  };

  const handleToggleShowInHome = async (serviceId, currentShowInHome) => {
    try {
      logger.debug(`Toggleando servicio ${serviceId} de ${currentShowInHome} a ${!currentShowInHome}`);
      
      const response = await api.patch(`/services/${serviceId}/show-in-home`, {
        showInHome: !currentShowInHome
      });

      if (response.success) {
        // Actualizar el estado local inmediatamente
        setServices(prevServices =>
          prevServices.map(service =>
            service._id === serviceId
              ? { ...service, showInHome: !currentShowInHome }
              : service
          )
        );

        // Invalidar cachés relacionados para forzar actualización
        invalidatePattern('/services');
        invalidatePattern('/'); // Para el home que también usa servicios

        const mensaje = !currentShowInHome 
          ? 'Servicio añadido al inicio exitosamente' 
          : 'Servicio quitado del inicio exitosamente';
          
        setSuccess(mensaje);
        setTimeout(() => setSuccess(''), 3000);
        
        logger.debug('Toggle exitoso, nuevo valor:', !currentShowInHome);
      } else {
        throw new Error(response.message || 'Error al actualizar estado');
      }
    } catch (error) {
      console.error('Error en handleToggleShowInHome:', error);
      setError(error.message || 'Error al actualizar estado del servicio');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleNewService = () => {
    logger.debug('🆕 Iniciando nuevo servicio');
    setForm({ name: '', description: '', price: 0, duration: 30, category: 'corte' });
    setEditing(null);
    setExpandedSection('form');
    // Limpiar mensajes existentes
    setError('');
    setSuccess('');
  };

  const formatRating = (rating) => {
    if (!rating || rating === 0) return null;
    return Number(rating).toFixed(1);
  };

  const handleBarberSelect = (barber) => {
    setSelectedBarber(barber);
    setShowBarberModal(false);
    setSuccess(`✅ Barbero seleccionado: ${barber.user?.name || 'Nombre no disponible'}`);
    setTimeout(() => setSuccess(''), 2500);
  };

  return (
    <PageContainer>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 space-y-8">
        {/* Header con efectos mejorados */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl border border-purple-500/20 shadow-xl shadow-blue-500/20">
              <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
            </div>
            <GradientText className="text-xl sm:text-2xl lg:text-3xl font-bold">
              Gestión de Servicios
            </GradientText>
          </div>
          <p className="text-gray-400 text-sm sm:text-base lg:text-lg mb-4 max-w-2xl mx-auto leading-relaxed">
            Administra los servicios de la barbería
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-blue-500/10 backdrop-blur-sm border border-blue-500/20 text-blue-300 rounded-xl text-sm shadow-xl shadow-blue-500/20">
            <Sparkles className="w-4 h-4 mr-2" />
            Solo 3 servicios se mostrarán en la página de inicio
          </div>
        </div>

        {/* Mensajes de error y éxito mejorados */}
        {error && (
          <div className="group relative bg-red-500/5 backdrop-blur-sm border border-red-500/20 rounded-xl p-4 shadow-xl shadow-red-500/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-xl"></div>
            <div className="relative flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-red-300">{error}</span>
            </div>
          </div>
        )}
        
        {success && (
          <div className="group relative bg-green-500/5 backdrop-blur-sm border border-green-500/20 rounded-xl p-4 shadow-xl shadow-green-500/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-xl"></div>
            <div className="relative flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-300">{success}</span>
            </div>
          </div>
        )}

        {/* Container principal con glassmorphism mejorado */}
        <div className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl shadow-blue-500/20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-2xl"></div>
          
          {/* Header de controles mejorado */}
          <div className="relative p-4 sm:p-6 border-b border-white/10 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Package2 className="w-5 h-5 text-blue-400" />
              <span className="text-white font-medium">Servicios Registrados</span>
              <span className="px-2 py-1 bg-blue-500/10 text-blue-300 rounded-full text-xs border border-blue-500/20">
                {services.length}
              </span>
            </div>
            <GradientButton
              onClick={handleNewService}
              className="shadow-xl shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Servicio</span>
            </GradientButton>
          </div>

          {/* Formulario expandible mejorado */}
          {expandedSection === 'form' && (
            <div className="group relative mx-4 sm:mx-6 mt-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md shadow-2xl shadow-blue-500/20 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-xl"></div>
              <div className="relative p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-lg border border-green-500/20 shadow-xl shadow-blue-500/20">
                      {editing ? <Edit className="w-4 h-4 text-green-400" /> : <Plus className="w-4 h-4 text-blue-400" />}
                    </div>
                    <GradientText className="text-lg font-semibold">
                      {editing ? 'Editar Servicio' : 'Nuevo Servicio'}
                    </GradientText>
                  </div>
                  <button
                    onClick={() => setExpandedSection(null)}
                    className="group relative p-2 bg-gradient-to-r from-red-600/20 to-purple-600/20 rounded-lg border border-red-500/20 hover:border-purple-500/40 transition-all duration-300 backdrop-blur-sm hover:bg-gradient-to-r hover:from-red-600/30 hover:to-purple-600/30 transform hover:scale-110 shadow-xl shadow-blue-500/20"
                  >
                    <ChevronUp className="w-4 h-4 text-red-400 group-hover:text-purple-400 transition-colors duration-300" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">Nombre</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className="glassmorphism-input"
                      placeholder="Ej: Corte de cabello"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">Categoría</label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className="glassmorphism-select"
                      required
                    >
                      <option value="corte">Corte</option>
                      <option value="barba">Barba</option>
                      <option value="combo">Combo</option>
                      <option value="tinte">Tinte</option>
                      <option value="tratamiento">Tratamiento</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">Precio ($)</label>
                    <input
                      name="price"
                      type="number"
                      value={form.price}
                      onChange={handleChange}
                      className="glassmorphism-input"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">Duración (min)</label>
                    <input
                      name="duration"
                      type="number"
                      value={form.duration}
                      onChange={handleChange}
                      className="glassmorphism-input"
                      min="15"
                      max="240"
                      step="15"
                      required
                    />
                  </div>

                  <div className="md:col-span-2 lg:col-span-4">
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">Descripción</label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      className="glassmorphism-textarea"
                      rows="3"
                      placeholder="Describe el servicio..."
                      required
                    />
                  </div>

                  <div className="md:col-span-2 lg:col-span-4 flex gap-3 pt-4">
                    <GradientButton type="submit" className="shadow-xl shadow-blue-500/20">
                      <div className="flex items-center gap-2">
                        {editing ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {editing ? 'Actualizar' : 'Crear'}
                      </div>
                    </GradientButton>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(null);
                        setForm({ name: '', description: '', price: 0, duration: 30, category: 'corte' });
                        setExpandedSection(null);
                      }}
                      className="group relative px-4 py-2 bg-gradient-to-r from-gray-600/20 to-red-600/20 rounded-lg border border-gray-500/30 hover:border-red-500/40 transition-all duration-300 backdrop-blur-sm hover:bg-gradient-to-r hover:from-gray-600/30 hover:to-red-600/30 transform hover:scale-105 shadow-xl shadow-blue-500/20"
                    >
                      <span className="text-gray-300 group-hover:text-red-400 transition-colors duration-300">Cancelar</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Lista de servicios mejorada */}
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-gray-400 text-sm">Cargando servicios...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="p-8 text-center">
              <div className="p-4 bg-gradient-to-r from-gray-600/20 to-blue-600/20 rounded-xl border border-gray-500/20 shadow-xl shadow-blue-500/20 inline-flex">
                <Settings className="w-12 h-12 text-gray-400" />
              </div>
              <p className="mt-4 text-gray-400 text-sm">No hay servicios registrados</p>
              <p className="text-gray-500 text-xs mt-2">¡Crea tu primer servicio!</p>
            </div>
          ) : (
            <div className="space-y-2 pl-1 pt-2 pb-2">
              {services.map((service, index) => (
                <div
                  key={service._id}
                  className="group relative backdrop-blur-sm border rounded-lg p-4 sm:p-6 transition-all duration-300 overflow-hidden hover:scale-[1.001] cursor-pointer mx-1 my-1 border-white/20 bg-black/10 hover:border-white/40 shadow-lg hover:shadow-xl"
                  style={{ zIndex: services.length - index }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-lg"></div>
                  <div className="relative">
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                      {/* Icono del servicio */}
                      <div className="p-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/20 shadow-xl shadow-blue-500/20">
                        <Scissors className="w-5 h-5 text-blue-400" />
                      </div>

                      {/* Detalles del servicio */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <GradientText className="text-lg font-semibold">
                            {service.name}
                          </GradientText>
                          {service.showInHome && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 rounded-full shadow-sm shadow-green-500/20">
                              <Home className="w-3 h-3" />
                              Visible en Home
                            </span>
                          )}
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs capitalize shadow-sm shadow-purple-500/20">
                            {service.category}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-400 mb-4 leading-relaxed">{service.description}</p>
                        
                        <div className="flex flex-wrap gap-4 sm:gap-6">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-green-500/20 rounded-lg border border-green-500/30 shadow-sm shadow-green-500/20">
                              <DollarSign className="w-3 h-3 text-green-400" />
                            </div>
                            <span className="text-green-400 font-semibold">{formatPrice(service.price)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-500/20 rounded-lg border border-blue-500/30 shadow-sm shadow-blue-500/20">
                              <Clock className="w-3 h-3 text-blue-400" />
                            </div>
                            <span className="text-blue-300 font-medium">{service.duration} min</span>
                          </div>
                        </div>
                      </div>

                      {/* Acciones mejoradas */}
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleToggleShowInHome(service._id, service.showInHome);
                          }}
                          className={`group relative p-2 rounded-lg transition-all duration-300 backdrop-blur-sm transform hover:scale-110 shadow-lg ${
                            service.showInHome
                              ? 'bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/30 hover:border-blue-500/40 text-green-400 hover:text-blue-400 shadow-green-500/20'
                              : 'bg-gradient-to-r from-gray-600/20 to-purple-600/20 border border-gray-500/30 hover:border-purple-500/40 text-gray-400 hover:text-purple-400 shadow-gray-500/20'
                          }`}
                          title={service.showInHome ? 'Quitar del Home' : 'Mostrar en Home'}
                        >
                          {service.showInHome ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEdit(service);
                          }}
                          className="group relative p-2 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-lg border border-blue-500/30 hover:border-cyan-500/40 transition-all duration-300 backdrop-blur-sm transform hover:scale-110 shadow-lg shadow-blue-500/20"
                          title="Editar servicio"
                        >
                          <Edit className="w-4 h-4 text-blue-400 group-hover:text-cyan-400 transition-colors duration-300" />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDelete(service._id);
                          }}
                          className="group relative p-2 bg-gradient-to-r from-red-600/20 to-pink-600/20 rounded-lg border border-red-500/30 hover:border-pink-500/40 transition-all duration-300 backdrop-blur-sm transform hover:scale-110 shadow-lg shadow-red-500/20"
                          title="Eliminar servicio"
                        >
                          <Trash2 className="w-4 h-4 text-red-400 group-hover:text-pink-400 transition-colors duration-300" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card interactiva de barberos */}
        <div className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl shadow-blue-500/20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-2xl"></div>
          
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl border border-purple-500/20 shadow-xl shadow-blue-500/20">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <GradientText className="text-xl font-bold">
                    Barberos Principales
                  </GradientText>
                  <p className="text-gray-400 text-sm">Los 3 barberos destacados del equipo</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-purple-500/10 text-purple-300 rounded-full text-xs border border-purple-500/20">
                  {barbers.length} disponibles
                </span>
              </div>
            </div>

            {/* Barbero seleccionado actual */}
            {selectedBarber ? (
              <div className="mb-6 p-4 bg-gradient-to-r from-green-500/5 to-blue-500/5 border border-green-500/20 rounded-xl backdrop-blur-sm shadow-lg shadow-green-500/20">
                <div className="flex items-center gap-3">
                  <UserAvatar 
                    user={selectedBarber.user} 
                    size="md" 
                    borderColor="border-green-500/30"
                    className="shadow-lg shadow-green-500/20" 
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <GradientText className="font-semibold">
                        {selectedBarber.user?.name || 'Nombre no disponible'}
                      </GradientText>
                      {selectedBarber.rating && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 backdrop-blur-sm shadow-sm shadow-yellow-500/20">
                          <Star className="w-3 h-3 mr-1 text-yellow-400" fill="currentColor" />
                          {formatRating(selectedBarber.rating)}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">Barbero seleccionado actualmente</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <User className="w-5 h-5" />
                  <span className="text-sm">Ningún barbero seleccionado</span>
                </div>
              </div>
            )}

            {/* Botón para abrir modal */}
            <div className="text-center">
              <GradientButton
                onClick={() => setShowBarberModal(true)}
                className="shadow-xl shadow-blue-500/20"
                disabled={barbers.length === 0}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{selectedBarber ? 'Cambiar Barbero' : 'Seleccionar Barbero'}</span>
                </div>
              </GradientButton>
              {barbers.length === 0 && (
                <p className="text-gray-500 text-xs mt-2">No hay barberos disponibles</p>
              )}
            </div>
          </div>
        </div>

        {/* Modal de selección de barberos */}
        {showBarberModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative w-full max-w-2xl mx-auto">
              <div className="relative bg-blue-500/5 backdrop-blur-md border border-blue-500/20 rounded-2xl shadow-2xl shadow-blue-500/20 overflow-hidden">
                {/* Header del modal */}
                <div className="p-6 border-b border-blue-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg border border-purple-500/20 shadow-lg shadow-blue-500/20">
                        <Users className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <GradientText className="text-lg font-bold">
                          Seleccionar Barbero
                        </GradientText>
                        <p className="text-gray-400 text-sm">Elige uno de los barberos principales</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowBarberModal(false)}
                      className="group relative p-2 bg-gradient-to-r from-red-600/20 to-purple-600/20 rounded-lg border border-red-500/20 hover:border-purple-500/40 transition-all duration-300 backdrop-blur-sm hover:bg-gradient-to-r hover:from-red-600/30 hover:to-purple-600/30 transform hover:scale-110 shadow-lg shadow-red-500/20"
                    >
                      <X className="w-4 h-4 text-red-400 group-hover:text-purple-400 transition-colors duration-300" />
                    </button>
                  </div>
                </div>

                {/* Lista de barberos */}
                <div className="p-6">
                  {barbers.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="p-4 bg-gradient-to-r from-gray-600/20 to-blue-600/20 rounded-xl border border-gray-500/20 shadow-lg shadow-blue-500/20 inline-flex mb-4">
                        <Users className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-400">No hay barberos disponibles</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {barbers.map((barber) => (
                        <div
                          key={barber._id}
                          onClick={() => handleBarberSelect(barber)}
                          className={`group relative p-4 rounded-xl border cursor-pointer transition-all duration-300 hover:scale-105 overflow-hidden backdrop-blur-sm ${
                            selectedBarber?._id === barber._id
                              ? 'border-green-500/50 bg-green-500/10 shadow-xl shadow-green-500/20'
                              : 'border-white/20 bg-white/5 hover:border-blue-500/40 hover:bg-blue-500/10 shadow-lg hover:shadow-xl hover:shadow-blue-500/20'
                          }`}
                        >
                          {/* Efecto de brillo */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-xl"></div>
                          
                          <div className="relative text-center">
                            {/* Foto del barbero */}
                            <div className="mx-auto mb-3">
                              <UserAvatar 
                                user={barber.user} 
                                size="lg" 
                                className="shadow-lg shadow-blue-500/20" 
                              />
                            </div>

                            {/* Información del barbero */}
                            <div className="space-y-2">
                              <GradientText className="font-semibold text-sm">
                                {barber.user?.name || 'Nombre no disponible'}
                              </GradientText>
                              
                              {barber.specialty && (
                                <p className="text-gray-400 text-xs">{barber.specialty}</p>
                              )}
                              
                              {barber.rating && (
                                <div className="flex items-center justify-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-400" fill="currentColor" />
                                  <span className="text-yellow-400 text-xs font-medium">
                                    {formatRating(barber.rating)}
                                  </span>
                                </div>
                              )}
                              
                              {selectedBarber?._id === barber._id && (
                                <div className="mt-2">
                                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 rounded-full shadow-sm shadow-green-500/20">
                                    <CheckCircle className="w-3 h-3" />
                                    Seleccionado
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

export default ServicesPage;

