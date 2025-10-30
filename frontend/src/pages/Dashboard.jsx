import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import {PageContainer} from '@components/layout/PageContainer';
import GradientText from '@components/ui/GradientText';
import { User, Shield, Scissors, Home } from 'lucide-react';

/**
 * Dashboard principal que redirige según el rol del usuario
 * Reemplaza todas las referencias a /dashboard en la aplicación
 */
const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      // Redireccionar según el rol del usuario después de un breve delay
      const timer = setTimeout(() => {
        switch (user.role) {
          case 'admin':
            navigate('/admin/barbers', { replace: true });
            break;
          case 'barber':
            navigate('/admin/sales', { replace: true });
            break;
          default:
            navigate('/profile', { replace: true });
            break;
        }
      }, 1500); // 1.5 segundos para mostrar el dashboard

      return () => clearTimeout(timer);
    }
  }, [user, loading, navigate]);

  // Mostrar loading mientras se autentica
  if (loading) {
    return (
      <PageContainer>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-300">Verificando permisos...</p>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  // Redirigir a login si no está autenticado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Mostrar dashboard temporal con redirección automática
  return (
    <PageContainer>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 space-y-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-6">
            {/* Título con gradiente */}
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/20 shadow-xl shadow-blue-500/20">
                <Home className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
              </div>
              <GradientText className="text-xl sm:text-2xl lg:text-3xl font-bold">
                Redirigiendo al Dashboard
              </GradientText>
            </div>

            {/* Icono de rol */}
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full border border-blue-500/20 shadow-xl shadow-blue-500/20">
                {user.role === 'admin' ? (
                  <Shield className="w-12 h-12 text-blue-400" />
                ) : user.role === 'barber' ? (
                  <Scissors className="w-12 h-12 text-blue-400" />
                ) : (
                  <User className="w-12 h-12 text-blue-400" />
                )}
              </div>
            </div>

            {/* Mensaje personalizado por rol */}
            <div className="space-y-2">
              <p className="text-lg text-white font-medium">
                ¡Bienvenido, {user.name}!
              </p>
              <p className="text-gray-300">
                {user.role === 'admin' 
                  ? 'Dirigiendo al panel de administración...'
                  : user.role === 'barber'
                  ? 'Dirigiendo al panel de ventas...'
                  : 'Dirigiendo a tu perfil...'}
              </p>
            </div>

            {/* Loading indicator */}
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-sm text-gray-400">Redirigiendo...</span>
            </div>

            {/* Enlaces rápidos como fallback */}
            <div className="pt-6">
              <p className="text-sm text-gray-400 mb-3">O navega directamente:</p>
              <div className="flex flex-wrap justify-center gap-3">
                {user.role === 'admin' && (
                  <>
                    <button
                      onClick={() => navigate('/admin/barbers')}
                      className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-300 hover:bg-blue-500/30 transition-all duration-300 text-sm shadow-xl shadow-blue-500/20"
                    >
                      Gestión Barberos
                    </button>
                    <button
                      onClick={() => navigate('/admin/reports')}
                      className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-300 hover:bg-blue-500/30 transition-all duration-300 text-sm shadow-xl shadow-blue-500/20"
                    >
                      Reportes
                    </button>
                  </>
                )}
                {(user.role === 'barber' || user.role === 'admin') && (
                  <button
                    onClick={() => navigate('/admin/sales')}
                    className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-300 hover:bg-blue-500/30 transition-all duration-300 text-sm shadow-xl shadow-blue-500/20"
                  >
                    Panel Ventas
                  </button>
                )}
                <button
                  onClick={() => navigate('/profile')}
                  className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-300 hover:bg-blue-500/30 transition-all duration-300 text-sm shadow-xl shadow-blue-500/20"
                >
                  Mi Perfil
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default Dashboard;
