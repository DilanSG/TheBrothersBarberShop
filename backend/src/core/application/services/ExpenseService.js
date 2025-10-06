/**
 * ExpenseService - Servicio centralizado para la gestión de gastos
 * 
 * Este servicio implementa Clean Architecture y encapsula toda la lógica
 * relacionada con gastos para evitar duplicación y mejorar la mantenibilidad.
 */

import Expense from '../../domain/entities/Expense.js';
import PaymentMethod from '../../domain/entities/PaymentMethod.js';
import RecurrenceCalculator from './RecurrenceCalculator.js';
import RecurrenceValidator from './RecurrenceValidator.js';
import ExpenseScheduler from './ExpenseScheduler.js';
import { AppError } from '../../../shared/utils/errors.js';
import { logger } from '../../../shared/utils/logger.js';

class ExpenseService {
  /**
   * Obtener lista de gastos con filtros y paginación
   * @param {Object} params
   * @param {Object} params.user - Usuario solicitante (para futuras validaciones de permisos)
   * @param {Object} params.filters - Filtros de búsqueda (category, type, date range, etc.)
   * @param {Object} params.pagination - Parámetros de paginación { page, limit }
   * @returns {Promise<Object>} Resultado con datos y metadatos de paginación
   */
  static async getExpenses({ user, filters = {}, pagination = {} }) {
    const { page = 1, limit = 50 } = pagination;

    const query = {};

    // Filtros básicos permitidos
    const allowedFilters = ['type', 'category', 'paymentMethod', 'createdBy'];
    allowedFilters.forEach(f => {
      if (filters[f] !== undefined) query[f] = filters[f];
    });

    // Rango de fechas
    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) query.date.$gte = new Date(filters.startDate + 'T00:00:00.000Z');
      if (filters.endDate) query.date.$lte = new Date(filters.endDate + 'T23:59:59.999Z');
    }

    // Texto (description search)
    if (filters.search) {
      query.description = { $regex: filters.search, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Expense.find(query)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Expense.countDocuments(query)
    ]);

    return {
      data: items,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    };
  }

  /**
   * Obtener una plantilla de gasto recurrente por ID
   * @param {String} templateId
   * @param {Object} user
   * @returns {Promise<Object>}
   */
  static async getRecurringExpenseTemplateById(templateId, user) {
    const template = await Expense.findOne({ _id: templateId, type: 'recurring-template' });
    if (!template) {
      throw new AppError('Plantilla de gasto recurrente no encontrada', 404);
    }
    return template;
  }

  /**
   * Listar todas las plantillas de gastos recurrentes
   * @param {Object} user
   * @returns {Promise<Array>}
   */
  static async getRecurringExpenseTemplates(user) {
    // Buscar primero plantillas ya migradas
    let templates = await Expense.find({ type: 'recurring-template' }).sort({ 'recurrence.isActive': -1, description: 1 });

    // Si no hay (o por robustez siempre revisamos legacy) detectar gastos legacy pendientes
    const legacy = await Expense.find({ type: 'recurring', 'recurringConfig._migrated': { $ne: true } });
    let migratedCount = 0;
    if (legacy.length > 0) {
      for (const exp of legacy) {
        try {
          if (exp.recurringConfig) {
            const newRecurrence = RecurrenceValidator.convertFromLegacy(exp.recurringConfig, exp.date);
            exp.recurrence = newRecurrence;
            if (!exp.recurringConfig._migrated) {
              exp.recurringConfig._migrated = true;
              exp.recurringConfig._migratedAt = new Date();
            }
            exp.type = 'recurring-template';
            await exp.save();
            migratedCount++;
          }
        } catch (e) {
          logger.warn('ExpenseService: Falló migración inline de gasto legacy', { id: exp._id, error: e.message });
        }
      }
      if (migratedCount > 0) {
        // Recargar lista completa tras migración
        templates = await Expense.find({ type: 'recurring-template' }).sort({ 'recurrence.isActive': -1, description: 1 });
      }
    }
    // Adjuntar campo virtual para que el controller pueda devolver info de migración
    templates._migratedInlineCount = migratedCount; // no persiste, solo ad-hoc
    return templates;
  }

  /**
   * Obtener categorías de gastos (con agregados opcionales por rango de fechas)
   * @param {String} startDate (YYYY-MM-DD)
   * @param {String} endDate (YYYY-MM-DD)
   * @returns {Promise<Array>} Lista de categorías con totales
   */
  static async getExpenseCategories(startDate, endDate) {
    const match = {};
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate + 'T00:00:00.000Z');
      if (endDate) match.date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const pipeline = [
      Object.keys(match).length ? { $match: match } : null,
      { $group: { _id: '$category', totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $project: { _id: 0, category: '$_id', totalAmount: 1, count: 1 } },
      { $sort: { totalAmount: -1 } }
    ].filter(Boolean);

    return Expense.aggregate(pipeline);
  }
  /**
   * Crear un gasto único
   * @param {Object} data - Datos del gasto
   * @param {String} userId - ID del usuario creador
   * @returns {Promise<Object>} - Gasto creado
   */
  static async createExpense(data, userId) {
    logger.debug('ExpenseService: Creando gasto único', { description: data.description });
    
    // Validar el método de pago
    await this.validatePaymentMethod(data.paymentMethodId || data.paymentMethod);
    
    // Crear el gasto
    const expense = new Expense({
      ...data,
      type: 'one-time',
      createdBy: userId,
      metadata: { 
        source: 'manual',
        generatedAt: new Date()
      }
    });
    
    return await expense.save();
  }
  
  /**
   * Crear un gasto recurrente (template)
   * @param {Object} data - Datos del gasto recurrente
   * @param {String} userId - ID del usuario creador
   * @returns {Promise<Object>} - Gasto recurrente creado
   */
  static async createRecurringExpense(data, userId) {
    logger.debug('ExpenseService: Creando gasto recurrente', { description: data.description });
    
    // Validar el método de pago y normalizar campos requeridos
    await this.validatePaymentMethod(data.paymentMethodId || data.paymentMethod);
    // Si viene sólo como backendId/alias en data.paymentMethod, resolver y setear paymentMethodId
    if (!data.paymentMethodId && data.paymentMethod) {
      const method = await PaymentMethod.findByIdOrAlias(data.paymentMethod) || await PaymentMethod.findOne({ backendId: data.paymentMethod });
      if (method) {
        data.paymentMethodId = method._id;
        data.paymentMethod = method.backendId;
      }
    }
    
    // Validar la configuración de recurrencia
    const { recurrence } = data;
    if (!recurrence || !recurrence.pattern) {
      throw new AppError('La configuración de recurrencia es requerida', 400);
    }
    
    this.validateRecurrenceConfig(recurrence);
    
    // Crear el template de gasto recurrente
    const expense = new Expense({
      ...data,
      type: 'recurring-template',
      createdBy: userId,
      metadata: { 
        source: 'manual',
        generatedAt: new Date()
      }
    });
    
    const savedExpense = await expense.save();
    
    // Planificar próximas ocurrencias
    if (!savedExpense.paymentMethodId) {
      logger.warn('Plantilla guardada sin paymentMethodId, omitiendo scheduleNextOccurrences temporalmente', { id: savedExpense._id });
    } else {
      await this.scheduleNextOccurrences(savedExpense);
    }
    
    return savedExpense;
  }
  
  /**
   * Validar un método de pago
   * @param {String} paymentMethodId - ID o código del método de pago
   * @returns {Promise<Boolean>} - true si el método es válido
   */
  static async validatePaymentMethod(paymentMethodId) {
    if (!paymentMethodId) {
      throw new AppError('El método de pago es requerido', 400);
    }
    
    // Intentar encontrar por ID de MongoDB primero
    let paymentMethod;
    
    try {
      if (paymentMethodId.match(/^[0-9a-fA-F]{24}$/)) {
        // Es un ID de MongoDB, buscar por ID
        paymentMethod = await PaymentMethod.findById(paymentMethodId);
      }
    } catch (error) {
      // Ignorar errores de formato y continuar
    }
    
    // Si no se encontró por ID, buscar por backendId (string)
    if (!paymentMethod) {
      paymentMethod = await PaymentMethod.findOne({ backendId: paymentMethodId });
    }
    
    if (!paymentMethod) {
      throw new AppError(`Método de pago no válido: ${paymentMethodId}`, 400);
    }
    
    return true;
  }
  
  /**
   * Validar configuración de recurrencia
   * @param {Object} recurrence - Configuración de recurrencia
   */
  static validateRecurrenceConfig(recurrence) {
    if (!recurrence) {
      throw new AppError('La configuración de recurrencia es requerida', 400);
    }
    
    // Usar el validador especializado
    const { isValid, errors } = RecurrenceValidator.validate(recurrence);
    
    if (!isValid) {
      throw new AppError(`Configuración de recurrencia inválida: ${errors.join(', ')}`, 400);
    }
    
    // Normalizar la configuración para asegurarnos de que tenga todos los campos necesarios
    return RecurrenceValidator.normalize(recurrence);
  }
  
  /**
   * Actualizar un gasto existente
   * @param {String} expenseId - ID del gasto
   * @param {Object} updates - Datos a actualizar
   * @param {String} userId - ID del usuario que actualiza
   * @returns {Promise<Object>} - Gasto actualizado
   */
  static async updateExpense(expenseId, updates, userId) {
    logger.debug('ExpenseService: Actualizando gasto', { expenseId, updates });
    
    // Encontrar el gasto
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      throw new AppError('Gasto no encontrado', 404);
    }
    
    // Verificar permisos (solo admin o creador pueden editar)
    // Nota: La validación de roles se debe hacer en el controlador
    
    // Si se está actualizando el método de pago, validarlo
    if (updates.paymentMethodId || updates.paymentMethod) {
      await this.validatePaymentMethod(updates.paymentMethodId || updates.paymentMethod);
    }
    
    // Si es un gasto recurrente y se actualiza la configuración, validarla
    if (updates.recurrence && (expense.type === 'recurring-template' || updates.type === 'recurring-template')) {
      this.validateRecurrenceConfig(updates.recurrence);
    }
    
    // Actualizar todos los campos modificables
    const allowedFields = [
      'description', 'amount', 'category', 'paymentMethodId', 'paymentMethod',
      'date', 'notes', 'recurrence'
    ];
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        expense[field] = updates[field];
      }
    });
    
    // Si se está cambiando el tipo
    if (updates.type && updates.type !== expense.type) {
      // Solo se permite cambiar de/a recurring-template con la configuración adecuada
      if (updates.type === 'recurring-template' && !expense.recurrence && !updates.recurrence) {
        throw new AppError('Se requiere configuración de recurrencia para gastos recurrentes', 400);
      }
      
      expense.type = updates.type;
    }
    
    // Guardar cambios
    return await expense.save();
  }
  
  /**
   * Eliminar un gasto
   * @param {String} expenseId - ID del gasto
   * @param {String} userId - ID del usuario que elimina
   * @returns {Promise<Boolean>} - true si se eliminó correctamente
   */
  static async deleteExpense(expenseId, userId) {
    logger.debug('ExpenseService: Eliminando gasto', { expenseId });
    
    // Encontrar el gasto
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      throw new AppError('Gasto no encontrado', 404);
    }
    
    // Verificar permisos (solo admin o creador pueden eliminar)
    // Nota: La validación de roles se debe hacer en el controlador
    
    // Si es un template recurrente, eliminar también sus instancias
    if (expense.type === 'recurring-template') {
      await Expense.deleteMany({ parentTemplate: expenseId });
      logger.info('ExpenseService: Eliminadas instancias de gasto recurrente', { 
        expenseId, 
        templateDescription: expense.description
      });
    }
    
    // Eliminar el gasto
    await expense.deleteOne();
    
    return true;
  }
  
  /**
   * Activar/Desactivar un gasto recurrente
   * @param {String} expenseId - ID del gasto recurrente
   * @param {Boolean} isActive - Estado de activación
   * @returns {Promise<Object>} - Gasto actualizado
   */
  static async toggleRecurringExpense(expenseId, isActive) {
    logger.debug('ExpenseService: Cambiando estado de gasto recurrente', { expenseId, isActive });
    
    // Encontrar el gasto
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      throw new AppError('Gasto no encontrado', 404);
    }
    
    if (expense.type !== 'recurring-template' && expense.type !== 'recurring') {
      throw new AppError('Solo se pueden activar/desactivar gastos recurrentes', 400);
    }
    
    // Actualizar según la estructura
    if (expense.type === 'recurring-template') {
      expense.recurrence.isActive = isActive;
    } else {
      expense.recurringConfig.isActive = isActive;
    }
    
    return await expense.save();
  }
  
  /**
   * Procesar gastos recurrentes programados
   * @param {Date} processDate - Fecha hasta la que procesar (por defecto hoy)
   * @param {Boolean} dryRun - Si es true, simula sin guardar cambios
   * @returns {Promise<Object>} - Resultado del procesamiento
   */
  static async processScheduledExpenses(processDate = new Date(), dryRun = false) {
    logger.info('ExpenseService: Iniciando procesamiento de gastos recurrentes', {
      processDate: processDate.toISOString(),
      dryRun
    });
    
    // Usar el ExpenseScheduler especializado para procesar los gastos
    const scheduler = new ExpenseScheduler();
    const result = await scheduler.processAllRecurringExpenses(processDate, dryRun);
    
    logger.info('ExpenseService: Procesamiento de gastos recurrentes completado', {
      processed: result.processed,
      created: result.created,
      errors: result.errors
    });
    
    return result;
  }
  
  /**
   * Planificar próximas ocurrencias de un gasto recurrente
   * @param {Object} template - Template de gasto recurrente
   * @param {Date} untilDate - Fecha hasta la cual programar (por defecto 30 días)
   * @returns {Promise<Object>} - Resultado de la programación
   */
  static async scheduleNextOccurrences(template, untilDate = null) {
    logger.debug('ExpenseService: Planificando próximas ocurrencias', {
      templateId: template._id,
      description: template.description
    });
    
    // Si no se especificó fecha límite, usar 30 días desde hoy
    const processDate = untilDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    // Usar el scheduler para procesar solo este template
    const scheduler = new ExpenseScheduler();
    return await scheduler.processRecurringExpense(template, processDate);
  }
  
  /**
   * Actualizar ajustes diarios para un gasto recurrente
   * @param {String} templateId - ID de la plantilla
   * @param {String} yearMonth - Mes en formato YYYY-MM
   * @param {Object} dailyAdjustments - Objeto con los ajustes por día
   * @returns {Promise<Object>} - Plantilla actualizada
   */
  static async updateDailyAdjustments(templateId, yearMonth, dailyAdjustments) {
    logger.debug('ExpenseService: Actualizando ajustes diarios', {
      templateId,
      yearMonth
    });
    
    const scheduler = new ExpenseScheduler();
    return await scheduler.updateDailyAdjustments(templateId, yearMonth, dailyAdjustments);
  }

  /**
   * Obtener ajustes diarios de una plantilla recurrente para un mes dado
   * Importante: El modelo actual solo persiste UN mes de ajustes a la vez (adjustmentsMonth + dailyAdjustments)
   * por lo que si se solicita un mes distinto al almacenado se devolverá objeto vacío
   * manteniendo compatibilidad con posible formato legacy (recurringConfig)
   * @param {String} templateId
   * @param {String} yearMonth (YYYY-MM)
   * @returns {Promise<Object>} { templateId, yearMonth, adjustments }
   */
  static async getDailyAdjustments(templateId, yearMonth) {
    logger.debug('ExpenseService: Obteniendo ajustes diarios', { templateId, yearMonth });

    if (!templateId) {
      throw new AppError('templateId requerido', 400);
    }
    if (yearMonth && !/^\d{4}-\d{2}$/.test(yearMonth)) {
      throw new AppError('Parámetro yearMonth inválido. Formato esperado YYYY-MM', 400);
    }

    const template = await Expense.findOne({ _id: templateId, type: 'recurring-template' });
    if (!template) {
      throw new AppError('Plantilla de gasto recurrente no encontrada', 404);
    }

    // Determinar fuente (nuevo vs legacy)
    let storedMonth = null;
    let storedAdjustments = {};
    if (template.recurrence) {
      storedMonth = template.recurrence.adjustmentsMonth;
      storedAdjustments = template.recurrence.dailyAdjustments || {};
    } else if (template.recurringConfig) { // legacy
      storedMonth = template.recurringConfig.adjustmentsMonth;
      storedAdjustments = template.recurringConfig.dailyAdjustments || {};
    }

    const targetMonth = yearMonth || storedMonth || new Date().toISOString().slice(0,7);

    const adjustments = (storedMonth && storedMonth === targetMonth) ? storedAdjustments : {};

    return {
      templateId: template._id.toString(),
      yearMonth: targetMonth,
      adjustments
    };
  }
  
  /**
   * Calcular monto de gastos recurrentes para un período específico
   * @param {Object} expense - Gasto recurrente
   * @param {String} startDate - Fecha de inicio (YYYY-MM-DD)
   * @param {String} endDate - Fecha de fin (YYYY-MM-DD)
   * @returns {Number} - Monto total para el período
   */
  static calculateRecurringAmount(expense, startDate, endDate) {
    const calculator = new RecurrenceCalculator();
    return calculator.calculateAmountForPeriod(expense, startDate, endDate);
  }
  
  /**
   * Calcular monto mensual para un gasto recurrente
   * @param {Object} expense - Gasto recurrente
   * @returns {Number} - Monto mensual estimado
   */
  static calculateMonthlyAmount(expense) {
    const calculator = new RecurrenceCalculator();
    return calculator.calculateMonthlyAmount(expense);
  }
  
  /**
   * Obtener la próxima fecha de ocurrencia para un gasto recurrente
   * @param {Object} expense - Gasto recurrente
   * @returns {Date} - Próxima fecha de ocurrencia o null si no hay
   */
  static getNextOccurrenceDate(expense) {
    const calculator = new RecurrenceCalculator();
    return calculator.getNextOccurrenceDate(expense);
  }
  
  /**
   * Migrar gastos del formato antiguo al nuevo
   * @returns {Promise<Object>} - Resultado de la migración
   */
  static async migrateOldExpenses() {
    logger.info('ExpenseService: Iniciando migración de gastos recurrentes antiguos');
    
    // Encontrar gastos recurrentes con formato antiguo
    const oldRecurringExpenses = await Expense.find({
      type: 'recurring',
      'recurringConfig._migrated': { $ne: true }
    });
    
    logger.info(`ExpenseService: Encontrados ${oldRecurringExpenses.length} gastos para migrar`);
    
    let migratedCount = 0;
    const errors = [];
    
    for (const expense of oldRecurringExpenses) {
      try {
        // Convertir del formato antiguo al nuevo usando RecurrenceValidator
        if (expense.recurringConfig) {
          const newRecurrence = RecurrenceValidator.convertFromLegacy(expense.recurringConfig, expense.date);
          
          // Asignar la nueva configuración de recurrencia
          expense.recurrence = newRecurrence;
          
          // Marcar como migrado
          if (!expense.recurringConfig._migrated) {
            expense.recurringConfig._migrated = true;
            expense.recurringConfig._migratedAt = new Date();
          }
          
          // Cambiar tipo
          expense.type = 'recurring-template';
          
          await expense.save();
          migratedCount++;
        }
        
      } catch (error) {
        logger.error('ExpenseService: Error migrando gasto', {
          expenseId: expense._id,
          description: expense.description,
          error: error.message
        });
        
        errors.push({
          expenseId: expense._id,
          description: expense.description,
          error: error.message
        });
      }
    }
    
    logger.info(`ExpenseService: Migración completada. ${migratedCount} gastos migrados, ${errors.length} errores`);
    
    return {
      migrated: migratedCount,
      errors: errors.length > 0 ? errors : undefined
    };
  }
  
  /**
   * Obtener resumen de gastos con métricas avanzadas
   * @param {String} startDate - Fecha de inicio (YYYY-MM-DD)
   * @param {String} endDate - Fecha de fin (YYYY-MM-DD)
   * @param {Object} filters - Filtros adicionales
   * @returns {Promise<Object>} - Resumen completo
   */
  static async getExpenseSummary(startDate, endDate, filters = {}) {
    // Permitir llamado con objeto: getExpenseSummary({ startDate, endDate, filters })
    if (typeof startDate === 'object' && startDate !== null) {
      const params = startDate; // primer argumento es el objeto
      endDate = params.endDate;
      filters = params.filters || params.filters === undefined ? (params.filters || {}) : {};
      startDate = params.startDate;
    }

    if (!startDate || !endDate) {
      throw new AppError('startDate y endDate son requeridos para obtener resumen', 400);
    }

    return Expense.getExpenseSummary(startDate, endDate, filters);
  }
  
  /**
   * Obtener desglose diario de gastos
   * @param {String} startDate - Fecha de inicio (YYYY-MM-DD)
   * @param {String} endDate - Fecha de fin (YYYY-MM-DD)
   * @param {Object} filters - Filtros adicionales
   * @returns {Promise<Array>} - Desglose diario
   */
  static async getDailyBreakdown(startDate, endDate, filters = {}) {
    logger.debug('ExpenseService: Obteniendo desglose diario', { startDate, endDate });
    
    const pipeline = [
      {
        $match: {
          date: {
            $gte: new Date(startDate + 'T00:00:00.000Z'),
            $lte: new Date(endDate + 'T23:59:59.999Z')
          },
          ...filters
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$date'
            }
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          totalAmount: 1,
          count: 1
        }
      },
      {
        $sort: { date: 1 }
      }
    ];
    
    return Expense.aggregate(pipeline);
  }
}

export default ExpenseService;