/**
 * Expense Repository Implementation
 * Implementación concreta del repositorio de gastos usando Mongoose
 */

import IExpenseRepository from '../../../core/domain/repositories/IExpenseRepository.js';
import Expense from '../../../core/domain/entities/Expense.js';
import { logger } from '../../../shared/utils/logger.js';
import { AppError } from '../../../shared/utils/errors.js';

class ExpenseRepositoryImpl extends IExpenseRepository {
  /**
   * Buscar gasto por ID
   * @param {string} id - ID del gasto
   * @returns {Promise<Expense|null>}
   */
  async findById(id) {
    try {
      logger.database(`Searching expense by ID: ${id}`);
      const expense = await Expense.findById(id)
        .populate('paymentMethod', 'name type')
        .populate('createdBy', 'name email');
      
      if (expense) {
        logger.database(`Expense found: ${expense._id}`);
      }
      
      return expense;
    } catch (error) {
      logger.error(`Error finding expense by ID ${id}:`, error);
      throw new AppError(`Error al buscar gasto: ${error.message}`, 500);
    }
  }

  /**
   * Crear nuevo gasto
   * @param {Object} expenseData - Datos del gasto
   * @returns {Promise<Expense>}
   */
  async create(expenseData) {
    try {
      logger.database('Creating new expense');
      const expense = await Expense.create(expenseData);
      logger.database(`Expense created successfully: ${expense._id}`);
      
      // Retornar con populate
      return await this.findById(expense._id);
    } catch (error) {
      logger.error('Error creating expense:', error);
      throw new AppError(`Error al crear gasto: ${error.message}`, 500);
    }
  }

  /**
   * Actualizar gasto existente
   * @param {string} id - ID del gasto
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Expense>}
   */
  async update(id, updateData) {
    try {
      logger.database(`Updating expense: ${id}`);
      
      const expense = await Expense.findByIdAndUpdate(
        id,
        updateData,
        { 
          new: true, 
          runValidators: true 
        }
      ).populate('paymentMethod', 'name type')
       .populate('createdBy', 'name email');

      if (!expense) {
        throw new AppError('Gasto no encontrado', 404);
      }

      logger.database(`Expense updated successfully: ${id}`);
      return expense;
    } catch (error) {
      logger.error(`Error updating expense ${id}:`, error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError(`Error al actualizar gasto: ${error.message}`, 500);
    }
  }

  /**
   * Eliminar gasto
   * @param {string} id - ID del gasto
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    try {
      logger.database(`Deleting expense: ${id}`);
      const result = await Expense.findByIdAndDelete(id);
      
      if (!result) {
        throw new AppError('Gasto no encontrado', 404);
      }

      logger.database(`Expense deleted successfully: ${id}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting expense ${id}:`, error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError(`Error al eliminar gasto: ${error.message}`, 500);
    }
  }

  /**
   * Buscar gastos por rango de fechas
   * @param {Date} startDate - Fecha de inicio
   * @param {Date} endDate - Fecha de fin
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Expense[]>}
   */
  async findByDateRange(startDate, endDate, options = {}) {
    try {
      const { sort = { date: -1 }, filters = {} } = options;
      
      logger.database(`Searching expenses by date range: ${startDate} to ${endDate}`);
      
      const query = {
        date: {
          $gte: startDate,
          $lte: endDate
        },
        ...filters
      };
      
      const expenses = await Expense.find(query)
        .populate('paymentMethod', 'name type')
        .populate('createdBy', 'name email')
        .sort(sort);
      
      logger.database(`Found ${expenses.length} expenses in date range`);
      return expenses;
    } catch (error) {
      logger.error(`Error finding expenses by date range:`, error);
      throw new AppError(`Error al buscar gastos por rango de fechas: ${error.message}`, 500);
    }
  }

  /**
   * Buscar gastos por categoría
   * @param {string} category - Categoría del gasto
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Expense[]>}
   */
  async findByCategory(category, options = {}) {
    try {
      const { sort = { date: -1 }, limit } = options;
      
      logger.database(`Searching expenses by category: ${category}`);
      
      let query = Expense.find({ category })
        .populate('paymentMethod', 'name type')
        .populate('createdBy', 'name email')
        .sort(sort);
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const expenses = await query;
      logger.database(`Found ${expenses.length} expenses for category ${category}`);
      
      return expenses;
    } catch (error) {
      logger.error(`Error finding expenses by category ${category}:`, error);
      throw new AppError(`Error al buscar gastos por categoría: ${error.message}`, 500);
    }
  }

  /**
   * Buscar gastos recurrentes
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Expense[]>}
   */
  async findRecurring(options = {}) {
    try {
      const { sort = { date: -1 } } = options;
      
      logger.database('Searching recurring expenses');
      
      const expenses = await Expense.find({ 
        isRecurring: true 
      })
        .populate('paymentMethod', 'name type')
        .populate('createdBy', 'name email')
        .sort(sort);
      
      logger.database(`Found ${expenses.length} recurring expenses`);
      return expenses;
    } catch (error) {
      logger.error('Error finding recurring expenses:', error);
      throw new AppError(`Error al buscar gastos recurrentes: ${error.message}`, 500);
    }
  }

  /**
   * Buscar gastos no recurrentes
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Expense[]>}
   */
  async findNonRecurring(options = {}) {
    try {
      const { sort = { date: -1 } } = options;
      
      logger.database('Searching non-recurring expenses');
      
      const expenses = await Expense.find({ 
        $or: [
          { isRecurring: false },
          { isRecurring: { $exists: false } }
        ]
      })
        .populate('paymentMethod', 'name type')
        .populate('createdBy', 'name email')
        .sort(sort);
      
      logger.database(`Found ${expenses.length} non-recurring expenses`);
      return expenses;
    } catch (error) {
      logger.error('Error finding non-recurring expenses:', error);
      throw new AppError(`Error al buscar gastos no recurrentes: ${error.message}`, 500);
    }
  }

  /**
   * Calcular total de gastos por período
   * @param {Date} startDate - Fecha de inicio
   * @param {Date} endDate - Fecha de fin
   * @param {Object} filters - Filtros adicionales
   * @returns {Promise<number>}
   */
  async calculateTotalByPeriod(startDate, endDate, filters = {}) {
    try {
      logger.database(`Calculating total expenses from ${startDate} to ${endDate}`);
      
      const query = {
        date: {
          $gte: startDate,
          $lte: endDate
        },
        ...filters
      };
      
      const result = await Expense.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);
      
      const total = result.length > 0 ? result[0].total : 0;
      logger.database(`Total expenses calculated: ${total}`);
      
      return total;
    } catch (error) {
      logger.error('Error calculating total expenses:', error);
      throw new AppError(`Error al calcular total de gastos: ${error.message}`, 500);
    }
  }

