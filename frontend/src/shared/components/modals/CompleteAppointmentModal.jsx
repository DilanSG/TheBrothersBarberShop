import React, { useState, useEffect } from 'react';
import { X, CheckCircle, CreditCard } from 'lucide-react';
import { usePaymentMethodsContext } from '../../contexts/PaymentMethodsContext';
import { useNotification } from '../../contexts/NotificationContext';
import { api } from '../../services/api';

const CompleteAppointmentModal = ({ isOpen, onClose, appointment, onComplete }) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentMethodsFromAPI, setPaymentMethodsFromAPI] = useState([]);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const { allPaymentMethods } = usePaymentMethodsContext();
  const { showError, showWarning } = useNotification();

  // Métodos de pago por defecto en caso de que el contexto y API fallen
  const defaultPaymentMethods = [
    { _id: 'cash', name: 'Efectivo', color: '#10b981' },
    { _id: 'nequi', name: 'Nequi', color: '#8b5cf6' },
    { _id: 'daviplata', name: 'Daviplata', color: '#ef4444' },
    { _id: 'bancolombia', name: 'Bancolombia', color: '#f59e0b' },
    { _id: 'tarjeta', name: 'Tarjeta', color: '#3b82f6' }
  ];

  // Función para obtener métodos de pago desde la API
  const fetchPaymentMethodsFromAPI = async () => {
    try {
      setLoadingMethods(true);
      const response = await api.get('/payment-methods');
      if (response.data && response.data.success) {
        setPaymentMethodsFromAPI(response.data.data);
        console.log('✅ Métodos de pago obtenidos desde API:', response.data.data);
      }
    } catch (error) {
      console.error('❌ Error al obtener métodos de pago desde API:', error);
      // En caso de error, mantener los métodos del contexto como fallback
    } finally {
      setLoadingMethods(false);
    }
  };

  // Cargar métodos de pago cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      fetchPaymentMethodsFromAPI();
    }
  }, [isOpen]);

  // Priorizar métodos de la API, luego del contexto, luego los por defecto
  const mappedContextMethods = allPaymentMethods?.map(method => ({
    _id: method.backendId || method._id,
    name: method.name,
    color: method.colorHex || method.color
  })) || [];

  // Usar métodos de API si están disponibles, sino del contexto, sino los por defecto
  const availableMethods = paymentMethodsFromAPI.length > 0 
    ? paymentMethodsFromAPI 
    : (mappedContextMethods.length > 0 ? mappedContextMethods : defaultPaymentMethods);

  // Debug: Log para verificar métodos de pago
  console.log('🔍 CompleteAppointmentModal - Debug completo:', {
    fromAPI: paymentMethodsFromAPI,
    fromAPILength: paymentMethodsFromAPI.length,
    fromContext: allPaymentMethods,
    mappedContext: mappedContextMethods,
    finalAvailable: availableMethods,
    finalAvailableLength: availableMethods.length,
    source: paymentMethodsFromAPI.length > 0 ? 'API' : (mappedContextMethods.length > 0 ? 'Context' : 'Default')
  });

  // Debug adicional para cada método
  availableMethods.forEach((method, index) => {
    console.log(`📋 Método ${index + 1}:`, {
      id: method._id,
      backendId: method.backendId,
      name: method.name,
      color: method.color
    });
  });

  const handleComplete = async () => {
    if (!selectedPaymentMethod) {
      showWarning('Por favor selecciona un método de pago');
      return;
    }

    setLoading(true);
    try {
      await onComplete(appointment._id, selectedPaymentMethod);
      onClose();
    } catch (error) {
      console.error('Error al completar cita:', error);
      showError('Error al completar la cita');
    } finally {
      setLoading(false);
    }
  };

  // Bloquear scroll del body
  React.useEffect(() => {
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
          <div className="relative z-10 flex-shrink-0 p-2 sm:p-3 lg:p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white">Completar Cita</h3>
                  <p className="text-xs sm:text-sm text-blue-300">Selecciona el método de pago</p>
                </div>
              </div>
              
              <button 
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-white transition-colors duration-200"
                disabled={loading}
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Información de la cita */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-blue-300">Detalles de la cita</p>
                <CheckCircle className="w-4 h-4 text-blue-400" />
              </div>
              
              <div className="grid grid-cols-1 gap-1">
                <div className="flex justify-between">
                  <span className="text-xs text-blue-300">Cliente:</span>
                  <span className="text-xs text-white font-medium">{appointment.user?.name || 'Cliente no especificado'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-xs text-blue-300">Servicio:</span>
                  <span className="text-xs text-white font-medium">{appointment.service?.name || 'Servicio no especificado'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-xs text-blue-300">Precio:</span>
                  <span className="text-xs text-blue-200 font-bold">
                    {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    }).format(appointment.price || appointment.servicePrice || 0)}
                  </span>
                </div>
                
                {appointment.date && (
                  <div className="flex justify-between">
                    <span className="text-xs text-blue-300">Fecha:</span>
                    <span className="text-xs text-white">{new Date(appointment.date).toLocaleDateString('es-CO')}</span>
                  </div>
                )}
                
                {appointment.time && (
                  <div className="flex justify-between">
                    <span className="text-xs text-blue-300">Hora:</span>
                    <span className="text-xs text-white">{appointment.time}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-2 sm:px-3 lg:px-4 pb-2 sm:pb-3">
            <div className="space-y-4 pt-4">
              
              {/* Selección de método de pago */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-blue-300">
                    <CreditCard className="inline w-4 h-4 mr-2" />
                    Método de Pago * ({availableMethods.length} disponibles)
                    {loadingMethods && <span className="text-xs text-yellow-400 ml-2">(Cargando...)</span>}
                  </label>
                </div>
                
                {/* Grid para métodos de pago */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableMethods.map((method) => (
                <button
                  key={method._id}
                  onClick={() => setSelectedPaymentMethod(method._id)}
                  disabled={loading || loadingMethods}
                  className={`p-3 rounded-lg border transition-all duration-300 text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedPaymentMethod === method._id
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                      : 'bg-white/5 text-gray-300 border-white/20 hover:border-blue-500/40 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: method.color }}
                    ></div>
                    <span className="text-sm font-medium">{method.name}</span>
                  </div>
                </button>
              ))}
                </div>
              </div>
              
            </div>
          </div>

          {/* Footer fijo con botones */}
          <div className="sticky bottom-0 bg-blue-500/5 backdrop-blur-md border-t border-blue-500/20 p-4 sm:p-6 z-10">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-3 py-2 bg-gray-500/20 text-gray-300 border border-gray-500/30 rounded-lg hover:bg-gray-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleComplete}
                disabled={loading || !selectedPaymentMethod || loadingMethods}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-300 border border-blue-500/30 rounded-lg hover:from-blue-600/30 hover:to-purple-600/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-500/20 text-sm"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span>Completando...</span>
                  </div>
                ) : (
                  'Completar Cita'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteAppointmentModal;