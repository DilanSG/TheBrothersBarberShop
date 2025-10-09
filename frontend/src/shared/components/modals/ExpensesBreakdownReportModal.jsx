import React from 'react';
import { 
  X, 
  TrendingDown, 
  Calendar, 
  DollarSign,
  Tag,
  CreditCard,
  ArrowDownRight,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { differenceInCalendarMonths } from 'date-fns';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';
import { calculator as RecurringExpenseCalculator } from '../../recurring-expenses';

/**
 * Modal de desglose de gastos para la pestaña RESUMEN - Respeta filtros de tiempo
 * Aplica normalización mensual y multiplica por meses en el rango
 */
export const ExpensesBreakdownReportModal = ({ 
  isOpen, 
  onClose, 
  data, 
  expenses,
  recurringExpenses = [],
  formatCurrency, 
  dateRange,
  expenseCategories = [],
  paymentMethods = [],
  salesData = [] // Agregar datos de ventas
}) => {
  // Bloquear scroll del body usando hook personalizado
  useBodyScrollLock(isOpen);

  // Función para calcular la cantidad de meses en un rango de fechas
  const calculateMonthsInRange = (startDate, endDate) => {
    // Crear fechas locales para evitar problemas de zona horaria
    const startParts = startDate.split('-');
    const endParts = endDate.split('-');
    
    const start = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
    const end = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));
    
    // Calcular diferencia en meses completos
    const yearsDiff = end.getFullYear() - start.getFullYear();
    const monthsDiff = end.getMonth() - start.getMonth();
    const totalMonthsDiff = yearsDiff * 12 + monthsDiff;
    
    // Si es el mismo mes y año
    if (totalMonthsDiff === 0) {
      return 1; // Un mes completo, independientemente de los días
    }
    
    // Para múltiples meses, retornar la diferencia + 1
    // Ejemplo: Oct (mes 9) a Dic (mes 11) = diferencia 2, total 3 meses
    return totalMonthsDiff + 1;
  };

  // Helper para identificar tipos recurrentes en el nuevo esquema
  const isRecurringType = (type) => ['recurring', 'recurring-template', 'recurring-instance'].includes(type);
  
  // Función para formatear la frecuencia de gastos recurrentes
  const formatFrequency = (frequency) => {
    if (!frequency) return 'Recurrente';
    
    // Si frequency es un string, devolverlo directamente
    if (typeof frequency === 'string') return frequency;
    
    // Si frequency es un objeto {type, interval}
    if (typeof frequency === 'object' && frequency.type) {
      const { type, interval } = frequency;
      
      const frequencyMap = {
        'daily': interval > 1 ? `Cada ${interval} días` : 'Diario',
        'weekly': interval > 1 ? `Cada ${interval} semanas` : 'Semanal',
        'monthly': interval > 1 ? `Cada ${interval} meses` : 'Mensual',
        'yearly': interval > 1 ? `Cada ${interval} años` : 'Anual'
      };
      
      return frequencyMap[type] || 'Recurrente';
    }
    
    return 'Recurrente';
  };

  if (!isOpen) return null;

  const { summary } = data || {};
  
  console.log('🎯 [REPORT MODAL] Iniciando cálculos con filtros aplicados');
  console.log('📅 [REPORT MODAL] Rango de fechas:', dateRange);
  console.log('📊 [REPORT MODAL] Datos disponibles:', { daysWithData: summary?.daysWithData, oldestDataDate: summary?.oldestDataDate });
  
  // 🎯 LÓGICA CORRECTA: Usar la misma lógica que Reports.jsx para cálculo de meses
  const isGeneralFilter = dateRange?.preset === 'all' || dateRange?.preset === 'allData' || !dateRange?.preset;
  let monthsInRange = 1;
  
  // Variables para mostrar fechas correctas en la UI
  let displayStartDate = dateRange?.startDate;
  let displayEndDate = dateRange?.endDate;
  
  if (isGeneralFilter && summary?.daysWithData > 30) {
    // 🎯 LÓGICA INTELIGENTE: Usar daysWithData para cálculo más preciso
    const oldestDate = summary?.oldestDataDate;
    const daysWithData = summary?.daysWithData || 0;
    
    if (oldestDate && daysWithData > 0) {
      const startDate = new Date(oldestDate);
      const today = new Date();
      
      // Para filtros generales, mostrar las fechas reales de los datos
      displayStartDate = oldestDate;
      displayEndDate = today.toISOString().split('T')[0];
      
      // Calcular meses totales en el rango
      const totalMonthsInRange = differenceInCalendarMonths(today, startDate) + 1;
      
      // Calcular densidad de datos (qué porcentaje del tiempo hay datos reales)
      const totalDaysInRange = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));
      const dataDensity = daysWithData / totalDaysInRange;
      
      // Si la densidad es baja (<30%), usar estimación por días
      if (dataDensity < 0.3) {
        // Estimar meses equivalentes basado en días de actividad real
        monthsInRange = Math.max(1, Math.ceil(daysWithData / 22)); // ~22 días laborables por mes
        console.log(`📊 [REPORT MODAL] Filtro general (densidad baja ${(dataDensity*100).toFixed(1)}%): ${daysWithData} días ≈ ${monthsInRange} meses equivalentes`);
      } else {
        // Densidad alta, usar meses calendario completos
        monthsInRange = Math.max(1, totalMonthsInRange);
        console.log(`📊 [REPORT MODAL] Filtro general (densidad alta ${(dataDensity*100).toFixed(1)}%): desde ${oldestDate} hasta hoy = ${monthsInRange} meses`);
      }
    } else {
      // Respaldo: estimar desde daysWithData únicamente
      monthsInRange = Math.max(1, Math.ceil(summary.daysWithData / 22));
      console.log(`📊 [REPORT MODAL] Filtro general (solo daysWithData): ${summary.daysWithData} días ≈ ${monthsInRange} meses`);
    }
  } else if (dateRange) {
    // Filtro específico: usar rango de fechas exacto
    monthsInRange = calculateMonthsInRange(dateRange.startDate, dateRange.endDate);
    console.log(`📊 [REPORT MODAL] Filtro específico: ${dateRange.startDate} a ${dateRange.endDate} = ${monthsInRange} meses`);
  }
  
  console.log(`📊 [REPORT MODAL] Meses finales calculados: ${monthsInRange}`);
  
  let finalOneTimeTotal = 0;
  let finalRecurringTotal = 0;
  let expensesByCategory = {};
  
  // Gastos únicos (no cambian con el rango de tiempo)
  const allOneTimeExpenses = (expenses || []).filter(expense => expense.type === 'one-time');
  finalOneTimeTotal = allOneTimeExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  
  // Gastos recurrentes: normalizar a mensual y multiplicar por meses
  const recurringTemplates = Array.isArray(recurringExpenses) && recurringExpenses.length > 0
    ? recurringExpenses
    : [];
    
  const activeRecurringExpenses = recurringTemplates.filter(exp => 
    exp._isActive !== undefined 
      ? exp._isActive 
      : (exp.recurrence?.isActive ?? exp.recurringConfig?.isActive ?? exp.isActive ?? true)
  );
  
  // 🎯 CÁLCULO CLAVE: Normalizar a mensual y multiplicar por meses
  finalRecurringTotal = activeRecurringExpenses.reduce((sum, exp) => {
    try {
      const monthlyAmount = RecurringExpenseCalculator.calculateMonthlyAmount(exp);
      const totalForRange = monthlyAmount * monthsInRange;
      console.log(`💰 [REPORT MODAL] ${exp.description}: $${monthlyAmount.toLocaleString()}/mes × ${monthsInRange} meses = $${totalForRange.toLocaleString()}`);
      return sum + totalForRange;
    } catch (e) {
      console.warn('❌ Error calculando recurrente en modal de reporte:', exp.description, e.message);
      return sum;
    }
  }, 0);
  
  console.log('📋 [REPORT MODAL] Totales calculados:');
  console.log(`  - Gastos únicos: $${finalOneTimeTotal.toLocaleString()}`);
  console.log(`  - Gastos recurrentes (${monthsInRange} meses): $${finalRecurringTotal.toLocaleString()}`);
  console.log(`  - Total: $${(finalOneTimeTotal + finalRecurringTotal).toLocaleString()}`);
  
  // Procesar gastos one-time por categoría
  allOneTimeExpenses.forEach(expense => {
    const category = expense.category || 'sin-categoria';
    if (!expensesByCategory[category]) {
      expensesByCategory[category] = {
        total: 0,
        count: 0,
        expenses: [],
        oneTimeTotal: 0,
        recurringTotal: 0
      };
    }
    
    expensesByCategory[category].total += expense.amount || 0;
    expensesByCategory[category].oneTimeTotal += expense.amount || 0;
    expensesByCategory[category].count += 1;
    expensesByCategory[category].expenses.push({
      ...expense,
      displayType: 'one-time'
    });
  });
  
  // Procesar gastos recurrentes por categoría (con multiplicador de meses)
  activeRecurringExpenses.forEach(template => {
    const category = template.category || 'sin-categoria';
    if (!expensesByCategory[category]) {
      expensesByCategory[category] = {
        total: 0,
        count: 0,
        expenses: [],
        oneTimeTotal: 0,
        recurringTotal: 0
      };
    }
    
    const monthlyAmount = RecurringExpenseCalculator.calculateMonthlyAmount(template);
    const totalForRange = monthlyAmount * monthsInRange;
    
    expensesByCategory[category].total += totalForRange;
    expensesByCategory[category].recurringTotal += totalForRange;
    expensesByCategory[category].count += 1;
    expensesByCategory[category].expenses.push({
      ...template,
      displayType: 'recurring',
      projectedAmount: totalForRange,
      monthlyAmount: monthlyAmount,
      monthsApplied: monthsInRange,
      note: `Valor para ${monthsInRange} mes${monthsInRange !== 1 ? 'es' : ''}`
    });
  });

  // Calcular el total real basado en lo que calculó el modal
  const calculatedTotal = finalOneTimeTotal + finalRecurringTotal;

  // Convertir a array y ordenar por total
  const categoryBreakdown = Object.entries(expensesByCategory)
    .map(([category, data]) => ({
      category,
      ...data,
      percentage: calculatedTotal > 0 ? (data.total / calculatedTotal * 100) : 0
    }))
    .sort((a, b) => b.total - a.total);

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
      'other': 'Otros',
      'arriendo': 'Arriendo/Alquiler',
      'nomina': 'Salarios/Nómina'
    };
    return categoryMap[categoryId] || categoryId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Obtener icono de categoría
  const getCategoryIcon = (categoryId) => {
    const iconMap = {
      'rent': ArrowDownRight,
      'utilities': TrendingDown,
      'supplies': Tag,
      'equipment': AlertTriangle,
      'salaries': DollarSign,
      'marketing': Tag,
      'maintenance': AlertTriangle,
      'insurance': CreditCard,
      'taxes': DollarSign,
      'transport': Tag,
      'food': Tag,
      'training': Tag,
      'software': Tag,
      'other': Tag,
      'sin-categoria': Tag,
      'arriendo': ArrowDownRight,
      'nomina': DollarSign
    };
    return iconMap[categoryId] || Tag;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 sm:p-6 lg:p-8">
      <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-3xl mx-auto h-[90vh] sm:h-[85vh] lg:h-[80vh] flex flex-col">
        <div className="relative bg-red-500/5 backdrop-blur-md border border-red-500/20 rounded-2xl shadow-2xl shadow-red-500/20 h-full flex flex-col overflow-hidden">
          {/* Header fijo */}
          <div className="relative z-10 flex-shrink-0 p-4 sm:p-6 border-b border-red-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-red-500/20 border border-red-500/30">
                  <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    Desglose de Gastos - Resumen
                  </h3>
                  <p className="text-xs sm:text-sm text-red-300">
                    {displayStartDate && displayEndDate ? `${displayStartDate} - ${displayEndDate} (${monthsInRange} mes${monthsInRange !== 1 ? 'es' : ''})` : 'Período seleccionado'}
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

            {/* Resumen total */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-xs text-red-300 mb-1">Total gastos</p>
                <p className="text-xs sm:text-sm font-bold text-red-400">{formatCurrency(calculatedTotal)}</p>
              </div>
              <div className="p-2 sm:p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <div className="flex items-center gap-1 mb-1">
                  <RotateCcw className="w-3 h-3 text-orange-300" />
                  <p className="text-xs text-orange-300">Recurrentes</p>
                </div>
                <p className="text-xs sm:text-sm font-bold text-orange-400">{formatCurrency(finalRecurringTotal)}</p>
                <p className="text-xs text-orange-300/70">×{monthsInRange} mes{monthsInRange !== 1 ? 'es' : ''}</p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-300 mb-1">Una vez</p>
                <p className="text-xs sm:text-sm font-bold text-blue-400">{formatCurrency(finalOneTimeTotal)}</p>
              </div>
              <div className="p-2 sm:p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-xs text-gray-300 mb-1">Categorías</p>
                <p className="text-xs sm:text-sm font-bold text-white">{categoryBreakdown.length}</p>
              </div>
            </div>
          </div>

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-4 sm:px-6 pb-4 sm:pb-6">
            {categoryBreakdown.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
                  <TrendingDown className="w-8 h-8 text-red-400" />
                </div>
                <p className="text-gray-400">No hay gastos registrados en este período</p>
              </div>
            ) : (
              <div className="space-y-4 pt-4">
                {categoryBreakdown.map((categoryData, index) => {
                  const IconComponent = getCategoryIcon(categoryData.category);
                  const hasRecurring = categoryData.recurringTotal > 0;
                  const hasOneTime = categoryData.oneTimeTotal > 0;
                  
                  return (
                    <div key={index} className="space-y-3">
                      {/* Encabezado de categoría */}
                      <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl hover:scale-[1.02] transition-all duration-300">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30">
                              <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                            </div>
                            <div>
                              <h4 className="font-medium text-white text-sm sm:text-base">
                                {getCategoryName(categoryData.category)}
                              </h4>
                              <p className="text-xs text-gray-400">
                                {categoryData.count} gasto{categoryData.count !== 1 ? 's' : ''}
                                {hasRecurring && hasOneTime && ' (mixtos)'}
                                {hasRecurring && !hasOneTime && ' (recurrentes)'}
                                {hasOneTime && !hasRecurring && ' (únicos)'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-red-400">
                              {formatCurrency(categoryData.total)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {categoryData.percentage.toFixed(1)}% del total
                            </p>
                          </div>
                        </div>

                        {/* Barra de progreso */}
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-red-400"
                            style={{ width: `${Math.min(categoryData.percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Lista de gastos de la categoría */}
                      <div className="ml-4 space-y-2">
                        {categoryData.expenses.slice(0, 3).map((expense, expenseIndex) => {
                          const isRecurring = expense.displayType === 'recurring';
                          const displayAmount = isRecurring ? 
                            expense.projectedAmount : 
                            expense.amount;
                          
                          return (
                            <div key={expenseIndex} className={`p-3 border rounded-lg hover:scale-[1.01] transition-all duration-300 ${
                              isRecurring 
                                ? 'bg-orange-500/5 border-orange-500/10 hover:bg-orange-500/10' 
                                : 'bg-red-500/5 border-red-500/10 hover:bg-red-500/10'
                            }`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${
                                    isRecurring ? 'bg-orange-400' : 'bg-red-400'
                                  }`}></div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm text-white font-medium">
                                        {expense.description || 'Sin descripción'}
                                      </p>
                                      {isRecurring && (
                                        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-orange-500/20 border border-orange-500/40 rounded text-xs">
                                          <RotateCcw className="w-2.5 h-2.5 text-orange-300" />
                                          <span className="text-orange-300">
                                            {formatFrequency(expense.recurringConfig)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-400">
                                      {isRecurring && expense.monthlyAmount && expense.monthsApplied ? (
                                        <>
                                          <span className="text-orange-300">
                                            ${expense.monthlyAmount.toLocaleString()}/mes × {expense.monthsApplied} mes{expense.monthsApplied !== 1 ? 'es' : ''}
                                          </span>
                                        </>
                                      ) : (
                                        new Date(expense.date || Date.now()).toLocaleDateString('es-ES', {
                                          day: '2-digit',
                                          month: 'short',
                                          year: 'numeric'
                                        })
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className={`text-sm font-semibold ${
                                    isRecurring ? 'text-orange-400' : 'text-red-400'
                                  }`}>
                                    {formatCurrency(displayAmount)}
                                  </p>
                                  {isRecurring && (
                                    <p className="text-xs text-orange-300">
                                      para el período
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Mostrar enlace si hay más gastos */}
                        {categoryData.expenses.length > 3 && (
                          <div className="ml-4 px-3 py-2 text-xs text-gray-400 border-l border-gray-600">
                            +{categoryData.expenses.length - 3} gasto{categoryData.expenses.length - 3 !== 1 ? 's' : ''} más
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpensesBreakdownReportModal;