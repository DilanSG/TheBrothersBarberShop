import { useState, useEffect } from 'react';
import { usePaymentMethodsNew } from '../contexts/PaymentMethodsNewContext';
import { 
  getPaymentMethodDisplayName, 
  getPaymentMethodColor, 
  getPaymentMethodColorClasses,
  getPaymentMethodEmoji,
  preparePaymentMethodOptions,
  isValidPaymentMethod
} from '../utils/paymentMethods';

/**
 * Hook personalizado para gestión completa de métodos de pago
 * Proporciona acceso a datos y utilidades de métodos de pago
 */
export const usePaymentMethods = () => {
  const context = usePaymentMethodsNew();
  
  // Funciones helper que incluyen los métodos de pago como parámetro
  const getDisplayName = (methodId) => getPaymentMethodDisplayName(methodId, context.paymentMethods);
  const getColor = (methodId) => getPaymentMethodColor(methodId, context.paymentMethods);
  const getColorClasses = (methodId) => getPaymentMethodColorClasses(methodId, context.paymentMethods);
  const getEmoji = (methodId) => getPaymentMethodEmoji(methodId, context.paymentMethods);
  const isValid = (methodId) => isValidPaymentMethod(methodId, context.paymentMethods);
  const getSelectOptions = () => preparePaymentMethodOptions(context.paymentMethods);
  
  return {
    // Datos del contexto
    ...context,
    
    // Utilidades con métodos incluidos
    getDisplayName,
    getColor,
    getColorClasses,
    getEmoji,
    isValid,
    getSelectOptions,
    
    // Alias para compatibilidad
    methods: context.paymentMethods,
    loading: context.loading,
    error: context.error
  };
};

/**
 * Hook para obtener únicamente los datos de métodos de pago
 * Versión ligera sin funciones de administración
 */
export const usePaymentMethodsData = () => {
  const { paymentMethods, loading, error, isReady } = usePaymentMethodsNew();
  
  return {
    paymentMethods,
    loading,
    error,
    isReady,
    
    // Funciones helper
    getMethod: (backendId) => paymentMethods.find(m => m.backendId === backendId),
    getDisplayName: (methodId) => getPaymentMethodDisplayName(methodId, paymentMethods),
    getColor: (methodId) => getPaymentMethodColor(methodId, paymentMethods),
    getEmoji: (methodId) => getPaymentMethodEmoji(methodId, paymentMethods)
  };
};

/**
 * Hook para administración de métodos de pago
 * Solo funciones administrativas
 */
export const usePaymentMethodsAdmin = () => {
  const {
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    initializeSystemMethods,
    normalizeExistingMethods,
    fetchPaymentMethods
  } = usePaymentMethodsNew();
  
  return {
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    initializeSystemMethods,
    normalizeExistingMethods,
    refreshMethods: () => fetchPaymentMethods(true)
  };
};

export default usePaymentMethods;