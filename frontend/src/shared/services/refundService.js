import { api } from './api';
// Usando api directamente, ya incluye manejo de response y errores
import { toast } from 'react-toastify';

/**
 * Servicio para manejar operaciones de reembolsos
 */
export const refundService = {
  /**
   * Procesar reembolso de una venta
   */
  async processRefund(saleId, reason, adminCode) {
    try {
      console.log('🔄 Enviando reembolso a:', `/refunds/${saleId}`);
      console.log('📋 Datos del reembolso:', { reason, adminCode });
      
      const response = await api.post(`/refunds/${saleId}`, {
        reason,
        adminCode
      });
      
      toast.success('Reembolso procesado exitosamente');
      return response;
    } catch (error) {
      console.error('❌ Error en refund service:', error);
      toast.error(error.message || 'Error al procesar el reembolso');
      throw error;
    }
  },

  /**
   * Procesar reembolso de una venta (alias para compatibilidad)
   */
  async refundSale(data) {
    return this.processRefund(data.saleId, data.reason, data.adminCode);
  },

  /**
   * Obtener todas las ventas reembolsadas
   */
  async getRefundedSales(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.barberId) params.append('barberId', filters.barberId);
      if (filters.type) params.append('type', filters.type);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.page) params.append('page', filters.page.toString());

      const response = await api.get(`/refunds?${params.toString()}`);
      return response;
    } catch (error) {
      toast.error(error.message || 'Error al obtener ventas reembolsadas');
      throw error;
    }
  },

  /**
   * Obtener resumen de reembolsos por barbero (solo admin)
   */
  async getRefundsSummary(startDate = null, endDate = null) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await api.get(`/refunds/summary?${params.toString()}`);
      return response;
    } catch (error) {
      toast.error(error.message || 'Error al obtener resumen de reembolsos');
      throw error;
    }
  },

  /**
   * Obtener código de verificación actual (solo admin)
   */
  async getVerificationCode() {
    try {
      const response = await api.get('/refunds/verification-code');
      return response;
    } catch (error) {
      toast.error(error.message || 'Error al obtener código de verificación');
      throw error;
    }
  },

  /**
   * Obtener ventas del barbero para reembolsar
   */
  async getMySalesForRefund(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.type) params.append('type', filters.type);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.page) params.append('page', filters.page.toString());

      const response = await api.get(`/refunds/my-sales?${params.toString()}`);
      return response;
    } catch (error) {
      toast.error(error.message || 'Error al obtener tus ventas');
      throw error;
    }
  },

  /**
   * Obtener todas las ventas con filtros (admin)
   */
  async getAllSalesForAdmin(filters = {}) {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });
      
      const response = await api.get(`/sales?${params.toString()}`);
      return response;
    } catch (error) {
      toast.error(error.message || 'Error al obtener las ventas');
      throw error;
    }
  },

  /**
   * Cancelar/eliminar venta (admin)
   */
  async cancelSale(saleId) {
    try {
      const response = await api.put(`/sales/${saleId}/cancel`, {});
      toast.success('Venta eliminada exitosamente');
      return response;
    } catch (error) {
      toast.error(error.message || 'Error al eliminar la venta');
      throw error;
    }
  },

  /**
   * Eliminar reembolso (reversar a venta normal) - Solo Admin
   */
  async deleteRefund(saleId) {
    try {
      console.log('🗑️ Eliminando reembolso:', saleId);
      
      const response = await api.delete(`/refunds/${saleId}`);
      
      toast.success('Reembolso eliminado exitosamente');
      return response;
    } catch (error) {
      console.error('❌ Error eliminando reembolso:', error);
      toast.error(error.message || 'Error al eliminar el reembolso');
      throw error;
    }
  },

  /**
   * Eliminar reembolso permanentemente del sistema - Solo Admin
   */
  async permanentDeleteRefund(saleId) {
    try {
      console.log('🗑️ Eliminando permanentemente reembolso:', saleId);
      
      const response = await api.delete(`/refunds/${saleId}/permanent`);
      
      toast.success('Reembolso eliminado permanentemente');
      return response;
    } catch (error) {
      console.error('❌ Error eliminando permanentemente reembolso:', error);
      toast.error(error.message || 'Error al eliminar permanentemente el reembolso');
      throw error;
    }
  }
};

export default refundService;