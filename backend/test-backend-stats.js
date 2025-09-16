import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Importar todos los modelos y servicios
import './src/models/User.js';
import './src/models/Service.js';
import Sale from './src/models/Sale.js';
import Appointment from './src/models/Appointment.js';
import Barber from './src/models/Barber.js';

import SaleService from './src/services/saleService.js';
import AppointmentService from './src/services/appointmentService.js';

dotenv.config();

async function testBackendStats() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    // Obtener barberos
    const barbers = await Barber.find().populate('user');
    console.log('👥 Barberos encontrados:', barbers.length);
    
    console.log('\n🔍 === PROBANDO BACKEND SIN FILTROS DE FECHA ===');
    
    for (const barber of barbers) {
      console.log(`\n👤 Barbero: ${barber.user?.name || barber.specialty} (ID: ${barber._id})`);
      
      try {
        // Probar sin filtros (como filtro "General")
        const salesStats = await SaleService.getBarberSalesStats(barber._id, {});
        const appointmentStats = await AppointmentService.getBarberAppointmentStats(barber._id, {});
        
        console.log('💰 Sales Stats:', JSON.stringify(salesStats, null, 2));
        console.log('📅 Appointment Stats:', JSON.stringify(appointmentStats, null, 2));
        
        // Calcular totales
        const salesTotal = salesStats.total || 0;
        const appointmentsRevenue = appointmentStats.revenue || 0;
        
        console.log(`📊 Resumen: Ventas $${salesTotal} + Citas $${appointmentsRevenue} = $${salesTotal + appointmentsRevenue}`);
        
      } catch (error) {
        console.error(`❌ Error para barbero ${barber._id}:`, error.message);
      }
    }
    
    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testBackendStats();
