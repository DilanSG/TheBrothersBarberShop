// Script para verificar ventas en la base de datos
import mongoose from 'mongoose';

// Importar modelo
const saleSchema = new mongoose.Schema({
  barber: { type: mongoose.Schema.Types.ObjectId, ref: 'Barber', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }
  }],
  total: { type: Number, required: true, min: 0 },
  notes: { type: String },
  saleDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'completed' }
}, { 
  timestamps: true, 
  collection: 'sales' 
});

const Sale = mongoose.model('Sale', saleSchema);

const checkSalesData = async () => {
  try {
    console.log('🔍 Conectando a la base de datos...');
    await mongoose.connect('mongodb://localhost:27017/thebrothersdb');
    
    const totalSales = await Sale.countDocuments();
    console.log(`📊 Total de ventas en DB: ${totalSales}`);
    
    const completedSales = await Sale.countDocuments({ status: 'completed' });
    console.log(`✅ Ventas completadas: ${completedSales}`);
    
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const recentSales = await Sale.countDocuments({
      status: 'completed',
      saleDate: { $gte: thirtyDaysAgo, $lte: today }
    });
    console.log(`📅 Ventas completadas últimos 30 días: ${recentSales}`);
    
    if (totalSales > 0) {
      const latestSales = await Sale.find().sort({ saleDate: -1 }).limit(3);
      console.log('🔍 Últimas 3 ventas:');
      latestSales.forEach((sale, i) => {
        console.log(`  ${i + 1}. Fecha: ${sale.saleDate.toISOString().split('T')[0]}, Total: $${sale.total}, Status: ${sale.status}`);
      });
    }
    
    await mongoose.disconnect();
    console.log('✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkSalesData();
