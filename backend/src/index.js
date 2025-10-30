import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Cargar variables de entorno PRIMERO antes de cualquier otro import
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import app from './app.js';
import config from './shared/config/index.js';
import { connectDB } from './shared/config/database.js';
import { logger } from './shared/utils/logger.js';
import cronJobService from './services/cronJobService.js';
import emailService from './services/emailService.js';
import mongoose from 'mongoose';
import monitoringService from './core/application/usecases/MonitoringUseCases.js';

// Iniciar el servidor
const startServer = async () => {
  try {
    logger.info(`Iniciando servidor [${config.app.nodeEnv}] en puerto ${config.app.port}...`);
    
    // Conectar a la base de datos
    await connectDB();

    // Verificar configuración de email (no bloquear el startup)
    emailService.verifyConnection()
      .then(() => {
        logger.info('Servicio de email verificado y listo');
      })
      .catch((error) => {
        logger.warn(`Email no configurado: ${error.message}`);
      });

    // Inicializar trabajos programados (cron jobs)
    cronJobService.initializeJobs();
    
    // Iniciar el servidor
    const server = app.listen(config.app.port, '0.0.0.0', () => {
      logger.info(`
==============================================
SERVER STARTED SUCCESSFULLY
==============================================
Environment: ${config.app.nodeEnv}
Port: ${config.app.port}
Host: 0.0.0.0
API Base: http://localhost:${config.app.port}
API Docs: http://localhost:${config.app.port}/api/docs
Email: ${process.env.EMAIL_ENABLED === 'true' ? 'Activo ' : 'Deshabilitado '}
==============================================`);
      
      // Iniciar monitoreo de recursos
      monitoringService.startResourceMonitoring();
      logger.info('Monitoreo de recursos activo');
    });

    // Manejar señales de terminación
    const shutdown = async (signal) => {
      logger.info(`\n${signal} recibido. Iniciando apagado elegante...`);
      
      server.close(async () => {
        logger.info('Servidor HTTP cerrado');
        
        // Detener monitoreo de recursos
        monitoringService.stopResourceMonitoring();
        
        // Detener trabajos programados
        cronJobService.stopAllJobs();
        logger.info('Cron Jobs detenidos');
        
        try {
          await mongoose.connection.close();
          logger.info('Conexión a MongoDB cerrada');
          process.exit(0);
        } catch (err) {
          logger.error('Error cerrando conexión a MongoDB:', err);
          process.exit(1);
        }
      });

      // Si el servidor no se cierra en 10 segundos, forzar el cierre
      setTimeout(() => {
        logger.error('No se pudo cerrar el servidor elegantemente, forzando cierre');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Error iniciando el servidor:', error);
    process.exit(1);
  }
};

// Iniciar el servidor
startServer();