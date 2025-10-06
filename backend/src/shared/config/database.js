import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    // MongoDB Conectado - usando logger en lugar de console
  } catch (error) {
    console.error('--Error conectando a MongoDB:', error.message, '--');
    process.exit(1);
  }
};


// Manejar eventos de conexión
mongoose.connection.on('connected', () => {
  // Mongoose conectado - usando logger
});

mongoose.connection.on('error', (err) => {
  console.error('--Error de conexión de Mongoose:', err,'--');
});

mongoose.connection.on('disconnected', () => {
  // console.log('--Mongoose desconectado--');
});

// Cerramos la conexión adecuadamente cuando la app termina
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  // console.log('--Conexión a MongoDB cerrada por terminación de la app--');
  process.exit(0);
});

export default connectDB;