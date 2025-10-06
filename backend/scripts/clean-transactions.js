/**
 * Script de limpieza rápida de transacciones
 * Elimina solo datos de transacciones manteniendo usuarios, barberos, servicios e inventario
 * Versión actualizada para el sistema de población
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Importar modelos
import Appointment from '../src/core/domain/entities/Appointment.js';
import Sale from '../src/core/domain/entities/Sale.js';
import Expense from '../src/core/domain/entities/Expense.js';
import Review from '../src/core/domain/entities/Review.js';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m'
};

const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

async function cleanTransactions() {
  try {
    log('🧹 Iniciando limpieza de transacciones...', colors.cyan);
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI no encontrado en variables de entorno');
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    log('✅ Conectado a la base de datos', colors.green);
    
    // Eliminar todas las transacciones
    const results = await Promise.all([
      Appointment.deleteMany({}),
      Sale.deleteMany({}),
      Expense.deleteMany({}),
      Review.deleteMany({})
    ]);
    
    log(`✅ Citas eliminadas: ${results[0].deletedCount}`, colors.green);
    log(`✅ Ventas eliminadas: ${results[1].deletedCount}`, colors.green);
    log(`✅ Gastos eliminados: ${results[2].deletedCount}`, colors.green);
    log(`✅ Reviews eliminadas: ${results[3].deletedCount}`, colors.green);
    
    log('🎉 Limpieza completada exitosamente', colors.green);
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, colors.red);
  } finally {
    await mongoose.connection.close();
    log('ℹ️  Conexión cerrada', colors.cyan);
  }
}

cleanTransactions();