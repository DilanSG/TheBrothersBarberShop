import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../utils/AuthContext';

// Componentes auxiliares
const PageHeader = ({ title, description, icon }) => {
  return (
    <div className="bg-gray-800/50 border-b border-gray-700">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="flex flex-col items-center text-center">
          <div className="bg-gray-700/50 p-4 rounded-2xl mb-6">
            {icon}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{title}</h1>
          <p className="text-gray-400 max-w-2xl">{description}</p>
        </div>
      </div>
    </div>
  );
};

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24">
          <div className="absolute top-0 left-0 right-0 bottom-0">
            <div className="w-full h-full border-4 border-blue-500/20 rounded-full"></div>
            <div className="w-full h-full border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        </div>
        <p className="mt-4 text-lg text-blue-400">Cargando barberos...</p>
      </div>
    </div>
  );
};

const ErrorMessage = ({ message }) => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-red-900/50 border border-red-700 rounded-xl p-8 max-w-lg w-full text-center">
        <div className="bg-red-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-red-400 mb-2">Error al cargar los barberos</h3>
        <p className="text-gray-300">{message}</p>
      </div>
    </div>
  );
};

const BarberCard = ({ barber }) => {
  const { user } = useAuth();

  if (!barber || !barber.user) {
    console.error('Barbero inválido:', barber);
    return null;
  }

  // Solo mostrar botón de reservar a usuarios normales
  const canBook = user && user.role === 'user';
  
  // Determinar el estado del barbero
  const isAvailable = barber.status === 'available';

  return (
    <article className="group bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-gray-700/50 hover:border-blue-500/30 transition-all duration-500 hover:shadow-blue-500/10">
      {/* Header con imagen */}
      <div className="relative h-80">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent z-10"></div>
        {barber.photo?.url || barber.user?.photo?.url ? (
          <img
            src={barber.photo?.url || barber.user?.photo?.url}
            alt={barber.user?.name}
            className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
              <svg className="w-28 h-28 text-gray-600/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
          
          {/* Badges y nombre */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
            {barber.rating?.average > 0 && (
              <div className="bg-blue-600/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold text-white shadow-lg flex items-center gap-1">
                <svg className="w-4 h-4 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>{barber.rating.average.toFixed(1)}</span>
                {barber.rating.count > 0 && (
                  <span className="text-xs opacity-75">({barber.rating.count})</span>
                )}
              </div>
            )}
            {barber.experience > 0 && (
              <div className="bg-gray-700/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium text-gray-200 shadow-lg">
                {barber.experience} años exp.
              </div>
            )}
          </div>

          {/* Estado de disponibilidad */}
          <div className="absolute top-4 left-4 z-20">
            <div className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium text-white shadow-lg backdrop-blur-sm transition-colors duration-300
              ${isAvailable 
                ? 'bg-emerald-500/90 group-hover:bg-emerald-400/90' 
                : 'bg-red-500/90 group-hover:bg-red-400/90'}`}>
              <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-white animate-pulse' : 'bg-white/80'} mr-2`}></div>
              {isAvailable ? 'Disponible' : 'No disponible'}
            </div>
          </div>

          {/* Badges y etiquetas */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
            {/* Rating */}
            {barber.rating?.average > 0 && (
              <div className="bg-blue-600/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold text-white shadow-lg flex items-center gap-1.5 group-hover:bg-blue-500/90 transition-colors duration-300">
                <svg className="w-4 h-4 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>{barber.rating.average.toFixed(1)}</span>
                {barber.rating.count > 0 && (
                  <span className="text-xs text-blue-100/75">({barber.rating.count})</span>
                )}
              </div>
            )}
            {/* Experiencia */}
            {barber.experience > 0 && (
              <div className="bg-gray-700/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium text-gray-200 shadow-lg group-hover:bg-gray-600/90 transition-colors duration-300 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{barber.experience} años exp.</span>
              </div>
            )}
          </div>

          {/* Nombre y especialidad con fondo gradiente */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent z-20">
            <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors duration-300">{barber.user?.name}</h2>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-300 group-hover:text-gray-200 transition-colors duration-300">
                {barber.specialty || 'Barbero Profesional'}
              </p>
            </div>
          </div>
        </div>

        {/* Contenido y botones */}
        <div className="p-6 space-y-4">
          {/* Servicios populares con diseño moderno */}
          {barber.services && barber.services.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-blue-400 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Servicios destacados
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {barber.services.slice(0, 4).map(service => (
                  <div key={service._id} 
                    className="px-4 py-2 bg-gray-700/30 border border-gray-600/30 rounded-xl text-sm
                    hover:bg-gray-600/40 hover:border-gray-500/40 transition-all cursor-default group">
                    <div className="font-medium text-gray-200 mb-1 group-hover:text-white transition-colors">
                      {service.name}
                    </div>
                    <div className="text-blue-400 text-xs group-hover:text-blue-300 transition-colors">
                      ${service.price}
                    </div>
                  </div>
                ))}
              </div>
              {barber.services.length > 4 && (
                <p className="text-sm text-gray-400 text-center">
                  Y {barber.services.length - 4} servicios más...
                </p>
              )}
            </div>
          )}

          {/* Botones de acción con diseño moderno */}
          <div className="flex gap-3 pt-4">
            <Link
              to={`/barbers/${barber._id}`}
              className="flex-1 px-4 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-gray-200 rounded-xl font-medium text-center 
              transition-all duration-300 border border-gray-600/30 hover:border-gray-500/50 backdrop-blur-sm
              flex items-center justify-center gap-2 group hover:shadow-lg hover:-translate-y-0.5"
            >
              <span>Ver Perfil</span>
              <svg className="w-4 h-4 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            {canBook && isAvailable && (
              <Link
                to={`/appointment?barberId=${barber._id}`}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600/90 to-blue-500/90 hover:from-blue-500/90 hover:to-blue-400/90 
                text-white rounded-xl font-medium text-center transition-all duration-300 border border-blue-500/50 
                hover:border-blue-400/50 backdrop-blur-sm flex items-center justify-center gap-2 group
                hover:shadow-lg hover:-translate-y-0.5 hover:shadow-blue-500/20"
              >
                <span>Reservar</span>
                <svg className="w-4 h-4 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </article>
  );
};

const PublicBarbers = () => {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    const fetchBarbers = async () => {
      console.log('Iniciando fetchBarbers');
      try {
        // Primero obtener información de debug
        const debugResponse = await api.get('/debug/check');
        setDebugInfo(debugResponse);
        console.log('Info de debug:', debugResponse);

        // Luego obtener los barberos
        console.log('Haciendo petición a /barbers');
        const response = await api.get('/barbers');
        console.log('Respuesta completa:', response);
        
        if (!response.success) {
          throw new Error('La respuesta no fue exitosa');
        }
        
        if (!Array.isArray(response.data)) {
          console.error('response.data no es un array:', response.data);
          throw new Error('Los datos de barberos no son válidos');
        }
        
        setBarbers(response.data);
        console.log('Barberos establecidos en el estado:', response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error detallado:', error);
        setError(error.message || 'Error al cargar los barberos');
        setLoading(false);
      }
    };

    fetchBarbers();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 p-4">
        <ErrorMessage message={error} />
        {debugInfo && (
          <div className="mt-8 bg-gray-800 p-4 rounded-lg">
            <h3 className="text-white font-bold mb-2">Información de Debug:</h3>
            <pre className="text-gray-300 overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }

  console.log('Renderizando lista de barberos:', barbers);
  const filteredBarbers = [...barbers].sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0));

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <PageHeader
        title="Nuestros Barberos"
        description="Conoce a nuestro equipo de profesionales expertos en el arte del cuidado masculino"
        icon={
          <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        }
      />
      
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredBarbers.map(barber => (
            <BarberCard key={barber._id} barber={barber} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PublicBarbers;
