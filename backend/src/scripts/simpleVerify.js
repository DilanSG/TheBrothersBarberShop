/**
 * VERIFICACIÓN SIMPLE DE DATOS DE DEBUG
 * 
 * Script simplificado para verificar rápidamente que los datos
 * generados por strategicBarberDebug.js están en la base de datos
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

class SimpleVerifier {
  async connect() {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('🔗 Conectado a MongoDB');
    } catch (error) {
      console.error('❌ Error conectando:', error);
      process.exit(1);
    }
  }

  async disconnect() {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }

  async verifyData() {
    console.log('\n🔍 VERIFICACIÓN SIMPLE DE DATOS DE DEBUG');
    console.log('='.repeat(50));

    const now = new Date();
    
    // Verificar datos de hoy
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const endToday = new Date(now);
    endToday.setHours(23, 59, 59, 999);

    const todaySales = await Sale.countDocuments({
      saleDate: { $gte: today, $lte: endToday },
      notes: { $regex: /STRATEGIC_TEST/ }
    });

    const todayAppointments = await Appointment.countDocuments({
      date: { $gte: today, $lte: endToday },
      notes: { $regex: /STRATEGIC_TEST/ }
    });

    // DETALLES DE LAS CITAS DE HOY
    console.log('\n📅 ANÁLISIS DETALLADO DE CITAS HOY:');
    const todayAppointmentsDetails = await Appointment.find({
      date: { $gte: today, $lte: endToday },
      notes: { $regex: /STRATEGIC_TEST/ }
    }).populate('service', 'name price').populate('barber', 'user').populate('user', 'name');

    console.log(`Total citas HOY: ${todayAppointmentsDetails.length}`);
    
    let totalCitasValue = 0;
    const barberCitasCount = {};
    
    todayAppointmentsDetails.forEach((apt, i) => {
      const barberName = apt.barber?.user?.name || 'Barbero N/A';
      const serviceName = apt.service?.name || 'Servicio N/A';
      const price = apt.price || apt.service?.price || 0;
      
      console.log(`${i+1}. ${barberName} - ${serviceName} - $${price.toLocaleString()}`);
      console.log(`   Fecha: ${apt.date.toLocaleString()}`);
      console.log(`   Status: ${apt.status}`);
      console.log(`   ---`);
      
      if (!barberCitasCount[barberName]) {
        barberCitasCount[barberName] = { count: 0, total: 0 };
      }
      barberCitasCount[barberName].count++;
      barberCitasCount[barberName].total += price;
      totalCitasValue += price;
    });

    console.log('\n💰 RESUMEN POR BARBERO (CITAS HOY):');
    Object.entries(barberCitasCount).forEach(([barber, data]) => {
      console.log(`${barber}: ${data.count} citas = $${data.total.toLocaleString()}`);
    });
    
    console.log(`\nTOTAL VALOR CITAS HOY: $${totalCitasValue.toLocaleString()}`);
    console.log(`CANTIDAD CITAS HOY: ${todayAppointmentsDetails.length}`);

    // Continuar con el resto de verificaciones...
      notes: { $regex: /STRATEGIC_TEST/ }
    });

    const todayAppointments = await Appointment.countDocuments({
      date: { $gte: today, $lte: endToday },
      notes: { $regex: /STRATEGIC_TEST/ }
    });

    console.log(`📅 HOY (${today.toLocaleDateString()}):`);
    console.log(`   Ventas: ${todaySales} (esperado: 5)`);
    console.log(`   Citas: ${todayAppointments} (esperado: 3)`);
    console.log(`   Status: ${todaySales === 5 && todayAppointments === 3 ? '✅' : '⚠️'}`);

    // Verificar datos de última semana
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);

    const weekSales = await Sale.countDocuments({
      saleDate: { $gte: weekAgo, $lte: endToday },
      notes: { $regex: /STRATEGIC_TEST/ }
    });

    const weekAppointments = await Appointment.countDocuments({
      date: { $gte: weekAgo, $lte: endToday },
      notes: { $regex: /STRATEGIC_TEST/ }
    });

    console.log(`\n📅 ÚLTIMA SEMANA (7 días):`);
    console.log(`   Ventas: ${weekSales} (esperado: ~21)`);
    console.log(`   Citas: ${weekAppointments} (esperado: ~14)`);
    console.log(`   Status: ${Math.abs(weekSales - 21) <= 2 && Math.abs(weekAppointments - 14) <= 2 ? '✅' : '⚠️'}`);

    // Verificar datos totales de testing
    const totalSales = await Sale.countDocuments({
      notes: { $regex: /STRATEGIC_TEST/ }
    });

    const totalAppointments = await Appointment.countDocuments({
      notes: { $regex: /STRATEGIC_TEST/ }
    });

    console.log(`\n📅 TOTAL DATOS DE TESTING:`);
    console.log(`   Ventas: ${totalSales} (esperado: ~90)`);
    console.log(`   Citas: ${totalAppointments} (esperado: ~60)`);
    console.log(`   Status: ${Math.abs(totalSales - 90) <= 5 && Math.abs(totalAppointments - 60) <= 5 ? '✅' : '⚠️'}`);

    // Verificar distribución por barberos
    const salesByBarber = await Sale.aggregate([
      {
        $match: {
          notes: { $regex: /STRATEGIC_TEST/ }
        }
      },
      {
        $group: {
          _id: '$barberName',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    console.log(`\n👨‍💼 DISTRIBUCIÓN POR BARBEROS:`);
    salesByBarber.forEach((barber, index) => {
      console.log(`   ${index + 1}. ${barber._id}: ${barber.count} ventas, $${barber.revenue.toLocaleString()}`);
    });

    // Resumen final
    const allGood = (
      todaySales === 5 && 
      todayAppointments === 3 && 
      Math.abs(weekSales - 21) <= 2 && 
      Math.abs(weekAppointments - 14) <= 2 &&
      salesByBarber.length > 0
    );

    console.log(`\n${allGood ? '🎉' : '⚠️'} RESULTADO: ${allGood ? 'DATOS OK - LISTOS PARA TESTING' : 'REVISAR DATOS'}`);

    if (allGood) {
      console.log('\n📋 PRÓXIMOS PASOS:');
      console.log('1. Ve al frontend Admin/Barberos');
      console.log('2. Prueba los filtros temporales (1, 7, 15, 30 días)');
      console.log('3. Verifica que los números coincidan');
      console.log('4. Prueba filtros por barbero individual');
      console.log('5. Cuando termines: node cleanTestData.js');
    } else {
      console.log('\n🔧 POSIBLES PROBLEMAS:');
      console.log('- Ejecuta nuevamente: node strategicBarberDebug.js');
      console.log('- Verifica la conexión a MongoDB');
      console.log('- Revisa que existan barberos y servicios activos');
    }

    return allGood;
  }

  async run() {
    try {
      await this.connect();
      const result = await this.verifyData();
      return result;
    } catch (error) {
      console.error('❌ Error en verificación:', error);
      return false;
    } finally {
      await this.disconnect();
    }
  }
}

// Ejecutar si se llama directamente
if (process.argv[1] && process.argv[1].endsWith('simpleVerify.js')) {
  const verifier = new SimpleVerifier();
  verifier.run()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}

export default SimpleVerifier;
