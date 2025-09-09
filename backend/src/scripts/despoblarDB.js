console.log('🚀 Iniciando script de despoblado...');

import mongoose from 'mongoose';
import { config } from '../config/index.js';

// Importar modelos
import User from '../models/User.js';
import Barber from '../models/Barber.js';
import Service from '../models/Service.js';
import Appointment from '../models/Appointment.js';
import Inventory from '../models/Inventory.js';
import Sale from '../models/Sale.js';
import Review from '../models/Review.js';

console.log('✅ Módulos importados correctamente');

// Función principal
async function despoblarDB() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    
    if (!config?.database?.uri) {
      console.error('❌ Error: La configuración de la base de datos no está disponible');
      console.log('💡 Verifica que el archivo .env exista y contenga MONGODB_URI');
      return;
    }
    
    console.log('📡 URI encontrada, conectando...');
    await mongoose.connect(config.database.uri, config.database.options);
    console.log('✅ Conectado a la base de datos');
    
    // Contar documentos actuales
    console.log('📊 Contando documentos...');
    const counts = {
      users: await User.countDocuments({}),
      barbers: await Barber.countDocuments({}),
      services: await Service.countDocuments({}),
      appointments: await Appointment.countDocuments({}),
      inventory: await Inventory.countDocuments({}),
      sales: await Sale.countDocuments({}),
      reviews: await Review.countDocuments({})
    };
    
    console.log('📋 Estado actual:');
    console.log(`  👥 Usuarios: ${counts.users}`);
    console.log(`  ✂️  Barberos: ${counts.barbers}`);
    console.log(`  🔧 Servicios: ${counts.services}`);
    console.log(`  📅 Citas: ${counts.appointments}`);
    console.log(`  📦 Inventario: ${counts.inventory}`);
    console.log(`  💰 Ventas: ${counts.sales}`);
    console.log(`  ⭐ Reseñas: ${counts.reviews}`);
    
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    console.log(`📊 Total de documentos: ${total}`);
    
    if (total === 0) {
      console.log('ℹ️  La base de datos ya está vacía');
      console.log('💡 Para poblar con datos, ejecuta: npm run superseed');
      return;
    }
    
    // Solicitar confirmación
    console.log('\n⚠️  CONFIRMACIÓN REQUERIDA');
    console.log('Esta operación eliminará TODOS los datos de la base de datos.');
    console.log('🚨 ESTA ACCIÓN NO SE PUEDE DESHACER 🚨');
    
    // Usar import dinámico para readline
    const readline = (await import('readline')).default;
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise((resolve, reject) => {
      try {
        rl.question('¿Estás seguro? (escribe "CONFIRMAR" para proceder): ', (answer) => {
          rl.close();
          resolve(answer);
        });
      } catch (error) {
        rl.close();
        reject(error);
      }
    });
    
    if (answer !== 'CONFIRMAR') {
      console.log('❌ Operación cancelada');
      return;
    }
    
    // Limpiar colecciones
    console.log('\n🧹 Limpiando base de datos...');
    
    const deleteResults = {
      reviews: await Review.deleteMany({}),
      sales: await Sale.deleteMany({}),
      appointments: await Appointment.deleteMany({}),
      inventory: await Inventory.deleteMany({}),
      barbers: await Barber.deleteMany({}),
      services: await Service.deleteMany({}),
      users: await User.deleteMany({})
    };
    
    console.log('📋 Documentos eliminados:');
    Object.entries(deleteResults).forEach(([collection, result]) => {
      console.log(`  ${collection}: ${result.deletedCount}`);
    });
    
    const totalDeleted = Object.values(deleteResults).reduce((sum, result) => sum + result.deletedCount, 0);
    console.log(`✅ Total eliminados: ${totalDeleted} documentos`);
    
    console.log('\n🎉 ¡Base de datos completamente limpia!');
    console.log('💡 Para repoblar:');
    console.log('  - npm run seed (solo básicos)');
    console.log('  - npm run seed:inventory (solo inventario)');
    console.log('  - npm run superseed (completo)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('📍 Tipo de error:', error.name);
    console.error('📍 Stack completo:', error.stack);
    
    // Si es un error de conexión, dar más contexto
    if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Posibles soluciones:');
      console.log('  1. Verificar que MongoDB esté ejecutándose');
      console.log('  2. Revisar la variable MONGODB_URI en .env');
      console.log('  3. Verificar la conexión de red');
    }
    
    process.exit(1);
  } finally {
    try {
      await mongoose.connection.close();
      console.log('🔌 Conexión cerrada');
    } catch (error) {
      console.error('Error cerrando conexión:', error.message);
    }
  }
}

// Ejecutar si es el archivo principal
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🎯 Ejecutando script directamente...');
  despoblarDB().catch(error => {
    console.error('💥 Error fatal:', error.message);
    process.exit(1);
  });
}

export default despoblarDB;
