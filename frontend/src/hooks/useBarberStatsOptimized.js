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

/**
 * Hook optimizado para manejar estadísticas y datos de barberos
 * INCLUYE: Cache local, batching, debounce, precarga inteligente
 */
export const useBarberStatsOptimized = () => {
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
    if (!allAvailableDates || !Array.isArray(allAvailableDates)) {
      return [];
    }
    return allAvailableDates.sort((a, b) => new Date(b) - new Date(a));
  }, [allAvailableDates]);

  // Función optimizada para cargar estadísticas con cache y batching
  const loadStatistics = useCallback(async (barbersData, dateFilter = {}) => {
    debugLog('🚀 Cargando estadísticas OPTIMIZADAS para', barbersData.length, 'barberos con filtros:', dateFilter);
    
    // Determinar el tipo de filtro y fechas
    let filterTypeKey = 'General';
    let startDate = '';
    let endDate = '';
    
    if (dateFilter.date) {
      filterTypeKey = 'Hoy';
      startDate = endDate = dateFilter.date;
    } else if (dateFilter.startDate && dateFilter.endDate) {
      startDate = dateFilter.startDate;
      endDate = dateFilter.endDate;
      
      // Determinar tipo basado en rango de fechas
      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      
      if (daysDiff <= 1) filterTypeKey = 'Hoy';
      else if (daysDiff <= 7) filterTypeKey = '7 días';
      else if (daysDiff <= 15) filterTypeKey = '15 días';
      else if (daysDiff <= 30) filterTypeKey = '30 días';
      else filterTypeKey = 'Personalizado';
    }

    // Función para fetch individual de barbero
    const fetchBarberData = async (barber) => {
      const barberId = barber._id;
      const barberName = barber.user?.name || barberId;
      
      // Actualizar estado de loading para este barbero
      setLoadingStatus(prev => ({ ...prev, [barberId]: 'fetching_sales' }));
      
      try {
        const queryParams = {};
        if (dateFilter.date) {
          queryParams.date = dateFilter.date;
        } else if (dateFilter.startDate && dateFilter.endDate) {
          queryParams.startDate = dateFilter.startDate;
          queryParams.endDate = dateFilter.endDate;
        }

        debugLog(`🔄 Fetching para ${barberName}:`, queryParams);

        setLoadingStatus(prev => ({ ...prev, [barberId]: 'fetching_appointments' }));

        const [salesResponse, appointmentsResponse] = await Promise.all([
          salesService.getBarberSalesStats(barberId, queryParams),
          appointmentsService.getBarberAppointmentStats(barberId, queryParams)
        ]);

        setLoadingStatus(prev => ({ ...prev, [barberId]: 'processing' }));

        // Procesar ventas de productos
        let totalProductos = 0;
        let countProductos = 0;
        if (salesResponse.data && Array.isArray(salesResponse.data.ventas)) {
          salesResponse.data.ventas.forEach(v => {
            totalProductos += v.total || 0;
            countProductos += v.totalQuantity || v.count || 0; // Priorizar totalQuantity
          });
        } else if (salesResponse.data && typeof salesResponse.data.total === 'number') {
          totalProductos = salesResponse.data.total;
          countProductos = salesResponse.data.totalQuantity || salesResponse.data.count || 0; // Priorizar totalQuantity
        }

        // Procesar cortes
        let cortesCount = 0;
        let cortesTotal = 0;
        if (salesResponse.data && Array.isArray(salesResponse.data.cortes)) {
          salesResponse.data.cortes.forEach(c => {
            cortesTotal += c.total || 0;
            cortesCount += c.totalQuantity || c.count || 0; // Priorizar totalQuantity
          });
        }

        // Procesar citas
        let totalCitas = 0;
        let completedCitas = 0;
        if (appointmentsResponse.data && Array.isArray(appointmentsResponse.data.citas)) {
          appointmentsResponse.data.citas.forEach(c => {
            totalCitas += c.revenue || c.service?.price || 0;
            completedCitas += c.count || 1;
          });
        } else if (appointmentsResponse.data && typeof appointmentsResponse.data.revenue === 'number') {
          totalCitas = appointmentsResponse.data.revenue;
          completedCitas = appointmentsResponse.data.completed || 1;
        }

        const barberStats = {
          sales: salesResponse.data?.ventas || [],
          appointments: appointmentsResponse.data?.citas || [],
          walkIns: salesResponse.data?.cortes || [],
          totals: {
            sales: totalProductos,
            appointments: totalCitas,
            walkIns: cortesTotal,
            salesCount: countProductos,
            appointmentsCount: completedCitas,
            walkInsCount: cortesCount
          }
        };

        debugLog(`✅ Stats procesadas para ${barberName}:`, barberStats.totals);
        
        // Limpiar estado de loading para este barbero
        setLoadingStatus(prev => ({ ...prev, [barberId]: 'complete' }));
        
        return barberStats;

      } catch (error) {
        console.error(`❌ Error loading stats para ${barberName}:`, error);
        setLoadingStatus(prev => ({ ...prev, [barberId]: 'error' }));
        
        // Retornar datos por defecto en caso de error
        return {
          sales: [],
          appointments: [],
          walkIns: [],
          totals: { sales: 0, appointments: 0, walkIns: 0, salesCount: 0, appointmentsCount: 0, walkInsCount: 0 }
        };
      }
    };

    try {
      // Usar batch processing con cache
      const { results, errors, cacheHits } = await batchProcessingService.processBarbersWithCache(
        barbersData,
        fetchBarberData,
        filterTypeKey,
        startDate,
        endDate
      );

      // Actualizar estadísticas
      setStatistics(results);
      setFilteredStats(results);

      // Limpiar estados de loading
      setTimeout(() => {
        setLoadingStatus({});
      }, 1000);

      // Mostrar estadísticas de rendimiento
      const cacheHitCount = Object.keys(cacheHits).length;
      const errorCount = Object.keys(errors).length;
      
      console.log(`📊 Carga completada - Cache hits: ${cacheHitCount}/${barbersData.length}, Errores: ${errorCount}`);
      
      if (cacheHitCount > 0) {
        showSuccess(`Datos cargados (${cacheHitCount} desde cache)`);
      }

    } catch (error) {
      console.error('❌ Error en loadStatistics optimizado:', error);
      showError('Error al cargar estadísticas');
      setError('Error al cargar estadísticas: ' + error.message);
      
      // Limpiar estados de loading
      setLoadingStatus({});
    }
  }, [showError, showSuccess]);

  // Función debounced para aplicar filtros
  const applyFilterDebounced = useCallback((type, date) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      await applyFilter(type, date);
    }, 300); // 300ms debounce
  }, []);

  // Función principal para aplicar filtros
  const applyFilter = async (type, date) => {
    if (isApplyingFilter) {
      debugLog('⏸️ Filtro ya en proceso, ignorando...');
      return;
    }

    setIsApplyingFilter(true);
    setFilterLoading(true);
    setFilterType(type);
    setFilterDate(date);

    try {
      const dateFilter = {};
      
      if (type === 'Hoy' && date) {
        dateFilter.date = date;
      } else if (type !== 'General' && date) {
        const endDate = new Date(date + 'T12:00:00');
        const startDate = new Date(endDate);
        
        if (type === '7 días') {
          startDate.setDate(endDate.getDate() - 6);
        } else if (type === '15 días') {
          startDate.setDate(endDate.getDate() - 14);
        } else if (type === '30 días') {
          startDate.setDate(endDate.getDate() - 29);
        }
        
        dateFilter.startDate = startDate.toISOString().split('T')[0];
        dateFilter.endDate = endDate.toISOString().split('T')[0];
      }

      console.log(`🎯 Aplicando filtro optimizado: ${type}`, dateFilter);
      await loadStatistics(barbers, dateFilter);

    } catch (error) {
      console.error('❌ Error aplicando filtro:', error);
      showError('Error al aplicar filtro');
    } finally {
      setFilterLoading(false);
      setIsApplyingFilter(false);
    }
  };

  // Cargar datos iniciales
  const loadData = async () => {
    if (isLoadingData) {
      debugLog('⏸️ Datos ya cargándose, ignorando...');
      return;
    }

    setIsLoadingData(true);
    setLoading(true);
    setError('');

    try {
      debugLog('🔄 Cargando datos iniciales...');
      
      // Cargar barberos y fechas disponibles en paralelo
      const [barbersResponse, datesResponse] = await Promise.all([
        barberService.getAllBarbers(),
        availableDatesService.getAllAvailableDates()
      ]);

      const barbersData = barbersResponse.data;
      const datesData = datesResponse.data || [];

      setBarbers(barbersData);
      setAllAvailableDates(datesData);

      // Cargar estadísticas generales (sin filtro de fecha)
      await loadStatistics(barbersData);

      // Iniciar precarga de filtros comunes
      batchProcessingService.preloadCommonFilters(barbersData, async (barber) => {
        // Función de fetch simplificada para precarga
        const queryParams = { date: new Date().toISOString().split('T')[0] };
        
        const [salesResponse, appointmentsResponse] = await Promise.all([
          salesService.getBarberSalesStats(barber._id, queryParams),
          appointmentsService.getBarberAppointmentStats(barber._id, queryParams)
        ]);

        return {
          sales: salesResponse.data?.ventas || [],
          appointments: appointmentsResponse.data?.citas || [],
          walkIns: salesResponse.data?.cortes || [],
          totals: { sales: 0, appointments: 0, walkIns: 0 }
        };
      });

      debugLog('✅ Datos iniciales cargados exitosamente');

    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      setError('Error al cargar datos: ' + error.message);
      showError('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
      setIsLoadingData(false);
    }
  };

  // Función para generar reportes
  const generateReport = async (barberId, date = null) => {
    setLoadingReport(true);
    setSelectedBarber(barberId);
    try {
      const reportDate = date || new Date().toISOString().split('T')[0];
      const salesResponse = await salesService.getDailyReport(reportDate, barberId);
      
      debugLog('🔍 Respuesta del servidor:', salesResponse);
      
      const barber = barbers.find(b => b._id === barberId);
      const responseData = salesResponse?.data || salesResponse;
      
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

  // Función para limpiar cache
  const clearCache = useCallback(() => {
    cacheService.clear();
    showSuccess('Cache limpiado');
  }, [showSuccess]);

  // Función para obtener estadísticas de rendimiento
  const getPerformanceStats = useCallback(() => {
    return {
      cache: cacheService.getStats(),
      batchProcessing: batchProcessingService.getStats(),
      loadingStatus
    };
  }, [loadingStatus]);

  // Inicializar datos al montar el hook
  useEffect(() => {
    loadData();
    
    // Limpiar timeouts al desmontar
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Estados principales
    barbers,
    statistics,
    filteredStats,
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
    
    // Estados de progreso
    loadingStatus,
    
    // Funciones principales
    loadData,
    loadStatistics,
    applyFilter: applyFilterDebounced, // Función debounced
    generateReport,
    
    // Funciones de optimización
    clearCache,
    getPerformanceStats,
    
    // Flags de estado
    isLoadingData,
    isApplyingFilter
  };
};
