const API_URL = import.meta.env.VITE_API_URL;
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Variable para almacenar el contexto de notificaciones
let notificationContext = null;

// Función para establecer el contexto de notificaciones
export const setNotificationContext = (context) => {
  notificationContext = context;
};

// Helper para operaciones de caché que verifica disponibilidad
const safeCache = {
  async open(name) {
    if (typeof caches === 'undefined') return null;
    try {
      return await caches.open(name);
    } catch (error) {
      console.warn('Error al abrir caché:', error);
      return null;
    }
  },

  async delete(request) {
    if (typeof caches === 'undefined') return false;
    try {
      return await caches.delete(request);
    } catch (error) {
      console.warn('Error al eliminar caché:', error);
      return false;
    }
  },

  async keys() {
    if (typeof caches === 'undefined') return [];
    try {
      return await caches.keys();
    } catch (error) {
      console.warn('Error al obtener keys de caché:', error);
      return [];
    }
  }
};

// Cache helper
export const cacheHelper = {
  async get(key) {
    const cache = await safeCache.open('api-cache');
    if (!cache) return null;
    
    try {
      const response = await cache.match(key);
      if (response) {
        const data = await response.json();
        // Verificar si el caché ha expirado
        if (data.expiry && data.expiry > Date.now()) {
          return data.value;
        }
        // Si expiró, eliminar del caché
        await cache.delete(key);
      }
    } catch (error) {
      console.warn('Error al obtener del caché:', error);
    }
    return null;
  },

  async set(key, value, ttl = 300000) { // 5 minutos por defecto
    const cache = await safeCache.open('api-cache');
    if (!cache) return;
    
    try {
      const data = {
        value,
        expiry: Date.now() + ttl,
        timestamp: Date.now()
      };
      const response = new Response(JSON.stringify(data));
      await cache.put(key, response);
    } catch (error) {
      console.warn('Error al guardar en caché:', error);
    }
  },

  async clear() {
    try {
      const keys = await safeCache.keys();
      await Promise.all(keys.map(key => safeCache.delete(key)));
    } catch (error) {
      console.warn('Error al limpiar caché:', error);
    }
  }
};

const fetchWithRetry = async (url, options, retries = 3, backoff = 1000) => {
  // Añadir timeout de 30 segundos para subidas de archivos y snapshots
  const isUpload = options.headers && options.headers['Content-Type'] === 'multipart/form-data';
  const isSnapshot = url.includes('/inventory-snapshots');
  const timeoutMs = isUpload || isSnapshot ? 30000 : 10000; // 30s para uploads/snapshots, 10s para otros
  
  const controller = new AbortController();
  let timeoutId;
  
  try {
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    // Añadir headers de monitoreo
    options.headers = {
      ...options.headers,
      'X-Client-Version': APP_VERSION,
      'X-Request-ID': Math.random().toString(36).substring(7)
    };
    
    options.signal = controller.signal;

    const startTime = performance.now();
    const response = await fetch(url, options);
    const endTime = performance.now();
    
    clearTimeout(timeoutId);

    // Comentado: Las métricas de rendimiento están causando errores
    // try {
    //   await fetch(`${API_URL}/monitoring/metrics`, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       endpoint: url,
    //       responseTime: endTime - startTime,
    //       status: response.status,
    //       success: response.ok
    //     })
    //   });
    // } catch (e) {
    //   console.warn('Error enviando métricas:', e);
    // }
    
    if (response.status === 429 && retries > 0) {
      await wait(backoff);
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }

    if (!response.ok) {
      // Primero intentar obtener el cuerpo de la respuesta para el manejo de errores
      let errorBody;
      try {
        errorBody = await response.text();
        // Intentar parsear como JSON si es posible
        try {
          errorBody = JSON.parse(errorBody);
        } catch (e) {
          // Si no es JSON válido, mantener como texto
        }
      } catch (e) {
        errorBody = 'Error desconocido';
      }

      // Crear error con detalles
      const error = new Error(
        `HTTP error! status: ${response.status}\nEndpoint: ${url}\nDetails: ${typeof errorBody === 'object' ? JSON.stringify(errorBody) : errorBody}`
      );
      error.response = response;
      error.data = errorBody;
      throw error;
    }

    return response;
  } catch (error) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Si es timeout, mostrar mensaje específico
    if (error.name === 'AbortError') {
      const timeoutError = new Error(`La operación tardó demasiado (más de ${timeoutMs/1000}s). Esto puede deberse a problemas de conectividad.`);
      throw timeoutError;
    }
    
    if (retries > 0 && (error.name === 'TypeError' || error.message.includes('failed to fetch'))) {
      await wait(backoff);
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw error;
  }
};

