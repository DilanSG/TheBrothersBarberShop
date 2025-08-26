import React, { useEffect, useState } from 'react';
import { useAuth } from '../utils/AuthContext';

function ServicesPage() {
  const { user, token } = useAuth();
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
      const res = await fetch('http://localhost:5000/api/services');
      const data = await res.json();
      setServices(data.data || []);
    } catch {
      setError('Error al cargar servicios.');
      setTimeout(() => setError(''), 2500);
    }
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `http://localhost:5000/api/services/${editing._id}` : 'http://localhost:5000/api/services';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al guardar servicio');
      setSuccess(editing ? '✅ Servicio actualizado.' : '✅ Servicio creado.');
      setTimeout(() => setSuccess(''), 2500);
      setForm({ name: '', description: '', price: 0, duration: 30, category: 'corte' });
      setEditing(null);
      fetchServices();
    } catch (err) {
      setError(err.message);
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
    if (!window.confirm('¿Seguro que deseas eliminar este servicio?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/services/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al eliminar servicio');
      setSuccess('✅ Servicio eliminado.');
      setTimeout(() => setSuccess(''), 2500);
      fetchServices();
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 2500);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Servicios</h2>
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Nombre</label>
            <input name="name" value={form.name} onChange={handleChange} className="form-input" required />
          </div>
          <div>
            <label className="form-label">Descripción</label>
            <input name="description" value={form.description} onChange={handleChange} className="form-input" required />
          </div>
          <div>
            <label className="form-label">Precio</label>
            <input name="price" type="number" value={form.price} onChange={handleChange} className="form-input" min="0" required />
          </div>
          <div>
            <label className="form-label">Duración (minutos)</label>
            <input name="duration" type="number" value={form.duration} onChange={handleChange} className="form-input" min="15" max="240" required />
          </div>
          <div>
            <label className="form-label">Categoría</label>
            <select name="category" value={form.category} onChange={handleChange} className="form-input" required>
              <option value="corte">Corte</option>
              <option value="barba">Barba</option>
              <option value="combo">Combo</option>
              <option value="tinte">Tinte</option>
              <option value="tratamiento">Tratamiento</option>
            </select>
          </div>
        </div>
        <button type="submit" className="btn-primary w-full mt-4">{editing ? 'Actualizar' : 'Crear'} servicio</button>
        {editing && <button type="button" className="btn-secondary w-full mt-2" onClick={() => { setEditing(null); setForm({ name: '', description: '', price: 0, duration: 30, category: 'corte' }); }}>Cancelar edición</button>}
      </form>
      {error && (
        <div className="flex justify-center mb-2">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded shadow animate-fade-in">{error}</div>
        </div>
      )}
      {success && (
        <div className="flex justify-center mb-2">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded shadow animate-fade-in">{success}</div>
        </div>
      )}
      <table className="min-w-full bg-white border border-gray-200 mt-6">
        <thead>
          <tr>
            <th className="px-4 py-2 border">Nombre</th>
            <th className="px-4 py-2 border">Descripción</th>
            <th className="px-4 py-2 border">Precio</th>
            <th className="px-4 py-2 border">Duración</th>
            <th className="px-4 py-2 border">Categoría</th>
            <th className="px-4 py-2 border">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {services.map(s => (
            <tr key={s._id} className="hover:bg-gray-50">
              <td className="px-4 py-2 border">{s.name}</td>
              <td className="px-4 py-2 border">{s.description}</td>
              <td className="px-4 py-2 border">${s.price}</td>
              <td className="px-4 py-2 border">{s.duration} min</td>
              <td className="px-4 py-2 border">{s.category}</td>
              <td className="px-4 py-2 border">
                <button className="text-blue-600 hover:underline mr-2" onClick={() => handleEdit(s)}>Editar</button>
                <button className="text-red-600 hover:underline" onClick={() => handleDelete(s._id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
