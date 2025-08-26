import React, { useEffect, useState } from 'react';
import { useAuth } from '../utils/AuthContext';

function BarbersPage() {
  const { user, token } = useAuth();
  const [barbers, setBarbers] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBarbers();
  }, []);

  const fetchBarbers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/barbers');
      const data = await res.json();
      setBarbers(data.data || []);
    } catch {
      setError('Error al cargar barberos.');
      setTimeout(() => setError(''), 2500);
    }
  };

  const handleSelectBarber = async (barber) => {
    setSelectedBarber(barber);
    try {
      const res = await fetch(`http://localhost:5000/api/barbers/${barber._id}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setStats(data.data);
    } catch {
      setStats(null);
      setError('No se pudieron cargar las estadísticas.');
      setTimeout(() => setError(''), 2500);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Barberos</h2>
      {error && (
        <div className="flex justify-center mb-2">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded shadow animate-fade-in">{error}</div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {barbers.map(barber => (
          <div key={barber._id} className="bg-white p-4 rounded shadow">
            <h3 className="font-bold text-lg mb-2">{barber.user?.name || barber.user?.email}</h3>
            <p><strong>Especialidad:</strong> {barber.specialty}</p>
            <p><strong>Experiencia:</strong> {barber.experience} años</p>
            <p><strong>Descripción:</strong> {barber.description}</p>
            <button className="btn-primary mt-2" onClick={() => handleSelectBarber(barber)}>
              Ver estadísticas
            </button>
          </div>
        ))}
      </div>
      {selectedBarber && stats && (
        <div className="bg-blue-50 border border-blue-400 text-blue-700 px-4 py-4 rounded shadow animate-fade-in mb-6">
          <h3 className="font-bold text-xl mb-2">Estadísticas de {selectedBarber.user?.name || selectedBarber.user?.email}</h3>
          <ul className="mb-2">
            <li><strong>Citas completadas:</strong> {stats.totalAppointments}</li>
            <li><strong>Ingresos totales:</strong> ${stats.totalRevenue}</li>
            <li><strong>Promedio de calificación:</strong> {stats.averageRating.toFixed(2)}</li>
            <li><strong>Citas este mes:</strong> {stats.thisMonth}</li>
            <li><strong>Citas esta semana:</strong> {stats.thisWeek}</li>
          </ul>
          <h4 className="font-semibold mb-1">Servicios más realizados:</h4>
          <ul>
            {stats.appointmentsByService.map(s => (
              <li key={s.service}>
                {s.service}: {s.count} citas (${s.revenue})
              </li>
            ))}
          </ul>
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

export default BarbersPage;
