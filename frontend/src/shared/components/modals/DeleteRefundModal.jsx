import { useState } from 'react';
import { Trash2, RotateCcw, AlertTriangle, X, Package, Scissors } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { refundService } from '../../services/refundService';
import { toast } from 'react-toastify';

// Constantes
const SALE_TYPES = {
  PRODUCT: 'product',
  SERVICE: 'service'
};

// Funciones utilitarias
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};

const formatDate = (date) => {
  if (!date) return 'Fecha no disponible';
  try {
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: es });
  } catch (error) {
    return 'Fecha inválida';
  }
};

const getPaymentMethodDisplayName = (method) => {
  const PAYMENT_METHOD_LABELS = {
    'efectivo': 'Efectivo',
    'tarjeta': 'Tarjeta',
    'transferencia': 'Transferencia',
    'daviplata': 'Daviplata',
    'nequi': 'Nequi'
  };
  return PAYMENT_METHOD_LABELS[method] || method || 'No especificado';
};

const getPaymentMethodColor = (method) => {
  const colors = {
    'efectivo': { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
    'tarjeta': { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
    'transferencia': { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
    'daviplata': { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' },
    'nequi': { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400' }
  };
  return colors[method] || { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-400' };
};

const getTypeIcon = (type) => {
  switch (type) {
    case SALE_TYPES.PRODUCT:
      return <Package className="w-4 h-4" />;
    case SALE_TYPES.SERVICE:
      return <Scissors className="w-4 h-4" />;
    default:
      return <Package className="w-4 h-4" />;
  }
};

const getTypeLabel = (type) => {
  switch (type) {
    case SALE_TYPES.PRODUCT:
      return 'Producto';
    case SALE_TYPES.SERVICE:
      return 'Servicio';
    default:
      return 'Item';
  }
};

const DeleteRefundModal = ({ 
  isOpen, 
  onClose, 
  refund, 
  onDelete,
  onRevert,
  isDeleting = false,
  isReverting = false,
  actionType = 'delete' 
}) => {
  const [localDeleting, setLocalDeleting] = useState(false);
  const [localReverting, setLocalReverting] = useState(false);

  if (!isOpen || !refund) return null;

  const handleDelete = async () => {
    try {
      setLocalDeleting(true);
      
      // Usar diferentes formas de obtener el ID
      const refundId = refund._id || refund.saleId || refund.id;
      console.log('🗑️ Eliminando reembolso con ID:', refundId, 'Objeto completo:', refund);
      
      if (onDelete) {
        await onDelete(refundId);
      } else {
        // Fallback si no se pasa el callback
        const result = await refundService.permanentDeleteRefund(refundId);
        if (result.success) {
          toast.success('Reembolso eliminado permanentemente');
          onClose();
        }
      }
    } catch (error) {
      console.error('Error al eliminar reembolso:', error);
      toast.error(error.message || 'Error al eliminar el reembolso');
    } finally {
      setLocalDeleting(false);
    }
  };

  const handleRevert = async () => {
    try {
      setLocalReverting(true);
      
      // Usar diferentes formas de obtener el ID
      const refundId = refund._id || refund.saleId || refund.id;
      console.log('🔄 Revirtiendo reembolso con ID:', refundId, 'Objeto completo:', refund);
      
      if (onRevert) {
        await onRevert(refundId);
      } else {
        // Fallback si no se pasa el callback
        const result = await refundService.revertRefund(refundId);
        if (result.success) {
          toast.success('Reembolso revertido exitosamente');
          onClose();
        }
      }
    } catch (error) {
      console.error('Error al revertir reembolso:', error);
      toast.error(error.message || 'Error al revertir el reembolso');
    } finally {
      setLocalReverting(false);
    }
  };

  const isDelete = actionType === 'delete';
  const isRevert = actionType === 'revert';
  
  // Usar los estados locales o los pasados como props
  const currentlyDeleting = isDeleting || localDeleting;
  const currentlyReverting = isReverting || localReverting;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 sm:p-6 lg:p-8">
      <div className="relative w-full max-w-sm sm:max-w-md mx-auto h-[90vh] sm:h-[85vh] lg:h-[80vh] flex flex-col">
        <div className={`relative backdrop-blur-md border rounded-2xl shadow-2xl h-full flex flex-col overflow-hidden ${
          isDelete 
            ? 'bg-red-500/5 border-red-500/20 shadow-red-500/20'
            : 'bg-amber-500/5 border-amber-500/20 shadow-amber-500/20'
        }`}>
          
          {/* Header fijo */}
          <div className={`relative z-10 flex-shrink-0 p-4 sm:p-6 border-b ${
            isDelete ? 'border-red-500/20' : 'border-amber-500/20'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`p-1.5 sm:p-2 rounded-lg border ${
                  isDelete 
                    ? 'bg-red-500/20 border-red-500/30'
                    : 'bg-amber-500/20 border-amber-500/30'
                }`}>
                  {isDelete ? (
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                  ) : (
                    <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    {isDelete ? 'Eliminar Reembolso' : 'Revertir Reembolso'}
                  </h3>
                  <p className={`text-xs sm:text-sm ${
                    isDelete ? 'text-red-300' : 'text-amber-300'
                  }`}>
                    {isDelete ? 'Eliminación permanente' : 'Restaurar venta original'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={currentlyDeleting || currentlyReverting}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Contenido scrollable con scrollbar personalizado */}
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-800/50 [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-gray-500" 
               style={{ scrollbarWidth: 'thin', scrollbarColor: '#4B5563 #1F2937' }}>
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              
              {/* Descripción de la acción */}
              <div className={`flex items-start space-x-3 p-3 sm:p-4 rounded-lg border ${
                isDelete
                  ? 'bg-red-500/10 border-red-500/20'
                  : 'bg-amber-500/10 border-amber-500/20'
              }`}>
                <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                  isDelete ? 'text-red-400' : 'text-amber-400'
                }`} />
                <div>
                  <p className={`text-sm font-medium mb-1 ${
                    isDelete ? 'text-red-300' : 'text-amber-300'
                  }`}>
                    {isDelete 
                      ? '¿Estás seguro de que deseas eliminar permanentemente este reembolso?'
                      : '¿Estás seguro de que deseas revertir este reembolso?'
                    }
                  </p>
                  <p className={`text-xs ${
                    isDelete ? 'text-red-400/80' : 'text-amber-400/80'
                  }`}>
                    {isDelete
                      ? 'Esta acción eliminará completamente el registro del sistema y generará un log de auditoría.'
                      : 'Esta acción restaurará la venta original y ajustará el inventario si es necesario.'
                    }
                  </p>
                </div>
              </div>

              {/* Detalles del Reembolso */}
              <div className="bg-gray-700/50 rounded-lg p-3 sm:p-4 space-y-4">
                <h4 className="text-white font-semibold text-sm uppercase tracking-wide">
                  Detalles del Reembolso
                </h4>
                
                {/* Nombre del producto/servicio con cantidad */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-1.5 rounded-lg bg-white/10 ${
                      refund.type === SALE_TYPES.PRODUCT ? 'text-blue-400' : 'text-green-400'
                    }`}>
                      {getTypeIcon(refund.type)}
                    </div>
                    <div>
                      <p className="text-white font-semibold">
                        {refund.productName || refund.name || 'Sin nombre'}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-gray-400 text-xs">
                          {getTypeLabel(refund.type)}
                        </p>
                        {refund.type === SALE_TYPES.PRODUCT && refund.quantity && (
                          <span className="text-xs text-blue-400">
                            (x{refund.quantity})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {refund.category && (
                    <span className="text-xs px-2 py-1 bg-white/10 text-gray-300 rounded-md border border-white/20">
                      {refund.category}
                    </span>
                  )}
                </div>

                {/* Grid de información principal */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Monto reembolsado:</p>
                    <p className="text-white font-bold">
                      {formatCurrency(refund.totalAmount || refund.price || refund.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Método de pago:</p>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">
                        {getPaymentMethodDisplayName(refund.paymentMethod)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-400">Fecha de reembolso:</p>
                    <p className="text-white font-semibold">
                      {formatDate(refund.refundedAt || refund.updatedAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Fecha original de venta:</p>
                    <p className="text-white font-semibold">
                      {formatDate(refund.saleDate || refund.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Grid de información adicional */}
                <div className="grid grid-cols-2 gap-4 text-sm border-t border-gray-600 pt-3">
                  <div>
                    <p className="text-gray-400">Barbero:</p>
                    <p className="text-white font-semibold">
                      {refund.barberName || refund.barbero?.name || 'No especificado'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Cliente:</p>
                    <p className="text-white font-semibold">
                      {refund.customerName || 'Cliente walk-in'}
                    </p>
                  </div>
                </div>

                {/* Razón del reembolso */}
                {refund.refundReason && (
                  <div className="border-t border-gray-600 pt-3">
                    <p className="text-gray-400 text-sm mb-2 font-semibold uppercase tracking-wide">Razón del reembolso:</p>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                      <p className="text-amber-200 italic text-sm">"{refund.refundReason}"</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Consecuencias de la acción */}
              <div className={`p-3 sm:p-4 rounded-lg border ${
                isDelete
                  ? 'bg-red-500/10 border-red-500/20'
                  : 'bg-amber-500/10 border-amber-500/20'
              }`}>
                <p className={`font-semibold text-sm mb-2 ${
                  isDelete ? 'text-red-300' : 'text-amber-300'
                }`}>
                  {isDelete ? 'Al eliminar este reembolso:' : 'Al revertir este reembolso:'}
                </p>
                <ul className={`text-xs space-y-1 ${
                  isDelete ? 'text-red-200/90' : 'text-amber-200/90'
                }`}>
                  {isDelete ? (
                    <>
                      <li>• El registro se eliminará permanentemente del sistema</li>
                      <li>• Se generará un log de auditoría con tu usuario</li>
                      <li>• Esta acción NO es reversible</li>
                      <li>• Los reportes se actualizarán automáticamente</li>
                    </>
                  ) : (
                    <>
                      <li>• La venta volverá a su estado original</li>
                      <li>• Se eliminará el motivo del reembolso</li>
                      <li>• Se ajustará el inventario del producto</li>
                      <li>• Se generará un registro en los logs del sistema</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Footer fijo */}
          <div className={`flex-shrink-0 p-4 sm:p-6 border-t ${
            isDelete ? 'border-red-500/20' : 'border-amber-500/20'
          }`}>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                disabled={currentlyDeleting || currentlyReverting}
                className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              
              <button
                onClick={isDelete ? handleDelete : handleRevert}
                disabled={currentlyDeleting || currentlyReverting}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 ${
                  isDelete
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-amber-500 hover:bg-amber-600'
                }`}
              >
                {(currentlyDeleting || currentlyReverting) ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>{isDelete ? 'Eliminando...' : 'Revirtiendo...'}</span>
                  </>
                ) : (
                  <>
                    {isDelete ? (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Eliminar Permanentemente</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4" />
                        <span>Revertir Reembolso</span>
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteRefundModal;