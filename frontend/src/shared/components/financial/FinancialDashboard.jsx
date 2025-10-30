import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Scissors, 
  Package, 
  CreditCard,
  PieChart,
  BarChart3,
  Calculator,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import GradientText from '../ui/GradientText';
import SociosModal from '../modals/SociosModal';
import RefundedSalesModal from '../common/RefundedSalesModal';
import { sociosService } from '../../services/sociosService';
import { refundService } from '../../services/refundService';
import { useAuth } from '../../contexts/AuthContext';
import { 
  PAYMENT_METHODS, 
  SALE_TYPES,
  SALE_TYPE_ICONS,
  SALE_TYPE_COLORS,
  PAYMENT_METHOD_COLORS,
  DEFAULT_PAYMENT_COLOR
} from '../../constants/salesConstants';

/**
 * Dashboard de métricas financieras principales
 */
export const FinancialDashboard = ({ 
  data = { summary: {} },
  calculations = {},
  formatCurrency, 
  loading = false,
  className = '',
  onCardClick
}) => {
  // Asegurar que siempre exista un objeto summary para evitar crashes en render inicial
  const { summary = {} } = data || {};
  const { user } = useAuth();
  const [sociosModalOpen, setSociosModalOpen] = useState(false);
  const [refundsModalOpen, setRefundsModalOpen] = useState(false);
  const [sociosData, setSociosData] = useState({ totalSocios: 0, totalPorcentaje: 0, disponible: 100 });
  const [refundsData, setRefundsData] = useState({ totalRefunds: 0, monthlyRefunds: 0, totalAmount: 0 });

  // ========== FUNCIONES AUXILIARES OPTIMIZADAS ==========

  /**
   * Calcula el total de ingresos por métodos de efectivo usando constantes
   * @param {Object} paymentMethods - Métodos de pago del summary
   * @returns {number} Total de efectivo
   */
  const calculateCashTotal = (paymentMethods = {}) => {
    // Usar Set para evitar duplicaciones - las constantes ya están normalizadas
    const cashMethods = new Set([
      PAYMENT_METHODS.CASH, // 'efectivo'
      'cash', // Compatibilidad con datos antiguos
      'contado' // Compatibilidad adicional
    ]);
    
    return Array.from(cashMethods).reduce((total, method) => {
      return total + (paymentMethods[method] || 0);
    }, 0);
  };

  /**
   * Calcula el total de ingresos por métodos digitales usando constantes
   * @param {Object} paymentMethods - Métodos de pago del summary
   * @returns {number} Total de pagos digitales
   */
  const calculateDigitalTotal = (paymentMethods = {}) => {
    // Usar Set para evitar duplicaciones - las constantes ya están normalizadas
    const digitalMethods = new Set([
      PAYMENT_METHODS.CARD,        // 'tarjeta'
      PAYMENT_METHODS.TRANSFER,    // 'transferencia' 
      PAYMENT_METHODS.NEQUI,       // 'nequi'
      PAYMENT_METHODS.NU,          // 'nu'
      PAYMENT_METHODS.DAVIPLATA,   // 'daviplata'
      PAYMENT_METHODS.BANCOLOMBIA, // 'bancolombia'
      PAYMENT_METHODS.DEBIT,       // 'debit'
      PAYMENT_METHODS.DIGITAL,     // 'digital'
      // Compatibilidad con nombres antiguos que NO están en las constantes
      'card',     // Solo si es diferente a PAYMENT_METHODS.CARD
      'transfer', // Solo si es diferente a PAYMENT_METHODS.TRANSFER
      'credit'    // Método legacy
    ]);
    
    return Array.from(digitalMethods).reduce((total, method) => {
      return total + (paymentMethods[method] || 0);
    }, 0);
  };

  /**
   * Obtiene el color del tipo de venta usando las constantes
   * @param {string} saleType - Tipo de venta
   * @returns {string} Clase de color CSS
   */
  const getSaleTypeColor = (saleType) => {
    return SALE_TYPE_COLORS[saleType] || 'text-gray-400';
  };

  /**
   * Calcula métricas optimizadas usando las constantes y el backend
   * @returns {Object} Métricas calculadas de manera eficiente
   */
  const getOptimizedMetrics = () => {
    const paymentMethods = summary.paymentMethods || {};
    const totalRevenue = summary.totalRevenue || 0;

    // Usar funciones auxiliares para cálculos
    const cashTotal = calculateCashTotal(paymentMethods);
    const digitalTotal = calculateDigitalTotal(paymentMethods);

    // Calcular porcentajes de manera consistente
    const cashPercentage = totalRevenue > 0 ? ((cashTotal / totalRevenue) * 100).toFixed(1) : '0.0';
    const digitalPercentage = totalRevenue > 0 ? ((digitalTotal / totalRevenue) * 100).toFixed(1) : '0.0';

    return {
      cashTotal,
      digitalTotal,
      cashPercentage,
      digitalPercentage
    };
  };

  /**
   * Obtiene los colores optimizados para las cards del dashboard
   * @param {string} color - Color base
   * @param {boolean} isValue - Si es para el valor principal
   * @returns {string} Clases CSS correspondientes
   */
  const getColorClasses = (color, isValue = false) => {
    const colors = {
      green: isValue ? 'text-green-400' : 'from-green-600/20 to-green-600/10 border-green-500/20 text-green-400',
      red: isValue ? 'text-red-400' : 'from-red-600/20 to-red-600/10 border-red-500/20 text-red-400',
      blue: isValue ? 'text-blue-400' : 'from-blue-600/20 to-blue-600/10 border-blue-500/20 text-blue-400',
      purple: isValue ? 'text-purple-400' : 'from-purple-600/20 to-purple-600/10 border-purple-500/20 text-purple-400',
      orange: isValue ? 'text-orange-400' : 'from-orange-600/20 to-orange-600/10 border-orange-500/20 text-orange-400',
      gray: isValue ? 'text-gray-400' : 'from-gray-600/20 to-gray-600/10 border-gray-500/20 text-gray-400',
      gold: isValue ? 'text-yellow-400' : 'from-yellow-600/20 to-amber-600/10 border-yellow-500/20 text-yellow-400'
    };
    return colors[color] || colors.blue;
  };

  /**
   * Obtiene el icono de tendencia optimizado
   * @param {string} trend - Tendencia (up/down/neutral)
   * @returns {JSX.Element|null} Componente del icono
   */
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="w-4 h-4 text-green-400" />;
      case 'down':
        return <ArrowDownRight className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  // Cargar datos de socios
  useEffect(() => {
    const fetchSociosData = async () => {
      try {
        const response = await sociosService.getAll();
        const socios = response.data.socios || [];
        const totalPorcentaje = response.data.totalPorcentaje || 0;
        const disponible = Math.max(0, 100 - totalPorcentaje); // Asegurar que disponible = 100 - asignado
        
        setSociosData({
          totalSocios: socios.length,
          totalPorcentaje,
          disponible
        });
      } catch (error) {
        console.error('Error cargando datos de socios:', error);
        // Mantener valores por defecto en caso de error
      }
    };

    fetchSociosData();
  }, []);

  // Cargar datos de reembolsos
  useEffect(() => {
    const fetchRefundsData = async () => {
      try {
        const response = await refundService.getRefundedSales();
        const refunds = response.data || [];
        
        // Calcular totales - usar el campo correcto totalAmount
        const totalAmount = refunds.reduce((sum, refund) => {
          const amount = refund.totalAmount || refund.amount || refund.total || refund.price || 0;
          return sum + amount;
        }, 0);
        
        const totalRefunds = refunds.length;
        
        // Calcular reembolsos del mes actual
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyRefunds = refunds.filter(refund => {
          const refundDate = new Date(refund.refundedAt || refund.createdAt || refund.date);
          return refundDate.getMonth() === currentMonth && refundDate.getFullYear() === currentYear;
        }).length;

        setRefundsData({
          totalRefunds,
          monthlyRefunds,
          totalAmount
        });
      } catch (error) {
        console.error('Error cargando datos de reembolsos:', error);
        // Mantener valores por defecto en caso de error
      }
    };

    fetchRefundsData();
  }, []);

  // Función para refrescar los datos de reembolsos
  const refreshRefundsData = async () => {
    const fetchRefundsData = async () => {
      try {
        const response = await refundService.getRefundedSales();
        const refunds = response.data || [];
        
        // Calcular totales - usar el campo correcto totalAmount
        const totalAmount = refunds.reduce((sum, refund) => {
          const amount = refund.totalAmount || refund.amount || refund.total || refund.price || 0;
          return sum + amount;
        }, 0);
        
        const totalRefunds = refunds.length;
        
        // Calcular reembolsos del mes actual
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyRefunds = refunds.filter(refund => {
          const refundDate = new Date(refund.refundedAt || refund.createdAt || refund.date);
          return refundDate.getMonth() === currentMonth && refundDate.getFullYear() === currentYear;
        }).length;

        setRefundsData({
          totalRefunds,
          monthlyRefunds,
          totalAmount
        });
      } catch (error) {
        console.error('Error cargando datos de reembolsos:', error);
        // Mantener valores por defecto en caso de error
      }
    };

    await fetchRefundsData();
  };

  // Función para formatear números sin ceros después de coma
  const formatNumberClean = (number) => {
    if (number === null || number === undefined || isNaN(number)) return '0';
    
    // Usar punto decimal y sin comas de miles para números enteros
    if (Number.isInteger(number)) {
      return number.toLocaleString('en-US'); // Formato con punto decimal, comas de miles
    }
    
    // Para decimales, eliminar ceros innecesarios
    return parseFloat(number.toFixed(2)).toLocaleString('en-US');
  };

  // Función para formatear moneda sin ceros después de punto decimal
  const formatCurrencyClean = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '$0';
    
    // Si es número entero, no mostrar decimales
    if (Number.isInteger(amount)) {
      return `$${amount.toLocaleString('en-US')}`;
    }
    
    // Para decimales, mostrar solo los necesarios (eliminar .00)
    const formatted = parseFloat(amount.toFixed(2));
    return `$${formatted.toLocaleString('en-US')}`;
  };

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 ${className}`}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 lg:p-8 backdrop-blur-sm shadow-2xl shadow-blue-500/20 h-32"></div>
          </div>
        ))}
      </div>
    );
  }

  // Get optimized metrics using constants
  const optimizedMetrics = getOptimizedMetrics();

  const metrics = [
    // ========== FILA SUPERIOR: Métricas financieras principales ==========
    {
      id: 'ingresos',
      title: 'Ingresos Totales',
      value: summary.totalRevenue || 0,
      icon: DollarSign,
      color: 'green',
      trend: summary.netProfit > 0 ? 'up' : 'down',
      subtitle: 'Ingresos en el período',
      clickable: true
    },
    {
      id: 'gastos',
      title: 'Gastos Totales',
      value: summary.totalExpenses || 0,
      icon: TrendingDown,
      color: 'red',
      trend: summary.totalExpenses > summary.totalRevenue ? 'up' : 'down',
      subtitle: 'Gastos del período',
      clickable: true
    },
    {
      id: 'efectivo',
      title: 'Efectivo',
      value: optimizedMetrics.cashTotal,
      icon: DollarSign,
      color: 'green',
      trend: 'neutral',
      subtitle: `${optimizedMetrics.cashPercentage}% del ingreso`,
      clickable: true
    },
    {
      id: 'digitales',
      title: 'Pagos Digitales',
      value: optimizedMetrics.digitalTotal,
      icon: CreditCard,
      color: 'blue',
      trend: 'neutral',
      subtitle: `${optimizedMetrics.digitalPercentage}% del ingreso`,
      clickable: true
    },

    // ========== FILA INFERIOR: Operaciones por tipo de venta ==========
    {
      id: 'productos',
      title: 'Productos Vendidos',
      value: summary.productRevenue || 0,
      icon: Package,
      color: 'orange',
      trend: 'up',
      subtitle: `${calculations?.totalProductSales || 0} ventas • ${calculations?.productsPercentage || '0.0'}% del ingreso`,
      clickable: true
    },
    {
      id: 'servicios',
      title: 'Cortes Realizados',
      value: summary.serviceRevenue || 0,
      icon: Scissors,
      color: 'purple',
      trend: 'up',
      subtitle: `${calculations?.totalServiceSales || 0} cortes • ${calculations?.servicesPercentage || '0.0'}% del ingreso`,
      clickable: true
    },
    {
      id: 'citas',
      title: 'Reservas Completadas',
      value: summary.appointmentRevenue || 0,
      icon: Users,
      color: 'blue',
      trend: 'up',
      subtitle: `${summary.totalAppointments || 0} citas • ${calculations?.appointmentsPercentage || '0.0'}% del ingreso`,
      clickable: true
    },
    {
      id: 'socios',
      title: 'Gestión de Socios',
      value: sociosData.totalSocios,
      icon: Users,
      color: 'gold',
      trend: 'neutral',
      subtitle: `${sociosData.totalPorcentaje}% asignado • ${sociosData.disponible}% disponible`,
      clickable: true
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filtro de fechas removido - ahora se maneja globalmente en Reports.jsx */}

      {/* Grid de métricas principales - Responsivo al contenido */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {metrics.map((metric, index) => {
          const IconComponent = metric.icon;
          // Calcular longitud de forma segura sin depender de toString sobre undefined
          const rawValue = metric.value !== undefined && metric.value !== null ? metric.value : 0;
          const valueString = typeof rawValue === 'number' ? rawValue.toString() : String(rawValue);
          const sizeClass = valueString.length > 8
            ? 'text-lg sm:text-xl lg:text-2xl'
            : valueString.length > 6
              ? 'text-xl sm:text-2xl lg:text-3xl'
              : 'text-2xl sm:text-3xl lg:text-4xl';
          
          return (
            <div
              key={index}
              onClick={() => {
                if (metric.clickable) {
                  if (metric.id === 'socios') {
                    setSociosModalOpen(true);
                  } else if (onCardClick) {
                    onCardClick(metric.id, metric);
                  }
                }
              }}
              className={`group relative bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 lg:p-8 backdrop-blur-sm shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden min-h-[140px] flex flex-col justify-between ${
                metric.clickable ? 'cursor-pointer' : ''
              } ${
                metric.id === 'socios' ? 'hover:border-yellow-500/30 hover:shadow-yellow-500/20' : 'hover:border-blue-500/30 hover:shadow-blue-500/20'
              }`}
            >
              {/* Efecto de brillo */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-2xl"></div>
              
              <div className="relative flex-1 flex flex-col">
                {/* Header con icono y tendencia */}
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 sm:p-3 bg-gradient-to-r ${getColorClasses(metric.color)} rounded-xl border shadow-xl ${
                    metric.id === 'socios' ? 'shadow-yellow-500/20' : 'shadow-blue-500/20'
                  }`}>
                    <IconComponent className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 ${getColorClasses(metric.color, true)}`} />
                  </div>
                  {getTrendIcon(metric.trend)}
                </div>

                {/* Título - Responsivo */}
                <h3 className="text-gray-300 text-xs sm:text-sm font-medium mb-2 overflow-hidden" style={{ 
                  display: '-webkit-box', 
                  WebkitLineClamp: 2, 
                  WebkitBoxOrient: 'vertical' 
                }}>
                  {metric.title}
                </h3>

                {/* Valor principal - Responsivo y con formato mejorado */}
                <div className="mb-2 flex-1 flex items-center">
                  {typeof rawValue === 'number' ? (
                    <p className={`font-bold leading-tight break-words ${getColorClasses(metric.color, true)} ${sizeClass}`}>
                      {metric.id === 'socios'
                        ? `${formatNumberClean(rawValue)} Socios`
                        : metric.title.includes('Citas') || metric.title.includes('Servicios') || metric.title.includes('Productos') || metric.title.includes('Reservas') || metric.title.includes('Cortes')
                          ? formatNumberClean(rawValue)
                          : formatCurrencyClean(rawValue)
                      }
                    </p>
                  ) : (
                    <p className={`font-bold leading-tight break-words ${getColorClasses(metric.color, true)} ${sizeClass}`}>
                      {valueString}
                    </p>
                  )}
                </div>

                {/* Subtítulo/información adicional - Responsivo */}
                <p className="text-gray-400 text-xs sm:text-xs leading-tight overflow-hidden" style={{ 
                  display: '-webkit-box', 
                  WebkitLineClamp: 2, 
                  WebkitBoxOrient: 'vertical' 
                }}>
                  {metric.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mt-8">
        {/* Resumen de rentabilidad */}
        <div className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 lg:p-8 backdrop-blur-sm shadow-2xl shadow-blue-500/20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-2xl"></div>
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-xl border border-green-500/20 shadow-xl shadow-blue-500/20">
                <Target className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Análisis de Rentabilidad</h3>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300 text-sm">Margen Neto:</span>
                <div className="text-right">
                  <span className={`font-semibold ${summary.netProfit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {calculations?.profitMargin || '0.0'}%
                  </span>
                  <p className="text-xs text-gray-400">
                    {formatCurrencyClean(summary.netProfit || 0)}
                  </p>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300 text-sm">Margen Bruto:</span>
                <div className="text-right">
                  <span className={`font-semibold ${parseFloat(calculations?.grossMargin || 0) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {calculations?.grossMargin || '0.0'}%
                  </span>
                  <p className="text-xs text-gray-400">
                    {formatCurrencyClean(calculations?.grossMarginAmount || 0)}
                  </p>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300 text-sm">Eficiencia:</span>
                <div className="text-right">
                  <span className={`font-semibold ${parseFloat(calculations?.operationalEfficiency || 0) >= 2 ? 'text-green-400' : parseFloat(calculations?.operationalEfficiency || 0) >= 1.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {calculations?.operationalEfficiency ? `${(parseFloat(calculations.operationalEfficiency) * 100).toFixed(1)}%` : '0.0%'}
                  </span>
                  <p className="text-xs text-gray-400">
                    {summary.totalExpenses > 0 ? `$${calculations?.operationalEfficiency || '0.00'} x $1 gastado` : 'Sin gastos registrados'}
                  </p>
                </div>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-2 mt-2">
                <span className="text-gray-400 text-xs">Retorno por inversión:</span>
                <div className="text-right">
                  <span className={`font-semibold text-sm ${parseFloat(calculations?.returnOnInvestment || 0) >= 1 ? 'text-green-400' : 'text-red-400'}`}>
                    ${calculations?.returnOnInvestment || '0.00'}
                  </span>
                  <p className="text-xs text-gray-400">
                    Por cada peso gastado
                  </p>
                </div>
              </div>


            </div>
          </div>
        </div>

        {/* Panel de Reembolsos */}
        <div className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 lg:p-8 backdrop-blur-sm shadow-2xl shadow-blue-500/20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-2xl"></div>
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/10 backdrop-blur-md border border-white/30 rounded-xl shadow-lg shadow-white/10">
                <Minus className="w-6 h-6 text-black" />
              </div>
              <h3 className="text-lg font-semibold text-white">Panel de Reembolsos</h3>
            </div>
            
            <div className="space-y-3">
              <p className="text-gray-400 text-sm leading-relaxed">
                {user?.role === 'admin' 
                  ? 'Gestiona códigos de verificación y supervisa todos los reembolsos del sistema.'
                  : 'Accede al sistema de reembolsos con autorización del administrador.'
                }
              </p>
              
              <div className="space-y-2">
                <button
                  onClick={() => setRefundsModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 backdrop-blur-md border border-white/30 text-black rounded-xl hover:bg-white/15 hover:text-slate-900 transition-all duration-300 group shadow-lg shadow-white/10"
                >
                  <Minus className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                  <span className="text-sm font-medium">
                    {user?.role === 'admin' ? 'Gestionar Reembolsos' : 'Ver Reembolsos'}
                  </span>
                </button>
                
                {user?.role !== 'admin' && (
                  <button
                    onClick={() => {
                      window.location.href = '/barber/sales';
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-xl hover:bg-blue-600/30 hover:text-blue-300 transition-all duration-300"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span className="text-xs font-medium">Procesar Reembolso</span>
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/5">
                <div className="bg-white/10 backdrop-blur-md border border-white/30 rounded-lg p-2 text-center shadow-lg shadow-white/10">
                  <p className="text-xs text-black mb-1">Total</p>
                  <p className="text-xs font-bold text-slate-900">{formatCurrencyClean(refundsData.totalAmount)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/30 rounded-lg p-2 text-center shadow-lg shadow-white/10">
                  <p className="text-xs text-black mb-1">Mes</p>
                  <p className="text-xs font-bold text-slate-900">{refundsData.monthlyRefunds}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Balance general */}
        <div className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 lg:p-8 backdrop-blur-sm shadow-2xl shadow-blue-500/20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-2xl"></div>
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-600/20 to-green-600/20 rounded-xl border border-blue-500/20 shadow-xl shadow-blue-500/20">
                <Calculator className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Balance & Flujo</h3>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300 text-sm">Ingresos:</span>
                <span className="text-green-400 font-semibold">
                  {formatCurrency(summary.totalRevenue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300 text-sm">Gastos:</span>
                <div className="text-right">
                  <span className="text-red-400 font-semibold">
                    {formatCurrency(summary.totalExpenses)}
                  </span>
                  <p className="text-xs text-red-400 mt-1">
                    {calculations?.expenseRatio || '0.0'}%
                 </p>
                </div>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2">
                <span className="text-white font-medium">Flujo Neto:</span>
                <span className={`font-bold ${summary.netProfit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(summary.netProfit)}
                </span>
              </div>
              <div className="border-t border-white/5 pt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-xs">Ratio Liquidez:</span>
                  <span className={`font-semibold text-sm ${parseFloat(calculations?.liquidityRatio || 0) >= 1.5 ? 'text-green-400' : parseFloat(calculations?.liquidityRatio || 0) >= 1.0 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {calculations?.liquidityRatio || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-xs">Transacciones:</span>
                  <span className="text-blue-400 font-semibold text-sm">
                    {(calculations?.totalServiceSales || 0) + (calculations?.totalProductSales || 0) + (summary.totalAppointments || 0)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-2 mt-1">
                <span className="text-gray-400 text-xs">Eficiencia financiera:</span>
                <span className={`font-semibold text-sm ${parseFloat(calculations?.liquidityRatio || 0) > 2 ? 'text-green-400' : parseFloat(calculations?.liquidityRatio || 0) > 1.2 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {parseFloat(calculations?.liquidityRatio || 0) > 2 ? 'Excelente' : parseFloat(calculations?.liquidityRatio || 0) > 1.2 ? 'Buena' : 'Mejorable'}
                </span>
              </div>


            </div>
          </div>
        </div>
      </div>

      {/* Modal de Socios */}
      <SociosModal
        isOpen={sociosModalOpen}
        onClose={async () => {
          setSociosModalOpen(false);
          // Recargar datos de socios cuando se cierre el modal
          try {
            const response = await sociosService.getAll();
            const socios = response.data.socios || [];
            const totalPorcentaje = response.data.totalPorcentaje || 0;
            const disponible = Math.max(0, 100 - totalPorcentaje); // Asegurar que disponible = 100 - asignado
            
            setSociosData({
              totalSocios: socios.length,
              totalPorcentaje,
              disponible
            });
          } catch (error) {
            console.error('Error recargando datos de socios:', error);
          }
        }}
        totalProfit={summary?.netProfit || 0}
        formatCurrency={formatCurrency}
      />

      {/* Modal de Reembolsos */}
      <RefundedSalesModal
        isOpen={refundsModalOpen}
        onClose={() => {
          setRefundsModalOpen(false);
          refreshRefundsData(); // Refrescar datos al cerrar el modal
        }}
        isAdmin={user?.role === 'admin'}
      />
    </div>
  );
};

export default FinancialDashboard;