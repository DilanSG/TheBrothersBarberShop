import React from 'react';
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
			<nav className="bg-white shadow mb-4 sticky top-0 z-10">
				<div className="container flex justify-between items-center py-4">
					<Link to="/" className="text-2xl font-bold text-blue-600">The Brothers Barber Shop</Link>
					<div className="space-x-4 flex items-center">
						<Link to="/" className="btn-secondary">Inicio</Link>
						{user && (
							<Link to="/profile" className="btn-secondary">Perfil</Link>
						)}
						{user && (
							<Link to="/profile-edit" className="btn-secondary">Editar Perfil</Link>
						)}
						{user && user.role === 'barber' && (
							<Link to="/barber-profile-edit" className="btn-secondary">Editar Perfil Barbero</Link>
						)}
						{user && user.role === 'user' && (
							<Link to="/appointment" className="btn-secondary">Reservas</Link>
						)}
						<Link to="/barbers" className="btn-secondary">Barberos</Link>
						{user && (user.role === 'admin' || user.role === 'barber') && (
							<>
								<Link to="/services" className="btn-secondary">Servicios</Link>
								<Link to="/inventory" className="btn-secondary">Inventario</Link>
							</>
						)}
						{user ? (
							<>
								<span className="text-gray-700">Hola, <span className="font-semibold">{user.username || user.email}</span></span>
								<button onClick={handleLogout} className="btn-primary ml-2">Salir</button>
							</>
						) : (
							<>
								<Link to="/login" className="btn-primary">Login</Link>
								<Link to="/register" className="btn-secondary">Registro</Link>
							</>
						)}
					</div>
				</div>
			</nav>
	);
}

export default Navbar;
