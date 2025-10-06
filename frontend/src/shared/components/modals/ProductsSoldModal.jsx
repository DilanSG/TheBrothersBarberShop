import React, { useState, useEffect } from 'react';
import { X, Package, CreditCard, Filter } from 'lucide-react';
import { SALE_TYPES } from '../../constants/salesConstants';

const ProductsSoldModal = ({ isOpen, onClose, dateRange, dashboardData }) => {
  const [productSales, setProductSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState([]);
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  // Función para convertir ID del método de pago a nombre legible
  const getPaymentMethodDisplayName = (methodId) => {
    const paymentNames = {
      'cash': 'Efectivo',
      'nequi': 'Nequi',
      'daviplata': 'Daviplata',
      'bancolombia': 'Bancolombia',
      'nu': 'Nu Bank',
      'tarjeta': 'Tarjeta',
      'transferencia': 'Transferencia',
      'digital': 'Pago Digital',
      'pagodigital': 'Pago Digital'
    };
    
    const methodLower = methodId?.toLowerCase() || '';
    for (const [key, displayName] of Object.entries(paymentNames)) {
      if (methodLower.includes(key)) {
        return displayName;
      }
    }
    return methodId || 'Método desconocido';
  };

  // Colores para métodos de pago
  const getPaymentMethodColor = (method) => {
    const colors = {
      'cash': { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-300' },
      'nequi': { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-300' },
      'daviplata': { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-300' },
      'bancolombia': { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-300' },
      'nu': { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-300' },
      'tarjeta': { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-300' },
      'transferencia': { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-300' },
      'digital': { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-300' },
      'pagodigital': { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-300' }
    };
    const methodLower = method?.toLowerCase() || '';
    for (const [key, color] of Object.entries(colors)) {
      if (methodLower.includes(key)) {
        return color;
      }
    }
    return { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-300' };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Bloquear scroll del body
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = 'unset'; };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadProductSales();
    }
  }, [isOpen, dateRange]);

  useEffect(() => {
    let filtered = productSales;
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(sale => sale.paymentMethod === paymentMethodFilter);
    }
    setFilteredSales(filtered);
  }, [productSales, paymentMethodFilter]);

  const loadProductSales = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // ✅ Usar el rango de fechas del dashboard en lugar de hardcoded últimos 30 días
      let startDateStr, endDateStr;
      
      if (dateRange?.startDate && dateRange?.endDate) {
        startDateStr = dateRange.startDate;
        endDateStr = dateRange.endDate;
      } else {
        const endDate = new Date();
        const startDate = new Date('2020-01-01');
        
        startDateStr = startDate.toISOString().split('T')[0];
        endDateStr = endDate.toISOString().split('T')[0];
      }
      
      if (dashboardData?.summary?.totalProductSales) {
        const allSalesResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/sales`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (allSalesResponse.ok) {
          const allSalesResult = await allSalesResponse.json();
          const allSales = allSalesResult.data || [];
          
          const allProductSales = allSales.filter(sale => {
            const hasProductType = sale.type === SALE_TYPES.PRODUCT;
            const hasProductId = sale.productId && sale.productId !== null && sale.productId !== '';
            const hasProductName = sale.productName && sale.productName !== null && sale.productName !== '';
            const notRefunded = sale.status !== 'refunded';
            const notCancelled = sale.status !== 'cancelled';
            
            return (hasProductType || hasProductId || hasProductName) && notRefunded && notCancelled;
          });
          
          const expectedCount = dashboardData.summary.totalProductSales;
          const sortedProducts = allProductSales.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          const topProducts = sortedProducts.slice(0, expectedCount);
          
          const uniquePaymentMethods = [...new Set(topProducts.map(sale => sale.paymentMethod))];
          setAvailablePaymentMethods(uniquePaymentMethods);
          setProductSales(topProducts);
        }
        return;
      }
      
      // FALLBACK: Consulta normal por fecha si no hay dashboardData
      const allSalesResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/sales?startDate=${startDateStr}&endDate=${endDateStr}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (allSalesResponse.ok) {
        const allSalesResult = await allSalesResponse.json();
        const allSales = allSalesResult.data || [];
        
        const productSalesFiltered = allSales.filter(sale => {
          const hasProductType = sale.type === SALE_TYPES.PRODUCT;
          const hasProductIdentifier = sale.productId || sale.productName;
          const notRefunded = sale.status !== 'refunded';
          
          return (hasProductType || hasProductIdentifier) && notRefunded;
        });
        
        const uniquePaymentMethods = [...new Set(productSalesFiltered.map(sale => sale.paymentMethod))];
        setAvailablePaymentMethods(uniquePaymentMethods);
        setProductSales(productSalesFiltered);
      }
    } catch (error) {
      console.error('Error al cargar ventas de productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCountByPaymentMethod = (method) => {
    if (method === 'all') return productSales.length;
    return productSales.filter(sale => sale.paymentMethod === method).length;
  };

  const toggleFilters = () => {
    setFiltersExpanded(!filtersExpanded);
  };

  const hasActiveFilters = () => {
    return paymentMethodFilter !== 'all';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4 lg:p-8 pt-8 sm:pt-10">
      <div className="relative w-full max-w-xs sm:max-w-md lg:max-w-2xl mx-auto h-[85vh] sm:h-[80vh] lg:h-[75vh] flex flex-col">
        <div className="relative bg-orange-500/5 backdrop-blur-md border border-orange-500/20 rounded-2xl shadow-2xl shadow-orange-500/20 h-full flex flex-col overflow-hidden">
          {/* Header fijo */}
          <div className="relative z-10 flex-shrink-0 p-2 sm:p-3 lg:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="p-1 sm:p-1.5 rounded-lg bg-orange-500/20 border border-orange-500/30">
                  <Package className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-white">
                    Productos Vendidos
                  </h3>
                  {dateRange ? (
                    <p className="text-xs text-orange-300">
                      {dateRange.startDate} - {dateRange.endDate}
                    </p>
                  ) : (
                    <p className="text-xs text-orange-300">
                      Detalle de ventas de productos
                    </p>
                  )}
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1 sm:p-1.5 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors duration-200 touch-manipulation"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
            {/* Resumen - USAR DATOS DEL DASHBOARD para consistencia */}
            <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="text-center">
                  <p className="text-xs text-orange-300">Total Ventas</p>
                  <p className="text-sm sm:text-base font-bold text-white">
                    {dashboardData?.summary?.totalProductSales || filteredSales.length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-orange-300">Total Productos</p>
                  <p className="text-sm sm:text-base font-bold text-orange-400">
                    {dashboardData?.summary?.productRevenue 
                      ? formatCurrency(dashboardData.summary.productRevenue)
                      : formatCurrency(filteredSales.reduce((total, sale) => total + (sale.totalAmount || sale.total || sale.amount || 0), 0))
                    }
                  </p>
                </div>
              </div>

            </div>
            {/* Filtros */}
            <div className="p-2 sm:p-3 border-b border-orange-500/10 flex-shrink-0">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <h4 className="text-xs sm:text-sm font-medium text-orange-300 flex items-center gap-1 sm:gap-2">
                  <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                  Filtros
                </h4>
                <button
                  onClick={toggleFilters}
                  className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
                >
                  {filtersExpanded ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>

              {filtersExpanded && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-orange-300 mb-1">Método de Pago:</label>
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => setPaymentMethodFilter('all')}
                        className={`px-2 py-1 rounded text-xs border transition-all duration-300 ${
                          paymentMethodFilter === 'all'
                            ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                            : 'bg-white/5 text-gray-300 border-white/20 hover:border-orange-500/40'
                        }`}
                      >
                        Todos ({filteredSales.length})
                      </button>
                      {availablePaymentMethods.map((method) => {
                        const count = productSales.filter(s => s.paymentMethod === method).length;
                        const colors = getPaymentMethodColor(method);
                        return (
                          <button
                            key={method}
                            onClick={() => setPaymentMethodFilter(method)}
                            className={`px-2 py-1 rounded text-xs border transition-all duration-300 ${
                              paymentMethodFilter === method
                                ? `${colors.bg} ${colors.text} ${colors.border}`
                                : 'bg-white/5 text-gray-300 border-white/20 hover:border-orange-500/40'
                            }`}
                          >
                            {getPaymentMethodDisplayName(method)} ({count})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-2 sm:px-3 lg:px-4 pb-2 sm:pb-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mb-4"></div>
                <p className="text-orange-300">Cargando ventas...</p>
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-4 rounded-full bg-orange-500/10 border border-orange-500/20 mb-4">
                  <Package className="w-8 h-8 text-orange-400" />
                </div>
                <p className="text-gray-400">No hay ventas de productos</p>
                <p className="text-orange-300 text-sm mt-1">
                  No se encontraron ventas con los filtros seleccionados
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {filteredSales.map((sale, index) => {
                  const methodColor = getPaymentMethodColor(sale.paymentMethod);
                  return (
                    <div
                      key={sale._id || index}
                      className={`group relative p-3 sm:p-4 ${methodColor.bg} border ${methodColor.border} rounded-lg sm:rounded-xl hover:scale-[1.02] transition-all duration-300`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className={`p-1.5 sm:p-2 ${methodColor.bg} rounded-lg border ${methodColor.border} flex-shrink-0`}>
                            <Package className={`w-3 h-3 sm:w-4 sm:h-4 ${methodColor.text}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                              <h4 className="font-medium text-white text-xs sm:text-sm truncate">
                                {sale.productName || 'Producto'}
                              </h4>
                              <div className="flex gap-1 flex-wrap">
                                <span className={`px-1.5 sm:px-2 py-0.5 ${methodColor.bg} ${methodColor.text} border ${methodColor.border} rounded-full text-xs font-medium self-start flex-shrink-0`}>
                                  {getPaymentMethodDisplayName(sale.paymentMethod)}
                                </span>
                              </div>
                            </div>
                            <p className={`text-xs ${methodColor.text} mb-1 sm:mb-2`}>
                              {sale.barberName && `${sale.barberName} • `}
                              {formatDate(sale.saleDate || sale.createdAt)}
                            </p>
                            {sale.notes && (
                              <p className="text-xs text-gray-400 mt-1 truncate">{sale.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className={`text-sm sm:text-base font-bold ${methodColor.text}`}>
                            {formatCurrency(sale.totalAmount || sale.total || sale.amount || 0)}
                          </div>
                          <div className="text-xs text-gray-400">
                            Producto
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {/* Footer con botón de cerrar */}
          <div className="flex-shrink-0 p-2 sm:p-3 border-t border-orange-500/20">
            <button
              onClick={onClose}
              className="group relative w-full px-3 py-2 sm:py-2.5 bg-gradient-to-r from-orange-600/20 to-yellow-600/20 border border-orange-500/30 rounded-xl text-orange-300 hover:from-orange-600/30 hover:to-yellow-600/30 hover:border-orange-500/50 transition-all duration-300 font-medium shadow-xl shadow-orange-500/20 overflow-hidden touch-manipulation"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-400/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
              <span className="relative flex items-center justify-center gap-2">
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-sm">Cerrar</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsSoldModal;
