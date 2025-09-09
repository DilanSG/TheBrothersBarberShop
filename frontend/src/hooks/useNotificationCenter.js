// hooks/useNotificationCenter.js
import { useState, useCallback, useRef, useEffect } from 'react';

export const useNotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const soundRef = useRef(null);

  // Configurar sonidos de notificación
  useEffect(() => {
    soundRef.current = {
      success: new Audio('/sounds/success.mp3'),
      error: new Audio('/sounds/error.mp3'),
      info: new Audio('/sounds/info.mp3')
    };
  }, []);

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      timestamp: new Date(),
      read: false,
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Reproducir sonido si está habilitado
    if (notification.playSound && soundRef.current?.[notification.type]) {
      soundRef.current[notification.type].play().catch(() => {});
    }

    return id;
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll
  };
};
