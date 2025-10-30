import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar, 
  CreditCard,
  PieChart,
  BarChart3,
  Settings,
  RefreshCw,
  Repeat,
  X
} from 'lucide-react';
import { PageContainer } from '@components/layout/PageContainer';
import GradientText from '@components/ui/GradientText';
import GradientButton from '@components/ui/GradientButton';
import { FinancialDashboard } from '@components/financial/FinancialDashboard';
import CashBreakdownModal from '@components/modals/CashBreakdownModal';
import DigitalPaymentsBreakdownModal from '@components/modals/DigitalPaymentsBreakdownModal';
import ServicesBreakdownModal from '@components/modals/ServicesBreakdownModal';
import { SimpleDateFilter } from '@components/common/SimpleDateFilter';
import { ExpenseModal } from '@components/financial/ExpenseManagement';
import ExpenseTypeSelector from '@components/financial/ExpenseTypeSelector';
import OneTimeExpenseModal from '@components/financial/OneTimeExpenseModal';
import RecurringExpenseModal from '@components/financial/RecurringExpenseModal';
import OneTimeExpensesListModal from '@components/modals/OneTimeExpensesListModal';
import RecurringExpensesListModal from '@components/modals/RecurringExpensesListModal';
import DeleteExpenseModal from '@components/modals/DeleteExpenseModal';
import { PaymentMethodsModal } from '@components/modals/PaymentMethodsModal';
import { ExpensesBreakdownModal } from '@components/modals/ExpensesBreakdownModal';
import RevenueBreakdownModal from '@components/modals/RevenueBreakdownModal';
import RevenueTypesModal from '@components/modals/RevenueTypesModal';
import ProductsSoldModal from '@components/modals/ProductsSoldModal';
import AppointmentsBreakdownModal from '@components/modals/AppointmentsBreakdownModal';
import useFinancialReports from '@hooks/useFinancialReports';
import { useRecurringExpenses } from '../../features/expenses/hooks/useRecurringExpenses';
import { calculator as RecurringExpenseCalculator } from '@shared/recurring-expenses';
import { format, differenceInCalendarMonths } from 'date-fns';
import { getCategoryLabel, getPaymentMethodLabel } from '@utils/categoryTranslations';

const frequencies = [
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' }
];

/**
 * Calcula los gastos diarios correctos considerando gastos recurrentes y únicos
 * @param {Array} expenses - Array de gastos únicos del backend
 * @param {Array} recurringExpenses - Array de gastos recurrentes locales  
 * @param {string} startDate - Fecha de inicio
 * @param {string} endDate - Fecha de fin
 * @returns {Object} - { dailyRate, monthlyProjection }
 */
const calculateCorrectDailyExpenses = (expenses, recurringExpenses, startDate, endDate) => {
  // Calcular total de gastos únicos del período
  const oneTimeExpenses = expenses || [];
  const oneTimeTotal = oneTimeExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);

  // ✅ USAR GASTOS RECURRENTES LOCALES SIEMPRE
  let recurringMonthlyTotal = 0;
  if (recurringExpenses && recurringExpenses.length > 0) {
    const activeRecurringExpenses = recurringExpenses.filter(exp => (exp._isActive !== undefined
      ? exp._isActive
      : (exp.recurrence?.isActive ?? exp.recurringConfig?.isActive ?? exp.isActive ?? true)));
    
    recurringMonthlyTotal = activeRecurringExpenses.reduce((sum, exp) => {
      try {
        const monthlyAmount = RecurringExpenseCalculator.calculateMonthlyAmount(exp);
        return sum + monthlyAmount;
      } catch (error) {
        console.warn('Error calculando gasto recurrente:', exp.description, error);
        return sum;
      }
    }, 0);
  }

  // Calcular días en el periodo
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysInPeriod = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  // Proyección mensual de gastos recurrentes (ya está en formato mensual)
  const monthlyProjection = recurringMonthlyTotal;

  // Gasto diario = (gastos únicos / días) + (gastos recurrentes mensuales / 30)
  const dailyFromOneTime = oneTimeTotal / daysInPeriod;
  const dailyFromRecurring = recurringMonthlyTotal / 30;
  const dailyRate = dailyFromOneTime + dailyFromRecurring;

  return {
    dailyRate,
    monthlyProjection
  };
};

/**
 * Página de reportes financieros completa
 * Sistema integral de análisis financiero y gestión de gastos
 */
