console.log('🚀 Iniciando script de despoblado (modo no interactivo)...');

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
async function verificarDB() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    
    if (!config?.database?.uri) {
      console.error('❌ Error: La configuración de la base de datos no está disponible');
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
    
    console.log('\n📋 Estado actual de la base de datos:');
    console.log('═'.repeat(50));
    console.log(`👥 Usuarios: ${counts.users}`);
    console.log(`✂️  Barberos: ${counts.barbers}`);
    console.log(`🔧 Servicios: ${counts.services}`);
    console.log(`📅 Citas: ${counts.appointments}`);
    console.log(`📦 Inventario: ${counts.inventory}`);
    console.log(`💰 Ventas: ${counts.sales}`);
    console.log(`⭐ Reseñas: ${counts.reviews}`);
    console.log('═'.repeat(50));
    
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    console.log(`📊 Total de documentos: ${total}`);
    
    if (total === 0) {
      console.log('\n✨ La base de datos ya está vacía');
      console.log('💡 Para poblar con datos básicos: npm run seed');
      console.log('💡 Para poblar inventario: npm run seed:inventory');
      console.log('💡 Para poblar todo: npm run superseed');
    } else {
      console.log('\n⚠️  La base de datos contiene datos');
      console.log('🗑️  Para limpiar todo: npm run despoblar');
      console.log('   (Requiere confirmación manual escribiendo "CONFIRMAR")');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('📍 Stack:', error.stack);
  } finally {
    try {
      await mongoose.connection.close();
      console.log('\n🔌 Conexión cerrada');
    } catch (error) {
      console.error('Error cerrando conexión:', error.message);
    }
  }
}

// Ejecutar
console.log('🎯 Verificando estado de la base de datos...');
verificarDB().catch(error => {
  console.error('💥 Error fatal:', error.message);
  process.exit(1);
});
