import React, { useState, useCallback } from 'react';
import { X, Repeat, Calendar, Edit2, Trash2, Play, Pause } from 'lucide-react';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';
import DailyRecurringExpenseModal from './DailyRecurringExpenseModal';
import { calculator as RecurringExpenseCalculator } from '../../recurring-expenses';

/**
 * Modal para listar y gestionar gastos recurrentes
 */
const RecurringExpensesListModal = ({ 
  isOpen, 
  onClose, 
  recurringExpenses,
  inferredRecurringTotal = 0,
  formatCurrency, 
  dateRange,
  onEdit,
  onDelete,
  onToggle,
  onRefresh // Nuevo prop para refrescar datos
}) => {
  // Bloquear scroll del body usando hook personalizado
  useBodyScrollLock(isOpen);
  
  // Estado para forzar actualización de cálculos
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Estado para el modal de edición diaria
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  
  // Manejar clic en card para abrir edición diaria
  const handleCardClick = (expense) => {
    setSelectedExpense(expense);
    setShowDailyModal(true);
  };
  
  // Manejar cierre del modal diario
  const handleCloseDailyModal = async () => {
    setShowDailyModal(false);
    setSelectedExpense(null);
    
    // Refrescar datos después de editar ajustes diarios
    if (onRefresh) {
      await onRefresh();
    }
  };

  // Callback para cuando se guarden ajustes diarios
  const handleDailySave = async (expenseId, adjustments, month) => {
    console.log('🔄 RecurringExpensesListModal: Datos actualizados, refrescando...', {
      expenseId,
      adjustments,
      month
    });
    
    // Refrescar los datos inmediatamente
    if (onRefresh) {
      await onRefresh();
    }
    
    // Forzar re-cálculo de los montos
    setRefreshTrigger(prev => prev + 1);
    
    // Cerrar el modal después de actualizar
    setShowDailyModal(false);
    setSelectedExpense(null);
  };

  // Calcular monto mensual con ajustes diarios usando el calculador normalizado
  const calculateMonthlyAmount = useCallback((expense) => {
    return RecurringExpenseCalculator.calculateMonthlyAmount(expense);
  }, [refreshTrigger]);

  // Calcular el monto mensual base sin ajustes (para mostrar como referencia)
  const calculateBaseMonthlyAmount = useCallback((expense) => {
    return RecurringExpenseCalculator.calculateBaseMonthlyAmount(expense);
  }, []);

  if (!isOpen) return null;

  // 🚨 Defensive Guard: Filter out invalid or nullish expense entries
  const validExpenses = Array.isArray(recurringExpenses)
    ? recurringExpenses.filter(e => e && typeof e === 'object')
    : [];

  // Separar gastos activos e inactivos
  const activeExpenses = validExpenses.filter(expense => {
    const flag = (expense.recurrence?.isActive !== undefined)
      ? expense.recurrence.isActive
      : (expense._isActive !== undefined
          ? expense._isActive
          : (expense.recurringConfig?.isActive ?? expense.isActive ?? true));
    return !!flag;
  });
  const inactiveExpenses = validExpenses.filter(expense => {
    const flag = (expense.recurrence?.isActive !== undefined)
      ? expense.recurrence.isActive
      : (expense._isActive !== undefined
          ? expense._isActive
          : (expense.recurringConfig?.isActive ?? expense.isActive ?? true));
    return !flag;
  });

  // Helpers
  const getCategoryName = (category) => {
    const categoryMap = {
      'rent': 'Arriendo',
      'utilities': 'Servicios',
      'supplies': 'Insumos',
      'equipment': 'Equipos',
      'salaries': 'Salarios',
      'marketing': 'Marketing',
      'maintenance': 'Mantenimiento',
      'insurance': 'Seguros',
      'taxes': 'Impuestos',
      'transport': 'Transporte',
      'food': 'Alimentación',
      'training': 'Capacitación',
      'software': 'Software',
      'other': 'Otros'
    };
    return categoryMap[category] || category;
  };

  const getPaymentMethodName = (method) => {
    const methodMap = {
      'cash': 'Efectivo',
      'debit': 'Débito',
      'credit': 'Crédito',
      'transfer': 'Transferencia',
      'check': 'Cheque',
      'digital': 'Digital',
      'bancolombia': 'Bancolombia'
    };
    return methodMap[method] || method;
  };

  const getFrequencyText = (expense) => {
    if (!expense) return 'No definida';
    
    // Usar el calculador normalizado para obtener la descripción correcta
    return RecurringExpenseCalculator.getFrequencyDescription(expense);
  };

  // Componente para renderizar cada tarjeta de gasto
  const ExpenseCard = ({ expense, isActive }) => {
    const monthlyAmount = calculateMonthlyAmount(expense);
    // El monto original está directamente en expense.amount
    const originalAmount = parseFloat(expense.amount) || 0;
    const baseMonthlyAmount = calculateBaseMonthlyAmount(expense);
    const hasAdjustments = Math.abs(monthlyAmount - baseMonthlyAmount) > 0.01;
    
    // DEBUG: Log del ExpenseCard
    // console.log(`💳 ExpenseCard para ${expense.description}:`, {
    //   monthlyAmount,
    //   baseMonthlyAmount,
    //   hasAdjustments,
    //   difference: monthlyAmount - baseMonthlyAmount
    // });
    
    return (
      <div
        onClick={() => handleCardClick(expense)}
        className={`group relative cursor-pointer ${isActive 
          ? 'bg-purple-500/5 border-purple-500/20 hover:bg-purple-500/15' 
          : 'bg-gray-500/5 border-gray-500/20 hover:bg-gray-500/15'
        } border rounded-xl p-4 transition-all duration-300`}
        title="Haz clic para editar día a día"
      >
        {/* Indicador de ajustes diarios */}
        {hasAdjustments && (
          <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" 
               title="Tiene ajustes diarios personalizados" />
        )}
        
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${isActive 
                ? 'bg-purple-500/20 border-purple-500/30' 
                : 'bg-gray-500/20 border-gray-500/30'
              } border`}>
                <Repeat className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-gray-400'}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-white text-sm sm:text-base">
                    {expense.description}
                  </h4>
                  <Calendar className="w-3 h-3 text-blue-400 opacity-60" title="Editable día a día" />
                </div>
                <p className={`text-xs ${isActive ? 'text-purple-300' : 'text-gray-400'}`}>
                  {getCategoryName(expense.category)}
                </p>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                isActive 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
              }`}>
                {isActive ? 'Activo' : 'Inactivo'}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-gray-400">Frecuencia:</span>
                <p className="text-white font-medium">
                  {getFrequencyText(expense)}
                </p>
              </div>
              <div>
                <span className="text-gray-400">Método de pago:</span>
                <p className="text-white font-medium">
                  {getPaymentMethodName(expense.paymentMethod)}
                </p>
              </div>
              {(expense.nextDate || expense.recurringConfig?.nextDate) && (
                <div>
                  <span className="text-gray-400">Próxima fecha:</span>
                  <p className="text-white font-medium">
                    {new Date(expense.nextDate || expense.recurringConfig?.nextDate).toLocaleDateString('es-ES')}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2 ml-4">
            <div className="text-right">
              <p className={`text-lg font-bold ${isActive ? 'text-purple-400' : 'text-gray-400'}`}>
                {formatCurrency(originalAmount)}
              </p>
              <p className="text-xs text-gray-500">
                Base: {formatCurrency(originalAmount)}
              </p>
              <p className={`text-xs mt-1 ${isActive ? 'text-purple-300' : 'text-gray-400'}`}>
                Mensual: {formatCurrency(monthlyAmount)}
              </p>
              <p className="text-xs text-gray-400">
                Por día: {formatCurrency(RecurringExpenseCalculator.calculateBaseDailyAmount(expense))}
              </p>
            </div>
            
            <div className="flex gap-1">
              {onToggle && (
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Evitar que se abra el modal de edición
                    const currentActive = (expense.recurrence?.isActive !== undefined)
                      ? expense.recurrence.isActive
                      : (expense._isActive !== undefined
                          ? expense._isActive
                          : (expense.recurringConfig?.isActive ?? expense.isActive ?? true));
                    onToggle(expense._id, !currentActive);
                  }}
                  className={`p-1.5 ${isActive 
                    ? 'bg-yellow-500/20 hover:bg-yellow-500/30 border-yellow-500/30 text-yellow-400' 
                    : 'bg-green-500/20 hover:bg-green-500/30 border-green-500/30 text-green-400'
                  } border rounded transition-colors text-xs`}
                  title={isActive ? 'Desactivar' : 'Activar'}
                >
                  {isActive ? 'Pausar' : 'Activar'}
                </button>
              )}
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Evitar que se abra el modal de edición
                    onEdit(expense);
                  }}
                  className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded text-blue-400 transition-colors text-xs"
                >
                  Editar
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Evitar que se abra el modal de edición
                    onDelete(expense._id);
                  }}
                  className="p-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded text-red-400 transition-colors text-xs"
                  title="Eliminar gasto"
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[10000] p-4 sm:p-6 lg:p-8">
      <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-5xl mx-auto h-[90vh] sm:h-[85vh] lg:h-[80vh] flex flex-col">
        <div className="relative bg-purple-500/5 backdrop-blur-md border border-purple-500/20 rounded-2xl shadow-2xl shadow-purple-500/20 h-full flex flex-col overflow-hidden">
          
          {/* Header fijo */}
          <div className="relative z-10 flex-shrink-0 p-4 sm:p-6 border-b border-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                  <Repeat className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                    Gastos Recurrentes
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400">
                    Gestiona tus gastos automáticos - Haz clic en cualquier card para editar día a día
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-lg bg-gray-800/80 border border-gray-600/30 text-gray-400 hover:text-white hover:bg-gray-700/80 transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-2 sm:p-3">
                <p className="text-xs text-gray-400 flex items-center gap-1">Total {recurringExpenses.length === 0 && inferredRecurringTotal > 0 && (<span className="px-1.5 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded-full text-[10px] text-purple-300" title="Conteo sintético mientras solo existe monto inferido">inferido</span>)}</p>
                <p className="text-sm sm:text-lg font-bold text-purple-400">
                  {recurringExpenses.length || (inferredRecurringTotal > 0 ? 1 : 0)}
                </p>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 sm:p-3">
                <p className="text-xs text-gray-400">Activos</p>
                <p className="text-sm sm:text-lg font-bold text-green-400">
                  {activeExpenses.length || (recurringExpenses.length === 0 && inferredRecurringTotal > 0 ? 1 : 0)}
                </p>
              </div>
              <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-2 sm:p-3">
                <p className="text-xs text-gray-400">Inactivos</p>
                <p className="text-sm sm:text-lg font-bold text-gray-400">
                  {inactiveExpenses.length}
                </p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 sm:p-3 col-span-2">
                <p className="text-xs text-gray-400">Valor Total {recurringExpenses.length === 0 && inferredRecurringTotal > 0 && (<span className="ml-1 px-1.5 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded-full text-[10px] text-blue-300" title="Monto inferido (diferencia entre total de gastos y gastos únicos)">inferido</span>)}</p>
                <p className="text-sm sm:text-lg font-bold text-blue-400">
                  {recurringExpenses.length > 0 ? (
                    formatCurrency(
                      activeExpenses.reduce((sum, expense) => sum + calculateMonthlyAmount(expense), 0)
                    )
                  ) : (
                    formatCurrency(inferredRecurringTotal)
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-4 sm:px-6 pb-4 sm:pb-6">
            {recurringExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                <div className="p-4 rounded-full bg-purple-500/10 border border-purple-500/20">
                  <Repeat className="w-8 h-8 text-purple-400" />
                </div>
                <p className="text-gray-400">No hay gastos recurrentes configurados</p>
                <p className="text-xs text-gray-500 max-w-sm mb-4">
                  Si el tablero muestra gastos totales mayores a los únicos, el sistema infirió un componente recurrente a partir de la diferencia. Registra o migra tus plantillas para ver el detalle aquí.
                </p>
                {inferredRecurringTotal > 0 && (
                  <div className="mt-2 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl w-full max-w-sm text-left">
                    <p className="text-xs text-gray-400 mb-1">Total recurrente inferido</p>
                    <p className="text-lg font-bold text-purple-300">{formatCurrency(inferredRecurringTotal)}</p>
                    <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                      Este monto proviene de la diferencia entre el total de gastos y la suma de los gastos únicos registrados en el período. Una vez registres plantillas recurrentes reales, sustituiremos esta cifra por el desglose exacto por plantilla.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6 pt-4">
                {/* Gastos Activos */}
                {activeExpenses.length > 0 && (
                  <div>
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Gastos Activos ({activeExpenses.length})
                    </h4>
                    <div className="space-y-3">
                      {activeExpenses.map((expense) => (
                        <ExpenseCard key={expense._id} expense={expense} isActive={true} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Gastos Inactivos */}
                {inactiveExpenses.length > 0 && (
                  <div>
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      Gastos Inactivos ({inactiveExpenses.length})
                    </h4>
                    <div className="space-y-3">
                      {inactiveExpenses.map((expense) => (
                        <ExpenseCard key={expense._id} expense={expense} isActive={false} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal de edición diaria */}
      <DailyRecurringExpenseModal
        isOpen={showDailyModal}
        onClose={handleCloseDailyModal}
        expense={selectedExpense}
        formatCurrency={formatCurrency}
        onSave={handleDailySave}
      />
    </div>
  );
};

export default RecurringExpensesListModal;