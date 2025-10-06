import PaymentMethod from '../../../core/domain/entities/PaymentMethod.js';
import Sale from '../../../core/domain/entities/Sale.js';
import Expense from '../../../core/domain/entities/Expense.js';
import Appointment from '../../../core/domain/entities/Appointment.js';
import { AppError, CommonErrors } from '../../../shared/utils/errors.js';
import { logger } from '../../../shared/utils/logger.js';

/**
 * Use case: Inicializar métodos de pago del sistema
 */
export class InitializePaymentMethods {
  static async execute() {
    try {
      logger.info('🔄 Inicializando métodos de pago del sistema...');
      
      const systemMethods = [
        {
          backendId: 'cash',
          name: 'Efectivo',
          description: 'Pago en efectivo',
          color: '#10b981',
          emoji: '💵',
          category: 'cash',
          isSystem: true,
          displayOrder: 1,
          aliases: ['efectivo']
        },
        {
          backendId: 'tarjeta',
          name: 'Tarjeta',
          description: 'Tarjeta débito/crédito',
          color: '#3b82f6',
          emoji: '💳',
          category: 'card',
          isSystem: true,
          displayOrder: 2,
          aliases: ['debit', 'credit', 'card']
        },
        {
          backendId: 'nequi',
          name: 'Nequi',
          description: 'Pago por Nequi',
          color: '#8b5cf6',
          emoji: '📱',
          category: 'digital',
          isSystem: true,
          displayOrder: 3,
          aliases: []
        },
        {
          backendId: 'daviplata',
          name: 'Daviplata',
          description: 'Pago por Daviplata',
          color: '#ef4444',
          emoji: '📱',
          category: 'digital',
          isSystem: true,
          displayOrder: 4,
          aliases: []
        },
        {
          backendId: 'bancolombia',
          name: 'Bancolombia',
          description: 'Transferencia Bancolombia',
          color: '#f59e0b',
          emoji: '🏛️',
          category: 'transfer',
          isSystem: true,
          displayOrder: 5,
          aliases: ['transfer']
        },
        {
          backendId: 'nu',
          name: 'Nu',
          description: 'Tarjeta Nu',
          color: '#8b5cf6',
          emoji: '💳',
          category: 'card',
          isSystem: true,
          displayOrder: 6,
          aliases: []
        },
        {
          backendId: 'digital',
          name: 'Pago Digital',
          description: 'Otros métodos digitales',
          color: '#06b6d4',
          emoji: '💻',
          category: 'digital',
          isSystem: true,
          displayOrder: 7,
          aliases: []
        }
      ];

      for (const methodData of systemMethods) {
        await PaymentMethod.findOneAndUpdate(
          { backendId: methodData.backendId },
          { $setOnInsert: methodData },
          { upsert: true, new: true }
        );
      }

      const count = await PaymentMethod.countDocuments({ isSystem: true });
      logger.info(`✅ Métodos de pago del sistema inicializados: ${count}`);
      
      return { success: true, count };
    } catch (error) {
      logger.error('❌ Error inicializando métodos de pago:', error);
      throw new AppError('Error inicializando métodos de pago', 500);
    }
  }
}

/**
 * Use case: Obtener todos los métodos de pago activos
 */
export class GetPaymentMethods {
  static async execute() {
    try {
      logger.info('🔍 Obteniendo métodos de pago activos...');
      
      const methods = await PaymentMethod.getActiveOrderedMethods();
      
      logger.info(`✅ Métodos de pago obtenidos: ${methods.length}`);
      
      return methods.map(method => ({
        _id: method._id,
        backendId: method.backendId,
        name: method.name,
        description: method.description,
        color: method.color,
        emoji: method.emoji,
        category: method.category,
        isSystem: method.isSystem
      }));
    } catch (error) {
      logger.error('❌ Error obteniendo métodos de pago:', error);
      throw new AppError('Error obteniendo métodos de pago', 500);
    }
  }
}

/**
 * Use case: Crear un nuevo método de pago
 */
export class CreatePaymentMethod {
  static async execute({ backendId, name, description, color, emoji, category }) {
    try {
      logger.info(`🆕 Creando método de pago: ${backendId}`);
      
      // Verificar que no exista
      const existing = await PaymentMethod.findOne({ backendId });
      if (existing) {
        throw new AppError('El método de pago ya existe', 400);
      }
      
      const method = new PaymentMethod({
        backendId,
        name,
        description,
        color: color || '#6b7280',
        emoji: emoji || '💳',
        category: category || 'digital',
        isSystem: false,
        displayOrder: 100
      });
      
      await method.save();
      
      logger.info(`✅ Método de pago creado: ${method.backendId}`);
      return method.toFrontendFormat();
    } catch (error) {
      logger.error('❌ Error creando método de pago:', error);
      if (error.code === 11000) {
        throw new AppError('El método de pago ya existe', 400);
      }
      throw new AppError('Error creando método de pago', 500);
    }
  }
}

/**
 * Use case: Actualizar un método de pago
 */
