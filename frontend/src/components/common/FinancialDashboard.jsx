import React from 'react';
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
  ArrowDownRight
} from 'lucide-react';
import GradientText from '../ui/GradientText';

/**
 * Dashboard de métricas financieras principales
 */
export const FinancialDashboard = ({ 
  data, 
  calculations, 
  formatCurrency, 
  loading = false,
  className = '' 
}) => {
  const { summary } = data;

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

  const metrics = [
    {
      title: 'Ingresos Totales',
      value: summary.totalRevenue,
      icon: DollarSign,
      color: 'green',
      trend: summary.netProfit > 0 ? 'up' : 'down',
      subtitle: `${calculations.profitMargin}% margen`
    },
    {
      title: 'Gastos Totales',
      value: summary.totalExpenses,
      icon: TrendingDown,
      color: 'red',
      trend: summary.totalExpenses > summary.totalRevenue ? 'up' : 'down',
      subtitle: 'Gastos del período'
    },
    {
      title: 'Ganancia Neta',
      value: summary.netProfit,
      icon: summary.netProfit > 0 ? TrendingUp : TrendingDown,
      color: summary.netProfit > 0 ? 'green' : 'red',
      trend: summary.netProfit > 0 ? 'up' : 'down',
      subtitle: `${calculations.profitMargin}% del ingreso`
    },
    {
      title: 'Citas Completadas',
      value: summary.totalAppointments,
      icon: Users,
      color: 'blue',
      trend: 'up',
      subtitle: `Promedio: ${calculations.averageServiceValue} por cita`
    },
    {
      title: 'Servicios Realizados',
      value: summary.totalServices,
      icon: Scissors,
      color: 'purple',
      trend: 'up',
      subtitle: `${calculations.servicesPercentage}% del ingreso`
    },
    {
      title: 'Productos Vendidos',
      value: summary.totalProducts,
      icon: Package,
      color: 'orange',
      trend: 'up',
      subtitle: `${calculations.productsPercentage}% del ingreso`
    },
    {
      title: 'Efectivo',
      value: summary.paymentMethods?.cash || 0,
      icon: DollarSign,
      color: 'green',
      trend: 'neutral',
      subtitle: 'Pagos en efectivo'
    },
    {
      title: 'Pagos Digitales',
      value: (summary.paymentMethods?.debit || 0) + (summary.paymentMethods?.credit || 0) + (summary.paymentMethods?.transfer || 0),
      icon: CreditCard,
      color: 'blue',
      trend: 'neutral',
      subtitle: 'Tarjetas y transferencias'
    }
  ];

  const getColorClasses = (color, isValue = false) => {
    const colors = {
      green: isValue ? 'text-green-400' : 'from-green-600/20 to-green-600/10 border-green-500/20 text-green-400',
      red: isValue ? 'text-red-400' : 'from-red-600/20 to-red-600/10 border-red-500/20 text-red-400',
      blue: isValue ? 'text-blue-400' : 'from-blue-600/20 to-blue-600/10 border-blue-500/20 text-blue-400',
      purple: isValue ? 'text-purple-400' : 'from-purple-600/20 to-purple-600/10 border-purple-500/20 text-purple-400',
      orange: isValue ? 'text-orange-400' : 'from-orange-600/20 to-orange-600/10 border-orange-500/20 text-orange-400'
    };
    return colors[color] || colors.blue;
  };

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

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Título del dashboard */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/20 shadow-xl shadow-blue-500/20">
            <BarChart3 className="w-6 h-6 text-blue-400" />
          </div>
          <GradientText className="text-xl lg:text-2xl font-bold">
            Dashboard Financiero
          </GradientText>
        </div>
      </div>

      {/* Grid de métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {metrics.map((metric, index) => {
          const IconComponent = metric.icon;
          
          return (
            <div
              key={index}
              className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 lg:p-8 backdrop-blur-sm shadow-2xl shadow-blue-500/20 hover:scale-105 transition-all duration-300 overflow-hidden"
            >
              {/* Efecto de brillo */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-2xl"></div>
              
              <div className="relative">
                {/* Header con icono y tendencia */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 bg-gradient-to-r ${getColorClasses(metric.color)} rounded-xl border shadow-xl shadow-blue-500/20`}>
                    <IconComponent className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 ${getColorClasses(metric.color, true)}`} />
                  </div>
                  {getTrendIcon(metric.trend)}
                </div>

                {/* Título */}
                <h3 className="text-gray-300 text-sm font-medium mb-2">
                  {metric.title}
                </h3>

                {/* Valor principal */}
                <div className="mb-2">
                  {typeof metric.value === 'number' ? (
                    <p className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${getColorClasses(metric.color, true)}`}>
                      {metric.title.includes('Citas') || metric.title.includes('Servicios') || metric.title.includes('Productos') 
                        ? metric.value.toLocaleString('es-CO')
                        : formatCurrency(metric.value)
                      }
                    </p>
                  ) : (
                    <p className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${getColorClasses(metric.color, true)}`}>
                      {metric.value}
                    </p>
                  )}
                </div>

                {/* Subtítulo/información adicional */}
                <p className="text-gray-400 text-xs">
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
              <h3 className="text-lg font-semibold text-white">Rentabilidad</h3>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300 text-sm">Margen de ganancia:</span>
                <span className={`font-semibold ${summary.netProfit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {calculations.profitMargin}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300 text-sm">Promedio por servicio:</span>
                <span className="text-blue-400 font-semibold">
                  {formatCurrency(calculations.averageServiceValue)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Distribución de ingresos */}
        <div className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 lg:p-8 backdrop-blur-sm shadow-2xl shadow-blue-500/20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-2xl"></div>
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl border border-purple-500/20 shadow-xl shadow-blue-500/20">
                <PieChart className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Distribución</h3>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300 text-sm">Servicios:</span>
                <span className="text-purple-400 font-semibold">
                  {calculations.servicesPercentage}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300 text-sm">Productos:</span>
                <span className="text-orange-400 font-semibold">
                  {calculations.productsPercentage}%
                </span>
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
              <h3 className="text-lg font-semibold text-white">Balance</h3>
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
                <span className="text-red-400 font-semibold">
                  {formatCurrency(summary.totalExpenses)}
                </span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2">
                <span className="text-white font-medium">Neto:</span>
                <span className={`font-bold ${summary.netProfit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(summary.netProfit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;