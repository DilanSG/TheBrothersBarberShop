import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, Send } from 'lucide-react';

/**
 * Modal para capturar datos del cliente para factura de carrito
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {Function} onClose - Función para cerrar el modal
 * @param {Function} onSubmit - Función callback con los datos: { firstName, lastName, email, phone, address, sendEmail }
 * @param {Object} item - Item del carrito asociado (referencia)
 */
const InvoiceDataModal = ({ isOpen, onClose, onSubmit, item, initialData = null }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    sendEmail: false
  });

  const [errors, setErrors] = useState({});

  // Reset form cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      // Prefill with initialData (carrito) o con item.clientData si está presente
      const source = initialData || item?.clientData || null;
      if (source) {
        setFormData({
          firstName: source.firstName || '',
          lastName: source.lastName || '',
          email: source.email || '',
          phone: source.phone || '',
          address: source.address || '',
          sendEmail: source.sendEmail || false
        });
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          address: '',
          sendEmail: false
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData, item]);

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    // Campos obligatorios
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es obligatorio';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es obligatorio';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El correo electrónico no es válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="relative w-full max-w-md mx-auto max-h-[90vh] flex flex-col">
        <div className="relative bg-blue-500/5 backdrop-blur-md border border-blue-500/20 rounded-2xl shadow-2xl shadow-blue-500/20 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 p-4 sm:p-6 border-b border-blue-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/20">
                  <User className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Datos de Factura</h3>
                  <p className="text-sm text-gray-300">Complete la información del cliente</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-white transition-colors duration-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form Content - Scrollable */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Nombre <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  className={`w-full px-4 py-2 bg-white/5 border ${errors.firstName ? 'border-red-500/50' : 'border-blue-500/30'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 transition-colors duration-300`}
                  placeholder="Ej: Juan"
                />
                {errors.firstName && (
                  <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>
                )}
              </div>

              {/* Apellido */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Apellido <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  className={`w-full px-4 py-2 bg-white/5 border ${errors.lastName ? 'border-red-500/50' : 'border-blue-500/30'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 transition-colors duration-300`}
                  placeholder="Ej: Pérez"
                />
                {errors.lastName && (
                  <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Correo Electrónico <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`w-full px-4 py-2 bg-white/5 border ${errors.email ? 'border-red-500/50' : 'border-blue-500/30'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 transition-colors duration-300`}
                  placeholder="ejemplo@correo.com"
                />
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Teléfono (opcional) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Teléfono (opcional)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-blue-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 transition-colors duration-300"
                  placeholder="3001234567"
                />
              </div>

              {/* Dirección (opcional) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Dirección (opcional)
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-blue-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 transition-colors duration-300 resize-none"
                  rows="2"
                  placeholder="Calle 123 #45-67"
                />
              </div>

              {/* Checkbox - Enviar por email */}
              <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <input
                  type="checkbox"
                  id="sendEmail"
                  checked={formData.sendEmail}
                  onChange={(e) => handleChange('sendEmail', e.target.checked)}
                  className="w-5 h-5 rounded border-blue-500/30 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                />
                <label htmlFor="sendEmail" className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer flex-1">
                  <Send className="w-4 h-4 text-blue-400" />
                  <span>Enviar factura por correo electrónico</span>
                </label>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-gray-500/20 border border-gray-500/30 rounded-lg text-gray-300 hover:bg-gray-500/30 transition-all duration-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg text-blue-300 hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-purple-600/30 transition-all duration-300 font-semibold"
                >
                  Guardar Datos
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDataModal;
