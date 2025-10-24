import React, { useState, useEffect } from 'react';
import { format, parseISO, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, ChevronRight, AlertCircle, Check, Edit3, Trash2 } from 'lucide-react';
import { RecurringExpenseHelper } from '@shared/recurring-expenses';

/**
 * Componente para mostrar detalles de un gasto recurrente
 * incluida la proyección de ocurrencias futuras
 */
const RecurringExpenseDetails = ({ expense, onEdit, onDelete, onToggleStatus }) => {
  const [nextOccurrences, setNextOccurrences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showProjection, setShowProjection] = useState(false);

  // Determinar si es recurrente
  const isRecurringExpense = RecurringExpenseHelper.isRecurring(expense);

  // Cargar próximas ocurrencias cuando se muestra la proyección
  useEffect(() => {
    if (showProjection && isRecurringExpense) {
      fetchNextOccurrences();
    }
  }, [showProjection, expense?._id]);

  // Función para obtener próximas ocurrencias
  const fetchNextOccurrences = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simular llamada a API (en una implementación real, esto sería una llamada al backend)
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generar próximas 6 ocurrencias para demostración
      // En una implementación real, estas vendrían del backend
      const today = new Date();
      const occurrences = [];
      let currentDate = new Date(today);

      for (let i = 0; i < 6; i++) {
        currentDate = addMonths(currentDate, 1);
        const day = expense?.recurrence?.config?.monthDays?.[0] || 
                  expense?.recurringConfig?.dayOfMonth || 
                  1;
                  
        const occurrenceDate = new Date(
          currentDate.getFullYear(), 
          currentDate.getMonth(), 
          day
        );
        
        occurrences.push({
          date: occurrenceDate,
          amount: expense.amount,
          projected: true
        });
      }

      setNextOccurrences(occurrences);
    } catch (err) {
      console.error("Error fetching occurrences:", err);
      setError("No pudimos cargar las próximas ocurrencias");
    } finally {
      setLoading(false);
    }
  };

  // Si no hay gasto o no es recurrente, no mostrar nada
  if (!expense) {
    return null;
  }

  // Determinar estado de activación
  const isActive = expense?.recurrence?.isActive || expense?.recurringConfig?.isActive;

  // Descripción de recurrencia
  const recurrenceDescription = RecurringExpenseHelper.getRecurrenceDescription(expense);

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4 shadow-lg">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{expense.description}</h3>
          <p className="text-gray-300 text-sm">
            {expense.category}
          </p>
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <button 
              onClick={() => onEdit(expense)}
              className="p-1 rounded hover:bg-gray-700"
              title="Editar gasto"
            >
              <Edit3 size={16} className="text-blue-400" />
            </button>
          )}
          {onDelete && (
            <button 
              onClick={() => onDelete(expense)}
              className="p-1 rounded hover:bg-gray-700"
              title="Eliminar gasto"
            >
              <Trash2 size={16} className="text-red-400" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-gray-700 p-2 rounded">
          <span className="text-xs text-gray-400">Monto</span>
          <p className="font-semibold text-white">
            {RecurringExpenseHelper.formatCurrency(expense.amount)}
          </p>
        </div>
        <div className="bg-gray-700 p-2 rounded">
          <span className="text-xs text-gray-400">Estado</span>
          <div className="flex items-center mt-1">
            <span className={`w-2 h-2 rounded-full mr-2 ${isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <p className="font-semibold text-white">{isActive ? 'Activo' : 'Inactivo'}</p>
          </div>
        </div>
      </div>

      {isRecurringExpense && (
        <div className="bg-gray-700 p-3 rounded-lg mb-3">
          <div className="flex items-start gap-2 mb-2">
            <Calendar size={18} className="text-blue-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-white">Patrón de recurrencia</h4>
              <p className="text-sm text-gray-300">{recurrenceDescription}</p>
            </div>
          </div>

          {expense.recurrence?.startDate && (
            <div className="flex items-center gap-2 text-sm text-gray-300 mt-2">
              <span className="text-gray-400">Inicio:</span>
              <span>{RecurringExpenseHelper.formatDate(expense.recurrence.startDate)}</span>
            </div>
          )}

          {expense.recurrence?.endDate && (
            <div className="flex items-center gap-2 text-sm text-gray-300 mt-1">
              <span className="text-gray-400">Fin:</span>
              <span>{RecurringExpenseHelper.formatDate(expense.recurrence.endDate)}</span>
            </div>
          )}

          {onToggleStatus && (
            <button
              onClick={() => onToggleStatus(expense._id, !isActive)}
              className={`mt-3 text-xs py-1 px-3 rounded-full ${
                isActive ? 'bg-red-900/50 text-red-300 hover:bg-red-800/50' : 'bg-green-900/50 text-green-300 hover:bg-green-800/50'
              }`}
            >
              {isActive ? 'Desactivar' : 'Activar'}
            </button>
          )}
        </div>
      )}

      {isRecurringExpense && (
        <div>
          <button
            onClick={() => setShowProjection(!showProjection)}
            className="flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors mb-2"
          >
            <ChevronRight
              size={16}
              className={`transition-transform ${showProjection ? 'rotate-90' : ''}`}
            />
            <span>
              {showProjection ? 'Ocultar proyección' : 'Ver próximas ocurrencias'}
            </span>
          </button>

          {showProjection && (
            <div className="px-2 py-2">
              {loading ? (
                <p className="text-sm text-gray-400">Cargando proyección...</p>
              ) : error ? (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {nextOccurrences.length === 0 ? (
                    <p className="text-sm text-gray-400">No hay próximas ocurrencias</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {nextOccurrences.map((occurrence, index) => (
                        <div 
                          key={index} 
                          className="bg-gray-700/50 p-2 rounded text-sm"
                        >
                          <div className="text-gray-300">
                            {RecurringExpenseHelper.formatDate(occurrence.date, 'MMM d, yyyy')}
                          </div>
                          <div className="font-medium text-white">
                            {RecurringExpenseHelper.formatCurrency(occurrence.amount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecurringExpenseDetails;