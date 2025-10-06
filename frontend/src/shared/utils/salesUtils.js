import { 
  SALE_TYPES,
  SALE_TYPE_LABELS, 
  PAYMENT_METHOD_LABELS, 
  PAYMENT_METHOD_COLORS, 
  DEFAULT_PAYMENT_COLOR,
  SALE_STATUS_LABELS 
} from '../constants/salesConstants';

/**
 * Utilidades para normalizar y mostrar datos de ventas en el frontend
 */

/**
 * Obtener nombre de display para tipo de venta
 */
export const getSaleTypeLabel = (type) => {
  return SALE_TYPE_LABELS[type] || type || 'Desconocido';
};

/**
 * Obtener nombre de display para método de pago
 */
export const getPaymentMethodLabel = (method) => {
  if (!method) return 'Sin especificar';
  return PAYMENT_METHOD_LABELS[method.toLowerCase()] || method;
};

/**
 * Obtener colores para método de pago
 */
export const getPaymentMethodColors = (method) => {
  if (!method) return DEFAULT_PAYMENT_COLOR;
  return PAYMENT_METHOD_COLORS[method.toLowerCase()] || DEFAULT_PAYMENT_COLOR;
};

/**
 * Obtener nombre de display para status
 */
export const getSaleStatusLabel = (status) => {
  return SALE_STATUS_LABELS[status] || status || 'Desconocido';
};

/**
 * Normalizar datos de venta para display consistente
 */
export const normalizeSaleForDisplay = (sale) => {
  if (!sale) return null;

  return {
    ...sale,
    // Nombre unificado
    displayName: sale.name || sale.productName || sale.serviceName || 'Sin nombre',
    
    // Tipo normalizado
    displayType: getSaleTypeLabel(sale.type),
    
    // Método de pago normalizado
    displayPaymentMethod: getPaymentMethodLabel(sale.paymentMethod),
    paymentMethodColors: getPaymentMethodColors(sale.paymentMethod),
    
    // Status normalizado
    displayStatus: getSaleStatusLabel(sale.status),
    
    // Categoría con fallback
    displayCategory: sale.category || (sale.type === SALE_TYPES.PRODUCT ? 'Producto' : 'Servicio'),
    
    // Cantidad con fallback para servicios
    displayQuantity: sale.quantity || 1,
    
    // Cliente con fallback
    displayCustomer: sale.customerName || 'Cliente',
    
    // Barbero con fallback
    displayBarber: sale.barberName || 'Barbero',
    
    // Indicar si viene de appointment
    isFromAppointment: sale.isFromAppointment || sale.type === 'appointment',
    
    // Fecha normalizada
    displayDate: sale.saleDate || sale.appointmentDate || sale.createdAt
  };
};

/**
 * Filtrar ventas por criterios
 */
export const filterSales = (sales, filters) => {
  if (!sales || !Array.isArray(sales)) return [];
  
  return sales.filter(sale => {
    // Filtro por tipo
    if (filters.type && sale.type !== filters.type) {
      return false;
    }
    
    // Filtro por categoría
    if (filters.category && sale.category !== filters.category) {
      return false;
    }
    
    // Filtro por método de pago
    if (filters.paymentMethod && sale.paymentMethod !== filters.paymentMethod) {
      return false;
    }
    
    // Filtro por rango de fechas
    if (filters.startDate || filters.endDate) {
      const saleDate = new Date(sale.saleDate || sale.appointmentDate || sale.createdAt);
      
      if (filters.startDate && saleDate < new Date(filters.startDate)) {
        return false;
      }
      
      if (filters.endDate && saleDate > new Date(filters.endDate)) {
        return false;
      }
    }
    
    return true;
  });
};

/**
 * Obtener opciones únicas para filtros
 */
export const getFilterOptions = (sales) => {
  if (!sales || !Array.isArray(sales)) {
    return {
      types: [],
      categories: [],
      paymentMethods: []
    };
  }
  
  return {
    types: [...new Set(sales.map(sale => sale.type).filter(Boolean))],
    categories: [...new Set(sales.map(sale => sale.category).filter(Boolean))],
    paymentMethods: [...new Set(sales.map(sale => sale.paymentMethod).filter(Boolean))]
  };
};

/**
 * Agrupar ventas por criterio
 */
export const groupSalesBy = (sales, groupBy) => {
  if (!sales || !Array.isArray(sales)) return {};
  
  return sales.reduce((groups, sale) => {
    let key;
    
    switch (groupBy) {
      case 'type':
        key = getSaleTypeLabel(sale.type);
        break;
      case 'category':
        key = sale.category || 'Sin categoría';
        break;
      case 'paymentMethod':
        key = getPaymentMethodLabel(sale.paymentMethod);
        break;
      case 'barber':
        key = sale.barberName || 'Sin barbero';
        break;
      case 'date':
        key = new Date(sale.saleDate || sale.createdAt).toLocaleDateString('es-CO');
        break;
      default:
        key = 'Otros';
    }
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(sale);
    
    return groups;
  }, {});
};

/**
 * Calcular estadísticas de ventas
 */
export const calculateSalesStats = (sales) => {
  if (!sales || !Array.isArray(sales)) {
    return {
      totalSales: 0,
      totalAmount: 0,
      averageAmount: 0,
      totalProducts: 0,
      totalServices: 0,
      totalAppointments: 0
    };
  }
  
  const stats = sales.reduce((acc, sale) => {
    acc.totalSales += 1;
    acc.totalAmount += sale.totalAmount || 0;
    
    switch (sale.type) {
      case SALE_TYPES.PRODUCT:
        acc.totalProducts += 1;
        break;
      case SALE_TYPES.SERVICE:
        acc.totalServices += 1;
        break;
      case SALE_TYPES.APPOINTMENT:
        acc.totalAppointments += 1;
        break;
    }
    
    return acc;
  }, {
    totalSales: 0,
    totalAmount: 0,
    totalProducts: 0,
    totalServices: 0,
    totalAppointments: 0
  });
  
  stats.averageAmount = stats.totalSales > 0 ? stats.totalAmount / stats.totalSales : 0;
  
  return stats;
};

/**
 * Validar datos de venta
 */
export const validateSaleData = (sale) => {
  const errors = [];
  
  if (!sale) {
    errors.push('Datos de venta requeridos');
    return { isValid: false, errors };
  }
  
  if (!sale.type) {
    errors.push('Tipo de venta requerido');
  }
  
  if (!sale.totalAmount || sale.totalAmount <= 0) {
    errors.push('Monto total debe ser mayor a 0');
  }
  
  if (!sale.barberId) {
    errors.push('Barbero requerido');
  }
  
  if (!sale.paymentMethod) {
    errors.push('Método de pago requerido');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};