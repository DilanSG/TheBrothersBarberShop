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
      console.log('Respuesta de barberos:', response);
      if (response.success) {
        const barbersData = response.data || [];
        console.log('Datos de barberos:', barbersData);
        setBarbers(barbersData);
      } else {
        throw new Error(response.message || "Error al cargar barberos");
      }
    } catch (error) {
      console.error('Error en fetchBarbers:', error);
      setError("Error al cargar barberos.");
      setTimeout(() => setError(""), 2500);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      console.log('Respuesta de usuarios:', response);
      if (response.success) {
        const usersData = response.data || [];
        console.log('Datos de usuarios:', usersData);
        setUsers(usersData);
      } else {
        throw new Error(response.message || "Error al cargar usuarios");
      }
    } catch (error) {
      console.error('Error en fetchUsers:', error);
      setError("Error al cargar usuarios.");
      setTimeout(() => setError(""), 2500);
    }
  };

  const handleSelectBarber = async (barber) => {
    try {
      if (!barber?._id) {
        throw new Error("ID de barbero inválido");
      }

      // Si el barbero ya está seleccionado, lo deseleccionamos
      if (selectedBarber?._id === barber._id) {
        setSelectedBarber(null);
        setStats(null);
        return;
      }

      setSelectedBarber(barber);
      console.log('Obteniendo estadísticas para:', barber._id);
      
      const response = await api.get(`/barbers/${barber._id}/stats`);
      console.log('Respuesta de estadísticas:', response);
      
      if (response.success) {
        const statsData = response.data || {};
        console.log('Datos de estadísticas:', statsData);
        setStats(statsData);
      } else {
        throw new Error(response.message || "Error al cargar estadísticas");
      }
    } catch (error) {
      console.error('Error en handleSelectBarber:', error);
      setStats(null);
      setError(error.message || "No se pudieron cargar las estadísticas.");
      setTimeout(() => setError(""), 2500);
    }
  };

  const handleRemoveBarber = async (barberId) => {
    if (!barberId) {
      setError("ID de barbero inválido");
      setTimeout(() => setError(""), 2500);
      return;
    }

    if (!window.confirm('¿Estás seguro de que quieres remover este barbero? Su rol cambiará a usuario normal.')) {
      return;
    }
    
    try {
      console.log('Removiendo barbero:', barberId);
      const response = await api.put(`/barbers/${barberId}/remove`);
      console.log('Respuesta de remoción:', response);

      if (response.success) {
        setSuccessMessage("Barbero removido exitosamente");
        setTimeout(() => setSuccessMessage(""), 2500);
        
        // Limpiar la selección si el barbero removido era el seleccionado
        if (selectedBarber?._id === barberId) {
          setSelectedBarber(null);
          setStats(null);
        }
        
        // Actualizar las listas
        await Promise.all([
          fetchBarbers(),
          fetchUsers()
        ]);
      } else {
        throw new Error(response.message || "Error al remover barbero");
      }
    } catch (error) {
      console.error('Error en handleRemoveBarber:', error);
      setError(error.message || "Error al remover barbero");
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-blue-400">Gestión de Barberos</h2>
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

        {successMessage && (
          <div className="mb-4">
            <div className="bg-green-900/50 backdrop-blur border border-green-700 text-green-200 px-4 py-3 rounded-lg shadow animate-fade-in flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              {successMessage}
            </div>
          </div>
        )}

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {barbers.map(barber => (
            <div 
              key={barber._id} 
              className="bg-gray-800/50 backdrop-blur p-6 rounded-xl shadow-lg border border-gray-700 hover:shadow-2xl transition-all"
            >
              <div className="flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-600/30 rounded-full flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-blue-400">{barber.user.name}</h4>
                      <p className="text-gray-400">{barber.user.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleSelectBarber(barber)}
                      className="px-3 py-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-all flex items-center gap-2 whitespace-nowrap text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      {selectedBarber?._id === barber._id ? 'Ocultar' : 'Estadísticas'}
                    </button>
                    <button
                      onClick={() => handleRemoveBarber(barber._id)}
                      className="px-3 py-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-all flex items-center gap-2 whitespace-nowrap text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remover
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  {barber.specialty && (
                    <div className="bg-gray-700/30 p-3 rounded-lg">
                      <span className="text-sm text-gray-400">Especialidad</span>
                      <p className="text-blue-300 font-medium">{barber.specialty}</p>
                    </div>
                  )}
                  {barber.experience > 0 && (
                    <div className="bg-gray-700/30 p-3 rounded-lg">
                      <span className="text-sm text-gray-400">Experiencia</span>
                      <p className="text-blue-300 font-medium">{barber.experience} años</p>
                    </div>
                  )}
                </div>

                {barber.description && (
                  <div className="bg-gray-700/30 p-3 rounded-lg mb-4">
                    <span className="text-sm text-gray-400">Descripción</span>
                    <p className="text-blue-300 font-medium">{barber.description}</p>
                  </div>
                )}

                {selectedBarber && selectedBarber._id === barber._id && stats && (
                  <div className="bg-gray-700/30 p-4 rounded-lg mt-4 animate-fade-in">
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-600/20 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-400">{stats.totalAppointments}</div>
                        <div className="text-sm text-gray-400">Citas Totales</div>
                      </div>
                      <div className="bg-green-600/20 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-400">${stats.totalRevenue}</div>
                        <div className="text-sm text-gray-400">Ingresos</div>
                      </div>
                      <div className="bg-yellow-600/20 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-400">{stats.averageRating?.toFixed(2) || 'N/A'}</div>
                        <div className="text-sm text-gray-400">Calificación</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-800/50 p-4 rounded-lg">
                        <div className="text-xl font-semibold text-blue-400">{stats.thisMonth}</div>
                        <div className="text-sm text-gray-400">Citas este mes</div>
                      </div>
                      <div className="bg-gray-800/50 p-4 rounded-lg">
                        <div className="text-xl font-semibold text-blue-400">{stats.thisWeek}</div>
                        <div className="text-sm text-gray-400">Citas esta semana</div>
                      </div>
                    </div>

                    {stats.appointmentsByService && stats.appointmentsByService.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-blue-400 mb-3">Servicios más solicitados</h4>
                        <div className="space-y-2">
                          {stats.appointmentsByService.map(s => (
                            <div key={s.service} className="bg-gray-800/50 p-3 rounded-lg flex justify-between items-center">
                              <span className="text-gray-300">{s.service}</span>
                              <div className="flex items-center gap-4">
                                <span className="text-blue-400">{s.count} citas</span>
                                <span className="text-green-400">${s.revenue}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
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

export default BarbersPage;
