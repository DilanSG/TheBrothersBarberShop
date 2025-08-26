import React, { useState, useRef } from 'react';
import { useAuth } from '../utils/AuthContext';

  const { user, token } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });
  const [photoPreview, setPhotoPreview] = useState(user?.photo?.url || '');
  const [photoFile, setPhotoFile] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = e => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const userId = user.id || user._id;
      const formData = new FormData();
      formData.append('username', form.name);
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      if (photoFile) {
        formData.append('photo', photoFile);
      }
      const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al actualizar perfil');
      setSuccess('✅ Perfil actualizado exitosamente.');
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 2500);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Editar Perfil</h2>
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-4" encType="multipart/form-data">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Nombre</label>
            <input name="name" value={form.name} onChange={handleChange} className="form-input" required />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className="form-input" required />
          </div>
          <div>
            <label className="form-label">Teléfono</label>
            <input name="phone" value={form.phone} onChange={handleChange} className="form-input" />
          </div>
          <div>
            <label className="form-label">Foto de perfil</label>
            <div className="flex items-center gap-4">
              {photoPreview ? (
                <img src={photoPreview} alt="Foto de perfil" className="w-16 h-16 rounded-full object-cover border" />
              ) : (
                <span className="text-gray-400">Sin foto</span>
              )}
              <button type="button" className="btn-secondary" onClick={() => fileInputRef.current.click()}>
                Cambiar foto
              </button>
              <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handlePhotoChange} />
            </div>
          </div>
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

export default ProfileEdit;