export const handleSessionExpired = () => {
  console.log('🕐 Sesión expirada - iniciando proceso de limpieza');
  
  // Mostrar notificación de sesión expirada
  if (notificationContext) {
    console.log('📢 Mostrando notificación de sesión expirada');
    notificationContext.showSessionExpired();
  } else {
    console.warn('⚠️ NotificationContext no disponible para mostrar sesión expirada');
    // Fallback: usar alert si no hay contexto
    alert('Tu sesión ha expirado. Serás redirigido al login.');
  }
  
  // Limpiar datos locales
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  cacheHelper.clear();
  
  // Redirigir después de un breve delay
  setTimeout(() => {
    console.log('🔄 Redirigiendo a login...');
    window.location.href = '/login';
  }, 2000);
};

// Nueva función para manejar errores de autenticación
const handleAuthError = (response, data, endpoint = '') => {
  console.log('🔐 Manejando error de autenticación:', {
    status: response.status,
    message: data.message,
    endpoint,
    data: data,
    notificationContext: !!notificationContext
  });
  
  if (response.status === 401) {
    const message = data.message || '';
    
    // No mostrar notificaciones durante el proceso de login o registro
    if (endpoint.includes('/auth/login') || endpoint.includes('/auth/register')) {
      // Dejar que el AuthService y los componentes manejen estos errores
      throw new Error(message || 'Error de autenticación');
    }
    
    // Evitar bucles de redirección si ya estamos en login
    if (window.location.pathname === '/login' || window.location.pathname === '/register') {
      throw new Error(message || 'Error de autenticación');
    }
    
    if (message.toLowerCase().includes('expirado') || 
        message.toLowerCase().includes('expired') ||
        message.toLowerCase().includes('jwt')) {
      // Token expirado
      console.log('🕐 Token expirado detectado, llamando handleSessionExpired');
      handleSessionExpired();
      throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    } else if (message.toLowerCase().includes('no proporcionado') || 
               message.toLowerCase().includes('token requerido') ||
               message.toLowerCase().includes('acceso denegado') ||
               message.toLowerCase().includes('unauthorized')) {
      // Token faltante o acceso denegado
      console.log('🚫 Acceso no autorizado, mostrando notificación');
      if (notificationContext) {
        notificationContext.showError(
          'Tu sesión ha expirado o no tienes los permisos necesarios. Redirigiendo al login...',
          'Sesión Expirada'
        );
      }
      // Limpiar datos locales
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirigir a login
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      throw new Error('Se requiere autenticación. Redirigiendo al inicio de sesión...');
    } else {
      // Otros errores de autenticación
      console.log('❌ Otro error de autenticación');
      if (notificationContext) {
        notificationContext.showError(
          'Error de autenticación. Por favor, inicia sesión nuevamente.',
          'Acceso Denegado'
        );
      }
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      throw new Error('Error de autenticación. Redirigiendo al inicio de sesión...');
    }
  }
};

