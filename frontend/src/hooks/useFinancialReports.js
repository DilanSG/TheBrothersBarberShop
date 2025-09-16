import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';

/**
 * Hook para manejar reportes financieros optimizado con caché y agregaciones
 * Maneja ingresos por servicios, productos, filtros de fecha y resúmenes financieros
 */
export const useFinancialReports = () => {
  // Estados principales
  const [data, setData] = useState({
    summary: {
      totalRevenue: 0,
      totalServices: 0,
      totalProducts: 0,
      totalAppointments: 0,
      totalExpenses: 0,
      netProfit: 0,
      paymentMethods: {}
    },
    dailyData: [],
    serviceBreakdown: [],
    productBreakdown: [],
    paymentMethodBreakdown: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cache, setCache] = useState(new Map());

  // Filtros de fecha
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días atrás
    endDate: new Date().toISOString().split('T')[0],
    preset: 'last30days'
  });

  // Presets de fechas comunes
  const datePresets = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);

    return {
      today: {
        label: 'Hoy',
        startDate: today.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      },
      yesterday: {
        label: 'Ayer',
        startDate: yesterday.toISOString().split('T')[0],
        endDate: yesterday.toISOString().split('T')[0]
      },
      last7days: {
        label: 'Últimos 7 días',
        startDate: weekAgo.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      },
      last30days: {
        label: 'Últimos 30 días',
        startDate: monthAgo.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      },
      thisMonth: {
        label: 'Este mes',
        startDate: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      },
      lastMonth: {
        label: 'Mes pasado',
        startDate: new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0],
        endDate: new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0]
      },
      thisYear: {
        label: 'Este año',
        startDate: new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      },
      lastYear: {
        label: 'Año pasado',
        startDate: new Date(today.getFullYear() - 1, 0, 1).toISOString().split('T')[0],
        endDate: new Date(today.getFullYear() - 1, 11, 31).toISOString().split('T')[0]
      }
    };
  }, []);

  // Generar clave de caché
  const getCacheKey = useCallback((startDate, endDate) => {
    return `financial_${startDate}_${endDate}`;
  }, []);

  // Cargar datos financieros con caché
  const loadFinancialData = useCallback(async (startDate, endDate, forceRefresh = false) => {
    const cacheKey = getCacheKey(startDate, endDate);
    
    // Verificar caché (válido por 5 minutos)
    if (!forceRefresh && cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
        setData(cached.data);
        return cached.data;
      }
    }

    try {
      setLoading(true);
      setError(null);

      // Realizar consultas en paralelo para optimizar la carga
      const [revenueResponse, expensesResponse] = await Promise.all([
        api.get(`/sales/financial-summary?startDate=${startDate}&endDate=${endDate}`),
        api.get(`/expenses/summary?startDate=${startDate}&endDate=${endDate}`)
      ]);

      const revenueData = revenueResponse.data;
      const expensesData = expensesResponse.data;

      // Procesar y agregar datos
      const processedData = {
        summary: {
          totalRevenue: revenueData.summary?.totalRevenue || 0,
          totalServices: revenueData.summary?.totalServices || 0,
          totalProducts: revenueData.summary?.totalProducts || 0,
          totalAppointments: revenueData.summary?.totalAppointments || 0,
          totalExpenses: expensesData.summary?.totalExpenses || 0,
          netProfit: (revenueData.summary?.totalRevenue || 0) - (expensesData.summary?.totalExpenses || 0),
          paymentMethods: revenueData.summary?.paymentMethods || {}
        },
        dailyData: revenueData.dailyData || [],
        serviceBreakdown: revenueData.serviceBreakdown || [],
        productBreakdown: revenueData.productBreakdown || [],
        paymentMethodBreakdown: revenueData.paymentMethodBreakdown || [],
        expenseBreakdown: expensesData.breakdown || []
      };

      // Actualizar estado y caché
      setData(processedData);
      setCache(prev => new Map(prev.set(cacheKey, {
        data: processedData,
        timestamp: Date.now()
      })));

      return processedData;
    } catch (error) {
      console.error('Error loading financial data:', error);
      setError('Error al cargar los datos financieros');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [cache, getCacheKey]);

  // Cambiar rango de fechas
  const setDateRangePreset = useCallback((preset) => {
    if (datePresets[preset]) {
      const newRange = {
        ...datePresets[preset],
        preset
      };
      setDateRange(newRange);
    }
  }, [datePresets]);

  // Cambiar fechas personalizadas
  const setCustomDateRange = useCallback((startDate, endDate) => {
    setDateRange({
      startDate,
      endDate,
      preset: 'custom'
    });
  }, []);

  // Refrescar datos
  const refreshData = useCallback(() => {
    return loadFinancialData(dateRange.startDate, dateRange.endDate, true);
  }, [dateRange.startDate, dateRange.endDate, loadFinancialData]);

  // Cargar datos cuando cambie el rango de fechas
  useEffect(() => {
    loadFinancialData(dateRange.startDate, dateRange.endDate);
  }, [dateRange.startDate, dateRange.endDate, loadFinancialData]);

  // Limpiar caché cada 10 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      setCache(prev => {
        const now = Date.now();
        const newCache = new Map();
        for (const [key, value] of prev.entries()) {
          if (now - value.timestamp < 10 * 60 * 1000) {
            newCache.set(key, value);
          }
        }
        return newCache;
      });
    }, 10 * 60 * 1000); // 10 minutos

    return () => clearInterval(interval);
  }, []);

  // Cálculos derivados optimizados
  const calculations = useMemo(() => {
    const { summary } = data;
    
    return {
      profitMargin: summary.totalRevenue > 0 ? 
        ((summary.netProfit / summary.totalRevenue) * 100).toFixed(1) : '0.0',
      averageServiceValue: summary.totalServices > 0 ? 
        (summary.totalRevenue / summary.totalServices).toFixed(0) : '0',
      servicesPercentage: summary.totalRevenue > 0 ?
        (((summary.totalRevenue - summary.totalProducts) / summary.totalRevenue) * 100).toFixed(1) : '0.0',
      productsPercentage: summary.totalRevenue > 0 ?
        ((summary.totalProducts / summary.totalRevenue) * 100).toFixed(1) : '0.0'
    };
  }, [data]);

  return {
    // Datos
    data,
    loading,
    error,
    
    // Filtros de fecha
    dateRange,
    datePresets,
    setDateRangePreset,
    setCustomDateRange,
    
    // Acciones
    refreshData,
    loadFinancialData,
    
    // Cálculos
    calculations,
    
    // Utilidades
    formatCurrency: (amount) => new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount || 0),
    
    formatDate: (date) => new Date(date + 'T00:00:00').toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  };
};

export default useFinancialReports;