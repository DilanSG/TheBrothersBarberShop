import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { getCurrentDateColombia, getYesterdayDateColombia } from '../utils/dateUtils';
import RecurringExpenseCalculator from '../utils/RecurringExpenseCalculator';

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
      totalProductSales: 0,
      totalServiceSales: 0, // ✅ Número de transacciones de servicios
      productRevenue: 0, // ✅ Corregir nombre sin 's'
      serviceRevenue: 0,  // ✅ Agregar serviceRevenue
      appointmentRevenue: 0, // ✅ Revenue de citas completadas
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

  // Filtros de fecha - PREDETERMINADO: Mostrar datos del último año
  const [dateRange, setDateRange] = useState(() => {
    const today = getCurrentDateColombia();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0];
    
    return {
      startDate: oneYearAgoStr, // Último año en lugar de 2020
      endDate: today,
      preset: 'all'
    };
  });

  // Presets de fechas comunes - usando zona horaria de Colombia
  const datePresets = useMemo(() => {
    const todayDate = new Date(); // Objeto Date para cálculos
    const today = getCurrentDateColombia(); // String para uso en rangos
    const yesterday = getYesterdayDateColombia();
    
    // Crear fechas usando objetos Date y convertir a strings
    const weekAgoDate = new Date(todayDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgoDate = new Date(todayDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    const threeMonthsAgoDate = new Date(todayDate.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    const weekAgo = weekAgoDate.toISOString().split('T')[0];
    const monthAgo = monthAgoDate.toISOString().split('T')[0];
    const threeMonthsAgo = threeMonthsAgoDate.toISOString().split('T')[0];

    return {
      year: {
        label: 'Último año',
        startDate: threeMonthsAgo, // Cambiar a un rango más razonable
        endDate: today
      },
      allData: {
        label: 'Todos los datos', 
        startDate: '2020-01-01', // Mantener opción para ver todo histórico
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
      const [revenueResponse, expensesResponse, recurringExpensesResponse, expensesListResponse] = await Promise.all([
        api.get(`/sales/financial-summary?startDate=${startDate}&endDate=${endDate}`),
        api.get(`/expenses/summary?startDate=${startDate}&endDate=${endDate}`),
        api.get('/expenses/recurring'), // Obtener gastos recurrentes (plantillas) para recalcular
        api.get(`/expenses?startDate=${startDate}&endDate=${endDate}`) // Lista de gastos individuales para modales
      ]);

      // ✅ CORREGIR: Backend devuelve { success, message, data }, necesitamos data.data
      const revenueData = revenueResponse.data?.data || revenueResponse.data;
      
      // Normalizar lista de gastos (el backend puede responder { success, data: [] })
      const rawExpensesList = expensesListResponse?.data;
      const expensesList = Array.isArray(rawExpensesList)
        ? rawExpensesList
        : (Array.isArray(rawExpensesList?.data) ? rawExpensesList.data : []);
      // Normalización aplicada si es necesario

      // Normalizar respuesta de gastos (el backend devuelve { success, data } no { summary })
      const rawExpensesPayload = expensesResponse.data;
      const expenseSummary = rawExpensesPayload?.data || rawExpensesPayload?.summary || rawExpensesPayload || {};
      // Mantener compatibilidad con código previo usando un objeto similar a expensesData.summary
      const expensesData = { summary: expenseSummary };

      // Normalizar gastos recurrentes: backend probablemente responde { success, data: [] }
      const rawRecurring = recurringExpensesResponse.data;
      const recurringExpensesData = Array.isArray(rawRecurring)
        ? rawRecurring
        : (Array.isArray(rawRecurring?.data) ? rawRecurring.data : []);

      // Normalización de recurring expenses aplicada si es necesario

      // 🔄 RECALCULAR GASTOS RECURRENTES con el calculador normalizado
  let correctedTotalExpenses = expensesData.summary?.totalExpenses || 0;
  let recurringRecalculatedTotal = 0; // Nuevo: monto recurrente recalculado
  let recurringInferredTotal = 0;     // Nuevo: monto recurrente inferido por diferencia
      let effectiveStartDate = startDate; // 🔧 CORRIGIDO: Declarar fuera del bloque condicional
      let smartCalculationApplied = false;
      
  if (recurringExpensesData.length > 0) {
        // Recalculando gastos recurrentes para el dashboard
        
        // 📅 LÓGICA INTELIGENTE DE FECHAS PARA GASTOS RECURRENTES
        // Solo calcular gastos recurrentes desde que realmente empezaron a registrarse
        
        // Encontrar la fecha de creación más antigua de los gastos recurrentes
        const oldestRecurringExpense = recurringExpensesData
          .filter(expense => expense.createdAt || expense.updatedAt)
          .sort((a, b) => {
            const dateA = new Date(a.createdAt || a.updatedAt);
            const dateB = new Date(b.createdAt || b.updatedAt);
            return dateA - dateB;
          })[0];
        
        // Usar la fecha más reciente entre:
        // 1. Fecha de creación del primer gasto recurrente
        // 2. Fecha de inicio del rango seleccionado
        // 3. Una fecha límite razonable (ej: hace 1 año máximo)
        effectiveStartDate = startDate; // Reset inicial
        
        // ✅ CORREGIDO: Para filtros generales, usar el rango completo del período de datos
        // No ajustar por fecha de creación ya que queremos el prorrateo completo
        if (oldestRecurringExpense && dateRange.preset !== 'all' && dateRange.preset !== 'allData') {
          // Solo aplicar la lógica de ajuste para filtros específicos, no generales
          const expenseCreationDate = new Date(oldestRecurringExpense.createdAt || oldestRecurringExpense.updatedAt);
          const creationDateStr = expenseCreationDate.toISOString().split('T')[0];
          
          const rangeStart = new Date(startDate);
          if (expenseCreationDate > rangeStart) {
            effectiveStartDate = creationDateStr;
            smartCalculationApplied = true;
            // Ajustando fecha de inicio para gastos recurrentes
          }
        }
        
        // Limitar a máximo 1 año atrás para evitar cálculos masivos sin sentido
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0];
        
        if (new Date(effectiveStartDate) < oneYearAgo) {
          effectiveStartDate = oneYearAgoStr;
          smartCalculationApplied = true;
        }
        
        // Calcular gastos recurrentes para el rango efectivo
  const recurringTotal = recurringExpensesData.reduce((total, expense) => {
          // Compatibilidad: nuevo modelo usa expense.recurrence.isActive
          const isActive = (expense.recurrence && expense.recurrence.isActive !== undefined)
            ? expense.recurrence.isActive
            : expense.recurringConfig?.isActive;
          if (!isActive) {
            return total;
          }
          
          try {
            // Usar el calculador para obtener el monto correcto del rango EFECTIVO
            const rangeAmount = RecurringExpenseCalculator.calculateRangeAmount(
              expense, 
              effectiveStartDate,  // Usar fecha efectiva en lugar de startDate original
              endDate
            );
            
            return total + rangeAmount;
          } catch (error) {
            console.error(`Error calculando ${expense.description}:`, error);
            return total;
          }
        }, 0);
        
        // Obtener gastos no recurrentes del backend
        let nonRecurringTotal = (expensesData.summary?.nonRecurringExpenses || 0);
        
        // 🔧 CORREGIR: Si el backend no envía nonRecurringExpenses, calcularlo correctamente
        if (nonRecurringTotal === 0) {
          // Calcular gastos no recurrentes = total original - gastos recurrentes originales
          const originalTotal = expensesData.summary?.totalExpenses || 0;
          
          if (originalTotal > 0) {
            // Calcular gastos recurrentes en el período original para restar del total
            const originalRecurringAmount = recurringExpensesData.reduce((total, expense) => {
              const isActive = (expense.recurrence && expense.recurrence.isActive !== undefined)
                ? expense.recurrence.isActive
                : expense.recurringConfig?.isActive;
              if (!isActive) return total;
              
              try {
                // Usar startDate y endDate originales para calcular cuánto era de recurrente
                const rangeAmount = RecurringExpenseCalculator.calculateRangeAmount(
                  expense, 
                  startDate,  // Fecha original del filtro
                  endDate
                );
                return total + rangeAmount;
              } catch (error) {
                console.error(`Error calculando recurrente original ${expense.description}:`, error);
                return total;
              }
            }, 0);
            
            nonRecurringTotal = Math.max(0, originalTotal - originalRecurringAmount);
            console.log(`🔧 Gastos no recurrentes calculados: $${nonRecurringTotal.toLocaleString()} (Total: $${originalTotal.toLocaleString()} - Recurrentes originales: $${originalRecurringAmount.toLocaleString()})`);
          }
        }
        
        // Total corregido = gastos no recurrentes + gastos recurrentes recalculados
        // Redondear para evitar problemas de precisión flotante
  recurringRecalculatedTotal = Math.round(recurringTotal);
  correctedTotalExpenses = Math.round(nonRecurringTotal + recurringRecalculatedTotal);
        
        // Corrección de gastos aplicada:
        // - Original: ${expensesData.summary?.totalExpenses || 0}
        // - No recurrentes: ${nonRecurringTotal}
        // - Recurrentes recalculados: ${recurringRecalculatedTotal}
        // - Total corregido: ${correctedTotalExpenses}
      } else {
        // No hay gastos recurrentes para recalcular
      }

      // Inferir totales recurrentes si siguen en cero
      const oneTimeOriginalTotal = expensesList.filter(e => e.type === 'one-time').reduce((s, e) => s + (e.amount || 0), 0);
      const originalExpensesTotal = expensesData.summary?.totalExpenses || 0;
      if (recurringRecalculatedTotal === 0 && originalExpensesTotal > 0) {
        const diff = originalExpensesTotal - oneTimeOriginalTotal;
        if (diff > 0) {
          recurringInferredTotal = diff;
          console.log('🧪 Infiere total recurrente por diferencia:', {
            originalExpensesTotal,
            oneTimeOriginalTotal,
            inferredRecurring: diff
          });
        }
      }

      // Si no hubo recalculado pero sí inferido, mantener corrected igual al original (o sumas si aplica)
      if (recurringRecalculatedTotal === 0 && recurringInferredTotal > 0) {
        // correctedTotalExpenses ya refleja original; dejamos netProfit calculado más abajo
      }

      // Procesar y agregar datos
      const processedData = {
        summary: {
          totalRevenue: revenueData?.totalRevenue || revenueData.summary?.totalRevenue || 0,
          totalServices: revenueData?.totalServices || revenueData.summary?.totalServices || 0,
          totalProducts: revenueData?.totalProducts || revenueData.summary?.totalProducts || 0,
          // ✅ CORREGIDO: Mapear campos del backend correctamente (primero raíz, luego summary)
          totalProductSales: revenueData?.totalProducts || revenueData.summary?.totalProducts || 0, // Backend envía totalProducts = num ventas
          totalServiceSales: revenueData?.totalServices || revenueData.summary?.totalServices || 0, // Backend envía totalServices = num ventas
          productRevenue: revenueData?.productRevenue || revenueData.summary?.productRevenue || 0, // ✅ Ingresos por productos
          serviceRevenue: revenueData?.serviceRevenue || revenueData.summary?.serviceRevenue || 0, // ✅ Ingresos por servicios
          appointmentRevenue: revenueData?.appointmentRevenue || revenueData.summary?.appointmentRevenue || 0, // ✅ Ingresos por citas
          totalAppointments: revenueData?.totalAppointments || revenueData.summary?.totalAppointments || 0,
          totalExpenses: correctedTotalExpenses, // 🔄 Usar gastos corregidos
          netProfit: (revenueData.summary?.totalRevenue || 0) - correctedTotalExpenses, // 🔄 Usar gastos corregidos
          // Totales recurrentes expuestos
          recurringExpensesRecalculated: recurringRecalculatedTotal,
          recurringExpensesInferred: recurringInferredTotal,
          recurringExpensesTotal: recurringRecalculatedTotal || recurringInferredTotal || 0,
          // ✅ AGREGAR: Datos temporales críticos para cálculos proporcionales
          daysWithData: revenueData?.daysWithData || revenueData.summary?.daysWithData || 0,
          oldestDataDate: revenueData?.oldestDataDate || revenueData.summary?.oldestDataDate || null,
          
          // 🐛 DEBUG: Log final para verificar
          _debugExpenses: {
            original: expensesData.summary?.totalExpenses || 0,
            corrected: correctedTotalExpenses,
            difference: correctedTotalExpenses - (expensesData.summary?.totalExpenses || 0),
            smartCalculationApplied: smartCalculationApplied,
            effectiveRange: smartCalculationApplied ? `${effectiveStartDate} - ${endDate}` : null,
            originalRange: `${startDate} - ${endDate}`,
            rawBackendShape: Object.keys(rawExpensesPayload || {}),
            oneTimeOriginalTotal,
            originalExpensesTotal,
            recurringRecalculatedTotal,
            recurringInferredTotal,
            chosenRecurring: recurringRecalculatedTotal || recurringInferredTotal
          },
          
          paymentMethods: revenueData?.paymentMethods || revenueData.summary?.paymentMethods || {},
          // ✅ NUEVO: Extraer suppliesCosts del backend
          suppliesCosts: revenueData.summary?.suppliesCosts || 0 // ⭐ CRÍTICO: Este era el campo faltante
          ,
          // Campos legacy para componentes que aún los leen
          recurringExpenses: recurringRecalculatedTotal || recurringInferredTotal || 0,
          originalExpenses: expensesData.summary?.totalExpenses || 0
        },
        dailyData: revenueData.dailyData || [],
        serviceBreakdown: revenueData.serviceBreakdown || [],
        productBreakdown: revenueData.productBreakdown || [],
        paymentMethodBreakdown: revenueData.paymentMethodBreakdown || [],
  expenseBreakdown: expenseSummary?.categoryBreakdown ? expenseSummary.categoryBreakdown : (expensesData.breakdown || []),
  expenses: expensesList, // Lista concreta para modales
  recurringExpenses: recurringExpensesData, // 🔄 Agregar gastos recurrentes
  originalExpensesTotal: expensesData.summary?.totalExpenses || 0, // 🔄 Total original para comparación
        availableDates: revenueData.dailyData ? 
          [...new Set(revenueData.dailyData.map(day => day.date))].sort() : 
          [],
        // Datos para el modal de desglose de ingresos
        revenueBreakdown: {
          totalRevenue: revenueData.summary?.totalRevenue || 0, // ✅ Total correcto del summary
          byType: {
            products: revenueData.summary?.productRevenue || 0, // ✅ Ingresos por productos
            services: revenueData.summary?.serviceRevenue || 0,  // ✅ Ingresos por servicios
            appointments: revenueData.summary?.appointmentRevenue || 0 // ✅ Corregido: usar appointmentRevenue en lugar de totalAppointments
          },
          byPaymentMethod: revenueData.summary?.paymentMethods || {},
          topProduct: revenueData.analytics?.topProduct || 'N/A',
          topService: revenueData.analytics?.topService || 'N/A',
          preferredPayment: revenueData.analytics?.preferredPayment || 'N/A',
          averagePerSale: revenueData.analytics?.averagePerSale || 0
        }
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
    // Alias legacy → actuales
    const aliasMap = {
      all: 'allData'
    };
    const effective = aliasMap[preset] || preset;

    if (effective === 'custom') {
      // No cambiar nada aquí; se ajustará cuando se llame a setCustomDateRange
      return;
    }

    if (datePresets[effective]) {
      const newRange = {
        ...datePresets[effective],
        preset: effective
      };
      setDateRange(newRange);
    } else {
      console.warn('Preset not found:', preset);
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

  // ✅ El backend ya maneja correctamente el cálculo de efectivo y digital
  // No necesitamos cálculo custom adicional

  // Cálculos derivados optimizados
  const calculations = useMemo(() => {
    const { summary } = data;
    
    // 🚨 DEBUG TEMPORAL: Verificar valores que llegan para cálculos financieros
    console.log('🔍 DEBUG FINANCIAL CALCULATIONS:', {
      totalRevenue: summary.totalRevenue,
      totalExpenses: summary.totalExpenses,
      netProfit: summary.netProfit,
      originalExpenses: summary.originalExpenses,
      recurringRecalculated: summary.recurringExpensesRecalculated,
      suppliesCosts: summary.suppliesCosts,
      // 🆕 Agregar debug de composición de gastos
      _debugGastosComposition: summary._debugExpenses
    });
    
    // Cálculos con valores verificados
    
    // Usar los ingresos directamente del summary del backend (más confiable)
    const serviceRevenue = summary.serviceRevenue || 0;
    const productRevenue = summary.productRevenue || 0; // ✅ Corregir nombre del campo
    const appointmentRevenue = summary.appointmentRevenue || 0; // ✅ Revenue de citas
    
    return {
      profitMargin: summary.totalRevenue > 0 ? 
        ((summary.netProfit / summary.totalRevenue) * 100).toFixed(1) : '0.0', // ✅ Cambiado a 1 decimal
      averageServiceValue: summary.totalAppointments > 0 ? 
        (appointmentRevenue / summary.totalAppointments) : 0,
      servicesPercentage: summary.totalRevenue > 0 ?
        ((serviceRevenue / summary.totalRevenue) * 100).toFixed(1) : '0.0', // ✅ Cambiado a 1 decimal
      productsPercentage: summary.totalRevenue > 0 ?
        ((productRevenue / summary.totalRevenue) * 100).toFixed(1) : '0.0', // ✅ Cambiado a 1 decimal
      appointmentsPercentage: summary.totalRevenue > 0 ?
        ((appointmentRevenue / summary.totalRevenue) * 100).toFixed(1) : '0.0', // ✅ Cambiado a 1 decimal
      // Valores absolutos para mayor claridad
      serviceRevenue,
      productRevenue,
      appointmentRevenue,
      totalExpenses: summary.totalExpenses || 0,
      // ✅ Agregar contadores de transacciones
      totalServiceSales: summary.totalServiceSales || 0,
      totalProductSales: summary.totalProductSales || 0,
      
      // 🧮 MÉTRICAS AVANZADAS PARA CARDS
      // Rentabilidad - calculada con costos directos reales
      grossMargin: (() => {
        const totalRevenue = summary.totalRevenue || 0;
        const directCosts = summary.suppliesCosts || 0; // Costos de insumos/materiales reales
        
        if (totalRevenue > 0) {
          const grossMarginAmount = totalRevenue - directCosts;
          const grossMarginPercentage = ((grossMarginAmount / totalRevenue) * 100).toFixed(1); // ✅ Cambiado a 1 decimal
          return grossMarginPercentage;
        }
        
        return '0.0';
      })(),
      grossMarginAmount: (() => {
        const totalRevenue = summary.totalRevenue || 0;
        const directCosts = summary.suppliesCosts || 0;
        return totalRevenue - directCosts;
      })(),
      operationalEfficiency: (() => {
        const totalRevenue = summary.totalRevenue || 0;
        const totalExpenses = summary.totalExpenses || 0; // ✅ Ya usa gastos corregidos
        
        // 🚨 DEBUG ESPECÍFICO EFICIENCIA
        console.log('🔍 OPERATIONAL EFFICIENCY CALC:', {
          totalRevenue,
          totalExpenses,
          calculation: totalExpenses > 0 ? ((totalRevenue / totalExpenses) * 100).toFixed(1) : 'N/A'
        });
        
        if (totalExpenses > 0) {
          const efficiency = ((totalRevenue / totalExpenses) * 100).toFixed(1);
          return efficiency;
        }
        
        return totalRevenue > 0 ? '∞' : '0.0';
      })(),
      // ✅ Retorno por inversión corregido
      returnOnInvestment: (() => {
        const totalRevenue = summary.totalRevenue || 0;
        const totalExpenses = summary.totalExpenses || 0; // ✅ Ya usa gastos corregidos
        
        // 🚨 DEBUG ESPECÍFICO ROI
        console.log('🔍 RETURN ON INVESTMENT CALC:', {
          totalRevenue,
          totalExpenses,
          calculation: totalExpenses > 0 ? (totalRevenue / totalExpenses).toFixed(2) : 'N/A'
        });
        
        if (totalExpenses > 0) {
          return (totalRevenue / totalExpenses).toFixed(2);
        }
        
        return totalRevenue > 0 ? '∞' : '0.00';
      })(),
      
      // Distribución
      cashPercentage: (() => {
        const paymentMethods = summary.paymentMethods || {};
        const cashMethods = ['cash', 'efectivo', 'contado'];
        const totalCash = cashMethods.reduce((total, method) => total + (paymentMethods[method] || 0), 0);
        return summary.totalRevenue > 0 ? ((totalCash / summary.totalRevenue) * 100).toFixed(1) : '0.0';
      })(),
      digitalPercentage: (() => {
        const paymentMethods = summary.paymentMethods || {};
        const digitalMethods = ['nequi', 'daviplata', 'bancolombia', 'nu', 'debit', 'credit', 'tarjeta']; // ✅ Incluir todos los métodos digitales
        const totalDigital = digitalMethods.reduce((total, method) => total + (paymentMethods[method] || 0), 0);
        return summary.totalRevenue > 0 ? ((totalDigital / summary.totalRevenue) * 100).toFixed(1) : '0.0';
      })(),
      
      // Balance y flujo
      liquidityRatio: summary.totalExpenses > 0 ? 
        (summary.totalRevenue / summary.totalExpenses).toFixed(2) : '0.00',
      averageTransactionValue: (summary.totalServiceSales + summary.totalProductSales + summary.totalAppointments) > 0 ? 
        (summary.totalRevenue / (summary.totalServiceSales + summary.totalProductSales + summary.totalAppointments)) : 0,
      
      // Eficiencia (legacy compatibility)
      revenuePerExpenseDollar: (() => {
        const totalRevenue = summary.totalRevenue || 0;
        const totalExpenses = summary.totalExpenses || 0;
        
        if (totalExpenses > 0) {
          return (totalRevenue / totalExpenses).toFixed(2);
        }
        
        return totalRevenue > 0 ? '∞' : '0.00';
      })(),
      
      // 📈 MÉTRICAS ADICIONALES RESPONSIVAS A FILTROS
      
      // Balance & Flujo - Responsivas
      expenseRatio: (() => {
        const totalRevenue = summary.totalRevenue || 0;
        return totalRevenue > 0 ? ((summary.totalExpenses || 0) / totalRevenue * 100).toFixed(1) : '0.0'; // ✅ Ya usa gastos corregidos
      })(),
      
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