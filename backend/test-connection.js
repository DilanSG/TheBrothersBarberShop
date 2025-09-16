import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

console.log('🔄 Probando conexión a MongoDB...');
console.log('📍 URI:', process.env.MONGODB_URI ? 'Configurada' : 'NO CONFIGURADA');

async function testConnection() {
  try {
    console.log('🔗 Intentando conectar...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout de 5 segundos
    });
    
    console.log('✅ MongoDB conectado exitosamente');
    console.log('📊 Estado de la conexión:', mongoose.connection.readyState);
    
    await mongoose.connection.close();
    console.log('🔐 Conexión cerrada correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:');
    console.error('   Mensaje:', error.message);
    console.error('   Código:', error.code);
    process.exit(1);
  }
}

testConnection();