import React, { useRef, useState } from 'react';
import { useAuth } from '../utils/AuthContext';

function Profile() {
  const { user, token, setUser } = useAuth();
  const fileInputRef = useRef();
  const [loading, setLoading] = useState(false);
  const [birthdate, setBirthdate] = useState(user?.birthdate ? user.birthdate.slice(0,10) : '');
  const [photo, setPhoto] = useState(user?.photo?.url || '');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  if (!user) return <p className="text-center text-red-500 mt-10">No has iniciado sesión.</p>;

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validar tamaño y tipo de archivo
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar 5MB');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await fetch(`http://localhost:5000/api/users/${user._id || user.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Error al actualizar la foto');
      }

      if (data.data) {
        const updatedUser = data.data;
        setUser(updatedUser);
        setPhoto(updatedUser.photo?.url || '');
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setSuccess('✅ Foto actualizada exitosamente');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleBirthdateChange = async (e) => {
    const value = e.target.value;
    setBirthdate(value);
    setLoading(true);
    const res = await fetch(`http://localhost:5000/api/users/${user._id || user.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ birthdate: value })
    });
    const data = await res.json();
    if (data.data) setUser(data.data);
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-700">
      <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">Perfil de usuario</h2>
      <div className="flex flex-col items-center mb-6">
        <div className="relative group">
          {photo ? (
            <img src={photo} alt="Foto de perfil" className="w-24 h-24 rounded-full object-cover border-4 border-blue-400 mb-2 shadow cursor-pointer" onClick={() => fileInputRef.current.click()} />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 border-4 border-blue-400 mb-2 shadow cursor-pointer" onClick={() => fileInputRef.current.click()}>
              Sin foto
            </div>
          )}
          <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handlePhotoChange} />
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current.click()}>
            <span className="text-white font-semibold">Cambiar foto</span>
          </div>
        </div>
        {loading && <span className="text-blue-400 mt-2">Actualizando...</span>}
        {success && <div className="text-green-500 mt-2 text-center font-semibold">{success}</div>}
        {error && <div className="text-red-500 mt-2 text-center font-semibold">{error}</div>}
      </div>
      <div className="mb-4"><span className="font-semibold text-blue-300">Usuario:</span> <span className="text-white">{user.username || user.name || user.email}</span></div>
      <div className="mb-4"><span className="font-semibold text-blue-300">Email:</span> <span className="text-white">{user.email}</span></div>
      {user.phone && (
        <div className="mb-4"><span className="font-semibold text-blue-300">Celular:</span> <span className="text-white">{user.phone}</span></div>
      )}
      <div className="mb-4">
        <span className="font-semibold text-blue-300">Fecha de nacimiento:</span>
        <input type="date" value={birthdate} onChange={handleBirthdateChange} className="ml-2 px-2 py-1 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400" />
      </div>
      {/* Mostrar el rol solo si es admin */}
      {user.role === 'admin' && (
        <div className="mb-4"><span className="font-semibold text-blue-300">Rol:</span> <span className="text-white">{user.role}</span></div>
      )}
    </div>
  );
}

export default Profile;
