import React from 'react';
import { 
  X, 
  DollarSign, 
  CreditCard, 
  Smartphone, 
  Banknote,
  TrendingUp,
  ArrowUpRight,
  PieChart
} from 'lucide-react';
import GradientText from '../ui/GradientText';
import GradientButton from '../ui/GradientButton';

/**
 * Modal para mostrar desglose detallado de medios de pago
 */
export const PaymentMethodsModal = ({ 
  isOpen, 
  onClose, 
  data, 
  formatCurrency, 
  dateRange 
}) => {
  if (!isOpen) return null;

  const { summary } = data;
  const paymentMethods = summary?.paymentMethods || {};

  const paymentDetails = [
    {
      method: 'Efectivo',
      amount: paymentMethods.cash || 0,
      icon: Banknote,
      color: 'green',
      description: 'Pagos en efectivo'
    },
    {
      method: 'Tarjeta Débito',
      amount: paymentMethods.debit || 0,
      icon: CreditCard,
      color: 'blue',
      description: 'Pagos con tarjeta débito'
    },
    {
      method: 'Tarjeta Crédito',
      amount: paymentMethods.credit || 0,
      icon: CreditCard,
      color: 'purple',
      description: 'Pagos con tarjeta de crédito'
    },
    {
      method: 'Transferencia',
      amount: paymentMethods.transfer || 0,
      icon: Smartphone,
      color: 'orange',
      description: 'Transferencias bancarias y apps'
    }
  ];

  const totalAmount = paymentDetails.reduce((sum, method) => sum + method.amount, 0);

  const getColorClasses = (color) => {
    const colors = {
      green: 'from-green-600/20 to-green-500/10 border-green-500/30 text-green-400',
      blue: 'from-blue-600/20 to-blue-500/10 border-blue-500/30 text-blue-400',
      purple: 'from-purple-600/20 to-purple-500/10 border-purple-500/30 text-purple-400',
      orange: 'from-orange-600/20 to-orange-500/10 border-orange-500/30 text-orange-400'
    };
    return colors[color] || colors.blue;
  };

  const getPercentage = (amount) => {
    return totalAmount > 0 ? ((amount / totalAmount) * 100).toFixed(1) : 0;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 lg:p-8">
      <div className="relative w-full max-w-3xl mx-auto">
        <div className="relative bg-blue-500/5 backdrop-blur-md border border-blue-500/20 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl shadow-blue-500/20 max-h-[90vh] overflow-y-auto custom-scrollbar">
          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/20 shadow-xl shadow-blue-500/20">
                  <PieChart className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                </div>
                <div>
                  <GradientText className="text-lg sm:text-xl lg:text-2xl font-bold">
                    Desglose por Medios de Pago
                  </GradientText>
                  <p className="text-gray-400 text-xs sm:text-sm">
                    {dateRange?.start && dateRange?.end 
                      ? `${new Date(dateRange.start).toLocaleDateString('es-CO')} - ${new Date(dateRange.end).toLocaleDateString('es-CO')}`
                      : 'Período seleccionado'
                    }
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="group relative p-2 bg-gradient-to-r from-red-600/20 to-orange-600/20 rounded-lg border border-red-500/30 hover:border-orange-500/40 transition-all duration-300 backdrop-blur-sm hover:bg-gradient-to-r hover:from-red-600/30 hover:to-orange-600/30 transform hover:scale-110 shadow-xl shadow-blue-500/20"
              >
                <X className="w-5 h-5 text-red-400 group-hover:text-orange-400 transition-colors duration-300" />
              </button>
            </div>

            {/* Total general */}
            <div className="group relative bg-white/5 border border-white/10 rounded-xl p-6 mb-6 backdrop-blur-sm shadow-xl shadow-blue-500/20 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-xl"></div>
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-xl border border-green-500/20 shadow-xl shadow-blue-500/20">
                    <DollarSign className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Total de Ingresos</h3>
                    <p className="text-gray-400 text-sm">Suma de todos los medios de pago</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-400">{formatCurrency(totalAmount)}</p>
                  <div className="flex items-center gap-1 text-green-400 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Desglose por método */}
            <div className="space-y-4">
              {paymentDetails.map((method, index) => {
                const IconComponent = method.icon;
                const percentage = getPercentage(method.amount);
                
                return (
                  <div
                    key={index}
                    className={`group relative bg-gradient-to-r ${getColorClasses(method.color)} rounded-xl p-4 backdrop-blur-sm shadow-xl shadow-blue-500/20 overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-xl"></div>
                    
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 bg-gradient-to-r ${getColorClasses(method.color)} rounded-lg border shadow-lg`}>
                          <IconComponent className={`w-5 h-5 ${method.color === 'green' ? 'text-green-400' : method.color === 'blue' ? 'text-blue-400' : method.color === 'purple' ? 'text-purple-400' : 'text-orange-400'}`} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">{method.method}</h4>
                          <p className="text-gray-300 text-sm">{method.description}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className={`text-xl font-bold ${method.color === 'green' ? 'text-green-400' : method.color === 'blue' ? 'text-blue-400' : method.color === 'purple' ? 'text-purple-400' : 'text-orange-400'}`}>
                          {formatCurrency(method.amount)}
                        </p>
                        <div className="flex items-center gap-1 text-gray-300 text-sm">
                          <ArrowUpRight className="w-3 h-3" />
                          <span>{percentage}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="mt-3 bg-white/10 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${method.color === 'green' ? 'from-green-500 to-green-400' : method.color === 'blue' ? 'from-blue-500 to-blue-400' : method.color === 'purple' ? 'from-purple-500 to-purple-400' : 'from-orange-500 to-orange-400'} transition-all duration-1000 ease-out`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer con botón de cerrar */}
            <div className="flex justify-end mt-6">
              <GradientButton
                onClick={onClose}
                variant="secondary"
                size="md"
                className="shadow-xl shadow-blue-500/20"
              >
                <div className="flex items-center gap-2">
                  <X className="w-4 h-4" />
                  <span>Cerrar</span>
                </div>
              </GradientButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};