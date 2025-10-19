import React, { useState, useEffect } from 'react';
import { 
  X, 
  DollarSign, 
  Calendar, 
  Tag, 
  CreditCard, 
  AlertCircle,
  Save,
  FileText,
  Info
} from 'lucide-react';
import GradientButton from '../ui/GradientButton';

/**
 * Modal para crear/editar gastos únicos
 */
export const OneTimeExpenseModal = ({
  isOpen,
  onClose,
  expense = null,
  expenseCategories,
  paymentMethods,
  onSave,
  loading = false
}) => {
  // Fallbacks en caso de que aún no hayan cargado categorías o métodos
  const DEFAULT_EXPENSE_CATEGORIES = [
    { value: 'rent', label: 'Arriendo' },
    { value: 'utilities', label: 'Servicios Públicos' },
    { value: 'supplies', label: 'Insumos' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'maintenance', label: 'Mantenimiento' },
    { value: 'other', label: 'Otros' }
  ];
  const DEFAULT_PAYMENT_METHODS = [
    { value: 'cash', label: 'Efectivo' },
    { value: 'transfer', label: 'Transferencia' },
    { value: 'nequi', label: 'Nequi' },
    { value: 'daviplata', label: 'Daviplata' },
    { value: 'card', label: 'Tarjeta' },
    { value: 'other', label: 'Otro' }
  ];

  const safeExpenseCategories = Array.isArray(expenseCategories) && expenseCategories.length > 0
    ? expenseCategories
    : DEFAULT_EXPENSE_CATEGORIES;
  const safePaymentMethods = Array.isArray(paymentMethods) && paymentMethods.length > 0
    ? paymentMethods
    : DEFAULT_PAYMENT_METHODS;

  const [formData, setFormData] = useState(() => ({
    description: expense?.description || '',
    amount: expense?.amount || '',
    category: expense?.category || '',
    paymentMethod: expense?.paymentMethod || '',
    date: expense?.date || new Date().toISOString().split('T')[0],
    notes: expense?.notes || ''
  }));

  const [errors, setErrors] = useState({});

  // Actualizar formulario cuando cambia el expense
  useEffect(() => {
    if (expense) {
      setFormData({
        description: expense.description || '',
        amount: expense.amount || '',
        category: expense.category || '',
        paymentMethod: expense.paymentMethod || '',
        date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        notes: expense.notes || ''
      });
    } else {
      // Si no hay expense, resetear el formulario
      setFormData({
        description: '',
        amount: '',
        category: '',
        paymentMethod: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    }
    setErrors({});
  }, [expense]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.description?.trim()) {
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

    if (!formData.date) {
      newErrors.date = 'La fecha es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await onSave({
        ...formData,
        type: 'one-time',
        isRecurring: false
      });
      onClose();
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[10001] p-4 sm:p-6 lg:p-8">
      <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-2xl mx-auto h-[90vh] sm:h-[85vh] lg:h-[80vh] flex flex-col">
        <div className="relative bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl shadow-green-500/20 h-full flex flex-col overflow-hidden">
          
          {/* Header fijo */}
          <div className="relative z-10 flex-shrink-0 p-4 sm:p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/20 border border-green-500/30">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    {expense ? 'Editar Gasto Único' : 'Nuevo Gasto Único'}
                  </h3>
                  <p className="text-xs sm:text-sm text-green-300">
                    Gasto que ocurre una sola vez en la fecha especificada
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
          </div>

          {/* Aviso de edición */}
          {expense && (
            <div className="px-4 sm:px-6 py-2 bg-blue-500/10 border-y border-blue-500/20">
              <p className="text-xs text-blue-300 flex items-center gap-2">
                <Info className="w-3 h-3" />
                Editando gasto existente - Modifica solo los campos que necesites cambiar
              </p>
            </div>
          )}

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-4 sm:px-6 pb-4 sm:pb-6">
            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
              
              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Tag className="w-4 h-4 inline mr-2" />
                  Descripción del Gasto
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Ej: Compra de productos para la barbería"
                  className={`glassmorphism-input w-full shadow-xl shadow-green-500/20 ${
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

              {/* Fecha y Monto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Fecha del Gasto
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => updateField('date', e.target.value)}
                    className={`glassmorphism-input w-full shadow-xl shadow-green-500/20 ${
                      errors.date ? 'border-red-500/50' : ''
                    }`}
                  />
                  {errors.date && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.date}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Fecha en que se realizó o realizará el gasto
                  </p>
                </div>

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
                    className={`glassmorphism-input w-full shadow-xl shadow-green-500/20 ${
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
              </div>

              {/* Categoría y Método de Pago */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Categoría
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => updateField('category', e.target.value)}
                    className={`glassmorphism-select w-full shadow-xl shadow-green-500/20 ${
                      errors.category ? 'border-red-500/50' : ''
                    }`}
                  >
                    <option value="">Seleccionar categoría</option>
                    {safeExpenseCategories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                    <option value="custom">➕ Crear nueva categoría...</option>
                  </select>
                  {errors.category && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.category}
                    </p>
                  )}
                  
                  {/* Campo para categoría personalizada */}
                  {formData.category === 'custom' && (
                    <input
                      type="text"
                      placeholder="Nombre de la nueva categoría"
                      className="glassmorphism-input w-full shadow-xl shadow-green-500/20 mt-2"
                      onChange={(e) => {
                        const customValue = e.target.value.toLowerCase().replace(/\s+/g, '-');
                        updateField('category', customValue);
                      }}
                      autoFocus
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <CreditCard className="w-4 h-4 inline mr-2" />
                    Método de Pago
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => updateField('paymentMethod', e.target.value)}
                    className={`glassmorphism-select w-full shadow-xl shadow-green-500/20 ${
                      errors.paymentMethod ? 'border-red-500/50' : ''
                    }`}
                  >
                    <option value="">Seleccionar método</option>
                    {safePaymentMethods.map((method) => (
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

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Notas (opcional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="Información adicional sobre el gasto..."
                  rows={3}
                  className="glassmorphism-input w-full shadow-xl shadow-green-500/20 resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
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
                  className="shadow-xl shadow-green-500/20"
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

export default OneTimeExpenseModal;