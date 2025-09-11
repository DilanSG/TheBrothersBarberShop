import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification debe ser usado dentro de NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now() + Math.random(); // Agregar random para evitar duplicados
    const newNotification = {
      id,
      type: 'info', // 'success', 'error', 'warning', 'info'
      title: '',
      message: '',
      duration: 5000, // 5 segundos por defecto
      autoClose: true,
      ...notification
    };

    // Protección contra duplicados: verificar si existe una notificación similar reciente
    const isDuplicate = notifications.some(existing => 
      existing.message === newNotification.message && 
      existing.type === newNotification.type &&
      (Date.now() - existing.id) < 1000 // Dentro de 1 segundo
    );
    
    if (isDuplicate) {
      console.log('Notificación duplicada ignorada:', newNotification.message);
      return id; // Retorna un ID pero no agrega la notificación
    }

    setNotifications(prev => [...prev, newNotification]);

    // Auto-eliminar después del tiempo especificado
    if (newNotification.autoClose) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Métodos de conveniencia para diferentes tipos
  const showSuccess = (message, title = '') => {
    return addNotification({
      type: 'success',
      title: title || (message.length > 50 ? 'Éxito' : ''),
      message,
      duration: message.length > 100 ? 6000 : 4000
    });
  };

  const showError = (message, title = '') => {
    return addNotification({
      type: 'error',
      title: title || (message.length > 50 ? 'Error' : ''),
      message,
      duration: message.length > 100 ? 10000 : 8000 // Errores duran más tiempo
    });
  };

  const showWarning = (message, title = '') => {
    return addNotification({
      type: 'warning',
      title: title || (message.length > 50 ? 'Advertencia' : ''),
      message,
      duration: message.length > 100 ? 8000 : 6000
    });
  };

  const showInfo = (message, title = '') => {
    return addNotification({
      type: 'info',
      title: title || (message.length > 50 ? 'Información' : ''),
      message,
      duration: message.length > 100 ? 7000 : 5000
    });
  };

  // Método especial para errores de sesión
  const showSessionExpired = () => {
    return addNotification({
      type: 'warning',
      title: 'Sesión Expirada',
      message: 'Tu sesión ha expirado. Serás redirigido al login en unos segundos...',
      duration: 4000,
      autoClose: true
    });
  };

  // Método para errores de conexión
  const showConnectionError = () => {
    return addNotification({
      type: 'error',
      title: 'Error de Conexión',
      message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
      duration: 8000,
      autoClose: true
    });
  };

  // Método para cuando se requiere autenticación
  const showAuthRequired = () => {
    return addNotification({
      type: 'info',
      title: 'Autenticación Requerida',
      message: 'Necesitas iniciar sesión para acceder a esta función. Redirigiendo...',
      duration: 4000,
      autoClose: true
    });
  };

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showSessionExpired,
    showConnectionError,
    showAuthRequired
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
