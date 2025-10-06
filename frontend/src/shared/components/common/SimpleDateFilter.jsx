import React, { useState } from 'react';
import { Calendar, Clock, Filter } from 'lucide-react';
import DateRangeModal from '../modals/DateRangeModal';

export const SimpleDateFilter = ({
  dateRange,
  onPresetChange,
  onCustomDateChange,
  loading = false,
  className = '',
  availableDates = []
}) => {
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);



  const presets = [
    { key: 'all', label: 'General', icon: Filter, description: 'Todos los datos' },
    { key: 'today', label: 'Hoy', icon: Clock, description: 'Solo hoy' },
    { key: 'yesterday', label: 'Ayer', icon: Clock, description: 'Solo ayer' },
    { key: 'custom', label: 'Personalizado', icon: Calendar, description: 'Rango específico' }
  ];

  // Función para formatear las fechas del rango personalizado
  const formatDateRange = () => {
    if (!dateRange?.startDate || !dateRange?.endDate) return null;
    
    // ✅ Evitar problemas de zona horaria parseando directamente la string de fecha
    const formatDate = (dateString) => {
      // Si ya es una string en formato YYYY-MM-DD, parsearla directamente
      if (typeof dateString === 'string' && dateString.includes('-')) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year.slice(-2)}`;
      }
      
      // Si no, usar el constructor Date normalmente
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      });
    };
    
    const startFormatted = formatDate(dateRange.startDate);
    const endFormatted = formatDate(dateRange.endDate);
    
    if (dateRange.startDate === dateRange.endDate) {
      return startFormatted;
    }
    
    return `${startFormatted} - ${endFormatted}`;
  };

  return (
    <>
      {/* Filtro compacto estilo tabs */}
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        <div className="bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm shadow-xl shadow-blue-500/20 p-1 flex flex-col sm:flex-row gap-1 w-full max-w-xs sm:max-w-2xl">
          {/* Título del filtro con indicador de fecha */}
          <div className="flex items-center justify-center gap-2 px-3 py-2.5 text-blue-300 font-medium text-xs sm:text-xs whitespace-nowrap border-r border-white/10 sm:border-r sm:border-white/10 border-b sm:border-b-0">
            <Filter size={14} />
            <div className="flex flex-col items-center">
              <span>Filtrar Período</span>
              {dateRange?.preset && dateRange.preset !== 'all' && (
                <span className="text-yellow-300 text-[10px] font-normal mt-0.5">
                  {dateRange.preset === 'today' && `📅 ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}`}
                  {dateRange.preset === 'yesterday' && `📅 ${new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}`}
                  {dateRange.preset === 'custom' && dateRange?.startDate && dateRange?.endDate && `📅 ${formatDateRange()}`}
                </span>
              )}
            </div>
          </div>
          
          {/* Botones de filtro */}
          <div className="flex flex-col sm:flex-row gap-1 flex-1">
            {presets.map((preset) => {
              const isActive = dateRange?.preset === preset.key;
              const Icon = preset.icon;
              
              // Siempre mostrar la etiqueta del preset, las fechas aparecen debajo del título
              const displayText = preset.label;
              
              return (
                <button
                  key={preset.key}
                  onClick={() => {
                    if (preset.key === 'custom') {
                      setShowDateRangeModal(true);
                    } else {
                      onPresetChange(preset.key);
                    }
                  }}
                  disabled={loading}
                  className={`group relative px-3 py-2.5 rounded-xl border cursor-pointer transition-all duration-300 hover:scale-105 overflow-hidden backdrop-blur-sm flex-1 flex items-center justify-center gap-1.5 ${
                    isActive
                      ? 'border-blue-500/50 bg-blue-500/10 shadow-xl shadow-blue-500/20'
                      : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Icon size={14} className={`transition-all duration-300 ${
                    isActive ? 'text-blue-300' : 'text-white'
                  }`} />
                  <span className={`font-medium text-xs sm:text-xs whitespace-nowrap ${
                    isActive ? 'text-blue-300' : 'text-white'
                  }`}>
                    {displayText}
                  </span>
                  
                  {loading && isActive && (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400 ml-1"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal de rango personalizado */}
      <DateRangeModal
        isOpen={showDateRangeModal}
        onClose={() => {
          setShowDateRangeModal(false);
        }}
        onSelectDateRange={(dateRange) => {
          if (onCustomDateChange && dateRange.startDate && dateRange.endDate) {
            onCustomDateChange(dateRange.startDate, dateRange.endDate);
          }
          
          if (onPresetChange) {
            onPresetChange('custom');
          }
          
          setShowDateRangeModal(false);
        }}
        currentRange={dateRange}
      />
    </>
  );
};
