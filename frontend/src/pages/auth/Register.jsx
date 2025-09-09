import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useNotification } from '../../contexts/NotificationContext';
import { PageContainer } from '../../components/layout/PageContainer';
import GradientButton from '../../components/ui/GradientButton';
import { LOGOS } from '../../utils/assets';

function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess } = useNotification();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validación frontend
    if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(form.name)) {
      const errorMsg = 'El nombre solo puede contener letras y espacios';
      setError(errorMsg);
      showError(errorMsg);
      setLoading(false);
      return;
    }
    if (form.name.length < 2 || form.name.length > 50) {
      const errorMsg = 'El nombre debe tener entre 2 y 50 caracteres';
      setError(errorMsg);
      showError(errorMsg);
      setLoading(false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      const errorMsg = 'Debe proporcionar un email válido';
      setError(errorMsg);
      showError(errorMsg);
      setLoading(false);
      return;
    }
    if (form.password.length < 6) {
      const errorMsg = 'La contraseña debe tener al menos 6 caracteres';
      setError(errorMsg);
      showError(errorMsg);
      setLoading(false);
      return;
    }
    if (!/\d/.test(form.password)) {
      const errorMsg = 'La contraseña debe contener al menos un número';
      setError(errorMsg);
      showError(errorMsg);
      setLoading(false);
      return;
    }

    try {
      const userData = {
        name: form.name,
        email: form.email.toLowerCase(),
        password: form.password,
        role: 'user'
      };

      const data = await authService.register(userData);
      
      if (data.success === false) {
        const errorMsg = data.message || 'Error en el registro';
        setError(errorMsg);
        showError(errorMsg);
        setLoading(false);
        return;
      }
      
      const successMsg = '¡Registro exitoso! Redirigiendo al login...';
      setSuccess(successMsg);
      showSuccess(successMsg);
      
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      setTimeout(() => {
        navigate('/login');
      }, 1000);
    } catch (err) {
      console.error('Error durante el registro:', err);
      let errorMsg = 'Error en el registro. Por favor, intenta de nuevo.';
      if (err.errors && Array.isArray(err.errors)) {
        errorMsg = err.errors[0].msg || 'Error de validación';
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      {/* Fondo de puntos característico */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `radial-gradient(circle, rgba(59, 130, 246, 0.15) 1px, transparent 1px)`,
        backgroundSize: '30px 30px',
        backgroundPosition: '0 0, 15px 15px'
      }}></div>
      
      <div className="absolute inset-0 opacity-8" style={{
        backgroundImage: `radial-gradient(circle, rgba(239, 68, 68, 0.12) 1px, transparent 1px)`,
        backgroundSize: '20px 20px',
        backgroundPosition: '10px 10px'
      }}></div>
      
      <div className="absolute inset-0 opacity-6" style={{
        backgroundImage: `radial-gradient(circle, rgba(168, 85, 247, 0.1) 0.8px, transparent 0.8px)`,
        backgroundSize: '40px 40px',
        backgroundPosition: '20px 0'
      }}></div>

      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md relative">
          <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl p-8 sm:p-10 border border-white/10 shadow-xl shadow-blue-500/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 via-blue-600/10 to-red-600/10 rounded-2xl blur-xl transform rotate-3 scale-105 -z-10"></div>
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 right-0 h-20">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-600/20 via-blue-600/10 to-transparent"></div>
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
            </div>
            
            {/* Header */}
            <div className="text-center mb-8 relative">
              <div className="w-32 h-32 mx-auto mb-6 relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 via-blue-600/20 to-red-600/20 rounded-full blur-xl transform group-hover:scale-110 transition-transform duration-500"></div>
                <img
                  src={LOGOS.main()}
                  alt="The Brothers Barber Shop"
                  className="w-full h-full object-contain relative z-10 transform group-hover:scale-105 transition-transform duration-500"
                  style={{ filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = LOGOS.fallback();
                  }}
                />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-3">
                <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  Crear cuenta
                </span>
              </h1>
              <p className="text-base">
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Únete a nuestra comunidad
                </span>
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombre */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Nombre completo
                  </span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 via-blue-600/20 to-red-600/20 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center">
                      <svg className="h-3 w-3 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} 
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    className="block w-full pl-10 pr-4 py-3 bg-gray-700/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 relative z-10 backdrop-blur-xl text-sm placeholder:text-gray-400 text-gray-200"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Correo electrónico
                  </span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 via-blue-600/20 to-red-600/20 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center">
                      <svg className="h-3 w-3 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="tu@email.com"
                    className="block w-full pl-10 pr-4 py-3 bg-gray-700/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 relative z-10 backdrop-blur-xl text-sm placeholder:text-gray-400 text-gray-200"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Contraseña
                  </span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 via-blue-600/20 to-red-600/20 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center">
                      <svg className="h-3 w-3 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-4 py-3 bg-gray-700/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 relative z-10 backdrop-blur-xl text-sm placeholder:text-gray-400 text-gray-200"
                  />
                </div>
                <p className="mt-2 text-sm">
                  <span className="bg-gradient-to-r from-gray-400 to-gray-500 bg-clip-text text-transparent">
                    Mínimo 6 caracteres, incluyendo al menos un número
                  </span>
                </p>
              </div>

              {error && (
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-red-600/50 to-red-700/50 rounded-xl blur-lg opacity-75"></div>
                  <div className="relative bg-red-900/30 border border-red-500/50 p-4 rounded-xl text-sm flex items-start backdrop-blur-xl">
                    <svg className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="bg-gradient-to-r from-red-200 to-red-300 bg-clip-text text-transparent">
                      {error}
                    </span>
                  </div>
                </div>
              )}

              {success && (
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-600/50 to-green-700/50 rounded-xl blur-lg opacity-75"></div>
                  <div className="relative bg-green-900/30 border border-green-500/50 p-4 rounded-xl text-sm flex items-start backdrop-blur-xl">
                    <svg className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="bg-gradient-to-r from-green-200 to-green-300 bg-clip-text text-transparent">
                      {success}
                    </span>
                  </div>
                </div>
              )}

              <GradientButton
                type="submit"
                disabled={loading}
                loading={loading}
                loadingText="Creando cuenta..."
                variant="primary"
                className="w-full py-3"
              >
                Crear cuenta
              </GradientButton>

              <div className="text-center relative">
                <div className="inline-block">
                  <span className="text-sm">
                    <span className="bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">
                      ¿Ya tienes cuenta?{' '}
                    </span>
                  </span>
                  <Link 
                    to="/login" 
                    className="relative inline-block font-medium group"
                  >
                    <span className="relative z-10 text-sm bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-bold hover:from-blue-300 hover:to-purple-300 transition-all duration-300">
                      Inicia sesión
                    </span>
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

export default Register;
