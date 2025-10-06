/**
 * RecurrenceCalculator - Utilitario para cálculos de gastos recurrentes
 * 
 * Esta clase centraliza toda la lógica relacionada con el cálculo de fechas y montos
 * para los gastos recurrentes, eliminando la duplicación de código y mejorando
 * la mantenibilidad.
 */

import { logger } from '../../../shared/utils/logger.js';

class RecurrenceCalculator {
  /**
   * Constructor
   */
  constructor() {
    // Configuración por defecto
    this.defaultDaysInMonth = 30.44; // Promedio de días por mes (365/12)
    this.defaultWeeksInMonth = 4.33; // Promedio de semanas por mes (52/12)
  }
  
  /**
   * Normaliza la configuración de recurrencia para manejar ambos formatos
   * @param {Object} expense - Gasto recurrente
   * @returns {Object} - Configuración normalizada
   */
  normalizeRecurrenceConfig(expense) {
    if (!expense) {
      return null;
    }
    
    // Determinar si es formato nuevo o antiguo
    const isLegacy = expense.type === 'recurring';
    
    if (isLegacy) {
      // Formato antiguo (recurringConfig)
      const config = expense.recurringConfig || {};
      
      return {
        pattern: config.frequency || 'monthly',
        interval: parseInt(config.interval || 1),
        startDate: config.startDate || expense.date,
        endDate: config.endDate,
        isActive: config.isActive !== undefined ? config.isActive : true,
        lastProcessed: config.lastProcessed,
        dailyAdjustments: config.dailyAdjustments || {},
        adjustmentsMonth: config.adjustmentsMonth,
        // Mapear configuración antigua a nueva
        config: {
          weekDays: config.dayOfWeek !== undefined ? [config.dayOfWeek] : [],
          monthDays: config.dayOfMonth !== undefined ? [config.dayOfMonth] : 
                    (config.specificDates || []),
          yearConfig: {
            month: config.startDate ? new Date(config.startDate).getMonth() + 1 : null,
            day: config.startDate ? new Date(config.startDate).getDate() : null
          }
        }
      };
    }
    
    // Formato nuevo (recurrence)
    return expense.recurrence || {
      pattern: 'monthly',
      interval: 1,
      startDate: expense.date,
      isActive: true,
      config: {}
    };
  }
  
  /**
   * Obtiene la próxima fecha de ocurrencia
   * @param {Object} expense - Gasto recurrente
   * @param {Date} baseDate - Fecha base para cálculo (opcional)
   * @returns {Date} - Próxima fecha o null si no hay más ocurrencias
   */
  getNextOccurrenceDate(expense, baseDate = null) {
    const recurrence = this.normalizeRecurrenceConfig(expense);
    if (!recurrence) return null;
    
    // Si el gasto no está activo, no hay próximas ocurrencias
    if (recurrence.isActive === false) return null;
    
    // Determinar fecha base
    const today = baseDate || new Date();
    const lastProcessed = recurrence.lastProcessed || recurrence.startDate || expense.date;
    let startPoint = new Date(lastProcessed);
    
    // Si la última fecha es futura, esa es la próxima ocurrencia
    if (startPoint > today) return startPoint;
    
    // Calcular próxima ocurrencia según patrón
    switch (recurrence.pattern) {
      case 'daily':
        return this.getNextDailyOccurrence(startPoint, recurrence.interval);
        
      case 'weekly':
        return this.getNextWeeklyOccurrence(startPoint, recurrence.interval, recurrence.config?.weekDays);
        
      case 'biweekly':
        return this.getNextBiweeklyOccurrence(startPoint);
        
      case 'monthly':
        return this.getNextMonthlyOccurrence(startPoint, recurrence.interval, recurrence.config?.monthDays);
        
      case 'yearly':
        return this.getNextYearlyOccurrence(startPoint, recurrence.interval, recurrence.config?.yearConfig);
        
      default:
        logger.error('RecurrenceCalculator: Patrón de recurrencia no soportado', {
          pattern: recurrence.pattern
        });
        return null;
    }
  }
  
  /**
   * Calcula la próxima ocurrencia para patrón diario
   */
  getNextDailyOccurrence(startDate, interval) {
    const nextDate = new Date(startDate);
    nextDate.setDate(nextDate.getDate() + interval);
    return nextDate;
  }
  
