/**
 * Inventory Repository Interface
 * Define las operaciones de acceso a datos para la entidad Inventory
 */
class IInventoryRepository {
  /**
   * Buscar producto por ID
   * @param {string} id - ID del producto
   * @returns {Promise<Inventory|null>}
   */
  async findById(id) {
    throw new Error('Method findById must be implemented');
  }

  /**
   * Buscar producto por nombre
   * @param {string} name - Nombre del producto
   * @returns {Promise<Inventory|null>}
   */
  async findByName(name) {
    throw new Error('Method findByName must be implemented');
  }

  /**
   * Crear nuevo producto
   * @param {Object} inventoryData - Datos del producto
   * @returns {Promise<Inventory>}
   */
  async create(inventoryData) {
    throw new Error('Method create must be implemented');
  }

  /**
   * Actualizar producto existente
   * @param {string} id - ID del producto
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Inventory>}
   */
  async update(id, updateData) {
    throw new Error('Method update must be implemented');
  }

  /**
   * Eliminar producto
   * @param {string} id - ID del producto
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    throw new Error('Method delete must be implemented');
  }

  /**
   * Actualizar stock del producto
   * @param {string} id - ID del producto
   * @param {number} quantity - Cantidad a agregar/reducir
   * @param {string} operation - 'add' o 'subtract'
   * @returns {Promise<Inventory>}
   */
  async updateStock(id, quantity, operation) {
    throw new Error('Method updateStock must be implemented');
  }

  /**
   * Buscar productos con stock bajo
   * @param {number} threshold - Umbral mínimo de stock
   * @returns {Promise<Inventory[]>}
   */
  async findLowStock(threshold = 10) {
    throw new Error('Method findLowStock must be implemented');
  }

  /**
   * Buscar productos por categoría
   * @param {string} category - Categoría del producto
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Inventory[]>}
   */
  async findByCategory(category, options = {}) {
    throw new Error('Method findByCategory must be implemented');
  }

  /**
   * Buscar productos activos/inactivos
   * @param {boolean} isActive - Estado activo/inactivo
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Inventory[]>}
   */
  async findByStatus(isActive, options = {}) {
    throw new Error('Method findByStatus must be implemented');
  }

  /**
   * Obtener valor total del inventario
   * @returns {Promise<number>}
   */
  async getTotalValue() {
    throw new Error('Method getTotalValue must be implemented');
  }

  /**
   * Listar todos los productos con paginación y filtros
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<{products: Inventory[], total: number, page: number, totalPages: number}>}
   */
  async findAll(options = {}) {
    throw new Error('Method findAll must be implemented');
  }

  /**
   * Buscar productos por rango de precios
   * @param {number} minPrice - Precio mínimo
   * @param {number} maxPrice - Precio máximo
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Inventory[]>}
   */
  async findByPriceRange(minPrice, maxPrice, options = {}) {
    throw new Error('Method findByPriceRange must be implemented');
  }
}

export default IInventoryRepository;