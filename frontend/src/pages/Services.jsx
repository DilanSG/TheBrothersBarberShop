import React, { useEffect, useState } from 'react';
import { 
  Plus, Edit, Trash2, Clock, DollarSign, 
  AlertTriangle, CheckCircle, ChevronUp, Settings, 
  Palette, Sparkles, User, Package2, Scissors,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { PageContainer } from '../components/layout/PageContainer';
import GradientButton from '../components/ui/GradientButton';
import GradientText from '../components/ui/GradientText';

function ServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', price: 0, duration: 30, category: 'corte' });
  const [editing, setEditing] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null); // 'form'

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/services');
      
      if (response.success) {
        const servicesData = response.data || [];
        setServices(servicesData);
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
      console.log('Enviando formulario:', form);
      let response;
      
      if (editing) {
        console.log('Actualizando servicio:', editing._id);
        response = await api.put(`/services/${editing._id}`, form);
      } else {
        console.log('Creando nuevo servicio');
        response = await api.post('/services', form);
      }
      
      console.log('Respuesta:', response);

      if (response.success) {
        setSuccess(editing ? '✅ Servicio actualizado.' : '✅ Servicio creado.');
        setTimeout(() => setSuccess(''), 2500);
        setEditing(null);
        setForm({ name: '', description: '', price: 0, duration: 30, category: 'corte' });
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
    setEditing(service);
    setForm({
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      category: service.category
    });
    setExpandedSection('form');
  };

  const handleDelete = async id => {
    if (!id) {
      setError('ID de servicio inválido');
      setTimeout(() => setError(''), 2500);
      return;
    }

    if (!window.confirm('¿Seguro que deseas eliminar este servicio?')) {
      return;
    }

    try {
      console.log('Eliminando servicio:', id);
      const response = await api.delete(`/services/${id}`);
      console.log('Respuesta de eliminación:', response);

      if (response.success) {
        // Actualizar el estado local inmediatamente
        setServices(prevServices => prevServices.filter(service => service._id !== id));
        
        setSuccess('✅ Servicio eliminado.');
        setTimeout(() => setSuccess(''), 2500);
        
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

  const handleNewService = () => {
    setForm({ name: '', description: '', price: 0, duration: 30, category: 'corte' });
    setEditing(null);
    setExpandedSection('form');
  };

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
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center py-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <GradientText className="text-4xl md:text-5xl font-bold">
                  <Settings className="w-10 h-10 mx-auto mb-3" />
                  Gestión de Servicios
                </GradientText>
              </h1>
            </div>

            {/* Mensajes de error y éxito */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-xl backdrop-blur-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-2 rounded-xl backdrop-blur-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {success}
              </div>
            )}

            {/* Container principal transparente */}
            <div className="bg-transparent border border-white/10 rounded-2xl backdrop-blur-sm shadow-2xl shadow-blue-500/20">
              
              {/* Header de controles */}
              <div className="p-4 border-b border-white/10 flex justify-end">
                <GradientButton
                  onClick={handleNewService}
                  className="text-sm px-8 py-2 min-w-[180px]"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>Nuevo Servicio</span>
                  </div>
                </GradientButton>
              </div>
              {/* Formulario expandible */}
              {expandedSection === 'form' && (
                <div className="mx-4 mt-4 bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-md shadow-2xl shadow-blue-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      <GradientText className="text-lg font-semibold">
                        {editing ? 'Editar Servicio' : 'Nuevo Servicio'}
                      </GradientText>
                    </h3>
                    <button
                      onClick={() => setExpandedSection(null)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Nombre</label>
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm backdrop-blur-sm"
                        placeholder="Ej: Corte de cabello"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Categoría</label>
                      <select
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm backdrop-blur-sm"
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
                      <label className="block text-xs font-medium text-gray-300 mb-1">Precio ($)</label>
                      <input
                        name="price"
                        type="number"
                        value={form.price}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm backdrop-blur-sm"
                        min="0"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Duración (min)</label>
                      <input
                        name="duration"
                        type="number"
                        value={form.duration}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm backdrop-blur-sm"
                        min="15"
                        max="240"
                        step="15"
                        required
                      />
                    </div>

                    <div className="md:col-span-2 lg:col-span-4">
                      <label className="block text-xs font-medium text-gray-300 mb-1">Descripción</label>
                      <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm backdrop-blur-sm"
                        rows="3"
                        placeholder="Describe el servicio..."
                        required
                      />
                    </div>

                    <div className="md:col-span-2 lg:col-span-4 flex gap-3 pt-2">
                      <GradientButton type="submit" className="text-sm px-4 py-2">
                        {editing ? 'Actualizar' : 'Crear'}
                      </GradientButton>
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(null);
                          setForm({ name: '', description: '', price: 0, duration: 30, category: 'corte' });
                          setExpandedSection(null);
                        }}
                        className="px-4 py-2 bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 transition-colors text-sm backdrop-blur-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Lista de servicios */}
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <p className="mt-2 text-gray-400 text-sm">Cargando servicios...</p>
                </div>
              ) : services.length === 0 ? (
                <div className="p-8 text-center">
                  <Settings className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No hay servicios registrados</p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {services.map((service) => (
                    <div key={service._id} className="px-4 py-4 hover:bg-white/5 transition-colors backdrop-blur-sm border-b border-white/5">
                      <div className="flex flex-col sm:flex-row gap-4 items-start">
                        {/* Detalles */}
                        <div className="flex items-start gap-4 flex-1">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold">
                              <GradientText className="text-lg font-semibold">
                                {service.name}
                              </GradientText>
                            </h4>
                            <p className="text-sm text-gray-400 mt-1 mb-3">{service.description}</p>
                            <div className="flex flex-wrap gap-4">
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-green-400" />
                                <span className="text-green-400 font-medium">${service.price}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-400" />
                                <span className="text-gray-300">{service.duration} min</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-300 capitalize">{service.category}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(service)}
                            className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(service._id)}
                            className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </PageContainer>
      </div>
    </div>
  );
}

export default ServicesPage;
