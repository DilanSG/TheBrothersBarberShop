import React from 'react';
import { DayPicker } from 'react-day-picker';
import { X, Calendar } from 'lucide-react';

/**
 * Modal de calendario para selección de fechas
 * Componente separado para mantener AdminBarbers más limpio
 */
const CalendarModal = ({ 
  isOpen, 
  onClose, 
  selectedDate, 
  onDateSelect, 
  availableDates = [], 
  title = "Seleccionar Fecha",
  description = "Selecciona la fecha final del período" 
}) => {
  // Early return si no está abierto
  if (!isOpen) return null;

  // Validar props requeridas
  if (typeof onClose !== 'function' || typeof onDateSelect !== 'function') {
    console.error('CalendarModal: onClose y onDateSelect deben ser funciones');
    return null;
  }

  // Helper local para obtener fecha actual
  const getLocalTodayDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Convertir fechas disponibles a objetos Date para comparación
  const availableDateObjects = (availableDates || []).map(dateStr => {
    try {
      // Si dateStr ya es una fecha ISO, úsala directamente
      // Si es solo una fecha (YYYY-MM-DD), agregar hora para evitar timezone issues
      const dateToUse = dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00.000Z';
      return new Date(dateToUse);
    } catch (e) {
      console.warn('Error parsing date:', dateStr, e);
      return new Date(dateStr); // fallback
    }
  }).filter(date => !isNaN(date.getTime()));

  const isDayAvailable = (date) => {
    if (!date || !Array.isArray(availableDates) || availableDates.length === 0) {
      return false;
    }
    
    const targetDateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    return availableDates.some(availableDateStr => {
      const availableDate = availableDateStr.split('T')[0]; // Handle both YYYY-MM-DD and ISO formats
      return availableDate === targetDateStr;
    });
  };

  const handleDateSelect = (date) => {
    if (date && onDateSelect) {
      onDateSelect(date);
    }
    onClose();
  };

  // Bloquear scroll del body cuando el modal está abierto
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 sm:p-6 lg:p-8">
      <div className="relative w-full max-w-sm sm:max-w-md mx-auto">
        <div className="relative bg-blue-500/5 backdrop-blur-md border border-blue-500/20 rounded-2xl shadow-2xl shadow-blue-500/20 overflow-hidden">
          <div className="relative z-10 p-4 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/20">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white">{title}</h3>
              </div>
              <button 
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-white transition-colors duration-200"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Descripción */}
            <div className="mb-4">
              <p className="text-sm text-blue-300 text-center">{description}</p>
            </div>
            
            {/* Calendario */}
            <div className="flex justify-center">
              <div className="bg-gray-800/90 backdrop-blur-sm border border-white/20 rounded-2xl p-4 shadow-2xl">
                <DayPicker
                  mode="single"
                  selected={selectedDate ? new Date(selectedDate + 'T12:00:00') : new Date(getLocalTodayDate() + 'T12:00:00')}
                  onSelect={handleDateSelect}
                  className="text-white"
                  disabled={(date) => !isDayAvailable(date) || date > new Date()}
                  modifiers={{
                    available: availableDateObjects,
                    selected: selectedDate ? [new Date(selectedDate + 'T12:00:00')] : [new Date(getLocalTodayDate() + 'T12:00:00')]
                  }}
                  modifiersStyles={{
                    selected: { 
                      backgroundColor: 'rgb(59 130 246 / 0.8)',
                      color: 'white',
                      borderRadius: '50%'
                    },
                    available: {
                      backgroundColor: 'rgb(34 197 94 / 0.2)',
                      color: 'rgb(34 197 94)',
                      borderRadius: '50%'
                    }
                  }}
                  classNames={{
                    months: 'w-full',
                    month: 'w-full',
                    caption: 'flex justify-center py-2 mb-4 text-white font-medium',
                    nav: 'flex items-center',
                    nav_button_previous: 'absolute left-1 h-7 w-7 bg-white/10 rounded-full hover:bg-white/20 transition-colors duration-200 flex items-center justify-center text-white',
                    nav_button_next: 'absolute right-1 h-7 w-7 bg-white/10 rounded-full hover:bg-white/20 transition-colors duration-200 flex items-center justify-center text-white',
                    table: 'w-full border-collapse',
                    head_row: 'flex text-center mb-2',
                    head_cell: 'text-white/60 font-medium w-8 h-8 text-xs flex items-center justify-center',
                    row: 'flex w-full',
                    cell: 'text-center w-8 h-8 p-0 relative',
                    day: 'h-8 w-8 p-0 font-normal text-white/40 hover:bg-blue-500/30 hover:text-white rounded-full transition-colors duration-200 flex items-center justify-center text-xs cursor-pointer',
                    day_selected: 'bg-blue-500/80 text-white font-medium',
                    day_today: 'bg-white/10 text-white font-medium',
                    day_outside: 'text-white/20',
                    day_disabled: 'text-white/20 cursor-not-allowed hover:bg-transparent hover:text-white/20',
                    day_hidden: 'invisible'
                  }}
                />
                
                {/* Leyenda */}
                <div className="mt-3 text-xs text-center">
                  <p className="text-green-400">● Días con datos disponibles</p>
                  <p className="text-white/40">● Días sin datos</p>
                </div>
              </div>
            </div>
            
            {/* Botón de cancelar */}
            <div className="mt-4 flex justify-center">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm transition-all duration-200"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarModal;
