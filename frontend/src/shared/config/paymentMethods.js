import { 
  Banknote, 
  Smartphone, 
  CreditCard 
} from 'lucide-react';

/**
 * Configuración centralizada de métodos de pago
 * Se usa en toda la aplicación para mantener consistencia
 */
export const PAYMENT_METHODS = [
  {
    id: 'efectivo',
    name: 'Efectivo',
    icon: Banknote,
    emoji: '💵',
    color: 'green',
    description: 'Pago en efectivo',
    // CORREGIDO: Usar 'efectivo' que es como lo almacena el backend
    backendId: 'efectivo'
  },
  {
    id: 'nequi',
    name: 'Nequi',
    icon: Smartphone,
    emoji: '📱',
    color: 'pink',
    description: 'Pago por Nequi',
    backendId: 'nequi'
  },
  {
    id: 'nu',
    name: 'Nu',
    icon: CreditCard,
    emoji: '💳',
    color: 'purple',
    description: 'Tarjeta Nu',
    backendId: 'nu'
  },
  {
    id: 'daviplata',
    name: 'Daviplata',
    icon: Smartphone,
    emoji: '📱',
    color: 'red',
    description: 'Pago por Daviplata',
    backendId: 'daviplata'
  },
  {
    id: 'tarjeta',
    name: 'Tarjeta',
    icon: CreditCard,
    emoji: '💳',
    color: 'blue',
    description: 'Tarjeta débito/crédito',
    backendId: 'tarjeta'  // Usar un ID consolidado
  },
  {
    id: 'bancolombia',
    name: 'Bancolombia',
    icon: CreditCard,
    emoji: '🏛️',
    color: 'yellow',
    description: 'Transferencia Bancolombia',
    backendId: 'bancolombia'
  },
  {
    id: 'digital',
    name: 'Pago Digital',
    icon: Smartphone,
    emoji: '💻',
    color: 'cyan',
    description: 'Otros métodos digitales',
    backendId: 'digital'
  }
];

/**
 * Obtener método de pago por ID
 */
export const getPaymentMethodById = (id) => {
  return PAYMENT_METHODS.find(method => method.id === id) || PAYMENT_METHODS[0];
};

/**
 * Obtener todos los métodos de pago
 */
export const getAllPaymentMethods = () => {
  return PAYMENT_METHODS;
};

/**
 * Mapear ID de frontend a backend
 */
export const mapPaymentMethodToBackend = (frontendId) => {
  const method = getPaymentMethodById(frontendId);
  return method?.backendId || 'cash';
};

/**
 * Mapear ID de backend a frontend
 */
export const mapPaymentMethodFromBackend = (backendId) => {
  const method = PAYMENT_METHODS.find(m => m.backendId === backendId);
  return method?.id || 'efectivo';
};

/**
 * Obtener opciones para selects
 */
export const getPaymentMethodOptions = () => {
  return PAYMENT_METHODS.map(method => ({
    value: method.id,
    label: method.name,
    icon: method.emoji
  }));
};

/**
 * Hook personalizado para usar métodos de pago
 */
export const usePaymentMethods = () => {
  return {
    paymentMethods: PAYMENT_METHODS,
    getById: getPaymentMethodById,
    getAll: getAllPaymentMethods,
    mapToBackend: mapPaymentMethodToBackend,
    mapFromBackend: mapPaymentMethodFromBackend,
    getOptions: getPaymentMethodOptions
  };
};