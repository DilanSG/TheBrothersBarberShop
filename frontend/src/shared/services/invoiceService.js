import { api } from './api';

/**
 * Servicio de API para facturas
 */

/**
 * Generar factura desde una venta
 * @param {string} saleId - ID de la venta
 * @param {Object} data - Datos adicionales (notes, source, device)
 * @returns {Promise<Object>}
 */
export const generateInvoice = async (saleId, data = {}) => {
  try {
    const response = await api.post(`/invoices/generate/${saleId}`, data);
    return response; // Ya viene con { success, data, message }
  } catch (error) {
    throw error;
  }
};

/**
 * Imprimir factura
 * @param {string} invoiceId - ID de la factura
 * @param {Object} options - Opciones de impresión (printerInterface)
 * @returns {Promise<Object>}
 */
export const printInvoice = async (invoiceId, options = {}) => {
  try {
    const response = await api.post(`/invoices/print/${invoiceId}`, options);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtener factura por ID
 * @param {string} invoiceId - ID de la factura
 * @returns {Promise<Object>}
 */
export const getInvoiceById = async (invoiceId) => {
  try {
    const response = await api.get(`/invoices/${invoiceId}`);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtener facturas de una venta
 * @param {string} saleId - ID de la venta
 * @returns {Promise<Object>}
 */
export const getInvoicesBySale = async (saleId) => {
  try {
    const response = await api.get(`/invoices/sale/${saleId}`);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Listar facturas con filtros
 * @param {Object} params - Parámetros de búsqueda y paginación
 * @returns {Promise<Object>}
 */
export const listInvoices = async (params = {}) => {
  try {
    const response = await api.get('/invoices', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Obtener estadísticas de facturas
 * @param {Object} params - Filtros (barberId, startDate, endDate)
 * @returns {Promise<Object>}
 */
export const getInvoiceStats = async (params = {}) => {
  try {
    const response = await api.get('/invoices/stats', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Cancelar factura
 * @param {string} invoiceId - ID de la factura
 * @param {string} reason - Razón de cancelación
 * @returns {Promise<Object>}
 */
export const cancelInvoice = async (invoiceId, reason) => {
  try {
    const response = await api.put(`/invoices/${invoiceId}/cancel`, { reason });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Test de impresión
 * @param {Object} options - Opciones (printerInterface)
 * @returns {Promise<Object>}
 */
export const testPrinter = async (options = {}) => {
  try {
    const response = await api.post('/invoices/printer/test', options);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Obtener estado de la impresora
 * @returns {Promise<Object>}
 */
export const getPrinterStatus = async () => {
  try {
    const response = await api.get('/invoices/printer/status');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Conectar impresora
 * @param {Object} config - Configuración de la impresora
 * @returns {Promise<Object>}
 */
export const connectPrinter = async (config) => {
  try {
    const response = await api.post('/invoices/printer/connect', config);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Desconectar impresora
 * @returns {Promise<Object>}
 */
export const disconnectPrinter = async () => {
  try {
    const response = await api.post('/invoices/printer/disconnect');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

const invoiceService = {
  generateInvoice,
  printInvoice,
  getInvoiceById,
  getInvoicesBySale,
  listInvoices,
  getInvoiceStats,
  cancelInvoice,
  testPrinter,
  getPrinterStatus,
  connectPrinter,
  disconnectPrinter
};

export default invoiceService;