  /**
   * Calcula la próxima ocurrencia para patrón semanal
   */
  getNextWeeklyOccurrence(startDate, interval, weekDays) {
    const nextDate = new Date(startDate);
    
    // Si no hay días de la semana especificados, usar el mismo día
    if (!weekDays || !weekDays.length) {
      nextDate.setDate(nextDate.getDate() + (interval * 7));
      return nextDate;
    }
    
    // Ordenar los días de la semana para iteración
    const orderedWeekDays = [...weekDays].sort((a, b) => a - b);
    const currentDay = nextDate.getDay();
    
    // Encontrar el próximo día de la semana válido
    let foundNextDay = false;
    let nextDay = null;
    
    // Buscar primero en la semana actual
    for (const day of orderedWeekDays) {
      if (day > currentDay) {
        nextDay = day;
        foundNextDay = true;
        break;
      }
    }
    
    // Si no se encontró, ir a la siguiente semana
    if (!foundNextDay) {
      nextDay = orderedWeekDays[0]; // Primer día configurado
      // Avanzar el intervalo de semanas
      nextDate.setDate(nextDate.getDate() + (interval * 7));
    }
    
    // Ajustar al día de la semana correcto
    const daysToAdd = (nextDay + 7 - nextDate.getDay()) % 7;
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    
    return nextDate;
  }
  
  /**
   * Calcula la próxima ocurrencia para patrón bisemanal (cada 2 semanas)
   */
  getNextBiweeklyOccurrence(startDate) {
    const nextDate = new Date(startDate);
    nextDate.setDate(nextDate.getDate() + 14); // 2 semanas
    return nextDate;
  }
  
  /**
   * Calcula la próxima ocurrencia para patrón mensual
   */
  getNextMonthlyOccurrence(startDate, interval, monthDays) {
    const nextDate = new Date(startDate);
    
    // Si no hay días del mes especificados, usar el mismo día
    if (!monthDays || !monthDays.length) {
      nextDate.setMonth(nextDate.getMonth() + interval);
      return this.adjustToValidMonthDay(nextDate);
    }
    
    // Ordenar los días del mes para iteración
    const orderedMonthDays = [...monthDays].sort((a, b) => a - b);
    const currentDay = nextDate.getDate();
    
    // Encontrar el próximo día del mes válido
    let foundNextDay = false;
    let nextDay = null;
    
    // Buscar primero en el mes actual
    for (const day of orderedMonthDays) {
      if (day > currentDay) {
        nextDay = day;
        foundNextDay = true;
        break;
      }
    }
    
    // Si no se encontró, ir al siguiente mes
    if (!foundNextDay) {
      nextDay = orderedMonthDays[0]; // Primer día configurado
      nextDate.setMonth(nextDate.getMonth() + interval);
    }
    
    // Ajustar al día del mes
    nextDate.setDate(nextDay);
    
    // Verificar si el día es válido para el mes
    return this.adjustToValidMonthDay(nextDate);
  }
  
  /**
   * Calcula la próxima ocurrencia para patrón anual
   */
  getNextYearlyOccurrence(startDate, interval, yearConfig) {
    const nextDate = new Date(startDate);
    
    // Si no hay configuración anual, simplemente añadir años
    if (!yearConfig || !yearConfig.month || !yearConfig.day) {
      nextDate.setFullYear(nextDate.getFullYear() + interval);
      return nextDate;
    }
    
    // Configurar fecha específica
    const currentYear = nextDate.getFullYear();
    const currentMonth = nextDate.getMonth() + 1; // 0-indexed to 1-indexed
    const currentDay = nextDate.getDate();
    
    // Determinar si la fecha objetivo ya pasó este año
    let targetYear = currentYear;
    if (yearConfig.month < currentMonth || 
        (yearConfig.month === currentMonth && yearConfig.day < currentDay)) {
      targetYear += interval;
    }
    
    // Crear la fecha objetivo
    const targetDate = new Date(targetYear, yearConfig.month - 1, yearConfig.day);
    
    // Verificar que sea una fecha válida
    return this.isValidDate(targetDate) ? targetDate : null;
  }
  
  /**
   * Ajusta la fecha al día válido del mes
   */
  adjustToValidMonthDay(date) {
    // Crear una copia para no modificar el original
    const result = new Date(date);
    
    // Verificar si la fecha es válida
    if (this.isValidDate(result)) {
      return result;
    }
    
    // Si no es válida, ajustar al último día del mes
    result.setDate(0); // Ir al último día del mes anterior
    result.setDate(result.getDate() + 1); // Primer día del mes actual
    result.setMonth(result.getMonth() + 1); // Ir al próximo mes
    result.setDate(0); // Último día del mes actual
    
    return result;
  }
  
  /**
   * Verifica si una fecha es válida
   */
  isValidDate(date) {
    return date instanceof Date && !isNaN(date);
  }
  
