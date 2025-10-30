import React, { useState, useEffect } from 'react';
import { X, CreditCard, Filter, ShoppingCart, Scissors, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { SALE_TYPES } from '../../constants/salesConstants';

const DigitalPaymentsBreakdownModal = ({ isOpen, onClose, revenueData, dashboardData, dateRange, formatCurrency: externalFormatCurrency }) => {
  const [digitalSales, setDigitalSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [saleTypeFilter, setSaleTypeFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState([]);
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  // Tipos de venta disponibles
  const saleTypes = [
    { id: 'all', label: 'Todos', icon: Filter },
    { id: 'corte', label: 'Cortes', icon: Scissors },
    { id: 'cita', label: 'Citas', icon: Calendar },
    { id: 'producto', label: 'Productos', icon: ShoppingCart }
  ];

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

  // Colores para métodos de pago (del contexto PaymentMethods)
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

    const methodLower = method.toLowerCase();
    for (const [key, color] of Object.entries(colors)) {
      if (methodLower.includes(key)) {
        return color;
      }
    }
    
    // Color por defecto para métodos no reconocidos
    return { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-300' };
  };

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Bloquear scroll del body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = 'unset'; };
    }
  }, [isOpen]);

  // Cargar ventas digitales al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadDigitalSales();
    }
  }, [isOpen, dateRange, dashboardData]); // ✅ Agregar dashboardData como dependencia

  // Análisis de tipos cuando se cargan las transacciones
  // Análisis silencioso de transacciones digitales

  // Filtrar ventas cuando cambien los filtros (igual que otros modales)
  useEffect(() => {
    let filtered = digitalSales;

    // Filtrar por tipo de venta
    if (saleTypeFilter !== 'all') {
      filtered = filtered.filter(sale => {
        const saleType = getSaleTypeInfo(sale);
        return saleType.id === saleTypeFilter;
      });
    }

    // Filtrar por método de pago
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(sale => sale.paymentMethod === paymentMethodFilter);
    }

    setFilteredSales(filtered);
  }, [digitalSales, saleTypeFilter, paymentMethodFilter]);

  const loadDigitalSales = async () => {
    setLoading(true);
    try {
      console.log('💳 Cargando ventas individuales con pagos digitales...');
      
      const token = localStorage.getItem('token');
      
      let salesUrl = `${import.meta.env.VITE_API_URL}/sales`;
      let appointmentsUrl = `${import.meta.env.VITE_API_URL}/appointments?status=completed`;
      
      if (dateRange) {
        const searchParams = new URLSearchParams();
        searchParams.append('startDate', dateRange.startDate);
        searchParams.append('endDate', dateRange.endDate);
        
        salesUrl += `?${searchParams.toString()}`;
        appointmentsUrl += `&${searchParams.toString()}`;
      }
      
      // Cargar ventas filtradas por fecha
      const allSalesResponse = await fetch(salesUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Cargar citas completadas filtradas por fecha
      const appointmentsResponse = await fetch(appointmentsUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (allSalesResponse.ok && appointmentsResponse.ok) {
        const allSalesResult = await allSalesResponse.json();
        const appointmentsResult = await appointmentsResponse.json();
        
        const allSales = allSalesResult.data || [];
        const completedAppointments = appointmentsResult.data || [];
        
        // Métodos de pago digitales (no efectivo) - Solo métodos autorizados
        const digitalMethods = ['nequi', 'daviplata', 'bancolombia', 'nu', 'tarjeta', 'card', 'transfer', 'transferencia'];
        
        // ✅ Filtrar usando EXACTAMENTE la misma lógica del backend
        // Sales: status: 'completed' + métodos digitales
        const digitalSalesFiltered = allSales.filter(sale => 
          sale.status === 'completed' && // ✅ MISMO FILTRO DEL BACKEND
          digitalMethods.includes(sale.paymentMethod?.toLowerCase())
        );
        
        // Appointments: status: 'completed' + métodos digitales
        const digitalAppointments = completedAppointments.filter(apt => 
          apt.status === 'completed' && // ✅ MISMO FILTRO DEL BACKEND
          digitalMethods.includes(apt.paymentMethod?.toLowerCase())
        );
        
        // ✅ Convertir citas a formato de venta (igual estructura que ventas)
        const appointmentsAsSales = digitalAppointments.map(apt => ({
            _id: apt._id,
            type: 'appointment', // ✅ Usar tipo específico para citas
            paymentMethod: apt.paymentMethod,
            totalAmount: apt.price,
            total: apt.price,
            serviceName: apt.service?.name || 'Servicio de Cita',
            serviceId: apt.service?._id,
            barberId: apt.barber?._id,
            createdAt: apt.date || apt.createdAt,
            // ✅ Campos para identificación
            isFromAppointment: true,
            originalAppointment: apt
          }));
        
        // ✅ Combinar evitando duplicados por ID
        const allDigitalTransactions = [...digitalSalesFiltered, ...appointmentsAsSales];
        
        // ✅ ELIMINAR DUPLICADOS - Priorizar citas convertidas sobre ventas originales
        const uniqueTransactions = [];
        const seenIds = new Set();
        
        // Primero agregar las citas convertidas (tienen isFromAppointment: true)
        appointmentsAsSales.forEach(transaction => {
          uniqueTransactions.push(transaction);
          seenIds.add(transaction._id);
        });
        
        // Luego agregar ventas que NO sean duplicados de citas
        digitalSalesFiltered.forEach(transaction => {
          if (!seenIds.has(transaction._id)) {
            uniqueTransactions.push(transaction);
          }
        });
        
        // Obtener métodos de pago únicos
        const uniquePaymentMethods = [...new Set(uniqueTransactions.map(sale => sale.paymentMethod))];
        setAvailablePaymentMethods(uniquePaymentMethods);
        
        setDigitalSales(uniqueTransactions);
      }
    } catch (error) {
      console.error('❌ Error al cargar transacciones digitales:', error);
    } finally {
      setLoading(false);
    }
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

  const getSaleTypeInfo = (sale) => {
    // ✅ PRIMERO verificar si es cita (tiene prioridad absoluta)
    if (sale.isFromAppointment || sale.type === 'appointment') {
      return saleTypes.find(t => t.id === 'cita');
    } 
    // Luego verificar productos
    else if (sale.type === SALE_TYPES.PRODUCT || sale.productId || sale.productName) {
      return saleTypes.find(t => t.id === 'producto');
    } 
    // Finalmente cortes (walk-ins)
    else if (sale.type === SALE_TYPES.SERVICE || sale.serviceId || sale.serviceName) {
      return saleTypes.find(t => t.id === 'corte');
    } 
    // Default a corte
    else {
      return saleTypes.find(t => t.id === 'corte');
    }
  };

  const calculateCountByType = (type) => {
    if (type === 'all') return digitalSales.length;
    
    const sales = digitalSales.filter(sale => {
      const saleType = getSaleTypeInfo(sale);
      return saleType.id === type;
    });
    
    return sales.length;
  };

  const calculateCountByPaymentMethod = (method) => {
    if (method === 'all') {
      // Si hay filtro de tipo, aplicarlo también
      if (saleTypeFilter !== 'all') {
        return digitalSales.filter(sale => {
          const saleType = getSaleTypeInfo(sale);
          return saleType.id === saleTypeFilter;
        }).length;
      }
      return digitalSales.length;
    }
    
    // Filtrar por método de pago y opcionalmente por tipo
    let sales = digitalSales.filter(sale => sale.paymentMethod === method);
    
    if (saleTypeFilter !== 'all') {
      sales = sales.filter(sale => {
        const saleType = getSaleTypeInfo(sale);
        return saleType.id === saleTypeFilter;
      });
    }
    
    return sales.length;
  };

  // Método para alternar la visibilidad de los filtros
  const toggleFilters = () => {
    setFiltersExpanded(!filtersExpanded);
  };

  // Verificar si hay filtros activos (no todos en 'all')
  const hasActiveFilters = () => {
    return saleTypeFilter !== 'all' || paymentMethodFilter !== 'all';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4 lg:p-8 pt-8 sm:pt-10">
      <div className="relative w-full max-w-xs sm:max-w-md lg:max-w-2xl mx-auto h-[85vh] sm:h-[80vh] lg:h-[75vh] flex flex-col">
        <div className="relative bg-blue-500/5 backdrop-blur-md border border-blue-500/20 rounded-2xl shadow-2xl shadow-blue-500/20 h-full flex flex-col overflow-hidden">
          {/* Header fijo */}
          <div className="relative z-10 flex-shrink-0 p-2 sm:p-3 lg:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="p-1 sm:p-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30">
                  <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-white">
                    Desglose de Pagos Digitales
                  </h3>
                  {dateRange ? (
                    <p className="text-xs text-blue-300">
                      {dateRange.startDate} - {dateRange.endDate}
                    </p>
                  ) : (
                    <p className="text-xs text-blue-300">
                      Detalle de ventas con métodos digitales
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
            <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="text-center">
                  <p className="text-xs text-blue-300">Total Ventas</p>
                  <p className="text-sm sm:text-base font-bold text-white">{filteredSales.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-blue-300">Total Digital</p>
                  <p className="text-sm sm:text-base font-bold text-blue-400">
                    {formatCurrency(filteredSales.reduce((total, sale) => total + (sale.totalAmount || sale.total || sale.amount || 0), 0))}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Header de filtros transparente */}
            <div className="mt-2 sm:mt-3 flex items-center justify-between p-2 border-b border-white/10 bg-transparent">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-blue-400" />
                <span className="font-medium text-sm text-blue-400">Filtros</span>
                {hasActiveFilters() && (
                  <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-medium">
                    Activos
                  </span>
                )}
              </div>
              <button
                onClick={toggleFilters}
                className="p-1 hover:bg-white/5 rounded-md transition-colors duration-200 text-blue-400 hover:text-blue-300"
              >
                {filtersExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
            
            {/* Filtros expandibles */}
            {filtersExpanded && (
              <div className="p-3 space-y-3 border-b border-white/10 bg-transparent animate-in slide-in-from-top-2 duration-300">
                {/* Filtros por método de pago */}
                <div>
                  <p className="text-xs text-blue-300 mb-2 font-medium">Método de pago:</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setPaymentMethodFilter('all')}
                      className={`group relative px-2 py-1 rounded-lg border cursor-pointer transition-all duration-300 hover:scale-105 overflow-hidden backdrop-blur-sm flex items-center gap-1.5 touch-manipulation ${
                        paymentMethodFilter === 'all'
                          ? 'border-blue-500/50 bg-blue-500/20 shadow-lg shadow-blue-500/20'
                          : 'border-white/20 bg-white/5 hover:border-blue-500/40 hover:bg-blue-500/10'
                      }`}
                    >
                      <Filter size={12} className={`transition-colors duration-300 ${
                        paymentMethodFilter === 'all' ? 'text-blue-300' : 'text-blue-400'
                      }`} />
                      <span className={`font-medium text-xs ${
                        paymentMethodFilter === 'all' ? 'text-blue-300' : 'text-white'
                      }`}>
                        Todos
                      </span>
                      <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium ${
                        paymentMethodFilter === 'all' 
                          ? 'bg-blue-500/30 text-blue-200 border border-blue-500/50'
                          : 'bg-white/10 text-gray-300 border border-white/20'
                      }`}>
                        {calculateCountByPaymentMethod('all')}
                      </span>
                    </button>
                    {availablePaymentMethods.map((method) => {
                      const methodColor = getPaymentMethodColor(method);
                      const isActive = paymentMethodFilter === method;
                      return (
                        <button
                          key={method}
                          onClick={() => setPaymentMethodFilter(method)}
                          className={`group relative px-2 py-1 rounded-lg border cursor-pointer transition-all duration-300 hover:scale-105 overflow-hidden backdrop-blur-sm flex items-center gap-1.5 touch-manipulation ${
                            isActive
                              ? `${methodColor.border} ${methodColor.bg} shadow-lg`
                              : 'border-white/20 bg-white/5 hover:border-blue-500/40 hover:bg-blue-500/10'
                          }`}
                        >
                          <CreditCard size={12} className={`transition-colors duration-300 ${
                            isActive ? methodColor.text : 'text-blue-400'
                          }`} />
                          <span className={`font-medium text-xs ${
                            isActive ? methodColor.text : 'text-white'
                          }`}>
                            {getPaymentMethodDisplayName(method)}
                          </span>
                          <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium ${
                            isActive 
                              ? `${methodColor.bg} ${methodColor.text} ${methodColor.border}`
                              : 'bg-white/10 text-gray-300 border border-white/20'
                          }`}>
                            {calculateCountByPaymentMethod(method)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Filtros por tipo de venta */}
                <div>
                  <p className="text-xs text-blue-300 mb-2 font-medium">Tipo de venta:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {saleTypes.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setSaleTypeFilter(id)}
                        className={`group relative px-2 py-1 rounded-lg border cursor-pointer transition-all duration-300 hover:scale-105 overflow-hidden backdrop-blur-sm flex items-center gap-1.5 touch-manipulation ${
                          saleTypeFilter === id
                            ? 'border-blue-500/50 bg-blue-500/20 shadow-lg shadow-blue-500/20'
                            : 'border-white/20 bg-white/5 hover:border-blue-500/40 hover:bg-blue-500/10'
                        }`}
                      >
                        <Icon size={12} className={`transition-colors duration-300 ${
                          saleTypeFilter === id ? 'text-blue-300' : 'text-blue-400'
                        }`} />
                        <span className={`font-medium text-xs ${
                          saleTypeFilter === id ? 'text-blue-300' : 'text-white'
                        }`}>
                          {label}
                        </span>
                        <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium ${
                          saleTypeFilter === id 
                            ? 'bg-blue-500/30 text-blue-200 border border-blue-500/50'
                            : 'bg-white/10 text-gray-300 border border-white/20'
                        }`}>
                          {calculateCountByType(id)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-2 sm:px-3 lg:px-4 pb-2 sm:pb-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mb-4"></div>
                <p className="text-blue-300">Cargando ventas...</p>
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-4 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
                  <CreditCard className="w-8 h-8 text-blue-400" />
                </div>
                <p className="text-gray-400">No hay ventas digitales</p>
                <p className="text-blue-300 text-sm mt-1">
                  No se encontraron ventas con los filtros seleccionados
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {filteredSales.map((sale, index) => {
                  const typeInfo = getSaleTypeInfo(sale);
                  const TypeIcon = typeInfo.icon;
                  const methodColor = getPaymentMethodColor(sale.paymentMethod);
                  
                  return (
                    <div
                      key={`${sale.isFromAppointment ? 'digital-appointment' : 'digital-sale'}-${sale._id || sale.id || `${index}-${sale.createdAt || sale.saleDate || Date.now()}`}`}
                      className={`group relative p-3 sm:p-4 ${methodColor.bg} border ${methodColor.border} rounded-lg sm:rounded-xl hover:scale-[1.02] transition-all duration-300`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className={`p-1.5 sm:p-2 ${methodColor.bg} rounded-lg border ${methodColor.border} flex-shrink-0`}>
                            <TypeIcon className={`w-3 h-3 sm:w-4 sm:h-4 ${methodColor.text}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                              <h4 className="font-medium text-white text-xs sm:text-sm truncate">
                                {sale.productName || sale.serviceName || 'Servicio'}
                              </h4>
                              <div className="flex gap-1 flex-wrap">
                                <span className={`px-1.5 sm:px-2 py-0.5 ${methodColor.bg} ${methodColor.text} border ${methodColor.border} rounded-full text-xs font-medium self-start flex-shrink-0`}>
                                  {typeInfo.label}
                                </span>
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
                            Digital
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
          <div className="flex-shrink-0 p-2 sm:p-3 border-t border-blue-500/20">
            <button
              onClick={onClose}
              className="group relative w-full px-3 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-xl text-blue-300 hover:from-blue-600/30 hover:to-cyan-600/30 hover:border-blue-500/50 transition-all duration-300 font-medium shadow-xl shadow-blue-500/20 overflow-hidden touch-manipulation"
            >
              {/* Efecto de brillo */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
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

export default DigitalPaymentsBreakdownModal;