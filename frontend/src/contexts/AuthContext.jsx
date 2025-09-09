import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authService } from '../services/authService';
import { barberService } from '../services/api';
import ErrorLogger from '../utils/errorLogger';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(() => authService.getCurrentUser());
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [barberProfile, setBarberProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTimer, setRefreshTimer] = useState(null);
  const tokenValidationRef = useRef(null);

  // Función para actualizar el usuario
  const setUser = (newUser) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('user');
    }
  };

  // Función para manejar el refresh del token
  const setupTokenRefresh = useCallback(() => {
    if (refreshTimer) clearInterval(refreshTimer);
    // Refrescar el token cada 14 minutos (el token expira a los 15)
    const timer = setInterval(async () => {
      try {
        await authService.refreshToken();
      } catch (error) {
        console.error('Error al refrescar el token:', error);
        // Si falla el refresh, hacer logout
        handleLogout();
      }
    }, 14 * 60 * 1000);
    setRefreshTimer(timer);
    return () => clearInterval(timer);
  }, []);

  // Cargar perfil de barbero si es necesario
  useEffect(() => {
    const loadBarberProfile = async () => {
      if (user?.role === 'barber' && token && user._id) {
        try {
          const data = await barberService.getBarberByUserId(user._id);
          setBarberProfile(data.data);
        } catch (error) {
          ErrorLogger.logError(error, {
            context: 'AuthContext_loadBarberProfile',
            userId: user._id,
            userRole: user.role
          });
          console.error('Error al cargar perfil de barbero:', error);
          setError('Error al cargar perfil de barbero');
        }
      }
      setLoading(false);
    };

    loadBarberProfile();
  }, [user?._id, token]);

  // Validación periódica del token
  const validateToken = useCallback(async () => {
    if (!token) return false;
    
    try {
      const isValid = await authService.validateToken();
      if (!isValid) {
        ErrorLogger.logError(new Error('Token inválido detectado'), {
          context: 'AuthContext_validateToken',
          userId: user?._id
        });
        handleLogout();
        return false;
      }
      return true;
    } catch (error) {
      ErrorLogger.logError(error, {
        context: 'AuthContext_validateToken',
        userId: user?._id
      });
      return false;
    }
  }, [token, user?._id]);

  // Setup del refresh token mejorado
  useEffect(() => {
    if (token) {
      const cleanup = setupTokenRefresh();
      
      // Validar token cada 5 minutos
      tokenValidationRef.current = setInterval(validateToken, 5 * 60 * 1000);
      
      return () => {
        cleanup();
        if (refreshTimer) clearInterval(refreshTimer);
        if (tokenValidationRef.current) clearInterval(tokenValidationRef.current);
      };
    }
  }, [token]);

  // Verificar y/o crear perfil de barbero
  const checkAndCreateBarberProfile = async (userId) => {
    try {
      let profile = await barberService.getBarberByUserId(userId);
      
      if (!profile.success) {
        profile = await barberService.createBarber({ user: userId });
      }
      
      setBarberProfile(profile.data);
      return profile;
    } catch (error) {
      console.error('Error al verificar/crear perfil de barbero:', error);
      setError('Error al gestionar perfil de barbero');
      throw error;
    }
  };

  // Login mejorado
  const handleLogin = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await authService.login({ email, password });
      
      if (!data.token || !data.user) {
        throw new Error('Datos de autenticación inválidos');
      }

      const userData = {
        ...data.user,
        photo: data.user.photo || null,
        _id: data.user._id || data.user.id
      };

      setUser(userData);
      setToken(data.token);

      // Si es barbero, verificar/crear su perfil
      if (data.user.role === 'barber') {
        await checkAndCreateBarberProfile(data.user._id);
      }

      setupTokenRefresh();
      return true;
    } catch (error) {
      console.error('Error durante el login:', error);
      // Mensajes de error más específicos
      let errorMessage = 'Error al iniciar sesión';
      if (error.message.includes('Credenciales inválidas') || error.message.includes('Invalid credentials')) {
        errorMessage = 'Email o contraseña incorrectos';
      } else if (error.message.includes('usuario no encontrado') || error.message.includes('User not found')) {
        errorMessage = 'Usuario no encontrado';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Error de conexión. Verifica tu internet';
      }
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout mejorado
  const handleLogout = async () => {
    try {
      setLoading(true);
      await authService.logout();
    } catch (error) {
      console.error('Error durante el logout:', error);
    } finally {
      setUser(null);
      setToken(null);
      setBarberProfile(null);
      if (refreshTimer) clearInterval(refreshTimer);
      setLoading(false);
    }
  };

  const value = {
    user,
    token,
    login: handleLogin,
    logout: handleLogout,
    setUser,
    barberProfile,
    setBarberProfile,
    checkAndCreateBarberProfile,
    loading,
    error,
    refreshToken: authService.refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
