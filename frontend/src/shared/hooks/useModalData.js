import { useState, useCallback } from 'react';

/**
 * Hook para manejar caché de datos con TTL
 * Elimina la necesidad de recargar datos en cada modal
 */
export const useDataCache = () => {
  const [cache, setCache] = useState(new Map());

  const getCachedData = useCallback((key) => {
    const cached = cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now > cached.expiry) {
      // Cache expirado, eliminarlo
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(key);
        return newCache;
      });
      return null;
    }

    return cached.data;
  }, [cache]);

  const setCachedData = useCallback((key, data, ttlMs = 5 * 60 * 1000) => {
    const expiry = Date.now() + ttlMs;
    setCache(prev => {
      const newCache = new Map(prev);
      newCache.set(key, { data, expiry });
      return newCache;
    });
  }, []);

  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  const removeCachedData = useCallback((key) => {
    setCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(key);
      return newCache;
    });
  }, []);

  return {
    getCachedData,
    setCachedData,
    clearCache,
    removeCachedData
  };
};

/**
 * Hook especializado para datos de modales
 * Implementa la estrategia híbrida: fetch todo una vez, filtrar en frontend
 */
export const useModalData = () => {
  const { getCachedData, setCachedData } = useDataCache();

  const fetchAllSales = useCallback(async () => {
    const cacheKey = 'allSalesData';
    let allSales = getCachedData(cacheKey);

    if (!allSales) {
      console.log('🔄 [CACHE] Cargando todos los datos de sales por primera vez...');
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/sales?limit=10000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        allSales = result.data || [];
        setCachedData(cacheKey, allSales, 5 * 60 * 1000); // 5 min cache
        console.log(`✅ [CACHE] Sales cacheados: ${allSales.length} registros`);
      } else {
        throw new Error('Error al cargar datos de sales');
      }
    } else {
      console.log(`📋 [CACHE] Usando sales desde caché: ${allSales.length} registros`);
    }

    return allSales;
  }, [getCachedData, setCachedData]);

  const fetchAllAppointments = useCallback(async () => {
    const cacheKey = 'allAppointmentsData';
    let allAppointments = getCachedData(cacheKey);

    if (!allAppointments) {
      console.log('🔄 [CACHE] Cargando todos los datos de appointments por primera vez...');
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/appointments?status=completed&limit=10000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        allAppointments = result.data || [];
        setCachedData(cacheKey, allAppointments, 5 * 60 * 1000); // 5 min cache
        console.log(`✅ [CACHE] Appointments cacheados: ${allAppointments.length} registros`);
      } else {
        throw new Error('Error al cargar datos de appointments');
      }
    } else {
      console.log(`📋 [CACHE] Usando appointments desde caché: ${allAppointments.length} registros`);
    }

    return allAppointments;
  }, [getCachedData, setCachedData]);

  const filterByDateRange = useCallback((data, dateRange) => {
    if (!dateRange?.startDate || !dateRange?.endDate) {
      return data;
    }

    const startDate = new Date(dateRange.startDate + 'T00:00:00.000Z');
    const endDate = new Date(dateRange.endDate + 'T23:59:59.999Z');

    return data.filter(item => {
      const itemDate = new Date(item.createdAt || item.date);
      return itemDate >= startDate && itemDate <= endDate;
    });
  }, []);

  return {
    fetchAllSales,
    fetchAllAppointments,
    filterByDateRange
  };
};