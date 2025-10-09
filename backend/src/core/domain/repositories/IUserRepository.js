/**
 * Interfaz Repository de Usuario
 * Define las operaciones de acceso a datos para la entidad User
 * Implementa el patrón Repository de Clean Architecture
 */
class IUserRepository {
  /**
   * Buscar usuario por ID
   * @param {string} id - ID del usuario
   * @returns {Promise<User|null>}
   */
  async findById(id) {
    throw new Error('El método findById debe ser implementado');
  }

  /**
   * Buscar usuario por email
   * @param {string} email - Email del usuario
   * @returns {Promise<User|null>}
   */
  async findByEmail(email) {
    throw new Error('El método findByEmail debe ser implementado');
  }

  /**
   * Buscar usuario por nombre de usuario
   * @param {string} username - Username del usuario
   * @returns {Promise<User|null>}
   */
  async findByUsername(username) {
    throw new Error('El método findByUsername debe ser implementado');
  }

  /**
   * Crear nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Promise<User>}
   */
  async create(userData) {
    throw new Error('El método create debe ser implementado');
  }

  /**
   * Actualizar usuario existente
   * @param {string} id - ID del usuario
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<User>}
   */
  async update(id, updateData) {
    throw new Error('El método update debe ser implementado');
  }

  /**
   * Eliminar usuario
   * @param {string} id - ID del usuario
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    throw new Error('El método delete debe ser implementado');
  }

  /**
   * Listar usuarios con paginación y filtros
   * @param {Object} options - Opciones de consulta (page, limit, filters, sort)
   * @returns {Promise<{users: User[], total: number, page: number, totalPages: number}>}
   */
  async findAll(options = {}) {
    throw new Error('El método findAll debe ser implementado');
  }

  /**
   * Verificar si un usuario existe
   * @param {string} id - ID del usuario
   * @returns {Promise<boolean>}
   */
  async exists(id) {
    throw new Error('El método exists debe ser implementado');
  }

  /**
   * Contar usuarios activos
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<number>}
   */
  async count(filters = {}) {
    throw new Error('El método count debe ser implementado');
  }
}

export default IUserRepository;