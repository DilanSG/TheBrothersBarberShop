/**
 * Interfaz Repository de Citas
 * Define las operaciones de acceso a datos para la entidad Appointment
 */
class IAppointmentRepository {
  /**
   * Buscar cita por ID
   * @param {string} id - ID de la cita
   * @returns {Promise<Appointment|null>}
   */
  async findById(id) {
    throw new Error('El método findById debe ser implementado');
  }

  /**
   * Crear nueva cita
   * @param {Object} appointmentData - Datos de la cita
   * @returns {Promise<Appointment>}
   */
  async create(appointmentData) {
    throw new Error('El método create debe ser implementado');
  }

  /**
   * Actualizar cita existente
   * @param {string} id - ID de la cita
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Appointment>}
   */
  async update(id, updateData) {
    throw new Error('El método update debe ser implementado');
  }

  /**
   * Eliminar cita
   * @param {string} id - ID de la cita
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    throw new Error('El método delete debe ser implementado');
  }

  /**
   * Buscar citas por usuario
   * @param {string} userId - ID del usuario
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Appointment[]>}
   */
  async findByUserId(userId, options = {}) {
    throw new Error('Method findByUserId must be implemented');
  }

  /**
   * Buscar citas por barbero
   * @param {string} barberId - ID del barbero
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Appointment[]>}
   */
  async findByBarberId(barberId, options = {}) {
    throw new Error('Method findByBarberId must be implemented');
  }

  /**
   * Buscar citas por fecha
   * @param {Date} date - Fecha de la cita
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Appointment[]>}
   */
  async findByDate(date, options = {}) {
    throw new Error('Method findByDate must be implemented');
  }

  /**
   * Buscar citas en un rango de fechas
   * @param {Date} startDate - Fecha de inicio
   * @param {Date} endDate - Fecha de fin
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Appointment[]>}
   */
  async findByDateRange(startDate, endDate, options = {}) {
    throw new Error('Method findByDateRange must be implemented');
  }

  /**
   * Verificar disponibilidad de horario
   * @param {string} barberId - ID del barbero
   * @param {Date} date - Fecha y hora
   * @param {number} duration - Duración en minutos
   * @returns {Promise<boolean>}
   */
  async checkAvailability(barberId, date, duration) {
    throw new Error('Method checkAvailability must be implemented');
  }

  /**
   * Listar todas las citas con paginación y filtros
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<{appointments: Appointment[], total: number, page: number, totalPages: number}>}
   */
  async findAll(options = {}) {
    throw new Error('Method findAll must be implemented');
  }
}

export default IAppointmentRepository;