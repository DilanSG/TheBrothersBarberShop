import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

function ProfileEdit() {
  const { user, token, setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    // Datos de barbero
    specialty: '',
    experience: 0,
    description: '',
    services: [],
    schedule: {
      monday: { start: '09:00', end: '18:00', available: true },
      tuesday: { start: '09:00', end: '18:00', available: true },
      wednesday: { start: '09:00', end: '18:00', available: true },
      thursday: { start: '09:00', end: '18:00', available: true },
      friday: { start: '09:00', end: '18:00', available: true },
      saturday: { start: '09:00', end: '14:00', available: true },
      sunday: { start: '09:00', end: '14:00', available: false }
    }
  });
  
  const [barberData, setBarberData] = useState(null);
  const [selectedService, setSelectedService] = useState('');
  const [availableServices, setAvailableServices] = useState([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const fetchBarberData = async () => {
    if ((user.role === 'barber' || user.role === 'admin') && user._id) {
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        const res = await fetch(`${apiUrl}/api/barbers/by-user/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.data) {
            setBarberData(data.data);
            setForm(prev => ({
              ...prev,
              specialty: data.data.specialty || '',
              experience: data.data.experience || 0,
              description: data.data.description || '',
              services: data.data.services || []
            }));
          }
        }
      } catch (err) {
        console.error('Error al cargar datos de barbero:', err);
      }
    }
  };

  // Cargar servicios disponibles
  const fetchServices = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const res = await fetch(`${apiUrl}/api/services`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.data) {
        setAvailableServices(data.data);
      }
    } catch (err) {
      console.error('Error al cargar servicios:', err);
    }
  };

  React.useEffect(() => {
    fetchBarberData();
    if (user.role === 'barber' || user.role === 'admin') {
      fetchServices();
    }
  }, [user._id]);

  const handleScheduleChange = (day, field, value) => {
    setForm(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          [field]: value
        }
      }
    }));
  };

  const handleAvailabilityChange = (day) => {
    setForm(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          available: !prev.schedule[day].available
        }
      }
    }));
  };

  const handleAddService = () => {
    if (selectedService && !form.services.includes(selectedService)) {
      setForm(prev => ({
        ...prev,
        services: [...prev.services, selectedService]
      }));
      setSelectedService('');
    }
  };

  const handleRemoveService = (serviceId) => {
    setForm(prev => ({
      ...prev,
      services: prev.services.filter(id => id !== serviceId)
    }));
  };

  const validateForm = () => {
    // Solo validar campos que han sido modificados
    const errors = [];
    
    if (form.email && form.email !== user.email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        errors.push('El email no es válido');
      }
    }

    if (form.phone && form.phone !== user.phone) {
      if (!/^[0-9+\s-]{6,}$/.test(form.phone)) {
        errors.push('El número de teléfono no es válido');
      }
    }

    // Validaciones específicas para barberos
    if (user.role === 'barber') {
      if (form.experience < 0) {
        errors.push('Los años de experiencia no pueden ser negativos');
      }
      if (form.specialty && form.specialty.length < 3) {
        errors.push('La especialidad debe tener al menos 3 caracteres');
      }
      if (form.description && form.description.length < 10) {
        errors.push('La descripción debe tener al menos 10 caracteres');
      }
    }

    return errors;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Validar formulario
      const errors = validateForm();
      if (errors.length > 0) {
        setError(errors.join('\n'));
        return;
      }

      const userId = user.id || user._id;
      
      // Preparar datos de usuario (solo enviar campos modificados)
      const userUpdateData = {};
      if (form.name && form.name !== user.name) userUpdateData.name = form.name;
      if (form.email && form.email !== user.email) userUpdateData.email = form.email;
      if (form.phone && form.phone !== user.phone) userUpdateData.phone = form.phone;

      // Solo hacer la petición si hay cambios
      let userData = { data: user };
      if (Object.keys(userUpdateData).length > 0) {
        const apiUrl = import.meta.env.VITE_API_URL;
        const userRes = await fetch(`${apiUrl}/api/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(userUpdateData)
        });
        userData = await userRes.json();
        if (!userRes.ok) throw new Error(userData.message || 'Error al actualizar perfil');
      }
      
      // Actualizar datos de barbero si es necesario
      if ((user.role === 'barber' || (user.role === 'admin' && barberData)) && barberData?._id) {
        // Preparar datos de barbero (solo enviar campos modificados)
        const barberUpdateData = {};
        
        if (form.specialty && form.specialty !== barberData.specialty) {
          barberUpdateData.specialty = form.specialty;
        }
        
        if (typeof form.experience === 'number' && form.experience !== barberData.experience) {
          barberUpdateData.experience = form.experience;
        }
        
        if (form.description && form.description !== barberData.description) {
          barberUpdateData.description = form.description;
        }
        
        if (form.services && form.services.length > 0 && 
            JSON.stringify(form.services) !== JSON.stringify(barberData.services)) {
          barberUpdateData.services = form.services;
        }
        
        if (form.schedule && JSON.stringify(form.schedule) !== JSON.stringify(barberData.schedule)) {
          barberUpdateData.schedule = form.schedule;
        }

        // Solo hacer la petición si hay cambios
        if (Object.keys(barberUpdateData).length > 0) {
          console.log('Actualizando datos de barbero:', barberUpdateData);
          const apiUrl = import.meta.env.VITE_API_URL;
          const barberRes = await fetch(`${apiUrl}/api/barbers/${barberData._id}/profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(barberUpdateData)
          });
        
          const barberResponse = await barberRes.json();
          if (!barberRes.ok) throw new Error(barberResponse.message || 'Error al actualizar datos de barbero');
          if (!barberResponse.success) throw new Error(barberResponse.message || 'Error al actualizar datos de barbero');
        }
      }

      // Solo verificar userData.success si se hizo una actualización de usuario
      if (Object.keys(userUpdateData).length > 0 && !userData.success) {
        throw new Error(userData.message || 'Error al actualizar el perfil');
      }

      // Si se actualizó el usuario, actualizar el estado
      if (Object.keys(userUpdateData).length > 0) {
        setUser(userData.data);
        localStorage.setItem('user', JSON.stringify(userData.data));
      }
      
      setSuccess('✅ Perfil actualizado exitosamente.');
      
      // Redirigir después de un breve delay
      setTimeout(() => {
        setSuccess('');
        navigate('/profile');
      }, 1200);
    } catch (err) {
      console.error('Error al actualizar el perfil:', err);
      setError(err.message || 'Error al actualizar el perfil. Por favor, intenta de nuevo.');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-700">
      <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">Editar Perfil</h2>
      <form onSubmit={handleSubmit} className="bg-gray-900 p-6 rounded-xl shadow mb-4 border border-gray-700" encType="multipart/form-data">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2 text-blue-300 font-semibold">Nombre</label>
            <input 
              name="name" 
              value={form.name} 
              onChange={handleChange} 
              className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400" 
              placeholder={user?.name || 'Tu nombre'}
            />
          </div>
          <div>
            <label className="block mb-2 text-blue-300 font-semibold">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400" required />
          </div>
          <div>
            <label className="block mb-2 text-blue-300 font-semibold">Teléfono</label>
            <input name="phone" value={form.phone} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>

          {/* Sección de datos de barbero */}
          {(user.role === 'barber' || (user.role === 'admin' && barberData)) && (
            <>
              <div className="col-span-2">
                <h3 className="text-xl font-bold mb-4 text-blue-400">Datos de Barbero</h3>
              </div>
              <div>
                <label className="block mb-2 text-blue-300 font-semibold">Especialidad</label>
                <input
                  name="specialty"
                  value={form.specialty}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required={user.role === 'barber'}
                  placeholder="Ej: Cortes modernos, Barbas"
                />
              </div>
              <div>
                <label className="block mb-2 text-blue-300 font-semibold">Años de Experiencia</label>
                <input
                  type="number"
                  name="experience"
                  value={form.experience}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  min="0"
                  required={user.role === 'barber'}
                />
              </div>
              <div className="col-span-2">
                <label className="block mb-2 text-blue-300 font-semibold">Descripción</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  rows="3"
                  required={user.role === 'barber'}
                  placeholder="Cuéntanos sobre tu experiencia y estilo..."
                />
              </div>

              {/* Sección de Servicios */}
              <div className="col-span-2">
                <h4 className="text-lg font-semibold mb-2 text-blue-300">Servicios Ofrecidos</h4>
                <div className="flex gap-2 mb-4">
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">Seleccionar servicio...</option>
                    {availableServices.map(service => (
                      <option key={service._id} value={service._id}>{service.name} - ${service.price}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddService}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Agregar
                  </button>
                </div>
                <div className="space-y-2">
                  {form.services.map(serviceId => {
                    const service = availableServices.find(s => s._id === serviceId);
                    return service ? (
                      <div key={serviceId} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                        <span>{service.name} - ${service.price}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveService(serviceId)}
                          className="text-red-400 hover:text-red-600"
                        >
                          Eliminar
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              {/* Sección de Horario */}
              <div className="col-span-2 mt-4">
                <h4 className="text-lg font-semibold mb-2 text-blue-300">Horario de Trabajo</h4>
                <div className="space-y-3">
                  {Object.entries(form.schedule).map(([day, schedule]) => (
                    <div key={day} className="flex items-center gap-4 bg-gray-700 p-3 rounded">
                      <div className="w-24 font-semibold capitalize">{day}</div>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={schedule.available}
                          onChange={() => handleAvailabilityChange(day)}
                          className="mr-2"
                        />
                        <span className="text-sm">Disponible</span>
                      </label>
                      {schedule.available && (
                        <>
                          <input
                            type="time"
                            value={schedule.start}
                            onChange={(e) => handleScheduleChange(day, 'start', e.target.value)}
                            className="px-2 py-1 bg-gray-600 rounded"
                          />
                          <span>a</span>
                          <input
                            type="time"
                            value={schedule.end}
                            onChange={(e) => handleScheduleChange(day, 'end', e.target.value)}
                            className="px-2 py-1 bg-gray-600 rounded"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        <button type="submit" className="w-full mt-6 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-800 font-bold transition">Guardar cambios</button>
      </form>
      {error && (
        <div className="flex justify-center mb-2">
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-2 rounded shadow animate-fade-in">{error}</div>
        </div>
      )}
      {success && (
        <div className="flex justify-center mb-2">
          <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-2 rounded shadow animate-fade-in">{success}</div>
        </div>
      )}
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

export default ProfileEdit;