export class UpdatePaymentMethod {
  static async execute(backendId, updateData) {
    try {
      logger.info(`✏️ Actualizando método de pago: ${backendId}`);
      
      const method = await PaymentMethod.findOne({ backendId });
      if (!method) {
        throw new AppError('Método de pago no encontrado', 404);
      }
      
      // No permitir actualizar métodos del sistema
      if (method.isSystem && !updateData.allowSystemUpdate) {
        throw new AppError('No se pueden modificar métodos de pago del sistema', 403);
      }
      
      Object.assign(method, updateData);
      await method.save();
      
      logger.info(`✅ Método de pago actualizado: ${method.backendId}`);
      return method.toFrontendFormat();
    } catch (error) {
      logger.error('❌ Error actualizando método de pago:', error);
      throw new AppError('Error actualizando método de pago', 500);
    }
  }
}

/**
 * Use case: Eliminar/desactivar un método de pago
 */
export class DeletePaymentMethod {
  static async execute(backendId, forceDelete = false) {
    try {
      logger.info(`🗑️ Eliminando método de pago: ${backendId}`);
      
      const method = await PaymentMethod.findOne({ backendId });
      if (!method) {
        throw new AppError('Método de pago no encontrado', 404);
      }
      
      // Verificar si es método del sistema
      if (method.isSystem) {
        if (method.backendId === 'cash') {
          throw new AppError('No se puede eliminar el efectivo - método esencial', 403);
        }
        
        if (!forceDelete) {
          // Solo desactivar métodos del sistema
          method.isActive = false;
          await method.save();
          logger.info(`🙈 Método de pago del sistema desactivado: ${backendId}`);
          return { deactivated: true };
        }
      }
      
      // Verificar si está en uso
      const [salesCount, expensesCount, appointmentsCount] = await Promise.all([
        Sale.countDocuments({ paymentMethod: backendId }),
        Expense.countDocuments({ paymentMethod: backendId }),
        Appointment.countDocuments({ paymentMethod: backendId })
      ]);
      
      const totalUsage = salesCount + expensesCount + appointmentsCount;
      
      if (totalUsage > 0 && !forceDelete) {
        throw new AppError(
          `No se puede eliminar. Método en uso: ${totalUsage} registros (${salesCount} ventas, ${expensesCount} gastos, ${appointmentsCount} citas)`,
          400
        );
      }
      
      if (forceDelete || !method.isSystem) {
        await PaymentMethod.deleteOne({ backendId });
        logger.info(`🗑️ Método de pago eliminado permanentemente: ${backendId}`);
        return { deleted: true };
      }
      
    } catch (error) {
      logger.error('❌ Error eliminando método de pago:', error);
      throw error instanceof AppError ? error : new AppError('Error eliminando método de pago', 500);
    }
  }
}

/**
 * Use case: Normalizar métodos de pago existentes en la BD
 */
export class NormalizeExistingPaymentMethods {
  static async execute() {
    try {
      logger.info('🔄 Normalizando métodos de pago existentes...');
      
      // Obtener todos los métodos únicos de todas las colecciones
      const [salesMethods, expensesMethods, appointmentsMethods] = await Promise.all([
        Sale.distinct('paymentMethod'),
        Expense.distinct('paymentMethod'),
        Appointment.distinct('paymentMethod', { paymentMethod: { $exists: true, $ne: null } })
      ]);
      
      const allMethods = [...new Set([...salesMethods, ...expensesMethods, ...appointmentsMethods])]
        .filter(method => method && method !== 'null');
      
      logger.info(`📊 Métodos únicos encontrados: ${allMethods.join(', ')}`);
      
      let normalizedCount = 0;
      
      for (const method of allMethods) {
        const normalizedMethod = await PaymentMethod.normalizePaymentMethod(method);
        
        if (method !== normalizedMethod) {
          logger.info(`🔄 Normalizando: ${method} → ${normalizedMethod}`);
          
          // Actualizar en todas las colecciones
          await Promise.all([
            Sale.updateMany(
              { paymentMethod: method },
              { $set: { paymentMethod: normalizedMethod } }
            ),
            Expense.updateMany(
              { paymentMethod: method },
              { $set: { paymentMethod: normalizedMethod } }
            ),
            Appointment.updateMany(
              { paymentMethod: method },
              { $set: { paymentMethod: normalizedMethod } }
            )
          ]);
          
          normalizedCount++;
        }
      }
      
      // Normalizar valores nulos/undefined
      await Promise.all([
        Sale.updateMany(
          { paymentMethod: { $in: [null, undefined, 'null', 'undefined'] } },
          { $set: { paymentMethod: 'cash' } }
        ),
        Expense.updateMany(
          { paymentMethod: { $in: [null, undefined, 'null', 'undefined'] } },
          { $set: { paymentMethod: 'cash' } }
        ),
        Appointment.updateMany(
          { paymentMethod: { $in: [null, undefined, 'null', 'undefined'] } },
          { $set: { paymentMethod: 'cash' } }
        )
      ]);
      
      logger.info(`✅ Normalización completada. ${normalizedCount} métodos normalizados`);
      
      return { normalizedCount, totalMethods: allMethods.length };
    } catch (error) {
      logger.error('❌ Error en normalización:', error);
      throw new AppError('Error normalizando métodos de pago', 500);
    }
  }
}

/**
 * Use case: Validar método de pago
 */
export class ValidatePaymentMethod {
  static async execute(paymentMethod) {
    try {
      if (!paymentMethod || paymentMethod === 'null' || paymentMethod === 'undefined') {
        return false;
      }
      
      const method = await PaymentMethod.findByIdOrAlias(paymentMethod);
      return !!method;
    } catch (error) {
      logger.error('❌ Error validando método de pago:', error);
      return false;
    }
  }
}