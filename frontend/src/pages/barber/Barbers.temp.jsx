import React, { useEffect, useState } from 'react';
import { useAuth } from '../../utils/AuthContext';
import { api } from '../../services/api';

function BarbersPage() {
  const { user } = useAuth();
  const [barbers, setBarbers] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchBarbers();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (user?.role === "barber") {
      const checkAndCreateBarberProfile = async () => {
        try {
          const response = await api.get(`/barbers/by-user/${user._id}`);
          if (!response.success) {
            const createResponse = await api.post('/barbers', { user: user._id });
            if (createResponse.success) {
              fetchBarbers();
              setSuccessMessage("Perfil de barbero creado exitosamente");
              setTimeout(() => setSuccessMessage(""), 2500);
            }
          }
        } catch (error) {
          console.error("Error:", error);
          setError("Error al verificar el perfil de barbero");
          setTimeout(() => setError(""), 2500);
        }
      };
      checkAndCreateBarberProfile();
    }
  }, [user?._id, user?.role]);

  const fetchBarbers = async () => {
    try {
      const response = await api.get('/barbers');
      if (response.success) {
        setBarbers(response.data.data || []);
      } else {
        throw new Error(response.message || "Error al cargar barberos");
      }
    } catch (error) {
      setError("Error al cargar barberos.");
      setTimeout(() => setError(""), 2500);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/all');
      if (response.success) {
        setUsers(response.data.data || []);
      } else {
        throw new Error(response.message || "Error al cargar usuarios");
      }
    } catch (error) {
      setError("Error al cargar usuarios.");
      setTimeout(() => setError(""), 2500);
    }
  };

  const handleSelectBarber = async (barber) => {
    setSelectedBarber(barber);
    try {
      const response = await api.get(`/barbers/${barber._id}/stats`);
      if (response.success) {
        setStats(response.data.data);
      } else {
        throw new Error(response.message || "Error al cargar estadísticas");
      }
    } catch (error) {
      setStats(null);
      setError("No se pudieron cargar las estadísticas.");
      setTimeout(() => setError(""), 2500);
    }
  };

  const handleRemoveBarber = async (barberId) => {
    if (!window.confirm('¿Estás seguro de que quieres remover este barbero? Su rol cambiará a usuario normal.')) return;
    
    try {
      const response = await api.put(`/barbers/${barberId}/remove`);
      if (response.success) {
        setSuccessMessage("Barbero removido exitosamente");
        setTimeout(() => setSuccessMessage(""), 2500);
        fetchBarbers();
      } else {
        setError(response.message || "Error al remover barbero");
        setTimeout(() => setError(""), 2500);
      }
    } catch (err) {
      setError("Error al remover barbero");
      setTimeout(() => setError(""), 2500);
    }
  };

  const getNonBarberUsers = () => {
    const barberUserIds = barbers.map(barber => barber.user._id);
    return users.filter(user => 
      !barberUserIds.includes(user._id) && 
      (user.role === 'barber' || user.role === 'user')
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-10">
      <h2 className="text-3xl font-bold mb-8 text-blue-400 text-center">Gestión de Barberos</h2>
      {error && (
        <div className="flex justify-center mb-2">
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-2 rounded shadow animate-fade-in">{error}</div>
        </div>
      )}
      {successMessage && (
        <div className="flex justify-center mb-2">
          <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-2 rounded shadow animate-fade-in">{successMessage}</div>
        </div>
      )}

      <h3 className="text-xl font-semibold mb-4 text-blue-400">Barberos Registrados</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {barbers.map(barber => (
          <div key={barber._id} className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 hover:shadow-2xl transition">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-semibold text-blue-400">{barber.user.name}</h4>
                <p className="text-gray-400">{barber.user.email}</p>
                {barber.specialty && <p className="text-white">Especialidad: {barber.specialty}</p>}
                {barber.experience > 0 && <p className="text-white">Experiencia: {barber.experience} años</p>}
                {barber.description && <p className="text-white">Descripción: {barber.description}</p>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSelectBarber(barber)}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                >
                  Ver Detalles
                </button>
                <button
                  onClick={() => handleRemoveBarber(barber._id)}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                >
                  Remover Barbero
                </button>
              </div>
            </div>
            {selectedBarber && selectedBarber._id === barber._id && stats && (
              <div className="mt-4 p-4 bg-gray-700 rounded">
                <h4 className="font-semibold text-blue-400 mb-2">Estadísticas</h4>
                <ul className="mb-4">
                  <li className="mb-1"><span className="font-semibold text-blue-300">Citas completadas:</span> {stats.totalAppointments}</li>
                  <li className="mb-1"><span className="font-semibold text-blue-300">Ingresos totales:</span> ${stats.totalRevenue}</li>
                  <li className="mb-1"><span className="font-semibold text-blue-300">Promedio de calificación:</span> {stats.averageRating?.toFixed(2) || 'N/A'}</li>
                  <li className="mb-1"><span className="font-semibold text-blue-300">Citas este mes:</span> {stats.thisMonth}</li>
                  <li className="mb-1"><span className="font-semibold text-blue-300">Citas esta semana:</span> {stats.thisWeek}</li>
                </ul>
                {stats.appointmentsByService && stats.appointmentsByService.length > 0 && (
                  <>
                    <h4 className="font-semibold mb-2 text-blue-300">Servicios más realizados:</h4>
                    <ul>
                      {stats.appointmentsByService.map(s => (
                        <li key={s.service} className="mb-1">
                          <span className="font-semibold text-blue-400">{s.service}</span>: {s.count} citas (${s.revenue})
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
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

export default BarbersPage;
