/**
 * RecurringExpenseHelper - Utilidades para trabajar con gastos recurrentes en el frontend
 * 
 * Esta clase proporciona métodos para trabajar con el nuevo sistema de gastos recurrentes
 * en el frontend, facilitando la conversión entre formatos y la presentación de datos.
 */

import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

class RecurringExpenseHelper {
  /**
   * Convierte un formato de recurrencia antiguo al nuevo
   * @param {Object} recurringConfig - Formato antiguo
   * @returns {Object} - Formato nuevo (recurrence)
   */
  static convertLegacyFormat(recurringConfig) {
    if (!recurringConfig) return null;
    
    // Crear estructura base
    const recurrence = {
      pattern: this.mapFrequencyToPattern(recurringConfig.frequency || 'monthly'),
      interval: parseInt(recurringConfig.interval || 1),
      startDate: recurringConfig.startDate || new Date(),
      endDate: recurringConfig.endDate || null,
      isActive: recurringConfig.isActive !== undefined ? recurringConfig.isActive : true,
      config: {}
    };
    
    // Configuración específica según patrón
    switch (recurrence.pattern) {
      case 'weekly':
        if (recurringConfig.dayOfWeek !== undefined && recurringConfig.dayOfWeek !== null) {
          recurrence.config.weekDays = [parseInt(recurringConfig.dayOfWeek)];
        }
        break;
        
      case 'monthly':
        if (recurringConfig.specificDates && recurringConfig.specificDates.length > 0) {
          recurrence.config.monthDays = recurringConfig.specificDates.map(d => parseInt(d));
        } else if (recurringConfig.dayOfMonth !== undefined && recurringConfig.dayOfMonth !== null) {
          recurrence.config.monthDays = [parseInt(recurringConfig.dayOfMonth)];
        }
        break;
        
      case 'yearly':
        if (recurringConfig.startDate) {
          const startDate = new Date(recurringConfig.startDate);
          recurrence.config.yearConfig = {
            month: startDate.getMonth() + 1,
            day: startDate.getDate()
          };
        }
        break;
    }
    
    return recurrence;
  }
  
  /**
   * Convierte un formato de recurrencia nuevo al formato antiguo
   * @param {Object} recurrence - Formato nuevo
   * @returns {Object} - Formato antiguo (recurringConfig)
   */
  static convertToLegacyFormat(recurrence) {
    if (!recurrence) return null;
    
    // Crear estructura base
    const recurringConfig = {
      frequency: this.mapPatternToFrequency(recurrence.pattern || 'monthly'),
      interval: recurrence.interval || 1,
      startDate: recurrence.startDate || new Date(),
      endDate: recurrence.endDate || null,
      isActive: recurrence.isActive !== undefined ? recurrence.isActive : true,
    };
    
    // Configuración específica según patrón
    switch (recurrence.pattern) {
      case 'weekly':
        if (recurrence.config?.weekDays && recurrence.config.weekDays.length > 0) {
          recurringConfig.dayOfWeek = recurrence.config.weekDays[0];
        }
        break;
        
      case 'monthly':
        if (recurrence.config?.monthDays && recurrence.config.monthDays.length > 0) {
          if (recurrence.config.monthDays.length === 1) {
            recurringConfig.dayOfMonth = recurrence.config.monthDays[0];
          } else {
            recurringConfig.specificDates = [...recurrence.config.monthDays];
          }
        }
        break;
    }
    
    return recurringConfig;
  }
  
  /**
   * Mapea frecuencia antigua a nuevo patrón
   * @param {String} frequency - Frecuencia antigua
   * @returns {String} - Patrón nuevo
   */
  static mapFrequencyToPattern(frequency) {
    const mapping = {
      'daily': 'daily',
      'weekly': 'weekly',
      'biweekly': 'biweekly',
      'monthly': 'monthly',
      'quarterly': 'monthly', // Trimestral -> Mensual con intervalo 3
      'biannual': 'monthly', // Semestral -> Mensual con intervalo 6
      'yearly': 'yearly'
    };
    
    return mapping[frequency] || 'monthly';
  }
  
  /**
   * Mapea patrón nuevo a frecuencia antigua
   * @param {String} pattern - Patrón nuevo
   * @returns {String} - Frecuencia antigua
   */
  static mapPatternToFrequency(pattern) {
    const mapping = {
      'daily': 'daily',
      'weekly': 'weekly',
      'biweekly': 'biweekly',
      'monthly': 'monthly',
      'yearly': 'yearly'
    };
    
    return mapping[pattern] || 'monthly';
  }
  
