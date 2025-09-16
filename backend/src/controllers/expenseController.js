import Expense from '../models/Expense.js';
import { validationResult } from 'express-validator';
import moment from 'moment-timezone';

const TIMEZONE = 'America/Bogota';

/**
 * Controlador para manejo de gastos
 */
class ExpenseController {
  
  /**
   * Obtener lista de gastos con filtros
   */
  async getExpenses(req, res) {
    try {
      const { 
        startDate, 
        endDate, 
        category, 
        paymentMethod, 
        type = 'one-time',
        page = 1, 
        limit = 50 
      } = req.query;

      // Construir filtros
      const filters = {
        type,
        createdBy: req.user.role === 'admin' ? undefined : req.user.id
      };

      // Filtro por fechas
      if (startDate || endDate) {
        filters.date = {};
        if (startDate) {
          filters.date.$gte = moment.tz(startDate, TIMEZONE).startOf('day').toDate();
        }
        if (endDate) {
          filters.date.$lte = moment.tz(endDate, TIMEZONE).endOf('day').toDate();
        }
      }

      // Filtros adicionales
      if (category) filters.category = category;
      if (paymentMethod) filters.paymentMethod = paymentMethod;

      // Remover campos undefined
      Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

      // Paginación
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Consulta principal
      const expenses = await Expense.find(filters)
        .populate('createdBy', 'name email')
        .populate('parentRecurringExpense', 'description')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Conteo total
      const total = await Expense.countDocuments(filters);

      res.json({
        success: true,
        data: expenses,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / parseInt(limit)),
          count: expenses.length,
          totalRecords: total
        }
      });

    } catch (error) {
      console.error('Error getting expenses:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener gastos',
        error: error.message
      });
    }
  }

  /**
   * Obtener gastos recurrentes
   */
  async getRecurringExpenses(req, res) {
    try {
      const filters = {
        type: 'recurring',
        createdBy: req.user.role === 'admin' ? undefined : req.user.id
      };

      Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

      const recurringExpenses = await Expense.find(filters)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: recurringExpenses
      });

    } catch (error) {
      console.error('Error getting recurring expenses:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener gastos recurrentes',
        error: error.message
      });
    }
  }

  /**
   * Crear gasto único
   */
  async createExpense(req, res) {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { description, amount, category, paymentMethod, date, notes } = req.body;

      // Crear el gasto
      const expense = new Expense({
        description: description.trim(),
        amount: parseFloat(amount),
        category,
        paymentMethod,
        date: moment.tz(date, TIMEZONE).toDate(),
        type: 'one-time',
        createdBy: req.user.id,
        notes: notes?.trim()
      });

      const savedExpense = await expense.save();
      
      // Populate para respuesta
      await savedExpense.populate('createdBy', 'name email');

      res.status(201).json({
        success: true,
        message: 'Gasto creado exitosamente',
        data: savedExpense
      });

    } catch (error) {
      console.error('Error creating expense:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear gasto',
        error: error.message
      });
    }
  }

  /**
   * Crear gasto recurrente
   */
  async createRecurringExpense(req, res) {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      const { 
        description, 
        amount, 
        category, 
        paymentMethod, 
        recurringConfig,
        notes 
      } = req.body;

      // Crear el gasto recurrente
      const expense = new Expense({
        description: description.trim(),
        amount: parseFloat(amount),
        category,
        paymentMethod,
        date: new Date(),
        type: 'recurring',
        recurringConfig: {
          frequency: recurringConfig.frequency,
          interval: parseInt(recurringConfig.interval),
          endDate: recurringConfig.endDate && recurringConfig.endDate !== '' ? 
            moment.tz(recurringConfig.endDate, TIMEZONE).toDate() : null,
          specificDates: recurringConfig.specificDates || [],
          dayOfWeek: recurringConfig.dayOfWeek !== null && recurringConfig.dayOfWeek !== '' ? 
            parseInt(recurringConfig.dayOfWeek) : null,
          dayOfMonth: recurringConfig.dayOfMonth && recurringConfig.dayOfMonth !== '' ? 
            parseInt(recurringConfig.dayOfMonth) : null,
          isActive: true
        },
        createdBy: req.user.id,
        notes: notes?.trim()
      });

      const savedExpense = await expense.save();
      
      // Populate para respuesta
      await savedExpense.populate('createdBy', 'name email');

      res.status(201).json({
        success: true,
        message: 'Gasto recurrente creado exitosamente',
        data: savedExpense
      });

    } catch (error) {
      console.error('Error creating recurring expense:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear gasto recurrente',
        error: error.message
      });
    }
  }

  /**
   * Actualizar gasto
   */
  async updateExpense(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array()
        });
      }

      // Buscar el gasto
      const expense = await Expense.findById(id);
      if (!expense) {
        return res.status(404).json({
          success: false,
          message: 'Gasto no encontrado'
        });
      }

      // Verificar permisos
      if (req.user.role !== 'admin' && expense.createdBy.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para editar este gasto'
        });
      }

      // Actualizar campos permitidos
      const allowedUpdates = ['description', 'amount', 'category', 'paymentMethod', 'date', 'notes', 'recurringConfig'];
      allowedUpdates.forEach(field => {
        if (updates[field] !== undefined) {
          if (field === 'date') {
            expense[field] = moment.tz(updates[field], TIMEZONE).toDate();
          } else if (field === 'amount') {
            expense[field] = parseFloat(updates[field]);
          } else {
            expense[field] = updates[field];
          }
        }
      });

      const updatedExpense = await expense.save();
      await updatedExpense.populate('createdBy', 'name email');

      res.json({
        success: true,
        message: 'Gasto actualizado exitosamente',
        data: updatedExpense
      });

    } catch (error) {
      console.error('Error updating expense:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar gasto',
        error: error.message
      });
    }
  }

  /**
   * Eliminar gasto
   */
  async deleteExpense(req, res) {
    try {
      const { id } = req.params;

      // Buscar el gasto
      const expense = await Expense.findById(id);
      if (!expense) {
        return res.status(404).json({
          success: false,
          message: 'Gasto no encontrado'
        });
      }

      // Verificar permisos
      if (req.user.role !== 'admin' && expense.createdBy.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para eliminar este gasto'
        });
      }

      await Expense.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Gasto eliminado exitosamente'
      });

    } catch (error) {
      console.error('Error deleting expense:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar gasto',
        error: error.message
      });
    }
  }

  /**
   * Activar/desactivar gasto recurrente
   */
  async toggleRecurringExpense(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      // Buscar el gasto recurrente
      const expense = await Expense.findById(id);
      if (!expense || expense.type !== 'recurring') {
        return res.status(404).json({
          success: false,
          message: 'Gasto recurrente no encontrado'
        });
      }

      // Verificar permisos
      if (req.user.role !== 'admin' && expense.createdBy.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para modificar este gasto'
        });
      }

      // Actualizar estado
      expense.recurringConfig.isActive = Boolean(isActive);
      const updatedExpense = await expense.save();

      res.json({
        success: true,
        message: `Gasto recurrente ${isActive ? 'activado' : 'desactivado'} exitosamente`,
        data: updatedExpense
      });

    } catch (error) {
      console.error('Error toggling recurring expense:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cambiar estado del gasto recurrente',
        error: error.message
      });
    }
  }

  /**
   * Procesar gastos automáticos pendientes
   */
  async processAutomaticExpenses(req, res) {
    try {
      // Solo admins pueden ejecutar este proceso
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Solo los administradores pueden procesar gastos automáticos'
        });
      }

      const result = await Expense.processRecurringExpenses();

      res.json({
        success: true,
        message: `Procesados ${result.processed} gastos automáticos`,
        data: result
      });

    } catch (error) {
      console.error('Error processing automatic expenses:', error);
      res.status(500).json({
        success: false,
        message: 'Error al procesar gastos automáticos',
        error: error.message
      });
    }
  }

  /**
   * Obtener resumen de gastos para reportes financieros
   */
  async getExpenseSummary(req, res) {
    try {
      const { startDate, endDate, category, paymentMethod } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'startDate y endDate son requeridos'
        });
      }

      // Construir filtros
      const filters = {};
      if (category) filters.category = category;
      if (paymentMethod) filters.paymentMethod = paymentMethod;

      // Solo incluir gastos del usuario si no es admin
      if (req.user.role !== 'admin') {
        filters.createdBy = req.user.id;
      }

      const summary = await Expense.getExpenseSummary(startDate, endDate, filters);

      // Obtener breakdown diario
      const dailyBreakdown = await Expense.aggregate([
        {
          $match: {
            date: {
              $gte: moment.tz(startDate, TIMEZONE).startOf('day').toDate(),
              $lte: moment.tz(endDate, TIMEZONE).endOf('day').toDate()
            },
            type: 'one-time',
            ...filters
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$date',
                timezone: TIMEZONE
              }
            },
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      res.json({
        success: true,
        data: {
          summary,
          breakdown: dailyBreakdown.map(item => ({
            date: item._id,
            totalAmount: item.totalAmount,
            count: item.count
          }))
        }
      });

    } catch (error) {
      console.error('Error getting expense summary:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener resumen de gastos',
        error: error.message
      });
    }
  }

  /**
   * Obtener categorías de gastos con estadísticas
   */
  async getExpenseCategories(req, res) {
    try {
      const { startDate, endDate } = req.query;

      // Categorías predefinidas con iconos
      const categories = [
        { value: 'rent', label: 'Arriendo/Alquiler', icon: '🏠' },
        { value: 'utilities', label: 'Servicios Públicos', icon: '⚡' },
        { value: 'supplies', label: 'Insumos/Materiales', icon: '📦' },
        { value: 'equipment', label: 'Equipos/Herramientas', icon: '✂️' },
        { value: 'salaries', label: 'Salarios/Nómina', icon: '👥' },
        { value: 'marketing', label: 'Marketing/Publicidad', icon: '📢' },
        { value: 'maintenance', label: 'Mantenimiento', icon: '🔧' },
        { value: 'insurance', label: 'Seguros', icon: '🛡️' },
        { value: 'taxes', label: 'Impuestos/Tributos', icon: '📊' },
        { value: 'transport', label: 'Transporte', icon: '🚗' },
        { value: 'food', label: 'Alimentación', icon: '🍔' },
        { value: 'training', label: 'Capacitación', icon: '📚' },
        { value: 'software', label: 'Software/Licencias', icon: '💻' },
        { value: 'other', label: 'Otros', icon: '📝' }
      ];

      // Si se proporcionan fechas, obtener estadísticas
      if (startDate && endDate) {
        const stats = await Expense.aggregate([
          {
            $match: {
              date: {
                $gte: moment.tz(startDate, TIMEZONE).startOf('day').toDate(),
                $lte: moment.tz(endDate, TIMEZONE).endOf('day').toDate()
              },
              type: 'one-time'
            }
          },
          {
            $group: {
              _id: '$category',
              totalAmount: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ]);

        // Combinar categorías con estadísticas
        const categoriesWithStats = categories.map(category => {
          const stat = stats.find(s => s._id === category.value);
          return {
            ...category,
            totalAmount: stat?.totalAmount || 0,
            count: stat?.count || 0
          };
        });

        res.json({
          success: true,
          data: categoriesWithStats
        });
      } else {
        res.json({
          success: true,
          data: categories
        });
      }

    } catch (error) {
      console.error('Error getting expense categories:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener categorías de gastos',
        error: error.message
      });
    }
  }
}

export default new ExpenseController();