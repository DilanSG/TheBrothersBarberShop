import { useState } from 'react';
import { X, DollarSign, Calendar, Repeat, Zap } from 'lucide-react';
import GradientButton from '../ui/GradientButton';

/**
 * Selector de tipo de gasto - Decide si crear gasto único o recurrente
 */
export const ExpenseTypeSelector = ({ isOpen, onClose, onSelectType }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[10002] p-4 sm:p-6 lg:p-8">
      <div className="relative w-full max-w-sm sm:max-w-md mx-auto h-[90vh] sm:h-[85vh] lg:h-[80vh] flex flex-col">
        <div className="relative bg-blue-500/5 backdrop-blur-md border border-blue-500/20 rounded-2xl shadow-2xl shadow-blue-500/20 h-full flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="relative z-10 flex-shrink-0 p-4 sm:p-6 border-b border-blue-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    Nuevo Gasto
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300">
                    Selecciona el tipo de gasto que deseas crear
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-white transition-colors duration-200"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Gasto Único */}
            <button
              onClick={() => onSelectType('one-time')}
              className="w-full p-4 sm:p-6 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-xl hover:border-green-500/50 transition-all duration-300 group text-left"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-lg bg-green-500/20 border border-green-500/30 group-hover:bg-green-500/30 transition-colors">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base sm:text-lg font-semibold text-white mb-2">
                    Gasto Único
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-300 mb-3">
                    Un gasto que ocurre una sola vez en una fecha específica
                  </p>
                  <div className="text-xs text-green-400 space-y-1">
                    <p>• Compras de productos</p>
                    <p>• Reparaciones puntuales</p>
                    <p>• Gastos extraordinarios</p>
                  </div>
                </div>
              </div>
            </button>

            {/* Gasto Recurrente */}
            <button
              onClick={() => onSelectType('recurring')}
              className="w-full p-4 sm:p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl hover:border-purple-500/50 transition-all duration-300 group text-left"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-lg bg-purple-500/20 border border-purple-500/30 group-hover:bg-purple-500/30 transition-colors">
                  <Repeat className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base sm:text-lg font-semibold text-white mb-2">
                    Gasto Recurrente
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-300 mb-3">
                    Un gasto que se repite automáticamente según una frecuencia
                  </p>
                  <div className="text-xs text-purple-400 space-y-1">
                    <p>• Arriendo mensual</p>
                    <p>• Servicios públicos</p>
                    <p>• Salarios y nómina</p>
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="relative z-10 flex-shrink-0 p-4 sm:p-6 border-t border-blue-500/20 bg-blue-500/5">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
              <Zap className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <span>Los gastos recurrentes se procesan automáticamente según su configuración</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseTypeSelector;