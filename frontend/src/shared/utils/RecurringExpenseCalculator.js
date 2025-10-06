/**
 * RecurringExpenseCalculator - Utilidad para normalizar configuraciones y calcular gastos recurrentes
 * 
 * Este módulo centraliza toda la lógica de cálculos para gastos recurrentes,
 * asegurando consistencia en toda la aplicación.
 */

/**
 * Normaliza la configuración de frecuencia de un gasto recurrente
 * Maneja tanto el formato antiguo (recurringConfig) como el nuevo (recurrence)
 */
export const normalizeRecurringConfig = (expense) => {
  // Debug comentado para evitar saturar consola
  // console.log('🔍 originalData COMPLETO:', expense);

  if (!expense) {
    return {
      frequency: 'monthly',
      interval: 1,
      startDate: new Date().toISOString().split('T')[0],
      isActive: false,
      dailyAdjustments: {},
      adjustmentsMonth: null
    };
  }

  // Priorizar nuevo formato 'recurrence' sobre legacy 'recurringConfig'
  let config = {};
  let frequency, interval;

  if (expense.recurrence) {
    // Nuevo formato: usa 'pattern' en lugar de 'frequency'
    config = expense.recurrence;
    frequency = config.pattern || config.frequency; // pattern es el nuevo campo
    interval = config.interval;
    // console.log('🔍 usando formato NUEVO (recurrence):', { pattern: config.pattern, interval: config.interval });
  } else if (expense.recurringConfig) {
    // Formato legacy
    config = expense.recurringConfig;
    frequency = config.frequency;
    interval = config.interval;
    // console.log('🔍 usando formato LEGACY (recurringConfig):', { frequency: config.frequency, interval: config.interval });
  } else {
    // Fallback a propiedades directas del expense
    frequency = expense.frequency;
    interval = expense.interval;
    config = expense;
    console.log('🔍 usando propiedades DIRECTAS:', { frequency: expense.frequency, interval: expense.interval });
  }

  // Validar y normalizar frequency
  if (!frequency) {
    if (typeof expense.frequency === 'string') {
      frequency = expense.frequency;
    } else if (expense.frequency && typeof expense.frequency === 'object') {
      frequency = expense.frequency.type || expense.frequency.value || expense.frequency.code;
    }
  }
  if (!frequency) frequency = 'monthly';

  // Validar y normalizar interval
  if (interval === undefined || interval === null) {
    if (typeof expense.interval === 'number' || typeof expense.interval === 'string') {
      interval = expense.interval;
    } else if (expense.frequency && typeof expense.frequency === 'object') {
      interval = expense.frequency.interval;
    }
  }
  if (interval === undefined || interval === null || interval === '') interval = 1;
  
  // console.log('🔍 parsing step:', { description: expense.description, originalFrequency: frequency, originalInterval: interval });

  // Mapear patrones del nuevo formato al formato esperado por el calculador
  const frequencyMap = {
    'daily': 'daily',
    'weekly': 'weekly', 
    'biweekly': 'custom', // Cada 14 días
    'monthly': 'monthly',
    'yearly': 'yearly'
  };

  // Aplicar mapeo si es necesario
  let finalFrequency = frequencyMap[frequency] || frequency;
  let finalInterval = parseInt(interval) || 1;

  // 🚨 CASOS ESPECIALES PARA INTERVALOS ESPECÍFICOS
  // Convertir casos como "cada 15 días" a 'custom' para división correcta
  if (frequency === 'monthly' && finalInterval === 15) {
    // "Cada 15 días" - convertir a custom
    finalFrequency = 'custom';
    finalInterval = 15;
  } else if (frequency === 'daily' && finalInterval > 1) {
    // Backend envía "daily" con interval > 1 para "cada X días"
    finalFrequency = 'custom';
    finalInterval = finalInterval; // Mantener el interval original
  } else if (frequency === 'biweekly' || (frequency === 'weekly' && finalInterval === 2)) {
    // "Cada 2 semanas" = "Cada 14 días"
    finalFrequency = 'custom';
    finalInterval = 14;
  }

  // console.log('🔍 final step:', { description: expense.description, finalFrequency, finalInterval });
  
  return {
    frequency: finalFrequency,
    interval: Math.max(1, finalInterval),
    startDate: config.startDate || expense.startDate,
    endDate: config.endDate || expense.endDate,
    dayOfWeek: config.dayOfWeek || expense.dayOfWeek,
    dayOfMonth: config.dayOfMonth || expense.dayOfMonth,
    isActive: config.isActive ?? expense.isActive ?? true,
    dailyAdjustments: config.dailyAdjustments || {},
    adjustmentsMonth: config.adjustmentsMonth
  };
};

