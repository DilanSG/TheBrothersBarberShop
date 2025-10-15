import nodemailer from 'nodemailer';
import { logger, AppError } from '../barrel.js';

/**
 * Servicio central de gestión de emails
 * Maneja configuración SMTP, templates y envío de notificaciones
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  /**
   * Inicializar configuración SMTP
   */
  initializeTransporter() {
    try {
      const emailConfig = {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true', // false para 587, true para 465
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        },
        tls: {
          rejectUnauthorized: false
        }
      };

      // Verificar que las credenciales estén configuradas
      if (!emailConfig.auth.user || !emailConfig.auth.pass) {
        logger.warn('Credenciales de email no configuradas. Funcionalidad de emails deshabilitada.');
        return;
      }

      this.transporter = nodemailer.createTransport(emailConfig);
      this.isConfigured = true;
      
      logger.info('Servicio de email configurado correctamente');
    } catch (error) {
      logger.error('Error configurando servicio de email:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Método getter para verificar si el servicio está configurado
   * @returns {boolean}
   */
  getIsConfigured() {
    return this.isConfigured;
  }

  /**
   * Verificar conexión SMTP
   */
  async verifyConnection() {
    if (!this.transporter || !this.isConfigured) {
      throw new AppError('Servicio de email no configurado', 500);
    }

    try {
      await this.transporter.verify();
      logger.info('Conexión SMTP verificada correctamente');
      return true;
    } catch (error) {
      logger.error('Error verificando conexión SMTP:', error);
      throw new AppError('Error de conexión con servidor de email', 500);
    }
  }

  /**
   * Función base para enviar emails
   */
  async sendEmail({ to, subject, html, text, attachments = [] }) {
    if (!this.isConfigured) {
      logger.warn('Intento de envío de email con servicio deshabilitado');
      return { success: false, message: 'Servicio de email no configurado' };
    }

    try {
      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || 'The Brothers Barber Shop',
          address: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER
        },
        to,
        subject,
        html,
        text: text || this.htmlToText(html),
        attachments
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info(`Email enviado exitosamente a ${to}`, {
        messageId: info.messageId,
        subject,
        timestamp: new Date().toISOString()
      });

      return { 
        success: true, 
        messageId: info.messageId,
        message: 'Email enviado correctamente'
      };
    } catch (error) {
      logger.error(`Error enviando email a ${to}:`, error);
      throw new AppError(`Error enviando email: ${error.message}`, 500);
    }
  }

  /**
   * Convertir HTML básico a texto plano
   */
  htmlToText(html) {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  /**
   * Template base para emails
   */
  getBaseTemplate({ title, content, footerText = null }) {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          background-color: #f4f4f4; 
        }
        .container { 
          max-width: 600px; 
          margin: 20px auto; 
          background: #fff; 
          border-radius: 12px; 
          overflow: hidden; 
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
        }
        .header { 
          background: linear-gradient(135deg, #1f2937, #374151); 
          color: #fff; 
          padding: 30px 20px; 
          text-align: center; 
        }
        .header h1 { 
          font-size: 24px; 
          margin-bottom: 5px; 
          font-weight: 600; 
        }
        .header p { 
          opacity: 0.9; 
          font-size: 14px; 
        }
        .content { 
          padding: 30px 20px; 
        }
        .footer { 
          background: #f8f9fa; 
          padding: 20px; 
          text-align: center; 
          font-size: 12px; 
          color: #666; 
          border-top: 1px solid #e9ecef; 
        }
        .button { 
          display: inline-block; 
          background: linear-gradient(135deg, #3b82f6, #1d4ed8); 
          color: #fff; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 6px; 
          margin: 20px 0; 
          font-weight: 500; 
        }
        .button:hover { 
          background: linear-gradient(135deg, #1d4ed8, #1e40af); 
        }
        .appointment-card { 
          background: #f8f9fa; 
          border: 1px solid #e9ecef; 
          border-radius: 8px; 
          padding: 20px; 
          margin: 20px 0; 
        }
        .appointment-detail { 
          display: flex; 
          justify-content: space-between; 
          margin: 8px 0; 
          padding: 8px 0; 
          border-bottom: 1px solid #e9ecef; 
        }
        .appointment-detail:last-child { 
          border-bottom: none; 
        }
        .label { 
          font-weight: 600; 
          color: #374151; 
        }
        .value { 
          color: #6b7280; 
        }
        @media only screen and (max-width: 600px) {
          .container { margin: 10px; }
          .content { padding: 20px 15px; }
          .header { padding: 20px 15px; }
          .appointment-detail { flex-direction: column; }
          .appointment-detail .value { margin-top: 4px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>The Brothers Barber Shop</h1>
          <p>Tu barbería de confianza</p>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          ${footerText || `
            <p><strong>The Brothers Barber Shop</strong></p>
            <p>📍 Dirección de la barbería</p>
            <p>📞 Teléfono de contacto | 📧 info@thebrothersbarber.com</p>
            <p style="margin-top: 10px; opacity: 0.8;">
              Este email fue enviado automáticamente. Por favor no responder.
            </p>
          `}
        </div>
      </div>
    </body>
    </html>`;
  }

  /**
   * CONFIRMACIÓN DE CITA - Para usuarios
   */
  async sendAppointmentConfirmation(appointment, user) {
    const content = `
      <h2 style="color: #1f2937; margin-bottom: 20px;">¡Cita Confirmada! ✅</h2>
      <p>Hola <strong>${user.name}</strong>,</p>
      <p>Tu cita ha sido confirmada exitosamente. Aquí tienes los detalles:</p>
      
      <div class="appointment-card">
        <div class="appointment-detail">
          <span class="label">📅 Fecha:</span>
          <span class="value">${new Date(appointment.date).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</span>
        </div>
        <div class="appointment-detail">
          <span class="label">⏰ Hora:</span>
          <span class="value">${appointment.time}</span>
        </div>
        <div class="appointment-detail">
          <span class="label">✂️ Servicio:</span>
          <span class="value">${appointment.service?.name || 'Servicio básico'}</span>
        </div>
        <div class="appointment-detail">
          <span class="label">👨‍💼 Barbero:</span>
          <span class="value">${appointment.barber?.name || 'Por asignar'}</span>
        </div>
        <div class="appointment-detail">
          <span class="label">💰 Precio:</span>
          <span class="value">$${appointment.service?.price?.toLocaleString() || 'A definir'}</span>
        </div>
        ${appointment.notes ? `
        <div class="appointment-detail">
          <span class="label">📝 Notas:</span>
          <span class="value">${appointment.notes}</span>
        </div>
        ` : ''}
      </div>

      <p><strong>📝 Importante:</strong></p>
      <ul style="margin: 15px 0; padding-left: 20px;">
        <li>Llega 5 minutos antes de tu cita</li>
        <li>Si necesitas cancelar, hazlo con al menos 2 horas de anticipación</li>
        <li>Recuerda traer identificación si es tu primera visita</li>
      </ul>

      <p>¡Esperamos verte pronto!</p>
    `;

    const html = this.getBaseTemplate({
      title: 'Confirmación de Cita - The Brothers Barber Shop',
      content
    });

    return await this.sendEmail({
      to: user.email,
      subject: '✅ Cita Confirmada - The Brothers Barber Shop',
      html
    });
  }

  /**
   * RECORDATORIO DE CITA - Para usuarios (24h antes)
   */
  async sendAppointmentReminder(appointment, user) {
    const content = `
      <h2 style="color: #1f2937; margin-bottom: 20px;">Recordatorio de Cita 📅</h2>
      <p>Hola <strong>${user.name}</strong>,</p>
      <p>Te recordamos que tienes una cita programada para mañana:</p>
      
      <div class="appointment-card">
        <div class="appointment-detail">
          <span class="label">📅 Fecha:</span>
          <span class="value">${new Date(appointment.date).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</span>
        </div>
        <div class="appointment-detail">
          <span class="label">⏰ Hora:</span>
          <span class="value">${appointment.time}</span>
        </div>
        <div class="appointment-detail">
          <span class="label">✂️ Servicio:</span>
          <span class="value">${appointment.service?.name || 'Servicio básico'}</span>
        </div>
        <div class="appointment-detail">
          <span class="label">👨‍💼 Barbero:</span>
          <span class="value">${appointment.barber?.name || 'Por asignar'}</span>
        </div>
      </div>

      <p><strong>⚠️ ¿Necesitas cancelar?</strong></p>
      <p>Si no puedes asistir, cancela tu cita lo antes posible para que otros clientes puedan usar ese horario.</p>
      
      <p>¡Nos vemos mañana! 🔥</p>
    `;

    const html = this.getBaseTemplate({
      title: 'Recordatorio de Cita - The Brothers Barber Shop',
      content
    });

    return await this.sendEmail({
      to: user.email,
      subject: '📅 Recordatorio: Tu cita es mañana - The Brothers Barber Shop',
      html
    });
  }

  /**
   * NOTIFICACIÓN NUEVA CITA - Para barberos
   */
  async sendNewAppointmentNotification(appointment, barber, user) {
    const content = `
      <h2 style="color: #1f2937; margin-bottom: 20px;">Nueva Cita Asignada 🆕</h2>
      <p>Hola <strong>${barber.name}</strong>,</p>
      <p>Se ha programado una nueva cita contigo:</p>
      
      <div class="appointment-card">
        <div class="appointment-detail">
          <span class="label">👤 Cliente:</span>
          <span class="value">${user.name}</span>
        </div>
        <div class="appointment-detail">
          <span class="label">📅 Fecha:</span>
          <span class="value">${new Date(appointment.date).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</span>
        </div>
        <div class="appointment-detail">
          <span class="label">⏰ Hora:</span>
          <span class="value">${appointment.time}</span>
        </div>
        <div class="appointment-detail">
          <span class="label">✂️ Servicio:</span>
          <span class="value">${appointment.service?.name || 'Servicio básico'}</span>
        </div>
        <div class="appointment-detail">
          <span class="label">📞 Teléfono:</span>
          <span class="value">${user.phone || 'No proporcionado'}</span>
        </div>
        ${appointment.notes ? `
        <div class="appointment-detail">
          <span class="label">📝 Notas del cliente:</span>
          <span class="value">${appointment.notes}</span>
        </div>
        ` : ''}
      </div>

      <p>Revisa tu agenda y prepárate para brindar un excelente servicio! 💪</p>
    `;

    const html = this.getBaseTemplate({
      title: 'Nueva Cita Asignada - The Brothers Barber Shop',
      content
    });

    return await this.sendEmail({
      to: barber.email,
      subject: '🆕 Nueva cita asignada para ' + new Date(appointment.date).toLocaleDateString('es-ES'),
      html
    });
  }

  /**
   * RESUMEN DIARIO - Para barberos
   */
  async sendDailySummary(barber, appointments) {
    const today = new Date();
    const appointmentCount = appointments.length;
    
    let appointmentsList = '';
    if (appointmentCount > 0) {
      appointmentsList = appointments.map(apt => `
        <div style="background: #f8f9fa; border-left: 4px solid #3b82f6; padding: 15px; margin: 10px 0; border-radius: 0 8px 8px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="color: #1f2937;">${apt.time} - ${apt.user?.name || 'Cliente'}</strong>
            <span style="background: #3b82f6; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${apt.service?.name || 'Servicio'}</span>
          </div>
          ${apt.notes ? `<p style="color: #6b7280; font-size: 14px; margin-top: 8px;"><em>Nota: ${apt.notes}</em></p>` : ''}
        </div>
      `).join('');
    }

    const content = `
      <h2 style="color: #1f2937; margin-bottom: 20px;">Resumen del Día 📊</h2>
      <p>Buenos días <strong>${barber.name}</strong>,</p>
      <p>Aquí tienes el resumen de tus citas para hoy, ${today.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}:</p>
      
      <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <h3 style="margin: 0; font-size: 18px;">📅 Citas del Día</h3>
        <p style="font-size: 32px; font-weight: bold; margin: 10px 0;">${appointmentCount}</p>
        <p style="margin: 0; opacity: 0.9;">${appointmentCount === 0 ? 'Día libre' : appointmentCount === 1 ? '1 cita programada' : `${appointmentCount} citas programadas`}</p>
      </div>

      ${appointmentCount > 0 ? `
        <h3 style="color: #1f2937; margin: 25px 0 15px 0;">Agenda del Día:</h3>
        ${appointmentsList}
        
        <div style="background: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #1e40af;"><strong>💡 Recordatorio:</strong> Revisa que tengas todos los implementos listos y llega 15 minutos antes de la primera cita.</p>
        </div>
      ` : `
        <div style="text-align: center; padding: 40px 0;">
          <p style="font-size: 48px; margin: 0;">🏖️</p>
          <h3 style="color: #1f2937; margin: 15px 0 5px 0;">¡Día Libre!</h3>
          <p style="color: #6b7280;">No tienes citas programadas para hoy. Disfruta tu descanso.</p>
        </div>
      `}

      <p>¡Que tengas un excelente día! 🔥</p>
    `;

    const html = this.getBaseTemplate({
      title: 'Resumen Diario - The Brothers Barber Shop',
      content
    });

    return await this.sendEmail({
      to: barber.email,
      subject: `📊 Resumen del día - ${appointmentCount} cita${appointmentCount !== 1 ? 's' : ''} programada${appointmentCount !== 1 ? 's' : ''}`,
      html
    });
  }

  /**
   * CANCELACIÓN DE CITA
   */
  async sendAppointmentCancellation(appointment, user, reason = '') {
    const content = `
      <h2 style="color: #dc2626; margin-bottom: 20px;">Cita Cancelada ❌</h2>
      <p>Hola <strong>${user.name}</strong>,</p>
      <p>Tu cita ha sido cancelada. Aquí están los detalles:</p>
      
      <div class="appointment-card">
        <div class="appointment-detail">
          <span class="label">📅 Fecha:</span>
          <span class="value">${new Date(appointment.date).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</span>
        </div>
        <div class="appointment-detail">
          <span class="label">⏰ Hora:</span>
          <span class="value">${appointment.time}</span>
        </div>
        <div class="appointment-detail">
          <span class="label">✂️ Servicio:</span>
          <span class="value">${appointment.service?.name || 'Servicio básico'}</span>
        </div>
        ${reason ? `
        <div class="appointment-detail">
          <span class="label">📝 Motivo:</span>
          <span class="value">${reason}</span>
        </div>
        ` : ''}
      </div>

      <p>¡Esperamos verte pronto! Puedes agendar una nueva cita cuando gustes.</p>
    `;

    const html = this.getBaseTemplate({
      title: 'Cita Cancelada - The Brothers Barber Shop',
      content
    });

    return await this.sendEmail({
      to: user.email,
      subject: '❌ Cita Cancelada - The Brothers Barber Shop',
      html
    });
  }
}

// Exportar instancia singleton
const emailService = new EmailService();
export default emailService;