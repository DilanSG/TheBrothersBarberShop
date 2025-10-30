import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { LOGOS } from "../../utils/assets";
import GradientText from "../ui/GradientText";
import GradientButton from "../ui/GradientButton";
import { useRoutePreloader } from "../../hooks/useRoutePreloader";

export const NAV_HEIGHT = 'h-14 sm:h-16';
export const NAV_HEIGHT_CLASS = 'pt-20 sm:pt-24';

const DropdownMenu = ({ user }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(e) {
      if (!e.target.closest('.dropdown-menu')) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative dropdown-menu">
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:scale-105 border border-blue-500/20 shadow-lg hover:shadow-blue-500/20"
      >
        <div className="flex items-center space-x-2">
          {user.profilePicture ? (
            <img
              src={user.profilePicture}
              alt={user.name || 'Usuario'}
              className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-white/30 shadow-lg"
            />
          ) : (
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 flex items-center justify-center text-white font-semibold shadow-lg border border-blue-500/30">
              {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <span className="text-xs sm:text-sm font-medium text-white hidden sm:block">
            {user.name || user.email}
          </span>
        </div>
        <svg
          className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300 text-blue-300 ${open ? 'transform rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 md:w-64 bg-gray-900/95 backdrop-blur-md border border-blue-500/30 rounded-2xl shadow-2xl shadow-blue-500/20 py-2 z-50 transform opacity-100 scale-100 transition-all duration-300">
          <div className="px-4 py-3 border-b border-blue-500/20">
            <p className="text-xs text-gray-300 mb-1">Conectado como</p>
            <p className="text-sm font-medium text-white truncate">
              {user.email}
            </p>
          </div>
          
          <div className="py-2">
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="group flex items-center px-4 py-2.5 text-sm hover:bg-blue-500/20 transition-all duration-300 rounded-lg mx-2 shadow-sm hover:shadow-blue-500/10"
            >
              <svg className="mr-3 h-4 w-4 text-blue-300 group-hover:text-blue-200 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-white group-hover:text-blue-200 transition-colors duration-300">
                Mi Perfil
              </span>
            </Link>

            <Link
              to="/profile-edit"
              onClick={() => setOpen(false)}
              className="group flex items-center px-4 py-2.5 text-sm hover:bg-blue-500/20 transition-all duration-300 rounded-lg mx-2 shadow-sm hover:shadow-blue-500/10"
            >
              <svg className="mr-3 h-4 w-4 text-purple-300 group-hover:text-purple-200 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="text-white group-hover:text-purple-200 transition-colors duration-300">
                Editar Perfil
              </span>
            </Link>
          </div>

          {(user.role === 'admin' || user.role === 'barber') && (
            <>
              <div className="py-2 border-t border-blue-500/20 mt-2">
                <div className="px-4 py-2">
                  <p className="text-xs font-medium text-blue-300 uppercase tracking-wider">
                    {user.role === 'admin' ? 'Administración' : 'Gestión'}
                  </p>
                </div>

                {/* Inventario - Para barberos Y admins */}
                <Link
                  to="/admin/inventory"
                  onClick={() => setOpen(false)}
                  className="group flex items-center px-4 py-2.5 text-sm hover:bg-blue-500/20 transition-all duration-300 rounded-lg mx-2 shadow-sm hover:shadow-blue-500/10"
                >
                  <svg className="mr-3 h-4 w-4 text-blue-300 group-hover:text-blue-200 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span className="text-white group-hover:text-blue-200 transition-colors duration-300">
                    Control de Inventario
                  </span>
                </Link>

                {user.role === 'admin' && (
                  <>
                  <Link
                      to="/admin/reports"
                      onClick={() => setOpen(false)}
                      className="group flex items-center px-4 py-2.5 text-sm hover:bg-blue-500/20 transition-all duration-300 rounded-lg mx-2 shadow-sm hover:shadow-blue-500/10"
                    >
                      <svg className="mr-3 h-4 w-4 text-green-300 group-hover:text-green-200 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span className="text-white group-hover:text-green-200 transition-colors duration-300">
                        Control Financiero
                      </span>
                    </Link>

                    <Link
                      to="/admin/services"
                      onClick={() => setOpen(false)}
                      className="group flex items-center px-4 py-2.5 text-sm hover:bg-blue-500/20 transition-all duration-300 rounded-lg mx-2 shadow-sm hover:shadow-blue-500/10"
                    >
                      <svg className="mr-3 h-4 w-4 text-red-300 group-hover:text-red-200 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                      <span className="text-white group-hover:text-red-200 transition-colors duration-300">
                        Gestión de Servicios
                      </span>
                    </Link>

                    <Link
                      to="/admin/barbers"
                      onClick={() => setOpen(false)}
                      className="group flex items-center px-4 py-2.5 text-sm hover:bg-blue-500/20 transition-all duration-300 rounded-lg mx-2 shadow-sm hover:shadow-blue-500/10"
                    >
                      <svg className="mr-3 h-4 w-4 text-blue-300 group-hover:text-blue-200 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="text-white group-hover:text-blue-200 transition-colors duration-300">
                        Gestión de Barberos
                      </span>
                    </Link>

                    <Link
                      to="/admin/roles"
                      onClick={() => setOpen(false)}
                      className="group flex items-center px-4 py-2.5 text-sm hover:bg-blue-500/20 transition-all duration-300 rounded-lg mx-2 shadow-sm hover:shadow-blue-500/10"
                    >
                      <svg className="mr-3 h-4 w-4 text-purple-300 group-hover:text-purple-200 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      </svg>
                      <span className="text-white group-hover:text-purple-200 transition-colors duration-300">
                        Gestión de Roles
                      </span>
                    </Link>

                    <Link
                      to="/admin/sales"
                      onClick={() => setOpen(false)}
                      className="group flex items-center px-4 py-2.5 text-sm hover:bg-blue-500/20 transition-all duration-300 rounded-lg mx-2 shadow-sm hover:shadow-blue-500/10"
                    >
                      <svg className="mr-3 h-4 w-4 text-green-300 group-hover:text-green-200 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5L2 21m5-8v8a2 2 0 002 2h10a2 2 0 002-2v-8m-9 2V9a2 2 0 012-2h2a2 2 0 012 2v4.01" />
                      </svg>
                      <span className="text-white group-hover:text-green-200 transition-colors duration-300">
                        Punto de Venta
                      </span>
                    </Link>
                    
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  
  // Hook para preloading en hover
  const { preloadOnHover } = useRoutePreloader();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-blue-500/10 backdrop-blur-md border-b border-blue-500/20 shadow-2xl shadow-blue-500/20' 
        : 'bg-blue-500/5 backdrop-blur-sm border-b border-blue-500/10'
    } ${NAV_HEIGHT}`}>
      {/* Background Effects - Glassmorphism style with blue tint */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-white/[2.5%] to-blue-500/5"></div>
      
      {/* Gradient Line */}
      <div className="absolute top-0 w-full h-0.5 bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 sm:space-x-3 group flex-shrink-0"
            {...preloadOnHover('/')}
          >
            {!logoError ? (
              <img
                src={LOGOS.navbar()}
                alt="The Brothers Barber Shop"
                className="h-10 sm:h-12 w-auto transform group-hover:scale-105 transition-transform duration-300 drop-shadow-lg"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="bg-white/10 backdrop-blur-sm p-2 rounded-xl shadow-xl shadow-blue-500/20 transform group-hover:scale-105 transition-transform duration-300 border border-white/20">
                <span className="text-lg font-bold text-blue-400">
                  TBB
                </span>
              </div>
            )}
            <div className="block">
              <GradientText className="text-base sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-black group-hover:text-blue-300 transition-colors duration-300 drop-shadow-lg tracking-normal leading-tight uppercase" style={{ fontFamily: "'Luckiest Guy', cursive" }}>
                The Brother's
              </GradientText>
              <div className="text-xs text-gray-300 font-serif italic -mt-1 group-hover:text-blue-200 transition-colors duration-300 tracking-wide">
                Barber Shop
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-3 lg:space-x-6">
            {user && (
              <>
                {/* Para barberos: mostrar Ventas */}
                {user.role === 'barber' ? (
                  <Link 
                    to="/admin/sales" 
                    className="relative px-3 lg:px-4 py-2 font-medium text-sm group backdrop-blur-sm bg-blue-500/10 rounded-lg border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/40 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 whitespace-nowrap"
                    {...preloadOnHover('/admin/sales')}
                  >
                    <span className="relative z-10 text-white group-hover:text-blue-300 transition-colors duration-300">
                      <span className="hidden lg:inline">Punto de Venta</span>
                      <span className="lg:hidden">Ventas</span>
                    </span>
                  </Link>
                ) : (
                  /* Para usuarios y admins: mostrar Barberos */
                  <Link 
                    to="/barbers" 
                    className="relative px-3 lg:px-4 py-2 font-medium text-sm group backdrop-blur-sm bg-blue-500/10 rounded-lg border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/40 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 whitespace-nowrap"
                    {...preloadOnHover('/barbers')}
                  >
                    <span className="relative z-10 text-white group-hover:text-blue-300 transition-colors duration-300">
                      Barberos
                    </span>
                  </Link>
                )}
              </>
            )}
            
            {!user ? (
              <div className="flex items-center space-x-2 md:space-x-4">
                <GradientButton
                  as={Link}
                  to="/login"
                  variant="primary"
                  size="sm"
                  className="whitespace-nowrap shadow-md shadow-blue-500/30"
                >
                  <span className="hidden md:inline">Iniciar Sesión</span>
                  <span className="md:hidden">Login</span>
                </GradientButton>
                <Link
                  to="/register"
                  className="relative overflow-hidden text-sm px-4 py-2 rounded-xl group border border-blue-500/20 hover:border-blue-500/50 transition-all duration-300 backdrop-blur-sm bg-blue-500/5 hover:bg-blue-500/10 hover:scale-105 whitespace-nowrap shadow-md shadow-blue-500/30"
                >
                  <span className="relative z-10 text-white group-hover:text-blue-300 transition-colors duration-300 font-medium">
                    Registro
                  </span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-2 md:space-x-4 lg:space-x-6">
                <Link 
                  to="/appointment"
                  className="relative px-3 lg:px-4 py-2 font-medium text-sm group backdrop-blur-sm bg-blue-500/10 rounded-lg border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/40 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 whitespace-nowrap"
                  {...preloadOnHover('/appointment')}
                >
                  <span className="relative z-10 text-white group-hover:text-blue-300 transition-colors duration-300">
                    <span className="hidden lg:inline">Reservas</span>
                    <span className="lg:hidden">Citas</span>
                  </span>
                </Link>
                
                {/* User Menu */}
                <div className="flex items-center space-x-2 md:space-x-4">
                  <DropdownMenu user={user} />
                  <button
                    onClick={handleLogout}
                    className="relative inline-flex items-center justify-center px-3 lg:px-4 py-2 overflow-hidden rounded-xl group bg-red-500/20 border border-red-400/30 hover:bg-red-500/30 transition-all duration-300 hover:scale-105 backdrop-blur-sm shadow-lg hover:shadow-red-500/20 whitespace-nowrap"
                  >
                    <span className="relative text-red-300 group-hover:text-white font-medium text-sm">
                      <span className="hidden lg:inline">Salir</span>
                      <span className="lg:hidden">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </span>
                    </span>
                  </button>
                </div>
              </div>
            )}  
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              className="md:hidden ml-2 inline-flex items-center justify-center p-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-blue-400/50 hover:scale-105 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded="false"
              aria-label="Menú de navegación"
            >
              {!isMobileMenuOpen ? (
                <svg className="block h-5 w-5 text-blue-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-5 w-5 text-purple-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'opacity-100 max-h-screen' : 'opacity-0 max-h-0 pointer-events-none'}`}>
        <div className="relative bg-gray-900/95 backdrop-blur-lg border-t border-white/10">
          {/* Background Effects for Mobile Menu */}
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #1e40af 0px, transparent 2px),
                             radial-gradient(circle at 75% 75%, #dc2626 0px, transparent 1px)`,
            backgroundSize: '30px 30px, 20px 20px'
          }}></div>
          
          {/* Scrollable container */}
          <div className="relative z-10 max-h-[calc(100vh-4rem)] overflow-y-auto px-4 py-3">
            <div className="space-y-3 pb-4">
              {user ? (
                <>
                  {/* Información del usuario */}
                  <div className="px-4 py-3 border-b border-white/10 sticky top-0 bg-gray-900/95 backdrop-blur-lg z-20">
                    <div className="flex items-center space-x-3">
                      {user.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt={user.name || 'Usuario'}
                          className="w-8 h-8 rounded-full object-cover border-2 border-white/30"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-600 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                          {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent">
                          {user.name || 'Usuario'}
                        </p>
                        <p className="text-xs text-white/60">
                          {user.role === 'admin' ? 'Administrador' : user.role === 'barber' ? 'Barbero' : 'Cliente'}
                        </p>
                      </div>
                    </div>
                  </div>

                {/* Navegación principal */}
                <div className="space-y-2">
                  <Link
                    to="/appointment"
                    className="group flex items-center px-4 py-4 rounded-xl text-base font-medium hover:bg-blue-500/20 transition-all duration-200 min-h-[48px] touch-manipulation"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg className="mr-3 h-5 w-5 flex-shrink-0 text-blue-300 group-hover:text-blue-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent group-hover:from-blue-100 group-hover:via-white group-hover:to-red-100">
                      Mis Citas
                    </span>
                  </Link>

                  {/* Para barberos: mostrar Punto de Venta */}
                  {user.role === 'barber' ? (
                    <Link
                      to="/admin/sales"
                      className="group flex items-center px-4 py-4 rounded-xl text-base font-medium hover:bg-green-500/20 transition-all duration-200 min-h-[48px] touch-manipulation"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <svg className="mr-3 h-5 w-5 flex-shrink-0 text-green-300 group-hover:text-green-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5L2 21m5-8v8a2 2 0 002 2h10a2 2 0 002-2v-8m-9 2V9a2 2 0 012-2h2a2 2 0 012 2v4.01" />
                      </svg>
                      <span className="bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent group-hover:from-green-100 group-hover:via-white group-hover:to-green-100">
                        Punto de Venta
                      </span>
                    </Link>
                  ) : (
                    /* Para usuarios y admins: mostrar Barberos */
                    <Link
                      to="/barbers"
                      className="group flex items-center px-4 py-4 rounded-xl text-base font-medium hover:bg-purple-500/20 transition-all duration-200 min-h-[48px] touch-manipulation"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <svg className="mr-3 h-5 w-5 flex-shrink-0 text-purple-300 group-hover:text-purple-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent group-hover:from-purple-100 group-hover:via-white group-hover:to-purple-100">
                        Barberos
                      </span>
                    </Link>
                  )}
                </div>

                {/* Sección de Perfil */}
                <div className="border-t border-white/10 pt-4 mt-4">
                  <div className="px-4 py-2 mb-3">
                    <p className="text-xs font-medium text-white/60 uppercase tracking-wider">
                      Mi Cuenta
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Link
                      to="/profile"
                      className="group flex items-center px-4 py-4 rounded-xl text-base font-medium hover:bg-blue-500/20 transition-all duration-200 min-h-[48px] touch-manipulation"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <svg className="mr-3 h-5 w-5 flex-shrink-0 text-blue-300 group-hover:text-blue-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent group-hover:from-blue-100 group-hover:via-white group-hover:to-red-100">
                        Mi Perfil
                      </span>
                    </Link>

                    <Link
                      to="/profile-edit"
                      className="group flex items-center px-4 py-4 rounded-xl text-base font-medium hover:bg-red-500/20 transition-all duration-200 min-h-[48px] touch-manipulation"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <svg className="mr-3 h-5 w-5 flex-shrink-0 text-red-300 group-hover:text-red-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className="bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent group-hover:from-red-100 group-hover:via-white group-hover:to-blue-100">
                        Editar Perfil
                      </span>
                    </Link>
                  </div>
                </div>

                {/* Sección de Gestión (Barberos y Admins) */}
                {(user.role === 'admin' || user.role === 'barber') && (
                  <div className="border-t border-white/10 pt-3 mt-3">
                    <div className="px-4 py-2">
                      <p className="text-xs font-medium text-white/60 uppercase tracking-wider">
                        {user.role === 'admin' ? 'Administración' : 'Gestión'}
                      </p>
                    </div>

                    {/* Inventario - Para barberos Y admins */}
                    <Link
                      to="/admin/inventory"
                      className="group flex items-center px-4 py-3 rounded-xl text-base font-medium hover:bg-white/10 transition-all duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <svg className="mr-3 h-5 w-5 text-blue-300 group-hover:text-blue-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <span className="bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent group-hover:from-blue-100 group-hover:via-white group-hover:to-red-100">
                        Inventario
                      </span>
                    </Link>

                    {/* Opciones solo para Admins */}
                    {user.role === 'admin' && (
                      <div className="space-y-2">
                        <Link
                          to="/admin/sales"
                          className="group flex items-center px-4 py-4 rounded-xl text-base font-medium hover:bg-green-500/20 transition-all duration-200 min-h-[48px] touch-manipulation"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <svg className="mr-3 h-5 w-5 flex-shrink-0 text-green-300 group-hover:text-green-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5L2 21m5-8v8a2 2 0 002 2h10a2 2 0 002-2v-8m-9 2V9a2 2 0 012-2h2a2 2 0 012 2v4.01" />
                          </svg>
                          <span className="bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent group-hover:from-green-100 group-hover:via-white group-hover:to-green-100">
                            Punto de Venta
                          </span>
                        </Link>
                        
                        <Link
                          to="/admin/services"
                          className="group flex items-center px-4 py-4 rounded-xl text-base font-medium hover:bg-red-500/20 transition-all duration-200 min-h-[48px] touch-manipulation"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <svg className="mr-3 h-5 w-5 flex-shrink-0 text-red-300 group-hover:text-red-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                          </svg>
                          <span className="bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent group-hover:from-red-100 group-hover:via-white group-hover:to-blue-100">
                            Gestión de Servicios
                          </span>
                        </Link>
                        
                        <Link
                          to="/admin/barbers"
                          className="group flex items-center px-4 py-4 rounded-xl text-base font-medium hover:bg-blue-500/20 transition-all duration-200 min-h-[48px] touch-manipulation"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <svg className="mr-3 h-5 w-5 flex-shrink-0 text-blue-300 group-hover:text-blue-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className="bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent group-hover:from-blue-100 group-hover:via-white group-hover:to-red-100">
                            Gestión de Barberos
                          </span>
                        </Link>
                        
                        <Link
                          to="/admin/roles"
                          className="group flex items-center px-4 py-4 rounded-xl text-base font-medium hover:bg-purple-500/20 transition-all duration-200 min-h-[48px] touch-manipulation"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <svg className="mr-3 h-5 w-5 flex-shrink-0 text-purple-300 group-hover:text-purple-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                          </svg>
                          <span className="bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent group-hover:from-purple-100 group-hover:via-white group-hover:to-purple-100">
                            Roles
                          </span>
                        </Link>
                        
                        <Link
                          to="/admin/reports"
                          className="group flex items-center px-4 py-3 rounded-xl text-base font-medium hover:bg-white/10 transition-all duration-200"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <svg className="mr-3 h-5 w-5 text-green-300 group-hover:text-green-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <span className="bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent group-hover:from-green-100 group-hover:via-white group-hover:to-green-100">
                            Reportes Diarios
                          </span>
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* Cerrar Sesión */}
                <div className="border-t border-white/10 pt-4 mt-4">
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="group flex items-center w-full px-4 py-4 rounded-xl text-base font-medium hover:bg-red-500/20 transition-all duration-200 min-h-[48px] touch-manipulation border border-red-500/30"
                  >
                    <svg className="mr-3 h-5 w-5 flex-shrink-0 text-red-300 group-hover:text-red-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="bg-gradient-to-r from-red-200 via-red-100 to-red-200 bg-clip-text text-transparent group-hover:from-white group-hover:via-red-100 group-hover:to-white">
                      Cerrar Sesión
                    </span>
                  </button>
                </div>
              </>
            ) : (
              /* Usuarios no autenticados */
              <div className="px-2 py-3 space-y-3">
                <Link
                  to="/login"
                  className="flex items-center justify-center w-full px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 transition-all duration-200 shadow-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg className="mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span className="bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent font-medium">
                    Iniciar Sesión
                  </span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center justify-center w-full px-6 py-3 rounded-xl border-2 border-white/20 hover:border-red-400/50 hover:bg-white/10 transition-all duration-200 backdrop-blur-sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg className="mr-2 h-5 w-5 text-blue-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span className="bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent font-medium">
                    Registro
                  </span>
                </Link>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