/**
 * Calcula los días en el ciclo de recurrencia
 */
export const calculateCycleDays = (frequency, interval = 1) => {
  switch (frequency) {
    case 'daily':
      return Math.max(1, interval);
    case 'weekly':
      return Math.max(1, interval * 7);
    case 'monthly':
      return Math.max(1, interval * 30);
    case 'yearly':
      return Math.max(1, interval * 365);
    case 'custom':
      // Para casos especiales como "cada 15 días"
      return Math.max(1, interval);
    default:
      return 30; // Default mensual
  }
};

/**
 * Calcula el monto diario base de un gasto recurrente
 */
export const calculateBaseDailyAmount = (expense) => {
  if (!expense) return 0;
  
  const config = normalizeRecurringConfig(expense);
  const baseAmount = parseFloat(expense.amount) || 0;

  console.log('🔍 calculateBaseDailyAmount INPUTS COMPLETOS:', {
    description: expense.description,
    baseAmount,
    config: {
      frequency: config.frequency,
      interval: config.interval,
      isActive: config.isActive
    },
    willGoToCustom: config.frequency === 'custom'
  });

  const now = new Date();
  const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  let result;
  let caseUsed;

  switch (config.frequency) {
    case 'daily':
      result = baseAmount;
      caseUsed = 'daily';
      break;
    case 'weekly':
      result = baseAmount / 7;
      caseUsed = 'weekly';
      break;
    case 'monthly':
      result = baseAmount / daysInCurrentMonth;
      caseUsed = 'monthly';
      break;
    case 'yearly':
      result = baseAmount / 365;
      caseUsed = 'yearly';
      break;
    case 'custom':
      // Para "cada X días", usar la lógica original de división simple
      // El usuario quiere: monto original ÷ frecuencia = monto diario
      result = baseAmount / config.interval;
      caseUsed = `custom (${baseAmount} ÷ ${config.interval} días = ${result})`;
      break;
    default:
      result = baseAmount / daysInCurrentMonth;
      caseUsed = 'default';
  }

  console.log('🔍 CALCULATION RESULTADO:', {
    description: expense.description,
    caseUsed,
    baseAmount,
    interval: config.interval,
    daysInCurrentMonth,
    result,
    resultFormatted: new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(result)
  });

  return result;
};

/**
 * Calcula el monto diario promedio (distribuido entre todos los días del mes)
 * Usado para cálculos mensuales y visualización de promedios
 */
export const calculateAverageDailyAmount = (expense) => {
  if (!expense) return 0;
  
  const config = normalizeRecurringConfig(expense);
  const baseAmount = parseFloat(expense.amount) || 0;
  const now = new Date();
  const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  switch (config.frequency) {
    case 'daily':
      return baseAmount; // Diario = mismo monto todos los días
    case 'weekly':
      return baseAmount / 7; // Promedio semanal distribuido
    case 'monthly':
      return baseAmount / daysInCurrentMonth; // Promedio mensual distribuido
    case 'yearly':
      return baseAmount / 365; // Promedio anual distribuido
    case 'custom':
      // Para "cada X días", usar división simple como pidió el usuario
      return baseAmount / config.interval;
    default:
      return baseAmount / daysInCurrentMonth;
  }
};



/**
 * Obtiene el monto ajustado para un día específico
 */
