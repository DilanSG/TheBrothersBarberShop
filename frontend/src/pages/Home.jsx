import React, { useEffect, useState } from 'react';
import { useAuth } from '../utils/AuthContext';
import { Link } from 'react-router-dom';

function Home() {
    const [services, setServices] = useState([]);
    const [barbers, setBarbers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        Promise.all([
            fetch('http://localhost:5000/api/services').then(res => res.json()),
            fetch('http://localhost:5000/api/barbers').then(res => res.json())
        ]).then(([servicesData, barbersData]) => {
            setServices(servicesData.data || []);
            setBarbers(barbersData.data || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
            {/* Hero Section */}
            <div className="relative h-screen">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
                    <div className="absolute inset-0 opacity-20 bg-[linear-gradient(30deg,_#000000_12%,_transparent_12.5%,_transparent_87%,_#000000_87.5%,_#000000),linear-gradient(150deg,_#000000_12%,_transparent_12.5%,_transparent_87%,_#000000_87.5%,_#000000),linear-gradient(30deg,_#000000_12%,_transparent_12.5%,_transparent_87%,_#000000_87.5%,_#000000),linear-gradient(150deg,_#000000_12%,_transparent_12.5%,_transparent_87%,_#000000_87.5%,_#000000),linear-gradient(60deg,_#00000077_25%,_transparent_25.5%,_transparent_75%,_#00000077_75%,_#00000077),linear-gradient(60deg,_#00000077_25%,_transparent_25.5%,_transparent_75%,_#00000077_75%,_#00000077)]"></div>
                </div>
                <div className="relative h-full flex flex-col items-center justify-center px-4">
                    {user && (
                        <div className="absolute top-4 right-4 bg-gray-800/80 backdrop-blur border border-gray-700 rounded-lg p-3 shadow">
                            <span className="font-semibold text-blue-400">{user.username || user.name || user.email}</span>
                            {user.role === 'admin' && (
                                <span className="ml-2 px-2 py-1 bg-blue-700 text-white rounded text-xs">{user.role}</span>
                            )}
                        </div>
                    )}
                    <h1 className="text-5xl md:text-7xl font-black mb-6 text-center text-white tracking-wide drop-shadow-lg">
                        The Brothers<br/>
                        <span className="text-blue-400">Barber Shop</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-300 mb-8 text-center max-w-2xl">
                        Donde el estilo se encuentra con la tradición. Experimenta un corte de pelo que define tu personalidad.
                    </p>
                    <Link to="/appointment" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-bold transition-all transform hover:scale-105 hover:shadow-xl">
                        Reserva tu cita ahora
                    </Link>
                </div>
            </div>

            {/* Services Section */}
            <section className="py-20 px-4">
                <div className="container mx-auto">
                    <h2 className="text-4xl font-bold mb-12 text-center">
                        <span className="text-blue-400">Nuestros</span> Servicios
                    </h2>
                    {loading ? (
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
                        </div>
                    ) : services.length === 0 ? (
                        <p className="text-center text-gray-500">No hay servicios disponibles.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {services.slice(0, 6).map(service => (
                                <div key={service._id} 
                                    className="group bg-gray-800/50 backdrop-blur rounded-2xl p-6 hover:bg-gray-800 transition-all duration-300 border border-gray-700/50 hover:border-blue-500/50">
                                    <div className="mb-4">
                                        <span className="text-blue-400 text-4xl">✂️</span>
                                    </div>
                                    <h3 className="font-bold text-2xl mb-3 text-white group-hover:text-blue-400 transition-colors">
                                        {service.name}
                                    </h3>
                                    <p className="text-gray-400 mb-4">{service.description}</p>
                                    <p className="text-blue-400 font-bold text-2xl">${service.price}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Barbers Section */}
            {!loading && barbers.length > 0 && (
                <section className="py-20 px-4 bg-gray-800/50">
                    <div className="container mx-auto">
                        <h2 className="text-4xl font-bold mb-12 text-center">
                            <span className="text-blue-400">Nuestros</span> Barberos
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {barbers.slice(0, 3).map(barber => (
                                <div key={barber._id} className="group relative overflow-hidden rounded-2xl">
                                    <div 
                                        className="w-full h-96 bg-gradient-to-br from-gray-800 to-blue-900 flex items-center justify-center"
                                    >
                                        <span className="text-6xl">💇‍♂️</span>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent">
                                        <div className="absolute bottom-0 left-0 right-0 p-6">
                                            <h3 className="text-2xl font-bold text-white mb-2">{barber.name}</h3>
                                            <p className="text-gray-300">{barber.specialty || 'Barbero Profesional'}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Contact/Location Section */}
            <section className="py-20 px-4">
                <div className="container mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-4xl font-bold mb-6">
                                <span className="text-blue-400">Encuéntranos</span> aquí
                            </h2>
                            <p className="text-gray-400 mb-6">
                                Estamos ubicados en el corazón de la ciudad. Ven y experiméntalo por ti mismo.
                            </p>
                            <div className="space-y-4">
                                <p className="flex items-center text-gray-300">
                                    <span className="mr-3">📍</span> 123 Calle Principal, Ciudad
                                </p>
                                <p className="flex items-center text-gray-300">
                                    <span className="mr-3">📞</span> +1 234 567 890
                                </p>
                                <p className="flex items-center text-gray-300">
                                    <span className="mr-3">⏰</span> Lun - Sab: 9:00 AM - 8:00 PM
                                </p>
                            </div>
                        </div>
                        <div className="h-96 rounded-2xl overflow-hidden">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3024.2219901290355!2d-74.00369368400567!3d40.71277937933185!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25a23e28c1191%3A0x49f75d3281df052a!2s123%20Main%20St%2C%20New%20York%2C%20NY%2010001!5e0!3m2!1sen!2sus!4v1629090817428!5m2!1sen!2sus"
                                className="w-full h-full"
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                            ></iframe>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
	}

	export default Home;
