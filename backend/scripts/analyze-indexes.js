/**
 * 📊 MongoDB Query Performance Analyzer
 * Analiza y sugiere índices para optimizar queries frecuentes
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { logger } from '../src/shared/utils/logger.js';

dotenv.config();

// Queries comunes del sistema
const COMMON_QUERIES = {
  sales: [
    { barber: 1, date: -1 }, // Ventas por barbero ordenadas por fecha
    { date: 1, status: 1 }, // Ventas por fecha y estado
    { 'products.product': 1 }, // Ventas con producto específico
    { client: 1, date: -1 }, // Historial de cliente
  ],
  appointments: [
    { barber: 1, date: 1, status: 1 }, // Citas por barbero y fecha
    { client: 1, date: -1 }, // Historial de citas de cliente
    { date: 1, status: 1 }, // Citas del día por estado
    { status: 1, date: 1 }, // Citas pendientes/confirmadas
  ],
  products: [
    { category: 1, isActive: 1 }, // Productos por categoría activos
    { stock: 1, minStock: 1 }, // Productos con stock bajo
    { barcode: 1 }, // Búsqueda por código de barras
  ],
  expenses: [
    { date: -1 }, // Gastos ordenados por fecha
    { category: 1, date: -1 }, // Gastos por categoría
    { isRecurring: 1, nextDate: 1 }, // Gastos recurrentes próximos
  ],
  barbers: [
    { user: 1 }, // Lookup por usuario
    { isActive: 1, totalSales: -1 }, // Barberos activos ordenados por ventas
  ],
  users: [
    { email: 1 }, // Login por email
    { role: 1, isActive: 1 }, // Usuarios por rol activos
  ]
};

// Índices recomendados
const RECOMMENDED_INDEXES = {
  Sale: [
    { fields: { barber: 1, date: -1 }, options: { name: 'barber_date_desc' } },
    { fields: { date: 1, status: 1 }, options: { name: 'date_status' } },
    { fields: { client: 1, date: -1 }, options: { name: 'client_history' } },
    { fields: { 'products.product': 1 }, options: { name: 'products_lookup', sparse: true } },
  ],
  Appointment: [
    { fields: { barber: 1, date: 1, status: 1 }, options: { name: 'barber_schedule' } },
    { fields: { client: 1, date: -1 }, options: { name: 'client_appointments' } },
    { fields: { date: 1, status: 1 }, options: { name: 'daily_schedule' } },
  ],
  Product: [
    { fields: { category: 1, isActive: 1 }, options: { name: 'category_active' } },
    { fields: { barcode: 1 }, options: { name: 'barcode_unique', unique: true, sparse: true } },
    { fields: { stock: 1, minStock: 1, isActive: 1 }, options: { name: 'stock_alert' } },
  ],
  Expense: [
    { fields: { date: -1 }, options: { name: 'date_desc' } },
    { fields: { category: 1, date: -1 }, options: { name: 'category_history' } },
    { fields: { isRecurring: 1, nextDate: 1 }, options: { name: 'recurring_schedule' } },
  ],
  Barber: [
    { fields: { user: 1 }, options: { name: 'user_lookup', unique: true } },
    { fields: { isActive: 1, totalSales: -1 }, options: { name: 'active_performance' } },
  ],
  User: [
    { fields: { email: 1 }, options: { name: 'email_unique', unique: true } },
    { fields: { role: 1, isActive: 1 }, options: { name: 'role_active' } },
  ]
};

async function analyzeIndexes() {
  try {
    logger.info('🔍 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('✅ Conexión establecida');

    const collections = Object.keys(RECOMMENDED_INDEXES);
    const analysis = {};

    for (const collectionName of collections) {
      logger.info(`\n📊 Analizando colección: ${collectionName}`);
      
      try {
        const collection = mongoose.connection.db.collection(collectionName.toLowerCase() + 's');
        
        // Obtener índices existentes
        const existingIndexes = await collection.indexes();
        logger.info(`  Índices existentes: ${existingIndexes.length}`);
        
        // Obtener estadísticas de la colección
        let stats;
        try {
          stats = await collection.stats();
        } catch (err) {
          // Si no se puede obtener stats, usar valores por defecto
          stats = {
            count: await collection.countDocuments(),
            size: 0,
            avgObjSize: 0
          };
        }
        
        logger.info(`  Documentos: ${stats.count?.toLocaleString() || 0}`);
        if (stats.size) {
          logger.info(`  Tamaño: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        }
        
        // Comparar con índices recomendados
        const recommended = RECOMMENDED_INDEXES[collectionName];
        const missing = [];
        
        for (const rec of recommended) {
          const exists = existingIndexes.some(idx => {
            const keys = Object.keys(rec.fields);
            const idxKeys = Object.keys(idx.key).filter(k => k !== '_id');
            return keys.every(k => idxKeys.includes(k));
          });
          
          if (!exists) {
            missing.push(rec);
          }
        }
        
        analysis[collectionName] = {
          collection: collection.collectionName,
          stats: {
            documents: stats.count || 0,
            size: stats.size ? `${(stats.size / 1024 / 1024).toFixed(2)} MB` : 'N/A',
            avgDocSize: stats.avgObjSize ? `${stats.avgObjSize} bytes` : 'N/A'
          },
          existingIndexes: existingIndexes.map(idx => ({
            name: idx.name,
            keys: idx.key,
            unique: idx.unique || false
          })),
          missingIndexes: missing.length,
          recommended: missing.map(idx => ({
            fields: idx.fields,
            options: idx.options
          }))
        };
        
        if (missing.length > 0) {
          logger.warn(`  ⚠️  Faltan ${missing.length} índices recomendados`);
        } else {
          logger.info(`  ✅ Todos los índices recomendados están presentes`);
        }
        
      } catch (error) {
        logger.error(`  ❌ Error analizando ${collectionName}:`, { error: error.message });
        analysis[collectionName] = { error: error.message };
      }
    }

    // Generar reporte
    console.log('\n' + '='.repeat(60));
    console.log('📊 REPORTE DE OPTIMIZACIÓN DE ÍNDICES');
    console.log('='.repeat(60));
    
    let totalMissing = 0;
    for (const [name, data] of Object.entries(analysis)) {
      if (data.error) continue;
      
      console.log(`\n${name}:`);
      console.log(`  Documentos: ${data.stats.documents}`);
      console.log(`  Tamaño: ${data.stats.size}`);
      console.log(`  Índices existentes: ${data.existingIndexes.length}`);
      
      if (data.missingIndexes > 0) {
        totalMissing += data.missingIndexes;
        console.log(`  ⚠️  Índices faltantes: ${data.missingIndexes}`);
        console.log(`  Recomendados:`);
        data.recommended.forEach(idx => {
          console.log(`    - ${JSON.stringify(idx.fields)} (${idx.options.name})`);
        });
      } else {
        console.log(`  ✅ Optimizado`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`Total índices faltantes: ${totalMissing}`);
    
    if (totalMissing > 0) {
      console.log('\n💡 Ejecuta: node backend/scripts/create-indexes.js');
    } else {
      console.log('\n✅ Todas las colecciones están optimizadas');
    }
    console.log('='.repeat(60));

    await mongoose.connection.close();
    logger.info('\n✅ Análisis completado');
    
  } catch (error) {
    logger.error('❌ Error en análisis:', error);
    process.exit(1);
  }
}

analyzeIndexes();
