import mongoose from 'mongoose';
import { Appointment, Barber, Service, User, AppError, logger } from '../../../barrel.js';
import { now } from '../../../shared/utils/dateUtils.js';
import DIContainer from '../../../shared/container/index.js';

/**
 * AppointmentUseCases - Casos de uso para gestión de citas
 * ✅ MIGRACIÓN GRADUAL A REPOSITORY PATTERN
 * 
 * ESTADO DE MIGRACIÓN:
 * ✅ getAppointmentById - Migrado a Repository Pattern
 * ✅ getAppointments - Migrado a Repository Pattern
 * ✅ createAppointment - Migrado a Repository Pattern 
 * ⏳ updateAppointment - Pendiente migración completa
 * ⏳ Otros métodos - Mantendrán implementación original por complejidad
 */
class AppointmentUseCases {
  constructor() {
    try {
      // Obtener repositorios del contenedor DI
      logger.debug('AppointmentUseCases: Obteniendo repositorios del DIContainer...');
      this.appointmentRepository = DIContainer.get('AppointmentRepository');
      logger.debug('AppointmentUseCases: AppointmentRepository obtenido');
      this.userRepository = DIContainer.get('UserRepository');
      logger.debug('AppointmentUseCases: UserRepository obtenido');
      this.barberRepository = DIContainer.get('BarberRepository');
      logger.debug('AppointmentUseCases: BarberRepository obtenido');
      logger.debug('AppointmentUseCases: Repositorios inyectados correctamente');
    } catch (error) {
      logger.error('AppointmentUseCases: Error durante inyección de dependencias:', error);
      throw new AppError('Error inicializando AppointmentUseCases', 500);
    }
  }

  // Método estático para obtener instancia con DI
  static getInstance() {
    return new AppointmentUseCases();
  }

  // ========================================================================
  // MÉTODOS MIGRADOS A REPOSITORY PATTERN (✅)
  // ========================================================================

