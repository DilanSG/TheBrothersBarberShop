import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Importar modelos
import Appointment from './src/models/Appointment.js';
import Sale from './src/models/Sale.js';

dotenv.config();

async function verifyData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    // Contar citas
    const totalAppointments = await Appointment.countDocuments();
    console.log('📅 Total citas en BD:', totalAppointments);
    
    // Contar ventas  
    const totalSales = await Sale.countDocuments();
    console.log('💰 Total ventas en BD:', totalSales);
    
    // Ver todas las citas por estado
    const appointmentsByStatus = await Appointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } }
    ]);
    console.log('📊 Citas por estado:');
    appointmentsByStatus.forEach(group => {
      console.log(`  - ${group._id}: ${group.count} citas, $${group.total}`);
    });
    
    // Ver todas las ventas
    const salesTotal = await Sale.aggregate([
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$totalAmount' } } }
    ]);
    console.log('💵 Resumen ventas:', salesTotal);
    
    // Ver fechas recientes de citas
    const recentAppointments = await Appointment.find()
      .sort({ date: -1 })
      .limit(5);
    console.log('📅 Primeras 5 citas (estructura completa):');
    recentAppointments.forEach((apt, index) => {
      console.log(`  ${index + 1}.`, JSON.stringify(apt, null, 2));
    });
    
    // Ver fechas recientes de ventas
    const recentSales = await Sale.find()
      .sort({ date: -1 })
      .limit(5);
    console.log('💰 Primeras 5 ventas (estructura completa):');
    recentSales.forEach((sale, index) => {
      console.log(`  ${index + 1}.`, JSON.stringify(sale, null, 2));
    });
    
    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyData();
