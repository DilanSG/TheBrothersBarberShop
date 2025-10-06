import { useState, useEffect } from 'react';

import logger from '../utils/logger';
/**
 * Hook para manejar el modo offline
 * Parte del plan de mejoras PWA - Por implementar
 */
export const useOfflineMode = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineData, setOfflineData] = useState([]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const storeOfflineData = (data) => {
    // TODO: Implementar almacenamiento offline
    // - Guardar en localStorage/IndexedDB
    // - Manejar cola de sincronización
    setOfflineData(prev => [...prev, data]);
  };

  const syncOfflineData = async () => {
    // TODO: Implementar sincronización
    // - Enviar datos pendientes al servidor
    // - Manejar conflictos de datos
    logger.debug('Syncing offline data...');
  };

  const clearOfflineData = () => {
    // TODO: Implementar limpieza
    setOfflineData([]);
  };

  return {
    isOnline,
    offlineData,
    storeOfflineData,
    syncOfflineData,
    clearOfflineData
  };
};

export default useOfflineMode;
