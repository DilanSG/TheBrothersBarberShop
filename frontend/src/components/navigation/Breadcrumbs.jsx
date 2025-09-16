import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Componente de breadcrumbs (migas de pan) para navegación
 * Muestra la ruta actual del usuario de forma jerárquica
 */
const Breadcrumbs = ({ className = '' }) => {
  const location = useLocation();
  
  // Mapeo de rutas a etiquetas legibles
  const routeMap = {
    '': 'Inicio',
    'services': 'Servicios',
    'barbers': 'Barberos',
    'profile': 'Mi Perfil',
    'profile-edit': 'Editar Perfil',
    'dashboard': 'Dashboard',
    'appointment': 'Citas',
    'new': 'Nueva',
    'edit': 'Editar',
    'view': 'Ver Detalle',
    'admin': 'Administración',
    'inventory': 'Inventario',
    'sales': 'Ventas',
    'roles': 'Roles',
    'reports': 'Reportes',
    'login': 'Iniciar Sesión',
    'register': 'Registro'
  };

  // Obtener segmentos de la ruta
  const pathnames = location.pathname.split('/').filter(x => x);
  
  // Si estamos en home, no mostrar breadcrumbs
  if (pathnames.length === 0) {
    return null;
  }

  // Función para obtener el icono según la ruta
  const getRouteIcon = (route) => {
    const iconMap = {
      '': Home,
      'services': null,
      'barbers': null,
      'profile': null,
      'appointment': null,
      'admin': null
    };
    
    return iconMap[route];
  };

  // Construir la estructura de breadcrumbs
  const breadcrumbs = [
    // Siempre incluir Home
    {
      label: 'Inicio',
      path: '/',
      icon: Home
    }
  ];

  // Agregar segmentos de la ruta
  let accumulatedPath = '';
  pathnames.forEach((pathname, index) => {
    accumulatedPath += `/${pathname}`;
    
    // Saltar IDs (rutas dinámicas como /barbers/123)
    const isId = /^[a-f\d]{24}$/i.test(pathname) || // MongoDB ObjectId
                 /^\d+$/.test(pathname) || // Números
                 pathname.length > 15; // IDs muy largos
    
    if (!isId) {
      const label = routeMap[pathname] || pathname.charAt(0).toUpperCase() + pathname.slice(1);
      const isLast = index === pathnames.length - 1;
      
      breadcrumbs.push({
        label,
        path: accumulatedPath,
        isLast
      });
    }
  });

  // Si solo tenemos Home + 1 más, no mostrar breadcrumbs (muy simple)
  if (breadcrumbs.length <= 2) {
    return null;
  }

  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`}>
      {breadcrumbs.map((crumb, index) => {
        const Icon = crumb.icon;
        const isLast = index === breadcrumbs.length - 1;
        
        return (
          <div key={crumb.path} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="w-3 h-3 text-gray-500 mx-1 flex-shrink-0" />
            )}
            
            {isLast ? (
              <span className="text-blue-300 font-medium flex items-center gap-1.5">
                {Icon && <Icon className="w-3 h-3" />}
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.path}
                className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-1.5 hover:underline"
              >
                {Icon && <Icon className="w-3 h-3" />}
                {crumb.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
