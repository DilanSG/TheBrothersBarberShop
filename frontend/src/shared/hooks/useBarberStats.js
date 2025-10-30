import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { barberService, salesService, appointmentsService } from '../services/api';
import { availableDatesService } from '../services/availableDatesService';
import { useNotification } from '../contexts/NotificationContext';
import { getCurrentDateColombia } from '../utils/dateUtils';
import cacheService from '../services/cacheService';
import batchProcessingService from '../services/batchProcessingService';

import logger from '../utils/logger';
// Configuraci�n de logging - cambiar a false para reducir logs en producci�n
const DEBUG_LOGS = true; // Activado temporalmente para debug

// Funci�n helper para logs condicionales
const debugLog = (message, ...args) => {
  if (DEBUG_LOGS) {
    logger.debug(message, ...args);
  }
};

/**
 * Hook optimizado para manejar estad�sticas y datos de barberos
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
  
  // Estados de reportes
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState(null);
  
  // Ref para debounce
  const debounceTimeoutRef = useRef(null);

  // Memo para obtener los d�as disponibles globales (ordenados)
  const sortedAvailableDates = useMemo(() => {
    if (!allAvailableDates || !Array.isArray(allAvailableDates)) {
      debugLog('?? sortedAvailableDates: allAvailableDates no v�lido:', allAvailableDates);
      return [];
    }
    const result = allAvailableDates.sort((a, b) => new Date(b) - new Date(a));
    debugLog('?? sortedAvailableDates calculado:', result.length, 'fechas', result.slice(0, 3));
    return result;
  }, [allAvailableDates]);

  // Funci�n optimizada para cargar estad�sticas con cache y batching
  const loadStatistics = useCallback(async (barbersData, dateFilter = {}) => {
    // Verificar que barbersData sea v�lido
    if (!barbersData || !Array.isArray(barbersData) || barbersData.length === 0) {
      debugLog('?? barbersData est� vac�o o no es v�lido:', barbersData);
      setStatistics({});
      setFilteredStats({});
      return;
    }
    
    logger.debug('?????? ============================================');
    logger.debug('??? [loadStatistics] INICIO');
    logger.debug('?? dateFilter recibido:', JSON.stringify(dateFilter, null, 2));
    logger.debug('?? barbersData count:', barbersData?.length || 0);
    
    // Determinar el tipo de filtro y fechas
    let filterTypeKey = 'General';
    let startDate = '';
    let endDate = '';
    
    logger.debug('?? Determinando tipo de filtro...');
    
    if (dateFilter.date) {
      filterTypeKey = 'Hoy';
      startDate = endDate = dateFilter.date;
      logger.debug('?? ? Tipo: HOY - date:', dateFilter.date);
    } else if (dateFilter.startDate && dateFilter.endDate) {
      startDate = dateFilter.startDate;
      endDate = dateFilter.endDate;
      
      logger.debug('?? Rango detectado:', { startDate, endDate });
      
      // Determinar tipo basado en rango de fechas
      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      
      logger.debug('?? D�as en el rango:', daysDiff);
      
      if (daysDiff <= 1) filterTypeKey = 'Hoy';
      else if (daysDiff <= 7) filterTypeKey = '7 d�as';
      else if (daysDiff <= 15) filterTypeKey = '15 d�as';
      else if (daysDiff <= 30) filterTypeKey = '30 d�as';
      else filterTypeKey = 'Personalizado';
      
      logger.debug('?? ? Tipo determinado:', filterTypeKey);
    } else {
      logger.debug('?? ? Tipo: GENERAL (sin fechas)');
    }
    
    logger.debug('?????? ============================================');
    logger.debug('?? RESUMEN ANTES DE FETCH:');
    logger.debug('?? filterTypeKey:', filterTypeKey);
    logger.debug('?? startDate:', startDate);
    logger.debug('?? endDate:', endDate);
    logger.debug('?????? ============================================');

    // Funci�n para fetch individual de barbero
    const fetchBarberData = async (barber) => {
      const barberId = barber._id;
      const barberName = barber.user?.name || barberId;
      
      try {
        const queryParams = {};
        if (dateFilter.date) {
          queryParams.date = dateFilter.date;
          logger.debug('?? QueryParams (Hoy):', queryParams);
        } else if (dateFilter.startDate && dateFilter.endDate) {
          queryParams.startDate = dateFilter.startDate;
          queryParams.endDate = dateFilter.endDate;
          logger.debug('?????? ============================================');
          logger.debug('?? QueryParams (RANGO) para', barberName);
          logger.debug('?? startDate:', queryParams.startDate);
          logger.debug('?? endDate:', queryParams.endDate);
          logger.debug('?? QueryParams completo:', JSON.stringify(queryParams, null, 2));
          logger.debug('?????? ============================================');
        } else {
          logger.debug('?? QueryParams (General - SIN FILTRO):', queryParams);
        }

        debugLog(`?? Fetching para ${barberName}:`, queryParams);

        const [salesResponse, appointmentsResponse] = await Promise.all([
          salesService.getBarberSalesStats(barberId, queryParams),
          appointmentsService.getBarberAppointmentStats(barberId, queryParams)
        ]);

        // 🔍 DEBUG: Ver respuestas crudas de la API
        console.log(`🔍 [${barberName}] salesResponse:`, JSON.stringify(salesResponse, null, 2));
        console.log(`🔍 [${barberName}] appointmentsResponse:`, JSON.stringify(appointmentsResponse, null, 2));

        // Procesar ventas de productos - VALIDACI�N DEFENSIVA
        let totalProductos = 0;
        let countProductos = 0;
        const ventasArray = salesResponse?.data?.ventas;
        if (ventasArray && Array.isArray(ventasArray)) {
          ventasArray.forEach(v => {
            totalProductos += v.total || 0;
            countProductos += v.totalQuantity || v.count || 0; // Priorizar totalQuantity
          });
        } else if (salesResponse?.data && typeof salesResponse.data.total === 'number') {
          totalProductos = salesResponse.data.total;
          countProductos = salesResponse.data.totalQuantity || salesResponse.data.count || 0; // Priorizar totalQuantity
        }

        // Procesar cortes - VALIDACI�N DEFENSIVA
        let cortesCount = 0;
        let cortesTotal = 0;
        const cortesArray = salesResponse?.data?.cortes;
        if (cortesArray && Array.isArray(cortesArray)) {
          cortesArray.forEach(c => {
            cortesTotal += c.total || 0;
            cortesCount += c.totalQuantity || c.count || 0; // Priorizar totalQuantity
          });
        }

        // Procesar citas - VALIDACI�N DEFENSIVA
        let totalCitas = 0;
        let completedCitas = 0;
        const citasArray = appointmentsResponse?.data?.citas;
        if (citasArray && Array.isArray(citasArray)) {
          citasArray.forEach(c => {
            totalCitas += c.revenue || c.service?.price || 0;
            completedCitas += c.count || 0; // FIX: cambiar 1 por 0
          });
        } else if (appointmentsResponse?.data && typeof appointmentsResponse.data.revenue === 'number') {
          totalCitas = appointmentsResponse.data.revenue;
          completedCitas = appointmentsResponse.data.completed || 0; // FIX: cambiar 1 por 0
        }

        const barberStats = {
          // Arrays para reportes detallados - GARANTIZAR ARRAYS
          salesArray: Array.isArray(salesResponse?.data?.ventas) ? salesResponse.data.ventas : [],
          appointmentsArray: Array.isArray(appointmentsResponse?.data?.citas) ? appointmentsResponse.data.citas : [],
          walkInsArray: Array.isArray(salesResponse?.data?.cortes) ? salesResponse.data.cortes : [],
          
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

        console.log(` Stats procesadas para ${barberName}:`, JSON.stringify(barberStats, null, 2));
        
        
        return barberStats;

      } catch (error) {
        console.error(`? Error loading stats para ${barberName}:`, error);
        
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

      // Debug temporal - ver qu� devuelve el batch processing
      logger.debug('?? Resultados del batch processing completados:', {
        resultsCount: Object.keys(results).length,
        filterTypeKey
      });

      // Actualizar estad�sticas
      if (filterTypeKey === 'General') {
        // Para filtro general, solo actualizar statistics
        logger.debug('?? ACTUALIZANDO STATISTICS GENERAL:', {
          resultsKeys: Object.keys(results),
          sampleResult: Object.values(results)[0]
        });
        setStatistics(results);
        setFilteredStats({}); // Limpiar filtros cuando es General
      } else {
        // Para filtros espec�ficos, mantener statistics general y actualizar filteredStats
        logger.debug('?? ACTUALIZANDO FILTERED STATS:', {
          filterTypeKey,
          resultsKeys: Object.keys(results)
        });
        setFilteredStats(results);
      }

      // Mostrar estadísticas de rendimiento
      const cacheHitCount = Object.keys(cacheHits).length;
      const errorCount = Object.keys(errors).length;
      
      logger.debug(`📊 Carga completada - Cache hits: ${cacheHitCount}/${barbersData.length}, Errores: ${errorCount}`);

    } catch (error) {
      console.error('? Error en loadStatistics optimizado:', error);
      showError('Error al cargar estad�sticas');
      setError('Error al cargar estad�sticas: ' + error.message);
    }
  }, [showError, showSuccess]);

  // Funci�n debounced para aplicar filtros
  const applyFilterDebounced = useCallback((type, date, barbersOverride = null, customStartDate = null) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      await applyFilter(type, date, barbersOverride, customStartDate);
    }, 300); // 300ms debounce
  }, []);

  // Funci�n principal para aplicar filtros
  const applyFilter = async (type, date, barbersOverride = null, customStartDate = null) => {
    logger.debug('?????? ============================================');
    logger.debug('???? [useBarberStats] INICIO applyFilter');
    logger.debug('🔥 PARÁMETROS COMPLETOS:', { 
      type, 
      date, 
      customStartDate,
      barbersOverrideLength: barbersOverride?.length || 0,
      barbersOverridePassed: barbersOverride !== null
    });
    logger.debug('?? customStartDate presente?', customStartDate !== null);
    logger.debug('?? customStartDate valor:', customStartDate);
    logger.debug('?????? ============================================');
    
    

    logger.debug('?? [useBarberStats] INICIANDO APLICACI�N DE FILTRO:', type);
    
    setLoading(true);
    setFilterType(type);
    setFilterDate(date);

    try {
      const dateFilter = {};
      
      logger.debug('?? CONSTRUYENDO dateFilter...');
      logger.debug('?? Tipo de filtro:', type);
      
      if (type === 'Hoy' && date) {
        dateFilter.date = date;
        logger.debug('? Filtro HOY configurado:', dateFilter);
      } else if (type === 'Personalizado' && customStartDate && date) {
        // ? NUEVO: Manejar rangos personalizados con fechas exactas
        dateFilter.startDate = customStartDate;
        dateFilter.endDate = date;
        logger.debug('????? ============================================');
        logger.debug('?? FILTRO PERSONALIZADO CONFIGURADO:');
        logger.debug('? startDate:', customStartDate);
        logger.debug('? endDate:', date);
        logger.debug('? dateFilter completo:', dateFilter);
        logger.debug('?????? ============================================');
      } else if (type !== 'General' && date) {
        logger.debug('?? Configurando filtro de rango predefinido:', type);
        const endDate = new Date(date + 'T12:00:00');
        const startDate = new Date(endDate);
        
        if (type === '7 d�as') {
          startDate.setDate(endDate.getDate() - 6);
        } else if (type === '15 d�as') {
          startDate.setDate(endDate.getDate() - 14);
        } else if (type === '30 d�as') {
          startDate.setDate(endDate.getDate() - 29);
        }
        
        dateFilter.startDate = startDate.toISOString().split('T')[0];
        dateFilter.endDate = endDate.toISOString().split('T')[0];
        logger.debug('? Filtro RANGO PREDEFINIDO configurado:', dateFilter);
      } else {
        logger.debug('?? Sin filtro de fecha (General)');
      }

      logger.debug('?????? ============================================');
      logger.debug(`?? FILTRO FINAL A APLICAR: ${type}`);
      logger.debug('?? dateFilter que se enviar� al backend:', JSON.stringify(dateFilter, null, 2));
      logger.debug('?????? ============================================');
      
      // Usar barbersOverride si se proporciona, sino usar barbers del estado
      const barbersToUse = barbersOverride || barbers;
      logger.debug('?? BARBEROS A USAR - DETALLE:', { 
        barbersOverride: barbersOverride?.length || 0, 
        barbersState: barbers?.length || 0,
        using: barbersToUse?.length || 0,
        barbersOverrideData: barbersOverride?.map(b => b.user?.name || b.name) || [],
        barbersStateData: barbers?.map(b => b.user?.name || b.name) || []
      });
      
      await loadStatistics(barbersToUse, dateFilter);
      logger.debug('? [useBarberStats] FILTRO APLICADO EXITOSAMENTE:', type);

    } catch (error) {
      console.error('? Error aplicando filtro:', error);
      showError('Error al aplicar filtro');
    } finally {
      logger.debug('?? [useBarberStats] FINALIZANDO APLICACI�N DE FILTRO:', type);
      setLoading(false);
      
    }
  };

  // Cargar datos iniciales
  const loadData = async () => {
    setLoading(true);
    setError('');

    // Timeout de seguridad solo para esta carga específica
    const loadingTimeoutId = setTimeout(() => {
      console.warn('⏱ Timeout de carga alcanzado para loadData');
      setLoading(false);
      
      setError('La carga de datos tardó demasiado tiempo');
    }, 20000);

    try {
      debugLog('?? Cargando datos iniciales...');
      
      // Cargar barberos y fechas disponibles en paralelo
      const [barbersResponse, datesResponse] = await Promise.all([
        barberService.getAllBarbers(),
        availableDatesService.getAllAvailableDates()
      ]);

      // Validaci�n defensiva: asegurar que barbersData sea un array
      let barbersData = barbersResponse.data || [];
      if (!Array.isArray(barbersData)) {
        // Si data es un objeto con una propiedad que contiene el array (ej: { barbers: [...] })
        barbersData = barbersData.barbers || barbersData.data || [];
      }
      // Si a�n no es array, usar array vac�o
      if (!Array.isArray(barbersData)) {
        debugLog('?? barbersResponse.data NO es array:', barbersData);
        barbersData = [];
      }
      
      const datesData = datesResponse; // El servicio devuelve directamente el array, no .data
      
      debugLog('?? FECHAS RECIBIDAS:', { datesResponse, datesData: datesData?.length || 0 });

      setBarbers(barbersData);
      setAllAvailableDates(datesData);

      if (barbersData.length > 0) {
        // Cargar estad�sticas generales (sin filtro de fecha)
        await loadStatistics(barbersData);

        // PRECARGA DESACTIVADA TEMPORALMENTE para evitar rate limiting
        // setTimeout(() => {
        //   batchProcessingService.preloadCommonFilters(barbersData, async (barber) => {
        //     const queryParams = { date: getCurrentDateColombia() };
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

      debugLog('? Datos iniciales cargados exitosamente');

    } catch (error) {
      console.error('? Error cargando datos:', error);
      setError('Error al cargar datos: ' + error.message);
      showError('Error al cargar datos del dashboard');
    } finally {
      clearTimeout(loadingTimeoutId); // Cancelar timeout
      setLoading(false);
      
    }
  };

  // Funci�n para generar reportes
  const generateReport = async (barberId, date = null) => {
    setLoadingReport(true);
    setSelectedBarber(barberId);
    try {
      const reportDate = date || getCurrentDateColombia();
      const salesResponse = await salesService.getDailyReport(reportDate, barberId);
      
      debugLog('?? Respuesta del servidor:', salesResponse);
      
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

  // Funci�n para limpiar cache
  const clearCache = useCallback(() => {
    cacheService.clear();
    showSuccess('Cache limpiado');
  }, [showSuccess]);

  // Funci�n para obtener estad�sticas de rendimiento
  const getPerformanceStats = useCallback(() => {
    return {
      cache: cacheService.getStats(),
      batchProcessing: batchProcessingService.getStats()
    };
  }, []);

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
    
    // Estados de reportes
    reportData,
    loadingReport,
    selectedBarber,
    
    // Funciones principales
    loadData,
    loadStatistics,
    applyFilter: applyFilterDebounced, // Funci�n debounced
    generateReport,
    
    // Funciones de optimizaci�n
    clearCache,
    getPerformanceStats
  };
};