export const getDailyAdjustedAmount = (expense, dateStr) => {
  // Validación defensiva
  if (!expense) return 0;
  
  const config = normalizeRecurringConfig(expense);
  const baseDailyAmount = calculateBaseDailyAmount(expense);
  
  // Aplicar ajustes diarios si existen
  const monthStr = dateStr ? dateStr.substring(0, 7) : null;
  if (config.dailyAdjustments && config.adjustmentsMonth === monthStr) {
    const dayOfMonth = dateStr ? dateStr.split('-')[2] : null; // "27"
    const adjustment = config.dailyAdjustments[dayOfMonth];
    
    if (adjustment && adjustment.amount !== undefined) {
      const adjustedAmount = Math.max(0, baseDailyAmount + adjustment.amount);
      return adjustedAmount;
    }
  }
  
  return baseDailyAmount;
};

/**
 * Calcula el monto mensual de un gasto recurrente
 * Este es el método principal que debe usarse en toda la app
 */
export const calculateMonthlyAmount = (expense, targetMonth = null) => {
  // Validación defensiva
  if (!expense) return 0;
  
  const config = normalizeRecurringConfig(expense);
  const currentMonth = targetMonth || new Date();
  const monthStr = typeof currentMonth === 'string' 
    ? currentMonth 
    : currentMonth.getFullYear() + '-' + String(currentMonth.getMonth() + 1).padStart(2, '0');
  
  // DEBUG: Log reducido para evitar saturar consola
  // console.log(`🧮 Calculando monto mensual para ${expense.description}`);
  
  // Si hay ajustes para el mes actual, calcular día por día
  if (config.adjustmentsMonth === monthStr && Object.keys(config.dailyAdjustments || {}).length > 0) {
    return calculateMonthlyAmountWithAdjustments(expense, monthStr);
  }
  
  // Cálculo estándar basado en frecuencia
  return calculateStandardMonthlyAmount(expense);
};

/**
 * Calcula el monto mensual estándar (sin ajustes diarios)
 */
export const calculateStandardMonthlyAmount = (expense) => {
  const config = normalizeRecurringConfig(expense);
  const baseAmount = parseFloat(expense.amount) || 0;
  
  // Obtener días del mes actual para cálculos precisos
  const now = new Date();
  const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  
  let monthlyAmount;
  
  switch (config.frequency) {
    case 'daily':
      // Cada X días durante el mes actual
      monthlyAmount = baseAmount * Math.floor(daysInCurrentMonth / config.interval);
      break;
    
    case 'weekly':
      // Cada X semanas durante el mes actual
      const weeksInMonth = Math.floor(daysInCurrentMonth / 7);
      monthlyAmount = baseAmount * Math.floor(weeksInMonth / config.interval);
      break;
    
    case 'monthly':
      // Una vez al mes (o cada X meses)
      monthlyAmount = config.interval === 1 ? baseAmount : baseAmount / config.interval;
      break;
    
    case 'yearly':
      // Dividir por 12 meses
      monthlyAmount = baseAmount / (12 * config.interval);
      break;
    
    case 'custom':
      // Para casos como "cada X días", usar lógica simple: monto_diario × días_del_mes
      // Esto mantiene consistencia con el cálculo diario
      const dailyAmountForMonth = baseAmount / config.interval;
      monthlyAmount = dailyAmountForMonth * daysInCurrentMonth;
      break;
    
    default:
      monthlyAmount = baseAmount;
  }
  
  // Redondear para evitar decimales de precisión flotante
  return Math.round(monthlyAmount);
};

/**
 * Calcula el monto mensual aplicando ajustes diarios día por día
 */
