import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

function Navbar() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();

	const handleLogout = () => {
		logout();
		navigate('/');
	};

    return (
      <nav className="bg-black shadow-lg mb-4 sticky top-0 z-10 border-b border-gray-800">
        <div className="container mx-auto px-4 flex justify-between items-center py-4">
          <Link to="/" className="text-3xl font-bold text-blue-400 tracking-wide hover:text-blue-300 transition-colors">
            The Brothers Barber Shop
          </Link>
          
          <div className="space-x-4 flex items-center">
            {user ? (
              <>
                {/* Links principales */}
                <Link to="/barbers" className="nav-link">Barberos</Link>
                
                {/* Menú de configuración y saludo */}
                <div className="flex items-center space-x-4 ml-4 border-l border-gray-700 pl-4">
                  <DropdownMenu user={user} />
                  <span className="text-gray-300">
                    Hola, <span className="font-semibold text-blue-400">{user.username || user.email}</span>
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    Salir
                  </button>
                </div>
              </>
            ) : (
              <div className="space-x-4 flex items-center">
                <Link to="/barbers" className="nav-link mr-4">
                  Barberos
                </Link>
                <Link
                  to="/login"
                  className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all transform hover:scale-105"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 rounded-lg border-2 border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white transition-all transform hover:scale-105"
                >
                  Registro
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    );
}

function DropdownMenu({ user }) {
		const [open, setOpen] = useState(false);
		React.useEffect(() => {
			function handleClickOutside(e) {
				if (!e.target.closest('.dropdown-menu')) setOpen(false);
			}
			if (open) document.addEventListener('mousedown', handleClickOutside);
			return () => document.removeEventListener('mousedown', handleClickOutside);
		}, [open]);
		return (
			<div className="relative dropdown-menu">
						<button className="px-3 py-2 rounded-lg bg-gray-900 text-white hover:bg-blue-700 flex items-center gap-2 transition" onClick={() => setOpen(o => !o)} aria-label="Configuraciones">
							<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" />
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33h.09a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51h.09a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v.09a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
							</svg>
						</button>
				{open && (
				<div className="absolute bg-gray-900 border border-gray-700 rounded shadow-lg mt-2 min-w-[180px] z-20">
              <ul className="py-2">
                {/* Opciones básicas para todos los usuarios */}
                <li><Link to="/profile" className="block px-4 py-2 text-white hover:bg-blue-700 rounded transition" onClick={() => setOpen(false)}>Mi Perfil</Link></li>
                <li><Link to="/profile-edit" className="block px-4 py-2 text-white hover:bg-blue-700 rounded transition" onClick={() => setOpen(false)}>Editar Perfil</Link></li>
                
                {/* Sección de Administración/Gestión - Solo visible para admin y barber */}
                {(user.role === 'admin' || user.role === 'barber') && (
                  <>
                    <li className="border-t border-gray-700 mt-2 pt-2">
                      <span className="block px-4 py-1 text-xs text-gray-500">
                        {user.role === 'admin' ? 'Administración' : 'Gestión'}
                      </span>
                    </li>
                    
                    {/* Inventario siempre visible para admin y barber */}
                    <li>
                      <Link 
                        to="/admin/inventory" 
                        className="block px-4 py-2 text-white hover:bg-blue-700 rounded transition" 
                        onClick={() => setOpen(false)}
                      >
                        Control de Inventario
                      </Link>
                    </li>

                    {/* Opciones exclusivas para admin */}
                    {user.role === 'admin' && (
                      <>
                        <li>
                          <Link 
                            to="/admin/services" 
                            className="block px-4 py-2 text-white hover:bg-blue-700 rounded transition" 
                            onClick={() => setOpen(false)}
                          >
                            Gestión de Servicios
                          </Link>
                        </li>
                        <li>
                          <Link 
                            to="/admin/barbers" 
                            className="block px-4 py-2 text-white hover:bg-blue-700 rounded transition" 
                            onClick={() => setOpen(false)}
                          >
                            Gestión de Barberos
                          </Link>
                        </li>
                        <li>
                          <Link 
                            to="/admin/roles" 
                            className="block px-4 py-2 text-white hover:bg-blue-700 rounded transition" 
                            onClick={() => setOpen(false)}
                          >
                            Gestión de Roles
                          </Link>
                        </li>
                      </>
                    )}
                  </>
                )}
						</ul>
					</div>
				)}
			</div>
		);
}

export default Navbar;
