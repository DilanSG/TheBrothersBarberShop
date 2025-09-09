console.log('🚀 Script de despoblado - MODO FORZADO (sin confirmación)');

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
async function despoblarForzado() {
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
    console.log('📊 Contando documentos antes de limpiar...');
    const initialCounts = {
      users: await User.countDocuments({}),
      barbers: await Barber.countDocuments({}),
      services: await Service.countDocuments({}),
      appointments: await Appointment.countDocuments({}),
      inventory: await Inventory.countDocuments({}),
      sales: await Sale.countDocuments({}),
      reviews: await Review.countDocuments({})
    };
    
    console.log('\n📋 Estado inicial:');
    console.log('═'.repeat(40));
    Object.entries(initialCounts).forEach(([collection, count]) => {
      console.log(`${collection}: ${count}`);
    });
    console.log('═'.repeat(40));
    
    const initialTotal = Object.values(initialCounts).reduce((sum, count) => sum + count, 0);
    console.log(`📊 Total inicial: ${initialTotal} documentos`);
    
    if (initialTotal === 0) {
      console.log('\n✨ La base de datos ya está vacía');
      return;
    }
    
    // Limpiar sin confirmación
    console.log('\n🧹 Iniciando limpieza FORZADA...');
    console.log('⚠️  ELIMINANDO TODOS LOS DATOS...');
    
    const deleteResults = {
      reviews: await Review.deleteMany({}),
      sales: await Sale.deleteMany({}),
      appointments: await Appointment.deleteMany({}),
      inventory: await Inventory.deleteMany({}),
      barbers: await Barber.deleteMany({}),
      services: await Service.deleteMany({}),
      users: await User.deleteMany({})
    };
    
    console.log('\n📋 Documentos eliminados:');
    console.log('═'.repeat(40));
    Object.entries(deleteResults).forEach(([collection, result]) => {
      console.log(`${collection}: ${result.deletedCount} eliminados`);
    });
    console.log('═'.repeat(40));
    
    const totalDeleted = Object.values(deleteResults).reduce((sum, result) => sum + result.deletedCount, 0);
    console.log(`🗑️  Total eliminados: ${totalDeleted} documentos`);
    
    // Verificar que esté vacía
    console.log('\n🔍 Verificando limpieza...');
    const finalCounts = {
      users: await User.countDocuments({}),
      barbers: await Barber.countDocuments({}),
      services: await Service.countDocuments({}),
      appointments: await Appointment.countDocuments({}),
      inventory: await Inventory.countDocuments({}),
      sales: await Sale.countDocuments({}),
      reviews: await Review.countDocuments({})
    };
    
    const finalTotal = Object.values(finalCounts).reduce((sum, count) => sum + count, 0);
    
    if (finalTotal === 0) {
      console.log('✅ ¡Base de datos completamente limpia!');
    } else {
      console.log(`⚠️  Aún quedan ${finalTotal} documentos`);
      Object.entries(finalCounts).forEach(([collection, count]) => {
        if (count > 0) {
          console.log(`  ${collection}: ${count} restantes`);
        }
      });
    }
    
    console.log('\n🎉 Proceso completado');
    console.log('💡 Para repoblar:');
    console.log('  - npm run seed (solo básicos)');
    console.log('  - npm run seed:inventory (solo inventario)');
    console.log('  - npm run superseed (completo)');
    
  } catch (error) {
    console.error('\n❌ Error durante el despoblado:', error.message);
    console.error('📍 Tipo de error:', error.name);
    
    if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Problema de conexión:');
      console.log('  1. ¿Está MongoDB ejecutándose?');
      console.log('  2. ¿Es correcta la MONGODB_URI en .env?');
      console.log('  3. ¿Hay problemas de red?');
    }
    
    console.error('\n📍 Stack completo:', error.stack);
    process.exit(1);
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
console.log('🎯 MODO FORZADO - Sin confirmación requerida');
despoblarForzado().catch(error => {
  console.error('💥 Error fatal:', error.message);
  process.exit(1);
});
