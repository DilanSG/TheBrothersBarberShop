/**
 * Configuración dinámica de API para detectar automáticamente la URL correcta
 * Funciona tanto en localhost como en red local
 */

// Función para detectar la configuración de API apropiada
const getApiConfig = () => {
  // Si estamos en desarrollo local, usar localhost
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:5000/api/v1';
  }
  
  // Si estamos accediendo por IP de red, usar la misma IP para el backend
  if (window.location.hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    const hostIp = window.location.hostname;
    return `http://${hostIp}:5000/api/v1`;
  }
  
  // Fallback a variable de entorno o localhost
  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
};

// Configuración de la aplicación
export const config = {
  apiUrl: getApiConfig(),
  // Otras configuraciones
  debugMode: import.meta.env.VITE_DEBUG === 'true',
  logLevel: import.meta.env.VITE_LOG_LEVEL || 'warn',
  
  // Información de la configuración actual
  getConnectionInfo: () => ({
    currentHost: window.location.hostname,
    currentPort: window.location.port,
    apiUrl: getApiConfig(),
    isLocalhost: window.location.hostname === 'localhost',
    isNetworkIp: window.location.hostname.match(/^\d+\.\d+\.\d+\.\d+$/) !== null
  })
};

export default config;