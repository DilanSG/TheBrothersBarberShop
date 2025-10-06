import React, { useState, useCallback } from 'react';
import { X, Calendar, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import ReactCalendar from 'react-calendar';
import GradientButton from '../ui/GradientButton';
import scrollLockManager from '../../utils/scrollLockManager';
import 'react-calendar/dist/Calendar.css';

/**
 * Modal para selección de rango de fechas personalizado
 */
const DateRangeModal = ({ isOpen, onClose, onSelectDateRange, currentRange = null }) => {
  if (!isOpen) return null;

  const [selectedRange, setSelectedRange] = useState(() => {
    // Solo inicializar con datos si realmente vienen del currentRange y son válidos
    if (currentRange?.startDate && currentRange?.endDate && 
        currentRange.startDate !== '2020-01-01' && 
        currentRange.endDate !== '2020-01-01') {
      // Crear fechas locales para evitar problemas de zona horaria
      const parseLocalDate = (dateString) => {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
      };
      
      return {
        from: parseLocalDate(currentRange.startDate),
        to: parseLocalDate(currentRange.endDate)
      };
    }
    // Inicializar vacío para que el usuario seleccione manualmente
    return null;
  });

  const handleRangeSelect = useCallback((dateRange) => {
    if (Array.isArray(dateRange) && dateRange.length === 2) {
      setSelectedRange({
        from: dateRange[0],
        to: dateRange[1]
      });
    } else if (dateRange) {
      setSelectedRange({
        from: dateRange,
        to: dateRange
      });
    }
  }, []);

  const handleApply = useCallback(() => {
    if (selectedRange?.from && selectedRange?.to) {
      // Usar formateo local para evitar problemas de zona horaria
      const formatDateLocal = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const dateRangeData = {
        startDate: formatDateLocal(selectedRange.from),
        endDate: formatDateLocal(selectedRange.to)
      };
      
      onSelectDateRange(dateRangeData);
      onClose();
    }
  }, [selectedRange, onSelectDateRange, onClose]);

  // DateRangeModal no bloquea el scroll del body
  // Permitir scroll de la página mientras el modal está abierto

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[10005] p-2 sm:p-4 lg:p-8 pt-8 sm:pt-10"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xs sm:max-w-lg mx-auto h-[85vh] sm:h-[80vh] lg:h-[75vh] flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevenir que se cierre al hacer click dentro del modal
      >
        <div className="relative bg-blue-500/5 backdrop-blur-md border border-blue-500/20 rounded-2xl shadow-2xl shadow-blue-500/20 h-full flex flex-col overflow-hidden">
          
          {/* Header fijo */}
          <div className="flex-shrink-0 p-2 sm:p-3 lg:p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/20">
                  <Calendar className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Seleccionar Período
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Elige un rango de fechas personalizado
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-red-600/20 rounded-lg transition-colors group border border-red-500/20"
              >
                <X className="w-5 h-5 text-red-400 group-hover:text-red-300" />
              </button>
            </div>
          </div>

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
            <div className="p-2 sm:p-3 lg:p-4 space-y-4">
              {/* Calendario */}
              <div className="custom-calendar bg-white/5 rounded-xl p-4 border border-white/10">
                <style dangerouslySetInnerHTML={{
                  __html: `
                    /* Scrollbar personalizada */
                    .custom-scrollbar {
                      scrollbar-width: thin;
                      scrollbar-color: rgba(59, 130, 246, 0.5) rgba(255, 255, 255, 0.1);
                    }
                    
                    .custom-scrollbar::-webkit-scrollbar {
                      width: 6px;
                    }
                    
                    .custom-scrollbar::-webkit-scrollbar-track {
                      background: rgba(255, 255, 255, 0.05);
                      border-radius: 3px;
                    }
                    
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                      background: rgba(59, 130, 246, 0.6);
                      border-radius: 3px;
                      transition: background 0.2s;
                    }
                    
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                      background: rgba(59, 130, 246, 0.8);
                    }

                    /* Calendario */
                    .custom-calendar .react-calendar {
                      width: 100%;
                      max-width: 100%;
                      background: transparent;
                      border: none;
                      font-family: inherit;
                      line-height: 1.125em;
                    }
                    
                    .custom-calendar .react-calendar__navigation {
                      display: flex;
                      height: 44px;
                      margin-bottom: 1em;
                      align-items: center;
                      justify-content: space-between;
                    }
                    
                    .custom-calendar .react-calendar__navigation button {
                      min-width: 44px;
                      background: rgba(255, 255, 255, 0.1);
                      border: 1px solid rgba(255, 255, 255, 0.2);
                      border-radius: 0.5rem;
                      color: white;
                      padding: 0.5rem;
                      font-size: 0.875rem;
                      font-weight: 600;
                      transition: all 0.2s;
                    }
                    
                    .custom-calendar .react-calendar__navigation button:enabled:hover,
                    .custom-calendar .react-calendar__navigation button:enabled:focus {
                      background: #3b82f6;
                      border-color: #60a5fa;
                    }
                    
                    .custom-calendar .react-calendar__navigation__label {
                      flex: 1;
                      text-align: center;
                      font-size: 1rem;
                      font-weight: bold;
                      color: white;
                      cursor: pointer;
                    }
                    
                    .custom-calendar .react-calendar__month-view__weekdays {
                      display: grid;
                      grid-template-columns: repeat(7, 1fr);
                      text-align: center;
                      text-transform: uppercase;
                      font-weight: bold;
                      font-size: 0.75em;
                      color: rgba(255, 255, 255, 0.7);
                      gap: 2px;
                    }
                    
                    .custom-calendar .react-calendar__month-view__weekdays__weekday {
                      padding: 0.5em;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    }
                    
                    .custom-calendar .react-calendar__month-view__days {
                      display: grid !important;
                      grid-template-columns: repeat(7, 1fr) !important;
                      gap: 2px;
                    }
                    
                    .custom-calendar .react-calendar__month-view__days__day {
                      color: white;
                      background: rgba(255, 255, 255, 0.1);
                      border: 1px solid rgba(255, 255, 255, 0.2);
                      border-radius: 0.5rem;
                      height: 36px;
                      font-weight: 600;
                      font-size: 0.875rem;
                      transition: all 0.2s;
                      display: flex !important;
                      align-items: center;
                      justify-content: center;
                    }
                    
                    .custom-calendar .react-calendar__month-view__days__day:hover {
                      background: rgba(255, 255, 255, 0.2);
                      border-color: rgba(255, 255, 255, 0.4);
                      transform: scale(1.05);
                    }
                    
                    .custom-calendar .react-calendar__tile--now {
                      background: #eab308 !important;
                      color: black !important;
                      border-color: #facc15 !important;
                      box-shadow: 0 4px 12px rgba(234, 179, 8, 0.4);
                      font-weight: bold;
                    }
                    
                    .custom-calendar .react-calendar__month-view__days__day--neighboringMonth {
                      color: rgba(255, 255, 255, 0.3) !important;
                      background: transparent !important;
                    }
                    
                    .custom-calendar .react-calendar__tile--rangeStart {
                      background: #3b82f6 !important;
                      color: white !important;
                      border-color: #60a5fa !important;
                      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
                    }
                    
                    .custom-calendar .react-calendar__tile--rangeEnd {
                      background: #22c55e !important;
                      color: white !important;
                      border-color: #4ade80 !important;
                      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
                    }
                    
                    .custom-calendar .react-calendar__tile--range {
                      background: linear-gradient(135deg, rgba(59, 130, 246, 0.6), rgba(34, 197, 94, 0.6)) !important;
                      color: white !important;
                      border-color: rgba(59, 130, 246, 0.5) !important;
                    }
                    
                    .custom-calendar .react-calendar__tile--active {
                      background: #3b82f6 !important;
                      color: white !important;
                    }
                    
                    .custom-calendar .react-calendar__year-view__months,
                    .custom-calendar .react-calendar__decade-view__years,
                    .custom-calendar .react-calendar__century-view__decades {
                      display: grid !important;
                      grid-template-columns: repeat(3, 1fr) !important;
                      gap: 8px !important;
                    }
                    
                    .custom-calendar .react-calendar__year-view__months__month,
                    .custom-calendar .react-calendar__decade-view__years__year,
                    .custom-calendar .react-calendar__century-view__decades__decade {
                      color: white !important;
                      background: rgba(255, 255, 255, 0.1) !important;
                      border: 1px solid rgba(255, 255, 255, 0.2) !important;
                      border-radius: 0.5rem !important;
                      padding: 0.75rem !important;
                      font-weight: 600 !important;
                      font-size: 0.875rem !important;
                      transition: all 0.2s !important;
                      display: flex !important;
                      align-items: center !important;
                      justify-content: center !important;
                      min-height: 44px !important;
                    }
                    
                    .custom-calendar .react-calendar__year-view__months__month:hover,
                    .custom-calendar .react-calendar__decade-view__years__year:hover,
                    .custom-calendar .react-calendar__century-view__decades__decade:hover {
                      background: rgba(255, 255, 255, 0.2) !important;
                      border-color: rgba(255, 255, 255, 0.4) !important;
                      transform: scale(1.05) !important;
                    }
                  `
                }} />
                
                <ReactCalendar
                  selectRange={true}
                  value={selectedRange ? [selectedRange.from, selectedRange.to].filter(Boolean) : null}
                  onChange={handleRangeSelect}
                  locale="es-ES"
                  showWeekNumbers={false}
                  defaultActiveStartDate={new Date()}
                  navigationLabel={({ date, view }) => {
                    if (view === 'month') {
                      return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
                    }
                    if (view === 'year') {
                      return date.getFullYear().toString();
                    }
                    if (view === 'decade') {
                      const startYear = Math.floor(date.getFullYear() / 10) * 10;
                      return `${startYear} - ${startYear + 9}`;
                    }
                    return null;
                  }}
                  formatShortWeekday={(locale, date) => {
                    const days = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];
                    return days[date.getDay()];
                  }}
                  prevLabel={<ChevronLeft className="w-4 h-4" />}
                  nextLabel={<ChevronRight className="w-4 h-4" />}
                  prev2Label={null}
                  next2Label={null}
                />
              </div>

              {/* Selected range display */}
              {selectedRange?.from && (
                <div className="bg-gradient-to-r from-blue-600/10 to-green-600/10 border border-blue-500/30 rounded-xl p-3">
                  <div className="text-center space-y-2">
                    <p className="text-gray-300 text-xs font-medium">Período seleccionado:</p>
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <div className="flex items-center gap-1 bg-blue-600/20 px-2 py-1 rounded border border-blue-500/30">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-white font-medium">
                          {selectedRange.from.toLocaleDateString('es-ES', { 
                            day: 'numeric', 
                            month: 'numeric', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                      
                      {selectedRange.to && selectedRange.to.getTime() !== selectedRange.from.getTime() && (
                        <>
                          <span className="text-gray-400">→</span>
                          <div className="flex items-center gap-1 bg-green-600/20 px-2 py-1 rounded border border-green-500/30">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-white font-medium">
                              {selectedRange.to.toLocaleDateString('es-ES', { 
                                day: 'numeric', 
                                month: 'numeric', 
                                year: 'numeric' 
                              })}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {selectedRange.from && selectedRange.to && selectedRange.to.getTime() !== selectedRange.from.getTime() && (
                      <div className="text-xs text-gray-400">
                        {(() => {
                          // Calcular días de forma consistente usando solo las fechas (sin horas)
                          const startDate = new Date(selectedRange.from.getFullYear(), selectedRange.from.getMonth(), selectedRange.from.getDate());
                          const endDate = new Date(selectedRange.to.getFullYear(), selectedRange.to.getMonth(), selectedRange.to.getDate());
                          const diffTime = endDate - startDate;
                          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
                          
                          return diffDays;
                        })()} días
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-2 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-3 py-3 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-800 hover:text-white transition-colors text-sm"
                >
                  Cancelar
                </button>
                
                <GradientButton
                  onClick={handleApply}
                  disabled={!selectedRange?.from || !selectedRange?.to}
                  className="flex-1 text-base py-3 px-3 disabled:opacity-50 disabled:cursor-not-allowed relative"
                >
                  <span className="text-center w-full">Aplicar</span>
                  <Check size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2" />
                </GradientButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateRangeModal;