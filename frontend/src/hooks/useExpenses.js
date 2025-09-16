import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

/**
 * Hook para gestión completa de gastos
 * Maneja gastos únicos, recurrentes, automáticos y validaciones
 */
export const useExpenses = () => {
  // Estados principales
  const [expenses, setExpenses] = useState([]);
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados para formularios
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    category: '',
    paymentMethod: '',
    date: new Date().toISOString().split('T')[0],
    type: 'one-time', // 'one-time', 'recurring'
    isRecurring: false,
    recurringConfig: {
      frequency: 'monthly', // 'daily', 'weekly', 'monthly', 'yearly'
      interval: 1, // cada X frecuencias
      endDate: null,
      specificDates: [], // Para fechas específicas (ej: día 1 y 15 de cada mes)
      dayOfWeek: null, // Para frecuencia semanal
      dayOfMonth: null, // Para frecuencia mensual
      isActive: true
    }
  });

  // Categorías predefinidas
  const expenseCategories = [
    { value: 'rent', label: 'Arriendo/Alquiler', icon: '🏠' },
    { value: 'utilities', label: 'Servicios Públicos', icon: '⚡' },
    { value: 'supplies', label: 'Insumos/Materiales', icon: '📦' },
    { value: 'equipment', label: 'Equipos/Herramientas', icon: '✂️' },
    { value: 'salaries', label: 'Salarios/Nómina', icon: '👥' },
    { value: 'marketing', label: 'Marketing/Publicidad', icon: '📢' },
    { value: 'maintenance', label: 'Mantenimiento', icon: '🔧' },
    { value: 'insurance', label: 'Seguros', icon: '🛡️' },
    { value: 'taxes', label: 'Impuestos/Tributos', icon: '📊' },
    { value: 'transport', label: 'Transporte', icon: '🚗' },
    { value: 'food', label: 'Alimentación', icon: '🍔' },
    { value: 'training', label: 'Capacitación', icon: '📚' },
    { value: 'software', label: 'Software/Licencias', icon: '💻' },
    { value: 'other', label: 'Otros', icon: '📝' }
  ];

  // Métodos de pago
  const paymentMethods = [
    { value: 'cash', label: 'Efectivo', icon: '💵' },
    { value: 'debit', label: 'Tarjeta Débito', icon: '💳' },
    { value: 'credit', label: 'Tarjeta Crédito', icon: '💳' },
    { value: 'transfer', label: 'Transferencia', icon: '🏦' },
    { value: 'check', label: 'Cheque', icon: '📄' },
    { value: 'digital', label: 'Pago Digital', icon: '📱' }
  ];

  // Frecuencias para gastos recurrentes
  const frequencies = [
    { value: 'daily', label: 'Diario' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensual' },
    { value: 'yearly', label: 'Anual' }
  ];

  // Cargar gastos
  const loadExpenses = useCallback(async (startDate = null, endDate = null) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await api.get(`/expenses?${params.toString()}`);
      setExpenses(response.data || []);
    } catch (error) {
      console.error('Error loading expenses:', error);
      setError('Error al cargar los gastos');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar gastos recurrentes
  const loadRecurringExpenses = useCallback(async () => {
    try {
      const response = await api.get('/expenses/recurring');
      setRecurringExpenses(response.data || []);
    } catch (error) {
      console.error('Error loading recurring expenses:', error);
      setError('Error al cargar los gastos recurrentes');
    }
  }, []);

  // Crear gasto único
  const createExpense = useCallback(async (expenseData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/expenses', {
        description: expenseData.description,
        amount: parseFloat(expenseData.amount),
        category: expenseData.category,
        paymentMethod: expenseData.paymentMethod,
        date: expenseData.date,
        type: 'one-time'
      });

      // Actualizar lista local
      setExpenses(prev => [response.data, ...prev]);
      
      return response.data;
    } catch (error) {
      console.error('Error creating expense:', error);
      setError('Error al crear el gasto');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear gasto recurrente
  const createRecurringExpense = useCallback(async (expenseData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/expenses/recurring', {
        description: expenseData.description,
        amount: parseFloat(expenseData.amount),
        category: expenseData.category,
        paymentMethod: expenseData.paymentMethod,
        recurringConfig: {
          frequency: expenseData.recurringConfig.frequency,
          interval: parseInt(expenseData.recurringConfig.interval),
          endDate: expenseData.recurringConfig.endDate,
          specificDates: expenseData.recurringConfig.specificDates,
          dayOfWeek: expenseData.recurringConfig.dayOfWeek,
          dayOfMonth: expenseData.recurringConfig.dayOfMonth,
          isActive: true
        }
      });

      // Actualizar lista local
      setRecurringExpenses(prev => [response.data, ...prev]);
      
      return response.data;
    } catch (error) {
      console.error('Error creating recurring expense:', error);
      setError('Error al crear el gasto recurrente');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizar gasto
  const updateExpense = useCallback(async (id, expenseData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.put(`/expenses/${id}`, expenseData);

      // Actualizar lista local
      setExpenses(prev => prev.map(exp => 
        exp._id === id ? response.data : exp
      ));
      
      return response.data;
    } catch (error) {
      console.error('Error updating expense:', error);
      setError('Error al actualizar el gasto');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Eliminar gasto
  const deleteExpense = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);

      await api.delete(`/expenses/${id}`);

      // Actualizar lista local
      setExpenses(prev => prev.filter(exp => exp._id !== id));
    } catch (error) {
      console.error('Error deleting expense:', error);
      setError('Error al eliminar el gasto');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Activar/desactivar gasto recurrente
  const toggleRecurringExpense = useCallback(async (id, isActive) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.patch(`/expenses/recurring/${id}/toggle`, {
        isActive
      });

      // Actualizar lista local
      setRecurringExpenses(prev => prev.map(exp => 
        exp._id === id ? { ...exp, recurringConfig: { ...exp.recurringConfig, isActive } } : exp
      ));
      
      return response.data;
    } catch (error) {
      console.error('Error toggling recurring expense:', error);
      setError('Error al cambiar estado del gasto recurrente');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Procesar gastos pendientes automáticamente
  const processAutomaticExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/expenses/process-automatic');
      
      // Recargar gastos si se procesaron algunos automáticamente
      if (response.data.processed > 0) {
        loadExpenses();
      }
      
      return response.data;
    } catch (error) {
      console.error('Error processing automatic expenses:', error);
      setError('Error al procesar gastos automáticos');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadExpenses]);

  // Validaciones
  const validateExpenseForm = useCallback((formData) => {
    const errors = {};

    if (!formData.description?.trim()) {
      errors.description = 'La descripción es requerida';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.amount = 'El monto debe ser mayor a 0';
    }

    if (!formData.category) {
      errors.category = 'La categoría es requerida';
    }

    if (!formData.paymentMethod) {
      errors.paymentMethod = 'El método de pago es requerido';
    }

    if (!formData.date) {
      errors.date = 'La fecha es requerida';
    }

    // Validaciones específicas para gastos recurrentes
    if (formData.isRecurring) {
      if (!formData.recurringConfig.frequency) {
        errors.frequency = 'La frecuencia es requerida';
      }

      if (!formData.recurringConfig.interval || parseInt(formData.recurringConfig.interval) < 1) {
        errors.interval = 'El intervalo debe ser mayor a 0';
      }

      // Validación para frecuencia semanal
      if (formData.recurringConfig.frequency === 'weekly' && !formData.recurringConfig.dayOfWeek) {
        errors.dayOfWeek = 'Debe seleccionar el día de la semana';
      }

      // Validación para frecuencia mensual
      if (formData.recurringConfig.frequency === 'monthly' && !formData.recurringConfig.dayOfMonth) {
        errors.dayOfMonth = 'Debe seleccionar el día del mes';
      }
    }

    return errors;
  }, []);

  // Resetear formulario
  const resetForm = useCallback(() => {
    setExpenseForm({
      description: '',
      amount: '',
      category: '',
      paymentMethod: '',
      date: new Date().toISOString().split('T')[0],
      type: 'one-time',
      isRecurring: false,
      recurringConfig: {
        frequency: 'monthly',
        interval: 1,
        endDate: null,
        specificDates: [],
        dayOfWeek: null,
        dayOfMonth: null,
        isActive: true
      }
    });
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    loadExpenses();
    loadRecurringExpenses();
    
    // Procesar gastos automáticos al cargar
    processAutomaticExpenses();
  }, []);

  // Formatear moneda
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount || 0);
  }, []);

  // Obtener próxima fecha de gasto recurrente
  const getNextRecurringDate = useCallback((recurringConfig) => {
    const now = new Date();
    const config = recurringConfig;

    switch (config.frequency) {
      case 'daily':
        return new Date(now.getTime() + (config.interval * 24 * 60 * 60 * 1000));
      
      case 'weekly':
        const nextWeek = new Date(now);
        nextWeek.setDate(now.getDate() + (config.interval * 7));
        return nextWeek;
      
      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(now.getMonth() + config.interval);
        if (config.dayOfMonth) {
          nextMonth.setDate(config.dayOfMonth);
        }
        return nextMonth;
      
      case 'yearly':
        const nextYear = new Date(now);
        nextYear.setFullYear(now.getFullYear() + config.interval);
        return nextYear;
      
      default:
        return now;
    }
  }, []);

  return {
    // Datos
    expenses,
    recurringExpenses,
    loading,
    error,

    // Formulario
    expenseForm,
    setExpenseForm,
    resetForm,

    // Catálogos
    expenseCategories,
    paymentMethods,
    frequencies,

    // Acciones CRUD
    loadExpenses,
    loadRecurringExpenses,
    createExpense,
    createRecurringExpense,
    updateExpense,
    deleteExpense,
    toggleRecurringExpense,
    processAutomaticExpenses,

    // Validaciones
    validateExpenseForm,

    // Utilidades
    formatCurrency,
    getNextRecurringDate
  };
};

export default useExpenses;