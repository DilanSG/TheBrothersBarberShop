import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PageContainer } from '../../components/layout/PageContainer';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';
import GradientButton from '../../components/ui/GradientButton';
import GradientText from '../../components/ui/GradientText';
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
  X
} from 'lucide-react';

const AdminServices = () => {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [homeServices, setHomeServices] = useState([]);

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
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/services');
      if (response.success) {
        setServices(response.data);
        setHomeServices(response.data.filter(service => service.showInHome));
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Error al cargar los servicios');
    } finally {
      setLoading(false);
    }
  };

  const toggleShowInHome = async (serviceId, currentStatus) => {
    try {
      // Si se quiere activar y ya hay 3 servicios en home
      if (!currentStatus && homeServices.length >= 3) {
        toast.error('Solo puedes mostrar máximo 3 servicios en el Home');
        return;
      }

      const response = await api.patch(`/services/${serviceId}/show-in-home`, {
        showInHome: !currentStatus
      });

      if (response.success) {
        toast.success(response.message);
        await fetchServices(); // Refrescar la lista
      }
    } catch (error) {
      console.error('Error updating service:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar el servicio');
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
              disabled={!service.showInHome && homeServices.length >= 3}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                service.showInHome
                  ? 'bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30'
                  : !service.showInHome && homeServices.length >= 3
                  ? 'bg-gray-600/20 text-gray-500 border border-gray-500/30 cursor-not-allowed'
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
            <button className="flex items-center justify-center w-8 h-8 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 rounded-lg text-blue-400 transition-all duration-300">
              <Edit className="w-4 h-4" />
            </button>
            <button className="flex items-center justify-center w-8 h-8 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 rounded-lg text-red-400 transition-all duration-300">
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
          <div className="backdrop-blur-sm border border-white/10 rounded-xl p-4 bg-white/5">
            <div className="text-center">
              <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                ${services.length > 0 ? (services.reduce((sum, s) => sum + s.price, 0) / services.length).toFixed(0) : 0}
              </p>
              <p className="text-gray-400 text-sm">Precio Promedio</p>
            </div>
          </div>
        </div>

        {/* Alerta de límite de Home */}
        {homeServices.length >= 3 && (
          <div className="backdrop-blur-sm border border-amber-500/30 rounded-xl p-4 bg-amber-500/10">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-amber-400 font-medium">Límite alcanzado</p>
                <p className="text-amber-300/80 text-sm">
                  Ya tienes 3 servicios en el Home. Debes quitar uno para agregar otro.
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
    </PageContainer>
  );
};

export default AdminServices;
