/**
 * VERIFICAR IDs DE BARBEROS EN DATOS DE TESTING VS FRONTEND
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import Sale from '../models/Sale.js';
import Appointment from '../models/Appointment.js';
import Barber from '../models/Barber.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '../../.env') });

async function verifyBarberIds() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Conectado a MongoDB');
    
    console.log('\n👨‍💼 VERIFICACIÓN DE IDs DE BARBEROS');
    console.log('='.repeat(60));
    
    // Obtener todos los barberos activos
    const activeBarbers = await Barber.find({ isActive: true })
      .populate('user', 'name email');
    
    console.log('\n📋 BARBEROS ACTIVOS EN EL SISTEMA:');
    activeBarbers.forEach((barber, index) => {
      console.log(`${index + 1}. ID: ${barber._id}`);
      console.log(`   Nombre: ${barber.user?.name || 'Sin nombre'}`);
      console.log(`   Email: ${barber.user?.email || 'Sin email'}`);
      console.log(`   Especialidad: ${barber.specialty}`);
      console.log('');
    });
    
    // Verificar qué barberos tienen datos de testing
    const testingSalesBarbers = await Sale.aggregate([
      {
        $match: {
          notes: { $regex: /STRATEGIC_TEST/ }
        }
      },
      {
        $group: {
          _id: '$barberId',
          barberName: { $first: '$barberName' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    console.log('\n💰 BARBEROS CON DATOS DE TESTING (VENTAS):');
    testingSalesBarbers.forEach((barber, index) => {
      console.log(`${index + 1}. ID: ${barber._id}`);
      console.log(`   Nombre en datos: ${barber.barberName}`);
      console.log(`   Ventas de testing: ${barber.count}`);
      
      // Verificar si este ID está en barberos activos
      const isActive = activeBarbers.find(active => active._id.toString() === barber._id.toString());
      console.log(`   ¿Está en barberos activos? ${isActive ? '✅ SÍ' : '❌ NO'}`);
      console.log('');
    });
    
    // Verificar datos de testing para hoy específicamente
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endToday = new Date();
    endToday.setHours(23, 59, 59, 999);
    
    const todayTestingSales = await Sale.find({
      notes: { $regex: /STRATEGIC_TEST/ },
      saleDate: { $gte: today, $lte: endToday }
    }).select('barberId barberName totalAmount saleDate notes');
    
    console.log('\n📅 VENTAS DE TESTING PARA HOY:');
    todayTestingSales.forEach((sale, index) => {
      console.log(`${index + 1}. Barbero ID: ${sale.barberId}`);
      console.log(`   Nombre: ${sale.barberName}`);
      console.log(`   Monto: $${sale.totalAmount.toLocaleString()}`);
      console.log(`   Fecha: ${sale.saleDate.toLocaleString()}`);
      
      // Verificar si este barbero está activo
      const isActive = activeBarbers.find(active => active._id.toString() === sale.barberId.toString());
      console.log(`   ¿Barbero activo? ${isActive ? '✅ SÍ' : '❌ NO'}`);
      console.log('');
    });
    
    // IDs que aparecen en los logs del backend (del frontend)
    const frontendBarberIds = [
      '68c78565f9bfe4d76bf97629',
      '68c78565f9bfe4d76bf9762a', 
      '68c78565f9bfe4d76bf9762b',
      '68c829e18a152d7a0091dab4',
      '68c829e28a152d7a0091dab7'
    ];
    
    console.log('\n🖥️ IDs QUE CONSULTA EL FRONTEND:');
    frontendBarberIds.forEach((id, index) => {
      console.log(`${index + 1}. ${id}`);
      
      // Verificar si hay datos de testing para este ID
      const hasTestingData = testingSalesBarbers.find(barber => barber._id.toString() === id);
      console.log(`   ¿Tiene datos de testing? ${hasTestingData ? `✅ SÍ (${hasTestingData.count} ventas)` : '❌ NO'}`);
      
      // Verificar si está en barberos activos
      const isActive = activeBarbers.find(active => active._id.toString() === id);
      console.log(`   ¿Está activo? ${isActive ? '✅ SÍ' : '❌ NO'}`);
      console.log('');
    });
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verifyBarberIds();
