import React, { useEffect, useState } from 'react';
import { useAuth } from '../utils/AuthContext';
import { api } from '../services/api';

function ServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', price: 0, duration: 30, category: 'corte' });
  const [editing, setEditing] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      console.log('Obteniendo servicios...');
      const response = await api.get('/services');
      console.log('Respuesta de servicios:', response);
      
      if (response.success) {
        const servicesData = response.data || [];
        console.log('Datos de servicios:', servicesData);
        setServices(servicesData);
      } else {
        throw new Error(response.message || 'Error al cargar servicios');
      }
    } catch (error) {
      console.error('Error en fetchServices:', error);
      setError(error.message || 'Error al cargar servicios.');
      setTimeout(() => setError(''), 2500);
    }
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
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

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-10">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-blue-400">Gestión de Servicios</h2>
          <div className="flex gap-4">
            {/* Aquí podrían ir filtros u otras acciones */}
          </div>
        </div>

        {error && (
          <div className="mb-4">
            <div className="bg-red-900/50 backdrop-blur border border-red-700 text-red-200 px-4 py-3 rounded-lg shadow animate-fade-in flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4">
            <div className="bg-green-900/50 backdrop-blur border border-green-700 text-green-200 px-4 py-3 rounded-lg shadow animate-fade-in flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              {success}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Formulario */}
          <div className="md:col-span-1">
            <form onSubmit={handleSubmit} className="bg-gray-800/50 backdrop-blur p-6 rounded-xl shadow-lg border border-gray-700">
              <h3 className="text-xl font-semibold text-blue-400 mb-4">{editing ? 'Editar Servicio' : 'Nuevo Servicio'}</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-300">Nombre</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-300">Descripción</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    rows="3"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-300">Precio ($)</label>
                    <input
                      name="price"
                      type="number"
                      value={form.price}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-300">Duración (min)</label>
                    <input
                      name="duration"
                      type="number"
                      value={form.duration}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      min="15"
                      max="240"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-300">Categoría</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg bg-gray-700/50 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    required
                  >
                    <option value="corte">Corte</option>
                    <option value="barba">Barba</option>
                    <option value="combo">Combo</option>
                    <option value="tinte">Tinte</option>
                    <option value="tratamiento">Tratamiento</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2 mt-6">
                  <button
                    type="submit"
                    className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold transition-all transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                  >
                    {editing ? 'Actualizar Servicio' : 'Crear Servicio'}
                  </button>
                  
                  {editing && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(null);
                        setForm({ name: '', description: '', price: 0, duration: 30, category: 'corte' });
                      }}
                      className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 font-semibold transition-all transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    >
                      Cancelar Edición
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Lista de Servicios */}
          <div className="md:col-span-2">
            <div className="bg-gray-800/50 backdrop-blur rounded-xl shadow-lg border border-gray-700 overflow-hidden">
              <div className="grid grid-cols-1 gap-4 p-6">
                {services.map(service => (
                  <div
                    key={service._id}
                    className="bg-gray-700/50 rounded-lg p-4 hover:bg-gray-700 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-semibold text-blue-400">{service.name}</h4>
                        <p className="text-gray-300 mt-1">{service.description}</p>
                        <div className="flex gap-4 mt-2 text-sm">
                          <span className="text-green-400">${service.price}</span>
                          <span className="text-gray-400">{service.duration} min</span>
                          <span className="text-blue-300 capitalize">{service.category}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(service)}
                          className="px-3 py-1 rounded bg-blue-600/30 text-blue-400 hover:bg-blue-600/50 transition-all"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(service._id)}
                          className="px-3 py-1 rounded bg-red-600/30 text-red-400 hover:bg-red-600/50 transition-all"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease;
        }
      `}</style>
    </div>
  );
}

export default ServicesPage;
