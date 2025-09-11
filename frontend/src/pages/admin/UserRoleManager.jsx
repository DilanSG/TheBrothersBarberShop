import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { PageContainer } from '../../components/layout/PageContainer';
import GradientText from '../../components/ui/GradientText';
import { api } from '../../services/api';

function UserRoleManager() {
  const { user, token } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      if (user?.role === 'admin') {
        try {
          // Obtener usuarios
          const usersData = await api.get('/users');

          // Obtener barberos para validación
          const barbersData = await api.get('/barbers');

          // Validar que la respuesta sea exitosa y tenga datos
          if (!barbersData.success || !Array.isArray(barbersData.data)) {
            console.warn('Respuesta de barberos inválida:', barbersData);
          } else {
            // Filtrar barberos activos
            const activeBarbers = barbersData.data.filter(barber => 
              barber.isActive && 
              barber.user && 
              barber.user.isActive
            );
            console.log('Barberos activos encontrados:', activeBarbers.length);
          }

          // Validar que la respuesta de usuarios sea exitosa
          if (!usersData.success || !Array.isArray(usersData.data)) {
            throw new Error('Respuesta de usuarios inválida');
          }

          // Ya no sobrescribimos el rol, solo lo mostramos tal cual viene del backend
          setUsers(usersData.data || []);
        } catch (error) {
          console.error('Error al cargar usuarios:', error);
          showError('Error al cargar la lista de usuarios');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUsers();
  }, [user, token]);

  const refreshBarbers = async () => {
    try {
      // Forzar actualización de la cache de barberos
      const data = await api.get('/barbers', false); // false = no usar caché
      
      // Validar que la respuesta sea exitosa y tenga datos
      if (!data.success || !Array.isArray(data.data)) {
        console.warn('Respuesta de barberos inválida en refresh:', data);
        return [];
      }
      
      // Filtrar solo barberos activos que realmente son barberos
      const activeBarbers = data.data.filter(barber => 
        barber.user && 
        barber.user.role === 'barber' && 
        barber.user.isActive && 
        barber.isActive
      );
      return activeBarbers;
    } catch (error) {
      console.error('Error al refrescar barberos:', error);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });

      // Si el nuevo rol es 'barber', asegurar que el perfil esté activo
      if (newRole === 'barber') {
        // Llama a la API que fuerza la creación/activación del perfil
        await api.get(`/barbers/by-user/${userId}`);
        // Espera un poco para asegurar que el backend procese el cambio
        await new Promise(resolve => setTimeout(resolve, 1000));
        await refreshBarbers();
      }

      // Recargar la lista completa de usuarios para tener el estado más actualizado
      const usersData = await api.get('/users');
      
      // Validar que la respuesta sea exitosa y tenga datos
      if (usersData.success && Array.isArray(usersData.data)) {
        setUsers(usersData.data);
      } else {
        console.warn('Respuesta de usuarios inválida después de cambio de rol:', usersData);
      }

      showSuccess('Rol actualizado correctamente');
    } catch (err) {
      console.error('Error al cambiar rol:', err);
      showError(err.message || 'Error al cambiar el rol del usuario');
    }
  };

  const handleDeleteUser = async (userId) => {
    const userToDelete = users.find(u => u._id === userId);
    setUserToDelete(userToDelete);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await api.delete(`/users/${userToDelete._id}`);
      
      setUsers(users.filter(u => u._id !== userToDelete._id));
      showSuccess('Usuario eliminado correctamente');
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      showError(err.message || 'Error al eliminar el usuario');
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  if (user?.role !== 'admin') return null;

  return (
    <PageContainer>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="p-4 bg-gradient-to-r from-blue-600/20 to-blue-600/20 rounded-xl border border-blue-500/20 shadow-xl shadow-blue-500/20 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="bg-gradient-to-r from-blue-400 to-blue-400 bg-clip-text text-transparent">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">Gestión de Usuarios</h2>
          </div>
          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            Administra los roles y permisos de los usuarios de la plataforma
          </p>
        </div>

        {loading ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm shadow-2xl shadow-blue-500/20 p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0">
                  <div className="w-full h-full border-4 border-blue-500/20 rounded-full"></div>
                  <div className="w-full h-full border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-400 to-blue-400 bg-clip-text text-transparent">
                <p className="text-xl font-semibold">Cargando usuarios...</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm shadow-2xl shadow-blue-500/20 overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-gradient-to-r from-white/10 to-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-400">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Usuario
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-blue-400">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                        Email
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-green-400">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Rol
                      </div>
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-pink-400">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map(u => (
                    <tr key={u._id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 text-base whitespace-nowrap text-white font-medium">
                        {u.name || u.email}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-300">
                        {u.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                          ${u.role === 'admin' ? 'bg-blue-900/50 text-blue-300 border border-blue-500/30' :
                            u.role === 'barber' ? 'bg-green-900/50 text-green-300 border border-green-500/30' :
                            'bg-gray-900/50 text-gray-300 border border-gray-500/30'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-3">
                          <select
                            value={u.role}
                            onChange={e => handleRoleChange(u._id, e.target.value)}
                            className="block px-3 py-2 text-sm text-white bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm shadow-xl shadow-blue-500/20"
                          >
                            <option value="user">Usuario</option>
                            <option value="barber">Barbero</option>
                            <option value="admin">Admin</option>
                          </select>
                          
                          {u._id !== (user._id || user.id) && u.role !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(u._id)}
                              className="inline-flex items-center p-2 border border-red-500/30 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-all duration-200 shadow-xl shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30"
                              title="Eliminar usuario"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Layout - Card Style */}
            <div className="block md:hidden divide-y divide-white/10">
              {users.map(u => (
                <div key={u._id} className="p-6 hover:bg-white/5 transition-colors group">
                  {/* User Info */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <GradientText className="text-lg font-semibold">
                        {u.name || u.email}
                      </GradientText>
                      <p className="text-sm text-gray-400 mt-1">{u.email}</p>
                    </div>
                    <div className="ml-4">
                      <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium
                        ${u.role === 'admin' ? 'bg-blue-900/50 text-blue-300 border border-blue-500/30' :
                          u.role === 'barber' ? 'bg-green-900/50 text-green-300 border border-green-500/30' :
                          'bg-gray-900/50 text-gray-300 border border-gray-500/30'}`}>
                        {u.role === 'admin' ? 'Administrador' :
                         u.role === 'barber' ? 'Barbero' : 'Usuario'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <div>
                      <label className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 block">
                        Cambiar Rol
                      </label>
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u._id, e.target.value)}
                        className="w-full px-4 py-3 text-white bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm shadow-xl shadow-blue-500/20"
                      >
                        <option value="user">Usuario</option>
                        <option value="barber">Barbero</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                    
                    {u._id !== (user._id || user.id) && u.role !== 'admin' && (
                      <button
                        onClick={() => handleDeleteUser(u._id)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-red-500/30 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-all duration-200 shadow-xl shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="font-medium">Eliminar Usuario</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal de confirmación de eliminación */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
              onClick={() => {
                setShowDeleteModal(false);
                setUserToDelete(null);
              }}
            />
            
            {/* Modal */}
            <div className="absolute inset-0 overflow-y-auto">
              <div className="flex min-h-full items-end sm:items-center justify-center p-4">
                <div className="relative bg-white/10 border border-white/20 rounded-2xl backdrop-blur-md shadow-2xl shadow-blue-500/20 w-full max-w-md transform transition-all animate-modal">
                  {/* Header */}
                  <div className="border-b border-white/10 px-6 py-6">
                    <div className="flex items-center">
                      <div className="mr-4 flex-shrink-0">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600/20 border border-red-500/30 shadow-xl shadow-red-500/20">
                          <svg className="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
                          <h3 className="text-xl font-bold">Confirmar eliminación</h3>
                        </div>
                        <p className="mt-2 text-gray-400">Esta acción no se puede deshacer</p>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-6 py-6">
                    <p className="text-gray-300 text-lg leading-relaxed">
                      ¿Estás seguro que deseas eliminar al usuario{' '}
                      <span className="font-semibold bg-gradient-to-r from-blue-400 to-blue-400 bg-clip-text text-transparent">
                        {userToDelete?.name || userToDelete?.email}
                      </span>?
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-white/10 px-6 py-6">
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-4">
                      <button
                        onClick={() => {
                          setShowDeleteModal(false);
                          setUserToDelete(null);
                        }}
                        className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white/10 border border-white/20 text-gray-300 hover:bg-white/20 transition-all duration-200 backdrop-blur-sm shadow-xl shadow-blue-500/20"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={confirmDelete}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-lg bg-red-600/80 border border-red-500/50 text-white hover:bg-red-600 transition-all duration-200 shadow-xl shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/50"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Eliminar usuario
                      </button>
                    </div>
                  </div>
                </div>
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

          @keyframes modal {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-modal {
            animation: modal 0.2s ease-out;
          }
        `}</style>
      </div>
    </PageContainer>
  );
}

export default UserRoleManager;