const Reports = () => {
  // Estados principales
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  
  // Estados para nuevos modales de gastos
  const [showExpenseTypeSelector, setShowExpenseTypeSelector] = useState(false);
  const [showOneTimeExpenseModal, setShowOneTimeExpenseModal] = useState(false);
  const [showRecurringExpenseModal, setShowRecurringExpenseModal] = useState(false);
  
  // Estados para modales de desglose de gastos por tipo
  const [showOneTimeExpensesModal, setShowOneTimeExpensesModal] = useState(false);
  const [showRecurringExpensesModal, setShowRecurringExpensesModal] = useState(false);
  
  // Estados para modales de reportes
  const [showPaymentMethodsModal, setShowPaymentMethodsModal] = useState(false);
  const [showExpensesBreakdownModal, setShowExpensesBreakdownModal] = useState(false);
  const [showRevenueBreakdownModal, setShowRevenueBreakdownModal] = useState(false);
  const [showRevenueTypesModal, setShowRevenueTypesModal] = useState(false);
  const [showCashBreakdownModal, setShowCashBreakdownModal] = useState(false);
  const [showDigitalPaymentsModal, setShowDigitalPaymentsModal] = useState(false);
  const [showProductsSoldModal, setShowProductsSoldModal] = useState(false);
  const [showServicesBreakdownModal, setShowServicesBreakdownModal] = useState(false);
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
  
  // Estados para modal de eliminación
  const [showDeleteExpenseModal, setShowDeleteExpenseModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Hooks principales
  const {
    data: financialData,
    loading: isLoading,
    error,
    dateRange,
    datePresets,
    setDateRangePreset,
    setCustomDateRange,
    refreshData,
    calculations,
    formatCurrency
  } = useFinancialReports();

  // Compatibilidad: adaptadores que reciben la forma antigua (objeto range)
  const handleLegacyPreset = (preset) => {
    if (preset === 'all') {
      // Mapear preset legacy 'all' al nuevo 'allData'
      setDateRangePreset('allData');
      return;
    }
    if (preset === 'custom') {
      // No forzamos preset aquí; se establecerá cuando el usuario elija rango personalizado
      return;
    }
    setDateRangePreset(preset);
  };

  const handleLegacyCustomRange = (range) => {
    if (!range) return;
    const { startDate, endDate } = range;
    setCustomDateRange(startDate, endDate);
  };

  // Adaptar preset a claves legacy para el componente visual del filtro
  const uiDateRange = useMemo(() => ({
    ...dateRange,
    preset: dateRange?.preset === 'allData' ? 'all' : dateRange?.preset
  }), [dateRange]);

  // Loading unificado para tablero financiero y gastos recurrentes (se reubica más abajo tras obtener expensesLoading)

  // Datos del Financial Dashboard disponibles
  useEffect(() => {
    if (financialData?.summary) {
      // Dashboard data ready
    }
  }, [financialData, formatCurrency, dateRange]);

  // Usar el nuevo hook para gastos recurrentes
  const {
    recurringExpenses,
    inferredRecurringTotal,
    loading: expensesLoading,
    error: expensesError,
    createRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    toggleRecurringStatus
  } = useRecurringExpenses();

  // 🚨 Sanitization: Crear una versión saneada de los gastos recurrentes para evitar crashes.
  const sanitizedRecurringExpenses = useMemo(() => {
    if (!Array.isArray(recurringExpenses)) return [];
    
    const originalCount = recurringExpenses.length;
    const sanitized = recurringExpenses.filter(e => {
      if (!e || typeof e !== 'object') {
        console.warn('🧹 Reports.jsx: Filtrado un elemento no-objeto de recurringExpenses.', e);
        return false;
      }
      // Puedes añadir más validaciones si es necesario
      return true;
    });

    if (sanitized.length < originalCount) {
      console.log(`🧹 Reports.jsx: Se filtraron ${originalCount - sanitized.length} elementos inválidos de 'recurringExpenses'.`);
    }
    
    return sanitized;
  }, [recurringExpenses]);

  // Fallback: si el hook no pudo inferir (porque /expenses/summary devolvió 400) usar summary ya cargado en financialData
  const effectiveInferredRecurringTotal = useMemo(() => {
    return (
      inferredRecurringTotal
      || financialData?.summary?.recurringExpensesTotal
      || financialData?.summary?.recurringExpensesInferred
      || financialData?.summary?.recurringExpensesRecalculated
      || 0
    );
  }, [inferredRecurringTotal, financialData]);

  // Loading unificado (dashboard + gastos recurrentes)  
  const financialLoading = Boolean(isLoading || expensesLoading);
  const financialError = error ? (typeof error === 'string' ? error : error.message || 'Error financiero') : null;

  // Las categorías y métodos de pago se obtienen del hook useFinancialReports (ya desestructurados arriba)
  // Si por alguna razón vienen undefined, garantizamos arrays vacíos para evitar errores aguas abajo
  // Derivar categorías de gastos de los datos ya cargados (financialData.expenseBreakdown) para evitar dependencia a variable eliminada
  const safeExpenseCategories = useMemo(() => {
    const breakdown = financialData?.expenseBreakdown || financialData?.expenseCategories || [];
    if (!Array.isArray(breakdown)) return [];
    // Normalizar estructura: { value, label, total } con traducciones
    return breakdown.map(item => {
      const value = item.value || item.category || item.key || item._id || 'unknown';
      return {
        value,
        label: getCategoryLabel(value), // ✅ Usar función de traducción
        total: item.total || item.totalAmount || item.amount || 0
      };
    });
  }, [financialData]);
  
  // Normalizar métodos de pago a partir del summary (fuente primaria) o lista previa
  const safePaymentMethods = useMemo(() => {
    const pmObj = financialData?.summary?.paymentMethods || {};
    // Si tenemos un objeto con montos, convertirlo a array con value/label traducidos
    const fromSummary = Object.keys(pmObj).map(k => ({ 
      value: k, 
      label: getPaymentMethodLabel(k), // ✅ Usar función de traducción
      amount: pmObj[k] 
    }));
    return fromSummary;
  }, [financialData]);

  // Función para refrescar todos los datos
  const refreshAllData = useCallback(() => {
    refreshData();
  }, [refreshData]);

  // Handler para clicks en cards del dashboard
  const handleCardClick = (cardId, cardData) => {
    switch (cardId) {
      case 'ingresos':
        setShowRevenueBreakdownModal(true);
        break;
      case 'gastos':
        setShowExpensesBreakdownModal(true);
        break;
      case 'efectivo':
        setShowCashBreakdownModal(true);
        break;
      case 'digitales':
        setShowDigitalPaymentsModal(true);
        break;
      case 'porcentaje':
      case 'ganancia':
        setShowRevenueTypesModal(true);
        break;
      case 'tipos':
        setShowRevenueTypesModal(true);
        break;
      case 'citas':
        setShowAppointmentsModal(true);
        break;
      case 'servicios':
        setShowServicesBreakdownModal(true);
        break;
      case 'productos':
        setShowProductsSoldModal(true);
        break;
      case 'one-time':
        setActiveModal('oneTime');
        break;
      case 'recurring':
        setActiveModal('recurring');
        break;
      default:
        break;
    }
  };

  // Funciones para calcular métricas de gastos usando datos del backend
  const getOneTimeExpensesStats = () => {
    const expenses = financialData?.expenses || [];
    const oneTimeExpenses = expenses.filter(expense => expense.type === 'one-time');
    const total = oneTimeExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    return {
      count: oneTimeExpenses.length,
      total
    };
  };

  const getRecurringExpensesStats = () => {
    // ✅ GASTOS RECURRENTES EXISTEN INDEPENDIENTEMENTE DE LAS VENTAS
    // Solo verificamos si hay gastos recurrentes definidos
    
    // ✅ FORZAR CÁLCULO LOCAL SIEMPRE - No usar backend porque envía valores diarios
    if (!sanitizedRecurringExpenses || sanitizedRecurringExpenses.length === 0) {
      // Sin gastos recurrentes, el total es 0
      return { 
        count: 0, 
        total: 0, 
        inferred: false,
        message: 'Sin gastos recurrentes definidos'
      };
    }
    
    const activeRecurringExpenses = sanitizedRecurringExpenses.filter(exp => (exp._isActive !== undefined
      ? exp._isActive
      : (exp.recurrence?.isActive ?? exp.recurringConfig?.isActive ?? exp.isActive ?? true)));

    // ✅ USAR LA MISMA LÓGICA QUE EL MODAL: siempre cálculo mensual
    const monthlyTotal = activeRecurringExpenses.reduce((sum, exp) => {
      try {
        // Usar SIEMPRE el cálculo mensual como en el modal
        return sum + RecurringExpenseCalculator.calculateMonthlyAmount(exp);
      } catch (e) {
        console.warn('Error calculando recurrente', exp.description, e.message);
        return sum;
      }
    }, 0);

    // ✅ APLICAR LÓGICA CORRECTA SEGÚN TIPO DE FILTRO
    const isGeneralFilter = dateRange?.preset === 'all' || dateRange?.preset === 'allData' || !dateRange?.preset;
    let daysWithData = financialData?.summary?.daysWithData || 0;
    
    // Para filtros específicos (día, semana), calcular la porción correspondiente
    if (!isGeneralFilter) {
      // ✅ FILTRO ESPECÍFICO: Calcular porción del período filtrado
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      const daysInPeriod = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      
      // Calcular porción diaria y multiplicar por días del período
      const dailyPortion = monthlyTotal / 30; // 30 días promedio por mes
      const periodTotal = dailyPortion * daysInPeriod;
      
      return {
        count: activeRecurringExpenses.length,
        total: periodTotal,
        inferred: false,
        calculation: `period-${daysInPeriod}days`,
        breakdown: {
          monthlyAmount: monthlyTotal,
          dailyPortion: dailyPortion,
          daysInPeriod: daysInPeriod
        }
      };
    }
    
    // ✅ LÓGICA CORRECTA: Calcular meses desde la fecha más antigua con datos
    let monthsWithData = 1; // Mínimo 1 mes por defecto
    
    if (daysWithData > 30) {
      // Intentar obtener fecha más antigua del backend
      const oldestDate = financialData?.summary?.oldestDataDate || financialData?.oldestDataDate;
      
      if (oldestDate) {
        // Calcular meses desde la fecha más antigua hasta hoy
        const startDate = new Date(oldestDate);
        const today = new Date();
        
        // ✅ CÁLCULO CORREGIDO Y PRECISO con date-fns
        const monthsDiff = differenceInCalendarMonths(today, startDate);
        monthsWithData = Math.max(1, monthsDiff + 1); // +1 para incluir mes actual
      } else {
        // Respaldo: estimar meses basándose en daysWithData distribuidos
        monthsWithData = Math.max(1, Math.ceil(daysWithData / 15)); // Asumir ~15 días promedio por mes con datos
      }
    }
    
    if (daysWithData > 30) {
      // 📊 FILTRO GENERAL: Multiplicar por cantidad de meses transcurridos
      let monthsToUse = monthsWithData; // Por defecto usar monthsWithData
      
      // Si tenemos oldestDate, recalcular monthsDiff para usar el valor correcto
      const oldestDate = financialData?.summary?.oldestDataDate || financialData?.oldestDataDate;
      if (oldestDate) {
        const startDate = new Date(oldestDate);
        const today = new Date();
        const monthsDiff = differenceInCalendarMonths(today, startDate);
        monthsToUse = Math.max(1, monthsDiff); // ✅ USAR monthsDiff sin el +1
      }
      
      const totalForPeriod = monthlyTotal * monthsToUse;
      
      return {
        count: activeRecurringExpenses.length,
        total: totalForPeriod,
        inferred: false,
        calculation: `general-${monthsToUse}months`,
        breakdown: {
          monthlyAmount: monthlyTotal,
          monthsUsed: monthsToUse,
          daysWithData
        }
      };
    } else {
      // 📅 FILTRO ESPECÍFICO: Usar valor mensual directo
      
      return {
        count: activeRecurringExpenses.length,
        total: monthlyTotal,
        inferred: false,
        calculation: 'monthly-specific'
      };
    }
  };

  // ✅ NUEVA FUNCIÓN: Para la card de gastos (suma exacta mensual sin multiplicación)
  const getRecurringExpensesMonthlyStats = () => {
    // ✅ GASTOS RECURRENTES EXISTEN INDEPENDIENTEMENTE DE LAS VENTAS
    
    if (!sanitizedRecurringExpenses || sanitizedRecurringExpenses.length === 0) {
      return { 
        count: 0, 
        total: 0, 
        inferred: false,
        message: 'Sin gastos recurrentes definidos'
      };
    }
    
    const activeRecurringExpenses = sanitizedRecurringExpenses.filter(exp => (exp._isActive !== undefined
      ? exp._isActive
      : (exp.recurrence?.isActive ?? exp.recurringConfig?.isActive ?? exp.isActive ?? true)));

    // ✅ SUMA EXACTA: Solo montos mensuales SIN multiplicación
    const total = activeRecurringExpenses.reduce((sum, exp) => {
      try {
        return sum + RecurringExpenseCalculator.calculateMonthlyAmount(exp);
      } catch (e) {
        console.warn('Error calculando recurrente', exp.description, e.message);
        return sum;
      }
    }, 0);

    return {
      count: activeRecurringExpenses.length,
      total: total, // Suma exacta mensual
      inferred: false,
      calculation: 'monthly-sum-exact'
    };
  };

  const getTotalExpensesStats = () => {
    // Aplicar la lógica correcta:
    // 1. Gastos one-time del período filtrado
    // 2. Gastos recurrentes SIEMPRE (independientemente de las ventas)
    
    const oneTimeStats = getOneTimeExpensesStats();
    const hasRevenue = (financialData?.summary?.totalRevenue || 0) > 0;
    
    // ✅ SIEMPRE incluir gastos recurrentes - existen independientemente de las ventas
    const recurringStats = getRecurringExpensesStats();
    const recurringTotal = recurringStats.total;
    const recurringCount = recurringStats.count;
    
    return {
      count: oneTimeStats.count + recurringCount,
      total: oneTimeStats.total + recurringTotal,
      breakdown: {
        oneTime: oneTimeStats.total,
        recurring: recurringTotal,
        hasRevenue,
        message: 'Gastos normales + recurrentes (siempre incluidos)'
      }
    };
  };

  // Definir safeBasicMetrics después de las funciones para evitar errores de inicialización
  const safeBasicMetrics = {
    totalRevenue: financialData?.summary?.totalRevenue || 0,
    totalExpenses: getTotalExpensesStats().total, // ✅ Usar mismo cálculo que las tarjetas exitosas
    netProfit: (financialData?.summary?.totalRevenue || 0) - getTotalExpensesStats().total // ✅ Recalcular netProfit con gastos correctos
  };

  // ===== Nuevos datos para gráficos de barras (Análisis) =====
  const categoryChartData = useMemo(() => {
    const expenses = financialData?.expenses || [];
    
    // ✅ INCLUIR GASTOS RECURRENTES: Combinar gastos únicos + recurrentes
    const totals = expenses.reduce((acc, e) => {
      const key = e.category || 'other';
      acc[key] = (acc[key] || 0) + (e.amount || 0);
      return acc;
    }, {});
    
    // ✅ AGREGAR GASTOS RECURRENTES SI EXISTEN
    if (sanitizedRecurringExpenses && sanitizedRecurringExpenses.length > 0) {
      const activeRecurringExpenses = sanitizedRecurringExpenses.filter(exp => (exp._isActive !== undefined
        ? exp._isActive
        : (exp.recurrence?.isActive ?? exp.recurringConfig?.isActive ?? exp.isActive ?? true)));
      
      activeRecurringExpenses.forEach(exp => {
        try {
          // Calcular monto para el período filtrado
          const monthlyAmount = RecurringExpenseCalculator.calculateMonthlyAmount(exp);
          
          // Para filtros específicos, calcular porción del período
          const isGeneralFilter = dateRange?.preset === 'all' || dateRange?.preset === 'allData' || !dateRange?.preset;
          let amountForPeriod = monthlyAmount;
          
          if (!isGeneralFilter && dateRange?.startDate && dateRange?.endDate) {
            const start = new Date(dateRange.startDate);
            const end = new Date(dateRange.endDate);
            const daysInPeriod = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
            const dailyPortion = monthlyAmount / 30; // 30 días promedio por mes
            amountForPeriod = dailyPortion * daysInPeriod;
          }
          
          const category = exp.category || 'other';
          totals[category] = (totals[category] || 0) + amountForPeriod;
        } catch (error) {
          console.warn('Error calculando gasto recurrente para gráfico:', exp.description, error);
        }
      });
    }
    
    // Si no hay datos, retornar array vacío
    if (Object.keys(totals).length === 0) return [];
    
    return Object.entries(totals)
      .map(([key, value]) => ({
        key,
        label: getCategoryLabel(key), // ✅ Usar función de traducción
        value
      }))
      .sort((a,b) => b.value - a.value)
      .slice(0, 10);
  }, [financialData?.expenses, sanitizedRecurringExpenses, dateRange]);

  const paymentMethodChartData = useMemo(() => {
    // Usar ingresos (summary.paymentMethods) si están disponibles; fallback a conteo en gastos
    const pmSummary = financialData?.summary?.paymentMethods || {};
    const entries = Object.entries(pmSummary).filter(([, v]) => v > 0);
    if (entries.length > 0) {
      return entries.map(([method, amount]) => ({
          key: method,
          label: getPaymentMethodLabel(method), // ✅ Usar función de traducción
          value: amount
        })).sort((a,b) => b.value - a.value);
    }
    const expenses = financialData?.expenses || [];
    if (expenses.length === 0) return [];
    const counts = expenses.reduce((acc, e) => {
      const m = e.paymentMethod || 'other';
      acc[m] = (acc[m] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([key, value]) => ({
      key,
      label: getPaymentMethodLabel(key), // ✅ Usar función de traducción
      value
    })).sort((a,b) => b.value - a.value);
  }, [financialData]); // ✅ Removida dependencia de safePaymentMethods

  const revenueTypeChartData = useMemo(() => {
    const summary = financialData?.summary || {};
    const data = [
      { key: 'services', label: 'Cortes', value: summary.serviceRevenue || 0 },
      { key: 'products', label: 'Productos', value: summary.productRevenue || 0 },
      { key: 'appointments', label: 'Citas', value: summary.appointmentRevenue || 0 }
    ];
    return data.filter(d => d.value > 0);
  }, [financialData]);

  // Semana actual (Lunes-Domingo) usando dailyData del hook
  const weeklyRevenueData = useMemo(() => {
    const daily = financialData?.dailyData || [];
    const today = new Date();
    // Obtener lunes de la semana actual (considerando lunes = 1)
    const day = today.getDay(); // 0 Domingo ... 6 Sábado
    const diffToMonday = (day === 0 ? -6 : 1 - day); // mover al lunes
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    monday.setHours(0,0,0,0);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
    const mapDaily = daily.reduce((acc, item) => {
      if (!item?.date) return acc;
      const key = item.date; // YYYY-MM-DD
      // Posibles nombres de campo de ingreso diario
      const val = item.revenue ?? item.totalRevenue ?? item.total ?? item.amount ?? 0;
      acc[key] = (acc[key] || 0) + val;
      return acc;
    }, {});
    const formatter = new Intl.DateTimeFormat('es-CO', { weekday: 'short' });
    return days.map(d => {
      const iso = d.toISOString().split('T')[0];
      return {
        key: iso,
        label: formatter.format(d).replace('.', ''),
        value: mapDaily[iso] || 0
      };
    });
  }, [financialData]);

  const weeklyTotals = useMemo(() => {
    const total = weeklyRevenueData.reduce((s, d) => s + d.value, 0);
    const avg = weeklyRevenueData.length > 0 ? total / weeklyRevenueData.length : 0;
    return { total, avg };
  }, [weeklyRevenueData]);

  // Componente interno simple para gráfico de barras vertical
  const VerticalBarChart = ({ data, currency = false, height = 180, barColorClass = 'from-blue-500 to-indigo-500' }) => {
    if (!data || data.length === 0) {
      return <div className="text-center text-gray-500 text-sm py-8">Sin datos</div>;
    }
    const max = Math.max(...data.map(d => d.value), 1);
    
    // Determinar si necesita scroll o distribución completa
    const needsScroll = data.length > 6; // Reducido de 8 a 6 para mejor espaciado
    const containerClass = needsScroll 
      ? "flex items-end justify-start gap-6 px-3" // Aumenté gap y padding
      : "flex items-end justify-between px-4";
    const itemWidth = needsScroll ? "80px" : "auto"; // Aumenté ancho para texto
    const itemClass = needsScroll 
      ? "flex flex-col items-center group" 
      : "flex flex-col items-center group flex-1";
    
    // Estilos para scrollbar personalizada
    const scrollbarStyle = {
      scrollbarWidth: 'thin',
      scrollbarColor: '#4B5563 transparent',
      '&::-webkit-scrollbar': {
        height: '6px',
      },
      '&::-webkit-scrollbar-track': {
        background: 'rgba(31, 41, 55, 0.3)',
        borderRadius: '3px',
      },
      '&::-webkit-scrollbar-thumb': {
        background: 'rgba(75, 85, 99, 0.6)',
        borderRadius: '3px',
      },
      '&::-webkit-scrollbar-thumb:hover': {
        background: 'rgba(107, 114, 128, 0.8)',
      }
    };
    
    return (
      <div 
        className="w-full overflow-x-auto"
        style={scrollbarStyle}
      >
        <div 
          className={containerClass}
          style={{ 
            height: `${height}px`, 
            minWidth: needsScroll ? `${data.length * 86}px` : '100%' // Aumenté espaciado
          }}
        >
          {data.map(d => {
            const pct = Math.max((d.value / max) * 100, 2); // Mínimo 2% para visibilidad
            return (
              <div 
                key={d.key} 
                className={itemClass}
                style={needsScroll ? { width: itemWidth } : { minWidth: '60px' }} // Ancho mínimo en distribución completa
              >
                <div className="w-full relative flex items-end justify-center" style={{ height: `${height - 60}px` }}> {/* Más espacio para texto */}
                  <div 
                    className={`bg-gradient-to-t ${barColorClass} transition-all duration-500 rounded-t-sm border border-white/20 relative group-hover:scale-105 shadow-lg`} 
                    style={{ 
                      width: needsScroll ? '40px' : '50%', // Barras un poco más anchas
                      height: `${pct}%`,
                      minHeight: '4px'
                    }}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 flex items-center justify-center text-[10px] text-white font-medium text-center p-1 rounded-sm">
                      {currency ? formatCurrency(d.value) : d.value.toLocaleString('es-CO')}
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-center px-1" style={{ width: needsScroll ? '78px' : 'auto', minHeight: '42px' }}> {/* Altura mínima fija para texto */}
                  <div style={{ minHeight: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span 
                      className="block text-[10px] sm:text-xs text-gray-300 font-medium leading-tight break-words hyphens-auto" 
                      title={d.label}
                      style={{ 
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        lineHeight: '1.2'
                      }}
                    >
                      {d.label}
                    </span>
                  </div>
                  <span className="block text-[9px] text-gray-500 mt-1">
                    {currency ? formatCurrency(d.value) : d.value.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Variante pequeña para múltiple uso
  const MiniVerticalBarChart = ({ data, barColorClass, currency = true }) => (
    <VerticalBarChart data={data} barColorClass={barColorClass} height={120} currency={currency} />
  );

  // Tabs de navegación
  const tabs = [
    { 
      id: 'dashboard', 
      label: 'Resumen', 
      icon: BarChart3
    },
    { 
      id: 'expenses', 
      label: 'Gastos', 
      icon: DollarSign
    },
    { 
      id: 'analysis', 
      label: 'Análisis', 
      icon: PieChart
    }
  ];

  // Handlers para gastos
  const handleSaveExpense = async (expenseData) => {
    try {
      if (editingExpense) {
        // Solo maneja gastos recurrentes por ahora
        if (
          editingExpense.type === 'recurring-template' ||
          editingExpense.type === 'recurring' ||
          expenseData.type === 'recurring-template' ||
          expenseData.type === 'recurring'
        ) {
          await updateRecurringExpense(editingExpense._id, expenseData);
        }
      } else {
        // Crear gasto recurrente
        if (expenseData.type === 'recurring' || expenseData.type === 'recurring-template') {
          await createRecurringExpense(expenseData);
        }
      }
      closeExpenseModals();
      setEditingExpense(null);
      refreshAllData();
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    // Determinar qué modal abrir basado en el tipo de gasto
    if (expense.type === 'recurring' || expense.type === 'recurring-template') {
      setShowRecurringExpenseModal(true);
    } else {
      setShowOneTimeExpenseModal(true);
    }
  };

  // Función para manejar la creación de gastos
  const handleCreateExpense = () => {
    setEditingExpense(null);
    setShowExpenseTypeSelector(true);
  };

  // Función para manejar selección de tipo de gasto
  const handleExpenseTypeSelect = (type) => {
    setShowExpenseTypeSelector(false);
    if (type === 'recurring') {
      setShowRecurringExpenseModal(true);
    } else {
      setShowOneTimeExpenseModal(true);
    }
  };

  // Función para cerrar todos los modales de gastos
  const closeExpenseModals = () => {
    setShowExpenseTypeSelector(false);
    setShowOneTimeExpenseModal(false);
    setShowRecurringExpenseModal(false);
    setEditingExpense(null);
  };

  const handleDeleteExpense = async (expenseId) => {
    // Buscar el gasto en ambas listas para poder mostrarlo en el modal
    const oneTimeExpenses = financialData?.expenses || [];
    const expense = oneTimeExpenses.find(exp => exp._id === expenseId) || 
                   recurringExpenses.find(exp => exp._id === expenseId);
    
    if (expense) {
      setExpenseToDelete(expense);
      setShowDeleteExpenseModal(true);
    }
  };

  const handleConfirmDeleteExpense = async (expenseId) => {
    setDeleteLoading(true);
    try {
      await deleteRecurringExpense(expenseId);
      setShowDeleteExpenseModal(false);
      setExpenseToDelete(null);
      refreshAllData();
    } catch (error) {
      console.error('Error deleting expense:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteExpenseModal(false);
    setExpenseToDelete(null);
    setDeleteLoading(false);
  };

  const handleToggleRecurring = async (expenseId, isActive) => {
    try {
      await toggleRecurringStatus(expenseId, isActive);
    } catch (error) {
      console.error('Error toggling recurring expense:', error);
    }
  };

  const handleRefreshAll = async () => {
    try {
      await Promise.all([
        refreshAllData(),
        processAutomaticExpenses()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  // Renderizar contenido por tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            {/* Dashboard de reportes financieros */}
            <FinancialDashboard
              data={{
                ...financialData,
                summary: {
                  ...financialData?.summary,
                  totalExpenses: getTotalExpensesStats().total, // ✅ Usar cálculo correcto
                  netProfit: (financialData?.summary?.totalRevenue || 0) - getTotalExpensesStats().total // ✅ Recalcular netProfit
                }
              }}
              calculations={calculations}
              loading={financialLoading}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              onCardClick={handleCardClick}
            />

            {/* Métricas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              <div 
                className="group relative bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6 backdrop-blur-sm shadow-xl shadow-blue-500/20 overflow-hidden cursor-pointer hover:bg-white/10 transition-all duration-300"
                onClick={() => setShowRevenueBreakdownModal(true)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-xl"></div>
                
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-lg border border-green-500/20">
                      <BarChart3 className="w-5 h-5 text-green-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-300">Desglose de Ingresos</h3>
                  </div>
                  <p className="text-xl font-bold text-green-400">
                    {formatCurrency(safeBasicMetrics?.totalRevenue || 0)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Click para ver detalles</p>
                </div>
              </div>

              <div 
                className="group relative bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6 backdrop-blur-sm shadow-xl shadow-blue-500/20 overflow-hidden cursor-pointer hover:scale-105 transition-all duration-300"
                onClick={() => handleCardClick('gastos')}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-xl"></div>
                
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-r from-red-600/20 to-orange-600/20 rounded-lg border border-red-500/20">
                      <TrendingUp className="w-5 h-5 text-red-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-300">Gastos del Período</h3>
                  </div>
                  <p className="text-xl font-bold text-red-400">
                    {formatCurrency(getTotalExpensesStats().total)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {(() => {
                      const stats = getTotalExpensesStats();
                      const hasRevenue = (financialData?.summary?.totalRevenue || 0) > 0;
                      return hasRevenue 
                        ? `${stats.count} gasto${stats.count !== 1 ? 's' : ''} · Normales + Recurrentes`
                        : `${stats.count} gasto${stats.count !== 1 ? 's' : ''} · Solo Normales (sin ventas)`;
                    })()}
                  </p>
                </div>
              </div>

              <div 
                className="group relative bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6 backdrop-blur-sm shadow-xl shadow-blue-500/20 overflow-hidden cursor-pointer hover:scale-105 transition-all duration-300"
                onClick={() => handleCardClick('tipos')}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-xl"></div>
                
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg border border-purple-500/20">
                      <TrendingUp className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-300">Tipos de Ingresos</h3>
                  </div>
                  <p className="text-xl font-bold text-purple-400">
                    {formatCurrency(safeBasicMetrics?.totalRevenue || 0)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Ver desglose por fuente</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'expenses':
        return (
          <div className="space-y-8">
            {/* Métricas principales de gastos - estilo dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              
              {/* Total de Gastos del Período */}
              <div 
                className="group relative bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6 backdrop-blur-sm shadow-xl shadow-blue-500/20 overflow-hidden cursor-pointer hover:bg-white/10 transition-all duration-300"
                onClick={() => setShowExpensesBreakdownModal(true)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-xl"></div>
                
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-r from-red-600/20 to-orange-600/20 rounded-lg border border-red-500/20">
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-300">Total Gastos</h3>
                  </div>
                  <p className="text-xl font-bold text-red-400">
                    {formatCurrency(getTotalExpensesStats().total)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {(() => {
                      const stats = getTotalExpensesStats();
                      if (stats.breakdown) {
                        return `Normal: ${formatCurrency(stats.breakdown.oneTime)} + Recurrent: ${formatCurrency(stats.breakdown.recurring)}`;
                      }
                      return `${stats.count} gasto${stats.count !== 1 ? 's' : ''} total${stats.count !== 1 ? 'es' : ''}`;
                    })()}
                  </p>
                </div>
              </div>

              {/* Gastos Únicos */}
              <div 
                className="group relative bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6 backdrop-blur-sm shadow-xl shadow-green-500/20 overflow-hidden cursor-pointer hover:bg-white/10 transition-all duration-300"
                onClick={() => setShowOneTimeExpensesModal(true)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-xl"></div>
                
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-lg border border-green-500/20">
                      <Calendar className="w-5 h-5 text-green-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-300">Gastos Únicos</h3>
                  </div>
                  <p className="text-xl font-bold text-green-400">
                    {formatCurrency(getOneTimeExpensesStats().total)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {getOneTimeExpensesStats().count} gasto{getOneTimeExpensesStats().count !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Gastos Recurrentes */}
              <div 
                className="group relative bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6 backdrop-blur-sm shadow-xl shadow-purple-500/20 overflow-hidden cursor-pointer hover:bg-white/10 transition-all duration-300"
                onClick={() => setShowRecurringExpensesModal(true)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-xl"></div>
                
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg border border-purple-500/20">
                      <Repeat className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-300">Gastos Recurrentes</h3>
                  </div>
                  {(() => { const stats = getRecurringExpensesMonthlyStats(); return (
                    <>
                      <p className="text-xl font-bold text-purple-400">
                        {formatCurrency(stats.total)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        {(() => {
                          const hasRevenue = (financialData?.summary?.totalRevenue || 0) > 0;
                          if (!hasRevenue) {
                            return (
                              <>
                                <span className="text-orange-400">Pausados (sin ventas)</span>
                                <span className="px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-[10px] text-orange-300">$0</span>
                              </>
                            );
                          }
                          return (
                            <>
                              {stats.count} activo{stats.count !== 1 ? 's' : ''}
                              {stats.inferred && (
                                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-[10px] text-purple-300" title="Monto inferido a partir de la diferencia entre gastos totales y únicos">inferido</span>
                              )}
                              <span className="px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30 text-[10px] text-green-300">Con ventas</span>
                            </>
                          );
                        })()}
                      </p>
                    </>
                  ); })()}
                </div>
              </div>

              {/* Nuevo Gasto */}
              <div 
                className="group relative bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6 backdrop-blur-sm shadow-xl shadow-orange-500/20 overflow-hidden cursor-pointer hover:scale-105 transition-all duration-300"
                onClick={() => {
                  handleCreateExpense();
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-xl"></div>
                
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-r from-orange-600/20 to-yellow-600/20 rounded-lg border border-orange-500/20">
                      <Plus className="w-5 h-5 text-orange-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-300">Nuevo Gasto</h3>
                  </div>
                  <p className="text-xl font-bold text-orange-400">
                    Crear
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Click para agregar</p>
                </div>
              </div>
            </div>

            {/* Lista de gastos recientes - estilo simplificado */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-orange-400 via-red-400 to-orange-500 bg-clip-text text-transparent">Gastos Recientes</h3>
                {(financialData?.expenses?.length || 0) > 0 && (
                  <span className="text-sm text-gray-400">
                    {financialData?.expenses?.length || 0} gasto{(financialData?.expenses?.length || 0) !== 1 ? 's' : ''} registrado{(financialData?.expenses?.length || 0) !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {expensesLoading ? (
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-white/5 border border-white/10 rounded-xl p-4 h-16"></div>
                  ))
                ) : (financialData?.expenses?.length || 0) === 0 ? (
                  <div className="group relative bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm shadow-xl shadow-blue-500/20 overflow-hidden text-center">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-xl"></div>
                    
                    <div className="relative">
                      <TrendingDown className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400 mb-2">No hay gastos en este período</p>
                      <p className="text-sm text-gray-500">Los gastos aparecerán aquí una vez registrados</p>
                    </div>
                  </div>
                ) : (
                  (financialData?.expenses || []).slice(0, 10).map((expense) => (
                    <div
                      key={expense._id}
                      className="group relative bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm shadow-xl shadow-blue-500/20 hover:bg-white/8 transition-all duration-300 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-xl"></div>
                      
                      <div className="relative flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-semibold text-white text-sm truncate">{expense.description}</h4>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30 flex-shrink-0">
                              {getCategoryLabel(expense.category)} {/* ✅ Usar función de traducción */}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span className="text-gray-300">
                              {formatDate(expense.date)}
                            </span>
                            <span>
                              {getPaymentMethodLabel(expense.paymentMethod)} {/* ✅ Usar función de traducción */}
                            </span>
                          </div>
                        </div>

                        <div className="text-right ml-4">
                          <span className="font-bold text-red-400 text-base">
                            {formatCurrency(expense.amount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {(financialData?.expenses?.length || 0) > 10 && (
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Mostrando los 10 gastos más recientes de {financialData?.expenses?.length || 0} total
                  </p>
                </div>
              )}
            </div>


          </div>
        );

      case 'analysis':
        return (
          <div className="space-y-8">
            {/* KPIs Principales Simplificados */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Margen Bruto</span>
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-lg font-semibold text-green-400">
                  {safeBasicMetrics.totalRevenue > 0 ? (((safeBasicMetrics.totalRevenue - safeBasicMetrics.totalExpenses) / safeBasicMetrics.totalRevenue) * 100).toFixed(1) + '%' : '0%'}
                </p>
                <p className="text-[10px] text-gray-500 mt-1">{safeBasicMetrics.totalRevenue > safeBasicMetrics.totalExpenses ? 'Rentable' : 'En pérdidas'}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Ratio Gastos</span>
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-lg font-semibold text-purple-400">{safeBasicMetrics.totalRevenue > 0 ? ((safeBasicMetrics.totalExpenses / safeBasicMetrics.totalRevenue) * 100).toFixed(1) + '%' : '0%'}</p>
                <p className="text-[10px] text-gray-500 mt-1">% sobre ingresos</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Gasto Diario</span>
                  <Calendar className="w-4 h-4 text-red-400" />
                </div>
                <p className="text-lg font-semibold text-red-400">
                  {(() => {
                    // ✅ CÁLCULO CORRECTO: Considerar gastos recurrentes por su frecuencia real
                    const calculation = calculateCorrectDailyExpenses(
                      financialData?.expenses || [], 
                      sanitizedRecurringExpenses || [], 
                      dateRange.startDate, 
                      dateRange.endDate
                    );
                    return formatCurrency(calculation.dailyRate);
                  })()}
                </p>
                <p className="text-[10px] text-gray-500 mt-1">Promedio periodo</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Gasto Top</span>
                  <PieChart className="w-4 h-4 text-yellow-400" />
                </div>
                <p className="text-sm font-semibold text-yellow-400 truncate" title={categoryChartData[0]?.label || 'N/A'}>{categoryChartData[0]?.label || 'N/A'}</p>
                <p className="text-[10px] text-gray-500 mt-1">Principal categoría</p>
              </div>
            </div>

            {/* Gráficos de Barras */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Categorías de gastos (vertical) */}
              <div className="group relative bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm shadow-xl shadow-blue-500/20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-xl"></div>
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold bg-gradient-to-r from-red-400 via-orange-400 to-red-500 bg-clip-text text-transparent">Gastos por Categoría</h3>
                    <span className="text-[10px] text-gray-500">Top 10</span>
                  </div>
                  <VerticalBarChart data={categoryChartData} currency barColorClass="from-red-500 to-orange-500" />
                </div>
              </div>
              
              {/* Métodos de pago (ingresos) */}
              <div className="group relative bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm shadow-xl shadow-blue-500/20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-xl"></div>
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500 bg-clip-text text-transparent">Ingresos por Método de Pago</h3>
                    <span className="text-[10px] text-gray-500">Total</span>
                  </div>
                  <VerticalBarChart data={paymentMethodChartData} currency barColorClass="from-blue-500 to-indigo-500" />
                </div>
              </div>
            </div>

            {/* Semana actual y tipos de ingreso */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 group relative bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm shadow-xl shadow-blue-500/20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-xl"></div>
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 bg-clip-text text-transparent">Ventas Semana Actual (Lun-Dom)</h3>
                    <div className="text-[10px] text-gray-500">Total {formatCurrency(weeklyTotals.total)} | Prom {formatCurrency(weeklyTotals.avg)}</div>
                  </div>
                  <VerticalBarChart data={weeklyRevenueData} currency barColorClass="from-emerald-500 to-teal-500" />
                </div>
              </div>
              
              <div className="group relative bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm shadow-xl shadow-blue-500/20 overflow-hidden flex flex-col">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-xl"></div>
                
                <div className="relative flex-1">
                  <h3 className="text-sm font-semibold bg-gradient-to-r from-fuchsia-400 via-pink-400 to-fuchsia-500 bg-clip-text text-transparent mb-4">Ingresos por Tipo</h3>
                  <MiniVerticalBarChart data={revenueTypeChartData} barColorClass="from-fuchsia-500 to-pink-500" />
                  <div className="mt-4 space-y-1 text-[11px] text-gray-400">
                    {revenueTypeChartData.map(r => (
                      <div key={r.key} className="flex justify-between">
                        <span className="text-gray-300">{r.label}</span>
                        <span className="text-gray-400">{formatCurrency(r.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recomendaciones rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-xs">
                <p className="text-green-300 font-medium mb-1">Margen</p>
                <p className="text-gray-300">{safeBasicMetrics.totalRevenue > 0 ? (((safeBasicMetrics.totalRevenue - safeBasicMetrics.totalExpenses) / safeBasicMetrics.totalRevenue) * 100).toFixed(1) : '0'}% actual. {safeBasicMetrics.totalRevenue > safeBasicMetrics.totalExpenses ? 'Mantén control de gastos.' : 'Ajustar gastos o aumentar ingresos.'}</p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-xs">
                <p className="text-blue-300 font-medium mb-1">Concentración</p>
                <p className="text-gray-300">Top método pago: {paymentMethodChartData[0]?.label || 'N/A'} ({paymentMethodChartData[0]?.value ? ((paymentMethodChartData[0].value / (financialData?.summary?.totalRevenue || 1)) * 100).toFixed(1) : 0}%)</p>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-xs">
                <p className="text-yellow-300 font-medium mb-1">Proyección</p>
                <p className="text-gray-300">Gasto mensual estimado: {(() => {
                  // ✅ CÁLCULO CORRECTO: Proyección mensual basada en frecuencias reales
                  const calculation = calculateCorrectDailyExpenses(
                    financialData?.expenses || [], 
                    sanitizedRecurringExpenses || [], 
                    dateRange.startDate, 
                    dateRange.endDate
                  );
                  return formatCurrency(calculation.monthlyProjection);
                })()}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <PageContainer>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 space-y-8">
        {/* Filtros de fecha - Arriba y compactos */}
        <SimpleDateFilter
          dateRange={uiDateRange}
          onPresetChange={handleLegacyPreset}
          onCustomDateChange={(start, end) => handleLegacyCustomRange({ startDate: start, endDate: end })}
          loading={financialLoading}
        />

        {/* Navegación por tabs compacta como ProfileEdit */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm shadow-xl shadow-blue-500/20 p-1 flex flex-col sm:flex-row gap-1 w-full max-w-xs sm:max-w-md">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`group relative px-3 py-2.5 rounded-xl border cursor-pointer transition-all duration-300 hover:scale-105 overflow-hidden backdrop-blur-sm flex-1 flex items-center justify-center gap-1.5 ${
                  activeTab === id
                    ? 'border-blue-500/50 bg-blue-500/10 shadow-xl shadow-blue-500/20'
                    : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                }`}
              >
                <Icon size={14} className={`transition-all duration-300 ${
                  activeTab === id ? 'text-blue-300' : 'text-white'
                }`} />
                <span className={`font-medium text-xs sm:text-xs whitespace-nowrap ${
                  activeTab === id ? 'text-blue-300' : 'text-white'
                }`}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Botones de acción globales */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            {(financialError || expensesError) && (
              <div className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                {financialError || expensesError}
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            {/* Botones de acción removidos según solicitud */}
          </div>
        </div>

        {/* Contenido de la tab activa */}
        {renderTabContent()}

        {/* Modales de gastos */}
        <ExpenseTypeSelector
          isOpen={showExpenseTypeSelector}
          onClose={closeExpenseModals}
          onSelectType={handleExpenseTypeSelect}
        />

        <OneTimeExpenseModal
          isOpen={showOneTimeExpenseModal}
          onClose={closeExpenseModals}
          expense={editingExpense}
          expenseCategories={safeExpenseCategories}
          paymentMethods={safePaymentMethods}
          onSave={handleSaveExpense}
          loading={expensesLoading}
        />

        <RecurringExpenseModal
          isOpen={showRecurringExpenseModal}
          onClose={closeExpenseModals}
          expense={editingExpense}
          // Pasamos categorías/métodos tal cual; el modal ya tiene fallback internos
          expenseCategories={safeExpenseCategories}
          paymentMethods={safePaymentMethods}
          frequencies={frequencies}
          onSave={handleSaveExpense}
          loading={expensesLoading}
        />

        {/* Modal de gastos (mantener por compatibilidad) */}
        <ExpenseModal
          isOpen={showExpenseModal}
          onClose={() => {
            setShowExpenseModal(false);
            setEditingExpense(null);
          }}
          expense={editingExpense}
          expenseCategories={safeExpenseCategories}
          paymentMethods={safePaymentMethods}
          frequencies={frequencies}
          onSave={handleSaveExpense}
          loading={expensesLoading}
        />

        {/* Modal de desglose por medios de pago */}
        <PaymentMethodsModal
          isOpen={showPaymentMethodsModal}
          onClose={() => setShowPaymentMethodsModal(false)}
          data={financialData}
          formatCurrency={formatCurrency}
          dateRange={dateRange}
        />

        {/* Modal de desglose de gastos */}
        <ExpensesBreakdownModal
          isOpen={showExpensesBreakdownModal}
          onClose={() => setShowExpensesBreakdownModal(false)}
          data={financialData}
          expenses={financialData?.expenses || []}
          recurringExpenses={recurringExpenses}
          formatCurrency={formatCurrency}
          dateRange={dateRange}
          expenseCategories={safeExpenseCategories}
          paymentMethods={safePaymentMethods}
        />

        {/* Modal de desglose de ingresos */}
        <RevenueBreakdownModal
          isOpen={showRevenueBreakdownModal}
          onClose={() => setShowRevenueBreakdownModal(false)}
          revenueData={financialData}
          dateRange={dateRange}
          formatCurrency={formatCurrency}
        />

        {/* Modal de tipos de ingresos */}
        <RevenueTypesModal
          isOpen={showRevenueTypesModal}
          onClose={() => setShowRevenueTypesModal(false)}
          revenueData={financialData?.revenueBreakdown}
          dateRange={dateRange}
          formatCurrency={formatCurrency}
        />

        {/* Modal de desglose de efectivo */}
        <CashBreakdownModal
          isOpen={showCashBreakdownModal}
          onClose={() => setShowCashBreakdownModal(false)}
          revenueData={financialData}
          dashboardData={financialData}
          dateRange={dateRange}
          formatCurrency={formatCurrency}
        />

        {/* Modal de desglose de pagos digitales */}
        <DigitalPaymentsBreakdownModal
          isOpen={showDigitalPaymentsModal}
          onClose={() => setShowDigitalPaymentsModal(false)}
          revenueData={financialData}
          dashboardData={financialData}
          dateRange={dateRange}
          formatCurrency={formatCurrency}
        />

        {/* Modal de productos vendidos */}
        <ProductsSoldModal
          isOpen={showProductsSoldModal}
          onClose={() => setShowProductsSoldModal(false)}
          dateRange={dateRange}
          dashboardData={financialData}
          formatCurrency={formatCurrency}
        />

        {/* Modal de servicios vendidos */}
        <ServicesBreakdownModal
          isOpen={showServicesBreakdownModal}
          onClose={() => setShowServicesBreakdownModal(false)}
          revenueData={financialData}
          dashboardData={financialData}
          dateRange={dateRange}
          formatCurrency={formatCurrency}
        />

        {/* Modal de citas completadas */}
        <AppointmentsBreakdownModal
          isOpen={showAppointmentsModal}
          onClose={() => setShowAppointmentsModal(false)}
          revenueData={financialData}
          dashboardData={financialData}
          dateRange={dateRange}
          formatCurrency={formatCurrency}
        />

        {/* Nuevos modales para listas de gastos por tipo */}
        <OneTimeExpensesListModal
          isOpen={showOneTimeExpensesModal}
          onClose={() => setShowOneTimeExpensesModal(false)}
          expenses={financialData?.expenses || []}
          formatCurrency={formatCurrency}
          dateRange={dateRange}
          onEdit={handleEditExpense}
          onDelete={handleDeleteExpense}
        />

        <RecurringExpensesListModal
          isOpen={showRecurringExpensesModal}
          onClose={() => setShowRecurringExpensesModal(false)}
          recurringExpenses={sanitizedRecurringExpenses}
          inferredRecurringTotal={effectiveInferredRecurringTotal}
          formatCurrency={formatCurrency}
          dateRange={dateRange}
          onEdit={handleEditExpense}
          onDelete={handleDeleteExpense}
          onToggle={handleToggleRecurring}
          onRefresh={refreshData}
        />

        {/* Modal de confirmación de eliminación */}
        <DeleteExpenseModal
          isOpen={showDeleteExpenseModal}
          onClose={handleCloseDeleteModal}
          expense={expenseToDelete}
          onDelete={handleConfirmDeleteExpense}
          isLoading={deleteLoading}
        />
      </div>
    </PageContainer>
  );
};

export default Reports;

// Utilidad local para formatear fechas si no viene de otro hook
const formatDate = (d) => {
  if (!d) return '';
  try {
    const dateObj = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
    if (isNaN(dateObj.getTime())) return '';
    return format(dateObj, 'yyyy-MM-dd');
  } catch (e) {
    return '';
  }
};
