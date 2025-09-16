const { connectDB, disconnectDB } = require('./config/database');
const Appointment = require('./models/Appointment');

async function checkTodayAppointments() {
  try {
    await connectDB();
    console.log('🔗 Conectado a MongoDB\n');

    // Ver citas de testing de HOY
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = await Appointment.find({
      notes: { $regex: /STRATEGIC_TEST.*HOY/ },
      date: { $gte: today, $lt: tomorrow }
    }).populate('service', 'name price').populate('barber', 'user').populate('user', 'name');

    console.log(`📅 CITAS DE HOY ENCONTRADAS: ${todayAppointments.length}`);
    
    let totalCitas = 0;
    const barberTotals = {};
    
    todayAppointments.forEach((apt, i) => {
      const barberName = apt.barber?.user?.name || 'N/A';
      const price = apt.price || apt.service?.price || 0;
      console.log(`${i+1}. ${barberName} - ${apt.service?.name} - $${price.toLocaleString()}`);
      console.log(`   Fecha: ${apt.date}`);
      console.log(`   Status: ${apt.status}`);
      console.log(`   ---`);
      
      if (!barberTotals[barberName]) {
        barberTotals[barberName] = { count: 0, total: 0 };
      }
      barberTotals[barberName].count++;
      barberTotals[barberName].total += price;
      totalCitas += price;
    });

    console.log('\n💰 TOTALES POR BARBERO (HOY):');
    Object.entries(barberTotals).forEach(([barber, data]) => {
      console.log(`${barber}: ${data.count} citas = $${data.total.toLocaleString()}`);
    });
    
    console.log(`\nTOTAL GENERAL CITAS HOY: $${totalCitas.toLocaleString()}`);
    
    // Contar todas las citas de testing (no solo HOY)
    const allTestAppointments = await Appointment.find({
      notes: { $regex: /STRATEGIC_TEST/ }
    });
    
    console.log(`\nTOTAL CITAS DE TESTING: ${allTestAppointments.length}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await disconnectDB();
  }
}

checkTodayAppointments();
