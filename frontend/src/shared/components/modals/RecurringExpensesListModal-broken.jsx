import React, { useState } from 'react';
import { X, Repeat, TrendingDown, DollarSign, Tag, CreditCard, Calendar, Clock } from 'lucide-react';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';
import DailyRecurringExpenseModal from './DailyRecurringExpenseModal';

/**
 * Modal para mostrar solo gastos recurrentes
 */
export const RecurringExpensesListModal = ({ 
  isOpen, 
  onClose, 
  recurringExpenses,
  formatCurrency, 
  dateRange,
  onEdit,
  onDelete,
  onToggle,
  onRefresh // Nuevo prop para refrescar datos
}) => {
  // Bloquear scroll del body usando hook personalizado
  useBodyScrollLock(isOpen);
  
  // Estado para el modal de edición diaria
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  
  // Manejar clic en card para abrir edición diaria
  const handleCardClick = (expense) => {
    setSelectedExpense(expense);
    setShowDailyModal(true);
  };
  
  // Manejar cierre del modal diario
  const handleCloseDailyModal = () => {
    setShowDailyModal(false);
    setSelectedExpense(null);
  };

  // Calcular monto mensual con ajustes diarios
  const calculateMonthlyAmount = (expense) => {
    const currentMonth = new Date();
    const monthStr = currentMonth.getFullYear() + '-' + String(currentMonth.getMonth() + 1).padStart(2, '0');
    
    // Si no hay ajustes para el mes actual, devolver monto base
    if (!expense.recurringConfig?.dailyAdjustments || expense.recurringConfig?.adjustmentsMonth !== monthStr) {
      return expense.amount;
    }

    // Calcular monto diario base
    const config = expense.recurringConfig;
    let daysInCycle = 30; // default mensual
    
    switch (config.frequency) {
      case 'daily':
        daysInCycle = Math.max(1, config.interval || 1);
        break;
      case 'weekly':
        daysInCycle = Math.max(1, (config.interval || 1) * 7);
        break;
      case 'monthly':
        daysInCycle = 30;
        break;
      case 'yearly':
        daysInCycle = 365;
        break;
    }

    const baseDailyAmount = expense.amount / daysInCycle;
    
    // Generar días del mes actual
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let monthlyTotal = 0;
    const adjustments = expense.recurringConfig.dailyAdjustments || {};
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, '0');
      const adjustment = adjustments[dayStr]?.amount || 0;
      const dayAmount = Math.max(0, baseDailyAmount + adjustment);
      monthlyTotal += dayAmount;
    }
    
    return monthlyTotal;
  };
  
  if (!isOpen) return null;

  const activeExpenses = recurringExpenses.filter(expense => 
    expense.recurringConfig?.isActive ?? expense.isActive ?? true
  );
  const inactiveExpenses = recurringExpenses.filter(expense => 
    !(expense.recurringConfig?.isActive ?? expense.isActive ?? true)
  );

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

  const getFrequencyText = (recurringConfig) => {
    if (!recurringConfig) return 'No definida';
    
    // Soporte para estructura antigua y nueva
    const frequency = recurringConfig.frequency || recurringConfig.type || recurringConfig;
    const interval = recurringConfig.interval || 1;
    const intervalText = interval > 1 ? ` ${interval}` : '';
    
    switch (frequency) {
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
  };

  const ExpenseCard = ({ expense, isActive }) => {
    const monthlyAmount = calculateMonthlyAmount(expense);
    const hasAdjustments = monthlyAmount !== expense.amount;
    
    return (
      <div
        key={expense._id}
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
                {getFrequencyText(expense.recurringConfig || expense.frequency)}
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
              {formatCurrency(monthlyAmount)}
            </p>
            {hasAdjustments && (
              <p className="text-xs text-gray-500 line-through">
                {formatCurrency(expense.amount)}
              </p>
            )}
            <p className="text-xs text-gray-400">mensual</p>
          </div>
          
          <div className="flex gap-1">
            {onToggle && (
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Evitar que se abra el modal de edición
                  onToggle(expense._id, !(expense.recurringConfig?.isActive ?? expense.isActive ?? true));
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
              >
                Eliminar
              </button>
            )}
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
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    Gastos Recurrentes
                  </h3>
                  <p className="text-xs sm:text-sm text-purple-300">
                    Gestión de gastos automáticos y programados
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
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <p className="text-xs text-purple-300 mb-1">Total configurados</p>
                <p className="text-sm sm:text-base font-bold text-white">{recurringExpenses.length}</p>
              </div>
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-xs text-green-300 mb-1">Activos</p>
                <p className="text-sm sm:text-base font-bold text-green-400">{activeExpenses.length}</p>
              </div>
              <div className="p-3 bg-gray-500/10 border border-gray-500/30 rounded-lg">
                <p className="text-xs text-gray-300 mb-1">Inactivos</p>
                <p className="text-sm sm:text-base font-bold text-gray-400">{inactiveExpenses.length}</p>
              </div>
            </div>
          </div>

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-4 sm:px-6 pb-4 sm:pb-6">
            {recurringExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-4 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
                  <Repeat className="w-8 h-8 text-purple-400" />
                </div>
                <p className="text-gray-400">No hay gastos recurrentes configurados</p>
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
                        <ExpenseCard key={expense._id} expense={expense} isActive={expense.recurringConfig?.isActive ?? expense.isActive ?? true} />
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
                        <ExpenseCard key={expense._id} expense={expense} isActive={expense.recurringConfig?.isActive ?? expense.isActive ?? false} />
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
      />
    </div>
  );
};

export default RecurringExpensesListModal;