import mongoose from 'mongoose';

/**
 * Esquema de gastos con soporte para gastos únicos y recurrentes
 */
const expenseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'La descripción es requerida'],
    trim: true,
    maxlength: [200, 'La descripción no puede exceder 200 caracteres']
  },
  
  amount: {
    type: Number,
    required: [true, 'El monto es requerido'],
    min: [0, 'El monto debe ser positivo']
  },
  
  category: {
    type: String,
    required: [true, 'La categoría es requerida'],
    enum: [
      'rent', 'utilities', 'supplies', 'equipment', 'salaries',
      'marketing', 'maintenance', 'insurance', 'taxes', 'transport',
      'food', 'training', 'software', 'other'
    ]
  },
  
  paymentMethod: {
    type: String,
    required: [true, 'El método de pago es requerido'],
    enum: ['cash', 'debit', 'credit', 'transfer', 'check', 'digital']
  },
  
  date: {
    type: Date,
    required: [true, 'La fecha es requerida'],
    default: Date.now
  },
  
  type: {
    type: String,
    enum: ['one-time', 'recurring'],
    default: 'one-time'
  },
  
  // Configuración para gastos recurrentes
  recurringConfig: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      default: 'monthly'
    },
    
    interval: {
      type: Number,
      default: 1,
      min: [1, 'El intervalo debe ser al menos 1']
    },
    
    endDate: {
      type: Date,
      default: null
    },
    
    // Para fechas específicas (ej: día 1 y 15 de cada mes)
    specificDates: [{
      type: Number,
      min: 1,
      max: 31
    }],
    
    // Para frecuencia semanal (0 = Domingo, 6 = Sábado)
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
      default: null
    },
    
    // Para frecuencia mensual (1-31)
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31,
      default: null
    },
    
    isActive: {
      type: Boolean,
      default: true
    },
    
    lastProcessed: {
      type: Date,
      default: null
    }
  },
  
  // Referencia al gasto recurrente padre (para gastos generados automáticamente)
  parentRecurringExpense: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expense',
    default: null
  },
  
  // Usuario que registra el gasto
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Notas adicionales
  notes: {
    type: String,
    maxlength: [500, 'Las notas no pueden exceder 500 caracteres']
  }

}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      // Formatear fechas para respuesta
      if (ret.date) {
        ret.date = ret.date.toISOString().split('T')[0];
      }
      if (ret.recurringConfig?.endDate) {
        ret.recurringConfig.endDate = ret.recurringConfig.endDate.toISOString().split('T')[0];
      }
      if (ret.recurringConfig?.lastProcessed) {
        ret.recurringConfig.lastProcessed = ret.recurringConfig.lastProcessed.toISOString().split('T')[0];
      }
      return ret;
    }
  }
});

// Índices para optimizar consultas
expenseSchema.index({ date: -1 });
expenseSchema.index({ type: 1, 'recurringConfig.isActive': 1 });
expenseSchema.index({ category: 1, date: -1 });
expenseSchema.index({ createdBy: 1, date: -1 });
expenseSchema.index({ 'recurringConfig.frequency': 1, 'recurringConfig.isActive': 1 });

