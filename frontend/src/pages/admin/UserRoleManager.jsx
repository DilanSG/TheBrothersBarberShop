import React, { useEffect, useState } from 'react';
import { useAuth } from '../../utils/AuthContext';

function UserRoleManager() {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userToDelete, setUserToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetch('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setUsers(data.data || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [user, token]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al cambiar rol');
      setUsers(users.map(u => (u._id === userId ? data.data : u)));
      setSuccess('✅ Rol actualizado');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 2000);
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
      const res = await fetch(`http://localhost:5000/api/users/${userToDelete._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Error al eliminar usuario');
      
      setUsers(users.filter(u => u._id !== userToDelete._id));
      setSuccess('✅ Usuario eliminado correctamente');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 2000);
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  if (user?.role !== 'admin') return null;

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-700">
      <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">Gestión de roles de usuarios</h2>
      {loading ? (
        <p className="text-center text-gray-400">Cargando usuarios...</p>
      ) : (
        <table className="w-full border border-gray-700 rounded-xl overflow-hidden shadow-lg bg-gray-900">
          <thead>
            <tr className="bg-gray-700 text-blue-300">
              <th className="p-3">Usuario</th>
              <th className="p-3">Email</th>
              <th className="p-3">Rol actual</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id} className="border-t border-gray-700 hover:bg-gray-800">
                <td className="p-3 text-white">{u.username || u.name || u.email}</td>
                <td className="p-3 text-white">{u.email}</td>
                <td className="p-3 font-semibold text-blue-400">{u.role}</td>
                <td className="p-3 space-x-2 flex items-center">
                  <select
                    value={u.role}
                    onChange={e => handleRoleChange(u._id, e.target.value)}
                    className="px-3 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="user">Usuario</option>
                    <option value="barber">Barbero</option>
                    <option value="admin">Admin</option>
                  </select>
                  
                  {u._id !== user.id && u.role !== 'admin' && (
                    <button
                      onClick={() => handleDeleteUser(u._id)}
                      className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                      title="Eliminar usuario"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {error && <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-2 rounded shadow mt-4 animate-fade-in">{error}</div>}
      {success && <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-2 rounded shadow mt-4 animate-fade-in">{success}</div>}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-red-400 mb-4">Confirmar eliminación</h3>
            <p className="text-gray-300 mb-6">
              ¿Estás seguro que deseas eliminar al usuario{' '}
              <span className="font-semibold text-blue-400">
                {userToDelete?.username || userToDelete?.email}
              </span>?
              <br />
              <span className="text-red-400 text-sm">Esta acción no se puede deshacer.</span>
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
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

export default UserRoleManager;
