import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

// Importar modelos y configuración
import '../config/database.js';
import Sale from '../models/Sale.js';
import User from '../models/User.js';

/**
 * Script para verificar los datos de walk-ins en la base de datos
 */

async function verifyWalkInsData() {
  try {
    console.log('\n🔍 VERIFICANDO DATOS DE WALK-INS\n');

    // Obtener barberos con datos de prueba
    const barbers = await User.find({ 
      role: 'barber',
      'notes': { $regex: 'DATOS DE PRUEBA ESTRATEGICOS', $options: 'i' }
    }).select('_id name email');

    console.log(`👨‍💼 Barberos con datos de prueba encontrados: ${barbers.length}`);

    // Verificar walk-ins en total
    const totalWalkIns = await Sale.countDocuments({ type: 'walkIn' });
    console.log(`✂️ Total de walk-ins en la base de datos: ${totalWalkIns}`);

    // Verificar walk-ins por barbero
    for (const barber of barbers) {
      console.log(`\n👤 BARBERO: ${barber.name} (${barber._id})`);
      
      const barberWalkIns = await Sale.find({ 
        barberId: barber._id, 
        type: 'walkIn' 
      }).populate('serviceId', 'name price');
      
      console.log(`   ✂️ Walk-ins totales: ${barberWalkIns.length}`);
      
      if (barberWalkIns.length > 0) {
        console.log(`   📅 Fechas de walk-ins:`);
        barberWalkIns.slice(0, 3).forEach(walkIn => {
          console.log(`      ${walkIn.saleDate?.toISOString()?.split('T')[0] || 'Sin fecha'}: ${walkIn.serviceName} - $${walkIn.totalAmount}`);
        });
        if (barberWalkIns.length > 3) {
          console.log(`      ... y ${barberWalkIns.length - 3} más`);
        }
      } else {
        console.log(`   ❌ No hay walk-ins para este barbero`);
      }
    }

    // Verificar si hay walk-ins para hoy
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    console.log(`\n📅 WALK-INS PARA HOY (${todayStr}):`);
    
    for (const barber of barbers) {
      const todayWalkIns = await Sale.find({
        barberId: barber._id,
        type: 'walkIn',
        saleDate: {
          $gte: new Date(todayStr + 'T00:00:00.000-05:00'),
          $lte: new Date(todayStr + 'T23:59:59.999-05:00')
        }
      });
      
      console.log(`   ${barber.name}: ${todayWalkIns.length} walk-ins`);
    }

  } catch (error) {
    console.error('❌ Error verificando walk-ins:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Ejecutar automáticamente
verifyWalkInsData();

export { verifyWalkInsData };
