import { useState, useEffect, useCallback } from 'react';
import { useModalData } from './useModalData';

/**
 * Hook unificado para todos los modales del sistema
 * Proporciona funcionalidad común y consistente
 */
export const useUnifiedModal = () => {
  // Estado común para todos los modales
  const [loading, setLoading] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  // Sistema de caché unificado
  const { fetchAllSales, fetchAllAppointments, filterByDateRange } = useModalData();

  // Formateo de fecha unificado
  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Formateo de moneda unificado
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }, []);

  // Determinar tipo de filtro unificado
  const getFilterType = useCallback((dateRange) => {
    return dateRange?.preset === 'general' || !dateRange?.preset;
  }, []);

  // Calcular fechas de display unificado
  const getDisplayDates = useCallback((dateRange, summary) => {
    const isGeneralFilter = getFilterType(dateRange);
    
    let displayStartDate = dateRange?.startDate;
    let displayEndDate = dateRange?.endDate;
    
    // Para filtros generales, usar fechas reales de los datos si están disponibles
    if (isGeneralFilter && summary?.oldestDataDate) {
      displayStartDate = summary.oldestDataDate;
      displayEndDate = new Date().toISOString().split('T')[0];
    }
    
    return { displayStartDate, displayEndDate, isGeneralFilter };
  }, [getFilterType]);

  // Métodos de pago display names unificados
  const getPaymentMethodDisplayName = useCallback((methodId) => {
    const paymentNames = {
      'efectivo': 'Efectivo',
      'cash': 'Efectivo',
      'nequi': 'Nequi',
      'daviplata': 'Daviplata',
      'bancolombia': 'Bancolombia',
      'nu': 'Nu Bank',
      'tarjeta': 'Tarjeta',
      'card': 'Tarjeta',
      'transferencia': 'Transferencia',
      'transfer': 'Transferencia',
      'digital': 'Pago Digital',
      'pagodigital': 'Pago Digital'
    };
    
    const methodLower = methodId?.toLowerCase() || '';
    for (const [key, displayName] of Object.entries(paymentNames)) {
      if (methodLower.includes(key)) {
        return displayName;
      }
    }
    return methodId || 'Método desconocido';
  }, []);

  // Colores de métodos de pago unificados
  const getPaymentMethodColor = useCallback((method) => {
    const colors = {
      'efectivo': { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-300' },
      'cash': { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-300' },
      'nequi': { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-300' },
      'daviplata': { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-300' },
      'bancolombia': { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-300' },
      'nu': { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-300' },
      'tarjeta': { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-300' },
      'card': { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-300' },
      'transferencia': { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-300' },
      'transfer': { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-300' },
      'digital': { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-300' },
      'pagodigital': { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-300' }
    };

    const methodLower = method?.toLowerCase() || '';
    for (const [key, color] of Object.entries(colors)) {
      if (methodLower.includes(key)) {
        return color;
      }
    }
    
    // Color por defecto para métodos no reconocidos
    return { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-300' };
  }, []);

  // Función para alternar filtros
  const toggleFilters = useCallback(() => {
    setFiltersExpanded(prev => !prev);
  }, []);

  // Función para verificar filtros activos genérica
  const hasActiveFilters = useCallback((filters) => {
    return Object.values(filters).some(filter => filter !== 'all');
  }, []);

  return {
    // Estados
    loading,
    setLoading,
    filtersExpanded,
    setFiltersExpanded,
    
    // Funciones de datos
    fetchAllSales,
    fetchAllAppointments,
    filterByDateRange,
    
    // Funciones de formateo
    formatDate,
    formatCurrency,
    getPaymentMethodDisplayName,
    getPaymentMethodColor,
    
    // Funciones de UI
    getFilterType,
    getDisplayDates,
    toggleFilters,
    hasActiveFilters
  };
};

/**
 * Hook para scroll lock unificado
 */
export const useScrollLock = (isOpen) => {
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);
};