import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

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
        className="flex items-center space-x-3 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-blue-400/50 hover:scale-105 border border-white/20"
      >
        <div className="flex items-center space-x-2">
          {user.profilePicture ? (
            <img
              src={user.profilePicture}
              alt={user.name || 'Usuario'}
              className="w-8 h-8 rounded-full object-cover border-2 border-white/30 shadow-lg"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-600 to-blue-600 flex items-center justify-center text-white font-semibold shadow-lg">
              {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <span className="text-sm font-medium bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent">
            {user.name || user.email}
          </span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform duration-200 text-blue-300 ${open ? 'transform rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-900/95 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl py-2 z-50 transform opacity-100 scale-100 transition-all duration-200">
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-xs text-white/60 mb-1">Conectado como</p>
            <p className="text-sm font-medium bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent truncate">
              {user.email}
            </p>
          </div>
          
          <div className="py-2">
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="group flex items-center px-4 py-2.5 text-sm hover:bg-white/10 transition-all duration-200 rounded-lg mx-2"
            >
              <svg className="mr-3 h-4 w-4 text-blue-300 group-hover:text-blue-200 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent group-hover:from-red-100 group-hover:via-white group-hover:to-blue-100">
                Mi Perfil
              </span>
            </Link>

            <Link
              to="/profile-edit"
              onClick={() => setOpen(false)}
              className="group flex items-center px-4 py-2.5 text-sm hover:bg-white/10 transition-all duration-200 rounded-lg mx-2"
            >
              <svg className="mr-3 h-4 w-4 text-red-300 group-hover:text-red-200 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent group-hover:from-red-100 group-hover:via-white group-hover:to-blue-100">
                Editar Perfil
              </span>
            </Link>
          </div>

          {(user.role === 'admin' || user.role === 'barber') && (
            <>
              <div className="py-2 border-t border-white/10 mt-2">
                <div className="px-4 py-2">
                  <p className="text-xs font-medium bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent uppercase tracking-wider">
                    {user.role === 'admin' ? 'Administración' : 'Gestión'}
                  </p>
                </div>

                <Link
                  to="/admin/inventory"
                  onClick={() => setOpen(false)}
                  className="group flex items-center px-4 py-2.5 text-sm hover:bg-white/10 transition-all duration-200 rounded-lg mx-2"
                >
                  <svg className="mr-3 h-4 w-4 text-blue-300 group-hover:text-blue-200 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <span className="bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent group-hover:from-blue-100 group-hover:via-white group-hover:to-red-100">
                    Control de Inventario
                  </span>
                </Link>

                {user.role === 'admin' && (
                  <>
                    <Link
                      to="/admin/sales"
                      onClick={() => setOpen(false)}
                      className="group flex items-center px-4 py-2.5 text-sm hover:bg-white/10 transition-all duration-200 rounded-lg mx-2"
                    >
                      <svg className="mr-3 h-4 w-4 text-green-300 group-hover:text-green-200 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5L2 21m5-8v8a2 2 0 002 2h10a2 2 0 002-2v-8m-9 2V9a2 2 0 012-2h2a2 2 0 012 2v4.01" />
                      </svg>
                      <span className="bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent group-hover:from-green-100 group-hover:via-white group-hover:to-green-100">
                        Punto de Venta
                      </span>
                    </Link>
                    
                    <Link
                      to="/admin/services"
                      onClick={() => setOpen(false)}
                      className="group flex items-center px-4 py-2.5 text-sm hover:bg-white/10 transition-all duration-200 rounded-lg mx-2"
                    >
                      <svg className="mr-3 h-4 w-4 text-red-300 group-hover:text-red-200 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                      <span className="bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent group-hover:from-red-100 group-hover:via-white group-hover:to-blue-100">
                        Gestión de Servicios
                      </span>
                    </Link>

                    <Link
                      to="/admin/barbers"
                      onClick={() => setOpen(false)}
                      className="group flex items-center px-4 py-2.5 text-sm hover:bg-white/10 transition-all duration-200 rounded-lg mx-2"
                    >
                      <svg className="mr-3 h-4 w-4 text-blue-300 group-hover:text-blue-200 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent group-hover:from-blue-100 group-hover:via-white group-hover:to-red-100">
                        Gestión de Barberos
                      </span>
                    </Link>

                    <Link
                      to="/admin/roles"
                      onClick={() => setOpen(false)}
                      className="group flex items-center px-4 py-2.5 text-sm hover:bg-white/10 transition-all duration-200 rounded-lg mx-2"
                    >
                      <svg className="mr-3 h-4 w-4 text-red-300 group-hover:text-red-200 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                      <span className="bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent group-hover:from-red-100 group-hover:via-white group-hover:to-blue-100">
                        Gestión de Roles
                      </span>
                    </Link>

                    <Link
                      to="/admin/reports"
                      onClick={() => setOpen(false)}
                      className="group flex items-center px-4 py-2.5 text-sm hover:bg-white/10 transition-all duration-200 rounded-lg mx-2"
                    >
                      <svg className="mr-3 h-4 w-4 text-green-300 group-hover:text-green-200 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span className="bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent group-hover:from-green-100 group-hover:via-white group-hover:to-blue-100">
                        Reportes Diarios
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
        ? 'bg-gradient-to-r from-gray-900/95 via-blue-900/95 to-gray-800/95 shadow-2xl' 
        : 'bg-gradient-to-r from-gray-900/90 via-blue-900/90 to-gray-800/90'
    } backdrop-blur-lg ${NAV_HEIGHT}`}>
      {/* Background Effects */}
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `radial-gradient(circle at 25% 25%, #1e40af 0px, transparent 2px),
                         radial-gradient(circle at 75% 75%, #dc2626 0px, transparent 1px),
                         radial-gradient(circle at 50% 50%, #ffffff 0px, transparent 0.5px)`,
        backgroundSize: '50px 50px, 30px 30px, 20px 20px'
      }}></div>
      
      {/* Gradient Line */}
      <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-red-600 via-white to-blue-600"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            {!logoError ? (
              <img
                src="/images/logo 5.1.png"
                alt="The Brothers Barber Shop"
                className="h-12 w-auto transform group-hover:scale-105 transition-transform duration-200"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="bg-white/10 backdrop-blur-sm p-2 rounded-full shadow-lg transform group-hover:scale-105 transition-transform duration-200 border border-white/20">
                <span className="text-lg font-bold bg-gradient-to-r from-red-400 via-white to-blue-400 bg-clip-text text-transparent">
                  TBB
                </span>
              </div>
            )}
            <div>
              <span className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent group-hover:from-red-100 group-hover:via-white group-hover:to-blue-100 transition-all duration-300" 
                style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                The Brother's
              </span>
              <div className="text-xs text-white/80 font-serif italic mt-0.5">
                Barber Shop
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {user && (
              <>
                {/* Para barberos: mostrar Ventas */}
                {user.role === 'barber' ? (
                  <Link 
                    to="/admin/sales" 
                    className="relative px-4 py-2 font-medium text-sm group"
                  >
                    <span className="relative z-10 bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent group-hover:from-red-100 group-hover:via-white group-hover:to-blue-100 transition-all duration-300">
                      Punto de Venta
                    </span>
                    <div className="absolute inset-0 h-full w-full transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-200 bg-gradient-to-r from-red-500/20 to-blue-500/20 rounded-lg"></div>
                    <div className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-red-600 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-200"></div>
                  </Link>
                ) : (
                  /* Para usuarios y admins: mostrar Barberos */
                  <Link 
                    to="/barbers" 
                    className="relative px-4 py-2 font-medium text-sm group"
                  >
                    <span className="relative z-10 bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent group-hover:from-red-100 group-hover:via-white group-hover:to-blue-100 transition-all duration-300">
                      Barberos
                    </span>
                    <div className="absolute inset-0 h-full w-full transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-200 bg-gradient-to-r from-red-500/20 to-blue-500/20 rounded-lg"></div>
                    <div className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-red-600 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-200"></div>
                  </Link>
                )}
              </>
            )}
            
            {!user ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="relative overflow-hidden px-6 py-2.5 rounded-xl group bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 shadow-lg hover:shadow-xl hover:shadow-red-500/25 transition-all duration-300 hover:scale-105"
                >
                  <span className="relative z-10 bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent font-medium">
                    Iniciar Sesión
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
                <Link
                  to="/register"
                  className="relative overflow-hidden px-6 py-2.5 rounded-xl group border-2 border-white/20 hover:border-red-400/50 transition-all duration-300 backdrop-blur-sm bg-white/5 hover:bg-white/10 hover:scale-105"
                >
                  <span className="relative z-10 bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent group-hover:from-red-100 group-hover:via-white group-hover:to-blue-100 transition-all duration-300 font-medium">
                    Registro
                  </span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-6">
                <Link 
                  to="/appointment"
                  className="relative px-4 py-2 font-medium text-sm group"
                >
                  <span className="relative z-10 bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent group-hover:from-red-100 group-hover:via-white group-hover:to-blue-100 transition-all duration-300">
                    Reservas
                  </span>
                  <div className="absolute inset-0 h-full w-full transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-200 bg-gradient-to-r from-blue-500/20 to-red-500/20 rounded-lg"></div>
                </Link>
                
                {/* User Menu */}
                <div className="flex items-center space-x-4">
                  <DropdownMenu user={user} />
                  <button
                    onClick={handleLogout}
                    className="relative inline-flex items-center justify-center px-4 py-2.5 overflow-hidden rounded-xl group bg-red-500/20 border border-red-400/30 hover:bg-red-500/30 transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                  >
                    <span className="relative bg-gradient-to-r from-red-200 via-red-100 to-red-200 bg-clip-text text-transparent group-hover:from-white group-hover:via-red-100 group-hover:to-white font-medium">
                      Salir
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              className="md:hidden ml-2 inline-flex items-center justify-center p-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-blue-400/50 hover:scale-105"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded="false"
            >
              <span className="sr-only">Abrir menú principal</span>
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
        <div className="px-4 pt-2 pb-3 space-y-2 bg-gray-900/95 backdrop-blur-lg border-t border-white/10 relative">
          {/* Background Effects for Mobile Menu */}
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #1e40af 0px, transparent 2px),
                             radial-gradient(circle at 75% 75%, #dc2626 0px, transparent 1px)`,
            backgroundSize: '30px 30px, 20px 20px'
          }}></div>
          
          <div className="relative z-10 space-y-2">
            {user && (
              <>
                {/* Para barberos: mostrar Ventas */}
                {user.role === 'barber' ? (
                  <Link
                    to="/admin/sales"
                    className="block px-4 py-3 rounded-xl text-base font-medium bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent hover:bg-white/10 transition-all duration-200"
                  >
                    Punto de Venta
                  </Link>
                ) : (
                  /* Para usuarios y admins: mostrar Barberos */
                  <Link
                    to="/barbers"
                    className="block px-4 py-3 rounded-xl text-base font-medium bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent hover:bg-white/10 transition-all duration-200"
                  >
                    Barberos
                  </Link>
                )}
              </>
            )}
            
            {user ? (
              <>
                <Link
                  to="/appointment"
                  className="block px-4 py-3 rounded-xl text-base font-medium bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent hover:bg-white/10 transition-all duration-200"
                >
                  Citas
                </Link>
                <Link
                  to="/profile"
                  className="block px-4 py-3 rounded-xl text-base font-medium bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent hover:bg-white/10 transition-all duration-200"
                >
                  Mi Perfil
                </Link>
                {user.role === 'admin' && (
                  <>
                    <Link
                      to="/admin/services"
                      className="block px-4 py-3 rounded-xl text-base font-medium bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent hover:bg-white/10 transition-all duration-200"
                    >
                      Gestión de Servicios
                    </Link>
                    <Link
                      to="/admin/roles"
                      className="block px-4 py-3 rounded-xl text-base font-medium bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent hover:bg-white/10 transition-all duration-200"
                    >
                      Gestión de Roles
                    </Link>
                    <Link
                      to="/admin/reports"
                      className="block px-4 py-3 rounded-xl text-base font-medium bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent hover:bg-white/10 transition-all duration-200"
                    >
                      Reportes Diarios
                    </Link>
                  </>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-3 rounded-xl text-base font-medium bg-gradient-to-r from-red-200 via-red-100 to-red-200 bg-clip-text text-transparent hover:bg-red-500/20 transition-all duration-200"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <div className="px-2 py-3 space-y-3">
                <Link
                  to="/login"
                  className="block w-full text-center px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 transition-all duration-200 shadow-lg"
                >
                  <span className="bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent font-medium">
                    Iniciar Sesión
                  </span>
                </Link>
                <Link
                  to="/register"
                  className="block w-full text-center px-6 py-3 rounded-xl border-2 border-white/20 hover:border-red-400/50 hover:bg-white/10 transition-all duration-200 backdrop-blur-sm"
                >
                  <span className="bg-gradient-to-r from-white via-blue-100 to-red-100 bg-clip-text text-transparent font-medium">
                    Registro
                  </span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
