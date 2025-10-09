/**
 * Sale Repository Interface
 * Define las operaciones de acceso a datos para la entidad Sale
 */
class ISaleRepository {
  /**
   * Buscar venta por ID
   * @param {string} id - ID de la venta
   * @returns {Promise<Sale|null>}
   */
  async findById(id) {
    throw new Error('Method findById must be implemented');
  }

  /**
   * Crear nueva venta
   * @param {Object} saleData - Datos de la venta
   * @returns {Promise<Sale>}
   */
  async create(saleData) {
    throw new Error('Method create must be implemented');
  }

  /**
   * Actualizar venta existente
   * @param {string} id - ID de la venta
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Sale>}
   */
  async update(id, updateData) {
    throw new Error('Method update must be implemented');
  }

  /**
   * Eliminar venta
   * @param {string} id - ID de la venta
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    throw new Error('Method delete must be implemented');
  }

  /**
   * Buscar ventas por rango de fechas
   * @param {Date} startDate - Fecha de inicio
   * @param {Date} endDate - Fecha de fin
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Sale[]>}
   */
  async findByDateRange(startDate, endDate, options = {}) {
    throw new Error('Method findByDateRange must be implemented');
  }

  /**
   * Buscar ventas por barbero
   * @param {string} barberId - ID del barbero
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Sale[]>}
   */
  async findByBarberId(barberId, options = {}) {
    throw new Error('Method findByBarberId must be implemented');
  }

  /**
   * Buscar ventas por método de pago
   * @param {string} paymentMethodId - ID del método de pago
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Sale[]>}
   */
  async findByPaymentMethod(paymentMethodId, options = {}) {
    throw new Error('Method findByPaymentMethod must be implemented');
  }

  /**
   * Calcular total de ventas por período
   * @param {Date} startDate - Fecha de inicio
   * @param {Date} endDate - Fecha de fin
   * @param {Object} filters - Filtros adicionales
   * @returns {Promise<number>}
   */
  async calculateTotalByPeriod(startDate, endDate, filters = {}) {
    throw new Error('Method calculateTotalByPeriod must be implemented');
  }

  /**
   * Obtener estadísticas de ventas
   * @param {Date} startDate - Fecha de inicio
   * @param {Date} endDate - Fecha de fin
   * @returns {Promise<Object>}
   */
  async getSalesStats(startDate, endDate) {
    throw new Error('Method getSalesStats must be implemented');
  }

  /**
   * Listar todas las ventas con paginación y filtros
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<{sales: Sale[], total: number, page: number, totalPages: number}>}
   */
  async findAll(options = {}) {
    throw new Error('Method findAll must be implemented');
  }

  /**
   * Obtener ventas por cliente
   * @param {string} clientId - ID del cliente
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Sale[]>}
   */
  async findByClientId(clientId, options = {}) {
    throw new Error('Method findByClientId must be implemented');
  }

  /**
   * Obtener ingresos por día
   * @param {Date} date - Fecha específica
   * @returns {Promise<number>}
   */
  async getDailyRevenue(date) {
    throw new Error('Method getDailyRevenue must be implemented');
  }
}

export default ISaleRepository;