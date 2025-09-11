import { useState, useEffect, useMemo } from 'react';
import { barberService, salesService, appointmentsService } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

// Configuración de logging - cambiar a false para reducir logs en producción
const DEBUG_LOGS = true; // Activado para debugging - problema con filtros

// Función helper para logs condicionales
const debugLog = (message, ...args) => {
  if (DEBUG_LOGS) {
    console.log(message, ...args);
  }
};

/**
 * Hook personalizado para manejar estadísticas y datos de barberos
 * Gestiona la carga de datos, filtros y generación de reportes
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
  const [globalAvailableDates, setGlobalAvailableDates] = useState([]);
  const [availableDates, setAvailableDates] = useState({});
  const [filterType, setFilterType] = useState('General');
  const [filterDate, setFilterDate] = useState('');
  const [filterLoading, setFilterLoading] = useState(false);
  
  // Estados de reportes
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState(null);

  // Memo para obtener los días disponibles globales (para el filtro general)
  const allAvailableDates = useMemo(() => {
    return globalAvailableDates.sort((a, b) => new Date(b) - new Date(a));
  }, [globalAvailableDates]);

  // Cargar fechas globales de ventas e inventario al inicio
  useEffect(() => {
    const loadGlobalDates = async () => {
      try {
        // Cargar todas las fechas con datos de ventas
        const salesResponse = await salesService.getAvailableDates();
        const salesDates = salesResponse?.data || [];
        
        // También incluir fechas de citas si hay endpoint global
        let appointmentDates = [];
        try {
          // Nota: Por ahora no hay endpoint global de citas, usar array vacío
          // const appointmentResponse = await appointmentsService.getAvailableDates();
          // appointmentDates = appointmentResponse?.data || [];
        } catch (e) {
          appointmentDates = [];
        }
        
        // ELIMINADO: inventoryService.getAvailableDates no existe
        // Solo usar fechas de ventas y citas
        const allDates = [...new Set([
          ...salesDates,
          ...appointmentDates
        ])].filter(date => date && date.trim() !== '').sort((a, b) => new Date(b) - new Date(a));
        
        debugLog('📅 Fechas disponibles cargadas:', allDates);
        setGlobalAvailableDates(allDates);
        
      } catch (err) {
        console.error('Error cargando fechas globales:', err);
        setGlobalAvailableDates([]);
      }
    };
    loadGlobalDates();
  }, []);

  // Efecto para filtrar estadísticas cuando cambia el filtro
  useEffect(() => {
    debugLog('🔄 Aplicando filtro:', filterType, filterDate, 'Barbers:', barbers.length);
    
    if (filterType === 'General' || !filterDate) {
      debugLog('📋 Usando estadísticas generales - limpiando filtros');
      setFilteredStats({});  // Limpiar filtros cuando es general
      setFilterLoading(false);
      return;
    }
    
    if (barbers.length === 0) {
      debugLog('⚠️ No hay barberos para filtrar');
      return;
    }
    
    // Evitar ejecutar si ya hay una operación de filtrado en progreso
    if (filterLoading) {
      debugLog('⏳ Filtrado ya en progreso, saltando...');
      return;
    }
    
    debugLog('🎯 Ejecutando filtrado por tipo:', filterType, 'fecha base:', filterDate);
    filtrarPorRango();
    // eslint-disable-next-line
  }, [filterType, filterDate, barbers]);

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

  // Filtrar estadísticas por fecha/período específico
  const filtrarPorRango = async () => {
    if (!filterDate || filterType === 'General') {
      setFilteredStats({});
      setFilterLoading(false);
      return;
    }
    
    setFilterLoading(true);
    console.log(`🔍 INICIANDO FILTRO: ${filterType} - ${filterDate}`);
    
    if (filterType === 'Día') {
      // Para día específico, usar la versión alternativa que funciona con endpoints disponibles
      await filtrarPorFechaEspecificaAlternativa(filterDate);
    } else {
      // Para semana/mes, usar el filtrado por rango
      await filtrarPorRangoMultiple();
    }
    
    console.log(`✅ FILTRO COMPLETADO: ${filterType} - ${filterDate}`);
  };

  // Filtrar por día específico (versión alternativa - filtra desde datos existentes)
  const filtrarPorFechaEspecificaAlternativa = async (dateStr) => {
    console.log('📅 FILTRO DIARIO ALTERNATIVO - Filtrando desde datos existentes:', dateStr);
    setFilterLoading(true);
    const newStats = {};
    
    for (const barber of barbers) {
      try {
        console.log(`📊 Procesando día ${dateStr} para barbero ${barber.user?.name || barber._id}...`);
        
        // Inicializar con valores vacíos para el día específico
        newStats[barber._id] = {
          sales: { total: 0, count: 0 },
          cortes: { count: 0, total: 0 },
          appointments: { completed: 0, total: 0 },
        };
        
        // Intentar obtener datos específicos del día desde el backend
        try {
          const [salesResp, appointmentsResp] = await Promise.all([
            salesService.getDailyReport(dateStr, barber._id),
            appointmentsService.getDailyReport(dateStr, barber._id)
          ]);
          
          console.log(`� Datos del día para ${barber.user?.name}:`, {
            ventas: salesResp,
            citas: appointmentsResp
          });
          
          // Procesar ventas del día
          if (salesResp?.success && salesResp?.data) {
            let totalVentas = 0;
            let countVentas = 0;
            let totalCortes = 0;
            let countCortes = 0;
            
            if (Array.isArray(salesResp.data)) {
              salesResp.data.forEach(sale => {
                if (sale.type === 'product') {
                  totalVentas += sale.total || 0;
                  countVentas += 1;
                } else if (sale.type === 'walkIn' || sale.type === 'corte') {
                  totalCortes += sale.total || 0;
                  countCortes += 1;
                }
              });
            } else if (salesResp.data.total !== undefined) {
              totalVentas = salesResp.data.total || 0;
              countVentas = salesResp.data.count || 0;
            }
            
            newStats[barber._id].sales = { total: totalVentas, count: countVentas };
            newStats[barber._id].cortes = { count: countCortes, total: totalCortes };
            
            console.log(`💰 Ventas del día ${dateStr}:`, { totalVentas, countVentas, totalCortes, countCortes });
          }
          
          // Procesar citas del día
          if (appointmentsResp?.success && appointmentsResp?.data) {
            let totalCitas = 0;
            let countCitas = 0;
            
            if (Array.isArray(appointmentsResp.data)) {
              appointmentsResp.data.forEach(apt => {
                totalCitas += apt.total || apt.service?.price || 0;
                if (apt.status === 'completed') {
                  countCitas += 1;
                }
              });
            } else if (appointmentsResp.data.total !== undefined) {
              totalCitas = appointmentsResp.data.total || 0;
              countCitas = appointmentsResp.data.completed || 0;
            }
            
            newStats[barber._id].appointments = { completed: countCitas, total: totalCitas };
            console.log(`📅 Citas del día ${dateStr}:`, { totalCitas, countCitas });
          }
          
        } catch (apiError) {
          console.warn(`⚠️ Error obteniendo datos del día ${dateStr} para ${barber.user?.name}:`, apiError.message);
          // Mantener valores en 0 si no hay datos disponibles para ese día
        }
        
        console.log(`✅ FINAL día ${dateStr} para ${barber.user?.name}:`, newStats[barber._id]);
        
      } catch (error) {
        console.error(`❌ Error processing day ${dateStr} for barber ${barber._id}:`, error);
      }
    }
    
    console.log('📊 RESULTADO FINAL - Estadísticas del día:', newStats);
    setFilteredStats(newStats);
    setFilterLoading(false);
  };

  // Función para filtrar por rango (semana/mes) - CORREGIDA
  const filtrarPorRangoMultiple = async () => {
    if (!barbers || barbers.length === 0) return;
    
    setFilterLoading(true);
    
    // Obtener fechas válidas para el rango - LIMITADO a fechas con datos reales
    const validDates = getDateRange(filterType, filterDate);
    debugLog(`📅 Procesando ${filterType} - Fechas válidas:`, validDates);
    
    if (validDates.length === 0) {
      debugLog('❌ No hay fechas válidas para el rango, mostrando estadísticas vacías');
      const emptyStats = {};
      barbers.forEach(barber => {
        emptyStats[barber._id] = {
          sales: { total: 0, count: 0 },
          cortes: { count: 0, total: 0 },
          appointments: { completed: 0, total: 0 },
        };
      });
      setFilteredStats(emptyStats);
      setFilterLoading(false);
      return;
    }
    
    const newStats = {};
    
    for (const barber of barbers) {
      try {
        debugLog(`📊 Procesando ${filterType} para barbero ${barber.user?.name || barber._id}...`);
        
        let totalVentas = 0;
        let countVentas = 0;
        let totalCortes = 0;
        let countCortes = 0;
        let totalCitas = 0;
        let countCitas = 0;
        
        // Iterar sobre cada fecha válida del rango - EVITAR DUPLICACIÓN
        for (const dateStr of validDates) {
          try {
            debugLog(`📅 Procesando fecha ${dateStr} para ${barber.user?.name}...`);
            
            // Obtener datos para UNA SOLA fecha del rango
            const [salesResp, appointmentsResp] = await Promise.all([
              salesService.getBarberSalesStats(barber._id, { date: dateStr }),
              appointmentsService.getBarberAppointmentStats(barber._id, { date: dateStr })
            ]);
            
            // Procesar ventas para esta fecha ESPECÍFICA
            if (salesResp?.success && salesResp?.data) {
              const salesData = salesResp.data;
              
              // Productos vendidos
              if (salesData.ventas && Array.isArray(salesData.ventas)) {
                salesData.ventas.forEach(v => {
                  totalVentas += v.total || 0;
                  countVentas += 1;
                });
              }
              
              // Cortes
              if (salesData.cortes && Array.isArray(salesData.cortes)) {
                salesData.cortes.forEach(c => {
                  totalCortes += c.total || 0;
                  countCortes += 1;
                });
              }
              
              // Totales directos si están disponibles (SIN duplicar)
              if (salesData.total !== undefined && !salesData.ventas) {
                totalVentas += salesData.total;
              }
              if (salesData.cortesTotal !== undefined && !salesData.cortes) {
                totalCortes += salesData.cortesTotal;
              }
              
              debugLog(`💰 ${dateStr} - Ventas: ${salesData.total || 0}, Cortes: ${salesData.cortesTotal || 0}`);
            }
            
            // Procesar citas para esta fecha ESPECÍFICA
            if (appointmentsResp?.success && appointmentsResp?.data) {
              const appointmentData = appointmentsResp.data;
              
              if (appointmentData.citas && Array.isArray(appointmentData.citas)) {
                appointmentData.citas.forEach(c => {
                  totalCitas += c.revenue || c.service?.price || 0;
                  if (c.status === 'completed') {
                    countCitas += 1;
                  }
                });
              }
              
              // Totales directos si están disponibles (SIN duplicar)
              if (appointmentData.revenue !== undefined && !appointmentData.citas) {
                totalCitas += appointmentData.revenue;
              }
              if (appointmentData.completed !== undefined && !appointmentData.citas) {
                countCitas += appointmentData.completed;
              }
              
              debugLog(`📅 ${dateStr} - Citas: ${appointmentData.revenue || 0}, Completadas: ${appointmentData.completed || 0}`);
            }
            
          } catch (dateError) {
            debugLog(`⚠️ Error procesando fecha ${dateStr} para barbero ${barber._id}:`, dateError.message);
          }
        }
        
        newStats[barber._id] = {
          sales: { total: totalVentas, count: countVentas },
          cortes: { count: countCortes, total: totalCortes },
          appointments: { completed: countCitas, total: totalCitas },
        };
        
        debugLog(`✅ TOTAL ${filterType} para ${barber.user?.name}:`, 
          `Ventas: ${totalVentas}, Cortes: ${totalCortes}, Citas: ${totalCitas}`, 
          `Fechas procesadas: ${validDates.length}`);
        
      } catch (error) {
        console.error(`❌ Error procesando ${filterType} para barbero ${barber._id}:`, error);
        newStats[barber._id] = {
          sales: { total: 0, count: 0 },
          cortes: { count: 0, total: 0 },
          appointments: { completed: 0, total: 0 },
        };
      }
    }
    
    debugLog(`📊 FINAL - Estadísticas filtradas por ${filterType}:`, newStats);
    setFilteredStats(newStats);
    setFilterLoading(false);
  };

  // Cargar datos principales
  const loadData = async () => {
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
    }
  };

  // Cargar estadísticas generales
  const loadStatistics = async (barbersData) => {
    debugLog('📊 Cargando estadísticas para', barbersData.length, 'barberos...');
    const stats = {};
    
    // Procesar barberos secuencialmente con delay para evitar rate limiting
    for (let i = 0; i < barbersData.length; i++) {
      const barber = barbersData[i];
      
      try {
        debugLog(`🔄 Cargando stats para barbero ${i + 1}/${barbersData.length}: ${barber.user?.name || barber._id}`);
        
        // Agregar delay progresivo entre llamadas
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 150 * i));
        }
        
        const [salesResponse, appointmentsResponse] = await Promise.all([
          salesService.getBarberSalesStats(barber._id),
          appointmentsService.getBarberAppointmentStats(barber._id)
        ]);
        
        // Procesar ventas de productos
        let totalProductos = 0;
        let countProductos = 0;
        if (salesResponse.data && Array.isArray(salesResponse.data.ventas)) {
          salesResponse.data.ventas.forEach(v => {
            totalProductos += v.total || 0;
            countProductos += 1;
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
            cortesCount += 1;
          });
        }
        
        // Procesar citas (solo reservas)
        let totalCitas = 0;
        let completedCitas = 0;
        if (appointmentsResponse.data && Array.isArray(appointmentsResponse.data.citas)) {
          appointmentsResponse.data.citas.forEach(c => {
            totalCitas += c.revenue || c.service?.price || 0;
            completedCitas += 1;
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

  return {
    // Estados principales
    barbers,
    statistics,
    filteredStats,
    loading,
    error,
    
    // Estados de filtros
    globalAvailableDates,
    allAvailableDates,
    availableDates,
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
    getHighlightedRange,
    getValidDatesForRange,
    getDateRange,
    
    // Funciones de datos
    loadData,
    loadStatistics,
    loadBarberAvailableDates,
    
    // Funciones de reportes
    generateBarberReport,
    setReportData
  };
};
