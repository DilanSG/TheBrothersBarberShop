// hooks/useOfflineMode.js
import { useState, useEffect } from 'react';

export const useOfflineMode = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState([]);

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

  const queueAction = (action) => {
    if (isOnline) {
      return action();
    } else {
      setPendingActions(prev => [...prev, action]);
      return Promise.reject(new Error('Sin conexión. Acción guardada para cuando se restaure la conexión.'));
    }
  };

  const processPendingActions = async () => {
    if (!isOnline || pendingActions.length === 0) return;

    for (const action of pendingActions) {
      try {
        await action();
      } catch (error) {
        console.error('Error procesando acción pendiente:', error);
      }
    }

    setPendingActions([]);
  };

  useEffect(() => {
    if (isOnline) {
      processPendingActions();
    }
  }, [isOnline]);

  return {
    isOnline,
    queueAction,
    pendingActionsCount: pendingActions.length
  };
};
