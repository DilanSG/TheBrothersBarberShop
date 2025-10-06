import React, { createContext, useContext, useState, useCallback } from 'react';

import logger from '../utils/logger';
const InventoryContext = createContext();

export const useInventoryRefresh = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventoryRefresh debe ser usado dentro de InventoryProvider');
  }
  return context;
};

export const InventoryProvider = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastSaleTime, setLastSaleTime] = useState(null);

  // Función para notificar que se hizo una venta y el inventario debe recargarse
  const notifySale = useCallback(() => {
    const now = Date.now();
    setLastSaleTime(now);
    setRefreshTrigger(prev => prev + 1);
    logger.debug('🔄 InventoryContext: Notificando venta, trigger:', refreshTrigger + 1);
  }, [refreshTrigger]);

  // Función para obtener el estado de si necesita recargar
  const needsRefresh = useCallback((componentLastRefresh) => {
    if (!lastSaleTime || !componentLastRefresh) return false;
    return lastSaleTime > componentLastRefresh;
  }, [lastSaleTime]);

  // Función para marcar que un componente ya se refrescó
  const markRefreshed = useCallback(() => {
    return Date.now();
  }, []);

  const value = {
    refreshTrigger,
    lastSaleTime,
    notifySale,
    needsRefresh,
    markRefreshed
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};

