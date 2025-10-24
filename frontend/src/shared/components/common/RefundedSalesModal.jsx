import React, { useState, useEffect } from 'react';
import { X, Minus, Copy, AlertTriangle, Clock, DollarSign, Package, Scissors, Filter, Trash2, RotateCcw } from 'lucide-react';
import { refundService } from '../../services/refundService';
import scrollLockManager from '../../utils/scrollLockManager';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  SALE_TYPES, 
  SALE_TYPE_LABELS,
  PAYMENT_METHOD_LABELS 
} from '../../constants/salesConstants';
import DeleteRefundModal from '../modals/DeleteRefundModal';

const RefundedSalesModal = ({ isOpen, onClose, isAdmin = false }) => {
  const [refundedSales, setRefundedSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [verificationCode, setVerificationCode] = useState(null);
  const [codeExpiration, setCodeExpiration] = useState(null);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: '',
    category: '',
    paymentMethod: '',
    page: 1,
    limit: 10
  });
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState([]);
  
  // Estados para el modal de eliminar reembolso
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [refundToDelete, setRefundToDelete] = useState(null);
  const [deletingRefund, setDeletingRefund] = useState(false);
  const [revertingRefund, setRevertingRefund] = useState(false);
  const [modalActionType, setModalActionType] = useState('delete'); // 'delete' o 'revert'

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      scrollLockManager.lock();
      
      // Cleanup function solo si el modal está abierto
      return () => {
        scrollLockManager.unlock();
      };
    } else {
      scrollLockManager.unlock();
    }
  }, [isOpen]);

  // Cleanup adicional al desmontar el componente - solo si estaba abierto
  useEffect(() => {
    return () => {
      if (isOpen) {
        scrollLockManager.unlock();
      }
    };
  }, []);

  // Cargar datos cuando el modal se abre
  useEffect(() => {
    if (isOpen) {
      loadRefundedSales();
      if (isAdmin) {
        loadVerificationCode();
      }
    }
  }, [isOpen, filters]);

  // Si el modal no está abierto, no renderizar nada
  if (!isOpen) return null;

  const loadRefundedSales = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await refundService.getRefundedSales(filters);
      const salesData = response.data || [];
      
      // Ordenar por fecha más reciente primero
      const sortedSales = salesData.sort((a, b) => {
        const dateA = new Date(a.refundedAt || a.updatedAt || a.saleDate || a.createdAt);
        const dateB = new Date(b.refundedAt || b.updatedAt || b.saleDate || b.createdAt);
        return dateB - dateA; // Más reciente primero
      });
      
      setRefundedSales(sortedSales);
      setStats(response.stats);
      
      // Actualizar opciones de filtros
      updateFilterOptions(sortedSales);
    } catch (err) {
      setError('Error al cargar las ventas reembolsadas');
      console.error('Error loading refunded sales:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateFilterOptions = (sales) => {
    // Extraer categorías únicas
    const categories = [...new Set(
      sales
        .map(sale => sale.category)
        .filter(Boolean)
    )].sort();
    
    // Extraer métodos de pago únicos
    const paymentMethods = [...new Set(
      sales
        .map(sale => sale.paymentMethod)
        .filter(Boolean)
    )].sort();
    
    setAvailableCategories(categories);
    setAvailablePaymentMethods(paymentMethods);
  };

  const loadVerificationCode = async () => {
    if (!isAdmin) return;
    try {
      const response = await refundService.getVerificationCode();
      if (response?.data) {
        setVerificationCode(response.data.code);
        setCodeExpiration(Date.now() + (response.data.timeUntilNext || 3600000));
      }
    } catch (err) {
      console.error('Error loading verification code:', err);
    }
  };

  const copyCodeToClipboard = async (event) => {
    console.log('Función copyCodeToClipboard ejecutada, código:', verificationCode);
    
    if (verificationCode) {
      try {
        await navigator.clipboard.writeText(verificationCode);
        
        // Mostrar feedback visual directo en el elemento clickeado
        const buttonElement = event.currentTarget;
        const spanElement = buttonElement.querySelector('[data-code-display]');
        
        if (spanElement) {
          const originalContent = spanElement.textContent;
          const originalClasses = spanElement.className;
          
          spanElement.textContent = '¡COPIADO!';
          spanElement.className = originalClasses + ' text-green-800';
          buttonElement.className = buttonElement.className.replace('bg-white/60', 'bg-green-100/80');
          
          setTimeout(() => {
            spanElement.textContent = originalContent;
            spanElement.className = originalClasses;
            buttonElement.className = buttonElement.className.replace('bg-green-100/80', 'bg-white/60');
          }, 1500);
        }
        
        console.log('Código copiado:', verificationCode);
      } catch (err) {
        console.error('Error al copiar código:', err);
        // Fallback para navegadores que no soportan clipboard API
        try {
          const textArea = document.createElement('textarea');
          textArea.value = verificationCode;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          console.log('Código copiado con fallback:', verificationCode);
        } catch (fallbackErr) {
          console.error('Error en fallback:', fallbackErr);
        }
      }
    }
  };

  // Funciones para manejar eliminación de reembolsos
  const handleDeleteRefund = (refund) => {
    console.log('🗑️ Preparando eliminación permanente de reembolso:', refund);
    setRefundToDelete(refund);
    setModalActionType('delete');
    setDeleteModalOpen(true);
  };

  const handleRevertRefund = (refund) => {
    console.log('🔄 Preparando reversión de reembolso:', refund);
    setRefundToDelete(refund);
    setModalActionType('revert');
    setDeleteModalOpen(true);
  };

  const confirmDeleteRefund = async (refundId) => {
    try {
      setDeletingRefund(true);
      
      await refundService.permanentDeleteRefund(refundId);
      
      // Actualizar la lista de reembolsos
      await loadRefundedSales();
      
      setDeleteModalOpen(false);
      setRefundToDelete(null);
      
      console.log('✅ Reembolso eliminado permanentemente:', refundId);
    } catch (error) {
      console.error('❌ Error eliminando reembolso:', error);
    } finally {
      setDeletingRefund(false);
    }
  };

  const confirmRevertRefund = async (refundId) => {
    try {
      setRevertingRefund(true);
      
      await refundService.deleteRefund(refundId);
      
      // Actualizar la lista de reembolsos
      await loadRefundedSales();
      
      setDeleteModalOpen(false);
      setRefundToDelete(null);
      
      console.log('✅ Reembolso revertido exitosamente:', refundId);
    } catch (error) {
      console.error('❌ Error revirtiendo reembolso:', error);
    } finally {
      setRevertingRefund(false);
    }
  };

  const closeDeleteModal = () => {
    if (!deletingRefund && !revertingRefund) {
      setDeleteModalOpen(false);
      setRefundToDelete(null);
      setModalActionType('delete');
    }
  };

  const formatCurrency = (amount) => {
    try {
      if (amount === null || amount === undefined || isNaN(amount)) return '$0';
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(Number(amount));
    } catch (error) {
      console.warn('Error formateando moneda:', amount, error);
      return '$0';
    }
  };

  const formatDate = (date) => {
    try {
      if (!date) return 'No disponible';
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return 'Fecha inválida';
      return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: es });
    } catch (error) {
      console.warn('Error formateando fecha:', date, error);
      return 'Error en fecha';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case SALE_TYPES.PRODUCT:
        return <Package className="w-4 h-4 text-blue-400" />;
      case SALE_TYPES.SERVICE:
        return <Scissors className="w-4 h-4 text-green-400" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTimeUntilExpiration = () => {
    if (!codeExpiration) return '';
    const remaining = Math.max(0, codeExpiration - Date.now());
    const minutes = Math.ceil(remaining / 60000);
    return minutes > 0 ? `${minutes} min` : 'Expirando...';
  };

  const getPaymentMethodDisplayName = (method) => {
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
    return colors[method?.toLowerCase()] || { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-400' };
  };

  const toggleFilters = () => {
    setFiltersExpanded(!filtersExpanded);
  };

  const hasActiveFilters = () => {
    return filters.startDate || filters.endDate || filters.type || filters.category || filters.paymentMethod;
  };

  if (!isOpen) return null;

  // Error boundary para evitar crashes
  try {
    return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 sm:p-6 lg:p-8">
      <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto h-[90vh] sm:h-[85vh] lg:h-[80vh] flex flex-col">
        <div className="relative bg-white/5 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl shadow-white/20 h-full flex flex-col overflow-hidden">
          
          {/* Header fijo */}
          <div className="relative z-10 flex-shrink-0 p-2 sm:p-3 border-b border-white/20 bg-white/10 backdrop-blur-md border border-white/30 rounded-t-2xl shadow-lg shadow-white/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="p-1 rounded-lg bg-gradient-to-br from-white/30 to-slate-100/25 backdrop-blur-sm border border-white/40 shadow-lg">
                  <Minus className="w-3 h-3 sm:w-4 sm:h-4 text-black" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-black drop-shadow-sm">
                    Ventas Reembolsadas
                  </h3>
                  <p className="text-xs text-black font-medium">
                    Gestión de reembolsos del sistema
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1 sm:p-1.5 bg-gradient-to-br from-slate-100/60 to-white/40 backdrop-blur-sm border border-slate-300/40 rounded-lg text-black hover:from-slate-200/70 hover:to-white/50 hover:border-slate-400/50 hover:text-black transition-all duration-200 shadow-lg"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* Código de verificación admin y estadísticas */}
            {isAdmin && verificationCode && (
              <div className="bg-transparent px-3 py-2 mb-3">
                {/* Header con título y tiempo - alineado a la izquierda */}
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span className="font-bold text-black text-sm">Código de Verificación</span>
                  <Clock className="w-3 h-3 text-amber-700" />
                  <span className="text-xs text-black font-medium">{getTimeUntilExpiration()}</span>
                </div>
                
                {/* Layout horizontal: código y estadísticas al mismo nivel */}
                <div className="grid grid-cols-4 gap-3 items-center">
                  {/* Código de verificación */}
                  <div className="bg-transparent text-center">
                    <p className="text-xs text-black font-semibold mb-1">Código</p>
                    <button
                      onClick={copyCodeToClipboard}
                      className="bg-transparent text-base font-mono text-slate-900 font-bold tracking-[0.2em] hover:scale-105 transition-all duration-300 cursor-copy group active:scale-95"
                      title="Clic para copiar el código"
                    >
                      <span 
                        data-code-display 
                        className="group-hover:scale-105 transition-all duration-200 select-none text-slate-900 drop-shadow-sm"
                      >
                        {verificationCode}
                      </span>
                    </button>
                  </div>
                  
                  {/* Estadísticas distribuidas uniformemente */}
                  {stats && (
                    <>
                      <div className="bg-transparent text-center">
                        <p className="text-xs text-black font-semibold mb-1">Total</p>
                        <p className="text-sm font-bold text-slate-900">{formatCurrency(stats.totalAmount)}</p>
                      </div>
                      <div className="bg-transparent text-center">
                        <p className="text-xs text-black font-semibold mb-1">Cantidad</p>
                        <p className="text-sm font-bold text-slate-900">{stats.totalRefunded}</p>
                      </div>
                      <div className="bg-transparent text-center">
                        <p className="text-xs text-black font-semibold mb-1">Página</p>
                        <p className="text-sm font-bold text-slate-900">{stats.currentPage}/{stats.totalPages}</p>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Descripción centrada */}
                <div className="text-center mt-2">
                  <p className="text-xs text-black font-medium bg-transparent">
                    Los barberos necesitan este código para procesar reembolsos. Se renueva cada hora.
                  </p>
                </div>
              </div>
            )}

            {/* Filtros colapsables */}
            <div className="border-b border-white/20 pb-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs sm:text-sm font-medium text-black flex items-center gap-1 sm:gap-2">
                  <Filter className="w-3 h-3 sm:w-4 sm:h-4 text-black" />
                  Filtros
                  {hasActiveFilters() && (
                    <span className="w-2 h-2 bg-black rounded-full"></span>
                  )}
                </h4>
                <button
                  onClick={toggleFilters}
                  className="text-xs text-black hover:text-black transition-colors px-1 font-medium"
                >
                  {filtersExpanded ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>

              {filtersExpanded && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3 animate-in slide-in-from-top-2 duration-200">
                  <div>
                    <label className="block text-xs text-black font-medium mb-1">Fecha Inicio:</label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
                      className="w-full px-3 py-2 bg-white/20 backdrop-blur-md border border-white/40 rounded-2xl text-black text-sm shadow-lg focus:bg-white/30 focus:border-white/60 transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-black font-medium mb-1">Fecha Fin:</label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
                      className="w-full px-3 py-2 bg-white/20 backdrop-blur-md border border-white/40 rounded-2xl text-black text-sm shadow-lg focus:bg-white/30 focus:border-white/60 transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-black font-medium mb-1">Tipo:</label>
                    <select
                      value={filters.type}
                      onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
                      className="w-full px-3 py-2 bg-white/20 backdrop-blur-md border border-white/40 rounded-2xl text-black text-sm shadow-lg focus:bg-white/30 focus:border-white/60 transition-all duration-300"
                    >
                      <option value="">Todos los tipos</option>
                      <option value={SALE_TYPES.PRODUCT}>{SALE_TYPE_LABELS[SALE_TYPES.PRODUCT]}</option>
                      <option value={SALE_TYPES.SERVICE}>{SALE_TYPE_LABELS[SALE_TYPES.SERVICE]}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-black font-medium mb-1">Categoría:</label>
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
                      className="w-full px-3 py-2 bg-white/20 backdrop-blur-md border border-white/40 rounded-2xl text-black text-sm shadow-lg focus:bg-white/30 focus:border-white/60 transition-all duration-300"
                    >
                      <option value="">Todas las categorías</option>
                      {availableCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-black font-medium mb-1">Método de Pago:</label>
                    <select
                      value={filters.paymentMethod}
                      onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value, page: 1 })}
                      className="w-full px-3 py-2 bg-white/20 backdrop-blur-md border border-white/40 rounded-2xl text-black text-sm shadow-lg focus:bg-white/30 focus:border-white/60 transition-all duration-300"
                    >
                      <option value="">Todos los métodos</option>
                      {availablePaymentMethods.map((method) => (
                        <option key={method} value={method}>
                          {getPaymentMethodDisplayName(method)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-black font-medium mb-1">Por Página:</label>
                    <select
                      value={filters.limit}
                      onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value), page: 1 })}
                      className="w-full px-3 py-2 bg-white/50 backdrop-blur-sm border border-white/40 rounded-xl text-black text-sm shadow-lg focus:bg-white/70 focus:border-white/60 transition-all duration-200"
                    >
                      <option value="10">10 por página</option>
                      <option value="25">25 por página</option>
                      <option value="50">50 por página</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            
            {/* Estadísticas para usuarios no admin */}
            {!isAdmin && stats && (
              <div className="mt-3 flex flex-wrap gap-2">
                <div className="bg-gradient-to-br from-red-50/70 to-rose-100/60 backdrop-blur-sm border border-red-300/40 rounded-lg px-3 py-2 min-w-0 shadow-sm">
                  <p className="text-xs text-black font-semibold">Total Reembolsado</p>
                  <p className="text-xs font-bold text-slate-900">{formatCurrency(stats.totalAmount)}</p>
                </div>
                <div className="bg-gradient-to-br from-slate-50/70 to-gray-100/60 backdrop-blur-sm border border-slate-300/40 rounded-lg px-3 py-2 min-w-0 shadow-sm">
                  <p className="text-xs text-black font-semibold">Cantidad</p>
                  <p className="text-xs font-bold text-slate-900">{stats.totalRefunded}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50/70 to-indigo-100/60 backdrop-blur-sm border border-blue-300/40 rounded-lg px-3 py-2 min-w-0 shadow-sm">
                  <p className="text-xs text-black font-semibold">Página</p>
                  <p className="text-xs font-bold text-slate-900">{stats.currentPage}/{stats.totalPages}</p>
                </div>
              </div>
            )}
          </div>

          {/* Contenido con scroll */}
          <div className="flex-1 overflow-hidden flex flex-col">
            


            {/* Lista de ventas reembolsadas */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {loading && (
                <div className="flex justify-center items-center py-8">
                  <div className="w-8 h-8 border-3 border-slate-200 border-t-indigo-600 rounded-full animate-spin shadow-lg"></div>
                  <p className="ml-3 text-black font-medium">Cargando reembolsos...</p>
                </div>
              )}

              {error && (
                <div className="text-center py-8">
                  <div className="bg-red-500/10 backdrop-blur-md border border-red-500/30 rounded-2xl p-4 max-w-md mx-auto shadow-lg shadow-red-500/10">
                    <div className="flex items-center justify-center mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                      <span className="font-semibold text-red-800">Error</span>
                    </div>
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}

              {!loading && !error && refundedSales.length === 0 && (
                <div className="text-center py-8">
                  <div className="bg-white/10 backdrop-blur-md border border-white/30 rounded-2xl p-6 max-w-md mx-auto shadow-lg shadow-white/10">
                    <Minus className="w-12 h-12 text-black mx-auto mb-3" />
                    <p className="text-black font-semibold mb-1">No se encontraron ventas reembolsadas</p>
                    <p className="text-black text-sm">Intenta ajustar los filtros de búsqueda</p>
                  </div>
                </div>
              )}

              {!loading && !error && refundedSales.length > 0 && (
                <div className="space-y-2">
                  {refundedSales.map((sale) => {
                    // Validación segura de datos
                    if (!sale || !sale._id) return null;
                    
                    return (
                      <div key={sale._id} className="relative group bg-white/10 backdrop-blur-md border border-white/30 rounded-xl p-2 shadow-lg shadow-white/10 hover:shadow-xl hover:shadow-white/20 hover:bg-white/15 transition-all duration-300">
                        
                        {/* Botones de acción - abajo a la derecha */}
                        {isAdmin && (
                          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1 z-10">
                            {/* Botón para revertir */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRevertRefund(sale);
                              }}
                              className="p-1.5 bg-amber-500/80 hover:bg-amber-600/90 text-white rounded-lg shadow-lg backdrop-blur-sm border border-amber-400/50 hover:border-amber-300"
                              title="Revertir reembolso"
                            >
                              <RotateCcw size={12} />
                            </button>
                            
                            {/* Botón para eliminar permanentemente */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRefund(sale);
                              }}
                              className="p-1.5 bg-red-500/80 hover:bg-red-600/90 text-white rounded-lg shadow-lg backdrop-blur-sm border border-red-400/50 hover:border-red-300"
                              title="Eliminar permanentemente"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                        
                        {/* Header compacto con tipo, nombre y badge */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-1">
                              <div className="flex items-center gap-1">
                                {getTypeIcon(sale.type)}
                                <span className="text-xs font-medium text-black">
                                  {sale.type === SALE_TYPES.PRODUCT ? 'Producto' : 'Servicio'}
                                </span>
                                {sale.type === SALE_TYPES.PRODUCT && sale.quantity && (
                                  <span className="text-xs text-black">
                                    (x{sale.quantity})
                                  </span>
                                )}
                              </div>
                              <span className="text-xs px-1.5 py-0.5 bg-white/20 backdrop-blur-sm text-black font-semibold rounded-full border border-white/40 shadow-sm">
                                REEMBOLSADO
                              </span>
                            </div>
                            
                            <h4 className="font-bold text-black text-sm mb-1 truncate">
                              {sale.productName || sale.name || 'Producto/Servicio'}
                            </h4>
                            
                            {/* Información básica en línea más compacta */}
                            <div className="flex items-center justify-between text-xs mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-black font-medium">
                                  {formatDate(sale.refundedAt || sale.updatedAt)}
                                </span>
                              </div>
                              {sale.category && (
                                <span className="text-xs text-slate-700 bg-white/20 px-1.5 py-0.5 rounded-md border border-white/30">
                                  {sale.category}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Monto y método de pago más compacto */}
                          <div className="text-right ml-2 flex-shrink-0">
                            <p className="text-black font-bold text-sm mb-1">
                              {sale.totalAmount ? formatCurrency(sale.totalAmount) : (sale.price ? formatCurrency(sale.price) : '$0')}
                            </p>
                            <span className={`text-xs px-1.5 py-0.5 rounded-md border ${getPaymentMethodColor(sale.paymentMethod).bg} ${getPaymentMethodColor(sale.paymentMethod).border} ${getPaymentMethodColor(sale.paymentMethod).text} font-medium`}>
                              {getPaymentMethodDisplayName(sale.paymentMethod)}
                            </span>
                          </div>
                        </div>
                            
                        {/* Grid de información detallada más compacto */}
                        <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                          <div>
                            <p className="text-black text-xs font-semibold uppercase tracking-wide">Barbero</p>
                            <p className="text-slate-900 font-bold text-xs">{sale.barberName || sale.barbero?.name || 'No especificado'}</p>
                          </div>
                          <div>
                            <p className="text-black text-xs font-semibold uppercase tracking-wide">Fecha Original</p>
                            <p className="text-slate-900 font-semibold text-xs">{formatDate(sale.saleDate || sale.createdAt)}</p>
                          </div>
                          <div>
                            <p className="text-black text-xs font-semibold uppercase tracking-wide">Cliente</p>
                            <p className="text-slate-900 font-semibold text-xs">{sale.customerName || 'Cliente'}</p>
                          </div>
                        </div>
                        
                        {/* Razón del reembolso más compacta */}
                        {sale.refundReason && (
                          <div className="bg-gradient-to-r from-amber-50/60 to-yellow-50/50 backdrop-blur-sm border border-amber-200/50 rounded-lg p-2 shadow-sm">
                            <p className="text-black text-xs font-semibold mb-0.5 uppercase tracking-wide">Razón:</p>
                            <p className="text-slate-900 text-xs font-medium italic">"{sale.refundReason}"</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Paginación */}
            {stats && stats.totalPages > 1 && (
              <div className="flex-shrink-0 p-4 border-t border-white/20 bg-white/5 backdrop-blur-sm">
                <div className="flex justify-center items-center gap-4">
                  <button
                    onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
                    disabled={filters.page === 1}
                    className="px-4 py-2 bg-white/20 backdrop-blur-md border border-white/40 text-black font-semibold rounded-2xl hover:bg-white/30 hover:border-white/50 disabled:bg-white/10 disabled:text-gray-500 disabled:cursor-not-allowed text-sm shadow-lg transition-all duration-300"
                  >
                    Anterior
                  </button>
                  <div className="bg-white/20 backdrop-blur-md border border-white/40 rounded-2xl px-3 py-1.5 shadow-sm">
                    <span className="text-black text-xs font-bold">
                      Página {filters.page} de {stats.totalPages}
                    </span>
                  </div>
                  <button
                    onClick={() => setFilters({ ...filters, page: Math.min(stats.totalPages, filters.page + 1) })}
                    disabled={filters.page === stats.totalPages}
                    className="px-4 py-2 bg-white/20 backdrop-blur-md border border-white/40 text-black font-semibold rounded-2xl hover:bg-white/30 hover:border-white/50 disabled:bg-white/10 disabled:text-gray-500 disabled:cursor-not-allowed text-sm shadow-lg transition-all duration-300"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal de confirmación para eliminar o revertir reembolso */}
      <DeleteRefundModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        refund={refundToDelete}
        onDelete={confirmDeleteRefund}
        onRevert={confirmRevertRefund}
        isDeleting={deletingRefund}
        isReverting={revertingRefund}
        actionType={modalActionType}
      />
    </div>
    );
  } catch (renderError) {
    console.error('Error renderizando RefundedSalesModal:', renderError);
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
        <div className="bg-gradient-to-br from-white/40 to-slate-50/30 backdrop-blur-xl border border-slate-300/50 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-slate-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-red-100/70 to-rose-100/60 backdrop-blur-sm border border-red-300/50 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-black">Error en el Modal</h3>
          </div>
          <p className="text-black font-medium mb-4">
            Ocurrió un error al cargar el modal de ventas reembolsadas. Por favor, inténtalo de nuevo.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gradient-to-r from-red-500/80 to-rose-600/80 backdrop-blur-sm text-white font-semibold rounded-xl hover:from-red-600/90 hover:to-rose-700/90 transition-all duration-200 shadow-lg border border-red-400/50"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }
};

export default RefundedSalesModal;