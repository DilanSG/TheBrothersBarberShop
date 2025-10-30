import React, { useState, useEffect } from 'react';
import { X, CreditCard } from 'lucide-react';

const AddPaymentMethodModal = ({ isOpen, onClose, onAdd, editingMethod = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'blue'
  });

  const [errors, setErrors] = useState({});

  // Función para generar backendId automáticamente basado en el nombre
  const generateBackendId = (name) => {
    return name
      .toLowerCase()
      .normalize('NFD') // Normalizar para separar acentos
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9\s]/g, '') // Remover caracteres especiales
      .trim()
      .replace(/\s+/g, '_'); // Reemplazar espacios con guiones bajos
  };

  // Efecto para cargar datos cuando se está editando
  useEffect(() => {
    if (editingMethod) {
      setFormData({
        name: editingMethod.name || '',
        description: editingMethod.description || '',
        color: editingMethod.color || 'blue'
      });
    } else {
      // Resetear formulario cuando no se está editando
      setFormData({
        name: '',
        description: '',
        color: 'blue'
      });
    }
    setErrors({});
  }, [editingMethod, isOpen]);

  // Opciones de colores
  const colorOptions = [
    { id: 'blue', name: 'Azul', class: 'bg-blue-500' },
    { id: 'green', name: 'Verde', class: 'bg-green-500' },
    { id: 'purple', name: 'Púrpura', class: 'bg-purple-500' },
    { id: 'red', name: 'Rojo', class: 'bg-red-500' },
    { id: 'yellow', name: 'Amarillo', class: 'bg-yellow-500' },
    { id: 'gray', name: 'Gris', class: 'bg-gray-500' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validaciones
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.description.trim()) newErrors.description = 'La descripción es requerida';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Generar backendId automáticamente basado en el nombre
    const generatedBackendId = generateBackendId(formData.name);

    // Crear objeto del método de pago
    const paymentMethodData = {
      id: formData.name.toLowerCase().replace(/\s+/g, '_'),
      name: formData.name,
      description: formData.description,
      backendId: generatedBackendId,
      color: formData.color,
      icon: CreditCard,
      emoji: '💳',
      isEditing: !!editingMethod,
      originalBackendId: editingMethod?.backendId
    };

    console.log(editingMethod ? '✏️ Editando método:' : '🆕 Agregando método:', paymentMethodData);
    console.log('🔧 Backend ID generado automáticamente:', generatedBackendId);
    onAdd(paymentMethodData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      color: 'blue'
    });
    setErrors({});
    onClose();
  };

  // Bloquear scroll del body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = 'unset'; };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4 lg:p-8 pt-8 sm:pt-10">
      <div className="relative w-full max-w-xs sm:max-w-md mx-auto h-[85vh] sm:h-[80vh] lg:h-[75vh] flex flex-col">
        <div className="relative bg-blue-500/5 backdrop-blur-md border border-blue-500/20 rounded-2xl shadow-2xl shadow-blue-500/20 h-full flex flex-col overflow-hidden">
          {/* Header fijo */}
          <div className="flex-shrink-0 p-2 sm:p-3 lg:p-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-white">
                {editingMethod ? 'Editar Método de Pago' : 'Agregar Método de Pago'}
              </h3>
              <button 
                onClick={handleClose}
                className="p-1 text-gray-400 hover:text-white transition-colors duration-200"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-2 sm:px-3 lg:px-4 pb-2 sm:pb-3">
            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Nombre del método
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="glassmorphism-input w-full"
                placeholder="Ej: Bancolombia"
              />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Descripción
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="glassmorphism-input w-full"
                placeholder="Ej: Transferencia Bancolombia"
              />
              {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
            </div>

            {/* Vista previa del ID generado */}
            {formData.name.trim() && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  ID generado automáticamente
                </label>
                <div className="px-3 py-2 bg-gray-500/10 border border-gray-500/20 rounded-lg text-gray-300 text-sm">
                  {generateBackendId(formData.name)}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Este ID se genera automáticamente basado en el nombre
                </p>
              </div>
            )}

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Color
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color: color.id }))}
                    className={`
                      relative p-3 rounded-lg border-2 transition-all duration-200
                      ${formData.color === color.id 
                        ? 'border-white/50 scale-110' 
                        : 'border-white/20 hover:border-white/40'
                      }
                    `}
                  >
                    <div className={`w-full h-4 rounded ${color.class}`}></div>
                    <p className="text-xs text-white mt-1 text-center">{color.name}</p>
                    {formData.color === color.id && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-gray-500/20 border border-gray-500/30 rounded-lg text-gray-300 hover:bg-gray-500/30 transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-300 hover:bg-blue-500/30 transition-all duration-200"
              >
                {editingMethod ? 'Guardar Cambios' : 'Agregar Método'}
              </button>
            </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPaymentMethodModal;