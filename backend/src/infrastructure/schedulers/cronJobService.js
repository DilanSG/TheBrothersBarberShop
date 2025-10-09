import cron from 'node-cron';
import { Appointment, User, Barber } from '../../core/domain/entities/index.js';
import EmailUseCases from '../../core/application/usecases/EmailUseCases.js';
import { logger } from '../../shared/utils/logger.js';
import DateUtils from '../../shared/utils/dateUtils.js';

/**
 * Sistema de trabajos programados (Cron Jobs)
 * Maneja recordatorios automáticos y resúmenes diarios
 */
class CronJobService {
  constructor() {
    this.jobs = new Map();
    this.isInitialized = false;
  }

  /**
   * Inicializar todos los trabajos programados
   */
  initializeJobs() {
    if (this.isInitialized) {
      logger.warn('CronJobService ya está inicializado');
      return;
    }

    try {
      // Inicializar cron jobs independientemente del email
      // Los jobs verificarán individualmente si pueden ejecutarse

      this.setupAppointmentReminders();
      this.setupDailyReports();
      this.setupWeeklyReports();

      this.isInitialized = true;
      logger.scheduler('Recordatorios de citas: Configurado (cada hora)');
      logger.scheduler('Resúmenes diarios: Configurado (20:00 hrs)');
      logger.scheduler('Resúmenes semanales: Configurado (Lunes 09:00 hrs)');
      logger.scheduler('Todos los trabajos programados están activos');
    } catch (error) {
      logger.error('[ERROR] Error inicializando cron jobs:', error);
    }
  }

  /**
   * Configurar recordatorios de citas (cada hora)
   */
  setupAppointmentReminders() {
    const reminderJob = cron.schedule('0 * * * *', async () => {
      await this.sendAppointmentReminders();
    }, {
      scheduled: false,
      timezone: 'America/Bogota'
    });

    this.jobs.set('appointmentReminders', reminderJob);
    reminderJob.start();
  }

  /**
   * Enviar recordatorios de citas para el día siguiente
   */
  async sendAppointmentReminders() {
    try {
      // Obtener fecha de mañana usando DateUtils
      const today = DateUtils.getCurrentDateColombia();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const { startDate: tomorrowStart } = DateUtils.getDateRange(tomorrow.toISOString().split('T')[0]);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      // Buscar citas programadas para mañana
      const appointments = await Appointment.find({
        date: {
          $gte: tomorrow,
          $lt: dayAfterTomorrow
        },
        status: { $in: ['programada', 'aprobada'] },
        isActive: true
      })
      .populate('customer', 'name email')
      .populate('barber', 'name')
      .populate('services.service', 'name price duration');

      logger.info(`[SCHEDULER] Procesando ${appointments.length} recordatorios para ${tomorrow.toDateString()}`);

      let sentCount = 0;
      for (const appointment of appointments) {
        try {
          if (appointment.customer && appointment.customer.email) {
            await EmailUseCases.sendAppointmentReminder(appointment);
            sentCount++;
            // Pequeña pausa entre envíos
            await this.sleep(500);
          }
        } catch (error) {
          logger.error(`[ERROR] Error enviando recordatorio para cita ${appointment._id}:`, error.message);
        }
      }

      logger.info(`[SUCCESS] Recordatorios enviados: ${sentCount}/${appointments.length}`);
    } catch (error) {
      logger.error('[ERROR] Error en sendAppointmentReminders:', error);
    }
  }

  /**
   * Configurar resúmenes diarios (8 PM todos los días)
   */
  setupDailyReports() {
    const dailyReportJob = cron.schedule('0 20 * * *', async () => {
      await this.sendDailyReports();
    }, {
      scheduled: false,
      timezone: 'America/Bogota'
    });

    this.jobs.set('dailyReports', dailyReportJob);
    dailyReportJob.start();
  }

  /**
   * Enviar resúmenes diarios a barberos
   */
  async sendDailyReports() {
    try {
      const { startDate: today } = DateUtils.getDateRange(DateUtils.getCurrentDateColombia());
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Obtener barberos activos
      const barbers = await Barber.find({ 
        isActive: true,
        'user.email': { $exists: true, $ne: null }
      }).populate('user', 'name email');

      logger.info(`[STATS] Enviando resúmenes diarios a ${barbers.length} barberos`);

      for (const barber of barbers) {
        try {
          if (barber.user && barber.user.email) {
            // Obtener estadísticas del día para este barbero
            const stats = await this.getDailyStatsForBarber(barber._id, today, tomorrow);
            
            // Obtener citas del día
            const appointments = await Appointment.find({
              barber: barber._id,
              date: { $gte: today, $lt: tomorrow },
              isActive: true
            })
            .populate('customer', 'name')
            .populate('services.service', 'name price');

            await EmailUseCases.sendDailyBarberSummary(barber, stats, appointments, today);
            await this.sleep(300);
          }
        } catch (error) {
          logger.error(`[ERROR] Error enviando resumen a barbero ${barber.user?.name}:`, error.message);
        }
      }

      logger.info('[SUCCESS] Resúmenes diarios enviados completamente');
    } catch (error) {
      logger.error('[ERROR] Error en sendDailyReports:', error);
    }
  }

