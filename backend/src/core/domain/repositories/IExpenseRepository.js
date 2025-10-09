/**
 * Expense Repository Interface
 * Define las operaciones de acceso a datos para la entidad Expense
 */
class IExpenseRepository {
  /**
   * Buscar gasto por ID
   * @param {string} id - ID del gasto
   * @returns {Promise<Expense|null>}
   */
  async findById(id) {
    throw new Error('Method findById must be implemented');
  }

  /**
   * Crear nuevo gasto
   * @param {Object} expenseData - Datos del gasto
   * @returns {Promise<Expense>}
   */
  async create(expenseData) {
    throw new Error('Method create must be implemented');
  }

  /**
   * Actualizar gasto existente
   * @param {string} id - ID del gasto
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Expense>}
   */
  async update(id, updateData) {
    throw new Error('Method update must be implemented');
  }

  /**
   * Eliminar gasto
   * @param {string} id - ID del gasto
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    throw new Error('Method delete must be implemented');
  }

  /**
   * Buscar gastos por rango de fechas
   * @param {Date} startDate - Fecha de inicio
   * @param {Date} endDate - Fecha de fin
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Expense[]>}
   */
  async findByDateRange(startDate, endDate, options = {}) {
    throw new Error('Method findByDateRange must be implemented');
  }

  /**
   * Buscar gastos por categoría
   * @param {string} category - Categoría del gasto
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Expense[]>}
   */
  async findByCategory(category, options = {}) {
    throw new Error('Method findByCategory must be implemented');
  }

  /**
   * Buscar gastos recurrentes
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Expense[]>}
   */
  async findRecurring(options = {}) {
    throw new Error('Method findRecurring must be implemented');
  }

  /**
   * Buscar gastos no recurrentes
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Expense[]>}
   */
  async findNonRecurring(options = {}) {
    throw new Error('Method findNonRecurring must be implemented');
  }

  /**
   * Calcular total de gastos por período
   * @param {Date} startDate - Fecha de inicio
   * @param {Date} endDate - Fecha de fin
   * @param {Object} filters - Filtros adicionales
   * @returns {Promise<number>}
   */
  async calculateTotalByPeriod(startDate, endDate, filters = {}) {
    throw new Error('Method calculateTotalByPeriod must be implemented');
  }

  /**
   * Obtener estadísticas de gastos
   * @param {Date} startDate - Fecha de inicio
   * @param {Date} endDate - Fecha de fin
   * @returns {Promise<Object>}
   */
  async getExpenseStats(startDate, endDate) {
    throw new Error('Method getExpenseStats must be implemented');
  }

  /**
   * Listar todos los gastos con paginación y filtros
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<{expenses: Expense[], total: number, page: number, totalPages: number}>}
   */
  async findAll(options = {}) {
    throw new Error('Method findAll must be implemented');
  }

  /**
   * Buscar gastos por método de pago
   * @param {string} paymentMethodId - ID del método de pago
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Expense[]>}
   */
  async findByPaymentMethod(paymentMethodId, options = {}) {
    throw new Error('Method findByPaymentMethod must be implemented');
  }
}

export default IExpenseRepository;