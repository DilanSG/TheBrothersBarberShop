import React, { useState, useEffect } from 'react';
import { X, Scissors, CreditCard, Filter } from 'lucide-react';
import { SALE_TYPES } from '../../constants/salesConstants';

const ServicesBreakdownModal = ({ isOpen, onClose, revenueData, dashboardData, dateRange, formatCurrency: externalFormatCurrency }) => {
  const [serviceSales, setServiceSales] = useState([]);
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
      'nu': 'Nu',
      'digital': 'Digital'
    };
    
    return paymentNames[methodId] || methodId || 'Método desconocido';
  };

  // Colores para métodos de pago
  const getPaymentMethodColor = (method) => {
    const colors = {
      'cash': { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-300' },

      'nequi': { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-300' },
      'daviplata': { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-300' },
      'bancolombia': { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-300' },
      'nu': { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-300' },
      'digital': { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-300' }
    };
    
    return colors[method] || { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-300' };
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
      loadServiceSales();
    }
  }, [isOpen, dateRange, dashboardData]); // ✅ Agregar dashboardData como dependencia

  useEffect(() => {
    let filtered = serviceSales;
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(sale => sale.paymentMethod === paymentMethodFilter);
    }
    setFilteredSales(filtered);
  }, [serviceSales, paymentMethodFilter]);

  const loadServiceSales = async () => {
    setLoading(true);
    try {
      console.log('✂️ Cargando ventas individuales de servicios...');
      
      const token = localStorage.getItem('token');
      
      // ✅ Construir URL con filtros de fecha si están disponibles
      let salesUrl = `${import.meta.env.VITE_API_URL}/sales`;
      
      if (dateRange) {
        const searchParams = new URLSearchParams();
        searchParams.append('startDate', dateRange.startDate);
        searchParams.append('endDate', dateRange.endDate);
        salesUrl += `?${searchParams.toString()}`;
      }
      
      const allSalesResponse = await fetch(salesUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (allSalesResponse.ok) {
        const allSalesResult = await allSalesResponse.json();
        const allSales = allSalesResult.data || [];
        
        // ✅ Filtrar usando EXACTAMENTE la misma lógica del backend
        // Solo ventas de servicios (walkIn type) con status: 'completed'
        const serviceSalesFiltered = allSales.filter(sale => 
          sale.type === SALE_TYPES.SERVICE && 
          sale.status === 'completed' && // ✅ MISMO FILTRO DEL BACKEND
          sale.paymentMethod
        );
        
        // Obtener métodos de pago únicos
        const uniquePaymentMethods = [...new Set(serviceSalesFiltered.map(sale => sale.paymentMethod))];
        setAvailablePaymentMethods(uniquePaymentMethods);
        setServiceSales(serviceSalesFiltered);
      }
    } catch (error) {
      console.error('❌ Error al cargar ventas de servicios:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCountByPaymentMethod = (method) => {
    if (method === 'all') return serviceSales.length;
    return serviceSales.filter(sale => sale.paymentMethod === method).length;
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
        <div className="relative bg-purple-500/5 backdrop-blur-md border border-purple-500/20 rounded-2xl shadow-2xl shadow-purple-500/20 h-full flex flex-col overflow-hidden">
          {/* Header fijo */}
          <div className="relative z-10 flex-shrink-0 p-2 sm:p-3 lg:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="p-1 sm:p-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30">
                  <Scissors className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-white">
                    Cortes Realizados
                  </h3>
                  {dateRange ? (
                    <p className="text-xs text-purple-300">
                      {dateRange.startDate} - {dateRange.endDate}
                    </p>
                  ) : (
                    <p className="text-xs text-purple-300">
                      Detalle de ventas de servicios
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
            {/* Resumen */}
            <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="text-center">
                  <p className="text-xs text-purple-300">Total Cortes</p>
                  <p className="text-sm sm:text-base font-bold text-white">{filteredSales.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-purple-300">Total Servicios</p>
                  <p className="text-sm sm:text-base font-bold text-purple-400">
                    {formatCurrency(filteredSales.reduce((total, sale) => total + (sale.totalAmount || sale.total || sale.amount || 0), 0))}
                  </p>
                </div>
              </div>
            </div>
            {/* Filtros */}
            <div className="p-2 sm:p-3 border-b border-purple-500/10 flex-shrink-0">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <h4 className="text-xs sm:text-sm font-medium text-purple-300 flex items-center gap-1 sm:gap-2">
                  <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                  Filtros
                </h4>
                <button
                  onClick={toggleFilters}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  {filtersExpanded ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>

              {filtersExpanded && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-purple-300 mb-1">Método de Pago:</label>
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => setPaymentMethodFilter('all')}
                        className={`px-2 py-1 rounded text-xs border transition-all duration-300 ${
                          paymentMethodFilter === 'all'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : 'bg-white/5 text-gray-300 border-white/20 hover:border-purple-500/40'
                        }`}
                      >
                        Todos ({filteredSales.length})
                      </button>
                      {availablePaymentMethods.map((method) => {
                        const count = serviceSales.filter(s => s.paymentMethod === method).length;
                        const colors = getPaymentMethodColor(method);
                        return (
                          <button
                            key={method}
                            onClick={() => setPaymentMethodFilter(method)}
                            className={`px-2 py-1 rounded text-xs border transition-all duration-300 ${
                              paymentMethodFilter === method
                                ? `${colors.bg} ${colors.text} ${colors.border}`
                                : 'bg-white/5 text-gray-300 border-white/20 hover:border-purple-500/40'
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mb-4"></div>
                <p className="text-purple-300">Cargando ventas...</p>
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-4 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
                  <Scissors className="w-8 h-8 text-purple-400" />
                </div>
                <p className="text-gray-400">No hay ventas de servicios</p>
                <p className="text-purple-300 text-sm mt-1">
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
                            <Scissors className={`w-3 h-3 sm:w-4 sm:h-4 ${methodColor.text}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                              <h4 className="font-medium text-white text-xs sm:text-sm truncate">
                                {sale.serviceName || sale.productName || 'Servicio'}
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
                            Servicio
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
          <div className="flex-shrink-0 p-2 sm:p-3 border-t border-purple-500/20">
            <button
              onClick={onClose}
              className="group relative w-full px-3 py-2 sm:py-2.5 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-xl text-purple-300 hover:from-purple-600/30 hover:to-blue-600/30 hover:border-purple-500/50 transition-all duration-300 font-medium shadow-xl shadow-purple-500/20 overflow-hidden touch-manipulation"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
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

export default ServicesBreakdownModal;