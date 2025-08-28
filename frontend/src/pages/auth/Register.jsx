import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validación frontend más completa
    // Validar nombre
    if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(form.name)) {
      setError('El nombre solo puede contener letras y espacios');
      return;
    }
    if (form.name.length < 2 || form.name.length > 50) {
      setError('El nombre debe tener entre 2 y 50 caracteres');
      return;
    }

    // Validar email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Debe proporcionar un email válido');
      return;
    }

    // Validar contraseña
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (!/\d/.test(form.password)) {
      setError('La contraseña debe contener al menos un número');
      return;
    }

    try {
      const userData = {
        username: form.name.toLowerCase().replace(/\s+/g, '_'), // Convertir espacios a guiones bajos
        name: form.name,
        email: form.email.toLowerCase(),
        password: form.password,
        role: 'user'
      };

      const data = await authService.register(userData);
      
      if (data.success === false) {
        setError(data.message || 'Error en el registro');
        return;
      }
      
      setSuccess('¡Registro exitoso! Redirigiendo...');
      
      // Guardar el token y datos del usuario
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      // Esperar 1 segundo antes de redirigir
      setTimeout(() => {
        navigate('/login');
      }, 1000);
    } catch (err) {
      console.error('Error durante el registro:', err);
      if (err.errors && Array.isArray(err.errors)) {
        // Mostrar el primer error de validación
        setError(err.errors[0].msg || 'Error de validación');
      } else {
        setError(err.message || 'Error en el registro. Por favor, intenta de nuevo.');
      }
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-700">
      <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">Registro</h2>
      <form onSubmit={handleSubmit} className="bg-gray-900 p-6 rounded-xl shadow mb-4 border border-gray-700">
        <div className="mb-6">
          <label className="block mb-2 text-blue-300 font-semibold">Nombre</label>
          <input name="name" value={form.name} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400" required />
        </div>
        <div className="mb-6">
          <label className="block mb-2 text-blue-300 font-semibold">Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400" required />
        </div>
        <div className="mb-6">
          <label className="block mb-2 text-blue-300 font-semibold">Contraseña</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400" required />
        </div>
        <button type="submit" className="w-full mt-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-800 font-bold transition">Registrarse</button>
      </form>
      {error && (
        <div className="flex justify-center mb-2">
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-2 rounded shadow animate-fade-in">{error}</div>
        </div>
      )}
      {success && (
        <div className="flex justify-center mb-2">
          <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-2 rounded shadow animate-fade-in">{success}</div>
        </div>
      )}
      <div className="mt-4 text-center">
        <span>¿Ya tienes cuenta? </span>
        <a href="/login" className="text-blue-600 hover:underline">Inicia sesión</a>
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

export default Register;
