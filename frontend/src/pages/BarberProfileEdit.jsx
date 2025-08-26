import React, { useState } from 'react';
import { useAuth } from '../utils/AuthContext';

function BarberProfileEdit({ barber }) {
  const { user, token } = useAuth();
  const [form, setForm] = useState({
    specialty: barber?.specialty || '',
    experience: barber?.experience || 0,
    description: barber?.description || '',
    schedule: barber?.schedule || {
      monday: { start: '09:00', end: '19:00', available: true },
      tuesday: { start: '09:00', end: '19:00', available: true },
      wednesday: { start: '09:00', end: '19:00', available: true },
      thursday: { start: '09:00', end: '19:00', available: true },
      friday: { start: '09:00', end: '19:00', available: true },
      saturday: { start: '09:00', end: '19:00', available: true },
      sunday: { start: '09:00', end: '19:00', available: false }
    }
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleScheduleChange = (day, field, value) => {
    setForm(f => ({
      ...f,
      schedule: {
        ...f.schedule,
        [day]: {
          ...f.schedule[day],
          [field]: field === 'available' ? value : value
        }
      }
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:5000/api/barbers/${barber._id}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al actualizar perfil');
      setSuccess('✅ Perfil de barbero actualizado exitosamente.');
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 2500);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Editar Perfil de Barbero</h2>
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Especialidad</label>
            <input name="specialty" value={form.specialty} onChange={handleChange} className="form-input" required />
          </div>
          <div>
            <label className="form-label">Experiencia (años)</label>
            <input name="experience" type="number" value={form.experience} onChange={handleChange} className="form-input" min="0" required />
          </div>
          <div className="md:col-span-2">
            <label className="form-label">Descripción</label>
            <textarea name="description" value={form.description} onChange={handleChange} className="form-input" rows={2} />
          </div>
        </div>
        <h3 className="font-semibold mt-4 mb-2">Horarios</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.keys(form.schedule).map(day => (
            <div key={day} className="mb-2">
              <label className="form-label capitalize">{day}</label>
              <input type="time" value={form.schedule[day].start} onChange={e => handleScheduleChange(day, 'start', e.target.value)} className="form-input w-24 mr-2" />
              <input type="time" value={form.schedule[day].end} onChange={e => handleScheduleChange(day, 'end', e.target.value)} className="form-input w-24 mr-2" />
              <label className="ml-2">
                <input type="checkbox" checked={form.schedule[day].available} onChange={e => handleScheduleChange(day, 'available', e.target.checked)} /> Disponible
              </label>
            </div>
          ))}
        </div>
        <button type="submit" className="btn-primary w-full mt-4">Guardar cambios</button>
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

export default BarberProfileEdit;
