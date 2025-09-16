import mongoose from 'mongoose';
import InventoryLog from './src/models/InventoryLog.js';
import { config } from './src/config/index.js';

(async () => {
  try {
    await mongoose.connect(config.database.uri);
    console.log('📊 Conectado a MongoDB');
    
    // Obtener todas las acciones únicas
    const actions = await InventoryLog.distinct('action');
    console.log('🎯 Acciones encontradas en la DB:', actions);
    
    // Contar logs por acción
    const actionCounts = await InventoryLog.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    console.log('📈 Conteo por acción:', actionCounts);
    
    // Mostrar los últimos 10 logs
    const recentLogs = await InventoryLog.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select('action itemName message reason notes createdAt');
    console.log('📋 Últimos 10 logs:');
    recentLogs.forEach((log, i) => {
      console.log(`  ${i+1}. ${log.action} - ${log.itemName} - ${log.message || log.reason || 'Sin mensaje'} (${log.createdAt.toLocaleString()})`);
    });
    
    // Verificar si hay logs de ventas
    const salesLogs = await InventoryLog.find({ action: 'sale' }).limit(3);
    console.log('💰 Logs de ventas:', salesLogs.length);
    if (salesLogs.length > 0) {
      console.log('💰 Ejemplo de log de venta:', {
        action: salesLogs[0].action,
        message: salesLogs[0].message,
        totalAmount: salesLogs[0].totalAmount,
        details: salesLogs[0].details
      });
    }
    
    // Verificar si hay logs de movimientos
    const movementLogs = await InventoryLog.find({ 
      action: { $in: ['movement_entry', 'movement_exit'] } 
    }).limit(3);
    console.log('📦 Logs de movimientos:', movementLogs.length);
    if (movementLogs.length > 0) {
      console.log('📦 Ejemplo de log de movimiento:', {
        action: movementLogs[0].action,
        message: movementLogs[0].message,
        reason: movementLogs[0].reason,
        quantity: movementLogs[0].quantity
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
