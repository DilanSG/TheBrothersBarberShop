import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { api } from '../../../shared/services/api';
import { RecurringExpenseHelper } from '../../../shared/recurring-expenses';

/**
 * Hook personalizado para trabajar con gastos recurrentes
 * 
 * Proporciona funciones para crear, actualizar, eliminar y gestionar gastos recurrentes,
 * así como para trabajar con sus ocurrencias y ajustes diarios.
 */
export const useRecurringExpenses = () => {
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [inferredRecurringTotal, setInferredRecurringTotal] = useState(0); // Total inferido (cuando no hay templates)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  /**
   * Cargar todos los gastos recurrentes
   */
  const loadRecurringExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
  // Forzar sin caché para evitar respuestas estancadas mientras diagnosticamos
  const response = await api.get('/expenses/recurring', { useCache: false, params: { _ts: Date.now() } });
      const payload = response.data;
      // 🔍 DEBUG: log crudo de la respuesta antes de normalizar
      try {
        console.log('🔍 useRecurringExpenses: payload bruto /expenses/recurring', {
          type: typeof payload,
          isArray: Array.isArray(payload),
          keys: payload && !Array.isArray(payload) ? Object.keys(payload) : undefined,
          length: Array.isArray(payload) ? payload.length : (Array.isArray(payload?.data) ? payload.data.length : undefined),
          hasDataArray: Array.isArray(payload?.data)
        });
      } catch (e) {
        console.warn('useRecurringExpenses: no se pudo inspeccionar payload crudo', e.message);
      }
      const migratedInline = payload?.meta?.migratedInlineCount || 0;
      let list = [];
      if (Array.isArray(payload)) list = payload; else if (Array.isArray(payload?.data)) list = payload.data; else if (Array.isArray(payload?.templates)) list = payload.templates; else if (Array.isArray(payload?.expenses)) list = payload.expenses; else list = [];
      // Asegurar que cada item tenga type consistente
      list = list.filter(Boolean).map(item => ({
        ...item,
        type: item.type || 'recurring-template',
        // Normalizar flag activo
        _isActive: (item.recurrence?.isActive !== undefined) ? item.recurrence.isActive : (item.recurringConfig?.isActive ?? item.isActive ?? true)
      }));
      if (list.length === 0) {
        // Lista recurrente vacía tras normalización
        if (migratedInline > 0) {
          console.log('🔁 Detectada migración inline de', migratedInline, 'registros. Reintentando fetch inmediato...');
          try {
            const second = await api.get('/expenses/recurring', { useCache: false, params: { _ts: Date.now() } });
            const secondPayload = second.data;
            let secondList = [];
            if (Array.isArray(secondPayload)) secondList = secondPayload; else if (Array.isArray(secondPayload?.data)) secondList = secondPayload.data; else if (Array.isArray(secondPayload?.templates)) secondList = secondPayload.templates; else if (Array.isArray(secondPayload?.expenses)) secondList = secondPayload.expenses; else secondList = [];
            secondList = secondList.filter(Boolean).map(item => ({
              ...item,
              type: item.type || 'recurring-template',
              _isActive: (item.recurrence?.isActive !== undefined) ? item.recurrence.isActive : (item.recurringConfig?.isActive ?? item.isActive ?? true)
            }));
            if (secondList.length > 0) {
              console.log('✅ Segundo intento cargó', secondList.length, 'gastos recurrentes tras migración inline');
              setRecurringExpenses(secondList);
              setInferredRecurringTotal(0);
              return; // Salir temprano, ya cargamos reales
            }
          } catch (re) {
            console.warn('No se pudo recargar tras migración inline', re.message);
          }
        }
      } else {
        console.log('✅ useRecurringExpenses: cargados', list.length, 'gastos recurrentes');
      }
      // Saneamos lista final eliminando elementos nulos/undefined accidentalmente introducidos
      const cleaned = list.filter(Boolean);
      if (cleaned.length !== list.length) {
        console.warn(`🧹 useRecurringExpenses: eliminados ${list.length - cleaned.length} elementos inválidos antes de setState`);
      }
      setRecurringExpenses(cleaned);

      // Si la lista está vacía intentar obtener el total inferido desde summary global
      if (list.length === 0) {
        try {
          // El endpoint /expenses/summary exige startDate y endDate -> usar último año como rango por defecto
          const today = new Date();
          const end = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
          const start = new Date(end);
          start.setUTCFullYear(start.getUTCFullYear() - 1); // 12 meses atrás
          const toISODate = d => d.toISOString().split('T')[0];
          const startISO = toISODate(start);
          const endISO = toISODate(end);
          if (!startISO || !endISO) {
            console.warn('useRecurringExpenses: fechas fallback inválidas para summary', { startISO, endISO });
            throw new Error('Rango de fechas inválido para summary');
          }
          // Fetch summary fallback
          const summaryResp = await api.get('/expenses/summary', { params: { startDate: startISO, endDate: endISO }, useCache: false });
          const summaryPayload = summaryResp.data || summaryResp; // compatibilidad si api devuelve directo
          const summaryData = summaryPayload?.data || summaryPayload?.summary || summaryPayload;
          // Campos posibles expuestos por useFinancialReports backend/hook
            const inferred = summaryData?.recurringExpensesTotal 
              || summaryData?.recurringExpensesInferred 
              || summaryData?.recurringExpensesRecalculated 
              || 0;
          setInferredRecurringTotal(inferred);
          if (inferred > 0) {
            // Usando total recurrente inferido
          }
        } catch (e) {
          // Silencioso: si falla no bloqueamos el flujo
          console.warn('No se pudo obtener summary para total recurrente inferido', e?.message);
        }
      } else {
        setInferredRecurringTotal(0);
      }
      
    } catch (err) {
      setError(err.message || 'Error al cargar gastos recurrentes');
      console.error('Error loading recurring expenses:', err);
      toast.error('No pudimos cargar los gastos recurrentes');
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Cargar gastos recurrentes al montar el componente
   */
  useEffect(() => {
    loadRecurringExpenses();
  }, [loadRecurringExpenses]);
  
  /**
   * Crear un nuevo gasto recurrente
   */
  const createRecurringExpense = async (expenseData) => {
    try {
      setLoading(true);
      
      // Si los datos incluyen el formato antiguo, convertir a formato nuevo
      if (expenseData.recurringConfig && !expenseData.recurrence) {
        expenseData.recurrence = RecurringExpenseHelper.convertLegacyFormat(expenseData.recurringConfig);
      }
      // 🔍 DEBUG creación
      console.log('🛰️ createRecurringExpense -> payload final a enviar', {
        keys: Object.keys(expenseData || {}),
        type: expenseData.type,
        hasRecurrence: !!expenseData.recurrence,
        recurrence: expenseData.recurrence
      });
      // Asegurar que se guarde como plantilla moderna
      expenseData.type = 'recurring-template';
      expenseData.isRecurring = true;
      
      const response = await api.post('/expenses/recurring', expenseData);
      console.log('✅ createRecurringExpense respuesta', response?.data);
      
      toast.success('Gasto recurrente creado con éxito');
      await loadRecurringExpenses();
      
      return response.data?.data;
      
    } catch (err) {
      console.error('Error creating recurring expense:', err);
      toast.error(err.response?.data?.message || 'Error al crear gasto recurrente');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Actualizar un gasto recurrente existente
   */
  const updateRecurringExpense = async (expenseId, expenseData) => {
    try {
      setLoading(true);
      
      // Si los datos incluyen el formato antiguo, convertir a formato nuevo
      if (expenseData.recurringConfig && !expenseData.recurrence) {
        expenseData.recurrence = RecurringExpenseHelper.convertLegacyFormat(expenseData.recurringConfig);
      }
      
      const response = await api.put(`/expenses/${expenseId}`, expenseData);
      
      toast.success('Gasto recurrente actualizado con éxito');
      
      // Actualizar localmente
      setRecurringExpenses(prev => 
        prev.map(exp => exp && exp._id === expenseId ? response.data?.data : exp).filter(Boolean)
      );
      
      return response.data?.data;
      
    } catch (err) {
      console.error('Error updating recurring expense:', err);
      toast.error(err.response?.data?.message || 'Error al actualizar gasto recurrente');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Eliminar un gasto recurrente
   */
  const deleteRecurringExpense = async (expenseId) => {
    try {
      setLoading(true);
      
      await api.delete(`/expenses/${expenseId}`);
      
      toast.success('Gasto recurrente eliminado con éxito');
      
      // Actualizar localmente
      setRecurringExpenses(prev => prev.filter(exp => exp._id !== expenseId));
      
      return true;
      
    } catch (err) {
      console.error('Error deleting recurring expense:', err);
      toast.error(err.response?.data?.message || 'Error al eliminar gasto recurrente');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Cambiar el estado de activación de un gasto recurrente
   */
  const toggleRecurringStatus = async (expenseId, isActive) => {
    try {
      setLoading(true);
      
      const response = await api.patch(`/expenses/recurring/${expenseId}/toggle`, { isActive });
      
      toast.success(`Gasto recurrente ${isActive ? 'activado' : 'desactivado'} con éxito`);
      
      // Actualizar localmente
      setRecurringExpenses(prev => 
        prev.map(exp => exp && exp._id === expenseId ? response.data?.data : exp).filter(Boolean)
      );
      
      return response.data?.data;
      
    } catch (err) {
      console.error('Error toggling recurring expense status:', err);
      toast.error(err.response?.data?.message || 'Error al cambiar estado del gasto');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Procesar gastos recurrentes (solo admin)
   */
  const processRecurringExpenses = async () => {
    try {
      setLoading(true);
      
      const response = await api.post('/expenses/process-automatic');
      
      toast.success(`Se procesaron ${response.data?.data?.created || 0} gastos recurrentes`);
      
      return response.data?.data;
      
    } catch (err) {
      console.error('Error processing recurring expenses:', err);
      toast.error(err.response?.data?.message || 'Error al procesar gastos recurrentes');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Obtener próximas ocurrencias de un gasto recurrente
   */
  const getNextOccurrences = async (expenseId, months = 6) => {
    try {
      const response = await api.get(`/expenses/${expenseId}/occurrences`, {
        params: { months }
      });
      
      return response.data?.data || [];
      
    } catch (err) {
      console.error('Error getting occurrences:', err);
      toast.error('No pudimos obtener las próximas ocurrencias');
      return [];
    }
  };
  
  /**
   * Obtener ajustes diarios de un gasto recurrente
   */
  const getDailyAdjustments = async (expenseId, yearMonth) => {
    try {
      const response = await api.get(`/expenses/${expenseId}/daily-adjustments`, {
        params: { yearMonth }
      });
      
      return response.data?.data || {};
      
    } catch (err) {
      console.error('Error getting daily adjustments:', err);
      toast.error('No pudimos obtener los ajustes diarios');
      return {};
    }
  };
  
  /**
   * Actualizar ajustes diarios de un gasto recurrente
   */
  const updateDailyAdjustments = async (expenseId, yearMonth, adjustments) => {
    try {
      setLoading(true);
      
      const response = await api.put(`/expenses/${expenseId}/daily-adjustments`, {
        yearMonth,
        adjustments
      });
      
      toast.success('Ajustes diarios actualizados con éxito');
      
      return response.data?.data;
      
    } catch (err) {
      console.error('Error updating daily adjustments:', err);
      toast.error(err.response?.data?.message || 'Error al actualizar ajustes diarios');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Calcular monto mensual estimado para un gasto recurrente
   */
  const calculateMonthlyAmount = (expense) => {
    if (!expense) return 0;
    
    // Esta función sería idealmente una llamada a la API
    // Por ahora, hacemos una estimación simple
    const baseAmount = expense.amount || 0;
    
    // Frecuencia basada en recurrence o recurringConfig
    let multiplier = 1;
    
    if (expense.recurrence?.pattern) {
      switch (expense.recurrence.pattern) {
        case 'daily':
          multiplier = 30; // ~30 días al mes
          break;
        case 'weekly':
          multiplier = 4.33; // ~4.33 semanas al mes
          break;
        case 'biweekly':
          multiplier = 2.17; // ~2.17 quincenas al mes
          break;
        case 'monthly':
          multiplier = 1;
          break;
        case 'yearly':
          multiplier = 1/12;
          break;
      }
    } else if (expense.recurringConfig?.frequency) {
      switch (expense.recurringConfig.frequency) {
        case 'daily':
          multiplier = 30;
          break;
        case 'weekly':
          multiplier = 4.33;
          break;
        case 'biweekly':
          multiplier = 2.17;
          break;
        case 'monthly':
          multiplier = 1;
          break;
        case 'yearly':
          multiplier = 1/12;
          break;
      }
    }
    
    // Aplicar intervalo
    const interval = (expense.recurrence?.interval || expense.recurringConfig?.interval || 1);
    
    return baseAmount * multiplier / interval;
  };
  
  return {
    recurringExpenses,
    inferredRecurringTotal,
    loading,
    error,
    loadRecurringExpenses,
    createRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    toggleRecurringStatus,
    processRecurringExpenses,
    getNextOccurrences,
    getDailyAdjustments,
    updateDailyAdjustments,
    calculateMonthlyAmount
  };
};

export default useRecurringExpenses;