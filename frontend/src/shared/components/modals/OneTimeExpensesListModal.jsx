import React from 'react';
import { X, Calendar, TrendingDown, DollarSign, Tag, CreditCard } from 'lucide-react';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

/**
 * Modal para mostrar solo gastos únicos (one-time)
 */
export const OneTimeExpensesListModal = ({ 
  isOpen, 
  onClose, 
  expenses,
  formatCurrency, 
  dateRange,
  onEdit,
  onDelete
}) => {
  // Bloquear scroll del body usando hook personalizado
  useBodyScrollLock(isOpen);
  
  if (!isOpen) return null;

  // Filtrar solo gastos únicos
  const oneTimeExpenses = expenses.filter(expense => expense.type === 'one-time');
  const totalAmount = oneTimeExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

  // Obtener nombre de categoría legible
  const getCategoryName = (categoryId) => {
    const categoryMap = {
      'rent': 'Arriendo/Alquiler',
      'utilities': 'Servicios Públicos',
      'supplies': 'Insumos/Materiales',
      'equipment': 'Equipos/Herramientas',
      'salaries': 'Salarios/Nómina',
      'marketing': 'Marketing/Publicidad',
      'maintenance': 'Mantenimiento',
      'insurance': 'Seguros',
      'taxes': 'Impuestos/Tributos',
      'transport': 'Transporte',
      'food': 'Alimentación',
      'training': 'Capacitación',
      'software': 'Software/Licencias',
      'other': 'Otros'
    };
    return categoryMap[categoryId] || categoryId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getPaymentMethodName = (method) => {
    const methodMap = {
      'cash': 'Efectivo',
      'debit': 'Débito',
      'credit': 'Crédito',
      'transfer': 'Transferencia',
      'check': 'Cheque',
      'digital': 'Digital'
    };
    return methodMap[method] || method;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 sm:p-6 lg:p-8">
      <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-4xl mx-auto h-[90vh] sm:h-[85vh] lg:h-[80vh] flex flex-col">
        <div className="relative bg-green-500/5 backdrop-blur-md border border-green-500/20 rounded-2xl shadow-2xl shadow-green-500/20 h-full flex flex-col overflow-hidden">
          
          {/* Header fijo */}
          <div className="relative z-10 flex-shrink-0 p-4 sm:p-6 border-b border-green-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/20 border border-green-500/30">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    Gastos Únicos
                  </h3>
                  <p className="text-xs sm:text-sm text-green-300">
                    {dateRange ? `${dateRange.startDate} - ${dateRange.endDate}` : 'Período seleccionado'}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-white transition-colors duration-200"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-xs text-green-300 mb-1">Total gastos únicos</p>
                <p className="text-sm sm:text-base font-bold text-green-400">{formatCurrency(totalAmount)}</p>
              </div>
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-xs text-green-300 mb-1">Número de gastos</p>
                <p className="text-sm sm:text-base font-bold text-white">{oneTimeExpenses.length}</p>
              </div>
            </div>
          </div>

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-4 sm:px-6 pb-4 sm:pb-6">
            {oneTimeExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-4 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
                  <Calendar className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-gray-400">No hay gastos únicos registrados en este período</p>
              </div>
            ) : (
              <div className="space-y-3 pt-4">
                {oneTimeExpenses.map((expense) => (
                  <div
                    key={expense._id}
                    className="group relative bg-green-500/5 border border-green-500/20 rounded-xl p-4 hover:bg-green-500/10 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/30">
                            <Calendar className="w-4 h-4 text-green-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-white text-sm sm:text-base">
                              {expense.description}
                            </h4>
                            <p className="text-xs text-green-300">
                              {getCategoryName(expense.category)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-gray-400">Fecha:</span>
                            <p className="text-white font-medium">
                              {new Date(expense.date).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-400">Método de pago:</span>
                            <p className="text-white font-medium">
                              {getPaymentMethodName(expense.paymentMethod)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <p className="text-lg font-bold text-green-400">
                          {formatCurrency(expense.amount)}
                        </p>
                        
                        {(onEdit || onDelete) && (
                          <div className="flex gap-1">
                            {onEdit && (
                              <button
                                onClick={() => onEdit(expense)}
                                className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded text-blue-400 transition-colors text-xs"
                              >
                                Editar
                              </button>
                            )}
                            {onDelete && (
                              <button
                                onClick={() => onDelete(expense._id)}
                                className="p-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded text-red-400 transition-colors text-xs"
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OneTimeExpensesListModal;