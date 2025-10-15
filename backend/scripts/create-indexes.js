/**
 * 🚀 MongoDB Index Creator
 * Crea índices compuestos optimizados para queries frecuentes
 * 
 * IMPORTANTE: Los índices mejoran performance pero ocupan espacio.
 * Solo crear índices para queries realmente frecuentes.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { logger } from '../src/shared/utils/logger.js';

// Importar modelos para aplicar índices
import Sale from '../src/core/domain/entities/Sale.js';
import Appointment from '../src/core/domain/entities/Appointment.js';
import Product from '../src/core/domain/entities/Product.js';
import Expense from '../src/core/domain/entities/Expense.js';
import Barber from '../src/core/domain/entities/Barber.js';
import User from '../src/core/domain/entities/User.js';

dotenv.config();

const INDEXES_TO_CREATE = {
  Sale: [
    { 
      fields: { barber: 1, date: -1 }, 
      options: { 
        name: 'barber_date_desc',
        background: true 
      },
      reason: 'Query frecuente: Ventas de barbero ordenadas por fecha (reportes diarios/mensuales)'
    },
    { 
      fields: { date: 1, status: 1 }, 
      options: { 
        name: 'date_status',
        background: true 
      },
      reason: 'Query frecuente: Ventas del día filtradas por estado (dashboard)'
    },
    { 
      fields: { client: 1, date: -1 }, 
      options: { 
        name: 'client_history',
        background: true,
        sparse: true // Solo documentos con cliente
      },
      reason: 'Query frecuente: Historial de compras del cliente'
    },
  ],
  
  Appointment: [
    { 
      fields: { barber: 1, date: 1, status: 1 }, 
      options: { 
        name: 'barber_schedule',
        background: true 
      },
      reason: 'Query crítica: Agenda del barbero filtrada por estado (evitar doble reserva)'
    },
    { 
      fields: { client: 1, date: -1 }, 
      options: { 
        name: 'client_appointments',
        background: true 
      },
      reason: 'Query frecuente: Historial de citas del cliente'
    },
    { 
      fields: { date: 1, status: 1 }, 
      options: { 
        name: 'daily_schedule',
        background: true 
      },
      reason: 'Query frecuente: Vista general de citas del día'
    },
  ],
  
  Product: [
    { 
      fields: { category: 1, isActive: 1 }, 
      options: { 
        name: 'category_active',
        background: true 
      },
      reason: 'Query frecuente: Productos por categoría activos (inventario)'
    },
    { 
      fields: { stock: 1, minStock: 1, isActive: 1 }, 
      options: { 
        name: 'stock_alert',
        background: true 
      },
      reason: 'Query frecuente: Alertas de stock bajo (dashboard)'
    },
  ],
  
  Expense: [
    { 
      fields: { date: -1 }, 
      options: { 
        name: 'date_desc',
        background: true 
      },
      reason: 'Query frecuente: Gastos ordenados por fecha (reportes)'
    },
    { 
      fields: { category: 1, date: -1 }, 
      options: { 
        name: 'category_history',
        background: true 
      },
      reason: 'Query frecuente: Gastos por categoría (análisis financiero)'
    },
    { 
      fields: { isRecurring: 1, nextDate: 1 }, 
      options: { 
        name: 'recurring_schedule',
        background: true 
      },
      reason: 'Query crítica: Gastos recurrentes próximos (cron job)'
    },
  ],
  
  Barber: [
    { 
      fields: { isActive: 1, totalSales: -1 }, 
      options: { 
        name: 'active_performance',
        background: true 
      },
      reason: 'Query frecuente: Ranking de barberos activos (reportes)'
    },
  ],
  
  User: [
    { 
      fields: { role: 1, isActive: 1 }, 
      options: { 
        name: 'role_active',
        background: true 
      },
      reason: 'Query frecuente: Usuarios por rol activos (gestión de acceso)'
    },
  ]
};

const MODELS = { Sale, Appointment, Product, Expense, Barber, User };

async function createIndexes() {
  try {
    logger.info('🔍 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('✅ Conexión establecida\n');

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const [modelName, indexes] of Object.entries(INDEXES_TO_CREATE)) {
      logger.info(`📊 Procesando modelo: ${modelName}`);
      const Model = MODELS[modelName];
      
      if (!Model) {
        logger.error(`  ❌ Modelo no encontrado: ${modelName}`);
        errors++;
        continue;
      }

      for (const indexDef of indexes) {
        const { fields, options, reason } = indexDef;
        
        try {
          // Verificar si el índice ya existe
          const existingIndexes = await Model.collection.indexes();
          const exists = existingIndexes.some(idx => idx.name === options.name);
          
          if (exists) {
            logger.info(`  ⏭️  Índice ya existe: ${options.name}`);
            skipped++;
            continue;
          }
          
          // Crear el índice
          logger.info(`  🔨 Creando: ${options.name}`);
          logger.info(`     Campos: ${JSON.stringify(fields)}`);
          logger.info(`     Razón: ${reason}`);
          
          await Model.collection.createIndex(fields, options);
          
          logger.info(`  ✅ Creado exitosamente\n`);
          created++;
          
        } catch (error) {
          logger.error(`  ❌ Error creando ${options.name}:`, error.message);
          errors++;
        }
      }
    }

    // Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE CREACIÓN DE ÍNDICES');
    console.log('='.repeat(60));
    console.log(`✅ Creados: ${created}`);
    console.log(`⏭️  Omitidos (ya existían): ${skipped}`);
    console.log(`❌ Errores: ${errors}`);
    console.log('='.repeat(60));
    
    if (created > 0) {
      console.log('\n💡 IMPORTANTE:');
      console.log('  - Los índices se crean en background (no bloquean operaciones)');
      console.log('  - Monitorear performance con: db.collection.getIndexes()');
      console.log('  - Analizar queries lentas: db.collection.explain("executionStats")');
    }

    await mongoose.connection.close();
    logger.info('\n✅ Proceso completado');
    
  } catch (error) {
    logger.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

createIndexes();
