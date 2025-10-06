import mongoose from 'mongoose';
import Appointment from '../../domain/entities/Appointment.js';
import Barber from '../../domain/entities/Barber.js'; 
import Service from '../../domain/entities/Service.js';
import { AppError, logger } from '../../../barrel.js';
// import ReportsCacheService from './reportsCacheService.js';

// const reportsCacheService = new ReportsCacheService();

class AppointmentService {
  static async getAvailableTimes(barberId, date) {
    const barber = await Barber.findById(barberId).populate('user');
    if (!barber) {
      throw new AppError('Barbero no encontrado', 404);
    }

    // Verificar si el barbero tiene horarios configurados
    if (!barber.schedule) {
      throw new AppError('El barbero no tiene horarios configurados', 400);
    }

    // Mapear días en español a inglés
    const dayMap = {
      'lunes': 'monday',
      'martes': 'tuesday',
      'miércoles': 'wednesday',
      'jueves': 'thursday',
      'viernes': 'friday',
      'sábado': 'saturday',
      'domingo': 'sunday'
    };

    // Obtener el día de la semana
    const dayOfWeek = new Date(date).toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
    const englishDay = dayMap[dayOfWeek];
    
    if (!englishDay || !barber.schedule[englishDay]) {
      throw new AppError(`No hay horarios configurados para ${dayOfWeek}`, 400);
    }
    
    // Validar que el barbero trabaja ese día
    const schedule = barber.schedule[englishDay];
    if (!schedule || !schedule.available) {
      throw new AppError('El barbero no trabaja este día', 400);
    }

    // Obtener todas las citas del barbero para ese día
    const startOfDay = new Date(new Date(date).setHours(0, 0, 0));
    const endOfDay = new Date(new Date(date).setHours(23, 59, 59));
    
    const appointments = await Appointment.find({
      barber: barberId,
      date: { $gte: startOfDay, $lt: endOfDay },
      status: { $nin: ['cancelled', 'no_show'] }
    }).select('date duration').lean();

    // Generar slots disponibles
    const availableSlots = this.generateTimeSlots(schedule.start, schedule.end, appointments, date);

    return availableSlots;
  }

