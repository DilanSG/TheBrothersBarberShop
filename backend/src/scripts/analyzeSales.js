import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Import models
import Sale from '../models/Sale.js';
import Service from '../models/Service.js';
import Barber from '../models/Barber.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '../../.env') });

async function analyzeSales() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Conectado a MongoDB\n');

    // Buscar todas las ventas de testing para un barbero específico (el que muestra la discrepancia)
    const testSales = await Sale.find({
      notes: { $regex: /STRATEGIC_TEST/ }
    }).populate('barberId', 'user').sort({ saleDate: -1 });

    console.log(`📊 TOTAL VENTAS DE TESTING ENCONTRADAS: ${testSales.length}`);
    console.log('='.repeat(80));

    // Agrupar por barbero
    const salesByBarber = {};
    let totalProductsAll = 0;
    let totalAmountAll = 0;

    testSales.forEach(sale => {
      const barberName = sale.barberName || 'N/A';
      
      if (!salesByBarber[barberName]) {
        salesByBarber[barberName] = {
          count: 0,
          totalAmount: 0,
          totalQuantity: 0,
          sales: []
        };
      }
      
      salesByBarber[barberName].count++;
      salesByBarber[barberName].totalAmount += sale.totalAmount || 0;
      salesByBarber[barberName].totalQuantity += sale.quantity || 0;
      salesByBarber[barberName].sales.push(sale);
      
      totalProductsAll += sale.quantity || 0;
      totalAmountAll += sale.totalAmount || 0;
    });

    console.log('💰 RESUMEN POR BARBERO (TODAS LAS VENTAS):');
    console.log('='.repeat(80));
    
    Object.entries(salesByBarber).forEach(([barber, data]) => {
      console.log(`${barber}:`);
      console.log(`   Ventas registradas: ${data.count}`);
      console.log(`   Productos totales: ${data.totalQuantity}`);
      console.log(`   Monto total: $${data.totalAmount.toLocaleString()}`);
      console.log(`   Promedio por venta: $${Math.round(data.totalAmount / data.count).toLocaleString()}`);
      
      // Mostrar algunas ventas de ejemplo
      console.log(`   Ejemplos de ventas:`);
      data.sales.slice(0, 3).forEach((sale, i) => {
        console.log(`     ${i+1}. ${sale.productName} - Cant: ${sale.quantity} - $${sale.totalAmount.toLocaleString()} - ${sale.saleDate.toLocaleDateString()}`);
      });
      
      console.log('   ' + '-'.repeat(50));
    });

    console.log(`\n🎯 TOTALES GENERALES:`);
    console.log(`   Total ventas: ${testSales.length}`);
    console.log(`   Total productos: ${totalProductsAll}`);
    console.log(`   Total dinero: $${totalAmountAll.toLocaleString()}`);

    // Verificar ventas para el barbero que muestra la discrepancia (probablemente el primero)
    const firstBarber = Object.keys(salesByBarber)[0];
    if (firstBarber) {
      console.log(`\n🔍 ANÁLISIS DETALLADO PARA ${firstBarber}:`);
      console.log('='.repeat(80));
      
      const barberData = salesByBarber[firstBarber];
      console.log(`Total de ventas individuales: ${barberData.count}`);
      console.log(`Total de productos (suma de quantities): ${barberData.totalQuantity}`);
      console.log(`Total en dinero: $${barberData.totalAmount.toLocaleString()}`);
      
      console.log(`\nPRIMERAS 10 VENTAS EN DETALLE:`);
      barberData.sales.slice(0, 10).forEach((sale, i) => {
        console.log(`${i+1}. Producto: ${sale.productName}`);
        console.log(`   Cantidad: ${sale.quantity} unidades`);
        console.log(`   Precio unitario: $${sale.unitPrice?.toLocaleString() || 'N/A'}`);
        console.log(`   Total: $${sale.totalAmount.toLocaleString()}`);
        console.log(`   Fecha: ${sale.saleDate.toLocaleString()}`);
        console.log(`   Notas: ${sale.notes}`);
        console.log(`   ---`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

analyzeSales();
