import React from 'react';
import { Calendar, ChevronDown, Clock, Filter } from 'lucide-react';
import GradientText from '../ui/GradientText';

/**
 * Componente de filtro de rango de fechas con presets
 * Optimizado para reportes financieros
 */
export const DateRangeFilter = ({
  dateRange,
  datePresets,
  onPresetChange,
  onCustomDateChange,
  loading = false,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Título de sección */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg border border-blue-500/20 shadow-xl shadow-blue-500/20">
          <Filter className="w-4 h-4 text-blue-400" />
        </div>
        <GradientText className="text-lg font-semibold">
          Filtros de Fecha
        </GradientText>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Presets de fecha */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            Rangos Predefinidos
          </label>
          
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(datePresets).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => onPresetChange(key)}
                disabled={loading}
                className={`group relative px-3 py-2.5 rounded-lg border transition-all duration-300 text-sm font-medium backdrop-blur-sm shadow-xl shadow-blue-500/20 ${
                  dateRange.preset === key
                    ? 'border-blue-500/50 bg-blue-500/10 text-blue-300'
                    : 'border-white/20 bg-white/5 text-white hover:border-blue-500/30 hover:bg-blue-500/5'
                } ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
              >
                {/* Efecto de brillo */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[2.5%] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out rounded-lg"></div>
                
                <div className="relative">
                  {preset.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Fechas personalizadas */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            Rango Personalizado
          </label>
          
          <div className="space-y-3">
            {/* Fecha inicio */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Fecha Inicio</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => onCustomDateChange(e.target.value, dateRange.endDate)}
                disabled={loading}
                className="glassmorphism-input w-full shadow-xl shadow-blue-500/20"
              />
            </div>
            
            {/* Fecha fin */}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Fecha Final</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => onCustomDateChange(dateRange.startDate, e.target.value)}
                disabled={loading}
                className="glassmorphism-input w-full shadow-xl shadow-blue-500/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Información del rango actual */}
      <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg backdrop-blur-sm">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-blue-400" />
          <span className="text-gray-300">Rango actual:</span>
          <span className="text-blue-300 font-medium">
            {new Date(dateRange.startDate + 'T00:00:00').toLocaleDateString('es-CO', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </span>
          <span className="text-gray-400">hasta</span>
          <span className="text-blue-300 font-medium">
            {new Date(dateRange.endDate + 'T00:00:00').toLocaleDateString('es-CO', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

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
  DateRangeFilter,
  CategoryFilter,
  PaymentMethodFilter
};