/**
 * ExpenseScheduler - Servicio para la programación y procesamiento de gastos recurrentes
 * 
 * Este servicio se encarga de la generación automática de instancias de gastos recurrentes,
 * basándose en los patrones de recurrencia definidos en las plantillas.
 */

import mongoose from 'mongoose';
import Expense from '../../domain/entities/Expense.js';
import RecurrenceCalculator from './RecurrenceCalculatorAdapter.js';
import { logger } from '../../../barrel.js';

class ExpenseScheduler {
  /**
   * Constructor
   */
  constructor() {
    this.calculator = new RecurrenceCalculator();
  }
  
  /**
   * Procesa todos los gastos recurrentes activos y genera las instancias necesarias
   * @param {Date} processDate - Fecha hasta la cual procesar (por defecto hoy)
   * @param {Boolean} dryRun - Si es true, solo simula sin guardar cambios
   * @returns {Object} - Estadísticas del procesamiento
   */
  async processAllRecurringExpenses(processDate = new Date(), dryRun = false) {
    const stats = {
      processed: 0,
      created: 0,
      skipped: 0,
      errors: 0,
      details: []
    };
    
    try {
      logger.info(`Iniciando procesamiento de gastos recurrentes hasta ${processDate.toISOString()}`);
      
      // Buscar todas las plantillas de gastos recurrentes activas
      const templates = await Expense.find({
        type: 'recurring-template',
        $or: [
          { 'recurrence.isActive': true },
          { 'recurringConfig.isActive': true }
        ]
      });
      
      logger.info(`Encontradas ${templates.length} plantillas de gastos recurrentes activas`);
      
      // Procesar cada plantilla
      for (const template of templates) {
        try {
          const result = await this.processRecurringExpense(template, processDate, dryRun);
          
          stats.processed++;
          stats.created += result.created;
          stats.skipped += result.skipped;
          stats.details.push({
            expenseId: template._id,
            name: template.name,
            ...result
          });
          
        } catch (error) {
          stats.errors++;
          logger.error(`Error procesando gasto recurrente ${template._id}: ${error.message}`, { error });
          stats.details.push({
            expenseId: template._id,
            name: template.name,
            error: error.message
          });
        }
      }
      
      logger.info(`Procesamiento de gastos recurrentes completado`, stats);
      return stats;
      
    } catch (error) {
      logger.error(`Error en procesamiento general de gastos recurrentes: ${error.message}`, { error });
      throw error;
    }
  }
  
