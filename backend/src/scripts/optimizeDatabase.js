#!/usr/bin/env node

/**
 * Script de Optimización de Base de Datos
 * Crea índices optimizados para mejorar el rendimiento de consultas de reportes
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

async function createOptimizedIndexes() {
  try {
    console.log('🚀 Iniciando optimización de base de datos...');
    
    // Conectar a la base de datos usando variable de entorno directamente
    const mongoUrl = process.env.MONGODB_URI || process.env.DB_CONNECTION_STRING;
    if (!mongoUrl) {
      throw new Error('MONGODB_URI no está definido en las variables de entorno');
    }
    
    await mongoose.connect(mongoUrl);
    console.log('✅ Conectado a MongoDB');

    // Obtener las colecciones
    const db = mongoose.connection.db;
    
    console.log('\n📊 Creando índices para reportes de ventas...');
    
    // Índices para Sales (reportes detallados)
    await db.collection('sales').createIndex(
      { 
        barber: 1, 
        saleDate: 1, 
        status: 1 
      },
      { 
        name: 'sales_barber_date_status_idx',
        background: true
      }
    );
    console.log('✅ Índice sales_barber_date_status_idx creado');

    // Índice para ventas walk-in
    await db.collection('sales').createIndex(
      { 
        barber: 1, 
        saleDate: 1, 
        isWalkIn: 1, 
        status: 1 
      },
      { 
        name: 'sales_walkin_barber_date_idx',
        background: true
      }
    );
    console.log('✅ Índice sales_walkin_barber_date_idx creado');

    // Índice compuesto para ventas con productos
    await db.collection('sales').createIndex(
      { 
        barber: 1, 
        saleDate: 1, 
        'items.product': 1,
        status: 1 
      },
      { 
        name: 'sales_products_barber_date_idx',
        background: true,
        sparse: true
      }
    );
    console.log('✅ Índice sales_products_barber_date_idx creado');

    console.log('\n📅 Creando índices para reportes de citas...');

    // Índices para Appointments (reportes detallados)
    await db.collection('appointments').createIndex(
      { 
        barber: 1, 
        date: 1, 
        status: 1 
      },
      { 
        name: 'appointments_barber_date_status_idx',
        background: true
      }
    );
    console.log('✅ Índice appointments_barber_date_status_idx creado');

    // Índice para citas completadas
    await db.collection('appointments').createIndex(
      { 
        barber: 1, 
        date: 1, 
        status: 1,
        'services.service': 1
      },
      { 
        name: 'appointments_completed_services_idx',
        background: true,
        partialFilterExpression: { status: 'completed' }
      }
    );
    console.log('✅ Índice appointments_completed_services_idx creado');

    console.log('\n🏪 Creando índices para inventario...');

    // Índices para Inventory (productos en ventas)
    await db.collection('inventories').createIndex(
      { 
        isActive: 1, 
        category: 1, 
        name: 1 
      },
      { 
        name: 'inventory_active_category_name_idx',
        background: true
      }
    );
    console.log('✅ Índice inventory_active_category_name_idx creado');

    console.log('\n👨‍💼 Creando índices para barberos...');

    // Índices para Barbers (consultas de reportes)
    await db.collection('barbers').createIndex(
      { 
        user: 1, 
        available: 1 
      },
      { 
        name: 'barbers_user_available_idx',
        background: true
      }
    );
    console.log('✅ Índice barbers_user_available_idx creado');

    console.log('\n🔧 Creando índices para servicios...');

    // Índices para Services
    await db.collection('services').createIndex(
      { 
        isActive: 1, 
        category: 1, 
        price: 1 
      },
      { 
        name: 'services_active_category_price_idx',
        background: true
      }
    );
    console.log('✅ Índice services_active_category_price_idx creado');

    console.log('\n📈 Creando índices de agregación temporal...');

    // Índices para consultas de agregación por fecha
    try {
      await db.collection('sales').createIndex(
        { 
          saleDate: 1 
        },
        { 
          name: 'sales_date_aggregation_idx',
          background: true
        }
      );
      console.log('✅ Índice sales_date_aggregation_idx creado');
    } catch (error) {
      if (error.code === 85) { // IndexOptionsConflict
        console.log('⚠️ Índice sales_date_aggregation_idx ya existe con diferente configuración');
      } else {
        throw error;
      }
    }

    try {
      await db.collection('appointments').createIndex(
        { 
          date: 1 
        },
        { 
          name: 'appointments_date_aggregation_idx',
          background: true
        }
      );
      console.log('✅ Índice appointments_date_aggregation_idx creado');
    } catch (error) {
      if (error.code === 85) { // IndexOptionsConflict
        console.log('⚠️ Índice appointments_date_aggregation_idx ya existe con diferente configuración');
      } else {
        throw error;
      }
    }

    console.log('\n📊 Verificando estadísticas de índices...');

    // Obtener estadísticas de las colecciones principales
    const collections = ['sales', 'appointments', 'inventories', 'barbers', 'services'];
    
    for (const collectionName of collections) {
      try {
        const stats = await db.collection(collectionName).stats();
        const indexes = await db.collection(collectionName).indexes();
        
        console.log(`\n📋 ${collectionName.toUpperCase()}:`);
        console.log(`   • Documentos: ${stats.count ? stats.count.toLocaleString() : 'N/A'}`);
        console.log(`   • Tamaño: ${stats.size ? (stats.size / 1024 / 1024).toFixed(2) : 'N/A'} MB`);
        console.log(`   • Índices: ${indexes.length}`);
        
        indexes.forEach(index => {
          console.log(`     - ${index.name}`);
        });
      } catch (error) {
        console.log(`\n📋 ${collectionName.toUpperCase()}:`);
        console.log(`   • Error obteniendo estadísticas: ${error.message}`);
        
        // Solo mostrar índices
        try {
          const indexes = await db.collection(collectionName).indexes();
          console.log(`   • Índices: ${indexes.length}`);
          indexes.forEach(index => {
            console.log(`     - ${index.name}`);
          });
        } catch (indexError) {
          console.log(`   • Error obteniendo índices: ${indexError.message}`);
        }
      }
    }

    console.log('\n🎉 ¡Optimización de base de datos completada exitosamente!');
    console.log('\n💡 Beneficios esperados:');
    console.log('   • Consultas de reportes 5-10x más rápidas');
    console.log('   • Menor uso de CPU en agregaciones');
    console.log('   • Mejor rendimiento en filtros por fecha');
    console.log('   • Optimización automática de consultas complejas');

  } catch (error) {
    console.error('❌ Error durante la optimización:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
    process.exit(0);
  }
}

// Ejecutar optimización
createOptimizedIndexes();