  /**
   * Configurar resúmenes semanales (lunes 9 AM)
   */
  setupWeeklyReports() {
    const weeklyReportJob = cron.schedule('0 9 * * 1', async () => {
      await this.sendWeeklyReports();
    }, {
      scheduled: false,
      timezone: 'America/Bogota'
    });

    this.jobs.set('weeklyReports', weeklyReportJob);
    weeklyReportJob.start();
  }

  /**
   * Enviar resúmenes semanales a administradores
   */
  async sendWeeklyReports() {
    try {
      // Calcular rango de la semana pasada (lunes a domingo)
      const now = new Date();
      const lastMonday = new Date(now);
      lastMonday.setDate(now.getDate() - now.getDay() - 6); // Lunes pasado
      const { startDate: lastMondayStart, endDate: lastSundayEnd } = DateUtils.getPeriodRange(
        lastMonday.toISOString().split('T')[0],
        new Date(lastMonday.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      );

      // Obtener administradores activos
      const admins = await User.find({ 
        role: 'admin', 
        isActive: true,
        email: { $exists: true, $ne: null }
      }).select('name email');

      logger.info(`[METRICS] Enviando resúmenes semanales a ${admins.length} administradores`);

      // Calcular estadísticas de la semana
      const stats = await this.getWeeklyStats(lastMonday, lastSunday);

      for (const admin of admins) {
        try {
          if (admin.email) {
            await EmailUseCases.sendWeeklySummaryToAdmin(admin, stats, lastMonday, lastSunday);
            await this.sleep(300);
          }
        } catch (error) {
          logger.error(`[ERROR] Error enviando resumen a admin ${admin.name}:`, error.message);
        }
      }

      logger.info('[SUCCESS] Resúmenes semanales enviados completamente');
    } catch (error) {
      logger.error('[ERROR] Error en sendWeeklyReports:', error);
    }
  }

  /**
   * Obtener estadísticas diarias para un barbero específico
   */
  async getDailyStatsForBarber(barberId, startDate, endDate) {
    try {
      const appointments = await Appointment.find({
        barber: barberId,
        date: { $gte: startDate, $lt: endDate },
        isActive: true
      }).populate('services.service', 'name price');

      const completedAppointments = appointments.filter(apt => apt.status === 'completada');
      const totalRevenue = completedAppointments.reduce((sum, apt) => sum + (apt.totalAmount || 0), 0);
      
      return {
        totalAppointments: appointments.length,
        completedAppointments: completedAppointments.length,
        cancelledAppointments: appointments.filter(apt => apt.status === 'cancelada').length,
        totalRevenue: totalRevenue,
        averageRevenue: completedAppointments.length > 0 ? totalRevenue / completedAppointments.length : 0
      };
    } catch (error) {
      logger.error('Error obteniendo estadísticas diarias:', error);
      return {
        totalAppointments: 0,
        completedAppointments: 0,
        cancelledAppointments: 0,
        totalRevenue: 0,
        averageRevenue: 0
      };
    }
  }

  /**
   * Obtener estadísticas semanales generales
   */
  async getWeeklyStats(startDate, endDate) {
    try {
      const appointments = await Appointment.find({
        date: { $gte: startDate, $lt: endDate },
        isActive: true
      }).populate('barber', 'name')
        .populate('services.service', 'name price');

      const completedAppointments = appointments.filter(apt => apt.status === 'completada');
      const totalRevenue = completedAppointments.reduce((sum, apt) => sum + (apt.totalAmount || 0), 0);

      // Estadísticas por barbero
      const barberStats = {};
      completedAppointments.forEach(apt => {
        const barberName = apt.barber?.name || 'Sin asignar';
        if (!barberStats[barberName]) {
          barberStats[barberName] = { count: 0, revenue: 0 };
        }
        barberStats[barberName].count++;
        barberStats[barberName].revenue += apt.totalAmount || 0;
      });

      return {
        totalAppointments: appointments.length,
        completedAppointments: completedAppointments.length,
        cancelledAppointments: appointments.filter(apt => apt.status === 'cancelada').length,
        totalRevenue: totalRevenue,
        averageRevenue: completedAppointments.length > 0 ? totalRevenue / completedAppointments.length : 0,
        barberStats: barberStats,
        dailyAverage: totalRevenue / 7
      };
    } catch (error) {
      logger.error('Error obteniendo estadísticas semanales:', error);
      return {
        totalAppointments: 0,
        completedAppointments: 0,
        cancelledAppointments: 0,
        totalRevenue: 0,
        averageRevenue: 0,
        barberStats: {},
        dailyAverage: 0
      };
    }
  }

  /**
   * Obtener el estado de todos los jobs
   */
  getJobsStatus() {
    const status = {};
    for (const [name, job] of this.jobs) {
      status[name] = {
        running: job.running,
        scheduled: job.scheduled
      };
    }
    return status;
  }

  /**
   * Detener todos los trabajos programados
   */
  stopAllJobs() {
    try {
      for (const [name, job] of this.jobs) {
        if (job && job.running) {
          job.stop();
          logger.info(` Job ${name} detenido`);
        }
      }
      logger.info('[SUCCESS] Todos los cron jobs han sido detenidos correctamente');
    } catch (error) {
      logger.error('[ERROR] Error deteniendo cron jobs:', error);
    }
  }

  /**
   * Utilidad para pausas entre operaciones
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Exportar instancia singleton
const cronJobService = new CronJobService();
export default cronJobService;
