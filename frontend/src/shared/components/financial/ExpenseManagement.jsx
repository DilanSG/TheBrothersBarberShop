import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  DollarSign, 
  Calendar, 
  Tag, 
  CreditCard, 
  Clock, 
  Repeat,
  AlertCircle,
  Save,
  Trash2
} from 'lucide-react';
import GradientButton from '../ui/GradientButton';

/**
 * Modal para crear/editar gastos únicos y recurrentes
 */
export const ExpenseModal = ({
  isOpen,
  onClose,
  expense = null,
  expenseCategories,
  paymentMethods,
  frequencies,
  onSave,
  loading = false
}) => {
  const [formData, setFormData] = useState(() => ({
    description: expense?.description || '',
    amount: expense?.amount || '',
    category: expense?.category || '',
    paymentMethod: expense?.paymentMethod || '',
    date: expense?.date || new Date().toISOString().split('T')[0],
    type: expense?.type || 'one-time',
    isRecurring: expense?.isRecurring || false,
    recurringConfig: {
      frequency: expense?.recurringConfig?.frequency || 'monthly',
      interval: expense?.recurringConfig?.interval || 1,
      endDate: expense?.recurringConfig?.endDate || '',
      specificDates: expense?.recurringConfig?.specificDates || [],
      dayOfWeek: expense?.recurringConfig?.dayOfWeek || '',
      dayOfMonth: expense?.recurringConfig?.dayOfMonth || '',
      isActive: expense?.recurringConfig?.isActive ?? true
    }
  }));

  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones básicas
    const newErrors = {};
    
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0';
    }
    
    if (!formData.category) {
      newErrors.category = 'La categoría es requerida';
    }
    
    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'El método de pago es requerido';
    }

    if (formData.isRecurring) {
      if (formData.recurringConfig.frequency === 'weekly' && !formData.recurringConfig.dayOfWeek) {
        newErrors.dayOfWeek = 'Debe seleccionar el día de la semana';
      }
      
      if (formData.recurringConfig.frequency === 'monthly' && !formData.recurringConfig.dayOfMonth) {
        newErrors.dayOfMonth = 'Debe seleccionar el día del mes';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const updateRecurringConfig = (field, value) => {
    setFormData(prev => ({
      ...prev,
      recurringConfig: {
        ...prev.recurringConfig,
        [field]: value
      }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[10001] p-4">
      <div className="relative w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
        <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl">
          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {expense ? 'Editar Gasto' : 'Nuevo Gasto'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Descripción */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Tag className="w-4 h-4 inline mr-2" />
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Descripción del gasto..."
                    className={`glassmorphism-input w-full shadow-xl shadow-blue-500/20 ${
                      errors.description ? 'border-red-500/50' : ''
                    }`}
                  />
                  {errors.description && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.description}
                    </p>
                  )}
                </div>

                {/* Monto */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-2" />
                    Monto
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.amount}
                    onChange={(e) => updateField('amount', e.target.value)}
                    placeholder="0"
                    className={`glassmorphism-input w-full shadow-xl shadow-blue-500/20 ${
                      errors.amount ? 'border-red-500/50' : ''
                    }`}
                  />
                  {errors.amount && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.amount}
                    </p>
                  )}
                </div>

                {/* Fecha */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => updateField('date', e.target.value)}
                    className="glassmorphism-input w-full shadow-xl shadow-blue-500/20"
                  />
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Categoría
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => updateField('category', e.target.value)}
                    className={`glassmorphism-select w-full shadow-xl shadow-blue-500/20 ${
                      errors.category ? 'border-red-500/50' : ''
                    }`}
                  >
                    <option value="">Seleccionar categoría</option>
                    {expenseCategories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.icon} {category.label}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.category}
                    </p>
                  )}
                </div>

                {/* Método de pago */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <CreditCard className="w-4 h-4 inline mr-2" />
                    Método de Pago
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => updateField('paymentMethod', e.target.value)}
                    className={`glassmorphism-select w-full shadow-xl shadow-blue-500/20 ${
                      errors.paymentMethod ? 'border-red-500/50' : ''
                    }`}
                  >
                    <option value="">Seleccionar método</option>
                    {paymentMethods.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                  {errors.paymentMethod && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.paymentMethod}
                    </p>
                  )}
                </div>
              </div>

              {/* Configuración de gasto recurrente */}
              <div className="border-t border-white/10 pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={formData.isRecurring}
                    onChange={(e) => updateField('isRecurring', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="isRecurring" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <Repeat className="w-4 h-4" />
                    Gasto Recurrente
                  </label>
                </div>

                {formData.isRecurring && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                    {/* Frecuencia */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Clock className="w-4 h-4 inline mr-2" />
                        Frecuencia
                      </label>
                      <select
                        value={formData.recurringConfig.frequency}
                        onChange={(e) => updateRecurringConfig('frequency', e.target.value)}
                        className="glassmorphism-select w-full shadow-xl shadow-blue-500/20"
                      >
                        {frequencies.map((freq) => (
                          <option key={freq.value} value={freq.value}>
                            {freq.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Intervalo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Cada
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.recurringConfig.interval}
                        onChange={(e) => updateRecurringConfig('interval', parseInt(e.target.value))}
                        className="glassmorphism-input w-full shadow-xl shadow-blue-500/20"
                      />
                    </div>

                    {/* Fecha fin (opcional) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Fecha Fin (opcional)
                      </label>
                      <input
                        type="date"
                        value={formData.recurringConfig.endDate}
                        onChange={(e) => updateRecurringConfig('endDate', e.target.value)}
                        className="glassmorphism-input w-full shadow-xl shadow-blue-500/20"
                      />
                    </div>

                    {/* Configuraciones específicas por frecuencia */}
                    {formData.recurringConfig.frequency === 'weekly' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Día de la Semana
                        </label>
                        <select
                          value={formData.recurringConfig.dayOfWeek}
                          onChange={(e) => updateRecurringConfig('dayOfWeek', e.target.value)}
                          className={`glassmorphism-select w-full shadow-xl shadow-blue-500/20 ${
                            errors.dayOfWeek ? 'border-red-500/50' : ''
                          }`}
                        >
                          <option value="">Seleccionar día</option>
                          <option value="0">Domingo</option>
                          <option value="1">Lunes</option>
                          <option value="2">Martes</option>
                          <option value="3">Miércoles</option>
                          <option value="4">Jueves</option>
                          <option value="5">Viernes</option>
                          <option value="6">Sábado</option>
                        </select>
                        {errors.dayOfWeek && (
                          <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.dayOfWeek}
                          </p>
                        )}
                      </div>
                    )}

                    {formData.recurringConfig.frequency === 'monthly' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Día del Mes
                        </label>
                        <select
                          value={formData.recurringConfig.dayOfMonth}
                          onChange={(e) => updateRecurringConfig('dayOfMonth', e.target.value)}
                          className={`glassmorphism-select w-full shadow-xl shadow-blue-500/20 ${
                            errors.dayOfMonth ? 'border-red-500/50' : ''
                          }`}
                        >
                          <option value="">Seleccionar día</option>
                          {[...Array(31)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>
                              Día {i + 1}
                            </option>
                          ))}
                        </select>
                        {errors.dayOfMonth && (
                          <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.dayOfMonth}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 rounded-lg text-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                
                <GradientButton
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={loading}
                  className="shadow-xl shadow-blue-500/20"
                >
                  <div className="flex items-center gap-2">
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{expense ? 'Actualizar' : 'Crear'} Gasto</span>
                  </div>
                </GradientButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Lista de gastos recurrentes con controles
 */
export const RecurringExpensesList = ({
  expenses,
  onEdit,
  onToggle,
  onDelete,
  formatCurrency,
  getNextRecurringDate,
  loading = false,
  className = ''
}) => {
  const getFrequencyText = (config) => {
    const freqMap = {
      daily: 'diario',
      weekly: 'semanal',
      monthly: 'mensual',
      yearly: 'anual'
    };
    
    const freq = freqMap[config.frequency] || config.frequency;
    return config.interval === 1 ? freq : `cada ${config.interval} ${freq}`;
  };

  const getDayText = (config) => {
    if (config.frequency === 'weekly' && config.dayOfWeek !== null) {
      const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      return `los ${days[config.dayOfWeek]}`;
    }
    
    if (config.frequency === 'monthly' && config.dayOfMonth) {
      return `el día ${config.dayOfMonth}`;
    }
    
    return '';
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white/5 border border-white/10 rounded-lg p-4 h-24"></div>
        ))}
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Repeat className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">No hay gastos recurrentes configurados</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {expenses.map((expense) => (
        <div
          key={expense._id}
          className="group relative bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm shadow-xl shadow-blue-500/20 hover:bg-white/10 transition-all duration-300 overflow-hidden"
        >
          {/* Efecto de brillo */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-lg"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="font-semibold text-white">{expense.description}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  expense.recurringConfig.isActive
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                }`}>
                  {expense.recurringConfig.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-300">
                <span className="font-medium text-blue-400">
                  {formatCurrency(expense.amount)}
                </span>
                <span>
                  {getFrequencyText(expense.recurringConfig)} {getDayText(expense.recurringConfig)}
                </span>
                <span className="text-gray-400">
                  Próximo: {getNextRecurringDate(expense.recurringConfig).toLocaleDateString('es-CO')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggle(expense._id, !expense.recurringConfig.isActive)}
                className={`p-2 rounded-lg border transition-colors ${
                  expense.recurringConfig.isActive
                    ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30'
                    : 'bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30'
                }`}
                title={expense.recurringConfig.isActive ? 'Desactivar' : 'Activar'}
              >
                <Clock className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => onEdit(expense)}
                className="p-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors"
                title="Editar"
              >
                <Tag className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => onDelete(expense._id)}
                className="p-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default {
  ExpenseModal,
  RecurringExpensesList
};