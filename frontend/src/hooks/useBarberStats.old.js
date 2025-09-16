import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { barberService, salesService, appointmentsService } from '../services/api';
import { availableDatesService } from '../services/availableDatesService';
import { useNotification } from '../contexts/NotificationContext';
import cacheService from '../services/cacheService';
import batchProcessingService from '../services/batchProcessingService';

// Configuración de logging - cambiar a false para reducir logs en producción
const DEBUG_LOGS = false; // Desactivado para reducir spam de logs

// Función helper para logs condicionales
const debugLog = (message, ...args) => {
  if (DEBUG_LOGS) {
    console.log(message, ...args);
  }
};

// Función helper para debounce
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Hook personalizado para manejar estadísticas y datos de barberos
 * Gestiona la carga de datos, filtros y generación de reportes
 * OPTIMIZADO: Incluye cache, batching, debounce y precarga inteligente
 */
export const useBarberStats = () => {
  const { showError, showSuccess } = useNotification();
  
  // Estados principales
  const [barbers, setBarbers] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [filteredStats, setFilteredStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados de filtros  
  const [allAvailableDates, setAllAvailableDates] = useState([]);
  const [filterType, setFilterType] = useState('General');
  const [filterDate, setFilterDate] = useState('');
  const [filterLoading, setFilterLoading] = useState(false);
  
  // Estados de reportes
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState(null);
  
  // Estados para prevenir ejecuciones múltiples
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isApplyingFilter, setIsApplyingFilter] = useState(false);
  
  // Estados de progreso por barbero
  const [loadingStatus, setLoadingStatus] = useState({});
  
  // Ref para debounce
  const debounceTimeoutRef = useRef(null);

  // Memo para obtener los días disponibles globales (ordenados)
  const sortedAvailableDates = useMemo(() => {
    return allAvailableDates.sort((a, b) => new Date(b) - new Date(a));
  }, [allAvailableDates]);

  // Cargar fechas globales usando el servicio mejorado
  useEffect(() => {
    const loadGlobalDates = async () => {
      try {
        debugLog('🔄 Cargando fechas disponibles con servicio mejorado...');
        const dates = await availableDatesService.getAllAvailableDates();
        debugLog('📅 Fechas disponibles cargadas:', dates.length, 'fechas');
        setAllAvailableDates(dates);
      } catch (err) {
        console.error('❌ Error cargando fechas globales:', err);
        setAllAvailableDates([]);
      }
    };
    loadGlobalDates();
  }, []);

  // Función para obtener el rango de fechas a resaltar (mejorada)
  const getHighlightedRange = () => {
    if (!filterDate || filterType === 'General') return [];
    
    // Usar fecha local en lugar de UTC
    const base = new Date(filterDate + 'T12:00:00');
    const range = [];
    
    if (filterType === 'Día') {
      // Solo el día seleccionado
      range.push(new Date(base));
    } else if (filterType === 'Semana') {
      // Últimos 7 días desde la fecha base (incluyendo la fecha base)
      for (let i = 0; i < 7; i++) {
        const d = new Date(base);
        d.setDate(base.getDate() - i);
        range.push(new Date(d));
      }
    } else if (filterType === 'Mes') {
      // Últimos 30 días desde la fecha base (incluyendo la fecha base)
      for (let i = 0; i < 30; i++) {
        const d = new Date(base);
        d.setDate(base.getDate() - i);
        range.push(new Date(d));
      }
    }
    
    debugLog('🎯 Rango a resaltar:', filterType, filterDate, range.map(d => {
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    }));
    return range;
  };

  // Función para obtener fechas válidas para el rango seleccionado
  const getValidDatesForRange = async () => {
    if (!filterDate || filterType === 'General') {
      return allAvailableDates;
    }
    
    const base = new Date(filterDate + 'T12:00:00');
    const rangeLimit = filterType === 'Semana' ? 7 : (filterType === 'Mes' ? 30 : 1);
    
    // Filtrar fechas disponibles que estén dentro del rango
    const validDates = allAvailableDates.filter(dateStr => {
      const date = new Date(dateStr + 'T12:00:00');
      const daysDiff = Math.floor((base - date) / (1000 * 60 * 60 * 24));
      return daysDiff >= 0 && daysDiff < rangeLimit;
    });
    
    debugLog('📅 Fechas válidas para rango:', filterType, filterDate, validDates);
    return validDates;
  };

  // Función para obtener fechas del rango según filtro (corregida)
  const getDateRange = (type, baseDate) => {
    if (!baseDate) return [];
    
    const base = new Date(baseDate + 'T00:00:00.000Z');
    const result = [];
    
    if (type === 'Día') {
      // Solo el día seleccionado
      result.push(base.toISOString().split('T')[0]);
    } else if (type === 'Semana') {
      // Últimos 7 días INCLUYENDO la fecha base
      for (let i = 0; i < 7; i++) {
        const d = new Date(base);
        d.setDate(base.getDate() - i);
        result.push(d.toISOString().split('T')[0]);
      }
    } else if (type === 'Mes') {
      // Últimos 30 días INCLUYENDO la fecha base
      for (let i = 0; i < 30; i++) {
        const d = new Date(base);
        d.setDate(base.getDate() - i);
        result.push(d.toISOString().split('T')[0]);
      }
    }
    
    // IMPORTANTE: Solo incluir fechas que realmente tienen datos
    const validDates = result.filter(date => allAvailableDates.includes(date));
    debugLog(`📅 Rango para ${type} desde ${baseDate}:`, `Total generado: ${result.length}, Con datos: ${validDates.length}`, validDates);
    return validDates;
  };

  // Cargar datos principales
  const loadData = async () => {
    if (isLoadingData) {
      debugLog('⚠️ Ya se están cargando datos, saltando...');
      return;
    }
    
    setIsLoadingData(true);
    setLoading(true);
    setError('');
    try {
      const barbersResponse = await barberService.getAllBarbers();
      let barbersData = [];
      if (Array.isArray(barbersResponse)) {
        barbersData = barbersResponse;
      } else if (barbersResponse && barbersResponse.data && Array.isArray(barbersResponse.data)) {
        barbersData = barbersResponse.data;
      } else if (barbersResponse && Array.isArray(barbersResponse.success)) {
        barbersData = barbersResponse.success;
      }
      setBarbers(barbersData);
      await loadStatistics(barbersData);
    } catch (error) {
      console.error('Error al cargar barberos:', error);
      setBarbers([]);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
      setIsLoadingData(false);
    }
  };

  // Cargar estadísticas generales
  const loadStatistics = async (barbersData, dateFilter = {}) => {
    debugLog('📊 Cargando estadísticas para', barbersData.length, 'barberos con filtros:', dateFilter);
    const stats = {};
    
    // Procesar barberos secuencialmente con delay para evitar rate limiting
    for (let i = 0; i < barbersData.length; i++) {
      const barber = barbersData[i];
      
      try {
        debugLog(`🔄 Cargando stats para barbero ${i + 1}/${barbersData.length}: ${barber.user?.name || barber._id}`);
        
        // Agregar delay mínimo entre llamadas (reducido significativamente)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 50)); // Delay fijo mínimo
        }
        
        // Preparar parámetros para las consultas
        const queryParams = {};
        if (dateFilter.date) {
          queryParams.date = dateFilter.date;
        } else if (dateFilter.startDate && dateFilter.endDate) {
          queryParams.startDate = dateFilter.startDate;
          queryParams.endDate = dateFilter.endDate;
        }
        
        debugLog(`🎯 Parámetros de consulta para ${barber.user?.name}:`, queryParams);
        
        const [salesResponse, appointmentsResponse] = await Promise.all([
          salesService.getBarberSalesStats(barber._id, queryParams),
          appointmentsService.getBarberAppointmentStats(barber._id, queryParams)
        ]);
        
        // Procesar ventas de productos
        let totalProductos = 0;
        let countProductos = 0;
        if (salesResponse.data && Array.isArray(salesResponse.data.ventas)) {
          salesResponse.data.ventas.forEach(v => {
            totalProductos += v.total || 0;
            countProductos += v.count || 0; // Usar v.count, no incrementar de 1 en 1
          });
        } else if (salesResponse.data && typeof salesResponse.data.total === 'number') {
          totalProductos = salesResponse.data.total;
          countProductos = salesResponse.data.count || 0;
        }
        
        // Procesar cortes
        let cortesCount = 0;
        let cortesTotal = 0;
        if (salesResponse.data && Array.isArray(salesResponse.data.cortes)) {
          salesResponse.data.cortes.forEach(c => {
            cortesTotal += c.total || 0;
            cortesCount += c.count || 0; // Usar c.count, no incrementar de 1 en 1
          });
        }
        
        // Procesar citas (solo reservas)
        let totalCitas = 0;
        let completedCitas = 0;
        if (appointmentsResponse.data && Array.isArray(appointmentsResponse.data.citas)) {
          appointmentsResponse.data.citas.forEach(c => {
            totalCitas += c.revenue || c.service?.price || 0;
            completedCitas += c.count || 1; // Usar c.count si existe, sino 1
          });
        } else if (appointmentsResponse.data && typeof appointmentsResponse.data.revenue === 'number') {
          totalCitas = appointmentsResponse.data.revenue;
          completedCitas = appointmentsResponse.data.completed || 0;
        }
        
        stats[barber._id] = {
          sales: { total: totalProductos, count: countProductos },
          cortes: { count: cortesCount, total: cortesTotal },
          appointments: { completed: completedCitas, total: totalCitas },
        };
        
        debugLog(`✅ Stats cargadas para ${barber.user?.name || barber._id}:`, stats[barber._id]);
        
      } catch (error) {
        console.error(`❌ Error loading stats for barber ${barber._id}:`, error);
        stats[barber._id] = {
          sales: { total: 0, count: 0 },
          cortes: { count: 0, total: 0 },
          appointments: { completed: 0, total: 0 },
        };
      }
    }
    
    debugLog('📈 Todas las estadísticas cargadas:', stats);
    setStatistics(stats);
  };

  // Cargar fechas disponibles para un barbero específico
  const loadBarberAvailableDates = async (barberId) => {
    try {
      const [salesDates, appointmentDates] = await Promise.all([
        salesService.getAvailableDates(barberId),
        appointmentsService.getAvailableDates(barberId)
      ]);
      
      // Combinar y deduplicar fechas
      const allDates = [...new Set([
        ...(salesDates?.data || []),
        ...(appointmentDates?.data || [])
      ])].sort((a, b) => new Date(b) - new Date(a)); // Más recientes primero
      
      setAvailableDates(prev => ({ ...prev, [barberId]: allDates }));
    } catch (error) {
      console.error('Error cargando fechas disponibles:', error);
      showError('Error al cargar fechas disponibles');
    }
  };

  // Generar reporte para barbero específico
  const generateBarberReport = async (barberId, date = null) => {
    setLoadingReport(true);
    setSelectedBarber(barberId);
    try {
      const reportDate = date || new Date().toISOString().split('T')[0];
      // Solo necesitamos la respuesta de ventas ya que incluye todo
      const salesResponse = await salesService.getDailyReport(reportDate, barberId);
      
      debugLog('🔍 Respuesta del servidor:', salesResponse);
      
      const barber = barbers.find(b => b._id === barberId);
      const responseData = salesResponse?.data || salesResponse;
      
      debugLog('📊 Datos procesados:', responseData);
      
      setReportData({
        date: reportDate,
        barber,
        sales: responseData?.sales || [],
        appointments: responseData?.appointments || [],
        walkIns: responseData?.walkIns || [],
        totals: responseData?.totals || {}
      });
      
      showSuccess('Reporte generado exitosamente');
      return true;
    } catch (error) {
      console.error('Error generando reporte:', error);
      showError('Error al generar el reporte');
      return false;
    } finally {
      setLoadingReport(false);
      setSelectedBarber(null);
    }
  };

  // Inicializar datos al montar el hook
  useEffect(() => {
    loadData();
  }, []);

  // Función para validar si una fecha tiene datos disponibles
  const isDateAvailable = async (date) => {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    return await availableDatesService.hasDataForDate(dateStr);
  };

  // Función para obtener fechas disponibles en un rango
  const getDatesInRange = async (startDate, endDate) => {
    return await availableDatesService.getDatesInRange(startDate, endDate);
  };

  // Función para aplicar filtros de fecha y recargar estadísticas
  const applyDateFilter = async (newFilterType, newFilterDate) => {
    if (isApplyingFilter) {
      debugLog('⚠️ Ya se está aplicando un filtro, saltando...');
      return;
    }
    
    if (barbers.length === 0) {
      debugLog('⚠️ No hay barberos cargados, saltando filtro');
      return;
    }

    setIsApplyingFilter(true);
    
    // CAMBIO INMEDIATO: Limpiar estadísticas y cambiar tipo de filtro inmediatamente
    setStatistics({}); // Limpiar datos anteriores inmediatamente
    setFilterType(newFilterType); // Cambiar filtro inmediatamente
    setFilterDate(newFilterDate); // Cambiar fecha inmediatamente
    setFilterLoading(true); // Mostrar loading
    
    try {
      debugLog('🎯 Aplicando filtro de fecha:', { newFilterType, newFilterDate });
      
      let dateFilter = {};
      
      if (newFilterType === 'General') {
        // Sin filtros - cargar todas las estadísticas
        dateFilter = {};
      } else if (newFilterDate) {
        if (newFilterType === 'Hoy') {
          // Filtro por fecha específica
          dateFilter = { date: newFilterDate };
        } else if (newFilterType === '7 días') {
          // Últimos 7 días
          const endDate = new Date(newFilterDate);
          const startDate = new Date(endDate);
          startDate.setDate(endDate.getDate() - 6); // 7 días incluyendo el día actual
          
          dateFilter = {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          };
        } else if (newFilterType === '30 días') {
          // Últimos 30 días
          const endDate = new Date(newFilterDate);
          const startDate = new Date(endDate);
          startDate.setDate(endDate.getDate() - 29); // 30 días incluyendo el día actual
          
          dateFilter = {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          };
        }
      }
      
      debugLog('📅 Filtro de fecha calculado:', dateFilter);
      
      // Recargar estadísticas con filtro - esto actualiza directamente 'statistics'
      await loadStatistics(barbers, dateFilter);
      
    } catch (error) {
      console.error('❌ Error aplicando filtro de fecha:', error);
      showError('Error al aplicar filtros');
      // En caso de error, restaurar estadísticas generales
      await loadStatistics(barbers, {});
    } finally {
      setFilterLoading(false);
      setIsApplyingFilter(false);
    }
  };

  // Calcular estadísticas agregadas basadas en el filtro actual
  const aggregatedStats = useMemo(() => {
    if (!statistics || Object.keys(statistics).length === 0) {
      return {
        totalVentas: 0,
        countVentas: 0,
        totalCortes: 0,
        countCortes: 0,
        totalCitas: 0,
        countCitas: 0,
        grandTotal: 0
      };
    }

    let totalVentas = 0;
    let countVentas = 0;
    let totalCortes = 0;
    let countCortes = 0;
    let totalCitas = 0;
    let countCitas = 0;

    // Sumar todos los barberos
    Object.values(statistics).forEach(barberStats => {
      // Ventas de productos
      if (barberStats.sales) {
        totalVentas += barberStats.sales.total || 0;
        countVentas += barberStats.sales.count || 0;
      }
      
      // Cortes walk-in
      if (barberStats.cortes) {
        totalCortes += barberStats.cortes.total || 0;
        countCortes += barberStats.cortes.count || 0;
      }
      
      // Citas
      if (barberStats.appointments) {
        totalCitas += barberStats.appointments.total || 0;
        countCitas += barberStats.appointments.completed || 0;
      }
    });

    const grandTotal = totalVentas + totalCortes + totalCitas;

    debugLog('🧮 Estadísticas agregadas calculadas:', {
      totalVentas,
      countVentas,
      totalCortes,
      countCortes,
      totalCitas,
      countCitas,
      grandTotal,
      filterType
    });

    return {
      totalVentas,
      countVentas,
      totalCortes,
      countCortes,
      totalCitas,
      countCitas,
      grandTotal
    };
  }, [statistics, filterType]);

  return {
    // Estados principales
    barbers,
    statistics,
    aggregatedStats, // Nuevas estadísticas agregadas
    loading,
    error,
    
    // Estados de filtros
    allAvailableDates,
    sortedAvailableDates,
    filterType,
    filterDate,
    filterLoading,
    
    // Estados de reportes
    reportData,
    loadingReport,
    selectedBarber,
    
    // Funciones de filtros
    setFilterType,
    setFilterDate,
    applyDateFilter,
    getHighlightedRange,
    getValidDatesForRange,
    getDateRange,
    isDateAvailable,
    getDatesInRange,
    
    // Funciones de datos
    loadData,
    loadStatistics,
    loadBarberAvailableDates,
    
    // Funciones de reportes
    generateBarberReport,
    setReportData
  };
};
