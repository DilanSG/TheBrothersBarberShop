import React, { useState, useEffect } from 'react';
import errorLogger from '../utils/errorLogger';

/**
 * Error Boundary para React
 * Captura y maneja errores en componentes React
 */
export const ErrorBoundary = ({ children, componentName = 'Unknown' }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (error, errorInfo) => {
      errorLogger.ui.componentError(componentName, error);
      setHasError(true);
    };

    return () => {
      // Cleanup si es necesario
    };
  }, [componentName]);

  if (hasError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-semibold">Algo salió mal</h3>
        <p className="text-red-600 text-sm mt-1">
          Ha ocurrido un error en el componente {componentName}. 
          El equipo técnico ha sido notificado.
        </p>
        <button 
          onClick={() => setHasError(false)}
          className="mt-2 text-red-800 underline text-sm"
        >
          Intentar de nuevo
        </button>
      </div>
    );
  }

  return children;
};

export default ErrorBoundary;
