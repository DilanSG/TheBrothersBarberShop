const API_URL = import.meta.env.VITE_API_URL;

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (url, options, retries = 3, backoff = 1000) => {
  try {
    const response = await fetch(url, options);
    
    if (response.status === 429 && retries > 0) {
      // Si recibimos un 429, esperamos y reintentamos
      console.log(`Rate limited, retrying in ${backoff}ms... (${retries} retries left)`);
      await wait(backoff);
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }

    if (!response.ok) {
      // Para otros errores, incluimos más información
      const errorBody = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}\nEndpoint: ${url}\nDetails: ${errorBody}`
      );
    }

    return response;
  } catch (error) {
    if (retries > 0 && (error.name === 'TypeError' || error.message.includes('failed to fetch'))) {
      // Reintentar en caso de errores de red
      console.log(`Network error, retrying in ${backoff}ms... (${retries} retries left)`);
      await wait(backoff);
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw error;
  }
};

export const api = {
  get: async (endpoint) => {
    try {
      const token = localStorage.getItem('token');
      const url = `${API_URL}/api${endpoint}`;
      console.log('Haciendo petición GET a:', url);
      
      const response = await fetchWithRetry(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      const data = await response.json();
      console.log('Respuesta recibida de GET:', url, data);
      
      // Verificar si la respuesta indica un error de autorización
      if (response.status === 403 || response.status === 401) {
        throw new Error('No tienes permiso para acceder a este recurso');
      }
      
      return data;
    } catch (error) {
      console.error(`Error calling ${endpoint}:`, error);
      throw new Error(
        error.message.includes('429') 
          ? 'El servidor está ocupado. Por favor, espera un momento y vuelve a intentarlo.'
          : error.message
      );
    }
  },

  post: async (endpoint, data) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetchWithRetry(`${API_URL}/api${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      });

      return await response.json();
    } catch (error) {
      console.error(`Error calling ${endpoint}:`, error);
      throw new Error(
        error.message.includes('429') 
          ? 'El servidor está ocupado. Por favor, espera un momento y vuelve a intentarlo.'
          : error.message
      );
    }
  },

  put: async (endpoint, data) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetchWithRetry(`${API_URL}/api${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        ...(data && { body: JSON.stringify(data) }),
      });

      return await response.json();
    } catch (error) {
      console.error(`Error calling ${endpoint}:`, error);
      throw new Error(
        error.message.includes('429') 
          ? 'El servidor está ocupado. Por favor, espera un momento y vuelve a intentarlo.'
          : error.message
      );
    }
  },

  delete: async (endpoint) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetchWithRetry(`${API_URL}/api${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      return await response.json();
    } catch (error) {
      console.error(`Error calling ${endpoint}:`, error);
      throw new Error(
        error.message.includes('429') 
          ? 'El servidor está ocupado. Por favor, espera un momento y vuelve a intentarlo.'
          : error.message
      );
    }
  },
};

export const barberService = {
  getAllBarbers: () => api.get('/barbers'),
  getBarberById: (id) => api.get(`/barbers/${id}`),
  getBarberByUserId: (userId) => api.get(`/barbers/by-user/${userId}`),
};