  /**
   * Procesa un gasto recurrente específico y genera las instancias necesarias
   * @param {Object} template - Plantilla de gasto recurrente
   * @param {Date} processDate - Fecha hasta la cual procesar
   * @param {Boolean} dryRun - Si es true, solo simula sin guardar cambios
   * @returns {Object} - Estadísticas del procesamiento
   */
  async processRecurringExpense(template, processDate = new Date(), dryRun = false) {
    const result = {
      created: 0,
      skipped: 0,
      instances: []
    };
    
    try {
      // Validar que sea una plantilla
      if (template.type !== 'recurring-template') {
        logger.warn(`El gasto ${template._id} no es una plantilla recurrente`);
        return result;
      }
      
      // Determinar fecha base para cálculos
      const recurrence = this.calculator.normalizeRecurrenceConfig(template);
      if (!recurrence || recurrence.isActive === false) {
        logger.info(`El gasto recurrente ${template._id} está inactivo o no tiene configuración válida`);
        return result;
      }
      
      // Fecha de la última instancia creada o fecha de inicio
      const lastProcessed = recurrence.lastProcessed 
        ? new Date(recurrence.lastProcessed) 
        : new Date(recurrence.startDate || template.date);
      
      // Verificar instancias existentes
      const existingInstances = await Expense.find({
        parentTemplate: template._id,
        type: 'recurring-instance'
      }).sort({ date: 1 });
      
      // Almacenar fechas existentes para evitar duplicados
      const existingDates = new Set(existingInstances.map(instance => 
        this.getDateKey(new Date(instance.date))
      ));
      
      // Calcular próximas fechas hasta la fecha de proceso
      const occurrenceDates = this.getOccurrencesUntil(template, lastProcessed, processDate);
      
      // Crear instancias para cada fecha
      for (const occurrenceDate of occurrenceDates) {
        const dateKey = this.getDateKey(occurrenceDate);
        
        // Verificar si ya existe una instancia para esta fecha
        if (existingDates.has(dateKey)) {
          result.skipped++;
          continue;
        }
        
        // Crear instancia de gasto
        const instance = await this.createExpenseInstance(template, occurrenceDate, dryRun);
        
        if (instance) {
          result.created++;
          result.instances.push({
            id: dryRun ? null : instance._id,
            date: occurrenceDate
          });
        }
      }
      
      // Actualizar última fecha procesada si no es un dry run
      if (!dryRun && occurrenceDates.length > 0) {
        const lastDate = occurrenceDates[occurrenceDates.length - 1];
        await this.updateLastProcessed(template, lastDate);
      }
      
      return result;
      
    } catch (error) {
      logger.error(`Error procesando gasto recurrente ${template._id}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Obtiene todas las ocurrencias hasta una fecha límite
   * @param {Object} template - Plantilla de gasto recurrente
   * @param {Date} startDate - Fecha de inicio
   * @param {Date} endDate - Fecha límite
   * @returns {Array<Date>} - Lista de fechas de ocurrencia
   */
  getOccurrencesUntil(template, startDate, endDate) {
    const occurrences = [];
    let currentDate = new Date(startDate);
    
    // Ajustar para empezar desde el día siguiente
    currentDate.setDate(currentDate.getDate() + 1);
    
    // Limitar el número de ocurrencias a 100 para evitar bucles infinitos
    let safety = 0;
    const MAX_OCCURRENCES = 100;
    
    while (currentDate <= endDate && safety < MAX_OCCURRENCES) {
      const nextDate = this.calculator.getNextOccurrenceDate(template, currentDate);
      
      if (!nextDate || nextDate > endDate) {
        break;
      }
      
      // Verificar que la fecha sea diferente a la anterior
      if (nextDate.getTime() !== currentDate.getTime()) {
        occurrences.push(nextDate);
        currentDate = new Date(nextDate);
      } else {
        // Evitar bucle infinito
        break;
      }
      
      // Incrementar contador de seguridad
      safety++;
    }
    
    return occurrences;
  }
  
  /**
   * Crea una instancia de gasto recurrente
   * @param {Object} template - Plantilla de gasto recurrente
   * @param {Date} date - Fecha de la instancia
   * @param {Boolean} dryRun - Si es true, solo simula sin guardar
   * @returns {Object} - Instancia creada o null si es dryRun
   */
  async createExpenseInstance(template, date, dryRun = false) {
    try {
      // Crear objeto de la instancia
      const instanceData = {
        description: template.description,
        amount: template.amount,
        category: template.category,
        date: date,
        // Propagar método de pago completo
        paymentMethodId: template.paymentMethodId,
        paymentMethod: template.paymentMethod,
        // Metadatos de recurrencia
        type: 'recurring-instance',
        parentTemplate: template._id,
        createdBy: template.createdBy
      };
      
      // En modo simulación, solo devolver los datos
      if (dryRun) {
        logger.info(`[DRY RUN] Se crearía instancia de gasto recurrente: ${template.name} - ${date.toISOString()}`);
        return instanceData;
      }
      
      // Crear y guardar la instancia
      const instance = new Expense(instanceData);
      await instance.save();
      
      logger.info(`Creada instancia de gasto recurrente: ${instance._id} - ${template.name} - ${date.toISOString()}`);
      return instance;
      
    } catch (error) {
      logger.error(`Error creando instancia de gasto recurrente: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Actualiza la fecha de último procesamiento de una plantilla
   * @param {Object} template - Plantilla de gasto recurrente
   * @param {Date} lastDate - Fecha de último procesamiento
   */
  async updateLastProcessed(template, lastDate) {
    try {
      // Determinar dónde almacenar la fecha según formato
      if (template.recurrence) {
        // Nuevo formato
        await Expense.findByIdAndUpdate(template._id, {
          'recurrence.lastProcessed': lastDate
        });
      } else if (template.recurringConfig) {
        // Formato antiguo
        await Expense.findByIdAndUpdate(template._id, {
          'recurringConfig.lastProcessed': lastDate
        });
      }
      
    } catch (error) {
      logger.error(`Error actualizando última fecha procesada: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Genera una clave única para una fecha (YYYY-MM-DD)
   * @param {Date} date - Fecha
   * @returns {String} - Clave de fecha
   */
  getDateKey(date) {
    return date.toISOString().split('T')[0];
  }
  
  /**
   * Actualiza los ajustes diarios para un mes específico
   * @param {ObjectId} templateId - ID de la plantilla
   * @param {String} yearMonth - Mes en formato YYYY-MM
   * @param {Object} dailyAdjustments - Objeto con los ajustes por día
   * @returns {Object} - Plantilla actualizada
   */
  async updateDailyAdjustments(templateId, yearMonth, dailyAdjustments) {
    try {
      // Validar ID
      if (!mongoose.Types.ObjectId.isValid(templateId)) {
        throw new Error('ID de plantilla inválido');
      }
      
      // Validar formato de mes
      if (!yearMonth.match(/^\d{4}-\d{2}$/)) {
        throw new Error('Formato de mes inválido, debe ser YYYY-MM');
      }
      
      // Buscar plantilla
      const template = await Expense.findOne({
        _id: templateId,
        type: 'recurring-template'
      });
      
      if (!template) {
        throw new Error('Plantilla no encontrada');
      }
      
      // Determinar dónde almacenar los ajustes según formato
      if (template.recurrence) {
        // Nuevo formato
        await Expense.findByIdAndUpdate(templateId, {
          'recurrence.adjustmentsMonth': yearMonth,
          'recurrence.dailyAdjustments': dailyAdjustments
        });
      } else if (template.recurringConfig) {
        // Formato antiguo
        await Expense.findByIdAndUpdate(templateId, {
          'recurringConfig.adjustmentsMonth': yearMonth,
          'recurringConfig.dailyAdjustments': dailyAdjustments
        });
      } else {
        throw new Error('La plantilla no tiene configuración de recurrencia');
      }
      
      // Devolver plantilla actualizada
      return await Expense.findById(templateId);
      
    } catch (error) {
      logger.error(`Error actualizando ajustes diarios: ${error.message}`);
      throw error;
    }
  }
}

export default ExpenseScheduler;