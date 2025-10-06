import React from 'react';
import { AlertTriangle, X, Trash2, Calendar, Repeat, DollarSign } from 'lucide-react';

const DeleteExpenseModal = ({ 
  isOpen, 
  onClose, 
  expense, 
  onDelete,
  isLoading = false 
}) => {
  const handleDelete = async () => {
    if (expense) {
      await onDelete(expense._id);
    }
  };

  if (!isOpen || !expense) return null;

  // Determinar si es gasto recurrente o único
  const isRecurring = expense.type === 'recurring' || expense.frequency;
  const expenseType = isRecurring ? 'recurrente' : 'único';

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'No especificada';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Formatear categoría
  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'Sin categoría';
    
    const categoryMap = {
      'rent': 'Arriendo/Alquiler',
      'utilities': 'Servicios Públicos',
      'supplies': 'Insumos/Materiales',
      'maintenance': 'Mantenimiento',
      'marketing': 'Marketing/Publicidad',
      'insurance': 'Seguros',
      'taxes': 'Impuestos',
      'salaries': 'Salarios/Pagos',
      'equipment': 'Equipamiento',
      'other': 'Otros'
    };
    
    // Asegurar que categoryId es una string
    const categoryStr = typeof categoryId === 'string' ? categoryId : String(categoryId);
    return categoryMap[categoryStr] || categoryStr || 'Sin categoría';
  };

  // Formatear frecuencia (copiado de RecurringExpensesListModal para consistencia)
  const getFrequencyName = (frequency) => {
    if (!frequency) return 'No definida';
    
    // Si frequency es un objeto con type e interval
    if (frequency && typeof frequency === 'object' && frequency.type) {
      const { type, interval = 1 } = frequency;
      const intervalText = interval > 1 ? ` ${interval}` : '';
      
      switch (type) {
        case 'daily':
          return `Cada${intervalText} día${interval > 1 ? 's' : ''}`;
        case 'weekly':
          return `Cada${intervalText} semana${interval > 1 ? 's' : ''}`;
        case 'monthly':
          return `Cada${intervalText} mes${interval > 1 ? 'es' : ''}`;
        case 'yearly':
          return `Cada${intervalText} año${interval > 1 ? 's' : ''}`;
        default:
          return 'Frecuencia personalizada';
      }
    }
    
    // Si frequency es un string simple (fallback)
    if (typeof frequency === 'string') {
      const frequencyMap = {
        'daily': 'Diario',
        'weekly': 'Semanal',
        'monthly': 'Mensual',
        'quarterly': 'Trimestral',
        'yearly': 'Anual'
      };
      return frequencyMap[frequency] || frequency;
    }
    
    return 'No especificada';
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[10003] p-4 sm:p-6 lg:p-8">
      <div className="relative w-full max-w-sm sm:max-w-md mx-auto h-[90vh] sm:h-[85vh] lg:h-[80vh] flex flex-col">
        <div className="relative bg-red-500/5 backdrop-blur-md border border-red-500/20 rounded-2xl shadow-2xl shadow-red-500/20 h-full flex flex-col overflow-hidden">
          {/* Header */}
          <div className="relative z-10 flex-shrink-0 p-4 sm:p-6 border-b border-red-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-red-500/20 border border-red-500/30">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    Eliminar Gasto {expenseType}
                  </h3>
                  <p className="text-xs sm:text-sm text-red-300">Esta acción no se puede deshacer</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-white transition-colors duration-200"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="mb-6">
              <p className="text-gray-300 mb-4">
                ¿Estás seguro de que deseas eliminar el gasto{' '}
                <span className="font-semibold text-white">"{expense.description}"</span>?
              </p>
              
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-200">
                    <p className="font-medium mb-2">Advertencia importante:</p>
                    <ul className="list-disc list-inside space-y-1 text-red-300">
                      <li>Se eliminará permanentemente de la base de datos</li>
                      <li>Los reportes financieros se actualizarán automáticamente</li>
                      {isRecurring && (
                        <>
                          <li>Se cancelarán todas las futuras ocurrencias programadas</li>
                          <li>El historial de pagos pasados se mantendrá intacto</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Expense Info */}
              <div className="bg-gray-700/50 backdrop-blur-sm rounded-xl p-4 border border-gray-600/20">
                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  Información del gasto:
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Descripción:</span>
                    <span className="text-white font-medium">{expense.description || 'Sin descripción'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Monto:</span>
                    <span className="text-green-400 font-bold">
                      ${(expense.amount || 0).toLocaleString('es-ES')}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Tipo:</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      isRecurring 
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}>
                      {isRecurring ? (
                        <>
                          <Repeat className="w-3 h-3" />
                          Recurrente
                        </>
                      ) : (
                        <>
                          <Calendar className="w-3 h-3" />
                          Único
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Categoría:</span>
                    <span className="text-white">{getCategoryName(expense.category)}</span>
                  </div>

                  {isRecurring && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Frecuencia:</span>
                        <span className="text-purple-300">{getFrequencyName(expense.frequency)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Estado:</span>
                        <span className={`${expense.isActive !== false ? 'text-green-400' : 'text-red-400'}`}>
                          {expense.isActive !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>

                      {expense.nextDate && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Próximo pago:</span>
                          <span className="text-blue-300">{formatDate(expense.nextDate)}</span>
                        </div>
                      )}
                    </>
                  )}

                  {!isRecurring && expense.date && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Fecha:</span>
                      <span className="text-blue-300">{formatDate(expense.date)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Buttons - Fixed bottom */}
          <div className="relative z-10 flex-shrink-0 p-4 sm:p-6 border-t border-red-500/20 bg-red-500/5">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-600/50 text-gray-300 rounded-xl hover:bg-gray-700/50 hover:border-gray-500/50 transition-all duration-300 disabled:opacity-50 backdrop-blur-sm font-medium text-sm sm:text-base"
              >
                Cancelar
              </button>
              
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-lg shadow-red-500/20 text-sm sm:text-base"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span className="hidden sm:inline">Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Eliminar {expenseType}</span>
                    <span className="sm:hidden">Eliminar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteExpenseModal;