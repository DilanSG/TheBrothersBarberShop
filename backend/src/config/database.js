const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    process.exit(1);
  }
};

// Manejar eventos de conexión
mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose conectado a la base de datos');
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 Error de conexión de Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 Mongoose desconectado');
});

// Cerramos la conexión adecuadamente cuando la app termina
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('⏹️  Conexión a MongoDB cerrada por terminación de la app');
  process.exit(0);
});

module.exports = connectDB;