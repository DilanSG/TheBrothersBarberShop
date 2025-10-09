import nodemailer from 'nodemailer';
import { logger } from '../../../shared/utils/logger.js';

/**
 * Casos de uso para el envío de emails
 */
class EmailUseCases {
  constructor() {
    this.isConfigured = !!(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS);
    
    if (this.isConfigured) {
      try {
        this.transporter = nodemailer.createTransporter({
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT || 587,
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
        logger.info('Servicio de email configurado correctamente');
      } catch (error) {
        logger.warn('[EMAIL] Error creating transporter:', error.message);
        this.isConfigured = false;
        this.transporter = null;
      }
    } else {
      this.transporter = null;
    }
  }

  async verifyConnection() {
    if (!this.isConfigured || !this.transporter) {
      throw new Error('Email service not configured');
    }
    
    try {
      await this.transporter.verify();
      logger.info('Conexión SMTP verificada correctamente');
      return true;
    } catch (error) {
      logger.error('Error verifying SMTP connection:', error.message);
      throw error;
    }
  }

  getIsConfigured() {
    return this.isConfigured;
  }

  async sendAppointmentConfirmation(appointment, user) {
    if (!this.isConfigured) {
      logger.warn('[EMAIL] Email not configured, skipping appointment confirmation');
      return;
    }

    const mailOptions = {
      from: `The Brothers Barber Shop <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Confirmación de Reserva',
      html: `
        <h2>¡Hola ${user.name}!</h2>
        <p>Tu reserva ha sido confirmada:</p>
        <ul>
          <li><strong>Fecha y hora:</strong> ${new Date(appointment.dateTime).toLocaleString()}</li>
          <li><strong>Duración:</strong> ${appointment.duration} minutos</li>
        </ul>
        <p>¡Gracias por reservar con nosotros!</p>
      `
    };
    
    try {
      await this.transporter.sendMail(mailOptions);
      logger.info(`[EMAIL] Appointment confirmation sent to ${user.email}`);
    } catch (error) {
      logger.error('[EMAIL] Failed to send appointment confirmation:', error);
    }
  }

  async sendNewAppointmentNotification(appointment, user) {
    if (!this.isConfigured) {
      logger.warn('[EMAIL] Email not configured, skipping appointment notification');
      return;
    }

    const mailOptions = {
      from: `The Brothers Barber Shop <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: 'Nueva Reserva Recibida',
      html: `
        <h2>Nueva reserva recibida</h2>
        <p><strong>Cliente:</strong> ${user.name}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Fecha y hora:</strong> ${new Date(appointment.dateTime).toLocaleString()}</p>
        <p><strong>Duración:</strong> ${appointment.duration} minutos</p>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info('[EMAIL] New appointment notification sent');
    } catch (error) {
      logger.error('[EMAIL] Failed to send new appointment notification:', error);
    }
  }

  async sendAppointmentCancellation(appointment, user) {
    if (!this.isConfigured) {
      logger.warn('[EMAIL] Email not configured, skipping cancellation email');
      return;
    }

    const mailOptions = {
      from: `The Brothers Barber Shop <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Reserva Cancelada',
      html: `
        <h2>¡Hola ${user.name}!</h2>
        <p>Tu reserva ha sido cancelada:</p>
        <ul>
          <li><strong>Fecha y hora:</strong> ${new Date(appointment.dateTime).toLocaleString()}</li>
        </ul>
        <p>Si necesitas hacer una nueva reserva, no dudes en contactarnos.</p>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info(`[EMAIL] Appointment cancellation sent to ${user.email}`);
    } catch (error) {
      logger.error('[EMAIL] Failed to send appointment cancellation:', error);
    }
  }
}

// Crear instancia y exportar como default
const emailUseCases = new EmailUseCases();
export default emailUseCases;
