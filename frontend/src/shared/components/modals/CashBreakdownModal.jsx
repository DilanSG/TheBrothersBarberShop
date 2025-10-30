import React, { useState, useEffect } from 'react';
import { X, DollarSign, Filter, ShoppingCart, Scissors, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import GradientButton from '../ui/GradientButton';
import scrollLockManager from '../../utils/scrollLockManager';
import { 
  SALE_TYPES, 
  SALE_TYPE_LABELS,
  SALE_TYPE_ICONS,
  SALE_TYPE_COLORS 
} from '../../constants/salesConstants';

const CashBreakdownModal = ({ isOpen, onClose, revenueData, dashboardData, dateRange, formatCurrency: externalFormatCurrency }) => {
  const [cashSales, setCashSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [saleTypeFilter, setSaleTypeFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  // Tipos de venta disponibles - Usando constantes estandarizadas
  const saleTypes = [
    { id: 'all', label: 'Todos', icon: Filter },
    { id: SALE_TYPES.SERVICE, label: SALE_TYPE_LABELS[SALE_TYPES.SERVICE], icon: Scissors },
    { id: SALE_TYPES.APPOINTMENT, label: SALE_TYPE_LABELS[SALE_TYPES.APPOINTMENT], icon: Calendar },
    { id: SALE_TYPES.PRODUCT, label: SALE_TYPE_LABELS[SALE_TYPES.PRODUCT], icon: ShoppingCart }
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

  // Cargar ventas en efectivo al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadCashSales();
    }
  }, [isOpen, dateRange, dashboardData]); // ✅ Agregar dashboardData como dependencia

  // Solo detectar elementos problemáticos sin spam
  useEffect(() => {
    // Verificación silenciosa de calidad de datos
  }, [cashSales]);

  // Filtrar ventas cuando cambie el filtro (igual que otros modales)
  useEffect(() => {
    let filtered = cashSales;
    
    if (saleTypeFilter !== 'all') {
      filtered = filtered.filter(sale => {
        const saleType = getSaleTypeInfo(sale);
        return saleType.id === saleTypeFilter;
      });
    }
    
    setFilteredSales(filtered);
  }, [cashSales, saleTypeFilter]);

  const loadCashSales = async () => {
    setLoading(true);
    try {
      console.log('💰 Cargando ventas individuales en efectivo...');
      console.log('🐛 CashBreakdownModal - dateRange en loadCashSales:', dateRange);
      
      const token = localStorage.getItem('token');
      
      let salesUrl = `${import.meta.env.VITE_API_URL}/sales`;
      let appointmentsUrl = `${import.meta.env.VITE_API_URL}/appointments?status=completed`;
      
      if (dateRange) {
        console.log('🐛 Aplicando filtros de fecha:', dateRange.startDate, 'a', dateRange.endDate);
        const searchParams = new URLSearchParams();
        searchParams.append('startDate', dateRange.startDate);
        searchParams.append('endDate', dateRange.endDate);
        
        salesUrl += `?${searchParams.toString()}`;
        appointmentsUrl += `&${searchParams.toString()}`;
      } else {
        console.log('🐛 SIN FILTROS DE FECHA - consultando todos los datos');
      }
      
      console.log('🐛 URLs finales:', { salesUrl, appointmentsUrl });
      
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
        
        console.log('🐛 DEBUG - Respuestas de APIs:');
        console.log(`   API Sales response: ${allSales.length} records`);
        console.log(`   API Appointments response: ${completedAppointments.length} records`);
        
        // Log de algunos ejemplos de appointments para verificar paymentMethod
        console.log('   Primeras 5 appointments:');
        completedAppointments.slice(0, 5).forEach(apt => {
          console.log(`     • ${apt._id}: ${apt.paymentMethod} - $${apt.price} - ${apt.status}`);
        });
        
        // ✅ Filtrar usando EXACTAMENTE la misma lógica del backend
        // Sales: status: 'completed' + métodos de efectivo
        const cashMethods = ['cash', 'efectivo', 'contado'];
        const cashSalesFiltered = allSales.filter(sale => 
          sale.status === 'completed' && // ✅ MISMO FILTRO DEL BACKEND
          cashMethods.includes(sale.paymentMethod?.toLowerCase())
        );
        
        // Appointments: status: 'completed' + métodos de efectivo
        const cashAppointments = completedAppointments.filter(apt => 
          apt.status === 'completed' && // ✅ MISMO FILTRO DEL BACKEND
          cashMethods.includes(apt.paymentMethod?.toLowerCase())
        );
        
        console.log('🐛 DEBUG - Transacciones encontradas:');
        console.log(`   Sales efectivo filtradas: ${cashSalesFiltered.length}`);
        console.log(`   Appointments efectivo filtradas: ${cashAppointments.length}`);
        
        const salesTotal = cashSalesFiltered.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
        const appointmentsTotal = cashAppointments.reduce((sum, a) => sum + (a.price || 0), 0);
        console.log(`   Sales total: ${salesTotal.toLocaleString()}`);
        console.log(`   Appointments total: ${appointmentsTotal.toLocaleString()}`);
        console.log(`   TOTAL COMBINADO: ${(salesTotal + appointmentsTotal).toLocaleString()}`);
        
        const appointmentsAsSales = cashAppointments
          .map(apt => {
            const convertedSale = {
              _id: apt._id,
              type: 'appointment', // ✅ Usar tipo específico para citas
              paymentMethod: apt.paymentMethod,
              totalAmount: apt.price,
              total: apt.price,
              serviceName: apt.service?.name || 'Servicio de Cita',
              serviceId: apt.service?._id,
              barberId: apt.barber?._id,
              createdAt: apt.date || apt.createdAt,
              // ✅ Campos para identificación (PRINCIPAL)
              isFromAppointment: true,
              originalAppointment: apt
            };
            
            return convertedSale;
          });
        
        // ✅ ELIMINAR DUPLICADOS - Priorizar citas convertidas sobre ventas originales
        const uniqueTransactions = [];
        const seenIds = new Set();
        
        console.log('🐛 DEBUG - Eliminando duplicados...');
        
        // Primero agregar las citas convertidas (tienen isFromAppointment: true)
        appointmentsAsSales.forEach(transaction => {
          uniqueTransactions.push(transaction);
          seenIds.add(transaction._id);
        });
        
        console.log(`   Citas agregadas: ${appointmentsAsSales.length}`);
        
        // Luego agregar ventas que NO sean duplicados de citas
        let duplicatesFound = 0;
        cashSalesFiltered.forEach(transaction => {
          if (!seenIds.has(transaction._id)) {
            uniqueTransactions.push(transaction);
          } else {
            duplicatesFound++;
            // Duplicado encontrado
          }
        });
        
        console.log(`   Sales agregadas: ${cashSalesFiltered.length - duplicatesFound}`);
        console.log(`   Duplicados omitidos: ${duplicatesFound}`);
        console.log(`   TOTAL FINAL: ${uniqueTransactions.length} transacciones`);
        
        const finalTotal = uniqueTransactions.reduce((sum, t) => sum + (t.totalAmount || t.total || 0), 0);
        console.log(`   MONTO TOTAL FINAL: ${finalTotal.toLocaleString()}`);
        
        setCashSales(uniqueTransactions);
      }
    } catch (error) {
      console.error('❌ Error al cargar transacciones:', error);
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
    if (sale.isFromAppointment || sale.type === SALE_TYPES.APPOINTMENT) {
      return saleTypes.find(t => t.id === SALE_TYPES.APPOINTMENT);
    } 
    // Luego verificar productos
    else if (sale.type === SALE_TYPES.PRODUCT || sale.productId || sale.productName) {
      return saleTypes.find(t => t.id === SALE_TYPES.PRODUCT);
    } 
    // Finalmente servicios (walk-ins)
    else if (sale.type === SALE_TYPES.SERVICE || sale.serviceId || sale.serviceName) {
      return saleTypes.find(t => t.id === SALE_TYPES.SERVICE);
    } 
    // Default a servicio
    else {
      return saleTypes.find(t => t.id === SALE_TYPES.SERVICE);
    }
  };

  const calculateCountByType = (type) => {
    if (type === 'all') return cashSales.length;
    
    const sales = cashSales.filter(sale => {
      const saleType = getSaleTypeInfo(sale);
      return saleType.id === type;
    });
    
    return sales.length;
  };

  const calculateTotalByType = (type) => {
    if (type === 'all') return cashSales.reduce((total, sale) => total + (sale.totalAmount || sale.total || sale.amount || 0), 0);
    
    const sales = cashSales.filter(sale => {
      const saleType = getSaleTypeInfo(sale);
      return saleType.id === type;
    });
    
    return sales.reduce((total, sale) => total + (sale.totalAmount || sale.total || sale.amount || 0), 0);
  };

  // Método para alternar la visibilidad de los filtros
  const toggleFilters = () => {
    setFiltersExpanded(!filtersExpanded);
  };

  // Verificar si hay filtros activos (no todos en 'all')
  const hasActiveFilters = () => {
    return saleTypeFilter !== 'all';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4 lg:p-8 pt-8 sm:pt-10">
      <div className="relative w-full max-w-xs sm:max-w-md lg:max-w-2xl mx-auto h-[85vh] sm:h-[80vh] lg:h-[75vh] flex flex-col">
        <div className="relative bg-green-500/5 backdrop-blur-md border border-green-500/20 rounded-2xl shadow-2xl shadow-green-500/20 h-full flex flex-col overflow-hidden">
          {/* Header fijo */}
          <div className="relative z-10 flex-shrink-0 p-2 sm:p-3 lg:p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="p-1 sm:p-1.5 rounded-lg bg-green-500/20 border border-green-500/30">
                  <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-white">
                    Desglose de Pagos en Efectivo
                  </h3>
                  {dateRange ? (
                    <p className="text-xs text-green-300">
                      {dateRange.startDate} - {dateRange.endDate}
                    </p>
                  ) : (
                    <p className="text-xs text-green-300">
                      Detalle de ventas en efectivo
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
            <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-green-500/10 rounded-xl border border-green-500/20">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="text-center">
                  <p className="text-xs text-green-300">Total Ventas</p>
                  <p className="text-sm sm:text-base font-bold text-white">{filteredSales.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-green-300">Total Efectivo</p>
                  <p className="text-sm sm:text-base font-bold text-green-400">
                    {formatCurrency(filteredSales.reduce((total, sale) => total + (sale.totalAmount || sale.total || sale.amount || 0), 0))}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Header de filtros transparente */}
            <div className="mt-2 sm:mt-3 flex items-center justify-between p-2 border-b border-white/10 bg-transparent">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-green-400" />
                <span className="font-medium text-sm text-green-400">Filtros</span>
                {saleTypeFilter !== 'all' && (
                  <span className="px-1.5 py-0.5 bg-green-500/20 text-green-300 border border-green-500/30 rounded-full text-xs font-medium">
                    Activos
                  </span>
                )}
              </div>
              <button
                onClick={toggleFilters}
                className="p-1 hover:bg-white/5 rounded-md transition-colors duration-200 text-green-400 hover:text-green-300"
              >
                {filtersExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
            
            {/* Filtros expandibles */}
            {filtersExpanded && (
              <div className="p-3 space-y-3 border-b border-white/10 bg-transparent animate-in slide-in-from-top-2 duration-300">
                <div>
                  <p className="text-xs text-green-300 mb-2 font-medium">Tipo de venta:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {saleTypes.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setSaleTypeFilter(id)}
                        className={`group relative px-2 py-1 rounded-lg border cursor-pointer transition-all duration-300 hover:scale-105 overflow-hidden backdrop-blur-sm flex items-center gap-1.5 touch-manipulation ${
                          saleTypeFilter === id
                            ? 'border-green-500/50 bg-green-500/20 shadow-lg shadow-green-500/20'
                            : 'border-white/20 bg-white/5 hover:border-green-500/40 hover:bg-green-500/10'
                        }`}
                      >
                        <Icon size={12} className={`transition-colors duration-300 ${
                          saleTypeFilter === id ? 'text-green-300' : 'text-green-400'
                        }`} />
                        <span className={`font-medium text-xs ${
                          saleTypeFilter === id ? 'text-green-300' : 'text-white'
                        }`}>
                          {label}
                        </span>
                        <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium ${
                          saleTypeFilter === id 
                            ? 'bg-green-500/30 text-green-200 border border-green-500/50'
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mb-4"></div>
                <p className="text-green-300">Cargando ventas...</p>
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-4 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
                  <DollarSign className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-gray-400">No hay ventas en efectivo</p>
                <p className="text-green-300 text-sm mt-1">
                  {saleTypeFilter === 'all' 
                    ? 'No se encontraron ventas pagadas en efectivo' 
                    : `No se encontraron ${saleTypes.find(t => t.id === saleTypeFilter)?.label.toLowerCase()} pagados en efectivo`}
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {filteredSales.map((sale, index) => {
                  const typeInfo = getSaleTypeInfo(sale);
                  const TypeIcon = typeInfo.icon;
                  
                  return (
                    <div
                      key={`${sale.isFromAppointment ? 'cash-appointment' : 'cash-sale'}-${sale._id || sale.id || `${index}-${sale.createdAt || sale.saleDate || Date.now()}`}`}
                      className="group relative p-3 sm:p-4 bg-green-500/5 border border-green-500/20 rounded-lg sm:rounded-xl hover:bg-green-500/10 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className="p-1.5 sm:p-2 bg-green-500/20 rounded-lg border border-green-500/30 flex-shrink-0">
                            <TypeIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                              <h4 className="font-medium text-white text-xs sm:text-sm truncate">
                                {sale.productName || sale.serviceName || 'Servicio'}
                              </h4>
                              <span className="px-1.5 sm:px-2 py-0.5 bg-green-500/20 text-green-300 border border-green-500/40 rounded-full text-xs font-medium self-start sm:flex-shrink-0">
                                {typeInfo.label}
                              </span>
                            </div>
                            <p className="text-xs text-green-300 mb-1 sm:mb-2">
                              {sale.barberName && `${sale.barberName} • `}
                              {formatDate(sale.saleDate || sale.createdAt)}
                            </p>
                            {sale.notes && (
                              <p className="text-xs text-gray-400 mt-1 truncate">{sale.notes}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm sm:text-base font-bold text-green-400">
                            {formatCurrency(sale.totalAmount || sale.total || sale.amount || 0)}
                          </div>
                          <div className="text-xs text-green-300">
                            Efectivo
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
          <div className="flex-shrink-0 p-2 sm:p-3 border-t border-green-500/20">
            <button
              onClick={onClose}
              className="group relative w-full px-3 py-2 sm:py-2.5 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl text-green-300 hover:from-green-600/30 hover:to-emerald-600/30 hover:border-green-500/50 transition-all duration-300 font-medium shadow-xl shadow-green-500/20 overflow-hidden touch-manipulation"
            >
              {/* Efecto de brillo */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
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

export default CashBreakdownModal;