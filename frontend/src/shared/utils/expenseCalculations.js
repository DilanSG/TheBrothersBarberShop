// ===================================
// 🧮 CÁLCULOS DE GASTOS PARA REPORTES
// ===================================
// Esta función extrae la lógica de cálculo exacta del modal ExpensesBreakdownReportModal
// para usar en dashboard cards y garantizar consistencia de datos

import { calculator as RecurringExpenseCalculator } from '../recurring-expenses';

/**
 * Calcula la cantidad de meses en un rango de fechas
 * @param {string} startDate - Fecha de inicio en formato YYYY-MM-DD
 * @param {string} endDate - Fecha de fin en formato YYYY-MM-DD
 * @returns {number} Número de meses completos en el rango
 */
export const calculateMonthsInRange = (startDate, endDate) => {
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

/**
 * Calcula totales de gastos exactamente como en ExpensesBreakdownReportModal
 * @param {Array} expenses - Array de gastos únicos
 * @param {Array} recurringExpenses - Array de gastos recurrentes
 * @param {Object} dateRange - Objeto con startDate y endDate
 * @param {Object} summary - Objeto con metadatos de fechas (opcional)
 * @returns {Object} Objeto con totales calculados
 */
export const calculateExpenseTotals = (
  expenses = [], 
  recurringExpenses = [], 
  dateRange = null, 
  summary = null
) => {
  console.log('🧮 [EXPENSE CALCULATOR] Iniciando cálculo de totales');
  
  let monthsInRange = 1;
  
  // Determinar meses en rango exactamente como en el modal
  if (!dateRange) {
    // Filtro general - usar lógica de densidad del modal
    if (summary?.oldestExpenseDate && summary?.newestExpenseDate) {
      const totalMonthsInRange = calculateMonthsInRange(summary.oldestExpenseDate, summary.newestExpenseDate);
      if (summary.daysWithData && summary.totalDaysInRange) {
        const dataDensity = summary.daysWithData / summary.totalDaysInRange;
        if (dataDensity > 0.5) {
          monthsInRange = Math.max(1, totalMonthsInRange);
          console.log(`🧮 [EXPENSE CALCULATOR] Filtro general (densidad alta ${(dataDensity*100).toFixed(1)}%): desde ${summary.oldestExpenseDate} hasta hoy = ${monthsInRange} meses`);
        } else {
          monthsInRange = Math.max(1, Math.ceil(summary.daysWithData / 22));
          console.log(`🧮 [EXPENSE CALCULATOR] Filtro general (densidad baja): ${summary.daysWithData} días ≈ ${monthsInRange} meses`);
        }
      } else {
        monthsInRange = Math.max(1, totalMonthsInRange);
        console.log(`🧮 [EXPENSE CALCULATOR] Filtro general (densidad alta): desde ${summary.oldestExpenseDate} hasta hoy = ${monthsInRange} meses`);
      }
    } else {
      // Respaldo: estimar desde daysWithData únicamente
      monthsInRange = Math.max(1, Math.ceil((summary?.daysWithData || 30) / 22));
      console.log(`🧮 [EXPENSE CALCULATOR] Filtro general (solo daysWithData): ${summary?.daysWithData || 30} días ≈ ${monthsInRange} meses`);
    }
  } else if (dateRange) {
    // Filtro específico: usar rango de fechas exacto
    monthsInRange = calculateMonthsInRange(dateRange.startDate, dateRange.endDate);
    console.log(`🧮 [EXPENSE CALCULATOR] Filtro específico: ${dateRange.startDate} a ${dateRange.endDate} = ${monthsInRange} meses`);
  }
  
  console.log(`🧮 [EXPENSE CALCULATOR] Meses finales calculados: ${monthsInRange}`);
  
  let finalOneTimeTotal = 0;
  let finalRecurringTotal = 0;
  
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
      console.log(`💰 [EXPENSE CALCULATOR] ${exp.description}: $${monthlyAmount.toLocaleString()}/mes × ${monthsInRange} meses = $${totalForRange.toLocaleString()}`);
      return sum + totalForRange;
    } catch (e) {
      console.warn('❌ Error calculando recurrente:', exp.description, e.message);
      return sum;
    }
  }, 0);
  
  const calculatedTotal = finalOneTimeTotal + finalRecurringTotal;
  
  console.log('📋 [EXPENSE CALCULATOR] Totales calculados:');
  console.log(`  - Gastos únicos: $${finalOneTimeTotal.toLocaleString()}`);
  console.log(`  - Gastos recurrentes (${monthsInRange} meses): $${finalRecurringTotal.toLocaleString()}`);
  console.log(`  - Total: $${calculatedTotal.toLocaleString()}`);
  
  return {
    oneTimeTotal: finalOneTimeTotal,
    recurringTotal: finalRecurringTotal,
    calculatedTotal,
    monthsInRange,
    activeRecurringCount: activeRecurringExpenses.length,
    oneTimeCount: allOneTimeExpenses.length
  };
};

/**
 * Función simplificada para dashboard cards
 * @param {Array} expenses - Array de gastos únicos
 * @param {Array} recurringExpenses - Array de gastos recurrentes
 * @param {Object} summary - Metadatos de fechas
 * @param {Object} dateRange - Rango de fechas actual (con startDate, endDate, preset)
 * @returns {number} Total calculado
 */
export const calculateDashboardExpenseTotal = (expenses, recurringExpenses, summary, dateRange = null) => {
  const { calculatedTotal } = calculateExpenseTotals(expenses, recurringExpenses, dateRange, summary);
  return calculatedTotal;
};