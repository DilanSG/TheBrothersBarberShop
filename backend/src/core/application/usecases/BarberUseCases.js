/**
 * BarberUseCases - Casos de uso para gestión de barberos
 * Gestión integral de barberos con Repository Pattern
 */

import { AppError, logger } from '../../../barrel.js';
import DIContainer from '../../../shared/container/index.js';

class BarberUseCases {
  constructor() {
    // Obtener repositorios del contenedor DI
    this.barberRepository = DIContainer.get('BarberRepository');
    this.userRepository = DIContainer.get('UserRepository');
  }

  // Método estático para obtener instancia con DI
  static getInstance() {
    return new BarberUseCases();
  }

  /**
   * Obtener todos los barberos
   * @param {Object} filters - Filtros de búsqueda
   * @param {Object} pagination - Paginación
   * @returns {Promise<Object>}
   */
  async getBarbers(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 50 } = pagination;
      
      logger.debug('BarberUseCases: Obteniendo barberos con filtros:', filters);

      // Construir query para repository
      const query = this._buildBarbersQuery(filters);

      const result = await this.barberRepository.findAll({
        filters: query,  // Cambio de 'filter' a 'filters'
        limit,
        page,
        sort: { createdAt: -1 }
      });

      // El repositorio devuelve { barbers, total, page, ... }
      if (result && result.barbers) {
        logger.debug(`BarberUseCases: Recuperados ${result.barbers.length} barberos`);
        return {
          data: result.barbers,
          total: result.total,
          pagination: {
            page: result.page,
            totalPages: result.totalPages,
            hasNextPage: result.hasNextPage,
            hasPrevPage: result.hasPrevPage
          }
        };
      } else {
        logger.warn('BarberUseCases: Respuesta inesperada del repository:', result);
        return {
          data: result || [],
          total: result?.length || 0,
          pagination: { page, limit }
        };
      }
    } catch (error) {
      logger.error('BarberUseCases: Error al obtener barberos:', error);
      throw new AppError('Error al obtener lista de barberos', 500);
    }
  }

  /**
   * Obtener barbero por ID
   * @param {string} id - ID del barbero
   * @returns {Promise<Object>}
   */
  async getBarberById(id) {
    try {
      logger.debug(`BarberUseCases: Buscando barbero por ID: ${id}`);
      
      const barber = await this.barberRepository.findById(id);
      if (!barber) {
        throw new AppError('Barbero no encontrado', 404);
      }
      
      logger.debug(`BarberUseCases: Barbero encontrado: ${barber._id}`);
      return barber;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`BarberUseCases: Error al obtener barbero ${id}:`, error);
      throw new AppError('Error al obtener barbero', 500);
    }
  }

  /**
   * Crear nuevo barbero
   * @param {Object} barberData - Datos del barbero
   * @param {Object} user - Usuario que crea el barbero
   * @returns {Promise<Object>}
   */
  async createBarber(barberData, user) {
    try {
      logger.debug('BarberUseCases: Creando nuevo barbero');
      
      // Validar que el usuario existe y tiene rol de barbero
      if (barberData.user) {
        const userRecord = await this.userRepository.findById(barberData.user);
        if (!userRecord) {
          throw new AppError('Usuario no encontrado', 404);
        }
        if (userRecord.role !== 'barber') {
          throw new AppError('El usuario debe tener rol de barbero', 400);
        }
      }

      const newBarber = await this.barberRepository.create(barberData);
      
      logger.info(`BarberUseCases: Barbero creado exitosamente: ${newBarber._id}`);
      return newBarber;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('BarberUseCases: Error al crear barbero:', error);
      throw new AppError('Error al crear barbero', 500);
    }
  }

  /**
   * Actualizar barbero
   * @param {string} id - ID del barbero
   * @param {Object} updateData - Datos a actualizar
   * @param {Object} user - Usuario que actualiza
   * @returns {Promise<Object>}
   */
  async updateBarber(id, updateData, user) {
    try {
      logger.debug(`BarberUseCases: Actualizando barbero ${id}`);
      
      const updatedBarber = await this.barberRepository.update(id, updateData);
      
      logger.info(`BarberUseCases: Barbero actualizado exitosamente: ${id}`);
      return updatedBarber;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`BarberUseCases: Error al actualizar barbero ${id}:`, error);
      throw new AppError('Error al actualizar barbero', 500);
    }
  }

  /**
   * Eliminar barbero
   * @param {string} id - ID del barbero
   * @param {Object} user - Usuario que elimina
   * @returns {Promise<boolean>}
   */
  async deleteBarber(id, user) {
    try {
      logger.debug(`BarberUseCases: Eliminando barbero ${id}`);
      
      const result = await this.barberRepository.delete(id);
      
      logger.info(`BarberUseCases: Barbero eliminado exitosamente: ${id}`);
      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`BarberUseCases: Error al eliminar barbero ${id}:`, error);
      throw new AppError('Error al eliminar barbero', 500);
    }
  }

  /**
   * Obtener barberos activos
   * @returns {Promise<Array>}
   */
  async getActiveBarbers() {
    try {
      logger.debug('BarberUseCases: Obteniendo barberos activos');
      
      const result = await this.barberRepository.findAll({
        filter: { isActive: true },
        sort: { name: 1 }
      });

      logger.debug(`BarberUseCases: Encontrados ${result.data.length} barberos activos`);
      return result.data;
    } catch (error) {
      logger.error('BarberUseCases: Error al obtener barberos activos:', error);
      throw new AppError('Error al obtener barberos activos', 500);
    }
  }

  /**
   * Construir query para filtros de barberos
   * @param {Object} filters - Filtros
   * @returns {Object} Query de MongoDB
   * @private
   */
  _buildBarbersQuery(filters) {
    const query = {};

    // Filtros básicos permitidos
    const allowedFilters = ['isActive', 'specialties'];
    allowedFilters.forEach(f => {
      if (filters[f] !== undefined) query[f] = filters[f];
    });

    // Búsqueda por texto
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { specialties: { $in: [new RegExp(filters.search, 'i')] } }
      ];
    }

    return query;
  }

  // ========================================================================
  // ADAPTADORES DE COMPATIBILIDAD PARA MÉTODOS ESTÁTICOS
  // ========================================================================

  static async getBarbers(filters = {}, pagination = {}) {
    const instance = BarberUseCases.getInstance();
    return await instance.getBarbers(filters, pagination);
  }

  static async getBarberById(id) {
    const instance = BarberUseCases.getInstance();
    return await instance.getBarberById(id);
  }

  static async createBarber(barberData, user) {
    const instance = BarberUseCases.getInstance();
    return await instance.createBarber(barberData, user);
  }

  static async updateBarber(id, updateData, user) {
    const instance = BarberUseCases.getInstance();
    return await instance.updateBarber(id, updateData, user);
  }

  static async deleteBarber(id, user) {
    const instance = BarberUseCases.getInstance();
    return await instance.deleteBarber(id, user);
  }

  static async getActiveBarbers() {
    const instance = BarberUseCases.getInstance();
    return await instance.getActiveBarbers();
  }

  // ** MÉTODOS COMPLEJOS SIN MIGRAR 
  // Mantenidos por complejidad específica
  //
  /**
   * Obtener estadísticas de barbero
   * @param {string} barberId - ID del barbero
   * @param {Date} startDate - Fecha inicio
   * @param {Date} endDate - Fecha fin
   * @returns {Promise<Object>}
   */
  static async getBarberStats(barberId, startDate, endDate) {
    logger.debug(`Obteniendo estadísticas del barbero: ${barberId}`);
    
    try {
      // Verificar que el barbero existe
      const barber = await Barber.findById(barberId).populate('user', 'name email');
      if (!barber) {
        throw new AppError('Barbero no encontrado', 404);
      }

      const dateQuery = {
        barber: barberId
      };

      if (startDate || endDate) {
        dateQuery.createdAt = {};
        if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
        if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
      }

      // Estadísticas de citas
      const appointmentStats = await Appointment.aggregate([
        { $match: { ...dateQuery, date: dateQuery.createdAt } },
        {
          $group: {
            _id: null,
            totalAppointments: { $sum: 1 },
            completedAppointments: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            cancelledAppointments: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
            }
          }
        }
      ]);

      // Estadísticas de ventas
      const salesStats = await Sale.aggregate([
        { $match: dateQuery },
        {
          $group: {
            _id: null,
            totalSales: { $sum: 1 },
            totalRevenue: { $sum: '$total' },
            avgSaleValue: { $avg: '$total' }
          }
        }
      ]);

      const result = {
        barber: {
          id: barber._id,
          name: barber.user?.name || barber.name,
          email: barber.user?.email
        },
        period: { startDate, endDate },
        appointments: appointmentStats[0] || {
          totalAppointments: 0,
          completedAppointments: 0,
          cancelledAppointments: 0
        },
        sales: salesStats[0] || {
          totalSales: 0,
          totalRevenue: 0,
          avgSaleValue: 0
        }
      };

      logger.debug('Estadísticas del barbero calculadas:', result);
      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Error obteniendo estadísticas del barbero ${barberId}:`, error);
      throw new AppError('Error al obtener estadísticas del barbero', 500);
    }
  }

  /**
   * Actualizar horario de barbero
   * @param {string} barberId - ID del barbero
   * @param {Object} schedule - Nuevo horario
   * @param {Object} user - Usuario que actualiza
   * @returns {Promise<Object>}
   */
  static async updateBarberSchedule(barberId, schedule, user) {
    logger.debug(`Actualizando horario del barbero: ${barberId}`);
    
    try {
      const barber = await Barber.findById(barberId);
      if (!barber) {
        throw new AppError('Barbero no encontrado', 404);
      }

      // Validar formato del horario
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      for (const day of Object.keys(schedule)) {
        if (!validDays.includes(day)) {
          throw new AppError(`Día inválido: ${day}`, 400);
        }

        if (schedule[day]?.available && (!schedule[day].start || !schedule[day].end)) {
          throw new AppError(`Horario incompleto para ${day}`, 400);
        }
      }

      barber.schedule = { ...barber.schedule, ...schedule };
      await barber.save();

      const updatedBarber = await Barber.findById(barberId).populate('user', 'name email');
      
      logger.info(`Horario actualizado para barbero ${barberId}`);
      return updatedBarber;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Error actualizando horario del barbero ${barberId}:`, error);
      throw new AppError('Error al actualizar horario del barbero', 500);
    }
  }

  /**
   * Obtener horarios disponibles de barbero
   * @param {string} barberId - ID del barbero
   * @param {string} date - Fecha en formato YYYY-MM-DD
   * @returns {Promise<Array>}
   */
  static async getBarberAvailableSlots(barberId, date) {
    logger.debug(`Obteniendo horarios disponibles del barbero ${barberId} para ${date}`);
    
    try {
      const barber = await Barber.findById(barberId);
      if (!barber) {
        throw new AppError('Barbero no encontrado', 404);
      }

      if (!barber.schedule) {
        throw new AppError('El barbero no tiene horarios configurados', 400);
      }

      const dayMap = {
        'domingo': 'sunday',
        'lunes': 'monday',
        'martes': 'tuesday',
        'miércoles': 'wednesday',
        'jueves': 'thursday',
        'viernes': 'friday',
        'sábado': 'saturday'
      };

      const dayOfWeek = new Date(date).toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
      const englishDay = dayMap[dayOfWeek];
      
      if (!englishDay || !barber.schedule[englishDay]?.available) {
        return [];
      }

      const schedule = barber.schedule[englishDay];
      const startOfDay = new Date(date + 'T00:00:00');
      const endOfDay = new Date(date + 'T23:59:59');
      
      // Obtener citas existentes
      const appointments = await Appointment.find({
        barber: barberId,
        date: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ['confirmed', 'pending', 'in-progress'] }
      }).sort({ date: 1 });

      // Generar slots disponibles
      const slots = [];
      const [startHour, startMinute] = schedule.start.split(':').map(Number);
      const [endHour, endMinute] = schedule.end.split(':').map(Number);
      
      const startTime = new Date(date + `T${schedule.start}:00`);
      const endTime = new Date(date + `T${schedule.end}:00`);
      
      const current = new Date(startTime);
      while (current < endTime) {
        const slotTime = new Date(current);
        
        // Verificar si el slot está ocupado
        const isOccupied = appointments.some(appointment => {
          const appointmentStart = new Date(appointment.date);
          const appointmentEnd = new Date(appointmentStart.getTime() + (appointment.duration || 60) * 60000);
          return slotTime >= appointmentStart && slotTime < appointmentEnd;
        });

        if (!isOccupied) {
          slots.push(slotTime.toTimeString().slice(0, 5));
        }
        
        current.setMinutes(current.getMinutes() + 30); // Slots de 30 minutos
      }

      logger.debug(`Encontrados ${slots.length} slots disponibles para ${barberId} en ${date}`);
      return slots;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Error obteniendo slots del barbero ${barberId}:`, error);
      throw new AppError('Error al obtener horarios disponibles', 500);
    }
  }
}

export default BarberUseCases;