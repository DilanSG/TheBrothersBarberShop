import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Service from '../models/Service.js';
import Appointment from '../models/Appointment.js';

dotenv.config();

async function checkAppointmentData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Conectado a MongoDB\n');

    // Ver servicios disponibles
    console.log('🔍 SERVICIOS DISPONIBLES:');
    const services = await Service.find({}).select('name price duration');
    services.forEach((service, i) => {
      console.log(`${i+1}. ${service.name} - $${service.price.toLocaleString()} (duración: ${service.duration}min)`);
    });

    console.log('\n📅 CITAS DE TESTING GENERADAS:');
    
    // Ver citas de testing de HOY
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = await Appointment.find({
      notes: { $regex: /STRATEGIC_TEST.*HOY/ },
      date: { $gte: today, $lt: tomorrow }
    }).populate('service', 'name price').populate('barber', 'user').populate('user', 'name');

    console.log(`\nCitas de HOY encontradas: ${todayAppointments.length}`);
    
    todayAppointments.forEach((apt, i) => {
      console.log(`${i+1}. Barbero: ${apt.barber?.user?.name || 'N/A'}`);
      console.log(`   Servicio: ${apt.service?.name || 'N/A'} - $${apt.price?.toLocaleString() || apt.service?.price?.toLocaleString() || 'N/A'}`);
      console.log(`   Cliente: ${apt.user?.name || 'N/A'}`);
      console.log(`   Fecha: ${apt.date}`);
      console.log(`   Status: ${apt.status}`);
      console.log(`   Notas: ${apt.notes}`);
      console.log('   ---');
    });

    // Ver totales por barbero para HOY
    console.log('\n💰 TOTALES POR BARBERO (HOY):');
    const barberTotals = {};
    
    todayAppointments.forEach(apt => {
      const barberName = apt.barber?.user?.name || 'N/A';
      const price = apt.price || apt.service?.price || 0;
      
      if (!barberTotals[barberName]) {
        barberTotals[barberName] = { count: 0, total: 0 };
      }
      barberTotals[barberName].count++;
      barberTotals[barberName].total += price;
    });

    Object.entries(barberTotals).forEach(([barber, data]) => {
      console.log(`${barber}: ${data.count} citas = $${data.total.toLocaleString()}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

checkAppointmentData();
