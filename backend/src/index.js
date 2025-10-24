// Cargar variables de entorno PRIMERO antes de cualquier import
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Server starting...

const startServer = async () => {
  try {
    logger.info('🚀 INICIANDO SERVIDOR...');
    logger.info('📍 Puerto configurado:', config.app.port);
    logger.info('📍 Entorno:', config.app.nodeEnv);
    
    // Conectar a la base de datos
    logger.info('📊 Conectando a MongoDB...');
    await connectDB();
    logger.info('✅ Conexión a la base de datos establecida');
    logger.info('✅ Base de datos conectada exitosamente');

    // Verificar configuración de email (no bloquear el startup)
    logger.info('📧 Verificando configuración de email...');
    emailService.verifyConnection()
      .then(() => {
        logger.info('✅ Servicio de email configurado y listo');
      })
      .catch((error) => {
        logger.warn('⚠️ Servicio de email no configurado o con errores:', error.message);
      });

    // Inicializar trabajos programados (cron jobs)
    logger.info('⏰ Inicializando cron jobs...');
    cronJobService.initializeJobs();
    logger.info('✅ Cron jobs inicializados');
    
    logger.info('🌐 Iniciando servidor en puerto:', config.app.port);
    logger.info('🌐 Host configurado: 0.0.0.0');
    
    logger.info('🔧 Llamando a app.listen()...');
    
    // Iniciar el servidor
    const server = app.listen(config.app.port, '0.0.0.0', () => {
      logger.info('🎉 CALLBACK DE app.listen() EJECUTADO');
      logger.info(`
==============================================
SERVER STARTED SUCCESSFULLY
==============================================
Environment: ${config.app.nodeEnv}
Port: ${config.app.port}
Host: 0.0.0.0
URL: http://localhost:${config.app.port}
API Docs: http://localhost:${config.app.port}/api/docs
==============================================`);
      
      logger.info(`
Servidor iniciado en modo ${config.app.nodeEnv}
API escuchando en:
   - http://localhost:${config.app.port}
   - http://${process.env.HOST || 'localhost'}:${config.app.port}
Documentación API: http://localhost:${config.app.port}/api/docs
Sistema de notificaciones: ${process.env.EMAIL_ENABLED === 'true' ? 'Activo' : 'Deshabilitado'}
      `);
      
      // INICIAR MONITOREO DE RECURSOS DESPUÉS de que el servidor esté listo
      logger.info('Iniciando monitoreo de recursos del sistema...');
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