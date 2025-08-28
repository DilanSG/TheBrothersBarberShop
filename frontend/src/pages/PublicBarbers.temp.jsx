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
  const [showAllServices, setShowAllServices] = useState(false);
  const { user } = useAuth();

  return (
    <Link to={`/barbers/${barber._id}`} className="block">
      <article className="group bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-700 hover:border-blue-500/50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl">
        {/* Header con imagen */}
        <div className="relative h-80">
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent z-10"></div>
          {barber.photo?.url || barber.user?.photo?.url ? (
            <img
              src={barber.photo?.url || barber.user?.photo?.url}
              alt={barber.user?.name}
              className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
              <svg className="w-24 h-24 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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

          {/* Nombre y especialidad */}
          <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
            <h2 className="text-2xl font-bold text-white mb-2">{barber.user?.name}</h2>
            {barber.specialties && barber.specialties.length > 0 && (
              <p className="text-gray-300">{barber.specialties.join(' • ')}</p>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
};

const PublicBarbers = () => {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBarbers = async () => {
      try {
        const response = await api.get('/barbers');
        setBarbers(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching barbers:', error);
        setError(error.message || 'Error al cargar los barberos');
        setLoading(false);
      }
    };

    fetchBarbers();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

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
