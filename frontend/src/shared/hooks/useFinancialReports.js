import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { getCurrentDateColombia, getYesterdayDateColombia } from '../utils/dateUtils';
import { calculator as RecurringExpenseCalculator } from '../recurring-expenses';

/**
 * Hook personalizado para gestionar reportes financieros con caché y agregaciones.
 * Maneja ingresos de servicios, productos, citas, gastos y filtros de fecha.
 * 
 * Características:
 * - Seguimiento de ingresos y gastos con cálculos automáticos
 * - Prorrateo de gastos recurrentes según filtros de fecha
 * - Caché del lado del cliente con TTL de 5 minutos
 * - Presets de rangos de fecha y filtrado personalizado
 * - Métricas financieras y cálculos en tiempo real
 * 
 * @returns {Object} Datos financieros, estado de carga, cálculos y funciones de control
 */
export const useFinancialReports = () => {
  // Gestión de estado para datos financieros
  const [data, setData] = useState({
    summary: {
      totalRevenue: 0,
      totalServices: 0,
      totalProducts: 0,
      totalProductSales: 0,
      totalServiceSales: 0,
      productRevenue: 0,
      serviceRevenue: 0,
      appointmentRevenue: 0,
      totalAppointments: 0,
      totalExpenses: 0,
      netProfit: 0,
      paymentMethods: {}
    },
    dailyData: [],
    serviceBreakdown: [],
    productBreakdown: [],
    paymentMethodBreakdown: [],
    availableDates: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cache, setCache] = useState(new Map());

  // Inicializar rango de fechas al último año por defecto
  const [dateRange, setDateRange] = useState(() => {
    const today = getCurrentDateColombia();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0];
    
    return {
      startDate: oneYearAgoStr,
      endDate: today,
      preset: 'all'
    };
  });

  // Presets de rango de fechas usando zona horaria de Colombia
  const datePresets = useMemo(() => {
    const todayDate = new Date();
    const today = getCurrentDateColombia();
    const yesterday = getYesterdayDateColombia();
    
    // Calcular rangos de fechas comunes
    const weekAgoDate = new Date(todayDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgoDate = new Date(todayDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    const threeMonthsAgoDate = new Date(todayDate.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    const weekAgo = weekAgoDate.toISOString().split('T')[0];
    const monthAgo = monthAgoDate.toISOString().split('T')[0];
    const threeMonthsAgo = threeMonthsAgoDate.toISOString().split('T')[0];

    return {
      year: {
        label: 'Último año',
        startDate: threeMonthsAgo,
        endDate: today
      },
      allData: {
        label: 'Todos los datos', 
        startDate: '2020-01-01',
        endDate: today
      },
      today: {
        label: 'Hoy',
        startDate: today,
        endDate: today
      },
      yesterday: {
        label: 'Ayer',
        startDate: yesterday,
        endDate: yesterday
      },
      last7days: {
        label: 'Últimos 7 días',
        startDate: weekAgo,
        endDate: today
      },
      last30days: {
        label: 'Últimos 30 días',
        startDate: monthAgo,
        endDate: today
      },
      last90days: {
        label: 'Últimos 90 días',
        startDate: threeMonthsAgo,
        endDate: today
      },
      thisMonth: {
        label: 'Este mes',
        startDate: new Date(todayDate.getFullYear(), todayDate.getMonth(), 1).toISOString().split('T')[0],
        endDate: today
      },
      lastMonth: {
        label: 'Mes pasado',
        startDate: new Date(todayDate.getFullYear(), todayDate.getMonth() - 1, 1).toISOString().split('T')[0],
        endDate: new Date(todayDate.getFullYear(), todayDate.getMonth(), 0).toISOString().split('T')[0]
      },
      thisYear: {
        label: 'Este año',
        startDate: new Date(todayDate.getFullYear(), 0, 1).toISOString().split('T')[0],
        endDate: today
      },
      lastYear: {
        label: 'Año pasado',
        startDate: new Date(todayDate.getFullYear() - 1, 0, 1).toISOString().split('T')[0],
        endDate: new Date(todayDate.getFullYear() - 1, 11, 31).toISOString().split('T')[0]
      }
    };
  }, []);

  // Generar clave de caché con versión para invalidación
  const getCacheKey = useCallback((startDate, endDate) => {
    const version = '2025-10-23-fix';
    return `financial_${startDate}_${endDate}_${version}`;
  }, []);

  // Cargar datos financieros con mecanismo de caché
  const loadFinancialData = useCallback(async (startDate, endDate, forceRefresh = false) => {
    const cacheKey = getCacheKey(startDate, endDate);
    
    // Verificar validez del caché (5 minutos TTL)
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

      // Peticiones API paralelas para rendimiento óptimo
      const [revenueResponse, expensesResponse, recurringExpensesResponse, expensesListResponse] = await Promise.all([
        api.get(`/sales/financial-summary?startDate=${startDate}&endDate=${endDate}`),
        api.get(`/expenses/summary?startDate=${startDate}&endDate=${endDate}`),
        api.get('/expenses/recurring'),
        api.get(`/expenses?startDate=${startDate}&endDate=${endDate}`)
      ]);

      // Normalizar estructura de respuesta de ingresos
      const revenueData = revenueResponse.data?.data || revenueResponse.data;
      
      // Normalizar respuesta de lista de gastos
      const rawExpensesList = expensesListResponse?.data;
      const expensesList = Array.isArray(rawExpensesList)
        ? rawExpensesList
        : (Array.isArray(rawExpensesList?.data) ? rawExpensesList.data : []);

      // Normalizar respuesta de resumen de gastos
      const rawExpensesPayload = expensesResponse.data;
      const expenseSummary = rawExpensesPayload?.data || rawExpensesPayload?.summary || rawExpensesPayload || {};
      const expensesData = { summary: expenseSummary };

      // Normalizar respuesta de gastos recurrentes
      const rawRecurring = recurringExpensesResponse.data;
      const recurringExpensesData = Array.isArray(rawRecurring)
        ? rawRecurring
        : (Array.isArray(rawRecurring?.data) ? rawRecurring.data : []);

      // Calcular gastos totales usando la misma lógica de prorrateo que Reports.jsx
      // Esto asegura cálculos de gastos consistentes en toda la aplicación
      const totalRevenue = revenueData?.totalRevenue || revenueData.summary?.totalRevenue || 0;
      const hasRevenue = totalRevenue > 0;
      
      // Filtrar y sumar gastos únicos del periodo
      const oneTimeExpenses = expensesList.filter(e => e.type === 'one-time');
      const oneTimeTotal = oneTimeExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      
      // Calcular gastos recurrentes con lógica de prorrateo
      let recurringTotalForPeriod = 0;
      
      if (hasRevenue && recurringExpensesData.length > 0) {
        // Filtrar gastos recurrentes activos
        const activeRecurring = recurringExpensesData.filter(exp => {
          const isActive = (exp.recurrence && exp.recurrence.isActive !== undefined)
            ? exp.recurrence.isActive
            : exp.recurringConfig?.isActive ?? exp.isActive ?? true;
          return isActive;
        });
        
        // Calcular total mensual de todos los gastos recurrentes activos
        const monthlyTotal = activeRecurring.reduce((sum, exp) => {
          try {
            return sum + RecurringExpenseCalculator.calculateMonthlyAmount(exp);
          } catch (e) {
            return sum;
          }
        }, 0);
        
        // Determinar si se usa filtro general (todos los datos) o rango específico
        const isGeneralFilter = dateRange.preset === 'all' || dateRange.preset === 'allData' || !dateRange.preset;
        const daysWithData = revenueData?.daysWithData || revenueData.summary?.daysWithData || 0;
        
        if (isGeneralFilter && daysWithData > 30) {
          // Filtro general: prorratear gastos recurrentes por número de meses con datos
          const oldestDate = revenueData?.summary?.oldestDataDate || revenueData?.oldestDataDate;
          let monthsToUse = 1;
          
          if (oldestDate) {
            const oldestDateObj = new Date(oldestDate);
            const today = new Date();
            const monthsDiff = Math.abs(Math.floor((today - oldestDateObj) / (1000 * 60 * 60 * 24 * 30.44)));
            monthsToUse = Math.max(1, monthsDiff);
          } else {
            // Fallback: estimar meses basado en días con datos
            monthsToUse = Math.max(1, Math.ceil(daysWithData / 15));
          }
          
          recurringTotalForPeriod = monthlyTotal * monthsToUse;
        } else {
          // Filtro específico: usar valor mensual directamente
          recurringTotalForPeriod = monthlyTotal;
        }
      }
      
      // Calcular gastos totales finales con prorrateo aplicado
      const calculatedTotalExpenses = oneTimeTotal + recurringTotalForPeriod;

      // Construir estructura de datos procesada con valores calculados
      const processedData = {
        summary: {
          totalRevenue: revenueData?.totalRevenue || revenueData.summary?.totalRevenue || 0,
          totalServices: revenueData?.totalServices || revenueData.summary?.totalServices || 0,
          totalProducts: revenueData?.totalProducts || revenueData.summary?.totalProducts || 0,
          totalProductSales: revenueData?.totalProducts || revenueData.summary?.totalProducts || 0,
          totalServiceSales: revenueData?.totalServices || revenueData.summary?.totalServices || 0,
          productRevenue: revenueData?.productRevenue || revenueData.summary?.productRevenue || 0,
          serviceRevenue: revenueData?.serviceRevenue || revenueData.summary?.serviceRevenue || 0,
          appointmentRevenue: revenueData?.appointmentRevenue || revenueData.summary?.appointmentRevenue || 0,
          totalAppointments: revenueData?.totalAppointments || revenueData.summary?.totalAppointments || 0,
          // Usar gastos calculados con prorrateo (misma lógica que Reports.jsx)
          totalExpenses: calculatedTotalExpenses,
          netProfit: totalRevenue - calculatedTotalExpenses,
          // Datos temporales para cálculos proporcionales
          daysWithData: revenueData?.daysWithData || revenueData.summary?.daysWithData || 0,
          oldestDataDate: revenueData?.oldestDataDate || revenueData.summary?.oldestDataDate || null,
          paymentMethods: revenueData?.paymentMethods || revenueData.summary?.paymentMethods || {},
          suppliesCosts: revenueData.summary?.suppliesCosts || 0,
          // Campos legacy para retrocompatibilidad con componentes existentes
          recurringExpenses: 0,
          originalExpenses: expensesData.summary?.totalExpenses || 0
        },
        dailyData: revenueData.dailyData || [],
        serviceBreakdown: revenueData.serviceBreakdown || [],
        productBreakdown: revenueData.productBreakdown || [],
        paymentMethodBreakdown: revenueData.paymentMethodBreakdown || [],
        expenseBreakdown: expenseSummary?.categoryBreakdown || expensesData.breakdown || [],
        expenses: expensesList,
        recurringExpenses: recurringExpensesData,
        originalExpensesTotal: expensesData.summary?.totalExpenses || 0,
        availableDates: revenueData.dailyData ? 
          [...new Set(revenueData.dailyData.map(day => day.date))].sort() : 
          [],
        // Desglose de ingresos para modales
        revenueBreakdown: {
          totalRevenue: revenueData.summary?.totalRevenue || 0,
          byType: {
            products: revenueData.summary?.productRevenue || 0,
            services: revenueData.summary?.serviceRevenue || 0,
            appointments: revenueData.summary?.appointmentRevenue || 0
          },
          byPaymentMethod: revenueData.summary?.paymentMethods || {},
          topProduct: revenueData.analytics?.topProduct || 'N/A',
          topService: revenueData.analytics?.topService || 'N/A',
          preferredPayment: revenueData.analytics?.preferredPayment || 'N/A',
          averagePerSale: revenueData.analytics?.averagePerSale || 0
        }
      };

      // Actualizar estado y caché con datos procesados
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

  // Cambiar rango de fechas por preset
  const setDateRangePreset = useCallback((preset) => {
    // Mapear alias legacy a nombres de preset actuales
    const aliasMap = {
      all: 'allData'
    };
    const effective = aliasMap[preset] || preset;

    if (effective === 'custom') {
      return;
    }

    if (datePresets[effective]) {
      const newRange = {
        ...datePresets[effective],
        preset: effective
      };
      setDateRange(newRange);
    }
  }, [datePresets]);

  // Establecer rango de fechas personalizado
  const setCustomDateRange = useCallback((startDate, endDate) => {
    setDateRange({
      startDate,
      endDate,
      preset: 'custom'
    });
  }, []);

  // Forzar actualización de datos
  const refreshData = useCallback(() => {
    return loadFinancialData(dateRange.startDate, dateRange.endDate, true);
  }, [dateRange.startDate, dateRange.endDate, loadFinancialData]);

  // Cargar datos cuando cambia el rango de fechas
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
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Cálculos financieros derivados
  const calculations = useMemo(() => {
    const { summary } = data;
    
    // Extraer valores de ingresos del resumen
    const serviceRevenue = summary.serviceRevenue || 0;
    const productRevenue = summary.productRevenue || 0;
    const appointmentRevenue = summary.appointmentRevenue || 0;
    
    return {
      // Porcentaje de margen de ganancia
      profitMargin: summary.totalRevenue > 0 ? 
        ((summary.netProfit / summary.totalRevenue) * 100).toFixed(1) : '0.0',
      
      // Valor promedio por cita
      averageServiceValue: summary.totalAppointments > 0 ? 
        (appointmentRevenue / summary.totalAppointments) : 0,
      
      // Porcentajes de distribución de ingresos
      servicesPercentage: summary.totalRevenue > 0 ?
        ((serviceRevenue / summary.totalRevenue) * 100).toFixed(1) : '0.0',
      productsPercentage: summary.totalRevenue > 0 ?
        ((productRevenue / summary.totalRevenue) * 100).toFixed(1) : '0.0',
      appointmentsPercentage: summary.totalRevenue > 0 ?
        ((appointmentRevenue / summary.totalRevenue) * 100).toFixed(1) : '0.0',
      
      // Valores absolutos de ingresos
      serviceRevenue,
      productRevenue,
      appointmentRevenue,
      totalExpenses: summary.totalExpenses || 0,
      
      // Contadores de transacciones
      totalServiceSales: summary.totalServiceSales || 0,
      totalProductSales: summary.totalProductSales || 0,
      
      // Margen bruto (ingresos - costos directos)
      grossMargin: (() => {
        const totalRevenue = summary.totalRevenue || 0;
        const directCosts = summary.suppliesCosts || 0;
        
        if (totalRevenue > 0) {
          const grossMarginAmount = totalRevenue - directCosts;
          return ((grossMarginAmount / totalRevenue) * 100).toFixed(1);
        }
        
        return '0.0';
      })(),
      
      grossMarginAmount: (() => {
        const totalRevenue = summary.totalRevenue || 0;
        const directCosts = summary.suppliesCosts || 0;
        return totalRevenue - directCosts;
      })(),
      
      // Eficiencia operacional (ingresos por cada peso gastado)
      operationalEfficiency: (() => {
        const totalRevenue = summary.totalRevenue || 0;
        const totalExpenses = summary.totalExpenses || 0;
        
        if (totalExpenses > 0) {
          return (totalRevenue / totalExpenses).toFixed(2);
        }
        
        return totalRevenue > 0 ? '∞' : '0.00';
      })(),
      
      // Retorno sobre inversión
      returnOnInvestment: (() => {
        const totalRevenue = summary.totalRevenue || 0;
        const totalExpenses = summary.totalExpenses || 0;
        
        if (totalExpenses > 0) {
          return (totalRevenue / totalExpenses).toFixed(2);
        }
        
        return totalRevenue > 0 ? '∞' : '0.00';
      })(),
      
      // Distribución por método de pago
      cashPercentage: (() => {
        const paymentMethods = summary.paymentMethods || {};
        const cashMethods = ['cash', 'efectivo', 'contado'];
        const totalCash = cashMethods.reduce((total, method) => total + (paymentMethods[method] || 0), 0);
        return summary.totalRevenue > 0 ? ((totalCash / summary.totalRevenue) * 100).toFixed(1) : '0.0';
      })(),
      
      digitalPercentage: (() => {
        const paymentMethods = summary.paymentMethods || {};
        const digitalMethods = ['nequi', 'daviplata', 'bancolombia', 'nu', 'debit', 'credit', 'tarjeta'];
        const totalDigital = digitalMethods.reduce((total, method) => total + (paymentMethods[method] || 0), 0);
        return summary.totalRevenue > 0 ? ((totalDigital / summary.totalRevenue) * 100).toFixed(1) : '0.0';
      })(),
      
      // Ratios de liquidez y eficiencia
      liquidityRatio: summary.totalExpenses > 0 ? 
        (summary.totalRevenue / summary.totalExpenses).toFixed(2) : '0.00',
      
      averageTransactionValue: (summary.totalServiceSales + summary.totalProductSales + summary.totalAppointments) > 0 ? 
        (summary.totalRevenue / (summary.totalServiceSales + summary.totalProductSales + summary.totalAppointments)) : 0,
      
      // Eficiencia (compatibilidad legacy)
      revenuePerExpenseDollar: (() => {
        const totalRevenue = summary.totalRevenue || 0;
        const totalExpenses = summary.totalExpenses || 0;
        
        if (totalExpenses > 0) {
          return (totalRevenue / totalExpenses).toFixed(2);
        }
        
        return totalRevenue > 0 ? '∞' : '0.00';
      })(),
      
      // Ratio de gastos (gastos como porcentaje de ingresos)
      expenseRatio: (() => {
        const totalRevenue = summary.totalRevenue || 0;
        const totalExpenses = summary.totalExpenses || 0;
        return totalRevenue > 0 ? ((totalExpenses / totalRevenue) * 100).toFixed(1) : '0.0';
      })(),
      
      // Concentración de riesgo (mayor uso de método de pago)
      riskConcentration: (() => {
        const paymentMethods = summary.paymentMethods || {};
        const totalRevenue = summary.totalRevenue || 0;
        if (totalRevenue === 0) return '0.0';
        
        // Encontrar el método de pago más usado
        let maxAmount = 0;
        Object.values(paymentMethods).forEach(amount => {
          if (amount > maxAmount) maxAmount = amount;
        });
        
        return ((maxAmount / totalRevenue) * 100).toFixed(1);
      })()
    };
  }, [data]);

  return {
    // Datos principales
    data,
    loading,
    error,
    
    // Filtrado de fechas
    dateRange,
    datePresets,
    setDateRangePreset,
    setCustomDateRange,
    
    // Acciones
    refreshData,
    loadFinancialData,
    
    // Cálculos
    calculations,
    
    // Funciones de utilidad
    formatCurrency: (amount) => new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0),
    
    formatDate: (date) => new Date(date + 'T00:00:00').toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  };
};

export default useFinancialReports;