import express from 'express';
import { body, query } from 'express-validator';
import { protect, adminAuth, barberAuth } from '../middleware/auth.js';
import expenseController from '../controllers/expenseController.js';

const router = express.Router();

// Validaciones para gastos
const expenseValidation = [
  body('description')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('La descripción debe tener entre 1 y 200 caracteres'),
  
  body('amount')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('El monto debe ser un número positivo'),
  
  body('category')
    .isIn([
      'rent', 'utilities', 'supplies', 'equipment', 'salaries',
      'marketing', 'maintenance', 'insurance', 'taxes', 'transport',
      'food', 'training', 'software', 'other'
    ])
    .withMessage('Categoría inválida'),
  
  body('paymentMethod')
    .isIn(['cash', 'debit', 'credit', 'transfer', 'check', 'digital'])
    .withMessage('Método de pago inválido'),
  
  body('date')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate()
    .withMessage('Formato de fecha inválido')
];

// Validaciones para gastos recurrentes
const recurringExpenseValidation = [
  ...expenseValidation,
  
  body('recurringConfig.frequency')
    .isIn(['daily', 'weekly', 'monthly', 'yearly'])
    .withMessage('Frecuencia inválida'),
  
  body('recurringConfig.interval')
    .isInt({ min: 1 })
    .withMessage('El intervalo debe ser un número entero positivo'),
  
  body('recurringConfig.endDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate()
    .withMessage('Formato de fecha fin inválido'),
  
  body('recurringConfig.dayOfWeek')
    .optional({ checkFalsy: true })
    .isInt({ min: 0, max: 6 })
    .withMessage('Día de la semana debe estar entre 0 y 6'),
  
  body('recurringConfig.dayOfMonth')
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 31 })
    .withMessage('Día del mes debe estar entre 1 y 31')
];

// Validaciones para consultas
const queryValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Formato de fecha inicio inválido'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Formato de fecha fin inválido'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero positivo'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe estar entre 1 y 100')
];

/**
 * @route   GET /api/v1/expenses
 * @desc    Obtener lista de gastos con filtros y paginación
 * @access  Private (Users, Barbers, Admins)
 */
router.get('/', 
  protect, 
  queryValidation,
  expenseController.getExpenses
);

/**
 * @route   GET /api/v1/expenses/recurring
 * @desc    Obtener lista de gastos recurrentes
 * @access  Private (Users, Barbers, Admins)
 */
router.get('/recurring', 
  protect,
  expenseController.getRecurringExpenses
);

/**
 * @route   GET /api/v1/expenses/summary
 * @desc    Obtener resumen de gastos para reportes
 * @access  Private (Users, Barbers, Admins)
 */
router.get('/summary',
  protect,
  query('startDate').isISO8601().withMessage('startDate es requerido y debe ser una fecha válida'),
  query('endDate').isISO8601().withMessage('endDate es requerido y debe ser una fecha válida'),
  expenseController.getExpenseSummary
);

/**
 * @route   GET /api/v1/expenses/categories
 * @desc    Obtener categorías de gastos con estadísticas opcionales
 * @access  Private (Users, Barbers, Admins)
 */
router.get('/categories',
  protect,
  expenseController.getExpenseCategories
);

/**
 * @route   POST /api/v1/expenses
 * @desc    Crear nuevo gasto único
 * @access  Private (Barbers, Admins)
 */
router.post('/',
  protect,
  expenseValidation,
  expenseController.createExpense
);

/**
 * @route   POST /api/v1/expenses/recurring
 * @desc    Crear nuevo gasto recurrente
 * @access  Private (Admins only)
 */
router.post('/recurring',
  protect,
  recurringExpenseValidation,
  expenseController.createRecurringExpense
);

/**
 * @route   PUT /api/v1/expenses/:id
 * @desc    Actualizar gasto existente
 * @access  Private (Owner or Admin)
 */
router.put('/:id',
  protect,
  expenseValidation,
  expenseController.updateExpense
);

/**
 * @route   PATCH /api/v1/expenses/recurring/:id/toggle
 * @desc    Activar/desactivar gasto recurrente
 * @access  Private (Owner or Admin)
 */
router.patch('/recurring/:id/toggle',
  protect,
  body('isActive').isBoolean().withMessage('isActive debe ser un valor booleano'),
  expenseController.toggleRecurringExpense
);

/**
 * @route   DELETE /api/v1/expenses/:id
 * @desc    Eliminar gasto
 * @access  Private (Owner or Admin)
 */
router.delete('/:id',
  protect,
  expenseController.deleteExpense
);

/**
 * @route   POST /api/v1/expenses/process-automatic
 * @desc    Procesar gastos recurrentes automáticamente
 * @access  Private (Admins only)
 */
router.post('/process-automatic',
  protect,
  expenseController.processAutomaticExpenses
);

export default router;