import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Import models
import Sale from '../models/Sale.js';
import Appointment from '../models/Appointment.js';
import Service from '../models/Service.js';
import Barber from '../models/Barber.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '../../.env') });

async function analyzeAppointments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Conectado a MongoDB\n');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endToday = new Date();
    endToday.setHours(23, 59, 59, 999);

    // Buscar todas las citas de testing de HOY
    const todayAppointments = await Appointment.find({
      date: { $gte: today, $lte: endToday },
      notes: { $regex: /STRATEGIC_TEST.*HOY/ }
    }).populate('service', 'name price duration')
      .populate('barber', 'user')
      .populate('user', 'name');

    console.log(`📅 CITAS DE HOY ENCONTRADAS: ${todayAppointments.length}`);
    console.log('='.repeat(60));

    let totalCitasValue = 0;
    const barberTotals = {};

    for (let i = 0; i < todayAppointments.length; i++) {
      const apt = todayAppointments[i];
      
      // Obtener información del barbero
      let barberName = 'N/A';
      if (apt.barber && apt.barber.user) {
        const barberUser = await User.findById(apt.barber.user);
        barberName = barberUser ? barberUser.name : 'N/A';
      }
      
      const serviceName = apt.service?.name || 'N/A';
      const servicePrice = apt.service?.price || 0;
      const aptPrice = apt.price || servicePrice;
      
      console.log(`${i + 1}. BARBERO: ${barberName}`);
      console.log(`   Servicio: ${serviceName}`);
      console.log(`   Precio en appointment: $${apt.price?.toLocaleString() || 'N/A'}`);
      console.log(`   Precio en servicio: $${servicePrice?.toLocaleString() || 'N/A'}`);
      console.log(`   Precio final: $${aptPrice.toLocaleString()}`);
      console.log(`   Fecha: ${apt.date.toLocaleString()}`);
      console.log(`   Status: ${apt.status}`);
      console.log(`   Notas: ${apt.notes}`);
      console.log('   ' + '-'.repeat(50));

      // Acumular totales por barbero
      if (!barberTotals[barberName]) {
        barberTotals[barberName] = { count: 0, total: 0 };
      }
      barberTotals[barberName].count++;
      barberTotals[barberName].total += aptPrice;
      totalCitasValue += aptPrice;
    }

    console.log('\n💰 RESUMEN POR BARBERO (CITAS HOY):');
    console.log('='.repeat(60));
    Object.entries(barberTotals).forEach(([barber, data]) => {
      console.log(`${barber}:`);
      console.log(`   Cantidad: ${data.count} citas`);
      console.log(`   Total: $${data.total.toLocaleString()}`);
      console.log(`   Promedio por cita: $${Math.round(data.total / data.count).toLocaleString()}`);
      console.log('   ---');
    });

    console.log(`\n🎯 TOTAL GENERAL:`);
    console.log(`   Citas: ${todayAppointments.length}`);
    console.log(`   Valor total: $${totalCitasValue.toLocaleString()}`);
    
    if (todayAppointments.length > 0) {
      console.log(`   Promedio por cita: $${Math.round(totalCitasValue / todayAppointments.length).toLocaleString()}`);
    }

    // Verificar servicios disponibles
    console.log('\n🛠️ SERVICIOS DISPONIBLES:');
    console.log('='.repeat(60));
    const services = await Service.find({});
    services.forEach((service, i) => {
      console.log(`${i + 1}. ${service.name} - $${service.price.toLocaleString()} (${service.duration}min)`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

analyzeAppointments();
