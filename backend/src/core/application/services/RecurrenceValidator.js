/**
 * RecurrenceValidator - Conjunto de validaciones para gastos recurrentes
 * 
 * Ofrece funciones de validación para asegurar que los patrones de recurrencia
 * sean válidos, con opciones específicas para cada tipo de recurrencia.
 */

class RecurrenceValidator {
  /**
   * Valida la estructura completa de una configuración de recurrencia
   * @param {Object} recurrence - Configuración de recurrencia
   * @returns {Object} - { isValid, errors }
   */
  static validate(recurrence) {
    if (!recurrence) {
      return {
        isValid: false,
        errors: ['La configuración de recurrencia es requerida']
      };
    }

    const errors = [];
    
    // Validar campos básicos
    if (!recurrence.pattern) {
      errors.push('El patrón de recurrencia es requerido');
    } else if (!['daily', 'weekly', 'biweekly', 'monthly', 'yearly'].includes(recurrence.pattern)) {
      errors.push(`El patrón "${recurrence.pattern}" no es válido`);
    }
    
    if (!recurrence.startDate) {
      errors.push('La fecha de inicio es requerida');
    } else if (!this.isValidDate(new Date(recurrence.startDate))) {
      errors.push('La fecha de inicio no es válida');
    }
    
    if (recurrence.endDate && !this.isValidDate(new Date(recurrence.endDate))) {
      errors.push('La fecha de fin no es válida');
    }
    
    // Validar que la fecha de fin sea posterior a la de inicio
    if (recurrence.startDate && recurrence.endDate) {
      const start = new Date(recurrence.startDate);
      const end = new Date(recurrence.endDate);
      
      if (end < start) {
        errors.push('La fecha de fin debe ser posterior a la fecha de inicio');
      }
    }
    
    // Validar intervalo
    if (recurrence.interval === undefined || recurrence.interval === null) {
      errors.push('El intervalo es requerido');
    } else if (!Number.isInteger(recurrence.interval) || recurrence.interval < 1) {
      errors.push('El intervalo debe ser un número entero mayor que 0');
    }
    
    // Validar campos específicos según el patrón
    const configErrors = this.validatePatternConfig(recurrence.pattern, recurrence.config);
    errors.push(...configErrors);
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Valida la configuración específica según el tipo de patrón
   * @param {String} pattern - Tipo de patrón
   * @param {Object} config - Configuración específica
   * @returns {Array} - Lista de errores
   */
  static validatePatternConfig(pattern, config) {
    const errors = [];
    
    // Si no hay configuración, crear objeto vacío por defecto
    const configObj = config || {};
    
    switch (pattern) {
      case 'weekly':
        return this.validateWeeklyConfig(configObj);
        
      case 'monthly':
        return this.validateMonthlyConfig(configObj);
        
      case 'yearly':
        return this.validateYearlyConfig(configObj);
        
      // Los patrones daily y biweekly no requieren validación especial
        
      default:
        return errors;
    }
  }
  
  /**
   * Valida la configuración para patrón semanal
   * @param {Object} config - Configuración semanal
   * @returns {Array} - Lista de errores
   */
  static validateWeeklyConfig(config) {
    const errors = [];
    
    // Validar días de la semana (opcional)
    if (config.weekDays && Array.isArray(config.weekDays)) {
      // Verificar valores válidos (0-6, domingo-sábado)
      const validDays = config.weekDays.every(day => 
        Number.isInteger(day) && day >= 0 && day <= 6
      );
      
      if (!validDays) {
        errors.push('Los días de la semana deben ser números entre 0 y 6');
      }
    }
    
    return errors;
  }
  
  /**
   * Valida la configuración para patrón mensual
   * @param {Object} config - Configuración mensual
   * @returns {Array} - Lista de errores
   */
  static validateMonthlyConfig(config) {
    const errors = [];
    
    // Validar días del mes (opcional)
    if (config.monthDays && Array.isArray(config.monthDays)) {
      // Verificar valores válidos (1-31)
      const validDays = config.monthDays.every(day => 
        Number.isInteger(day) && day >= 1 && day <= 31
      );
      
      if (!validDays) {
        errors.push('Los días del mes deben ser números entre 1 y 31');
      }
    }
    
    return errors;
  }
  
  /**
   * Valida la configuración para patrón anual
   * @param {Object} config - Configuración anual
   * @returns {Array} - Lista de errores
   */
  static validateYearlyConfig(config) {
    const errors = [];
    
    // Validar configuración de mes y día
    if (config.yearConfig) {
      const { month, day } = config.yearConfig;
      
      // Validar mes
      if (month !== undefined && month !== null) {
        if (!Number.isInteger(month) || month < 1 || month > 12) {
          errors.push('El mes debe ser un número entre 1 y 12');
        }
      }
      
      // Validar día
      if (day !== undefined && day !== null) {
        if (!Number.isInteger(day) || day < 1 || day > 31) {
          errors.push('El día debe ser un número entre 1 y 31');
        }
        
        // Verificar que el día sea válido para el mes
        if (month && day) {
          if (!this.isValidMonthDay(month, day)) {
            errors.push(`El día ${day} no es válido para el mes ${month}`);
          }
        }
      }
    }
    
    return errors;
  }
  
  /**
   * Verifica que un día sea válido para un mes específico
   * @param {Number} month - Mes (1-12)
   * @param {Number} day - Día
   * @returns {Boolean} - Si es válido
   */
  static isValidMonthDay(month, day) {
    // Crear una fecha con el año actual, el mes indicado y el día 0
    // Esto nos da el último día del mes anterior
    const date = new Date(new Date().getFullYear(), month - 1, 0);
    const daysInMonth = date.getDate();
    
    return day <= daysInMonth;
  }
  
  /**
   * Verifica si una fecha es válida
   * @param {Date} date - Fecha a validar
   * @returns {Boolean} - Si es válida
   */
  static isValidDate(date) {
    return date instanceof Date && !isNaN(date);
  }
  
  /**
   * Normaliza una configuración de recurrencia, completando valores por defecto
   * @param {Object} recurrence - Configuración de recurrencia
   * @returns {Object} - Configuración normalizada
   */
  static normalize(recurrence) {
    if (!recurrence) {
      return null;
    }
    
    // Crear copia para no modificar el original
    const normalized = { ...recurrence };
    
    // Asignar valores por defecto para campos básicos
    normalized.pattern = normalized.pattern || 'monthly';
    normalized.interval = normalized.interval || 1;
    normalized.isActive = normalized.isActive !== undefined ? normalized.isActive : true;
    
    // Asegurarse de que startDate es una fecha válida
    if (!normalized.startDate) {
      normalized.startDate = new Date().toISOString();
    }
    
    // Asegurarse de que config existe
    normalized.config = normalized.config || {};
    
    // Normalizar configuración específica según el patrón
    switch (normalized.pattern) {
      case 'weekly':
        this.normalizeWeeklyConfig(normalized);
        break;
        
      case 'monthly':
        this.normalizeMonthlyConfig(normalized);
        break;
        
      case 'yearly':
        this.normalizeYearlyConfig(normalized);
        break;
        
      // Los patrones daily y biweekly no requieren normalización especial
    }
    
    return normalized;
  }
  
  /**
   * Normaliza la configuración para patrón semanal
   * @param {Object} recurrence - Configuración de recurrencia
   */
  static normalizeWeeklyConfig(recurrence) {
    if (!recurrence.config.weekDays || !Array.isArray(recurrence.config.weekDays)) {
      // Por defecto, usar el día de la semana de la fecha de inicio
      const startDate = new Date(recurrence.startDate);
      recurrence.config.weekDays = [startDate.getDay()];
    }
  }
  
  /**
   * Normaliza la configuración para patrón mensual
   * @param {Object} recurrence - Configuración de recurrencia
   */
  static normalizeMonthlyConfig(recurrence) {
    if (!recurrence.config.monthDays || !Array.isArray(recurrence.config.monthDays)) {
      // Por defecto, usar el día del mes de la fecha de inicio
      const startDate = new Date(recurrence.startDate);
      recurrence.config.monthDays = [startDate.getDate()];
    }
  }
  
  /**
   * Normaliza la configuración para patrón anual
   * @param {Object} recurrence - Configuración de recurrencia
   */
  static normalizeYearlyConfig(recurrence) {
    if (!recurrence.config.yearConfig) {
      const startDate = new Date(recurrence.startDate);
      recurrence.config.yearConfig = {
        month: startDate.getMonth() + 1, // Meses en JS son 0-indexed
        day: startDate.getDate()
      };
    }
  }
  
  /**
   * Convierte un formato antiguo de recurrencia al nuevo formato
   * @param {Object} legacyConfig - Configuración antigua (recurringConfig)
   * @param {Date} baseDate - Fecha base (opcional)
   * @returns {Object} - Configuración en nuevo formato
   */
  static convertFromLegacy(legacyConfig, baseDate) {
    if (!legacyConfig) {
      return null;
    }
    
    // Determinar fecha base
    const startDate = baseDate || legacyConfig.startDate || new Date();
    const startDateObj = new Date(startDate);
    
    // Crear nueva estructura
    const newRecurrence = {
      pattern: this.mapLegacyFrequency(legacyConfig.frequency),
      interval: parseInt(legacyConfig.interval || 1),
      startDate: legacyConfig.startDate || startDate,
      endDate: legacyConfig.endDate || null,
      isActive: legacyConfig.isActive !== undefined ? legacyConfig.isActive : true,
      lastProcessed: legacyConfig.lastProcessed || null,
      config: {}
    };
    
    // Mapear ajustes diarios si existen
    if (legacyConfig.dailyAdjustments) {
      newRecurrence.dailyAdjustments = legacyConfig.dailyAdjustments;
      newRecurrence.adjustmentsMonth = legacyConfig.adjustmentsMonth;
    }
    
    // Configuración específica según patrón
    switch (newRecurrence.pattern) {
      case 'weekly':
        if (legacyConfig.dayOfWeek !== undefined) {
          newRecurrence.config.weekDays = [parseInt(legacyConfig.dayOfWeek)];
        } else {
          newRecurrence.config.weekDays = [startDateObj.getDay()];
        }
        break;
        
      case 'monthly':
        if (legacyConfig.dayOfMonth !== undefined) {
          newRecurrence.config.monthDays = [parseInt(legacyConfig.dayOfMonth)];
        } else if (legacyConfig.specificDates && Array.isArray(legacyConfig.specificDates)) {
          newRecurrence.config.monthDays = legacyConfig.specificDates.map(d => parseInt(d));
        } else {
          newRecurrence.config.monthDays = [startDateObj.getDate()];
        }
        break;
        
      case 'yearly':
        newRecurrence.config.yearConfig = {
          month: startDateObj.getMonth() + 1,
          day: startDateObj.getDate()
        };
        break;
    }
    
    return this.normalize(newRecurrence);
  }
  
  /**
   * Mapea una frecuencia antigua al nuevo formato de patrón
   * @param {String} frequency - Frecuencia antigua
   * @returns {String} - Patrón nuevo
   */
  static mapLegacyFrequency(frequency) {
    switch (frequency) {
      case 'daily': return 'daily';
      case 'weekly': return 'weekly';
      case 'biweekly': return 'biweekly';
      case 'monthly': return 'monthly';
      case 'quarterly': return 'monthly'; // Trimestral -> Mensual con intervalo 3
      case 'biannual': return 'monthly'; // Semestral -> Mensual con intervalo 6
      case 'yearly': return 'yearly';
      default: return 'monthly';
    }
  }
}

export default RecurrenceValidator;