export const calculateMonthlyAmountWithAdjustments = (expense, monthStr) => {
  // Validación defensiva
  if (!expense) return 0;
  
  const config = normalizeRecurringConfig(expense);
  const baseDailyAmount = calculateBaseDailyAmount(expense);
  
  // Obtener días del mes
  const [year, month] = monthStr.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  
  let monthlyTotal = 0;
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${monthStr}-${dayStr}`;
    const dayAmount = getDailyAdjustedAmount(expense, dateStr);
    monthlyTotal += dayAmount;
  }
  
  // DEBUG: Log de resultado final reducido
  // console.log(`📅 Monto mensual con ajustes para ${expense.description}: $${monthlyTotal}`);
  
  // Redondear para evitar decimales de precisión flotante
  return Math.round(monthlyTotal);
};

/**
 * Calcula el monto para un rango de fechas específico
 * Usado en filtros y reportes
 * Solo cuenta gastos desde que fueron creados, no desde fechas anteriores sin sentido
 */
export const calculateRangeAmount = (expense, startDate, endDate, workedDays = null) => {
  const config = normalizeRecurringConfig(expense);
  
  // 📅 VALIDACIÓN INTELIGENTE: Solo calcular desde que el gasto fue realmente creado
  let effectiveStartDate = startDate;
  
  // Si el gasto tiene fecha de creación, usarla como límite mínimo
  if (expense.createdAt || expense.updatedAt) {
    const expenseCreationDate = new Date(expense.createdAt || expense.updatedAt);
    const creationDateStr = expenseCreationDate.toISOString().split('T')[0];
    const requestedStart = new Date(startDate);
    
    // Solo calcular desde la fecha de creación si es posterior al inicio solicitado
    if (expenseCreationDate > requestedStart) {
      effectiveStartDate = creationDateStr;
      console.log(`📅 ${expense.description}: Ajustando inicio desde ${startDate} a ${effectiveStartDate} (fecha de creación)`);
    }
  }
  
  // Si se proporcionan días trabajados específicos, usarlos (pero respetando fecha efectiva)
  if (workedDays && Array.isArray(workedDays)) {
    const total = workedDays
      .filter(dateStr => new Date(dateStr) >= new Date(effectiveStartDate)) // Solo días desde creación
      .reduce((total, dateStr) => {
        return total + getDailyAdjustedAmount(expense, dateStr);
      }, 0);
    return Math.round(total);
  }
  
  // Calcular día por día en el rango efectivo
  const start = new Date(effectiveStartDate); // Usar fecha efectiva
  const end = new Date(endDate);
  let total = 0;
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    total += getDailyAdjustedAmount(expense, dateStr);
  }
  
  return Math.round(total);
};

/**
 * Obtiene una descripción legible de la frecuencia
 */
export const getFrequencyDescription = (expense) => {
  const config = normalizeRecurringConfig(expense);
  
  const intervalText = config.interval > 1 ? ` ${config.interval}` : '';
  
  switch (config.frequency) {
    case 'daily':
      return config.interval > 1 ? `Cada${intervalText} días` : 'Diario';
    case 'weekly':
      return config.interval > 1 ? `Cada${intervalText} semanas` : 'Semanal';
    case 'monthly':
      return config.interval > 1 ? `Cada${intervalText} meses` : 'Mensual';
    case 'yearly':
      return config.interval > 1 ? `Cada${intervalText} años` : 'Anual';
    case 'custom':
      return `Cada ${config.interval} días`;
    default:
      return 'Recurrente';
  }
};

/**
 * Valida si un gasto recurrente está activo en una fecha específica
 */
export const isActiveOnDate = (expense, dateStr) => {
  const config = normalizeRecurringConfig(expense);
  
  if (!config.isActive) return false;
  
  const targetDate = new Date(dateStr);
  const startDate = config.startDate ? new Date(config.startDate) : null;
  const endDate = config.endDate ? new Date(config.endDate) : null;
  
  if (startDate && targetDate < startDate) return false;
  if (endDate && targetDate > endDate) return false;
  
  return true;
};

/**
 * Obtiene el monto base original (valor con el que se creó el gasto)
 */
export const getOriginalAmount = (expense) => {
  if (!expense || !expense.amount) return 0;
  return parseFloat(expense.amount) || 0;
};

/**
 * Calcula el monto mensual base (sin ajustes diarios)
 */
export const calculateBaseMonthlyAmount = (expense) => {
  return calculateStandardMonthlyAmount(expense);
};

// Export por defecto con todas las funciones
export default {
  normalizeRecurringConfig,
  calculateCycleDays,
  calculateBaseDailyAmount,
  calculateBaseMonthlyAmount,
  getOriginalAmount,
  getDailyAdjustedAmount,
  calculateMonthlyAmount,
  calculateStandardMonthlyAmount,
  calculateMonthlyAmountWithAdjustments,
  calculateRangeAmount,
  getFrequencyDescription,
  isActiveOnDate
};