const handleConnectionError = (error) => {
  if (notificationContext) {
    if (error.message.includes('failed to fetch') || error.name === 'TypeError') {
      notificationContext.showConnectionError();
    } else if (error.message.includes('429')) {
      notificationContext.showWarning(
        'El servidor está ocupado. Por favor, espera un momento y vuelve a intentarlo.',
        'Servidor Ocupado'
      );
    } else if (error.message.includes('HTTP error! status: 400')) {
      // Los errores 400 (validación) ya son manejados específicamente en cada método
      return;
    } else if (error.message.includes('HTTP error! status: 401')) {
      // Ya manejado por handleAuthError, no mostrar duplicado
      return;
    } else if (error.message.includes('HTTP error! status: 403')) {
      notificationContext.showError(
        'No tienes permisos para realizar esta acción.',
        'Acceso Prohibido'
      );
    } else if (error.message.includes('HTTP error! status: 404')) {
      notificationContext.showError(
        'El recurso solicitado no fue encontrado.',
        'No Encontrado'
      );
    } else if (error.message.includes('HTTP error! status: 500')) {
      notificationContext.showError(
        'Error interno del servidor. Por favor, inténtalo más tarde.',
        'Error del Servidor'
      );
    } else {
      // Solo mostrar para errores genéricos que no tienen un status HTTP específico
      if (!error.message.includes('HTTP error! status:')) {
        notificationContext.showError(error.message, 'Error de Servidor');
      }
    }
  }
};

// Función auxiliar para obtener token válido
const getValidToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    // Decodificar sin verificar la firma para revisar expiración
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    
    if (payload.exp && payload.exp < now) {
      console.log('🚨 Token expirado, removiendo del localStorage');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
    
    return token;
  } catch (error) {
    console.error('❌ Error al validar token:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return null;
  }
};

