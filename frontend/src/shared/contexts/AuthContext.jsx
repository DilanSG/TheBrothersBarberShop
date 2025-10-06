import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authService } from '../services/authService';
import { barberService } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(() => authService.getCurrentUser());
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [barberProfile, setBarberProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTimer, setRefreshTimer] = useState(null);

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
    
    // Tiempos de refresh diferenciados por rol (refrescar antes de que expire)
    const refreshIntervals = {
      'user': 5.5 * 60 * 60 * 1000,    // 5.5 horas (token expira en 6h)
      'barber': 7.5 * 60 * 60 * 1000,  // 7.5 horas (token expira en 8h) 
      'admin': 3.5 * 60 * 60 * 1000    // 3.5 horas (token expira en 4h)
    };
    
    const refreshInterval = user?.role ? 
      refreshIntervals[user.role] || refreshIntervals.admin : 
      refreshIntervals.admin; // Default a admin (más seguro)
    
    const timer = setInterval(async () => {
      try {
        await authService.refreshToken();
      } catch (error) {
        console.error('Error al refrescar el token:', error);
        // Si falla el refresh, hacer logout
        handleLogout();
      }
    }, refreshInterval);
    
    setRefreshTimer(timer);
    return () => clearInterval(timer);
  }, [user?.role]); // Dependencia añadida para recalcular si cambia el rol

  // Cargar perfil de barbero si es necesario
  useEffect(() => {
    const loadBarberProfile = async () => {
      if (user?.role === 'barber' && token && user._id) {
        try {
          const data = await barberService.getBarberByUserId(user._id);
          setBarberProfile(data.data);
        } catch (error) {
          console.error('Error al cargar perfil de barbero:', error);
          setError('Error al cargar perfil de barbero');
        }
      }
      setLoading(false);
    };

    loadBarberProfile();
  }, [user?._id, token]);

  // Setup del refresh token
  useEffect(() => {
    if (token) {
      const cleanup = setupTokenRefresh();
      return () => {
        cleanup();
        if (refreshTimer) clearInterval(refreshTimer);
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