  /**
   * Calcula el monto diario base para un gasto recurrente
   * @param {Object} expense - Gasto recurrente
   * @returns {Number} - Monto diario base
   */
  calculateDailyBaseAmount(expense) {
    const recurrence = this.normalizeRecurrenceConfig(expense);
    if (!recurrence) return 0;
    
    const baseAmount = parseFloat(expense.amount) || 0;
    const cycleDays = this.getCycleDays(recurrence);
    
    return baseAmount / cycleDays;
  }
  
  /**
   * Obtiene el número de días en un ciclo completo
   */
  getCycleDays(recurrence) {
    const { pattern, interval } = recurrence;
    
    switch (pattern) {
      case 'daily':
        return Math.max(1, interval);
        
      case 'weekly':
        return Math.max(1, interval * 7);
        
      case 'biweekly':
        return 14; // 2 semanas
        
      case 'monthly':
        // Casos especiales para compatibilidad
        if (interval === 15) return 15; // Quincenal (legacy)
        if (interval === 30 || interval === 1) return 30; // Mensual estándar
        return Math.max(1, interval * this.defaultDaysInMonth);
        
      case 'yearly':
        return Math.max(1, interval * 365);
        
      default:
        return 30; // Default mensual
    }
  }
  
  /**
   * Calcula el monto mensual estándar para un gasto recurrente
   * @param {Object} expense - Gasto recurrente
   * @returns {Number} - Monto mensual
   */
  calculateMonthlyAmount(expense) {
    const recurrence = this.normalizeRecurrenceConfig(expense);
    if (!recurrence) return 0;
    
    const baseAmount = parseFloat(expense.amount) || 0;
    const { pattern, interval } = recurrence;
    
    // Comprobar si hay ajustes diarios para el mes actual
    const currentMonth = new Date();
    const monthStr = currentMonth.getFullYear() + '-' + String(currentMonth.getMonth() + 1).padStart(2, '0');
    
    if (recurrence.adjustmentsMonth === monthStr && 
        recurrence.dailyAdjustments && 
        Object.keys(recurrence.dailyAdjustments).length > 0) {
      return this.calculateMonthWithAdjustments(expense, monthStr);
    }
    
    // Cálculo estándar por patrón
    switch (pattern) {
      case 'daily':
        return baseAmount * Math.floor(this.defaultDaysInMonth / interval);
        
      case 'weekly':
        return baseAmount * Math.floor(this.defaultWeeksInMonth / interval);
        
      case 'biweekly':
        return baseAmount * 2; // 2 veces al mes
        
      case 'monthly':
        // Casos especiales para compatibilidad
        if (interval === 15) return baseAmount * 2; // Quincenal (legacy)
        if (interval === 30 || interval === 1) return baseAmount; // Mensual estándar
        return baseAmount * Math.floor(1 / interval);
        
      case 'yearly':
        return baseAmount / 12; // Dividir anual entre 12 meses
        
      default:
        return baseAmount;
    }
  }
  
  /**
   * Calcula el monto mensual con ajustes diarios
   */
  calculateMonthWithAdjustments(expense, monthStr) {
    const recurrence = this.normalizeRecurrenceConfig(expense);
    if (!recurrence) return 0;
    
    const dailyBase = this.calculateDailyBaseAmount(expense);
    const adjustments = recurrence.dailyAdjustments || {};
    
    // Obtener días del mes
    const [year, month] = monthStr.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    let monthlyTotal = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, '0');
      const adjustment = adjustments[dayStr];
      
