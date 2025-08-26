import React, { useEffect, useState } from 'react';
import { useAuth } from '../utils/AuthContext';

function Home() {
	const [services, setServices] = useState([]);
	const [loading, setLoading] = useState(true);
	const { user } = useAuth();

	useEffect(() => {
		fetch('http://localhost:5000/api/services')
			.then(res => res.json())
			.then(data => {
				setServices(data.data || []);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, []);

			return (
				<div>
					<h1 className="text-3xl font-bold mb-6 text-center text-blue-700">Bienvenido a The Brothers Barber Shop</h1>
					{user && (
						<div className="mb-4 text-center bg-blue-50 border border-blue-200 rounded p-2">
							Sesión iniciada como <span className="font-semibold">{user.username || user.email}</span> <span className="ml-2 px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">{user.role || 'usuario'}</span>
						</div>
					)}
					<h2 className="text-xl font-semibold mb-4">Servicios disponibles</h2>
					{loading ? (
						<p className="text-center">Cargando servicios...</p>
					) : services.length === 0 ? (
						<p className="text-center text-gray-500">No hay servicios disponibles.</p>
					) : (
						<ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{services.map(service => (
								<li key={service._id} className="card hover:shadow-lg transition">
									<h3 className="font-bold text-lg mb-2 text-blue-700">{service.name}</h3>
									<p className="mb-2">{service.description}</p>
									<p className="text-blue-600 font-semibold mt-2">${service.price}</p>
								</li>
							))}
						</ul>
					)}
				</div>
			);
	}

	export default Home;
