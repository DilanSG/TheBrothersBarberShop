import { useEffect, useState, useCallback } from 'react';

/**
 * Hook para gestión completa de PWA
 * Maneja Service Worker, instalación, actualizaciones y estado offline
 */
export const usePWA = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [swStatus, setSWStatus] = useState('not-registered');
  const [swUpdateAvailable, setSWUpdateAvailable] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [cacheInfo, setCacheInfo] = useState(null);

  // Registrar Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Registrar tanto en desarrollo como producción para testing
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      setSWStatus('registering');
      console.log('🔧 PWA: Registering Service Worker...');

      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('✅ PWA: Service Worker registered successfully');
      setSWStatus('registered');

      // Verificar actualizaciones
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('🔄 PWA: New Service Worker found, installing...');

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log('🆕 PWA: New content is available, refresh to update');
              setSWUpdateAvailable(true);
            } else {
              console.log('✅ PWA: Content is cached for offline use');
            }
          }
        });
      });

      // Escuchar cambios de estado
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 PWA: Service Worker controller changed, reloading...');
        window.location.reload();
      });

    } catch (error) {
      console.error('❌ PWA: Service Worker registration failed:', error);
      setSWStatus('error');
    }
  };

  // Manejar actualizaciones de SW
  const updateServiceWorker = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration && registration.waiting) {
          // Notificar al SW que queremos activar la actualización
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    }
  }, []);

  // Manejar instalación de PWA
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      console.log('📱 PWA: Install prompt triggered');
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      console.log('✅ PWA: App was installed successfully');
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Verificar si ya está instalado
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Instalar la PWA
  const installPWA = useCallback(async () => {
    if (!installPrompt) return false;

    try {
      console.log('📱 PWA: Showing install prompt...');
      const result = await installPrompt.prompt();
      
      console.log('📱 PWA: Install prompt result:', result.outcome);
      
      if (result.outcome === 'accepted') {
        setIsInstallable(false);
        setInstallPrompt(null);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ PWA: Install failed:', error);
      return false;
    }
  }, [installPrompt]);

  // Manejar cambios de conexión
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 PWA: Connection restored');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('📵 PWA: Connection lost');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Obtener información del caché
  const getCacheInfo = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.active) {
        return new Promise((resolve) => {
          const messageChannel = new MessageChannel();
          messageChannel.port1.onmessage = (event) => {
            if (event.data.type === 'CACHE_INFO') {
              setCacheInfo(event.data.data);
              resolve(event.data.data);
            }
          };

          registration.active.postMessage(
            { type: 'GET_CACHE_INFO' },
            [messageChannel.port2]
          );
        });
      }
    }
    return null;
  }, []);

  // Limpiar caché
  const clearCache = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.active) {
        return new Promise((resolve) => {
          const messageChannel = new MessageChannel();
          messageChannel.port1.onmessage = (event) => {
            if (event.data.type === 'CACHE_CLEARED') {
              console.log('🗑️ PWA: Cache cleared successfully');
              setCacheInfo(null);
              resolve(event.data.success);
            }
          };

          registration.active.postMessage(
            { type: 'CLEAR_CACHE' },
            [messageChannel.port2]
          );
        });
      }
    }
    return false;
  }, []);

  // Verificar si hay contenido cacheado para una URL
  const isCached = useCallback(async (url) => {
    if ('caches' in window) {
      const cache = await caches.open('tbb-v1.0.0');
      const response = await cache.match(url);
      return !!response;
    }
    return false;
  }, []);

  // Precargar contenido para uso offline
  const preloadContent = useCallback(async (urls) => {
    if ('caches' in window) {
      try {
        const cache = await caches.open('tbb-v1.0.0');
        const preloadPromises = urls.map(async (url) => {
          try {
            const response = await fetch(url);
            if (response.ok) {
              await cache.put(url, response);
              // console.log(`📦 PWA: Preloaded content for: ${url}`);
            }
          } catch (error) {
            console.warn(`⚠️ PWA: Failed to preload: ${url}`, error);
          }
        });

        await Promise.all(preloadPromises);
        // console.log('✅ PWA: Content preloading completed');
        return true;
      } catch (error) {
        console.error('❌ PWA: Preloading failed:', error);
        return false;
      }
    }
    return false;
  }, []);

  // Detectar tipo de conexión
  const getConnectionType = useCallback(() => {
    if ('connection' in navigator) {
      return {
        effectiveType: navigator.connection.effectiveType || 'unknown',
        downlink: navigator.connection.downlink || 0,
        rtt: navigator.connection.rtt || 0,
        saveData: navigator.connection.saveData || false
      };
    }
    return null;
  }, []);

  // Compartir contenido (Web Share API)
  const shareContent = useCallback(async (data) => {
    if ('share' in navigator) {
      try {
        await navigator.share(data);
        console.log('📤 PWA: Content shared successfully');
        return true;
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('❌ PWA: Share failed:', error);
        }
        return false;
      }
    }
    return false;
  }, []);

  // Copiar al portapapeles
  const copyToClipboard = useCallback(async (text) => {
    if ('clipboard' in navigator) {
      try {
        await navigator.clipboard.writeText(text);
        console.log('📋 PWA: Copied to clipboard');
        return true;
      } catch (error) {
        console.error('❌ PWA: Clipboard copy failed:', error);
        return false;
      }
    }
    return false;
  }, []);

  return {
    // Estado
    isOnline,
    isInstallable,
    isInstalled,
    swStatus,
    swUpdateAvailable,
    cacheInfo,

    // Acciones principales
    installPWA,
    updateServiceWorker,

    // Gestión de caché
    getCacheInfo,
    clearCache,
    isCached,
    preloadContent,

    // Utilidades
    getConnectionType,
    shareContent,
    copyToClipboard,

    // Información adicional
    isPWACapable: 'serviceWorker' in navigator,
    isStandalone: window.matchMedia && window.matchMedia('(display-mode: standalone)').matches
  };
};

/**
 * Hook especializado para notificaciones push (futuro)
 */
export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('❌ PWA: Notification permission failed:', error);
      return false;
    }
  }, [isSupported]);

  const subscribeToNotifications = useCallback(async (vapidPublicKey) => {
    if (!isSupported || permission !== 'granted') return null;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return null;

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      });

      setSubscription(sub);
      console.log('✅ PWA: Subscribed to push notifications');
      return sub;
    } catch (error) {
      console.error('❌ PWA: Push subscription failed:', error);
      return null;
    }
  }, [isSupported, permission]);

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    subscribeToNotifications
  };
};

export default usePWA;
