/**
 * Interfaz Repository de Barberos
 * Define las operaciones de acceso a datos para la entidad Barber
 */
class IBarberRepository {
  /**
   * Buscar barbero por ID
   * @param {string} id - ID del barbero
   * @returns {Promise<Barber|null>}
   */
  async findById(id) {
    throw new Error('El método findById debe ser implementado');
  }

  /**
   * Buscar barbero por usuario
   * @param {string} userId - ID del usuario asociado
   * @returns {Promise<Barber|null>}
   */
  async findByUserId(userId) {
    throw new Error('El método findByUserId debe ser implementado');
  }

  /**
   * Crear nuevo barbero
   * @param {Object} barberData - Datos del barbero
   * @returns {Promise<Barber>}
   */
  async create(barberData) {
    throw new Error('El método create debe ser implementado');
  }

  /**
   * Actualizar barbero existente
   * @param {string} id - ID del barbero
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Barber>}
   */
  async update(id, updateData) {
    throw new Error('El método update debe ser implementado');
  }

  /**
   * Eliminar barbero
   * @param {string} id - ID del barbero
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    throw new Error('El método delete debe ser implementado');
  }

  /**
   * Buscar barberos activos
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Barber[]>}
   */
  async findActive(options = {}) {
    throw new Error('El método findActive debe ser implementado');
  }

  /**
   * Buscar barberos por disponibilidad
   * @param {Date} date - Fecha y hora
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Barber[]>}
   */
  async findAvailable(date, options = {}) {
    throw new Error('El método findAvailable debe ser implementado');
  }

  /**
   * Obtener estadísticas del barbero
   * @param {string} barberId - ID del barbero
   * @param {Date} startDate - Fecha de inicio
   * @param {Date} endDate - Fecha de fin
   * @returns {Promise<Object>}
   */
  async getBarberStats(barberId, startDate, endDate) {
    throw new Error('El método getBarberStats debe ser implementado');
  }

  /**
   * Listar todos los barberos con paginación y filtros
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<{barbers: Barber[], total: number, page: number, totalPages: number}>}
   */
  async findAll(options = {}) {
    throw new Error('El método findAll debe ser implementado');
  }

  /**
   * Verificar si un barbero existe
   * @param {string} id - ID del barbero
   * @returns {Promise<boolean>}
   */
  async exists(id) {
    throw new Error('El método exists debe ser implementado');
  }

  /**
   * Contar barberos activos
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<number>}
   */
  async count(filters = {}) {
    throw new Error('El método count debe ser implementado');
  }

  /**
   * Actualizar horarios de trabajo del barbero
   * @param {string} id - ID del barbero
   * @param {Object} schedule - Horarios de trabajo
   * @returns {Promise<Barber>}
   */
  async updateSchedule(id, schedule) {
    throw new Error('El método updateSchedule debe ser implementado');
  }
}

export default IBarberRepository;