/**
 * Adaptador para el módulo de gastos recurrentes en el backend
 * 
 * Importa el módulo unificado y lo adapta para uso en Node.js
 */

import { calculator, RecurringExpenseCalculator, logger } from '../../../barrel.js';

/**
 * Clase RecurrenceCalculator para mantener compatibilidad con código existente
 * Actúa como wrapper del calculador unificado
 */
class RecurrenceCalculator {
  constructor() {
    this.calculator = calculator;
    this.defaultDaysInMonth = 30.44;
    this.defaultWeeksInMonth = 4.33;
  }

  /**
   * Normaliza la configuración de recurrencia
   * @param {Object} expense - Gasto recurrente
   * @returns {Object} - Configuración normalizada
   */
  normalizeRecurrenceConfig(expense) {
    try {
      return this.calculator.normalizeConfig(expense);
    } catch (error) {
      logger.error('Error normalizando configuración de recurrencia:', error);
      return null;
    }
  }

  /**
   * Calcula la próxima fecha de ocurrencia
   * @param {Object} expense - Gasto recurrente
   * @param {Date} fromDate - Fecha desde la cual calcular
   * @returns {Date|null} - Próxima fecha de ocurrencia
   */
  calculateNextOccurrence(expense, fromDate = new Date()) {
    try {
      return this.calculator.calculateNextOccurrence(expense, fromDate);
    } catch (error) {
      logger.error('Error calculando próxima ocurrencia:', error);
      return null;
    }
  }

  /**
   * Verifica si un gasto debe ocurrir en una fecha específica
   * @param {Object} expense - Gasto recurrente
   * @param {Date} date - Fecha a verificar
   * @returns {boolean} - True si debe ocurrir
   */
  shouldOccurOnDate(expense, date) {
    try {
      return this.calculator.shouldOccurOnDate(expense, date);
    } catch (error) {
      logger.error('Error verificando ocurrencia en fecha:', error);
      return false;
    }
  }

  /**
   * Calcula el monto diario base
   * @param {Object} expense - Gasto recurrente
   * @returns {number} - Monto diario base
   */
  calculateBaseDailyAmount(expense) {
    try {
      return this.calculator.calculateBaseDailyAmount(expense);
    } catch (error) {
      logger.error('Error calculando monto diario base:', error);
      return 0;
    }
  }

  /**
   * Calcula el monto para un rango de fechas
   * @param {Object} expense - Gasto recurrente
   * @param {string} startDate - Fecha de inicio
   * @param {string} endDate - Fecha de fin
   * @returns {number} - Monto total para el rango
   */
  calculateRangeAmount(expense, startDate, endDate) {
    try {
      return this.calculator.calculateRangeAmount(expense, startDate, endDate);
    } catch (error) {
      logger.error('Error calculando monto de rango:', error);
      return 0;
    }
  }

  /**
   * Calcula el monto mensual de un gasto recurrente
   * @param {Object} expense - Gasto recurrente
   * @returns {number} - Monto mensual
   */
  calculateMonthlyAmount(expense) {
    try {
      return this.calculator.calculateMonthlyAmount(expense);
    } catch (error) {
      logger.error('Error calculando monto mensual:', error);
      return 0;
    }
  }

  /**
   * Obtiene el monto ajustado para una fecha específica
   * @param {Object} expense - Gasto recurrente
   * @param {string} dateStr - Fecha en formato YYYY-MM-DD
   * @returns {number} - Monto ajustado
   */
  getDailyAdjustedAmount(expense, dateStr) {
    try {
      return this.calculator.getDailyAdjustedAmount(expense, dateStr);
    } catch (error) {
      logger.error('Error obteniendo monto ajustado diario:', error);
      return 0;
    }
  }

  /**
   * Calcula fechas de ocurrencia en un rango
   * @param {Object} expense - Gasto recurrente
   * @param {Date} startDate - Fecha de inicio
   * @param {Date} endDate - Fecha de fin
   * @returns {Date[]} - Array de fechas de ocurrencia
   */
  calculateOccurrencesInRange(expense, startDate, endDate) {
    try {
      const occurrences = [];
      const current = new Date(startDate);
      const end = new Date(endDate);
      
      while (current <= end) {
        if (this.shouldOccurOnDate(expense, current)) {
          occurrences.push(new Date(current));
        }
        current.setDate(current.getDate() + 1);
      }
      
      return occurrences;
    } catch (error) {
      logger.error('Error calculando ocurrencias en rango:', error);
      return [];
    }
  }

  /**
   * Valida una configuración de recurrencia
   * @param {Object} config - Configuración a validar
   * @returns {Object} - Resultado de validación
   */
  validateRecurrenceConfig(config) {
    try {
      // Importar validación dinámicamente para evitar problemas de dependencias circulares
      const { validateRecurrenceConfig } = require('../../../../shared/recurring-expenses/validator.js');
      return validateRecurrenceConfig(config);
    } catch (error) {
      logger.error('Error validando configuración de recurrencia:', error);
      return { 
        isValid: false, 
        errors: ['Error de validación interno'] 
      };
    }
  }

  /**
   * Genera un resumen de un gasto recurrente
   * @param {Object} expense - Gasto recurrente
   * @returns {Object} - Resumen del gasto
   */
  generateExpenseSummary(expense) {
    try {
      const { formatExpenseSummary } = require('../../../../shared/recurring-expenses/formatter.js');
      return formatExpenseSummary(expense);
    } catch (error) {
      logger.error('Error generando resumen de gasto:', error);
      return {
        name: 'Error',
        amount: '$0.00',
        frequency: 'Desconocida',
        status: 'Error',
        dateRange: 'Sin datos',
        description: 'Error generando resumen'
      };
    }
  }

  // Métodos legacy para compatibilidad con código existente
  
  /**
   * @deprecated - Usar calculateNextOccurrence en su lugar
   */
  getNextDueDate(expense, fromDate) {
    logger.warn('Método getNextDueDate está deprecado. Usar calculateNextOccurrence.');
    return this.calculateNextOccurrence(expense, fromDate);
  }

  /**
   * @deprecated - Usar shouldOccurOnDate en su lugar
   */
  isDue(expense, date) {
    logger.warn('Método isDue está deprecado. Usar shouldOccurOnDate.');
    return this.shouldOccurOnDate(expense, date);
  }
}

export default RecurrenceCalculator;