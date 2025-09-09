import app from './app.js';
import { config } from './config/index.js';
import { connectDB } from './config/database.js';
import { logger } from './utils/logger.js';
import mongoose from 'mongoose';

console.log('Starting server...');

const startServer = async () => {
  try {
    // Conectar a la base de datos
    await connectDB();
    logger.info('✅ Conexión a la base de datos establecida');

    // Iniciar el servidor
    const server = app.listen(config.app.port, '0.0.0.0', () => {
      logger.info(`
🚀 Servidor iniciado en modo ${config.app.nodeEnv}
📡 API escuchando en:
   - http://localhost:${config.app.port}
   - http://${process.env.HOST || 'localhost'}:${config.app.port}
📚 Documentación API: http://localhost:${config.app.port}/api/docs
      `);
    });

    // Manejar señales de terminación
    const shutdown = async (signal) => {
      logger.info(`\n${signal} recibido. Iniciando apagado elegante...`);
      
      server.close(async () => {
        logger.info('👋 Servidor HTTP cerrado');
        
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