  /**
   * Obtener cita por ID (✅ MIGRADO)
   */
  async getAppointmentById(id) {
    try {
      logger.debug(`AppointmentUseCases: Buscando cita por ID: ${id}`);
      
      const appointment = await this.appointmentRepository.findById(id);
      if (!appointment) {
        throw new AppError('Cita no encontrada', 404);
      }
      
      logger.debug(`AppointmentUseCases: Cita encontrada: ${appointment._id}`);
      return appointment;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`AppointmentUseCases: Error al obtener cita ${id}:`, error);
      throw new AppError('Error al obtener cita', 500);
    }
  }

  /**
   * Obtener citas con filtros (✅ MIGRADO)
   */
  async getAppointments(filters = {}, pagination = {}) {
    try {
      logger.debug('AppointmentUseCases: Obteniendo citas con filtros:', filters);
      logger.debug('AppointmentUseCases: Paginación:', pagination);
      
      const { page = 1, limit = 50 } = pagination;
      logger.debug('AppointmentUseCases: Parámetros finales - page:', page, 'limit:', limit);
      
      const repositoryOptions = {
        filters: filters,
        limit: limit,
        page: page,
        sort: { date: -1 }
      };
      logger.debug('AppointmentUseCases: Opciones para repository:', repositoryOptions);
      
      logger.debug('AppointmentUseCases: Llamando appointmentRepository.findAll...');
      
      // Verificar que el repositorio está disponible
      if (!this.appointmentRepository) {
        throw new Error('AppointmentRepository no está disponible');
      }
      if (typeof this.appointmentRepository.findAll !== 'function') {
        throw new Error('AppointmentRepository.findAll no es una función');
      }
      
      const result = await this.appointmentRepository.findAll(repositoryOptions);
      logger.debug('AppointmentUseCases: Resultado del repository:', result);
      
      // The repository returns { appointments, total, page, ... }
      const appointments = result.appointments || result.data || result;
      logger.debug('AppointmentUseCases: Citas extraídas:', appointments);
      logger.debug(`AppointmentUseCases: Recuperadas ${appointments?.length || 0} citas`);
      return appointments;
    } catch (error) {
      logger.error('AppointmentUseCases: Error al obtener citas:', error);
      logger.error('AppointmentUseCases: Stack trace:', error.stack);
      throw new AppError('Error al obtener lista de citas', 500);
    }
  }

  /**
   * Crear nueva cita (✅ MIGRADO)
   */
  async createAppointment(appointmentData) {
    try {
      logger.debug('AppointmentUseCases: Creando nueva cita');
      
      // Validar que el usuario existe
      if (appointmentData.user) {
        const user = await this.userRepository.findById(appointmentData.user);
        if (!user) {
          throw new AppError('Usuario no encontrado', 404);
        }
      }

      // Crear cita usando repository
      const newAppointment = await this.appointmentRepository.create(appointmentData);
      
      logger.info(`AppointmentUseCases: Cita creada exitosamente: ${newAppointment._id}`);
      return newAppointment;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('AppointmentUseCases: Error al crear cita:', error);
      throw new AppError('Error al crear cita', 500);
    }
  }

  // ========================================================================
  // ADAPTADORES DE COMPATIBILIDAD
  // ========================================================================

  static async getAppointmentById(id) {
    const instance = AppointmentUseCases.getInstance();
    return await instance.getAppointmentById(id);
  }

  static async getAppointments(filters = {}, pagination = {}) {
    const instance = AppointmentUseCases.getInstance();
    return await instance.getAppointments(filters, pagination);
  }

  static async createAppointment(appointmentData) {
    const instance = AppointmentUseCases.getInstance();
    return await instance.createAppointment(appointmentData);
  }

  // ========================================================================
  // MÉTODOS COMPLEJOS SIN MIGRAR (⏳)
  // ========================================================================

  static async getAvailableTimes(barberId, date) {
    const barber = await Barber.findById(barberId).populate('user');
    if (!barber) {
      throw new AppError('Barbero no encontrado', 404);
    }

    if (!barber.schedule) {
      throw new AppError('El barbero no tiene horarios configurados', 400);
    }

    const dayMap = {
      'lunes': 'monday',
      'martes': 'tuesday',
      'miércoles': 'wednesday',
      'jueves': 'thursday',
      'viernes': 'friday',
      'sábado': 'saturday',
      'domingo': 'sunday'
    };

    const dayOfWeek = new Date(date).toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
    const englishDay = dayMap[dayOfWeek];
    
    if (!englishDay || !barber.schedule[englishDay]) {
      throw new AppError('No hay horarios configurados para ' + dayOfWeek, 400);
    }
    
    const schedule = barber.schedule[englishDay];
    if (!schedule || !schedule.available) {
      throw new AppError('El barbero no trabaja este día', 400);
    }

    const startOfDay = new Date(new Date(date).setHours(0, 0, 0));
    const endOfDay = new Date(new Date(date).setHours(23, 59, 59));
    
    const appointments = await Appointment.find({
      barber: barberId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['confirmed', 'pending', 'in-progress'] }
    }).sort({ date: 1 });

    const timeSlots = [];
    const start = schedule.start;
    const end = schedule.end;
    
    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    
    const startTime = new Date(date);
    startTime.setHours(startHour, startMinute, 0, 0);
    
    const endTime = new Date(date);
    endTime.setHours(endHour, endMinute, 0, 0);
    
    const current = new Date(startTime);
    while (current < endTime) {
      const slotTime = new Date(current);
      
      const isOccupied = appointments.some(appointment => {
        const appointmentStart = new Date(appointment.date);
        const appointmentEnd = new Date(appointmentStart.getTime() + (appointment.duration || 60) * 60000);
        return slotTime >= appointmentStart && slotTime < appointmentEnd;
      });

      if (!isOccupied) {
        timeSlots.push(slotTime.toTimeString().slice(0, 5));
      }
      
      current.setMinutes(current.getMinutes() + 30);
    }

    return timeSlots;
  }

  static async updateAppointment(id, updateData, userId, userRole) {
    try {
      const appointment = await Appointment.findById(id).populate('user barber');
      if (!appointment) {
        throw new AppError('Cita no encontrada', 404);
      }

      if (userRole !== 'admin' && 
          userRole !== 'barber' && 
          appointment.user._id.toString() !== userId) {
        throw new AppError('No tienes permisos para actualizar esta cita', 403);
      }

      if (updateData.date && updateData.date !== appointment.date.toISOString()) {
        const isAvailable = await this.checkBarberAvailability(
          appointment.barber._id,
          updateData.date,
          appointment.duration || 60,
          id
        );
        
        if (!isAvailable) {
          throw new AppError('El horario seleccionado no está disponible', 400);
        }
      }

      const updatedAppointment = await Appointment.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('user barber services.service');

      logger.info('Cita actualizada: ' + updatedAppointment._id);
      return updatedAppointment;
    } catch (error) {
      logger.error('Error actualizando cita ' + id + ':', error);
      throw error;
    }
  }

  static async cancelAppointment(id, reason, user) {
    try {
      const appointment = await Appointment.findById(id).populate('user barber');
      if (!appointment) {
        throw new AppError('Cita no encontrada', 404);
      }

      const canCancel = user.role === 'admin' || 
                       user.role === 'barber' || 
                       appointment.user._id.toString() === user._id;

      if (!canCancel) {
        throw new AppError('No tienes permisos para cancelar esta cita', 403);
      }

      if (['cancelled', 'completed'].includes(appointment.status)) {
        throw new AppError('Esta cita ya fue cancelada o completada', 400);
      }

      const updatedAppointment = await Appointment.findByIdAndUpdate(
        id,
        {
          $set: {
            status: 'cancelled',
            cancellation: {
              reason: reason || 'No especificado',
              cancelledBy: user._id,
              cancelledAt: now()
            }
          }
        },
        { new: true, runValidators: true }
      ).populate('user barber services.service');

      logger.info('Cita cancelada: ' + updatedAppointment._id + ' por ' + user.name);
      return updatedAppointment;
    } catch (error) {
      logger.error('Error cancelando cita ' + id + ':', error);
      throw error;
    }
  }

  static async checkBarberAvailability(barberId, date, duration, excludeAppointmentId = null) {
    try {
      const appointmentDate = new Date(date);
      const appointmentEnd = new Date(appointmentDate.getTime() + duration * 60000);

      const query = {
        barber: barberId,
        status: { $in: ['confirmed', 'pending', 'in-progress'] },
        date: { $lt: appointmentEnd },
        $expr: {
          $gt: [
            { $add: ['$date', { $multiply: [{ $ifNull: ['$duration', 60] }, 60000] }] },
            appointmentDate
          ]
        }
      };

      if (excludeAppointmentId) {
        query._id = { $ne: excludeAppointmentId };
      }

      const conflictingAppointments = await Appointment.find(query);
      return conflictingAppointments.length === 0;
    } catch (error) {
      logger.error('Error verificando disponibilidad:', error);
      return false;
    }
  }

  static async completeAppointment(id, userId, userRole, paymentMethod) {
    try {
      const appointment = await Appointment.findById(id).populate('user barber services.service');
      if (!appointment) {
        throw new AppError('Cita no encontrada', 404);
      }

      if (userRole !== 'admin' && userRole !== 'barber') {
        throw new AppError('No tienes permisos para completar esta cita', 403);
      }

      if (appointment.status !== 'confirmed' && appointment.status !== 'in-progress') {
        throw new AppError('Solo se pueden completar citas confirmadas o en progreso', 400);
      }

      const updatedAppointment = await Appointment.findByIdAndUpdate(
        id,
        {
          $set: {
            status: 'completed',
            completedAt: now(),
            paymentMethod: paymentMethod
          }
        },
        { new: true, runValidators: true }
      ).populate('user barber services.service');

      logger.info('Cita completada: ' + updatedAppointment._id);
      return updatedAppointment;
    } catch (error) {
      logger.error('Error completando cita ' + id + ':', error);
      throw error;
    }
  }

  static async approveAppointment(id, userId, userRole) {
    try {
      if (userRole !== 'admin' && userRole !== 'barber') {
        throw new AppError('No tienes permisos para aprobar esta cita', 403);
      }

      const appointment = await Appointment.findById(id);
      if (!appointment) {
        throw new AppError('Cita no encontrada', 404);
      }

      if (appointment.status !== 'pending') {
        throw new AppError('Solo se pueden aprobar citas pendientes', 400);
      }

      const freshAppointment = await Appointment.findById(id);
      freshAppointment.status = 'confirmed';
      freshAppointment.confirmedAt = now();
      freshAppointment.confirmedBy = userId;

      await freshAppointment.save();

      const populatedAppointment = await Appointment.findById(id)
        .populate('user', 'name email phone')
        .populate('barber', 'name email')
        .populate('services.service', 'name price duration');

      logger.info('Cita aprobada: ' + populatedAppointment._id);
      return populatedAppointment;
    } catch (error) {
      logger.error('Error aprobando cita ' + id + ':', error);
      throw error;
    }
  }

  static async markNoShow(id, userId, userRole) {
    try {
      if (userRole !== 'admin' && userRole !== 'barber') {
        throw new AppError('No tienes permisos para marcar esta cita como no-show', 403);
      }

      const appointment = await Appointment.findById(id);
      if (!appointment) {
        throw new AppError('Cita no encontrada', 404);
      }

      if (appointment.status === 'completed') {
        throw new AppError('No se puede marcar como no-show una cita completada', 400);
      }

      const updatedAppointment = await Appointment.findByIdAndUpdate(
        id,
        {
          $set: {
            status: 'no-show',
            noShowMarkedAt: now(),
            noShowMarkedBy: userId
          }
        },
        { new: true, runValidators: true }
      ).populate('user barber services.service');

      logger.info('Cita marcada como no-show: ' + updatedAppointment._id);
      return updatedAppointment;
    } catch (error) {
      logger.error('Error marcando no-show ' + id + ':', error);
      throw error;
    }
  }
}

export default AppointmentUseCases;