      if (adjustment && adjustment.amount !== undefined) {
        // Aplicar ajuste al monto diario
        monthlyTotal += Math.max(0, dailyBase + adjustment.amount);
      } else {
        // Usar monto diario base
        monthlyTotal += dailyBase;
      }
    }
    
    return Math.round(monthlyTotal);
  }
  
  /**
   * Calcula el monto total para un período específico
   * @param {Object} expense - Gasto recurrente
   * @param {String} startDate - Fecha inicio (YYYY-MM-DD)
   * @param {String} endDate - Fecha fin (YYYY-MM-DD)
   * @returns {Number} - Monto total para el período
   */
  calculateAmountForPeriod(expense, startDate, endDate) {
    // Validación
    if (!expense || !startDate || !endDate) return 0;
    
    const recurrence = this.normalizeRecurrenceConfig(expense);
    if (!recurrence) return 0;
    
    // Convertir fechas
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Validar rango
    if (start > end) return 0;
    
    // Verificar fechas de inicio efectivas
    const expenseStart = new Date(recurrence.startDate || expense.date || expense.createdAt || start);
    const effectiveStart = expenseStart > start ? expenseStart : start;
    
    // Si tiene fecha de fin y es anterior al inicio del rango, no hay gastos
    if (recurrence.endDate && new Date(recurrence.endDate) < start) {
      return 0;
    }
    
    // Obtener ocurrencias en el período
    const occurrences = this.getOccurrencesInPeriod(expense, effectiveStart, end);
    
    // Calcular monto total
    const baseAmount = parseFloat(expense.amount) || 0;
    return baseAmount * occurrences.length;
  }
  
  /**
   * Obtiene las ocurrencias de un gasto recurrente en un período
   * @param {Object} expense - Gasto recurrente
   * @param {Date} startDate - Fecha inicio
   * @param {Date} endDate - Fecha fin
   * @returns {Array<Date>} - Lista de fechas de ocurrencia
   */
  getOccurrencesInPeriod(expense, startDate, endDate) {
    const recurrence = this.normalizeRecurrenceConfig(expense);
    if (!recurrence) return [];
    
    const occurrences = [];
    let currentDate = new Date(Math.max(
      startDate.getTime(),
      new Date(recurrence.startDate || expense.date).getTime()
    ));
    
    // Si la fecha de inicio es posterior al fin del período, no hay ocurrencias
    if (currentDate > endDate) return [];
    
    // Verificar si la primera fecha es una ocurrencia válida
    if (this.isOccurrenceDate(expense, currentDate)) {
      occurrences.push(new Date(currentDate));
    }
    
    // Buscar próximas ocurrencias dentro del período
    while (currentDate <= endDate) {
      const nextDate = this.getNextOccurrenceDate(expense, currentDate);
      
      if (!nextDate || nextDate > endDate) break;
      
      // Verificar que la fecha sea diferente a la anterior
      if (nextDate.getTime() !== currentDate.getTime()) {
        occurrences.push(nextDate);
        currentDate = nextDate;
      } else {
        // Evitar bucle infinito
        break;
      }
    }
    
    return occurrences;
  }
  
  /**
   * Verifica si una fecha es una ocurrencia válida según la configuración
   */
  isOccurrenceDate(expense, date) {
    const recurrence = this.normalizeRecurrenceConfig(expense);
    if (!recurrence) return false;
    
    const { pattern, interval, config } = recurrence;
    const startDate = new Date(recurrence.startDate || expense.date);
    
    switch (pattern) {
      case 'daily':
        // Verificar si han pasado múltiplos del intervalo desde la fecha inicial
        const daysDiff = this.daysBetween(startDate, date);
        return daysDiff % interval === 0;
        
      case 'weekly':
        // Verificar día de la semana y si han pasado múltiplos de semanas
        if (config?.weekDays && !config.weekDays.includes(date.getDay())) {
          return false;
        }
        const weeksDiff = Math.floor(this.daysBetween(startDate, date) / 7);
        return weeksDiff % interval === 0;
        
      case 'biweekly':
        // Cada 2 semanas
        const biWeeksDiff = Math.floor(this.daysBetween(startDate, date) / 14);
        return biWeeksDiff % interval === 0;
        
      case 'monthly':
        // Verificar día del mes y si han pasado múltiplos de meses
        if (config?.monthDays && !config.monthDays.includes(date.getDate())) {
          return false;
        }
        const monthsDiff = this.monthsBetween(startDate, date);
        return monthsDiff % interval === 0;
        
      case 'yearly':
        // Verificar mes y día y si han pasado múltiplos de años
        if (config?.yearConfig) {
          if (date.getMonth() + 1 !== config.yearConfig.month || 
              date.getDate() !== config.yearConfig.day) {
            return false;
          }
        }
        const yearsDiff = date.getFullYear() - startDate.getFullYear();
        return yearsDiff % interval === 0;
        
      default:
        return false;
    }
  }
  
  /**
   * Calcula el número de días entre dos fechas
   */
  daysBetween(start, end) {
    const oneDay = 24 * 60 * 60 * 1000; // Milisegundos en un día
    // Redondear para evitar problemas con horario de verano
    return Math.round(Math.abs((end - start) / oneDay));
  }
  
  /**
   * Calcula el número de meses entre dos fechas
   */
  monthsBetween(start, end) {
    return (end.getFullYear() - start.getFullYear()) * 12 + 
           (end.getMonth() - start.getMonth());
  }
  
  /**
   * Formatea un monto en formato moneda local
   * @param {Number} amount - Monto a formatear
   * @returns {String} - Monto formateado
   */
  static formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  }
}

export default RecurrenceCalculator;
