import React, { useState, useEffect } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useNotification } from '@contexts/NotificationContext';
import { PageContainer } from '@components/layout/PageContainer';
import { api, barberService } from '@services/api';
import GradientButton from '@components/ui/GradientButton';
import GradientText from '@components/ui/GradientText';
import UserAvatar from '@components/ui/UserAvatar';
import EditServiceModal from '@components/modals/EditServiceModal';
import DeleteServiceModal from '@components/modals/DeleteServiceModal';
import logger from '@utils/logger';
import { 
  Scissors, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Clock,
  DollarSign,
  Tag,
  AlertCircle,
  Home, 
  Check,
  X,
  Users,
  Star,
  CheckCircle
} from 'lucide-react';

const AdminServices = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [mainBarbers, setMainBarbers] = useState([]); // Los 3 barberos principales seleccionados
  const [showBarberModal, setShowBarberModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [homeServices, setHomeServices] = useState([]);
  
  // Estados para modales
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Verificar que solo admin acceda
  if (user?.role !== 'admin') {
    return (
      <PageContainer>
        <div className="text-center py-20">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Acceso Denegado</h2>
          <p className="text-gray-400">Solo los administradores pueden acceder a esta página</p>
        </div>
      </PageContainer>
    );
  }

  useEffect(() => {
    fetchServices();
    fetchBarbers();
  }, []);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (showBarberModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup al desmontar el componente
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showBarberModal]);

  const fetchBarbers = async (forceRefresh = false) => {
    try {
      logger.debug('🔍 [AdminServices] Iniciando fetchBarbers...', forceRefresh ? '(FORCE REFRESH)' : '');
      const startTime = Date.now();
      
      // Si forceRefresh es true, agregar timestamp para bypass del caché
      const url = forceRefresh ? `/barbers?_t=${Date.now()}` : '/barbers';
      const response = await api.get(url);
      
      if (response.success) {
        const barbersData = response.data || [];
        const endTime = Date.now();
        logger.debug(`📦 [AdminServices] Datos recibidos en ${endTime - startTime}ms:`, barbersData.length, 'barberos');
        
        // Los barberos ya vienen filtrados y ordenados desde el backend optimizado
        const activeBarbers = barbersData.filter(barber => {
          const isActive = barber.user && 
                 barber.user.role === 'barber' && 
                 (barber.user.isActive !== false) && 
                 (barber.isActive !== false);
          logger.debug(`👤 [AdminServices] ${barber.user?.name}: isActive=${isActive}, isMainBarber=${barber.isMainBarber}`);
          return isActive;
        });

        logger.debug('✅ [AdminServices] Barberos activos:', activeBarbers.length);

        // Identificar los barberos marcados como principales (isMainBarber: true)
        const currentMainBarbers = activeBarbers.filter(barber => barber.isMainBarber === true);
        logger.debug('🎯 [AdminServices] Barberos principales encontrados:', currentMainBarbers.length);
        logger.debug('🎯 [AdminServices] Lista de principales:', currentMainBarbers.map(b => b.user?.name));
        
        // ⚡ ACTUALIZACIÓN ATÓMICA DEL ESTADO
        setBarbers(activeBarbers);
        setMainBarbers(currentMainBarbers);
        
        logger.debug('💾 [AdminServices] Estado actualizado exitosamente');
      }
    } catch (error) {
      console.error('❌ [AdminServices] Error fetching barbers:', error);
      // No mostrar error aquí, los barberos son opcionales
    }
  };

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/services');
      
      if (response.success) {
        const homeServicesFromBackend = response.data.filter(service => service.showInHome);
        setServices(response.data);
        setHomeServices(homeServicesFromBackend);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      showError('Error al cargar los servicios');
    } finally {
      setLoading(false);
    }
  };

  const toggleShowInHome = async (serviceId, currentStatus) => {
    const newStatus = !currentStatus;
    
    try {
      // 🚀 OPTIMISTIC UPDATE - Actualizar UI inmediatamente
      const updatedServices = services.map(service =>
        service._id === serviceId
          ? { ...service, showInHome: newStatus }
          : service
      );
      
      setServices(updatedServices);

      // Actualizar homeServices basándose en los servicios actualizados
      const newHomeServices = updatedServices.filter(service => service.showInHome);
      setHomeServices(newHomeServices);

      const response = await api.patch(`/services/${serviceId}/show-in-home`, {
        showInHome: newStatus
      });

      if (response.success) {
        showSuccess(response.message);
      } else {
        throw new Error('Response was not successful');
      }
    } catch (error) {
      // ❌ REVERTIR OPTIMISTIC UPDATE
      console.error('Error updating service:', error);
      showError(error.response?.data?.message || 'Error al actualizar el servicio');
      
      // Revertir a estado original
      const revertedServices = services.map(service =>
        service._id === serviceId
          ? { ...service, showInHome: currentStatus }
          : service
      );
      
      setServices(revertedServices);
      
      // Restaurar homeServices basándose en el estado original
      const originalHomeServices = revertedServices.filter(service => service.showInHome);
      setHomeServices(originalHomeServices);
    }
  };

  const formatRating = (rating) => {
    if (!rating) return null;
    if (typeof rating === 'object' && rating.average !== undefined) {
      return rating.average === 0 ? null : Number(rating.average).toFixed(1);
    }
    return rating === 0 ? null : Number(rating).toFixed(1);
  };

  // Funciones para modales de servicio
  const handleEditService = (service) => {
    setSelectedService(service);
    setShowEditModal(true);
  };

  const handleDeleteService = (service) => {
    setSelectedService(service);
    setShowDeleteModal(true);
  };

  const handleUpdateService = async (serviceId, updateData) => {
    try {
      setModalLoading(true);
      const response = await api.put(`/services/${serviceId}`, updateData);
      
      if (response.success) {
        showSuccess('Servicio actualizado exitosamente');
        setShowEditModal(false);
        setSelectedService(null);
        await fetchServices();
      }
    } catch (error) {
      console.error('Error updating service:', error);
      showError(error.response?.data?.message || 'Error al actualizar el servicio');
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmDeleteService = async (serviceId) => {
    try {
      setModalLoading(true);
      const response = await api.delete(`/services/${serviceId}`);
      
      if (response.success) {
        showSuccess('Servicio eliminado exitosamente');
        setShowDeleteModal(false);
        setSelectedService(null);
        await fetchServices();
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      showError(error.response?.data?.message || 'Error al eliminar el servicio');
    } finally {
      setModalLoading(false);
    }
  };

  const closeModals = () => {
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedService(null);
  };

  const handleBarberSelect = async (barber) => {
    try {
      logger.debug('🎯 [AdminServices] handleBarberSelect called for:', barber.user?.name);
      logger.debug('🎯 [AdminServices] Current isMainBarber:', barber.isMainBarber, typeof barber.isMainBarber);
      
      const isCurrentlyMain = barber.isMainBarber === true;
      const willBeMain = !isCurrentlyMain;
      logger.debug('🎯 [AdminServices] isCurrentlyMain:', isCurrentlyMain, '-> willBeMain:', willBeMain);
      
      // Si quiere marcar como principal y ya hay 3, mostrar error inmediatamente
      if (willBeMain && mainBarbers.length >= 3) {
        logger.debug('❌ [AdminServices] Max 3 barberos alcanzado');
        showError('Solo puedes seleccionar máximo 3 barberos principales');
        return;
      }

      // 🚀 OPTIMISTIC UPDATE - Actualizar UI inmediatamente
      setBarbers(prevBarbers => 
        prevBarbers.map(b => 
          b._id === barber._id 
            ? { ...b, isMainBarber: willBeMain }
            : b
        )
      );

      // Actualizar mainBarbers inmediatamente
      if (willBeMain) {
        setMainBarbers(prev => [...prev, { ...barber, isMainBarber: true }]);
      } else {
        setMainBarbers(prev => prev.filter(mb => mb._id !== barber._id));
      }

      // 🌐 LLAMADA AL BACKEND
      logger.debug('📡 [AdminServices] Calling updateMainBarberStatus...');
      const response = await barberService.updateMainBarberStatus(barber._id, willBeMain);
      logger.debug('📡 [AdminServices] Response:', response);

      if (response.success) {
        logger.debug('✅ [AdminServices] Backend actualizado exitosamente');
        showSuccess(response.message || `Barbero ${willBeMain ? 'agregado a' : 'removido de'} barberos principales`);
        
        // 🔄 SINCRONIZAR CON BACKEND para confirmar estado real
        await fetchBarbers(true);
      } else {
        // ❌ REVERTIR OPTIMISTIC UPDATE
        logger.debug('❌ [AdminServices] Revirtiendo cambios optimistas...');
        setBarbers(prevBarbers => 
          prevBarbers.map(b => 
            b._id === barber._id 
              ? { ...b, isMainBarber: isCurrentlyMain }
              : b
          )
        );
        
        if (willBeMain) {
          setMainBarbers(prev => prev.filter(mb => mb._id !== barber._id));
        } else {
          setMainBarbers(prev => [...prev, barber]);
        }
        
        showError('Error al actualizar el estado del barbero');
      }
    } catch (error) {
      // ❌ REVERTIR OPTIMISTIC UPDATE EN CASO DE ERROR
      logger.debug('❌ [AdminServices] Revirtiendo cambios por error...');
      setBarbers(prevBarbers => 
        prevBarbers.map(b => 
          b._id === barber._id 
            ? { ...b, isMainBarber: barber.isMainBarber }
            : b
        )
      );
      
      // Restaurar mainBarbers también
      await fetchBarbers(true);
      
      console.error('❌ [AdminServices] Error updating main barber status:', error);
      showError(error.response?.data?.message || 'Error al actualizar el estado del barbero');
    }
  };

  const getStatusBadge = (isActive, showInHome) => {
    if (!isActive) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900/50 text-red-400 border border-red-500/20">
          <X className="w-3 h-3 mr-1" />
          Inactivo
        </span>
      );
    }
    
    if (showInHome) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-400 border border-green-500/20">
          <Home className="w-3 h-3 mr-1" />
          En Home
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/50 text-blue-400 border border-blue-500/20">
        <Check className="w-3 h-3 mr-1" />
        Activo
      </span>
    );
  };

  const ServiceCard = ({ service }) => (
    <div className="relative backdrop-blur-sm border border-white/10 rounded-2xl p-6 bg-white/5 shadow-xl shadow-blue-500/20 hover:border-white/20 hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-500">
      {/* Efecto de brillo */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000 rounded-2xl"></div>
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-600/20 to-blue-600/20 rounded-xl flex items-center justify-center border border-red-500/20">
              <Scissors className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">{service.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge(service.isActive, service.showInHome)}
              </div>
            </div>
          </div>
        </div>

        {/* Descripción */}
        <p className="text-gray-400 text-sm mb-4 leading-relaxed">
          {service.description}
        </p>

        {/* Info del servicio */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <DollarSign className="w-4 h-4 text-green-400 mx-auto mb-1" />
            <p className="text-green-400 font-bold">${service.price}</p>
            <p className="text-gray-500 text-xs">Precio</p>
          </div>
          <div className="text-center">
            <Clock className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <p className="text-blue-400 font-bold">{service.duration}min</p>
            <p className="text-gray-500 text-xs">Duración</p>
          </div>
          <div className="text-center">
            <Tag className="w-4 h-4 text-purple-400 mx-auto mb-1" />
            <p className="text-purple-400 font-bold capitalize">{service.category}</p>
            <p className="text-gray-500 text-xs">Categoría</p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleShowInHome(service._id, service.showInHome)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                service.showInHome
                  ? 'bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30'
                  : 'bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30'
              }`}
            >
              {service.showInHome ? (
                <>
                  <EyeOff className="w-3 h-3" />
                  Quitar del Home
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3" />
                  Mostrar en Home
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleEditService(service)}
              className="flex items-center justify-center w-8 h-8 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 rounded-lg text-blue-400 transition-all duration-300"
              title="Editar servicio"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button 
              onClick={() => handleDeleteService(service)}
              className="flex items-center justify-center w-8 h-8 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 rounded-lg text-red-400 transition-all duration-300"
              title="Eliminar servicio"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Cargando servicios...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <GradientText className="text-3xl sm:text-4xl font-bold mb-4">
            Gestión de Servicios
          </GradientText>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Administra los servicios de la barbería y selecciona cuáles mostrar en el Home
          </p>
          <div className="mt-6">
            <GradientButton variant="primary" size="md">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Servicio
            </GradientButton>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="backdrop-blur-sm border border-white/10 rounded-xl p-4 bg-white/5">
            <div className="text-center">
              <Scissors className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{services.length}</p>
              <p className="text-gray-400 text-sm">Total Servicios</p>
            </div>
          </div>
          <div className="backdrop-blur-sm border border-white/10 rounded-xl p-4 bg-white/5">
            <div className="text-center">
              <Home className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{homeServices.length}/3</p>
              <p className="text-gray-400 text-sm">En Home</p>
            </div>
          </div>
          <div className="backdrop-blur-sm border border-white/10 rounded-xl p-4 bg-white/5">
            <div className="text-center">
              <Check className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{services.filter(s => s.isActive).length}</p>
              <p className="text-gray-400 text-sm">Activos</p>
            </div>
          </div>
          
          {/* Card interactiva de barberos - Reemplaza Precio Promedio */}
          <div 
            className="backdrop-blur-sm border border-white/10 rounded-xl p-4 bg-white/5 cursor-pointer hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:border-purple-500/30 group"
            onClick={() => setShowBarberModal(true)}
          >
            <div className="text-center">
              <Users className="w-8 h-8 text-purple-400 mx-auto mb-2 group-hover:text-purple-300 transition-colors duration-300" />
              <p className="text-2xl font-bold text-white">{mainBarbers.length}/3</p>
              <p className="text-gray-400 text-sm">Barberos Principales</p>
              <p className="text-purple-400 text-xs mt-1">Click para gestionar</p>
            </div>
          </div>
        </div>

        {/* Info de servicios en Home */}
        {homeServices.length >= 3 && (
          <div className="backdrop-blur-sm border border-blue-500/30 rounded-xl p-4 bg-blue-500/10">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-blue-400 font-medium">Información</p>
                <p className="text-blue-300/80 text-sm">
                  Tienes 3 servicios en el Home (máximo permitido). Si intentas agregar otro, deberás quitar uno primero.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Lista de servicios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <ServiceCard key={service._id} service={service} />
          ))}
        </div>

        {services.length === 0 && (
          <div className="text-center py-20">
            <Scissors className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400 mb-2">No hay servicios</h3>
            <p className="text-gray-500">Agrega el primer servicio para comenzar</p>
          </div>
        )}
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
                        Gestionar Barberos Principales
                      </GradientText>
                      <p className="text-gray-400 text-sm">Selecciona hasta 3 barberos para mostrar en Home/Barbers ({mainBarbers.length}/3)</p>
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
                    {barbers.map((barber) => {
                      const isMainBarber = barber.isMainBarber === true;
                      const canSelect = !isMainBarber && mainBarbers.length < 3;
                      const canDeselect = isMainBarber;
                      const isClickable = canSelect || canDeselect;
                      
                      logger.debug(`🎨 [Modal] ${barber.user?.name}: isMainBarber=${isMainBarber}, canSelect=${canSelect}, canDeselect=${canDeselect}, isClickable=${isClickable}`);
                      
                      return (
                        <div
                          key={barber._id}
                          onClick={() => {
                            if (isClickable) {
                              logger.debug(`👆 [Modal] Clicked on ${barber.user?.name}, will toggle to:`, !isMainBarber);
                              handleBarberSelect(barber);
                            } else {
                              logger.debug(`🚫 [Modal] ${barber.user?.name} is not clickable`);
                            }
                          }}
                          className={`group relative p-4 rounded-xl border transition-all duration-300 overflow-hidden backdrop-blur-sm ${
                            isMainBarber
                              ? 'border-green-500/50 bg-green-500/10 shadow-xl shadow-green-500/20 cursor-pointer hover:scale-105' // ✅ Seleccionado como principal (Verde)
                              : canSelect
                              ? 'border-blue-500/50 bg-blue-500/10 shadow-lg hover:shadow-xl hover:shadow-blue-500/20 cursor-pointer hover:scale-105' // 🔵 Disponible para seleccionar (Azul)
                              : 'border-gray-500/50 bg-gray-500/10 shadow-lg opacity-60 cursor-not-allowed' // 🔒 No disponible - máximo alcanzado (Gris)
                          }`}
                        >
                          {/* Efecto de brillo */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-xl"></div>
                          
                          {/* Indicador de estado */}
                          <div className="absolute top-2 right-2">
                            {isMainBarber ? (
                              <div className="p-1 bg-green-500/20 rounded-full border border-green-500/40">
                                <Check className="w-3 h-3 text-green-400" />
                              </div>
                            ) : canSelect ? (
                              <div className="p-1 bg-blue-500/20 rounded-full border border-blue-500/40">
                                <Plus className="w-3 h-3 text-blue-400" />
                              </div>
                            ) : (
                              <div className="p-1 bg-gray-500/20 rounded-full border border-gray-500/40">
                                <X className="w-3 h-3 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
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
                              
                              {/* Estado del barbero */}
                              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                isMainBarber
                                  ? 'bg-green-500/20 text-green-300 border border-green-500/40'
                                  : canSelect
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                  : 'bg-gray-500/20 text-gray-300 border border-gray-500/40'
                              }`}>
                                {isMainBarber ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    Principal
                                  </>
                                ) : canSelect ? (
                                  <>
                                    <Plus className="w-3 h-3" />
                                    Disponible
                                  </>
                                ) : (
                                  <>
                                    <X className="w-3 h-3" />
                                    Máximo
                                  </>
                                )}
                              </div>
                              
                              {barber.rating && formatRating(barber.rating) && (
                                <div className="flex items-center justify-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-400" fill="currentColor" />
                                  <span className="text-yellow-400 text-xs font-medium">
                                    {formatRating(barber.rating)}
                                  </span>
                                </div>
                              )}
                              
                              {/* Estado del barbero */}
                              <div className="mt-2">
                                {isMainBarber ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 rounded-full shadow-sm shadow-red-500/20">
                                    <CheckCircle className="w-3 h-3" />
                                    Seleccionado
                                  </span>
                                ) : canSelect ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 rounded-full shadow-sm shadow-green-500/20">
                                    <Users className="w-3 h-3" />
                                    Disponible
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded-full shadow-sm shadow-gray-500/20">
                                    <X className="w-3 h-3" />
                                    No disponible
                                  </span>
                                )}
                              </div>
                              
                              {/* Instrucción de acción */}
                              {isMainBarber && (
                                <p className="text-red-300 text-xs mt-1">Click para quitar</p>
                              )}
                              {canSelect && (
                                <p className="text-green-300 text-xs mt-1">Click para seleccionar</p>
                              )}
                              {!canSelect && !isMainBarber && (
                                <p className="text-gray-400 text-xs mt-1">Límite alcanzado (3/3)</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modales */}
      <EditServiceModal
        isOpen={showEditModal}
        onClose={closeModals}
        service={selectedService}
        onUpdate={handleUpdateService}
        isLoading={modalLoading}
      />

      <DeleteServiceModal
        isOpen={showDeleteModal}
        onClose={closeModals}
        service={selectedService}
        onDelete={handleConfirmDeleteService}
        isLoading={modalLoading}
      />
    </PageContainer>
  );
};

export default AdminServices;