// Método estático para obtener resumen de gastos
expenseSchema.statics.getExpenseSummary = async function(startDate, endDate, filters = {}) {
  const pipeline = [
    {
      $match: {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate + 'T23:59:59.999Z')
        },
        type: 'one-time', // Solo gastos únicos para el resumen
        ...filters
      }
    },
    {
      $group: {
        _id: null,
        totalExpenses: { $sum: '$amount' },
        totalCount: { $sum: 1 },
        categories: {
          $push: {
            category: '$category',
            amount: '$amount'
          }
        },
        paymentMethods: {
          $push: {
            method: '$paymentMethod',
            amount: '$amount'
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalExpenses: 1,
        totalCount: 1,
        categoryBreakdown: {
          $arrayToObject: {
            $map: {
              input: {
                $setUnion: {
                  $map: {
                    input: '$categories',
                    as: 'cat',
                    in: '$$cat.category'
                  }
                }
              },
              as: 'category',
              in: {
                k: '$$category',
                v: {
                  $sum: {
                    $map: {
                      input: {
                        $filter: {
                          input: '$categories',
                          cond: { $eq: ['$$this.category', '$$category'] }
                        }
                      },
                      as: 'filtered',
                      in: '$$filtered.amount'
                    }
                  }
                }
              }
            }
          }
        },
        paymentMethodBreakdown: {
          $arrayToObject: {
            $map: {
              input: {
                $setUnion: {
                  $map: {
                    input: '$paymentMethods',
                    as: 'pm',
                    in: '$$pm.method'
                  }
                }
              },
              as: 'method',
              in: {
                k: '$$method',
                v: {
                  $sum: {
                    $map: {
                      input: {
                        $filter: {
                          input: '$paymentMethods',
                          cond: { $eq: ['$$this.method', '$$method'] }
                        }
                      },
                      as: 'filtered',
                      in: '$$filtered.amount'
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalExpenses: 0,
    totalCount: 0,
    categoryBreakdown: {},
    paymentMethodBreakdown: {}
  };
};

// Método estático para procesar gastos recurrentes automáticamente
expenseSchema.statics.processRecurringExpenses = async function() {
  const today = new Date();
  const recurringExpenses = await this.find({
    type: 'recurring',
    'recurringConfig.isActive': true,
    $or: [
      { 'recurringConfig.endDate': null },
      { 'recurringConfig.endDate': { $gte: today } }
    ]
  });

  let processedCount = 0;
  const errors = [];

  for (const recurringExpense of recurringExpenses) {
    try {
      const config = recurringExpense.recurringConfig;
      const lastProcessed = config.lastProcessed || recurringExpense.date;
      const nextDate = calculateNextDate(lastProcessed, config);

      // Si la próxima fecha ya pasó, crear el gasto
      if (nextDate <= today) {
        await this.create({
          description: recurringExpense.description,
          amount: recurringExpense.amount,
          category: recurringExpense.category,
          paymentMethod: recurringExpense.paymentMethod,
          date: nextDate,
          type: 'one-time',
          parentRecurringExpense: recurringExpense._id,
          createdBy: recurringExpense.createdBy,
          notes: `Gasto automático generado de: ${recurringExpense.description}`
        });

        // Actualizar la fecha de último procesamiento
        recurringExpense.recurringConfig.lastProcessed = nextDate;
        await recurringExpense.save();

        processedCount++;
      }
    } catch (error) {
      errors.push({
        expenseId: recurringExpense._id,
        error: error.message
      });
    }
  }

  return {
    processed: processedCount,
    errors
  };
};

// Función auxiliar para calcular la próxima fecha de un gasto recurrente
function calculateNextDate(lastDate, config) {
  const date = new Date(lastDate);
  
  switch (config.frequency) {
    case 'daily':
      date.setDate(date.getDate() + config.interval);
      break;
      
    case 'weekly':
      date.setDate(date.getDate() + (config.interval * 7));
      break;
      
    case 'monthly':
      date.setMonth(date.getMonth() + config.interval);
      if (config.dayOfMonth && config.dayOfMonth <= 31) {
        date.setDate(config.dayOfMonth);
      }
      break;
      
    case 'yearly':
      date.setFullYear(date.getFullYear() + config.interval);
      break;
      
    default:
      throw new Error(`Frecuencia no válida: ${config.frequency}`);
  }
  
  return date;
}

// Middleware para validar configuración de gastos recurrentes
expenseSchema.pre('save', function(next) {
  if (this.type === 'recurring') {
    const config = this.recurringConfig;
    
    // Validaciones específicas para frecuencia semanal
    if (config.frequency === 'weekly' && (config.dayOfWeek === null || config.dayOfWeek === undefined)) {
      return next(new Error('dayOfWeek es requerido para frecuencia semanal'));
    }
    
    // Validaciones específicas para frecuencia mensual
    if (config.frequency === 'monthly' && !config.dayOfMonth) {
      return next(new Error('dayOfMonth es requerido para frecuencia mensual'));
    }
  }
  
  next();
});

// Método para obtener la próxima fecha de ejecución
expenseSchema.methods.getNextExecutionDate = function() {
  if (this.type !== 'recurring') {
    return null;
  }
  
  const lastProcessed = this.recurringConfig.lastProcessed || this.date;
  return calculateNextDate(lastProcessed, this.recurringConfig);
};

export default mongoose.model('Expense', expenseSchema);