  /**
   * Obtiene una descripción legible del patrón de recurrencia
   * @param {Object} expense - Gasto recurrente
   * @returns {String} - Descripción legible
   */
  static getRecurrenceDescription(expense) {
    if (!expense) return 'No disponible';
    
    // Determinar si usar recurrence o recurringConfig
    let pattern, interval, config;
    
    if (expense.recurrence) {
      pattern = expense.recurrence.pattern;
      interval = expense.recurrence.interval;
      config = expense.recurrence.config;
    } else if (expense.recurringConfig) {
      pattern = this.mapFrequencyToPattern(expense.recurringConfig.frequency);
      interval = expense.recurringConfig.interval;
      
      // Simular configuración
      config = {};
      if (expense.recurringConfig.dayOfWeek !== undefined) {
        config.weekDays = [expense.recurringConfig.dayOfWeek];
      }
      if (expense.recurringConfig.dayOfMonth !== undefined) {
        config.monthDays = [expense.recurringConfig.dayOfMonth];
      } else if (expense.recurringConfig.specificDates && expense.recurringConfig.specificDates.length > 0) {
        config.monthDays = expense.recurringConfig.specificDates;
      }
    } else {
      return 'Configuración no válida';
    }
    
    // Generar descripción según patrón
    switch (pattern) {
      case 'daily':
        return interval === 1 ? 'Todos los días' : `Cada ${interval} días`;
        
      case 'weekly':
        const weekDays = config?.weekDays || [];
        if (weekDays.length === 0) {
          return interval === 1 ? 'Cada semana' : `Cada ${interval} semanas`;
        } else {
          const days = weekDays.map(day => this.getDayName(day)).join(', ');
          return interval === 1 ? 
            `Cada ${days}` : 
            `Cada ${interval} semanas los ${days}`;
        }
        
      case 'biweekly':
        return 'Cada 2 semanas';
        
      case 'monthly':
        const monthDays = config?.monthDays || [];
        if (monthDays.length === 0) {
          return interval === 1 ? 'Mensual' : `Cada ${interval} meses`;
        } else if (monthDays.length === 1) {
          return interval === 1 ? 
            `El día ${monthDays[0]} de cada mes` : 
            `El día ${monthDays[0]} cada ${interval} meses`;
        } else {
          const days = monthDays.map(day => String(day)).join(', ');
          return interval === 1 ? 
            `Los días ${days} de cada mes` : 
            `Los días ${days} cada ${interval} meses`;
        }
        
      case 'yearly':
        const yearConfig = config?.yearConfig;
        if (!yearConfig || !yearConfig.month || !yearConfig.day) {
          return interval === 1 ? 'Anual' : `Cada ${interval} años`;
        } else {
          const monthName = this.getMonthName(yearConfig.month - 1);
          return interval === 1 ? 
            `El ${yearConfig.day} de ${monthName} cada año` : 
            `El ${yearConfig.day} de ${monthName} cada ${interval} años`;
        }
        
      default:
        return 'Patrón desconocido';
    }
  }
  
  /**
   * Obtiene el nombre del día de la semana
   * @param {Number} dayIndex - Índice del día (0-6)
   * @returns {String} - Nombre del día
   */
  static getDayName(dayIndex) {
    const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    return days[dayIndex] || 'día desconocido';
  }
  
  /**
   * Obtiene el nombre del mes
   * @param {Number} monthIndex - Índice del mes (0-11)
   * @returns {String} - Nombre del mes
   */
  static getMonthName(monthIndex) {
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    return months[monthIndex] || 'mes desconocido';
  }
  
  /**
   * Formatea una fecha en formato legible
   * @param {Date|String} date - Fecha a formatear
   * @param {String} formatString - Formato (opcional)
   * @returns {String} - Fecha formateada
   */
  static formatDate(date, formatString = 'PPP') {
    if (!date) return 'Fecha no disponible';
    
    let dateObj;
    if (typeof date === 'string') {
      dateObj = parseISO(date);
    } else {
      dateObj = date;
    }
    
    if (!isValid(dateObj)) {
      return 'Fecha inválida';
    }
    
    return format(dateObj, formatString, { locale: es });
  }
  
  /**
   * Formatea un valor monetario
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
  
  /**
   * Verifica si un gasto es recurrente
   * @param {Object} expense - Gasto a verificar
   * @returns {Boolean} - true si es recurrente
   */
  static isRecurring(expense) {
    return expense && (
      expense.type === 'recurring-template' || 
      expense.type === 'recurring' ||
      !!expense.recurringConfig ||
      !!expense.recurrence
    );
  }
}

export default RecurringExpenseHelper;