  /**
   * Obtener estadísticas de gastos
   * @param {Date} startDate - Fecha de inicio
   * @param {Date} endDate - Fecha de fin
   * @returns {Promise<Object>}
   */
  async getExpenseStats(startDate, endDate) {
    try {
      logger.database(`Getting expense stats from ${startDate} to ${endDate}`);
      
      const [totalStats, categoryStats, recurringStats] = await Promise.all([
        // Total general
        Expense.aggregate([
          {
            $match: {
              date: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
              count: { $sum: 1 },
              avgAmount: { $avg: '$amount' }
            }
          }
        ]),
        // Por categoría
        Expense.aggregate([
          {
            $match: {
              date: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: '$category',
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          },
          { $sort: { total: -1 } }
        ]),
        // Recurrentes vs no recurrentes
        Expense.aggregate([
          {
            $match: {
              date: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: { $ifNull: ['$isRecurring', false] },
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ])
      ]);
      
      const stats = {
        total: totalStats[0]?.total || 0,
        count: totalStats[0]?.count || 0,
        average: totalStats[0]?.avgAmount || 0,
        byCategory: categoryStats,
        recurring: recurringStats.find(r => r._id === true) || { total: 0, count: 0 },
        nonRecurring: recurringStats.find(r => r._id === false) || { total: 0, count: 0 }
      };
      
      logger.database('Expense stats calculated successfully');
      return stats;
    } catch (error) {
      logger.error('Error getting expense stats:', error);
      throw new AppError(`Error al obtener estadísticas de gastos: ${error.message}`, 500);
    }
  }

  /**
   * Listar todos los gastos con paginación y filtros
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<{expenses: Expense[], total: number, page: number, totalPages: number}>}
   */
  async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = { date: -1 },
        filters = {}
      } = options;

      logger.database(`Listing expenses - Page: ${page}, Limit: ${limit}`);

      const skip = (page - 1) * limit;
      
      // Ejecutar consultas en paralelo
      const [expenses, total] = await Promise.all([
        Expense.find(filters)
          .populate('paymentMethod', 'name type')
          .populate('createdBy', 'name email')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Expense.countDocuments(filters)
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.database(`Found ${expenses.length} expenses out of ${total} total`);

      return {
        expenses,
        total,
        page: Number(page),
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      };
    } catch (error) {
      logger.error('Error listing expenses:', error);
      throw new AppError(`Error al listar gastos: ${error.message}`, 500);
    }
  }

  /**
   * Buscar gastos por método de pago
   * @param {string} paymentMethodId - ID del método de pago
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Expense[]>}
   */
  async findByPaymentMethod(paymentMethodId, options = {}) {
    try {
      const { sort = { date: -1 }, limit } = options;
      
      logger.database(`Searching expenses by payment method: ${paymentMethodId}`);
      
      let query = Expense.find({ paymentMethod: paymentMethodId })
        .populate('paymentMethod', 'name type')
        .populate('createdBy', 'name email')
        .sort(sort);
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const expenses = await query;
      logger.database(`Found ${expenses.length} expenses for payment method ${paymentMethodId}`);
      
      return expenses;
    } catch (error) {
      logger.error(`Error finding expenses by payment method ${paymentMethodId}:`, error);
      throw new AppError(`Error al buscar gastos por método de pago: ${error.message}`, 500);
    }
  }
}

export default ExpenseRepositoryImpl;