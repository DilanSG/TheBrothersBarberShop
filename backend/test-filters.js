import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Importar todos los modelos
import './src/models/User.js';
import './src/models/Service.js';
import Sale from './src/models/Sale.js';
import Appointment from './src/models/Appointment.js';
import Barber from './src/models/Barber.js';

dotenv.config();

async function testFilters() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    // Obtener barberos para testing
    const barbers = await Barber.find().populate('user');
    console.log('👥 Barberos encontrados:', barbers.length);
    
    if (barbers.length > 0) {
      const barberId = barbers[0]._id;
      console.log(`🧔 Probando con barbero: ${barbers[0].user?.name || barbers[0].specialty}`);
      console.log(`🆔 Barber ID: ${barberId}`);
      
      // Probar filtro GENERAL (sin fechas)
      console.log('\n🔍 === FILTRO GENERAL (sin fechas) ===');
      
      // Sales sin filtro de fecha
      const allSales = await Sale.find({
        barberId: barberId,
        status: 'completed'
      });
      console.log(`💰 Total ventas (barber ${barberId}):`, allSales.length);
      
      const salesTotal = allSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      console.log(`💵 Total dinero ventas: $${salesTotal}`);
      
      // Appointments sin filtro de fecha
      const allAppointments = await Appointment.find({
        barber: barberId,
        status: 'completed'
      });
      console.log(`📅 Total citas (barbero ${barberId}):`, allAppointments.length);
      
      const appointmentsTotal = allAppointments.reduce((sum, apt) => sum + apt.price, 0);
      console.log(`💵 Total dinero citas: $${appointmentsTotal}`);
      
      console.log(`💰 TOTAL GENERAL: $${salesTotal + appointmentsTotal}`);
      
      // Probar para TODOS los barberos (filtro General del frontend)
      console.log('\n🔍 === FILTRO GENERAL (TODOS LOS BARBEROS) ===');
      
      const allSalesGlobal = await Sale.find({ status: 'completed' });
      console.log(`💰 Total ventas globales:`, allSalesGlobal.length);
      
      const salesTotalGlobal = allSalesGlobal.reduce((sum, sale) => sum + sale.totalAmount, 0);
      console.log(`💵 Total dinero ventas globales: $${salesTotalGlobal}`);
      
      const allAppointmentsGlobal = await Appointment.find({ status: 'completed' });
      console.log(`📅 Total citas globales:`, allAppointmentsGlobal.length);
      
      const appointmentsTotalGlobal = allAppointmentsGlobal.reduce((sum, apt) => sum + apt.price, 0);
      console.log(`💵 Total dinero citas globales: $${appointmentsTotalGlobal}`);
      
      console.log(`💰 TOTAL GENERAL GLOBAL: $${salesTotalGlobal + appointmentsTotalGlobal}`);
      
      // Verificar distribución por barbero
      console.log('\n🔍 === DISTRIBUCIÓN POR BARBERO ===');
      for (const barber of barbers) {
        const barberSales = await Sale.find({ barberId: barber._id, status: 'completed' });
        const barberAppointments = await Appointment.find({ barber: barber._id, status: 'completed' });
        
        const barberSalesTotal = barberSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const barberAppointmentsTotal = barberAppointments.reduce((sum, apt) => sum + apt.price, 0);
        
        console.log(`👤 ${barber.user?.name || barber.specialty}:`);
        console.log(`   💰 Ventas: ${barberSales.length} ($${barberSalesTotal})`);
        console.log(`   📅 Citas: ${barberAppointments.length} ($${barberAppointmentsTotal})`);
        console.log(`   💵 Total: $${barberSalesTotal + barberAppointmentsTotal}`);
      }
    }
    
    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testFilters();
