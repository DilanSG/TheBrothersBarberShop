import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

import SaleService from '../services/saleService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__dirname);

config({ path: join(__dirname, '../../.env') });

async function testBarberSalesStats() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Conectado a MongoDB\n');

    // Obtener stats para Miguel González (que tenía la discrepancia)
    const barberId = '68c78565f9bfe4d76bf9762a'; // ID de Miguel González
    
    console.log('🧪 PROBANDO NUEVO saleService.getBarberSalesStats...');
    console.log('='.repeat(80));
    
    // Sin filtros (todos los datos)
    const allStats = await SaleService.getBarberSalesStats(barberId);
    console.log('\n📊 STATS SIN FILTROS (todos los datos):');
    console.log(JSON.stringify(allStats, null, 2));
    
    // Con filtro de HOY
    const todayStats = await SaleService.getBarberSalesStats(barberId, {
      date: '2025-09-15'
    });
    console.log('\n📅 STATS PARA HOY (15/9/2025):');
    console.log(JSON.stringify(todayStats, null, 2));

    console.log('\n🎯 RESUMEN DE VALIDACIÓN:');
    console.log('='.repeat(80));
    console.log(`Total general:`);
    console.log(`  - Transacciones: ${allStats.count}`);
    console.log(`  - Productos: ${allStats.totalQuantity}`);
    console.log(`  - Dinero: $${allStats.total.toLocaleString()}`);
    
    console.log(`\nHOY:`);
    console.log(`  - Transacciones: ${todayStats.count}`);
    console.log(`  - Productos: ${todayStats.totalQuantity}`);
    console.log(`  - Dinero: $${todayStats.total.toLocaleString()}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

testBarberSalesStats();
