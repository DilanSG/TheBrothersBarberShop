import React, { useEffect, useState } from 'react';
import { useAuth } from '../utils/AuthContext';

function AppointmentPage() {
  const { user, token } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [form, setForm] = useState({ serviceId: '', barberId: '', date: '', notes: '' });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [cancelId, setCancelId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    fetchAppointments();
    fetchServices();
    fetchBarbers();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/appointments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setAppointments(data.data || []);
    } catch {
      setError('Error al cargar las reservas.');
      setTimeout(() => setError(''), 2500);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/services');
      const data = await res.json();
      setServices(data.data || []);
    } catch {}
  };

  const fetchBarbers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/barbers');
      const data = await res.json();
      setBarbers(data.data || []);
    } catch {}
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al reservar');
      setSuccess('✅ Reserva creada exitosamente. Revisa tu email para la confirmación.');
      setTimeout(() => setSuccess(''), 3500);
      setForm({ serviceId: '', barberId: '', date: '', notes: '' });
      fetchAppointments();
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3500);
    }
  };

  // For barbers: cancel with reason
  const handleCancelWithReason = async () => {
    if (!cancelId || !cancelReason) return;
    try {
      const res = await fetch(`http://localhost:5000/api/appointments/${cancelId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: cancelReason })
      });
      if (!res.ok) throw new Error('Error al cancelar la reserva');
      setAppointments(apps => apps.map(a => a._id === cancelId ? { ...a, status: 'cancelled', cancelReason } : a));
      setSuccess('✅ Reserva cancelada exitosamente.');
      setTimeout(() => setSuccess(''), 2500);
      setCancelId(null);
      setCancelReason('');
    } catch {
      setError('No se pudo cancelar la reserva.');
      setTimeout(() => setError(''), 2500);
    }
  };

  // For admin: delete
  const handleDelete = async id => {
    if (!window.confirm('¿Seguro que deseas eliminar esta reserva?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/appointments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al eliminar la reserva');
      setAppointments(apps => apps.filter(a => a._id !== id));
      setSuccess('✅ Reserva eliminada exitosamente.');
      setTimeout(() => setSuccess(''), 2500);
    } catch {
      setError('No se pudo eliminar la reserva.');
      setTimeout(() => setError(''), 2500);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Mis Reservas</h2>
      {/* Only users can create reservations */}
      {user && user.role === 'user' && (
        <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Servicio</label>
              <select name="serviceId" value={form.serviceId} onChange={handleChange} className="form-input" required>
                <option value="">Selecciona un servicio</option>
                {services.map(s => (
                  <option key={s._id} value={s._id}>{s.name} (${s.price})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Barbero</label>
              <select name="barberId" value={form.barberId} onChange={handleChange} className="form-input" required>
                <option value="">Selecciona un barbero</option>
                {barbers.map(b => (
                  <option key={b._id} value={b._id}>{b.user?.name || b.user?.email}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Fecha y hora</label>
              <input name="date" type="datetime-local" value={form.date} onChange={handleChange} className="form-input" required />
            </div>
            <div>
              <label className="form-label">Notas</label>
              <input name="notes" value={form.notes} onChange={handleChange} className="form-input" placeholder="Opcional" />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full mt-4">Reservar</button>
        </form>
      )}
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
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-2 border">Barbero</th>
            <th className="px-4 py-2 border">Servicio</th>
            <th className="px-4 py-2 border">Fecha</th>
            <th className="px-4 py-2 border">Estado</th>
            <th className="px-4 py-2 border">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map(app => (
            <tr key={app._id} className="hover:bg-gray-50">
              <td className="px-4 py-2 border">{app.barber?.user?.name || app.barber?.user?.email || '-'}</td>
              <td className="px-4 py-2 border">{app.service?.name || '-'}</td>
              <td className="px-4 py-2 border">{new Date(app.date).toLocaleString()}</td>
              <td className="px-4 py-2 border">{app.status}</td>
              <td className="px-4 py-2 border">
                {/* Barbers: cancel with reason */}
                {user && user.role === 'barber' && (app.status === 'pending' || app.status === 'confirmed') ? (
                  <button className="text-red-600 hover:underline" onClick={() => setCancelId(app._id)}>
                    Cancelar
                  </button>
                ) : null}
                {/* Admin: edit/delete */}
                {user && user.role === 'admin' ? (
                  <>
                    <button className="text-blue-600 hover:underline mr-2" onClick={() => alert('Editar no implementado')}>Editar</button>
                    <button className="text-red-600 hover:underline" onClick={() => handleDelete(app._id)}>Eliminar</button>
                  </>
                ) : null}
                {/* User: cancel own reservation */}
                {user && user.role === 'user' && (app.status === 'pending' || app.status === 'confirmed') ? (
                  <button className="text-red-600 hover:underline" onClick={() => handleDelete(app._id)}>
                    Cancelar
                  </button>
                ) : null}
                {/* If not available */}
                {!((user && user.role === 'barber' && (app.status === 'pending' || app.status === 'confirmed')) || (user && user.role === 'admin') || (user && user.role === 'user' && (app.status === 'pending' || app.status === 'confirmed'))) && (
                  <span className="text-gray-400">No disponible</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Modal for barber cancellation reason */}
      {cancelId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-2">Motivo de cancelación</h3>
            <textarea className="form-input w-full mb-4" value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Escribe el motivo..." />
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => {setCancelId(null); setCancelReason('');}}>Cancelar</button>
              <button className="btn-primary" onClick={handleCancelWithReason}>Confirmar</button>
            </div>
          </div>
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

export default AppointmentPage;
