import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

import SaleService from '../services/saleService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__dirname);

config({ path: join(__dirname, '../../.env') });

async function testDetailedReport() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Conectado a MongoDB\n');

    const barberId = '68c78565f9bfe4d76bf9762a'; // Miguel González
    
    console.log('🧪 PROBANDO ENDPOINT DE REPORTE DETALLADO...');
    console.log('='.repeat(80));
    
    // Sin filtros (todos los datos) - como en "General"
    console.log('\n📊 1. REPORTE SIN FILTROS (General):');
    const allReport = await SaleService.getDetailedSalesReport(barberId);
    const totalProductsAll = allReport.reduce((sum, day) => sum + (day.totalProducts || 0), 0);
    const totalAmountAll = allReport.reduce((sum, day) => sum + (day.totalAmount || 0), 0);
    console.log(`Total días: ${allReport.length}`);
    console.log(`Total productos: ${totalProductsAll}`);
    console.log(`Total dinero: $${totalAmountAll.toLocaleString()}`);
    
    // Con filtro de HOY - como en "1 día"
    console.log('\n📅 2. REPORTE PARA HOY (1 día):');
    const todayReport = await SaleService.getDetailedSalesReport(barberId, '2025-09-15', '2025-09-15');
    const totalProductsToday = todayReport.reduce((sum, day) => sum + (day.totalProducts || 0), 0);
    const totalAmountToday = todayReport.reduce((sum, day) => sum + (day.totalAmount || 0), 0);
    console.log(`Total días: ${todayReport.length}`);
    console.log(`Total productos: ${totalProductsToday}`);
    console.log(`Total dinero: $${totalAmountToday.toLocaleString()}`);
    
    // Con filtro de 7 días
    console.log('\n📅 3. REPORTE PARA 7 DÍAS:');
    const weekReport = await SaleService.getDetailedSalesReport(barberId, '2025-09-09', '2025-09-15');
    const totalProductsWeek = weekReport.reduce((sum, day) => sum + (day.totalProducts || 0), 0);
    const totalAmountWeek = weekReport.reduce((sum, day) => sum + (day.totalAmount || 0), 0);
    console.log(`Total días: ${weekReport.length}`);
    console.log(`Total productos: ${totalProductsWeek}`);
    console.log(`Total dinero: $${totalAmountWeek.toLocaleString()}`);

    console.log('\n🎯 RESUMEN COMPARATIVO:');
    console.log('='.repeat(80));
    console.log('Período        | Productos | Dinero');
    console.log('---------------|-----------|---------------');
    console.log(`General        | ${totalProductsAll.toString().padStart(9)} | $${totalAmountAll.toLocaleString().padStart(12)}`);
    console.log(`1 día          | ${totalProductsToday.toString().padStart(9)} | $${totalAmountToday.toLocaleString().padStart(12)}`);
    console.log(`7 días         | ${totalProductsWeek.toString().padStart(9)} | $${totalAmountWeek.toLocaleString().padStart(12)}`);

    // Mostrar algunos ejemplos de datos
    if (todayReport.length > 0) {
      console.log('\n📋 EJEMPLO DE DATOS DE HOY:');
      console.log(JSON.stringify(todayReport[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

testDetailedReport();
