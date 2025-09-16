/**
 * SCRIPT DE LIMPIEZA DE DATOS DE TESTING
 * 
 * Elimina todos los datos generados por strategicBarberDebug.js
 * sin afectar datos reales del sistema
 */

import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

import Sale from '../models/Sale.js';
import Appointment from '../models/Appointment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '../../.env') });

class TestDataCleaner {
  async connect() {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('🔗 Conectado a MongoDB para limpieza');
    } catch (error) {
      console.error('❌ Error conectando:', error);
      process.exit(1);
    }
  }

  async disconnect() {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }

  async cleanTestData() {
    console.log('🧹 LIMPIANDO DATOS DE TESTING...');
    console.log('='.repeat(50));

    try {
      // Eliminar ventas de testing
      const salesResult = await Sale.deleteMany({
        notes: { $regex: /STRATEGIC_TEST|DEBUG_TEST/ }
      });

      // Eliminar citas de testing
      const appointmentsResult = await Appointment.deleteMany({
        notes: { $regex: /STRATEGIC_TEST|DEBUG_TEST/ }
      });

      console.log(`✅ Eliminadas ${salesResult.deletedCount} ventas de testing`);
      console.log(`✅ Eliminadas ${appointmentsResult.deletedCount} citas de testing`);

      if (salesResult.deletedCount === 0 && appointmentsResult.deletedCount === 0) {
        console.log('ℹ️ No se encontraron datos de testing para eliminar');
      } else {
        console.log('\n🎉 Limpieza completada exitosamente');
        console.log('✨ La base de datos está lista para producción');
      }

      return {
        salesDeleted: salesResult.deletedCount,
        appointmentsDeleted: appointmentsResult.deletedCount
      };

    } catch (error) {
      console.error('❌ Error durante la limpieza:', error);
      throw error;
    }
  }

  async run() {
    try {
      await this.connect();
      const result = await this.cleanTestData();
      return result;
    } catch (error) {
      console.error('❌ Error en limpieza:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const cleaner = new TestDataCleaner();
  cleaner.run()
    .then(result => {
      console.log('\nResumen de limpieza:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

export default TestDataCleaner;
