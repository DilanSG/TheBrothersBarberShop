import app from './app.js';
import { config } from './shared/config/index.js';
import { connectDB } from './shared/config/database.js';
import { logger } from './shared/utils/logger.js';
import cronJobService from './services/cronJobService.js';
// CORS dinámico actualizado - 2025-09-22
import emailService from './services/emailService.js';
import mongoose from 'mongoose';

// Server starting...

const startServer = async () => {
  try {
    // Conectar a la base de datos
    await connectDB();
    logger.info('✅ Conexión a la base de datos establecida');

    // Verificar configuración de email
    try {
      await emailService.verifyConnection();
      logger.info('📧 Servicio de email configurado y listo');
    } catch (error) {
      logger.warn('📧 Servicio de email no configurado o con errores:', error.message);
    }

    // Inicializar trabajos programados (cron jobs)
    cronJobService.initializeJobs();
    
    // Iniciar el servidor
    const server = app.listen(config.app.port, '0.0.0.0', () => {
      logger.info(`
🚀 Servidor iniciado en modo ${config.app.nodeEnv}
📡 API escuchando en:
   - http://localhost:${config.app.port}
   - http://${process.env.HOST || 'localhost'}:${config.app.port}
📚 Documentación API: http://localhost:${config.app.port}/api/docs
📧 Sistema de notificaciones: ${process.env.EMAIL_ENABLED === 'true' ? '✅ Activo' : '❌ Deshabilitado'}
      `);
    });

    // Manejar señales de terminación
    const shutdown = async (signal) => {
      logger.info(`\n${signal} recibido. Iniciando apagado elegante...`);
      
      server.close(async () => {
        logger.info('👋 Servidor HTTP cerrado');
        
        // Detener trabajos programados
        cronJobService.stopAllJobs();
        logger.info('📅 Cron Jobs detenidos');
        
        try {
          await mongoose.connection.close();
          logger.info('📥 Conexión a MongoDB cerrada');
          process.exit(0);
        } catch (err) {
          logger.error('❌ Error cerrando conexión a MongoDB:', err);
          process.exit(1);
        }
      });

      // Si el servidor no se cierra en 10 segundos, forzar el cierre
      setTimeout(() => {
        logger.error('❌ No se pudo cerrar el servidor elegantemente, forzando cierre');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('❌ Error iniciando el servidor:', error);
    process.exit(1);
  }
};

// Iniciar el servidor
startServer();