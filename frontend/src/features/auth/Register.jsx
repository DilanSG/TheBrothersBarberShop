import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '@services/authService';
import { useNotification } from '@contexts/NotificationContext';
import { PageContainer } from '@components/layout/PageContainer';
import GradientButton from '@components/ui/GradientButton';
import GradientText from '@components/ui/GradientText';
import { User, Mail, Lock, AlertTriangle, UserPlus } from 'lucide-react';
import { LOGOS } from '@utils/assets';

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

      <div className="relative z-10 min-h-screen flex items-center justify-center py-6 sm:py-8 lg:py-12 px-4 sm:px-6">
        <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg relative">
          {/* Container principal con glassmorphism azul suave */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-blue-700/15 to-blue-600/10 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-all duration-500"></div>
            <div className="relative bg-blue-500/3 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 border border-blue-500/15 shadow-lg shadow-blue-500/10 overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 right-0 h-16">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 via-blue-600/3 to-transparent rounded-t-2xl"></div>
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400/20 to-transparent"></div>
              </div>
              
              {/* Efecto de brillo contenido */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-2xl"></div>
              
              {/* Header mejorado */}
              <div className="text-center mb-4 sm:mb-6 lg:mb-8 relative pt-2 sm:pt-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-3 sm:mb-4 lg:mb-6 relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/15 via-blue-700/15 to-blue-600/15 rounded-full blur-lg opacity-40 group-hover:opacity-60 transition-all duration-500"></div>
                  <img
                    src={LOGOS.main()}
                    alt="The Brothers Barber Shop"
                    className="w-full h-full object-contain relative z-10 transform group-hover:scale-105 transition-transform duration-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.2)]"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = LOGOS.fallback();
                    }}
                  />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <GradientText className="text-xl sm:text-2xl lg:text-3xl font-bold">
                    Crear cuenta
                  </GradientText>
                  <p className="text-xs sm:text-sm text-gray-300">
                    Únete a nuestra comunidad
                  </p>
                </div>
              </div>

              {/* Form mejorado */}
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 lg:space-y-6">
                {/* Nombre */}
                <div>
                <label htmlFor="name" className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-gray-300">
                  Nombre completo
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none z-10">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-blue-600/30 to-blue-700/30 rounded-lg flex items-center justify-center border border-blue-500/30 shadow-sm shadow-blue-500/20">
                      <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-400 drop-shadow-[0_1px_2px_rgba(96,165,250,0.3)]" />
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
                    className="block w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-blue-500/15 border border-blue-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 focus:bg-blue-500/20 relative text-sm placeholder:text-gray-400 text-white transition-all duration-300 autofill:!bg-blue-500/15 autofill:!text-white autofill:!shadow-[inset_0_0_0px_1000px_rgba(59,130,246,0.15)] autofill:!border-blue-500/30 [-webkit-autofill]:!bg-blue-500/15 [-webkit-autofill]:!shadow-[inset_0_0_0px_1000px_rgba(59,130,246,0.15)] [-webkit-autofill:hover]:!bg-blue-500/15 [-webkit-autofill:focus]:!bg-blue-500/15"
                  />
                </div>
                </div>

                {/* Email */}
                <div>
                <label htmlFor="email" className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-gray-300">
                  Correo electrónico
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none z-10">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-blue-600/30 to-blue-700/30 rounded-lg flex items-center justify-center border border-blue-500/30 shadow-sm shadow-blue-500/20">
                      <Mail className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-400 drop-shadow-[0_1px_2px_rgba(96,165,250,0.3)]" />
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
                    className="block w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-blue-500/15 border border-blue-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 focus:bg-blue-500/20 relative text-sm placeholder:text-gray-400 text-white transition-all duration-300 autofill:!bg-blue-500/15 autofill:!text-white autofill:!shadow-[inset_0_0_0px_1000px_rgba(59,130,246,0.15)] autofill:!border-blue-500/30 [-webkit-autofill]:!bg-blue-500/15 [-webkit-autofill]:!shadow-[inset_0_0_0px_1000px_rgba(59,130,246,0.15)] [-webkit-autofill:hover]:!bg-blue-500/15 [-webkit-autofill:focus]:!bg-blue-500/15"
                  />
                </div>
                </div>

                {/* Password */}
                <div>
                <label htmlFor="password" className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-gray-300">
                  Contraseña
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none z-10">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-blue-600/30 to-blue-700/30 rounded-lg flex items-center justify-center border border-blue-500/30 shadow-sm shadow-blue-500/20">
                      <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-400 drop-shadow-[0_1px_2px_rgba(96,165,250,0.3)]" />
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
                    className="block w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-blue-500/15 border border-blue-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 focus:bg-blue-500/20 relative text-sm placeholder:text-gray-400 text-white transition-all duration-300 autofill:!bg-blue-500/15 autofill:!text-white autofill:!shadow-[inset_0_0_0px_1000px_rgba(59,130,246,0.15)] autofill:!border-blue-500/30 [-webkit-autofill]:!bg-blue-500/15 [-webkit-autofill]:!shadow-[inset_0_0_0px_1000px_rgba(59,130,246,0.15)] [-webkit-autofill:hover]:!bg-blue-500/15 [-webkit-autofill:focus]:!bg-blue-500/15"
                  />
                </div>
                <p className="mt-1 sm:mt-2 text-xs text-gray-400">
                  Mínimo 6 caracteres, incluyendo al menos un número
                </p>
                </div>

                {error && (
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600/30 to-red-700/30 rounded-xl blur opacity-75 group-hover:opacity-100 transition-all duration-300"></div>
                  <div className="relative bg-red-900/20 border border-red-500/30 p-2.5 sm:p-3 lg:p-4 rounded-xl text-xs sm:text-sm flex items-start backdrop-blur-sm shadow-lg shadow-red-500/20">
                    <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-red-400 mr-1.5 sm:mr-2 lg:mr-3 mt-0.5 flex-shrink-0 drop-shadow-[0_1px_2px_rgba(239,68,68,0.3)]" />
                    <span className="text-red-200 leading-relaxed">
                      {error}
                    </span>
                  </div>
                </div>
                )}

                {success && (
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600/30 to-green-700/30 rounded-xl blur opacity-75 group-hover:opacity-100 transition-all duration-300"></div>
                  <div className="relative bg-green-900/20 border border-green-500/30 p-2.5 sm:p-3 lg:p-4 rounded-xl text-xs sm:text-sm flex items-start backdrop-blur-sm shadow-lg shadow-green-500/20">
                    <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-green-400 mr-1.5 sm:mr-2 lg:mr-3 mt-0.5 flex-shrink-0 drop-shadow-[0_1px_2px_rgba(34,197,94,0.3)]" />
                    <span className="text-green-200 leading-relaxed">
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
                className="w-full py-2.5 sm:py-3 shadow-xl shadow-blue-500/20 text-sm sm:text-base"
                >
                  Crear cuenta
                </GradientButton>

                <div className="text-center relative pt-1 sm:pt-2">
                <div className="inline-block">
                  <span className="text-xs sm:text-sm text-gray-400">
                    ¿Ya tienes cuenta?{' '}
                  </span>
                  <Link 
                    to="/login" 
                    className="relative inline-block font-medium group"
                  >
                    <span className="relative z-10 text-xs sm:text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors duration-300">
                      Inicia sesión
                    </span>
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 shadow-sm shadow-blue-500/50"></div>
                  </Link>
                </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

export default Register;
