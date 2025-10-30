import { useState } from 'react';
import { X, Scissors, ShoppingBag, Calendar, DollarSign, Edit3, Trash2 } from 'lucide-react';
import { usePaymentMethodsContext } from '../../contexts/PaymentMethodsContext';
import { useNotification } from '../../contexts/NotificationContext';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';
import AddPaymentMethodModal from './AddPaymentMethodModal';

// Función de formateo de moneda mejorada para Colombia
const formatCurrency = (amount) => {
  if (amount === 0) return '$ 0';
  
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('COP', '$');
};

// Colores por método de pago - Estilo AdminBarbers actualizado
const getPaymentMethodColor = (methodId) => {
  const colors = {
    cash: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-300', dot: 'bg-green-400' },
    nequi: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-300', dot: 'bg-pink-400' },
    nu: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-300', dot: 'bg-purple-400' },
    daviplata: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-300', dot: 'bg-red-400' },
    debit: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-300', dot: 'bg-blue-400' },
    bancolombia: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-300', dot: 'bg-yellow-400' },
    digital: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-300', dot: 'bg-cyan-400' }
  };
  
  // Si no existe el método, usar colores por defecto basados en un hash simple del ID
  if (!colors[methodId]) {
    const defaultColors = [
      { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-300', dot: 'bg-indigo-400' },
      { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-300', dot: 'bg-orange-400' },
      { bg: 'bg-teal-500/10', border: 'border-teal-500/30', text: 'text-teal-300', dot: 'bg-teal-400' },
      { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-300', dot: 'bg-rose-400' },
      { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-300', dot: 'bg-violet-400' }
    ];
    
    // Generar un índice basado en el hash del methodId
    const hash = methodId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const colorIndex = hash % defaultColors.length;
    return defaultColors[colorIndex];
  }
  
  return colors[methodId];
};

const RevenueBreakdownModal = ({ isOpen, onClose, revenueData, dateRange, formatCurrency: externalFormatCurrency }) => {
  // Bloquear scroll del body usando hook personalizado
  useBodyScrollLock(isOpen);

  // Estado para el modal de agregar método de pago
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  
  // Estados para edición y eliminación
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [methodToDelete, setMethodToDelete] = useState(null);
  const [editingMethod, setEditingMethod] = useState(null);
  
  // Usar el contexto global de métodos de pago
  const {
    allPaymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    removePaymentMethod,
    isStaticMethod
  } = usePaymentMethodsContext();

  // Usar el contexto de notificaciones
  const { showSuccess, showError, showWarning } = useNotification();
  
  if (!isOpen || !revenueData?.summary) return null;

  // Usar el formatCurrency externo si está disponible
  const currencyFormatter = externalFormatCurrency || formatCurrency;



  // Función para manejar la adición/edición de un método de pago
  const handleAddPaymentMethod = (methodData) => {
    if (methodData.isEditing) {
      const success = updatePaymentMethod(methodData.originalBackendId, methodData);
      if (success) {
        showSuccess(`Método de pago "${methodData.name}" actualizado exitosamente`);
      } else {
        showWarning('No se pueden editar métodos de pago predeterminados');
      }
    } else {
      addPaymentMethod(methodData);
      showSuccess(`Método de pago "${methodData.name}" agregado exitosamente`);
    }
  };

  // Función para manejar la edición de un método de pago
  const handleEditPaymentMethod = (methodId) => {
    // Buscar en ambas listas: estática y dinámica
    const method = allPaymentMethods.find(m => m.backendId === methodId);
    setEditingMethod(method);
    setShowAddPaymentModal(true);
  };

  // Función para manejar la eliminación de un método de pago
  const handleDeletePaymentMethod = (methodId) => {
    // Buscar en ambas listas: estática y dinámica
    const method = allPaymentMethods.find(m => m.backendId === methodId);
    setMethodToDelete(method);
    setShowDeleteConfirm(true);
  };

  // Función para confirmar eliminación
  const confirmDeletePaymentMethod = () => {
    if (methodToDelete) {
      
      const success = removePaymentMethod(methodToDelete.backendId);
      if (success) {
        showSuccess(`Método de pago "${methodToDelete.name}" eliminado exitosamente`);
      } else {
        showWarning('No se pueden eliminar métodos de pago predeterminados');
      }
      
      setShowDeleteConfirm(false);
      setMethodToDelete(null);
    }
  };

  // Función para cancelar eliminación
  const cancelDeletePaymentMethod = () => {
    setShowDeleteConfirm(false);
    setMethodToDelete(null);
  };

  // Tipos de ingresos con sus iconos - Usar datos del summary
  const revenueTypes = [
    { 
      id: 'products', 
      name: 'Productos', 
      icon: ShoppingBag, 
      color: 'emerald',
      amount: revenueData.summary?.productRevenue || 0,
      description: 'Venta de productos'
    },
    { 
      id: 'services', 
      name: 'Cortes', 
      icon: Scissors, 
      color: 'blue',
      amount: revenueData.summary?.serviceRevenue || 0,
      description: 'Servicios de barbería'
    },
    { 
      id: 'appointments', 
      name: 'Citas', 
      icon: Calendar, 
      color: 'purple',
      amount: revenueData.summary?.appointmentRevenue || 0,
      description: 'Servicios agendados'
    }
  ];

  // Usar el totalRevenue que viene del backend directamente
  const totalRevenue = revenueData.summary?.totalRevenue || 0;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4 lg:p-8 pt-8 sm:pt-10">
      <div className="relative w-full max-w-xs sm:max-w-md lg:max-w-4xl mx-auto h-[85vh] sm:h-[80vh] lg:h-[75vh] flex flex-col">
        <div className="relative bg-green-500/5 backdrop-blur-md border border-green-500/20 rounded-2xl shadow-2xl shadow-green-500/20 h-full flex flex-col overflow-hidden">
          {/* Header fijo */}
          <div className="relative z-10 flex-shrink-0 p-2 sm:p-3 lg:p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/20 border border-green-500/30">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    Desglose de Ingresos
                  </h3>
                  {dateRange ? (
                    <p className="text-xs sm:text-sm text-green-300">
                      {dateRange.startDate} - {dateRange.endDate}
                    </p>
                  ) : (
                    <p className="text-xs sm:text-sm text-green-300">
                      Ingresos por método de pago
                    </p>
                  )}
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
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-xs text-green-300">Total de ingresos</p>
                <DollarSign className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-lg sm:text-xl font-bold text-green-400">{currencyFormatter(totalRevenue)}</p>
            </div>
          </div>

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-2 sm:px-3 lg:px-4 pb-2 sm:pb-3">
            <div className="space-y-4 pt-4">
              {/* Grid responsivo para métodos de pago */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {allPaymentMethods.map((method) => {
                  // Buscar usando el backendId para mapear correctamente los datos del backend
                  const amount = revenueData.summary?.paymentMethods?.[method.backendId] || 0;
                  const percentage = totalRevenue > 0 ? (amount / totalRevenue * 100) : 0;
                  const colors = getPaymentMethodColor(method.backendId);
                  
                  return (
                    <div 
                      key={method.backendId}
                      className={`group ${colors.bg} ${colors.border} rounded-xl p-4 hover:scale-[1.02] transition-all duration-300 border relative`}
                    >
                      {/* Iconos de editar y eliminar posicionados arriba a la derecha */}
                      <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                        <button
                          onClick={() => handleEditPaymentMethod(method.backendId)}
                          className="p-0.5 rounded bg-blue-500/20 hover:bg-blue-500/30 transition-colors duration-200 border border-blue-500/30 backdrop-blur-sm"
                          title="Editar método de pago"
                        >
                          <Edit3 className="w-2.5 h-2.5 text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleDeletePaymentMethod(method.backendId)}
                          className="p-0.5 rounded bg-red-500/20 hover:bg-red-500/30 transition-colors duration-200 border border-red-500/30 backdrop-blur-sm"
                          title="Eliminar método de pago"
                        >
                          <Trash2 className="w-2.5 h-2.5 text-red-400" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mb-3 pr-12">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${colors.dot}`}></div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className={`font-medium ${colors.text} text-sm`}>{method.name}</h4>
                              {amount === 0 && (
                                <span className="px-1.5 py-0.5 text-xs bg-gray-500/20 text-gray-400 rounded border border-gray-500/30">
                                  Nuevo
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400">{method.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${colors.text}`}>
                            {currencyFormatter(amount)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      {/* Barra de progreso */}
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${colors.dot}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Botón para agregar nuevo método de pago */}
              <div className="mt-6 pt-4 border-t border-green-500/20">
                <button 
                  onClick={() => setShowAddPaymentModal(true)}
                  className="w-full p-4 border-2 border-dashed border-green-500/30 rounded-xl text-green-400 hover:border-green-500/50 hover:bg-green-500/5 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <div className="w-5 h-5 rounded-full border-2 border-green-400 flex items-center justify-center">
                    <span className="text-green-400 text-xs font-bold">+</span>
                  </div>
                  <span className="text-sm font-medium">Agregar nuevo método de pago</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal para agregar nuevo método de pago */}
      <AddPaymentMethodModal
        isOpen={showAddPaymentModal}
        onClose={() => {
          setShowAddPaymentModal(false);
          setEditingMethod(null);
        }}
        onAdd={handleAddPaymentMethod}
        editingMethod={editingMethod}
      />

      {/* Modal de confirmación para eliminar método de pago */}
      {showDeleteConfirm && methodToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 70 }}>
          <div className="relative w-full max-w-md mx-auto">
            <div className="relative bg-red-500/5 backdrop-blur-md border border-red-500/20 rounded-2xl p-6 shadow-2xl shadow-red-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Eliminar Método de Pago
                  </h3>
                  <p className="text-sm text-red-300">
                    Esta acción no se puede deshacer
                  </p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-white mb-2">
                  ¿Estás seguro de que quieres eliminar el método de pago:
                </p>
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-300 font-medium">{methodToDelete.name}</p>
                  <p className="text-xs text-gray-400">{methodToDelete.description}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={cancelDeletePaymentMethod}
                  className="flex-1 px-4 py-2 bg-gray-500/20 border border-gray-500/30 rounded-lg text-gray-300 hover:bg-gray-500/30 transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeletePaymentMethod}
                  className="flex-1 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 hover:bg-red-500/30 transition-all duration-200 font-medium"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueBreakdownModal;