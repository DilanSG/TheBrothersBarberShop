import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(() => {
    const saved = localStorage.getItem('user');
    if (!saved) return null;
    const userData = JSON.parse(saved);
    // Asegurar que la foto se mantenga después de recargar
    return {
      ...userData,
      photo: userData.photo || null
    };
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [barberProfile, setBarberProfile] = useState(null);

  // Efecto para cargar el perfil de barbero si el usuario tiene el rol
  React.useEffect(() => {
    const loadBarberProfile = async () => {
      if (user?.role === 'barber' && token) {
        try {
          const res = await fetch(`http://localhost:5000/api/barbers/by-user/${user._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setBarberProfile(data.data);
          }
        } catch (error) {
          console.error('Error al cargar perfil de barbero:', error);
        }
      }
    };
    loadBarberProfile();
  }, [user?.role, user?._id, token]);

  // setUser que actualiza localStorage
  const setUser = (newUser) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('user');
    }
  };

  const checkAndCreateBarberProfile = async (userId, token) => {
    try {
      // Primero verificamos si ya existe un perfil de barbero
      const res = await fetch(`http://localhost:5000/api/barbers/by-user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        // Si no existe, creamos uno nuevo
        const createRes = await fetch('http://localhost:5000/api/barbers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ user: userId })
        });
        
        if (!createRes.ok) {
          console.error('Error al crear perfil de barbero');
        }
      }
    } catch (error) {
      console.error('Error al verificar/crear perfil de barbero:', error);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok || !data.token) {
        return false;
      }

      // Asegurarnos de guardar toda la información del usuario, incluyendo la foto
      const userData = {
        ...data.user,
        photo: data.user.photo || null,
        _id: data.user._id || data.user.id // Asegurar consistencia del ID
      };

      // Si el usuario es un barbero, verificar/crear su perfil
      if (data.user.role === 'barber') {
        await checkAndCreateBarberProfile(data.user._id, data.token);
      }

      setUser(userData);
      setToken(data.token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', data.token);
      return true;
    } catch (error) {
      console.error('Error durante el login:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      setUser,
      barberProfile,
      setBarberProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
