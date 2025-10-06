import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { barberService, salesService, appointmentsService } from '../services/api';
import { availableDatesService } from '../services/availableDatesService';
import { useNotification } from '../contexts/NotificationContext';
import cacheService from '../services/cacheService';
import batchProcessingService from '../services/batchProcessingService';

import logger from '../utils/logger';
// Configuración de logging - cambiar a false para reducir logs en producción
const DEBUG_LOGS = true; // Activado temporalmente para debug

// Función helper para logs condicionales
const debugLog = (message, ...args) => {
  if (DEBUG_LOGS) {
    logger.debug(message, ...args);
  }
};

/**
 * Hook optimizado para manejar estadísticas y datos de barberos
 * INCLUYE: Cache local, batching, debounce, precarga inteligente
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
    if (!allAvailableDates || !Array.isArray(allAvailableDates)) {
      debugLog('🚨 sortedAvailableDates: allAvailableDates no válido:', allAvailableDates);
      return [];
    }
    const result = allAvailableDates.sort((a, b) => new Date(b) - new Date(a));
    debugLog('📅 sortedAvailableDates calculado:', result.length, 'fechas', result.slice(0, 3));
    return result;
  }, [allAvailableDates]);

  // Función optimizada para cargar estadísticas con cache y batching
  const loadStatistics = useCallback(async (barbersData, dateFilter = {}) => {
    // Verificar que barbersData sea válido
    if (!barbersData || !Array.isArray(barbersData) || barbersData.length === 0) {
      debugLog('⚠️ barbersData está vacío o no es válido:', barbersData);
      setStatistics({});
      setFilteredStats({});
      return;
    }
    
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
          // Arrays para reportes detallados
          salesArray: salesResponse.data?.ventas || [],
          appointmentsArray: appointmentsResponse.data?.citas || [],
          walkInsArray: salesResponse.data?.cortes || [],
          
          // Objetos con totales para las cards
          sales: {
            total: totalProductos,
            count: countProductos,
            totalQuantity: countProductos // Agregar totalQuantity para compatibilidad
          },
          appointments: {
            total: totalCitas,
            completed: completedCitas,
            count: completedCitas
          },
          cortes: {
            total: cortesTotal,
            count: cortesCount,
            totalQuantity: cortesCount // Agregar totalQuantity para compatibilidad
          },
          
          // Totales legacy (mantener por compatibilidad)
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
          salesArray: [],
          appointmentsArray: [],
          walkInsArray: [],
          sales: { total: 0, count: 0 },
          appointments: { total: 0, completed: 0, count: 0 },
          cortes: { total: 0, count: 0 },
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

      // Debug temporal - ver qué devuelve el batch processing
      logger.debug('🔍 Resultados del batch processing completados:', {
        resultsCount: Object.keys(results).length,
        filterTypeKey
      });

      // Actualizar estadísticas
      if (filterTypeKey === 'General') {
        // Para filtro general, solo actualizar statistics
        logger.debug('🔍 ACTUALIZANDO STATISTICS GENERAL:', {
          resultsKeys: Object.keys(results),
          sampleResult: Object.values(results)[0]
        });
        setStatistics(results);
        setFilteredStats({}); // Limpiar filtros cuando es General
      } else {
        // Para filtros específicos, mantener statistics general y actualizar filteredStats
        logger.debug('🔍 ACTUALIZANDO FILTERED STATS:', {
          filterTypeKey,
          resultsKeys: Object.keys(results)
        });
        setFilteredStats(results);
      }

      // Limpiar estados de loading inmediatamente después de procesar
      setLoadingStatus({});

      // Mostrar estadísticas de rendimiento
      const cacheHitCount = Object.keys(cacheHits).length;
      const errorCount = Object.keys(errors).length;
      
      logger.debug(`📊 Carga completada - Cache hits: ${cacheHitCount}/${barbersData.length}, Errores: ${errorCount}`);
      
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
  const applyFilterDebounced = useCallback((type, date, barbersOverride = null) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      await applyFilter(type, date, barbersOverride);
    }, 300); // 300ms debounce
  }, []);

  // Función principal para aplicar filtros
  const applyFilter = async (type, date, barbersOverride = null) => {
    logger.debug('🎯 [useBarberStats] APLICANDO FILTRO:', { type, date, isApplyingFilter });
    logger.debug('🔍 [useBarberStats] PARÁMETROS RECIBIDOS:', { 
      type, 
      date, 
      barbersOverrideLength: barbersOverride?.length || 0,
      barbersOverridePassed: barbersOverride !== null,
      barbersOverrideData: barbersOverride
    });
    
    if (isApplyingFilter) {
      debugLog('⏸️ Filtro ya en proceso, ignorando...');
      return;
    }

    logger.debug('🎯 [useBarberStats] INICIANDO APLICACIÓN DE FILTRO:', type);
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

      logger.debug(`🎯 Aplicando filtro optimizado: ${type}`, dateFilter);
      
      // Usar barbersOverride si se proporciona, sino usar barbers del estado
      const barbersToUse = barbersOverride || barbers;
      logger.debug('👥 BARBEROS A USAR - DETALLE:', { 
        barbersOverride: barbersOverride?.length || 0, 
        barbersState: barbers?.length || 0,
        using: barbersToUse?.length || 0,
        barbersOverrideData: barbersOverride?.map(b => b.user?.name || b.name) || [],
        barbersStateData: barbers?.map(b => b.user?.name || b.name) || []
      });
      
      await loadStatistics(barbersToUse, dateFilter);
      logger.debug('✅ [useBarberStats] FILTRO APLICADO EXITOSAMENTE:', type);

    } catch (error) {
      console.error('❌ Error aplicando filtro:', error);
      showError('Error al aplicar filtro');
    } finally {
      logger.debug('🏁 [useBarberStats] FINALIZANDO APLICACIÓN DE FILTRO:', type);
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

    // Timeout de seguridad solo para esta carga específica
    const loadingTimeoutId = setTimeout(() => {
      console.warn('⏰ Timeout de carga alcanzado para loadData');
      setLoading(false);
      setIsLoadingData(false);
      setError('La carga de datos tardó demasiado tiempo');
    }, 20000);

    try {
      debugLog('🔄 Cargando datos iniciales...');
      
      // Cargar barberos y fechas disponibles en paralelo
      const [barbersResponse, datesResponse] = await Promise.all([
        barberService.getAllBarbers(),
        availableDatesService.getAllAvailableDates()
      ]);

      const barbersData = barbersResponse.data || [];
      const datesData = datesResponse; // El servicio devuelve directamente el array, no .data
      
      debugLog('📅 FECHAS RECIBIDAS:', { datesResponse, datesData: datesData?.length || 0 });

      setBarbers(barbersData);
      setAllAvailableDates(datesData);

      if (barbersData.length > 0) {
        // Cargar estadísticas generales (sin filtro de fecha)
        await loadStatistics(barbersData);

        // PRECARGA DESACTIVADA TEMPORALMENTE para evitar rate limiting
        // setTimeout(() => {
        //   batchProcessingService.preloadCommonFilters(barbersData, async (barber) => {
        //     const queryParams = { date: new Date().toISOString().split('T')[0] };
        //     
        //     const [salesResponse, appointmentsResponse] = await Promise.all([
        //       salesService.getBarberSalesStats(barber._id, queryParams),
        //       appointmentsService.getBarberAppointmentStats(barber._id, queryParams)
        //     ]);

        //     return {
        //       sales: salesResponse.data?.ventas || [],
        //       appointments: appointmentsResponse.data?.citas || [],
        //       walkIns: salesResponse.data?.cortes || [],
        //       totals: { sales: 0, appointments: 0, walkIns: 0 }
        //     };
        //   });
        // }, 100);
      }

      debugLog('✅ Datos iniciales cargados exitosamente');

    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      setError('Error al cargar datos: ' + error.message);
      showError('Error al cargar datos del dashboard');
    } finally {
      clearTimeout(loadingTimeoutId); // Cancelar timeout
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
  
  // Debug final: verificar qué se está retornando
  debugLog('🔍 HOOK RETURN - sortedAvailableDates:', result.sortedAvailableDates?.length || 0);
  
  return result;
};

