/**
 * Utilidades para métodos de pago - Nueva versión centralizada
 * Integración con el sistema unificado de métodos de pago
 */

// Función para obtener nombre de display de un método de pago
export const getPaymentMethodDisplayName = (methodId, paymentMethods = []) => {
  if (!methodId) return 'Desconocido';
  
  // Buscar en la lista de métodos de pago proporcionada
  const method = paymentMethods.find(m => m.backendId === methodId);
  if (method) {
    return method.name;
  }
  
  // Fallback a mapeo estático para compatibilidad
  const staticMapping = {
    'cash': 'Efectivo',
    'efectivo': 'Efectivo',
    'tarjeta': 'Tarjeta',
    'debit': 'Tarjeta',
    'credit': 'Tarjeta',
    'nequi': 'Nequi',
    'daviplata': 'Daviplata',
    'bancolombia': 'Bancolombia',
    'nu': 'Nu',
    'digital': 'Pago Digital',
    'transfer': 'Transferencia',
    'transferencia': 'Transferencia',
    'pagodigital': 'Pago Digital'
  };
  
  // Buscar por coincidencia parcial
  const methodLower = methodId.toLowerCase();
  for (const [key, displayName] of Object.entries(staticMapping)) {
    if (methodLower.includes(key)) {
      return displayName;
    }
  }
  
  return methodId;
};

// Función para obtener color de un método de pago (formato hex)
export const getPaymentMethodColor = (methodId, paymentMethods = []) => {
  if (!methodId) return '#6b7280';
  
  // Buscar en la lista de métodos de pago proporcionada
  const method = paymentMethods.find(m => m.backendId === methodId);
  if (method) {
    return method.color;
  }
  
  // Fallback a mapeo estático para compatibilidad
  const staticColors = {
    'cash': '#10b981',
    'efectivo': '#10b981',
    'tarjeta': '#3b82f6',
    'debit': '#3b82f6',
    'credit': '#3b82f6',
    'nequi': '#8b5cf6',
    'daviplata': '#ef4444',
    'bancolombia': '#f59e0b',
    'nu': '#8b5cf6',
    'digital': '#06b6d4',
    'transfer': '#9333ea',
    'transferencia': '#10b981',
    'pagodigital': '#06b6d4'
  };
  
  // Buscar por coincidencia parcial
  const methodLower = methodId.toLowerCase();
  for (const [key, color] of Object.entries(staticColors)) {
    if (methodLower.includes(key)) {
      return color;
    }
  }
  
  return '#6b7280';
};

// Función para obtener colores en formato Tailwind (mantenida para compatibilidad)
export const getPaymentMethodColorClasses = (methodId, paymentMethods = []) => {
  const hexColor = getPaymentMethodColor(methodId, paymentMethods);
  
  // Mapeo de colores hex a clases Tailwind
  const hexToTailwind = {
    '#10b981': { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-300' },
    '#3b82f6': { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-300' },
    '#8b5cf6': { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-300' },
    '#ef4444': { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-300' },
    '#f59e0b': { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-300' },
    '#06b6d4': { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-300' },
    '#9333ea': { bg: 'bg-purple-600/10', border: 'border-purple-600/30', text: 'text-purple-400' },
    '#6b7280': { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-300' }
  };
  
  return hexToTailwind[hexColor] || { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-300' };
};

// Función para obtener emoji de un método de pago
export const getPaymentMethodEmoji = (methodId, paymentMethods = []) => {
  if (!methodId) return '💳';
  
  // Buscar en la lista de métodos de pago proporcionada
  const method = paymentMethods.find(m => m.backendId === methodId);
  if (method) {
    return method.emoji;
  }
  
  // Fallback a mapeo estático para compatibilidad
  const staticEmojis = {
    'cash': '💵',
    'efectivo': '💵',
    'tarjeta': '💳',
    'debit': '💳',
    'credit': '💳',
    'nequi': '📱',
    'daviplata': '📱',
    'bancolombia': '🏛️',
    'nu': '💳',
    'digital': '💻',
    'transfer': '🔄',
    'transferencia': '🔄',
    'pagodigital': '💻'
  };
  
  // Buscar por coincidencia parcial
  const methodLower = methodId.toLowerCase();
  for (const [key, emoji] of Object.entries(staticEmojis)) {
    if (methodLower.includes(key)) {
      return emoji;
    }
  }
  
  return '💳';
};

// Función para validar si un método de pago es válido
export const isValidPaymentMethod = (methodId, paymentMethods = []) => {
  if (!methodId) return false;
  
  return paymentMethods.some(method => method.backendId === methodId);
};

// Función para preparar opciones para selects
export const preparePaymentMethodOptions = (paymentMethods = []) => {
  return paymentMethods.map(method => ({
    value: method.backendId,
    label: method.name,
    color: method.color,
    emoji: method.emoji,
    isSystem: method.isSystem
  }));
};

// Función para obtener método por backendId
export const getPaymentMethodByBackendId = (backendId, paymentMethods = []) => {
  return paymentMethods.find(method => method.backendId === backendId) || null;
};