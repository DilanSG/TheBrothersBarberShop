const API_URL = 'http://localhost:5000/api';

export const authService = {
  register: async (userData) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          // Si hay múltiples errores de validación, los unimos
          throw new Error(data.errors.map(err => err.msg).join('\n'));
        }
        throw new Error(data.message || 'Error en el registro');
      }

      return data;
    } catch (error) {
      console.error('Error en el registro:', error);
      throw error;
    }
  },

  login: async (credentials) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error en el inicio de sesión');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en el login:', error);
      throw error;
    }
  }
};
