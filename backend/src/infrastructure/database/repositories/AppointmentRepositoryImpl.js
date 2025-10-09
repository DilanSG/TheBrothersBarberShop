/**
 * Appointment Repository Implementation
 * Implementación concreta del repositorio de citas usando Mongoose
 */

import IAppointmentRepository from '../../../core/domain/repositories/IAppointmentRepository.js';
import Appointment from '../../../core/domain/entities/Appointment.js';
import { logger } from '../../../shared/utils/logger.js';
import { AppError } from '../../../shared/utils/errors.js';

class AppointmentRepositoryImpl extends IAppointmentRepository {
  /**
   * Buscar cita por ID
   * @param {string} id - ID de la cita
   * @returns {Promise<Appointment|null>}
   */
  async findById(id) {
    try {
      logger.database(`Searching appointment by ID: ${id}`);
      const appointment = await Appointment.findById(id)
        .populate('user', 'name email phone')
        .populate('barber', 'name email')
  .populate('service', 'name price duration');
      
      if (appointment) {
        logger.database(`Appointment found: ${appointment._id}`);
      }
      
      return appointment;
    } catch (error) {
      logger.error(`Error finding appointment by ID ${id}:`, error);
      throw new AppError(`Error al buscar cita: ${error.message}`, 500);
    }
  }

  /**
   * Crear nueva cita
   * @param {Object} appointmentData - Datos de la cita
   * @returns {Promise<Appointment>}
   */
  async create(appointmentData) {
    try {
      logger.database('Creating new appointment');
      const appointment = await Appointment.create(appointmentData);
      logger.database(`Appointment created successfully: ${appointment._id}`);
      
      // Retornar con populate
      return await this.findById(appointment._id);
    } catch (error) {
      logger.error('Error creating appointment:', error);
      throw new AppError(`Error al crear cita: ${error.message}`, 500);
    }
  }

