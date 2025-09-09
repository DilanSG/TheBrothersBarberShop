import { useState } from 'react';

/**
 * Hook personalizado para manejar estados de UI en AdminBarbers
 * Gestiona menús, modales, calendario y otros estados de interfaz
 */
export const useBarberUI = () => {
  // Estados de UI
  const [showReportModal, setShowReportModal] = useState(false);
  const [barberMenus, setBarberMenus] = useState({});
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  // Manejar menú de barbero
  const toggleBarberMenu = async (barberId, loadBarberAvailableDates) => {
    if (barberMenus[barberId]) {
      // Cerrar menú
      setBarberMenus(prev => ({ ...prev, [barberId]: false }));
    } else {
      // Abrir menú y cargar fechas disponibles
      setBarberMenus(prev => ({ ...prev, [barberId]: true }));
      
      // Cargar fechas disponibles usando la función del hook de stats
      if (loadBarberAvailableDates) {
        await loadBarberAvailableDates(barberId);
      }
    }
  };

  // Cerrar menú específico de barbero
  const closeBarberMenu = (barberId) => {
    setBarberMenus(prev => ({ ...prev, [barberId]: false }));
  };

  // Cerrar todos los menús
  const closeAllMenus = () => {
    setBarberMenus({});
  };

  // Abrir modal de reporte
  const openReportModal = () => {
    setShowReportModal(true);
  };

  // Cerrar modal de reporte
  const closeReportModal = () => {
    setShowReportModal(false);
  };

  // Generar reporte y abrir modal
  const handleGenerateReport = async (barberId, date, generateBarberReport, closeBarberMenu) => {
    const success = await generateBarberReport(barberId, date);
    if (success) {
      openReportModal();
      if (closeBarberMenu) {
        closeBarberMenu(barberId);
      }
    }
  };

  // Utilidades para el calendario
  const isDateDisabled = (date, allAvailableDates) => {
    // Solo habilitar días con datos globales - usar fecha local
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const iso = `${year}-${month}-${day}`;
    const isDisabled = !allAvailableDates.includes(iso);
    return isDisabled;
  };

  // Manejar selección de fecha en calendario
  const handleDateSelect = (date, allAvailableDates, setFilterDate) => {
    if (!date) return;
    
    // Usar la fecha local sin conversión UTC para evitar problemas de zona horaria
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const iso = `${year}-${month}-${day}`;
    
    console.log('📅 Día seleccionado:', iso, 'Disponible:', allAvailableDates.includes(iso));
    if (allAvailableDates.includes(iso)) {
      setFilterDate(iso);
    } else {
      console.warn('⚠️ Día no disponible seleccionado:', iso);
    }
  };

  // Utilidades para generar reportes rápidos
  const generateQuickReport = async (barberId, daysBack, availableDates, generateBarberReport, showError) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysBack);
    const targetDateStr = targetDate.toISOString().split('T')[0];
    
    if (availableDates[barberId]?.includes(targetDateStr)) {
      await generateBarberReport(barberId, targetDateStr);
    } else {
      const dayName = daysBack === 1 ? 'ayer' : 'anteayer';
      showError(`No hay datos para ${dayName}`);
    }
  };

  // Manejar selección de fecha manual en input
  const handleManualDateSelect = async (selectedDate, barberId, availableDates, generateBarberReport, showError) => {
    if (availableDates[barberId]?.includes(selectedDate)) {
      await generateBarberReport(barberId, selectedDate);
      return true;
    } else if (selectedDate) {
      showError('No hay datos disponibles para la fecha seleccionada');
      return false;
    }
    return false;
  };

  return {
    // Estados de UI
    showReportModal,
    barberMenus,
    calendarMonth,
    
    // Setters
    setShowReportModal,
    setBarberMenus,
    setCalendarMonth,
    
    // Funciones de menús
    toggleBarberMenu,
    closeBarberMenu,
    closeAllMenus,
    
    // Funciones de modal
    openReportModal,
    closeReportModal,
    
    // Funciones de reportes
    handleGenerateReport,
    generateQuickReport,
    handleManualDateSelect,
    
    // Utilidades de calendario
    isDateDisabled,
    handleDateSelect
  };
};