export const api = {
  get: async (endpoint, useCache = true, cacheTTL = 300000) => {
    try {
      const token = getValidToken();
      const url = `${API_URL}${endpoint}`;
      
      // Intentar obtener del caché si está permitido
      if (useCache) {
        const cachedData = await cacheHelper.get(url);
        if (cachedData) return cachedData;
      }

      const response = await fetchWithRetry(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      const data = await response.json();

      // Manejar errores de autenticación
      handleAuthError(response, data, endpoint);
      
      // Guardar en caché si está permitido
      if (useCache && response.ok) {
        await cacheHelper.set(url, data, cacheTTL);
      }
      
      return data;
    } catch (error) {
      console.log('🚨 Error en api.get:', error);
      
      // Si el error tiene información de respuesta, intentar manejar errores de auth
      if (error.response && error.data) {
        try {
          handleAuthError(error.response, error.data, endpoint);
        } catch (authError) {
          // Re-lanzar el error de auth para que se maneje correctamente
          throw authError;
        }
      }
      
      // Manejar otros tipos de errores
      handleConnectionError(error);
      throw error;
    }
  },

  post: async (endpoint, data) => {
    try {
      const token = getValidToken();
      const response = await fetchWithRetry(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      // Manejar errores de autenticación
      handleAuthError(response, responseData, endpoint);

      // Invalidar caché relacionado si la operación fue exitosa
      if (response.ok) {
        try {
          const cachePattern = new RegExp(endpoint.split('/')[1]);
          const cache = await safeCache.open('api-cache');
          if (cache) {
            const keys = await cache.keys();
            for (const key of keys) {
              if (cachePattern.test(key.url)) {
                await cache.delete(key);
              }
            }
          }
        } catch (cacheError) {
          console.warn('Error al invalidar caché:', cacheError);
        }
      }

      return responseData;
    } catch (error) {
      console.log('🚨 Error en api.post:', error);
      
      // Si el error tiene información de respuesta HTTP, manejar específicamente
      if (error.response && error.data) {
        try {
          handleAuthError(error.response, error.data, endpoint);
        } catch (authError) {
          throw authError;
        }
        
        // Si llegamos aquí, no es un error de autenticación
        // Para errores 400 (validación), mostrar mensaje específico sin duplicar
        if (error.response.status === 400 && notificationContext) {
          const errorData = error.data;
          let message = 'Error de validación';
          
          // Si hay detalles de validación específicos, mostrarlos
          if (errorData?.details && Array.isArray(errorData.details)) {
            const fieldErrors = errorData.details.map(detail => 
              `${detail.field}: ${detail.message}`
            ).join(', ');
            message = `Error de validación: ${fieldErrors}`;
          } else if (errorData?.message) {
            message = errorData.message;
          }
          
          notificationContext.showError(message, 'Error de Validación');
          throw new Error(message);
        }
      }
      
      // Para otros tipos de errores, usar el manejador general
      handleConnectionError(error);
      throw error;
    }
  },

  put: async (endpoint, data, customOptions = {}) => {
    try {
      const token = getValidToken();
      
      // Detectar si data es FormData
      const isFormData = data instanceof FormData;
      console.log(`PUT ${endpoint} - isFormData: ${isFormData}`);
      
      const fetchOptions = {
        method: 'PUT',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...customOptions.headers,
        },
      };
      
      // Solo agregar Content-Type si no es FormData (el navegador lo hace automáticamente para FormData)
      if (!isFormData) {
        fetchOptions.headers['Content-Type'] = 'application/json';
        fetchOptions.body = data ? JSON.stringify(data) : undefined;
      } else {
        fetchOptions.body = data;
      }

      console.log('Enviando request con headers:', fetchOptions.headers);
      const response = await fetchWithRetry(`${API_URL}${endpoint}`, fetchOptions);
      console.log('Response status:', response.status, 'ok:', response.ok);

      const responseData = await response.json();
      console.log('Response data:', responseData);

      // Manejar errores de autenticación
      handleAuthError(response, responseData, endpoint);

      // Invalidar caché relacionado
      if (response.ok) {
        try {
          const cachePattern = new RegExp(endpoint.split('/')[1]);
          const cache = await safeCache.open('api-cache');
          if (cache) {
            const keys = await cache.keys();
            for (const key of keys) {
              if (cachePattern.test(key.url)) {
                await cache.delete(key);
              }
            }
          }
        } catch (cacheError) {
          console.warn('Error al invalidar caché:', cacheError);
        }
      }

      return responseData;
    } catch (error) {
      console.log('🚨 Error en api.put:', error);
      
      // Si el error tiene información de respuesta HTTP, manejar específicamente
      if (error.response && error.data) {
        try {
          handleAuthError(error.response, error.data, endpoint);
        } catch (authError) {
          throw authError;
        }
        
        // Si llegamos aquí, no es un error de autenticación
        // Para errores 400 (validación), mostrar mensaje específico sin duplicar
        if (error.response.status === 400 && notificationContext) {
          const errorData = error.data;
          let message = 'Error de validación';
          
          // Si hay detalles de validación específicos, mostrarlos
          if (errorData?.details && Array.isArray(errorData.details)) {
            const fieldErrors = errorData.details.map(detail => 
              `${detail.field}: ${detail.message}`
            ).join(', ');
            message = `Error de validación: ${fieldErrors}`;
          } else if (errorData?.message) {
            message = errorData.message;
          }
          
          notificationContext.showError(message, 'Error de Validación');
          throw new Error(message);
        }
      }
      
      // Para otros tipos de errores, usar el manejador general
      handleConnectionError(error);
      throw error;
    }
  },

  delete: async (endpoint) => {
    try {
      const token = getValidToken();
      const response = await fetchWithRetry(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      const responseData = await response.json();

      // Manejar errores de autenticación
      handleAuthError(response, responseData, endpoint);

      // Invalidar caché relacionado
      if (response.ok) {
        try {
          const cachePattern = new RegExp(endpoint.split('/')[1]);
          const cache = await safeCache.open('api-cache');
          if (cache) {
            const keys = await cache.keys();
            for (const key of keys) {
              if (cachePattern.test(key.url)) {
                await cache.delete(key);
              }
            }
          }
        } catch (cacheError) {
          console.warn('Error al invalidar caché:', cacheError);
        }
      }

      return responseData;
    } catch (error) {
      console.log('🚨 Error en api.delete:', error);
      
      // Si el error tiene información de respuesta HTTP, manejar específicamente
      if (error.response && error.data) {
        try {
          handleAuthError(error.response, error.data, endpoint);
        } catch (authError) {
          throw authError;
        }
        
        // Si llegamos aquí, no es un error de autenticación
        // Para errores 400 (validación), mostrar mensaje específico sin duplicar
        if (error.response.status === 400 && notificationContext) {
          const errorData = error.data;
          let message = 'Error de validación';
          
          // Si hay detalles de validación específicos, mostrarlos
          if (errorData?.details && Array.isArray(errorData.details)) {
            const fieldErrors = errorData.details.map(detail => 
              `${detail.field}: ${detail.message}`
            ).join(', ');
            message = `Error de validación: ${fieldErrors}`;
          } else if (errorData?.message) {
            message = errorData.message;
          }
          
          notificationContext.showError(message, 'Error de Validación');
          throw new Error(message);
        }
      }
      
      // Para otros tipos de errores, usar el manejador general
      handleConnectionError(error);
      throw error;
    }
  },

  patch: async (endpoint, data) => {
    try {
      const token = getValidToken();
      const response = await fetchWithRetry(`${API_URL}${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      // Manejar errores de autenticación
      handleAuthError(response, responseData, endpoint);

      // Invalidar caché relacionado
      if (response.ok) {
        try {
          const cachePattern = new RegExp(endpoint.split('/')[1]);
          const cache = await safeCache.open('api-cache');
          if (cache) {
            const keys = await cache.keys();
            for (const key of keys) {
              if (cachePattern.test(key.url)) {
                await cache.delete(key);
              }
            }
          }
        } catch (cacheError) {
          console.warn('Error al invalidar caché:', cacheError);
        }
      }

      return responseData;
    } catch (error) {
      console.log('🚨 Error en api.patch:', error);
      
      // Si el error tiene información de respuesta HTTP, manejar específicamente
      if (error.response && error.data) {
        try {
          handleAuthError(error.response, error.data, endpoint);
        } catch (authError) {
          throw authError;
        }
        
        // Si llegamos aquí, no es un error de autenticación
        // Para errores 400 (validación), mostrar mensaje específico sin duplicar
        if (error.response.status === 400 && notificationContext) {
          const errorData = error.data;
          let message = 'Error de validación';
          
          // Si hay detalles de validación específicos, mostrarlos
          if (errorData?.details && Array.isArray(errorData.details)) {
            const fieldErrors = errorData.details.map(detail => 
              `${detail.field}: ${detail.message}`
            ).join(', ');
            message = `Error de validación: ${fieldErrors}`;
          } else if (errorData?.message) {
            message = errorData.message;
          }
          
          notificationContext.showError(message, 'Error de Validación');
          throw new Error(message);
        }
      }
      
      // Para otros tipos de errores, usar el manejador general
      handleConnectionError(error);
      throw error;
    }
  },

  // Método específico para subir archivos
  upload: async (endpoint, formData) => {
    try {
      const token = getValidToken();
      const response = await fetchWithRetry(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          // No establecer Content-Type - el navegador lo hará automáticamente con boundary
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: formData, // Enviar FormData directamente
      });

      const responseData = await response.json();

      // Manejar errores de autenticación
      handleAuthError(response, responseData, endpoint);

      // Invalidar caché relacionado
      if (response.ok) {
        try {
          const cachePattern = new RegExp(endpoint.split('/')[1]);
          const cache = await safeCache.open('api-cache');
          if (cache) {
            const keys = await cache.keys();
            for (const key of keys) {
              if (cachePattern.test(key.url)) {
                await cache.delete(key);
              }
            }
          }
        } catch (cacheError) {
          console.warn('Error al invalidar caché:', cacheError);
        }
      }

      return responseData;
    } catch (error) {
      console.log('🚨 Error en api.upload:', error);
      
      // Si el error tiene información de respuesta HTTP, manejar específicamente
      if (error.response && error.data) {
        try {
          handleAuthError(error.response, error.data, endpoint);
        } catch (authError) {
          throw authError;
        }
        
        // Si llegamos aquí, no es un error de autenticación
        // Para errores 400 (validación), mostrar mensaje específico sin duplicar
        if (error.response.status === 400 && notificationContext) {
          const errorData = error.data;
          let message = 'Error de validación';
          
          // Si hay detalles de validación específicos, mostrarlos
          if (errorData?.details && Array.isArray(errorData.details)) {
            const fieldErrors = errorData.details.map(detail => 
              `${detail.field}: ${detail.message}`
            ).join(', ');
            message = `Error de validación: ${fieldErrors}`;
          } else if (errorData?.message) {
            message = errorData.message;
          }
          
          notificationContext.showError(message, 'Error de Validación');
          throw new Error(message);
        }
      }
      
      // Para otros tipos de errores, usar el manejador general
      handleConnectionError(error);
      throw error;
    }
  },
};

// Servicios específicos
export const appointmentService = {
  getAppointments: () => api.get('/appointments', true, 60000), // 1 minuto de caché
  getBarberAppointments: (barberId) => api.get(`/appointments/barber/${barberId}`, true, 60000),
  createAppointment: (data) => api.post('/appointments', data),
  updateAppointment: (id, data) => api.put(`/appointments/${id}`, data),
  cancelAppointment: (id, reason) => api.put(`/appointments/${id}/cancel`, { reason }),
  approveAppointment: (id) => api.put(`/appointments/${id}/approve`, {}),
  completeAppointment: (id) => api.put(`/appointments/${id}/complete`, {}),
  markNoShow: (id) => api.put(`/appointments/${id}/no-show`, {}),
  deleteAppointment: (id) => api.delete(`/appointments/${id}`),
  getAvailableTimes: (barberId, date) => api.get(`/appointments/availability/${barberId}?date=${date}&duration=30`),
};

export const barberService = {
  getAllBarbers: () => api.get('/barbers', true, 300000), // 5 minutos de caché
  getBarberById: (id) => api.get(`/barbers/${id}`, true, 300000),
  getBarberByUserId: (userId) => api.get(`/barbers/by-user/${userId}`, true, 300000),
  createBarber: (data) => api.post('/barbers', data),
  updateBarber: (id, data) => api.put(`/barbers/${id}`, data),
  removeBarber: (id) => api.put(`/barbers/${id}/remove`),
  getBarberProfile: async () => {
    // Para obtener el perfil del barbero autenticado, necesitamos su userId
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user._id) {
      throw new Error('Usuario no autenticado');
    }
    return api.get(`/barbers/by-user/${user._id}`, true, 300000);
  },
  updateBarberProfile: (id, data) => api.put(`/barbers/${id}`, data),
  updateMyProfile: async (data) => {
    // Para actualizar el perfil del barbero autenticado
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user._id) {
      throw new Error('Usuario no autenticado');
    }
    
    // Primero obtener el perfil para conseguir el ID del barbero
    const barberResponse = await api.get(`/barbers/by-user/${user._id}`, false);
    const barberData = barberResponse.data || barberResponse;
    
    if (!barberData || !barberData._id) {
      throw new Error('No se pudo obtener el ID del barbero');
    }
    
    // Siempre usar el endpoint /profile para evitar validateImageRequired
    // El endpoint /profile maneja tanto FormData como JSON
    return api.put(`/barbers/${barberData._id}/profile`, data);
  },
  getBarberStats: (id) => api.get(`/barbers/${id}/stats`, true, 900000), // 15 minutos de caché
};

// Servicios de ventas
export const salesService = {
  getBarberSalesStats: (barberId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `/sales/barber/${barberId}/stats${queryString ? `?${queryString}` : ''}`;
    return api.get(url, true, 300000);
  },
  // Si se pasa barberId, usa el endpoint por barbero; si no, usa el global
  getAvailableDates: (barberId = null) => {
    if (barberId) {
      return api.get(`/sales/barber/${barberId}/available-dates`, true, 300000);
    } else {
      return api.get(`/sales/available-dates`, true, 300000);
    }
  },
  getDailyReport: (date, barberId = null) => {
    const params = new URLSearchParams({ date });
    if (barberId) params.append('barberId', barberId);
    return api.get(`/sales/daily-report?${params.toString()}`, false);
  },
  getBarberRangeReport: (type, date, barberId) => {
    const params = new URLSearchParams({ type, date });
    if (barberId) params.append('barberId', barberId);
    return api.get(`/sales/reports?${params.toString()}`, false);
  },
  
  // Crear venta de productos
  createSale: (saleData) => api.post('/sales', saleData),
  
  // Crear venta de servicio de corte  
  createWalkInSale: (walkInData) => api.post('/sales/walk-in', walkInData)
};

// Servicios de citas  
export const appointmentsService = {
  getBarberAppointmentStats: (barberId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `/appointments/barber/${barberId}/stats${queryString ? `?${queryString}` : ''}`;
    return api.get(url, true, 300000);
  },
  getAvailableDates: (barberId) => api.get(`/appointments/barber/${barberId}/available-dates`, true, 300000),
  getDailyReport: (date, barberId = null) => {
    const params = new URLSearchParams({ date });
    if (barberId) params.append('barberId', barberId);
    return api.get(`/appointments/daily-report?${params.toString()}`, false);
  }
};

export const serviceService = {
  getAllServices: () => api.get('/services', true, 300000),
  getServiceById: (id) => api.get(`/services/${id}`, true, 300000),
  createService: (data) => api.post('/services', data),
  updateService: (id, data) => api.put(`/services/${id}`, data),
  deleteService: (id) => api.delete(`/services/${id}`),
};

export const userService = {
  getProfile: () => api.get('/users/me', true, 300000),
  updateProfile: (data) => api.put('/users/me', data),
  changePassword: (data) => api.put('/users/change-password', data),
  getAllUsers: () => api.get('/users', true, 300000), // Para administradores
  getUserById: (id) => api.get(`/users/${id}`, true, 300000),
  updateUserRole: (id, data) => api.put(`/users/${id}/role`, data),
};

export const inventoryService = {
  getInventory: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/inventory${queryString ? `?${queryString}` : ''}`, true, 300000);
  },
  getInventoryItem: (id) => api.get(`/inventory/${id}`, true, 300000),
  createInventoryItem: (data) => api.post('/inventory', data),
  updateInventoryItem: (id, data) => api.put(`/inventory/${id}`, data),
  deleteInventoryItem: (id) => api.delete(`/inventory/${id}`),
  adjustStock: (id, data) => api.post(`/inventory/${id}/stock`, data),
  getLowStockItems: (threshold) => api.get(`/inventory/low-stock${threshold ? `?threshold=${threshold}` : ''}`, true, 300000),
  getItemsByCategory: (category) => api.get(`/inventory/category/${category}`, true, 300000),
  getMovementHistory: (id, startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return api.get(`/inventory/${id}/history${params.toString() ? `?${params.toString()}` : ''}`, true, 300000);
  },
  getStats: () => api.get('/inventory/stats/overview', true, 300000),
  getLogs: (queryString) => api.get(`/inventory/logs${queryString ? `?${queryString}` : ''}`, true, 60000),
  getLogStats: (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return api.get(`/inventory/logs/stats${params.toString() ? `?${params.toString()}` : ''}`, true, 300000);
  },
  getDailyReport: (date) => {
    const params = new URLSearchParams({ date });
    return api.get(`/inventory/daily-report?${params.toString()}`, false);
  }
};

// Servicios de snapshots de inventario
export const inventorySnapshotService = {
  createSnapshot: (data) => api.post('/inventory-snapshots', data),
  getSnapshots: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/inventory-snapshots${queryString ? `?${queryString}` : ''}`, true, 300000);
  },
  getSnapshotById: (id) => api.get(`/inventory-snapshots/${id}`, true, 300000),
  deleteSnapshot: (id) => api.delete(`/inventory-snapshots/${id}`),
  getStats: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/inventory-snapshots/stats${queryString ? `?${queryString}` : ''}`, true, 300000);
  },
  downloadSnapshot: async (id) => {
    try {
      const token = getValidToken();
      const response = await fetchWithRetry(`${API_URL}/inventory-snapshots/${id}/download`, {
        method: 'GET',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`Error al descargar: ${response.status}`);
      }

      return response.blob();
    } catch (error) {
      console.error('Error al descargar inventario guardado:', error);
      throw error;
    }
  }
};
