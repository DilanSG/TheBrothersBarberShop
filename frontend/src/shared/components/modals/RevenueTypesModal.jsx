import React from 'react';
import { X, Scissors, ShoppingBag, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

// Función de formateo de moneda local
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const RevenueTypesModal = ({ isOpen, onClose, revenueData, dateRange, formatCurrency: externalFormatCurrency }) => {
  // Bloquear scroll del body usando hook personalizado
  useBodyScrollLock(isOpen);
  
  if (!isOpen || !revenueData) return null;

  // Tipos de ingresos con sus iconos y colores
  const revenueTypes = [
    { 
      id: 'products', 
      name: 'Ventas de Productos', 
      icon: ShoppingBag, 
      color: 'emerald',
      amount: revenueData.byType?.products || 0,
      description: 'Ingresos por venta de productos',
      details: 'Shampoos, pomadas, accesorios, etc.'
    },
    { 
      id: 'services', 
      name: 'Servicios de Barbería', 
      icon: Scissors, 
      color: 'blue',
      amount: revenueData.byType?.services || 0,
      description: 'Cortes y servicios directos',
      details: 'Cortes de cabello, afeitado, peinado, etc.'
    },
    { 
      id: 'appointments', 
      name: 'Citas Programadas', 
      icon: Calendar, 
      color: 'purple',
      amount: revenueData.byType?.appointments || 0,
      description: 'Servicios con cita previa',
      details: 'Servicios reservados con anticipación'
    }
  ];

  const totalRevenue = revenueTypes.reduce((sum, type) => sum + type.amount, 0);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 sm:p-6 lg:p-8">
      <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-2xl mx-auto h-[90vh] sm:h-[85vh] lg:h-auto max-h-[80vh] flex flex-col">
        <div className="relative bg-purple-500/5 backdrop-blur-md border border-purple-500/20 rounded-2xl shadow-2xl shadow-purple-500/20 h-full flex flex-col overflow-hidden">
          {/* Header fijo */}
          <div className="relative z-10 flex-shrink-0 p-4 sm:p-6 border-b border-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    Tipos de Ingresos
                  </h3>
                  <p className="text-xs sm:text-sm text-purple-300">
                    Análisis por fuente de ingresos
                  </p>
                  {dateRange && (
                    <p className="text-xs text-blue-300/80 mt-1">
                      {format(new Date(dateRange.startDate), 'dd/MM/yyyy')} - {format(new Date(dateRange.endDate), 'dd/MM/yyyy')}
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
            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-xs text-purple-300">Total de ingresos</p>
                <DollarSign className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-lg sm:text-xl font-bold text-purple-400">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-4 pt-4">
              {revenueTypes.map((type) => {
                const percentage = totalRevenue > 0 ? (type.amount / totalRevenue * 100) : 0;
                const IconComponent = type.icon;
                
                const getColorClasses = (color) => {
                  const colors = {
                    emerald: 'bg-emerald-500/5 border-emerald-500/20',
                    blue: 'bg-blue-500/5 border-blue-500/20',
                    purple: 'bg-purple-500/5 border-purple-500/20'
                  };
                  return colors[color] || colors.blue;
                };

                const getIconColorClasses = (color) => {
                  const colors = {
                    emerald: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
                    blue: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
                    purple: 'bg-purple-500/20 border-purple-500/30 text-purple-400'
                  };
                  return colors[color] || colors.blue;
                };

                const getTextColor = (color) => {
                  const colors = {
                    emerald: 'text-emerald-400',
                    blue: 'text-blue-400',
                    purple: 'text-purple-400'
                  };
                  return colors[color] || colors.blue;
                };

                const getProgressColor = (color) => {
                  const colors = {
                    emerald: 'bg-emerald-400',
                    blue: 'bg-blue-400',
                    purple: 'bg-purple-400'
                  };
                  return colors[color] || colors.blue;
                };
                
                return (
                  <div key={type.id} className={`p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] ${getColorClasses(type.color)}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg border ${getIconColorClasses(type.color)}`}>
                          <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div>
                          <h4 className="font-medium text-white text-sm sm:text-base">{type.name}</h4>
                          <p className="text-xs text-gray-400">{type.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${getTextColor(type.color)}`}>
                          {formatCurrency(type.amount)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {percentage.toFixed(1)}% del total
                        </p>
                      </div>
                    </div>

                    {/* Detalles adicionales */}
                    <p className="text-xs text-gray-500 mb-3">{type.details}</p>

                    {/* Barra de progreso */}
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getProgressColor(type.color)}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueTypesModal;