import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('MongoDB conectado exitosamente');
  } catch (error) {
    logger.error('Error conectando a MongoDB:', error.message);
    process.exit(1);
  }
};


// Manejar eventos de conexión (solo para debugging detallado)
mongoose.connection.on('error', (err) => {
  logger.error('Error de conexión de Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('Mongoose desconectado de MongoDB');
});

// Cerramos la conexión adecuadamente cuando la app termina
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('Conexión a MongoDB cerrada por terminación de la app');
  process.exit(0);
});

export default connectDB;