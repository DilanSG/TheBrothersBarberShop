import { useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { setNotificationContext } from '../services/api';

export const useApiNotifications = () => {
  const notificationContext = useNotification();

  useEffect(() => {
    // Conectar el contexto de notificaciones con el servicio API
    setNotificationContext(notificationContext);

    // Cleanup function
    return () => {
      setNotificationContext(null);
    };
  }, [notificationContext]);

  return notificationContext;
};
