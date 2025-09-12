import app from './app.js';
import { config } from './config/index.js';
import { connectDB } from './config/database.js';
import { logger } from './utils/logger.js';
import mongoose from 'mongoose';

// Last update: 11/09/2025 - Gitignore fixed and project cleaned
console.log('🚀 Starting server...');
console.log('📍 Port:', process.env.PORT || 5000);
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');

const startServer = async () => {
  console.log('🚀 Iniciando servidor...');
  console.log('📍 Puerto configurado:', config.app.port);
  console.log('🌍 Entorno:', config.app.nodeEnv);
  
  try {
    // Iniciar el servidor PRIMERO - esto es crítico para Render
    const server = app.listen(config.app.port, '0.0.0.0', () => {
      console.log(`✅ Servidor iniciado exitosamente en puerto ${config.app.port}`);
      console.log(`📡 Servidor escuchando en http://0.0.0.0:${config.app.port}`);
      logger.info(`
🚀 Servidor iniciado en modo ${config.app.nodeEnv}
📡 API escuchando en:
   - http://localhost:${config.app.port}
   - http://${process.env.HOST || 'localhost'}:${config.app.port}
📚 Documentación API: http://localhost:${config.app.port}/api/docs
      `);
    });

    // Luego intentar conectar a la base de datos
    try {
      await connectDB();
      logger.info('✅ Conexión a la base de datos establecida');
    } catch (dbError) {
      logger.error('❌ Error conectando a la base de datos:', dbError);
      console.log('⚠️  Servidor iniciado sin conexión a MongoDB. Algunas funciones pueden no estar disponibles.');
    }

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
    console.error('❌ Error crítico iniciando el servidor:', error);
    logger.error('❌ Error iniciando el servidor:', error);
    process.exit(1);
  }
};

// Iniciar el servidor
startServer();