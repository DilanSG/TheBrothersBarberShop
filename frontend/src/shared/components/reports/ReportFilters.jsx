import React from 'react';
import { Calendar, ChevronDown, Clock, Filter } from 'lucide-react';
import GradientText from '../ui/GradientText';

// DateRangeFilter eliminado - Se usa SimpleDateFilter en su lugar

/**
 * Filtro de categorías con selección múltiple
 */
export const CategoryFilter = ({
  categories,
  selectedCategories,
  onCategoryToggle,
  onSelectAll,
  onSelectNone,
  loading = false,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Título */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-lg border border-purple-500/20 shadow-xl shadow-blue-500/20">
            <Filter className="w-4 h-4 text-purple-400" />
          </div>
          <GradientText className="text-lg font-semibold">
            Categorías
          </GradientText>
        </div>
        
        {/* Controles de selección */}
        <div className="flex gap-2">
          <button
            onClick={onSelectAll}
            disabled={loading}
            className="text-xs px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-blue-300 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
          >
            Todas
          </button>
          <button
            onClick={onSelectNone}
            disabled={loading}
            className="text-xs px-2 py-1 bg-gray-500/20 border border-gray-500/30 rounded text-gray-300 hover:bg-gray-500/30 transition-colors disabled:opacity-50"
          >
            Ninguna
          </button>
        </div>
      </div>

      {/* Lista de categorías */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {categories.map((category) => {
          const isSelected = selectedCategories.includes(category.value);
          
          return (
            <button
              key={category.value}
              onClick={() => onCategoryToggle(category.value)}
              disabled={loading}
              className={`group relative p-3 rounded-lg border transition-all duration-300 backdrop-blur-sm shadow-xl shadow-blue-500/20 ${
                isSelected
                  ? 'border-purple-500/50 bg-purple-500/10 text-purple-300'
                  : 'border-white/20 bg-white/5 text-white hover:border-purple-500/30 hover:bg-purple-500/5'
              } ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
            >
              {/* Efecto de brillo */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-lg"></div>
              
              <div className="relative flex flex-col items-center gap-1">
                <span className="text-lg">{category.icon}</span>
                <span className="text-xs font-medium text-center">{category.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Filtro de métodos de pago
 */
export const PaymentMethodFilter = ({
  paymentMethods,
  selectedMethods,
  onMethodToggle,
  onSelectAll,
  onSelectNone,
  loading = false,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Título */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-lg border border-green-500/20 shadow-xl shadow-blue-500/20">
            <Filter className="w-4 h-4 text-green-400" />
          </div>
          <GradientText className="text-lg font-semibold">
            Métodos de Pago
          </GradientText>
        </div>
        
        {/* Controles de selección */}
        <div className="flex gap-2">
          <button
            onClick={onSelectAll}
            disabled={loading}
            className="text-xs px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-green-300 hover:bg-green-500/30 transition-colors disabled:opacity-50"
          >
            Todos
          </button>
          <button
            onClick={onSelectNone}
            disabled={loading}
            className="text-xs px-2 py-1 bg-gray-500/20 border border-gray-500/30 rounded text-gray-300 hover:bg-gray-500/30 transition-colors disabled:opacity-50"
          >
            Ninguno
          </button>
        </div>
      </div>

      {/* Lista de métodos de pago */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {paymentMethods.map((method) => {
          const isSelected = selectedMethods.includes(method.value);
          
          return (
            <button
              key={method.value}
              onClick={() => onMethodToggle(method.value)}
              disabled={loading}
              className={`group relative p-3 rounded-lg border transition-all duration-300 backdrop-blur-sm shadow-xl shadow-blue-500/20 ${
                isSelected
                  ? 'border-green-500/50 bg-green-500/10 text-green-300'
                  : 'border-white/20 bg-white/5 text-white hover:border-green-500/30 hover:bg-green-500/5'
              } ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
            >
              {/* Efecto de brillo */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-lg"></div>
              
              <div className="relative flex flex-col items-center gap-1">
                <span className="text-lg">{method.icon}</span>
                <span className="text-xs font-medium text-center">{method.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default {
  CategoryFilter,
  PaymentMethodFilter
};