  static generateTimeSlots(startTime, endTime, appointments, date) {
    const slots = [];
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    const slotDuration = 30; // minutos

    for (let time = start; time < end; time.setMinutes(time.getMinutes() + slotDuration)) {
      const timeString = time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      const isAvailable = !appointments.some(apt => {
        const aptTime = new Date(apt.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        return aptTime === timeString;
      });

      if (isAvailable) {
        // Crear datetime completo para el frontend
        const appointmentDate = new Date(date);
        const [hours, minutes] = timeString.split(':');
        appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        slots.push({
          time: timeString,
          datetime: appointmentDate.toISOString()
        });
      }
    }

    return slots;
  }

  static async createAppointment(appointmentData) {
    try {
      // console.log('📝 Datos recibidos para crear cita:', appointmentData);
      
      // Normalizar los nombres de los campos
      const barberId = appointmentData.barberId || appointmentData.barber;
      const serviceId = appointmentData.serviceId || appointmentData.service;
      
      if (!barberId) {
        throw new AppError('ID del barbero es requerido', 400);
      }
      
      if (!serviceId) {
        throw new AppError('ID del servicio es requerido', 400);
      }

      // Obtener el servicio para obtener la duración
      // console.log('🔍 Buscando servicio...');
      const service = await Service.findById(serviceId);
      if (!service) {
        throw new AppError('Servicio no encontrado', 404);
      }
      
      // console.log('✅ Servicio encontrado:', service.name, 'Duración:', service.duration);

      // Validar disponibilidad del barbero
      const isAvailable = await this.checkBarberAvailability(
        barberId,
        appointmentData.date,
        service.duration
      );

      if (!isAvailable) {
        throw new AppError('El barbero no está disponible en ese horario', 400);
      }

      // Verificar que el servicio existe y pertenece al barbero
      // console.log('🔍 Verificando que el barbero ofrece el servicio...');
      const barber = await Barber.findById(barberId)
        .populate('services');
      
      if (!barber) {
        throw new AppError('Barbero no encontrado', 404);
      }
      
      const hasService = barber.services.some(
        s => s._id.toString() === serviceId.toString()
      );
      
      if (!hasService) {
        throw new AppError('El barbero no ofrece este servicio', 400);
      }

      // console.log('✅ Barbero ofrece el servicio');

      // Preparar los datos para crear la cita
      const appointmentToCreate = {
        user: appointmentData.user,
        barber: barberId,
        service: serviceId,
        date: appointmentData.date,
        duration: service.duration,
        price: service.price,
        status: 'pending',
        notes: appointmentData.notes || ''
      };

      // console.log('📝 Creando cita con datos:', appointmentToCreate);

      // Crear la cita
      const appointment = await Appointment.create(appointmentToCreate);
      await appointment.populate([
        { path: 'user', select: 'name email phone' },
        { path: 'barber', select: 'user services', populate: { path: 'user', select: 'name email' } },
        { path: 'service', select: 'name price duration' }
      ]);

      logger.info(`Nueva cita creada: ${appointment._id}`);
      return appointment;
    } catch (error) {
      logger.error('Error creando cita:', error);
      throw error;
    }
  }

  static async getAppointments(filters = {}) {
    try {
      const appointments = await Appointment.find(filters)
        .populate('user', 'name email phone')
        .populate({
          path: 'barber',
          select: 'user services',
          populate: { path: 'user', select: 'name email' }
        })
        .populate('service', 'name price duration')
        .sort({ date: 1 });

      return appointments;
    } catch (error) {
      logger.error('Error obteniendo citas:', error);
      throw new AppError('Error al obtener las citas', 500);
    }
  }

  static async getAppointmentById(id) {
    try {
      const appointment = await Appointment.findById(id)
        .populate('user', 'name email phone')
        .populate({
          path: 'barber',
          select: 'user services',
          populate: { path: 'user', select: 'name email' }
        })
        .populate('service', 'name price duration');

      if (!appointment) {
        throw new AppError('Cita no encontrada', 404);
      }

      return appointment;
    } catch (error) {
      logger.error(`Error obteniendo cita ${id}:`, error);
      throw error;
    }
  }

  static async updateAppointment(id, updateData, userId, userRole) {
    try {
      const appointment = await this.getAppointmentById(id);

      // Verificar permisos
      if (userRole !== 'admin' && 
          appointment.user.toString() !== userId &&
          appointment.barber.user.toString() !== userId) {
        throw new AppError('No tienes permiso para actualizar esta cita', 403);
      }

      // Si se está actualizando la fecha o duración, verificar disponibilidad
      if (updateData.date || updateData.duration) {
        const isAvailable = await this.checkBarberAvailability(
          appointment.barber,
          updateData.date || appointment.date,
          updateData.duration || appointment.duration,
          id // excluir la cita actual de la verificación
        );

        if (!isAvailable) {
          throw new AppError('El barbero no está disponible en ese horario', 400);
        }
      }

      // Actualizar cita
      const updatedAppointment = await Appointment.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate([
        { path: 'user', select: 'name email phone' },
        { path: 'barber', select: 'user services', populate: { path: 'user', select: 'name email' } },
        { path: 'service', select: 'name price duration' }
      ]);

      logger.info(`Cita ${id} actualizada`);
      return updatedAppointment;
    } catch (error) {
      logger.error(`Error actualizando cita ${id}:`, error);
      throw error;
    }
  }

  static async cancelAppointment(id, reason, user) {
    try {
      const appointment = await this.getAppointmentById(id);

      // Verificar que la cita no esté ya completada o cancelada
      if (['completed', 'cancelled', 'no_show'].includes(appointment.status)) {
        throw new AppError(`No se puede cancelar una cita ${appointment.status}`, 400);
      }

      const userRole = user.role;
      const currentDate = new Date();

      // Lógica de cancelación basada en estado y rol
      if (appointment.status === 'pending') {
        // CITA PENDIENTE
        if (userRole === 'user') {
          // Cliente puede cancelar sin motivo
          appointment.status = 'cancelled';
          appointment.cancelledBy = 'user';
          appointment.cancelledAt = currentDate;
          appointment.cancellationNotified = true; // No necesita notificación adicional
        } else if (userRole === 'barber') {
          // Barbero DEBE proporcionar motivo
          if (!reason || reason.trim().length === 0) {
            throw new AppError('El barbero debe proporcionar un motivo para cancelar la cita', 400);
          }
          if (reason.split(' ').length > 100) {
            throw new AppError('El motivo no puede exceder las 100 palabras', 400);
          }
          
          appointment.status = 'cancelled';
          appointment.cancelledBy = 'barber';
          appointment.cancelledAt = currentDate;
          appointment.cancellationReason = reason;
          appointment.cancellationNotified = false; // Cliente debe ser notificado
        } else if (userRole === 'admin') {
          // Admin puede cancelar con o sin motivo
          appointment.status = 'cancelled';
          appointment.cancelledBy = 'admin';
          appointment.cancelledAt = currentDate;
          if (reason) appointment.cancellationReason = reason;
          appointment.cancellationNotified = true;
        }
      } else if (appointment.status === 'confirmed') {
        // CITA CONFIRMADA
        // Cualquier rol debe proporcionar motivo
        if (!reason || reason.trim().length === 0) {
          throw new AppError('Debe proporcionar un motivo para cancelar una cita confirmada', 400);
        }
        if (reason.split(' ').length > 100) {
          throw new AppError('El motivo no puede exceder las 100 palabras', 400);
        }

        appointment.status = 'cancelled';
        appointment.cancelledBy = userRole;
        appointment.cancelledAt = currentDate;
        appointment.cancellationReason = reason;
        appointment.requiresCancellationApproval = false; // Para citas confirmadas, la cancelación es inmediata
        appointment.cancellationNotified = false; // El otro rol debe ser notificado
      }

      await appointment.save();

      logger.info(`Cita ${id} cancelada por ${userRole}`);
      return appointment;
    } catch (error) {
      logger.error(`Error cancelando cita ${id}:`, error);
      throw error;
    }
  }

  static async completeAppointment(id, userId, userRole, paymentMethod) {
    try {
      const appointment = await this.getAppointmentById(id);

      // Los permisos ya fueron verificados en el controlador
      // Solo verificamos el estado de la cita
      if (appointment.status !== 'confirmed') {
        throw new AppError('Solo se pueden completar citas confirmadas', 400);
      }

      appointment.status = 'completed';
      appointment.paymentMethod = paymentMethod; // ✅ Agregar método de pago
      await appointment.save();

      logger.info(`Cita ${id} completada por usuario ${userId} con método de pago ${paymentMethod}`);
      return appointment;
    } catch (error) {
      logger.error(`Error completando cita ${id}:`, error.message);
      throw error;
    }
  }

  static async approveAppointment(id, userId, userRole) {
    try {
      // Refrescar los datos de la cita desde la base de datos
      const appointment = await this.getAppointmentById(id);
      
      // console.log('🔍 Verificando permisos para aprobar cita:');
      // console.log('  - ID de la cita:', id);
      // console.log('  - Estado actual:', appointment.status);
      // console.log('  - Usuario que intenta aprobar:', userId);
      // console.log('  - Rol del usuario:', userRole);
      // console.log('  - Barbero asignado a la cita:', appointment.barber.user?._id || appointment.barber.user);

      // Solo el barbero asignado o un admin pueden aprobar citas
      const barberUserId = appointment.barber.user?._id || appointment.barber.user;
      if (userRole !== 'admin' && barberUserId.toString() !== userId.toString()) {
        // console.log('❌ Permiso denegado - Usuario no es el barbero asignado');
        throw new AppError('No tienes permiso para aprobar esta cita', 403);
      }

      if (appointment.status !== 'pending') {
        // console.log(`❌ Estado actual de la cita: "${appointment.status}", se requiere "pending"`);
        throw new AppError(`Solo se pueden aprobar citas pendientes. Estado actual: ${appointment.status}`, 400);
      }

      // Verificar si la cita ya fue procesada mediante una consulta directa
      const freshAppointment = await Appointment.findById(id);
      if (freshAppointment.status !== 'pending') {
        // console.log(`❌ La cita ya fue procesada, estado actual: "${freshAppointment.status}"`);
        throw new AppError(`Esta cita ya fue procesada. Estado actual: ${freshAppointment.status}`, 409);
      }

      appointment.status = 'confirmed';
      await appointment.save();

      // console.log('✅ Cita aprobada exitosamente');
      logger.info(`Cita ${id} aprobada/confirmada`);
      return appointment;
    } catch (error) {
      console.error('❌ Error aprobando cita:', error);
      logger.error(`Error aprobando cita ${id}:`, error);
      throw error;
    }
  }

  static async markNoShow(id, userId, userRole) {
    try {
      const appointment = await this.getAppointmentById(id);

      // Solo el barbero asignado o un admin pueden marcar no-show
      if (userRole !== 'admin' && 
          appointment.barber.user.toString() !== userId) {
        throw new AppError('No tienes permiso para marcar no-show', 403);
      }

      if (appointment.status !== 'confirmed') {
        throw new AppError('Solo se pueden marcar no-show citas confirmadas', 400);
      }

      appointment.status = 'no_show';
      await appointment.save();

      logger.info(`Cita ${id} marcada como no-show`);
      return appointment;
    } catch (error) {
      logger.error(`Error marcando no-show cita ${id}:`, error);
      throw error;
    }
  }

  // Métodos auxiliares
  static async checkBarberAvailability(barberId, date, duration, excludeAppointmentId = null) {
    try {
      // console.log('🔍 Verificando disponibilidad:', { barberId, date, duration });
      
      const appointmentDate = new Date(date);
      const endTime = new Date(appointmentDate.getTime() + duration * 60000);

      // Verificar horario del barbero para ese día
      // console.log('📋 Buscando barbero...');
      const barber = await Barber.findById(barberId).populate('user');
      if (!barber) {
        // console.log('❌ Barbero no encontrado');
        throw new AppError('Barbero no encontrado', 404);
      }

      // console.log('✅ Barbero encontrado:', barber.user);

      // Obtener el día de la semana en formato correcto
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayOfWeek = dayNames[appointmentDate.getDay()];
      // console.log('📅 Día de la semana:', dayOfWeek);
      
      const schedule = barber.schedule?.[dayOfWeek];
      // console.log('⏰ Horario del día:', schedule);

      if (!schedule || !schedule.available) {
        // console.log('❌ Barbero no disponible este día');
        return false;
      }

      // Convertir horario del barbero a Date objects del día de la cita
      const [startHour, startMinute] = schedule.start.split(':');
      const [endHour, endMinute] = schedule.end.split(':');
      
      const scheduleStart = new Date(appointmentDate);
      scheduleStart.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
      
      const scheduleEnd = new Date(appointmentDate);
      scheduleEnd.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

      // console.log('🕐 Horario laboral:', { 
      //   start: scheduleStart.toISOString(), 
      //   end: scheduleEnd.toISOString() 
      // });
      // console.log('🕐 Cita solicitada:', { 
      //   start: appointmentDate.toISOString(), 
      //   end: endTime.toISOString() 
      // });

      // Verificar si la cita está dentro del horario del barbero
      if (appointmentDate < scheduleStart || endTime > scheduleEnd) {
        // console.log('❌ Cita fuera del horario laboral');
        return false;
      }

      // Buscar citas que se solapan con el horario solicitado
      // console.log('🔍 Buscando citas existentes...');
      const startOfDay = new Date(appointmentDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(appointmentDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Obtener todas las citas del barbero en ese día
      const existingAppointments = await Appointment.find({
        barber: barberId,
        status: { $in: ['pending', 'confirmed'] },
        date: { $gte: startOfDay, $lte: endOfDay },
        ...(excludeAppointmentId && { _id: { $ne: excludeAppointmentId } })
      });

      // console.log(`📊 Encontradas ${existingAppointments.length} citas existentes`);

      // Verificar manualmente si hay conflictos
      for (const appointment of existingAppointments) {
        const existingStart = new Date(appointment.date);
        const existingEnd = new Date(existingStart.getTime() + appointment.duration * 60000);

        // console.log('🔍 Verificando conflicto con cita:', {
        //   existing: `${existingStart.toISOString()} - ${existingEnd.toISOString()}`,
        //   requested: `${appointmentDate.toISOString()} - ${endTime.toISOString()}`
        // });

        // Verificar si hay solapamiento
        if (
          (appointmentDate >= existingStart && appointmentDate < existingEnd) ||
          (endTime > existingStart && endTime <= existingEnd) ||
          (appointmentDate <= existingStart && endTime >= existingEnd)
        ) {
          // console.log('❌ Conflicto encontrado');
          return false; // Hay conflicto
        }
      }

      // console.log('✅ No hay conflictos, horario disponible');
      return true; // No hay conflictos
    } catch (error) {
      console.error('❌ Error verificando disponibilidad:', error);
      logger.error('Error verificando disponibilidad:', error);
      throw new AppError('Error al verificar disponibilidad', 500);
    }
  }

  static async getAppointmentStats(filters = {}) {
    try {
      const stats = await Appointment.aggregate([
        { $match: filters },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalRevenue: { $sum: '$price' }
          }
        }
      ]);

      return {
        byStatus: stats.reduce((acc, stat) => {
          acc[stat._id] = {
            count: stat.count,
            revenue: stat.totalRevenue
          };
          return acc;
        }, {}),
        total: stats.reduce((acc, stat) => acc + stat.count, 0),
        totalRevenue: stats.reduce((acc, stat) => acc + stat.totalRevenue, 0)
      };
    } catch (error) {
      logger.error('Error obteniendo estadísticas:', error);
      throw new AppError('Error al obtener estadísticas', 500);
    }
  }

  // Limpiar citas pendientes que ya pasaron
  static async cleanupExpiredPendingAppointments() {
    try {
      const now = new Date();
      
      // Buscar citas pendientes que ya pasaron
      const expiredAppointments = await Appointment.find({
        status: 'pending',
        date: { $lt: now }
      });

      // console.log(`🧹 Encontradas ${expiredAppointments.length} citas pendientes expiradas`);

      if (expiredAppointments.length > 0) {
        // Marcar como canceladas automáticamente
        const result = await Appointment.updateMany(
          {
            status: 'pending',
            date: { $lt: now }
          },
          {
            $set: {
              status: 'cancelled',
              cancelledBy: 'system',
              cancelledAt: now,
              cancellationReason: 'Cita expirada - tiempo límite superado'
            }
          }
        );

        logger.info(`🧹 Limpieza automática: ${result.modifiedCount} citas pendientes expiradas fueron canceladas`);
        
        return {
          cleaned: result.modifiedCount,
          expiredAppointments: expiredAppointments.map(app => ({
            id: app._id,
            date: app.date,
            user: app.user,
            barber: app.barber
          }))
        };
      }

      return { cleaned: 0, expiredAppointments: [] };
    } catch (error) {
      logger.error('Error limpiando citas expiradas:', error);
      throw new AppError('Error al limpiar citas expiradas', 500);
    }
  }

  /**
   * Obtener estadísticas de citas por barbero
   */
  static async getBarberAppointmentStats(barberId, dateFilter = {}) {
    try {
      // Construir filtros de fecha
      const matchConditions = {
        barber: new mongoose.Types.ObjectId(barberId)
      };

      // Aplicar filtros de fecha
      if (dateFilter.date) {
        // Filtro por fecha específica - ajustar por zona horaria
        const targetDate = new Date(dateFilter.date + 'T00:00:00.000-05:00'); // Colombia UTC-5
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        matchConditions.date = {
          $gte: startOfDay,
          $lte: endOfDay
        };
      } else if (dateFilter.startDate && dateFilter.endDate) {
        // Filtro por rango de fechas - ajustar por zona horaria
        const startDate = new Date(dateFilter.startDate + 'T00:00:00.000-05:00'); // Colombia UTC-5
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dateFilter.endDate + 'T23:59:59.999-05:00'); // Colombia UTC-5
        endDate.setHours(23, 59, 59, 999);
        
        matchConditions.date = {
          $gte: startDate,
          $lte: endDate
        };
      }

      // console.log(`📅 Filtros aplicados para citas del barbero ${barberId}:`, {
      //   matchConditions,
      //   dateFilter
      // });

      const stats = await Appointment.aggregate([
        {
          $match: matchConditions
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            revenue: {
              $sum: {
                $cond: [{ $eq: ['$status', 'completed'] }, '$price', 0]
              }
            }
          }
        }
      ]);

      const result = {
        completed: 0,
        total: 0,
        revenue: 0,
        cancelled: 0,
        pending: 0
      };

      stats.forEach(stat => {
        result.total += stat.count;
        result[stat._id] = stat.count;
        result.revenue += stat.revenue;
      });

      // console.log(`📅 Stats de citas para barbero ${barberId} con filtros:`, {
      //   result,
      //   filteredBy: dateFilter
      // });

      return result;
    } catch (error) {
      console.error('Error getting barber appointment stats:', error);
      return {
        completed: 0,
        total: 0,
        revenue: 0,
        cancelled: 0,
        pending: 0
      };
    }
  }

  /**
   * Obtener reporte diario de citas
   */
  static async getDailyReport(dateString, barberId = null) {
    try {
      const date = new Date(dateString);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const matchConditions = {
        date: {
          $gte: startOfDay,
          $lte: endOfDay
        },
        status: 'completed'
      };

      if (barberId) {
        matchConditions.barber = new mongoose.Types.ObjectId(barberId);
      }

      const appointments = await Appointment.find(matchConditions)
        .populate('barber')
        .populate('service')
        .populate('user');

      return appointments;
    } catch (error) {
      console.error('Error getting daily appointment report:', error);
      return [];
    }
  }

  /**
   * Obtener fechas disponibles con citas para un barbero
   */
  static async getAvailableDates(barberId) {
    try {
      const appointments = await Appointment.aggregate([
        {
          $match: {
            barber: new mongoose.Types.ObjectId(barberId),
            status: 'completed'
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$date"
              }
            }
          }
        },
        {
          $sort: { "_id": -1 }
        }
      ]);

      return appointments.map(a => a._id);
    } catch (error) {
      console.error('Error obteniendo fechas disponibles de citas:', error);
      return [];
    }
  }

  /**
   * Obtener detalles de citas completadas agrupadas por día
   */
  static async getCompletedDetails(barberId, startDate, endDate) {
    try {
      // console.log(`🔍 Obteniendo detalles de citas completadas - Barbero: ${barberId}, Desde: ${startDate || 'SIN LIMITE'}, Hasta: ${endDate || 'SIN LIMITE'}`);
      
      // Buscar barbero
      const barber = await Barber.findById(barberId).populate('user');
      if (!barber) {
        // Intentar buscar por user ID
        const barberByUser = await Barber.findOne({ user: barberId }).populate('user');
        if (!barberByUser) {
          throw new AppError('Barbero no encontrado', 404);
        }
        barberId = barberByUser._id;
      }
      
      let start, end;
      let dateQuery = {};
      
      if (startDate && endDate) {
        // Usar la misma lógica que getBarberAppointmentStats (que funciona correctamente)
        start = new Date(startDate + 'T00:00:00.000-05:00'); // Colombia UTC-5
        start.setHours(0, 0, 0, 0);
        end = new Date(endDate + 'T23:59:59.999-05:00'); // Colombia UTC-5
        end.setHours(23, 59, 59, 999);
        
        dateQuery = { date: { $gte: start, $lte: end } };
        // console.log(`📅 Rango de fechas procesado con zona horaria Colombia: ${start.toISOString()} - ${end.toISOString()}`);
      } else {
        // console.log(`📅 Sin filtro de fechas - obteniendo todos los registros`);
      }

      // Usar cache inteligente
      // return await reportsCacheService.withCache(
      //   'completed-appointments',
      //   barberId.toString(),
      //   start || new Date(0),
      //   end || new Date(),
      //   async () => {
          // console.log(`📊 Generando detalles de citas completadas desde DB`);
          
          const appointments = await Appointment.find({
            barber: barberId,
            ...dateQuery,
            status: 'completed'
          })
          .populate('user', 'name phone email')
          .populate('service', 'name price duration')
          .sort({ date: 1 });

          // console.log(`🔍 Citas encontradas en DB: ${appointments.length} registros para barbero ${barberId}`);
          
          // Debug: Verificar si hay citas con datos faltantes
          const appointmentsWithMissingData = appointments.filter(apt => !apt.user || !apt.service);
          if (appointmentsWithMissingData.length > 0) {
            // console.log(`⚠️ CITAS CON DATOS FALTANTES: ${appointmentsWithMissingData.length}/${appointments.length}`);
            appointmentsWithMissingData.slice(0, 3).forEach((apt, index) => {
              // console.log(`   Cita ${index + 1}: ID=${apt._id}, user=${!!apt.user}, service=${!!apt.service}, date=${apt.date}`);
            });
          }

      // Agrupar por día
      const appointmentsByDay = {};
      appointments.forEach(appointment => {
        const dayKey = appointment.date.toISOString().split('T')[0];
        
        if (!appointmentsByDay[dayKey]) {
          appointmentsByDay[dayKey] = {
            date: dayKey,
            appointments: [],
            totalAmount: 0,
            totalAppointments: 0
          };
        }

        const appointmentDetail = {
          _id: appointment._id,
          date: appointment.date,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          total: appointment.price,
          notes: appointment.notes,
          client: {
            _id: appointment.user._id,
            name: appointment.user.name,
            phone: appointment.user.phone,
            email: appointment.user.email
          },
          service: appointment.service ? {
            _id: appointment.service._id,
            name: appointment.service.name,
            price: appointment.service.price,
            duration: appointment.service.duration
          } : {
            _id: null,
            name: 'Servicio no disponible',
            price: appointment.price || 0,
            duration: null
          },
          price: appointment.price
        };

        appointmentsByDay[dayKey].appointments.push(appointmentDetail);
        appointmentsByDay[dayKey].totalAmount += appointment.price || 0;
        appointmentsByDay[dayKey].totalAppointments += 1;
      });

      const result = Object.values(appointmentsByDay).sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // console.log(`✅ Detalles de citas completadas generados: ${result.length} días con citas`);
      return result;
      //   }
      // );

    } catch (error) {
      console.error('Error obteniendo detalles de citas completadas:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las citas completadas para el modal de breakdown
   */
  static async getCompletedAppointments() {
    try {
      console.log('🔍 Buscando citas completadas con método de pago...');
      
      // Primero verificar cuántas citas completadas hay en total
      const totalCompleted = await Appointment.countDocuments({ status: 'completed' });
      console.log(`📊 Total citas completadas: ${totalCompleted}`);
      
      // Verificar cuántas tienen método de pago
      const withPayment = await Appointment.countDocuments({ 
        status: 'completed',
        paymentMethod: { $exists: true, $ne: null }
      });
      console.log(`💳 Citas completadas con método de pago: ${withPayment}`);
      
      const appointments = await Appointment.find({
        status: 'completed',
        paymentMethod: { $exists: true, $ne: null }
      })
      .populate('user', 'name email')
      .populate('service', 'name price')
      .populate('barber')
      .populate({
        path: 'barber',
        populate: {
          path: 'user',
          select: 'name'
        }
      })
      .sort({ date: -1 })
      .lean();

      console.log(`✅ Citas completadas encontradas para el modal: ${appointments.length}`);
      if (appointments.length > 0) {
        console.log('📋 Primer ejemplo de cita:', {
          id: appointments[0]._id,
          service: appointments[0].service?.name,
          user: appointments[0].user?.name,
          paymentMethod: appointments[0].paymentMethod,
          totalRevenue: appointments[0].totalRevenue,
          price: appointments[0].price
        });
      }
      
      return appointments;
    } catch (error) {
      console.error('❌ Error obteniendo citas completadas:', error);
      throw error;
    }
  }
}

export default AppointmentService;
