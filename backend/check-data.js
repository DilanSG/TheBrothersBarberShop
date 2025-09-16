import mongoose from 'mongoose';
import Sale from './src/models/Sale.js';
import Appointment from './src/models/Appointment.js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

console.log('🔍 Verificando datos en la base de datos...');

async function checkData() {
  try {
    console.log('🔗 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Verificar ventas
    const salesCount = await Sale.countDocuments();
    console.log(`📊 Total de ventas: ${salesCount}`);
    
    if (salesCount > 0) {
      const recentSales = await Sale.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('total items createdAt paymentMethod');
      
      console.log('📋 Últimas 5 ventas:');
      recentSales.forEach((sale, index) => {
        console.log(`  ${index + 1}. Total: $${sale.total} - Items: ${sale.items?.length || 0} - Fecha: ${sale.createdAt.toISOString().split('T')[0]} - Pago: ${sale.paymentMethod}`);
      });
    }
    
    // Verificar citas completadas
    const completedAppointments = await Appointment.countDocuments({ status: 'completed' });
    console.log(`📅 Citas completadas: ${completedAppointments}`);
    
    // Verificar en período específico (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentSalesCount = await Sale.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    console.log(`📈 Ventas de los últimos 30 días: ${recentSalesCount}`);
    
    if (recentSalesCount > 0) {
      const totalRevenue = await Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' },
            count: { $sum: 1 }
          }
        }
      ]);
      
      console.log(`💰 Ingresos últimos 30 días: $${totalRevenue[0]?.totalRevenue || 0}`);
    }
    
    await mongoose.connection.close();
    console.log('✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error verificando datos:', error);
    process.exit(1);
  }
}

checkData();