  /**
   * Actualizar cita existente
   * @param {string} id - ID de la cita
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Appointment>}
   */
  async update(id, updateData) {
    try {
      logger.database(`Updating appointment: ${id}`);
      
      const appointment = await Appointment.findByIdAndUpdate(
        id,
        updateData,
        { 
          new: true, 
          runValidators: true 
        }
      ).populate('user', 'name email phone')
       .populate('barber', 'name email')
  .populate('service', 'name price duration');

      if (!appointment) {
        throw new AppError('Cita no encontrada', 404);
      }

      logger.database(`Appointment updated successfully: ${id}`);
      return appointment;
    } catch (error) {
      logger.error(`Error updating appointment ${id}:`, error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError(`Error al actualizar cita: ${error.message}`, 500);
    }
  }

  /**
   * Eliminar cita
   * @param {string} id - ID de la cita
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    try {
      logger.database(`Deleting appointment: ${id}`);
      const result = await Appointment.findByIdAndDelete(id);
      
      if (!result) {
        throw new AppError('Cita no encontrada', 404);
      }

      logger.database(`Appointment deleted successfully: ${id}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting appointment ${id}:`, error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError(`Error al eliminar cita: ${error.message}`, 500);
    }
  }

  /**
   * Buscar citas por usuario
   * @param {string} userId - ID del usuario
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Appointment[]>}
   */
  async findByUserId(userId, options = {}) {
    try {
      const { sort = { date: -1 }, limit } = options;
      
      logger.database(`Searching appointments by user ID: ${userId}`);
      
      let query = Appointment.find({ user: userId })
        .populate('barber', 'name email')
  .populate('service', 'name price duration')
        .sort(sort);
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const appointments = await query;
      logger.database(`Found ${appointments.length} appointments for user ${userId}`);
      
      return appointments;
    } catch (error) {
      logger.error(`Error finding appointments by user ${userId}:`, error);
      throw new AppError(`Error al buscar citas del usuario: ${error.message}`, 500);
    }
  }

  /**
   * Buscar citas por barbero
   * @param {string} barberId - ID del barbero
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Appointment[]>}
   */
  async findByBarberId(barberId, options = {}) {
    try {
      const { sort = { date: -1 }, limit } = options;
      
      logger.database(`Searching appointments by barber ID: ${barberId}`);
      
      let query = Appointment.find({ barber: barberId })
        .populate('user', 'name email phone')
  .populate('service', 'name price duration')
        .sort(sort);
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const appointments = await query;
      logger.database(`Found ${appointments.length} appointments for barber ${barberId}`);
      
      return appointments;
    } catch (error) {
      logger.error(`Error finding appointments by barber ${barberId}:`, error);
      throw new AppError(`Error al buscar citas del barbero: ${error.message}`, 500);
    }
  }

  /**
   * Buscar citas por fecha
   * @param {Date} date - Fecha de la cita
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Appointment[]>}
   */
  async findByDate(date, options = {}) {
    try {
      const { sort = { date: 1 } } = options;
      
      logger.database(`Searching appointments by date: ${date}`);
      
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const appointments = await Appointment.find({
        date: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      })
        .populate('user', 'name email phone')
        .populate('barber', 'name email')
  .populate('service', 'name price duration')
        .sort(sort);
      
      logger.database(`Found ${appointments.length} appointments for date ${date}`);
      return appointments;
    } catch (error) {
      logger.error(`Error finding appointments by date ${date}:`, error);
      throw new AppError(`Error al buscar citas por fecha: ${error.message}`, 500);
    }
  }

  /**
   * Buscar citas en un rango de fechas
   * @param {Date} startDate - Fecha de inicio
   * @param {Date} endDate - Fecha de fin
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Appointment[]>}
   */
  async findByDateRange(startDate, endDate, options = {}) {
    try {
      const { sort = { date: 1 }, filters = {} } = options;
      
      logger.database(`Searching appointments by date range: ${startDate} to ${endDate}`);
      
      const query = {
        date: {
          $gte: startDate,
          $lte: endDate
        },
        ...filters
      };
      
      const appointments = await Appointment.find(query)
        .populate('user', 'name email phone')
        .populate('barber', 'name email')
  .populate('service', 'name price duration')
        .sort(sort);
      
      logger.database(`Found ${appointments.length} appointments in date range`);
      return appointments;
    } catch (error) {
      logger.error(`Error finding appointments by date range:`, error);
      throw new AppError(`Error al buscar citas por rango de fechas: ${error.message}`, 500);
    }
  }

  /**
   * Verificar disponibilidad de horario
   * @param {string} barberId - ID del barbero
   * @param {Date} date - Fecha y hora
   * @param {number} duration - Duración en minutos
   * @returns {Promise<boolean>}
   */
  async checkAvailability(barberId, date, duration) {
    try {
      logger.database(`Checking availability for barber ${barberId} at ${date}`);
      
      const appointmentStart = new Date(date);
      const appointmentEnd = new Date(date.getTime() + (duration * 60000));
      
      const conflictingAppointments = await Appointment.countDocuments({
        barber: barberId,
        status: { $ne: 'cancelled' },
        $or: [
          {
            date: {
              $lt: appointmentEnd,
              $gte: appointmentStart
            }
          },
          {
            $and: [
              { date: { $lt: appointmentStart } },
              { 
                $expr: {
                  $lt: [appointmentStart, {
                    $add: [
                      '$date',
                      { $multiply: ['$totalDuration', 60000] }
                    ]
                  }]
                }
              }
            ]
          }
        ]
      });
      
      const isAvailable = conflictingAppointments === 0;
      logger.database(`Availability check result: ${isAvailable}`);
      
      return isAvailable;
    } catch (error) {
      logger.error('Error checking availability:', error);
      throw new AppError(`Error al verificar disponibilidad: ${error.message}`, 500);
    }
  }

  /**
   * Listar todas las citas con paginación y filtros
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<{appointments: Appointment[], total: number, page: number, totalPages: number}>}
   */
  async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = { date: -1 },
        filters = {}
      } = options;

      logger.database(`Listing appointments - Page: ${page}, Limit: ${limit}`);

      const skip = (page - 1) * limit;
      
      // Ejecutar consultas en paralelo
      const [appointments, total] = await Promise.all([
        Appointment.find(filters)
          .populate('user', 'name email phone')
          .populate('barber', 'name email')
          .populate('service', 'name price duration')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Appointment.countDocuments(filters)
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.database(`Found ${appointments.length} appointments out of ${total} total`);

      return {
        appointments,
        total,
        page: Number(page),
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      };
    } catch (error) {
      logger.error('Error listing appointments:', error);
      throw new AppError(`Error al listar citas: ${error.message}`, 500);
    }
  }
}

export default AppointmentRepositoryImpl;