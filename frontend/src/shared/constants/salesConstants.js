/**
 * Constantes para tipos de datos en el sistema de ventas
 */

// Tipos de transacciones/ventas
export const SALE_TYPES = {
  PRODUCT: 'product',
  SERVICE: 'walkIn',        // Mantener compatibilidad con backend
  APPOINTMENT: 'appointment'
};

// Nombres de display para tipos
export const SALE_TYPE_LABELS = {
  [SALE_TYPES.PRODUCT]: 'Producto',
  [SALE_TYPES.SERVICE]: 'Servicio',
  [SALE_TYPES.APPOINTMENT]: 'Cita'
};

// Estados de transacciones
export const SALE_STATUS = {
  COMPLETED: 'completed',
  CANCELLED: 'cancelled', 
  REFUNDED: 'refunded'
};

// Estados de display
export const SALE_STATUS_LABELS = {
  [SALE_STATUS.COMPLETED]: 'Completada',
  [SALE_STATUS.CANCELLED]: 'Cancelada',
  [SALE_STATUS.REFUNDED]: 'Reembolsada'
};

// Métodos de pago normalizados
export const PAYMENT_METHODS = {
  CASH: 'efectivo',
  CARD: 'tarjeta', 
  TRANSFER: 'transferencia',
  NEQUI: 'nequi',
  NU: 'nu',
  DAVIPLATA: 'daviplata',
  BANCOLOMBIA: 'bancolombia',
  DEBIT: 'debit',
  DIGITAL: 'digital'
};

// Nombres de display para métodos de pago
export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.CASH]: 'Efectivo',
  'cash': 'Efectivo', // Compatibilidad
  [PAYMENT_METHODS.CARD]: 'Tarjeta',
  'card': 'Tarjeta', // Compatibilidad  
  [PAYMENT_METHODS.TRANSFER]: 'Transferencia',
  'transfer': 'Transferencia', // Compatibilidad
  [PAYMENT_METHODS.NEQUI]: 'Nequi',
  [PAYMENT_METHODS.NU]: 'Nu',
  [PAYMENT_METHODS.DAVIPLATA]: 'Daviplata',
  [PAYMENT_METHODS.BANCOLOMBIA]: 'Bancolombia',
  [PAYMENT_METHODS.DEBIT]: 'Débito',
  [PAYMENT_METHODS.DIGITAL]: 'Digital'
};

// Colores para métodos de pago (consistente con sistema existente)
export const PAYMENT_METHOD_COLORS = {
  [PAYMENT_METHODS.CASH]: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-300', dot: 'bg-green-400' },
  'cash': { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-300', dot: 'bg-green-400' },
  'efectivo': { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-300', dot: 'bg-green-400' },
  [PAYMENT_METHODS.NEQUI]: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-300', dot: 'bg-pink-400' },
  [PAYMENT_METHODS.NU]: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-300', dot: 'bg-purple-400' },
  [PAYMENT_METHODS.DAVIPLATA]: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-300', dot: 'bg-red-400' },
  [PAYMENT_METHODS.DEBIT]: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-300', dot: 'bg-blue-400' },
  [PAYMENT_METHODS.BANCOLOMBIA]: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-300', dot: 'bg-yellow-400' },
  [PAYMENT_METHODS.DIGITAL]: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-300', dot: 'bg-cyan-400' },
  [PAYMENT_METHODS.CARD]: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-300', dot: 'bg-blue-400' },
  'card': { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-300', dot: 'bg-blue-400' },
  'tarjeta': { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-300', dot: 'bg-blue-400' },
  [PAYMENT_METHODS.TRANSFER]: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-300', dot: 'bg-cyan-400' },
  'transfer': { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-300', dot: 'bg-cyan-400' },
  'transferencia': { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-300', dot: 'bg-cyan-400' }
};

// Color por defecto para métodos no reconocidos
export const DEFAULT_PAYMENT_COLOR = { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-300', dot: 'bg-gray-400' };

// Iconos para tipos de transacciones
export const SALE_TYPE_ICONS = {
  [SALE_TYPES.PRODUCT]: 'Package',
  [SALE_TYPES.SERVICE]: 'Scissors', 
  [SALE_TYPES.APPOINTMENT]: 'Calendar'
};

// Colores para tipos de transacciones
export const SALE_TYPE_COLORS = {
  [SALE_TYPES.PRODUCT]: 'text-blue-400',
  [SALE_TYPES.SERVICE]: 'text-green-400',
  [SALE_TYPES.APPOINTMENT]: 'text-purple-400'
};