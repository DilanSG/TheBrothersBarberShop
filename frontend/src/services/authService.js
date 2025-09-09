import { api, cacheHelper } from './api.js';

const API_URL = import.meta.env.VITE_API_URL;
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

// Sistema de reintentos específico para auth (menos intentos, más rápido)
const authFetchWithRetry = async (url, options, retries = 2, backoff = 500) => {
  try {
    // Añadir headers de monitoreo
    options.headers = {
      ...options.headers,
      'X-Client-Version': APP_VERSION,
      'X-Request-ID': Math.random().toString(36).substring(7)
    };

    const startTime = performance.now();
    const response = await fetch(url, options);
    const endTime = performance.now();

    // Métricas ya se capturan automáticamente en el backend
    // No necesitamos enviarlas manualmente desde el frontend

    if (response.status === 429 && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, backoff));
      return authFetchWithRetry(url, options, retries - 1, backoff * 2);
    }

    // Verificar si la respuesta es JSON antes de parsearlo
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error('Respuesta no JSON recibida:', text);
      data = { message: 'Error del servidor', error: text };
    }

    if (!response.ok) {
      // Mejorar manejo de errores específicos de auth
      if (data.errors && Array.isArray(data.errors)) {
        throw new Error(data.errors.map(err => err.msg).join('\n'));
      }
      
      if (response.status === 401) {
        throw new Error('Credenciales inválidas');
      }
      
      if (response.status === 403) {
        throw new Error('No tienes permiso para realizar esta acción');
      }
      
      throw new Error(data.message || 'Error en la autenticación');
    }

    return { response, data };
  } catch (error) {
    if (retries > 0 && error.name === 'TypeError') {
      await new Promise(resolve => setTimeout(resolve, backoff));
      return authFetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw error;
  }
};

export const authService = {
  register: async (userData) => {
    try {
      const { data } = await authFetchWithRetry(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      return data;
    } catch (error) {
      console.error('Error en el registro:', error);
      throw new Error(
        error.message.includes('429')
          ? 'Demasiados intentos. Por favor, espera un momento.'
          : error.message
      );
    }
  },

  login: async (credentials) => {
    try {
      const { data, response } = await authFetchWithRetry(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      // Almacenar token y datos de usuario
      if (data.token) {
        localStorage.setItem('token', data.token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        // Limpiar caché al iniciar sesión para evitar datos de sesiones anteriores
        await cacheHelper.clear();
      }

      return data;
    } catch (error) {
      console.error('Error en el login:', error);
      throw new Error(
        error.message.includes('429')
          ? 'Demasiados intentos de inicio de sesión. Por favor, espera un momento.'
          : error.message
      );
    }
  },

  logout: async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Intenta hacer logout en el servidor
        try {
          await authFetchWithRetry(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
        } catch (e) {
          console.warn('Error en logout del servidor:', e);
        }
      }
    } finally {
      // Siempre limpiar datos locales
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      await cacheHelper.clear();
    }
  },

  verifyEmail: async (token) => {
    try {
      const { data } = await authFetchWithRetry(`${API_URL}/auth/verify-email/${token}`, {
        method: 'GET'
      });
      return data;
    } catch (error) {
      console.error('Error en verificación de email:', error);
      throw new Error(error.message || 'Error al verificar el email');
    }
  },

  requestPasswordReset: async (email) => {
    try {
      const { data } = await authFetchWithRetry(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      return data;
    } catch (error) {
      console.error('Error en solicitud de reset de password:', error);
      throw new Error(
        error.message.includes('429')
          ? 'Demasiadas solicitudes. Por favor, espera unos minutos.'
          : error.message
      );
    }
  },

  resetPassword: async (token, newPassword) => {
    try {
      const { data } = await authFetchWithRetry(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });
      return data;
    } catch (error) {
      console.error('Error en reset de password:', error);
      throw new Error(error.message || 'Error al restablecer la contraseña');
    }
  },

  refreshToken: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No hay token para refrescar');

      // NOTA: El endpoint de refresh-token no está implementado en el backend
      // Por ahora, solo verificamos que el token exista y devolvemos los datos actuales
      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }

      return { token, user };
    } catch (error) {
      console.error('Error refreshing token:', error);
      // Si hay error refrescando el token, hacer logout
      await authService.logout();
      throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    }
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};
