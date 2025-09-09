import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { PageContainer } from '../../components/layout/PageContainer';
import GradientButton from '../../components/ui/GradientButton';
import { LOGOS } from '../../utils/assets';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, error: authError } = useAuth();
  const { showError, showSuccess } = useNotification();
  const navigate = useNavigate();

    const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        showSuccess('¡Bienvenido! Has iniciado sesión correctamente');
        navigate('/');
      } else {
        // Usar el error específico del contexto o uno genérico
        const errorMessage = authError || 'Credenciales incorrectas. Por favor verifica tu email y contraseña.';
        showError(errorMessage);
        setLocalError(errorMessage);
      }
    } catch (error) {
      const errorMessage = 'Error al iniciar sesión. Por favor intenta nuevamente.';
      showError(errorMessage);
      setLocalError(errorMessage);
    } finally {
      setLoading(false);
    }
  };  return (
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
                  Iniciar sesión
                </span>
              </h1>
              <p className="text-base">
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Ingresa a tu cuenta para continuar
                </span>
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="tu@email.com"
                    className="block w-full pl-10 pr-4 py-3 bg-gray-700/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 relative z-10 backdrop-blur-xl text-sm placeholder:text-gray-400 text-gray-200"
                  />
                </div>
              </div>

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
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-4 py-3 bg-gray-700/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 relative z-10 backdrop-blur-xl text-sm placeholder:text-gray-400 text-gray-200"
                  />
                </div>
              </div>

              {localError && (
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-red-600/50 to-red-700/50 rounded-xl blur-lg opacity-75"></div>
                  <div className="relative bg-red-900/30 border border-red-500/50 p-4 rounded-xl text-sm flex items-start backdrop-blur-xl">
                    <svg className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="bg-gradient-to-r from-red-200 to-red-300 bg-clip-text text-transparent">
                      {localError}
                    </span>
                  </div>
                </div>
              )}

              <GradientButton
                type="submit"
                disabled={loading}
                loading={loading}
                loadingText="Iniciando sesión..."
                variant="primary"
                className="w-full py-3"
              >
                Iniciar sesión
              </GradientButton>

              <div className="text-center relative">
                <div className="inline-block">
                  <span className="text-sm">
                    <span className="bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">
                      ¿No tienes cuenta?{' '}
                    </span>
                  </span>
                  <Link 
                    to="/register" 
                    className="relative inline-block font-medium group"
                  >
                    <span className="relative z-10 text-sm bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-bold hover:from-blue-300 hover:to-purple-300 transition-all duration-300">
                      Regístrate
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

export default Login;
