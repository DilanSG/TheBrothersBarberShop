/**
 * VERIFICAR TIMEZONE DE DATOS DE TESTING
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import Sale from '../models/Sale.js';
import Appointment from '../models/Appointment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '../../.env') });

async function verifyTimezones() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Conectado a MongoDB');
    
    console.log('\n🕐 VERIFICACIÓN DE TIMEZONES');
    console.log('='.repeat(50));
    
    // Verificar datos de testing actuales
    const testingSales = await Sale.find({
      notes: { $regex: /STRATEGIC_TEST/ }
    }).sort({ saleDate: -1 }).limit(5);
    
    console.log('\n📊 VENTAS DE TESTING (últimas 5):');
    testingSales.forEach((sale, index) => {
      console.log(`${index + 1}. ${sale.saleDate.toISOString()} | ${sale.saleDate.toString()}`);
      console.log(`   Local: ${sale.saleDate.toLocaleDateString()} ${sale.saleDate.toLocaleTimeString()}`);
      console.log(`   Notes: ${sale.notes}`);
      console.log('');
    });
    
    // Verificar qué fecha busca el backend para HOY
    const now = new Date();
    console.log('\n🔍 COMPARACIÓN CON FILTROS DEL BACKEND:');
    console.log(`Fecha actual del sistema: ${now.toISOString()}`);
    console.log(`Fecha local: ${now.toString()}`);
    
    // Simular lo que hace el backend para filtro diario
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    
    console.log(`\nRango que busca el backend para HOY:`);
    console.log(`Inicio: ${startOfDay.toISOString()}`);
    console.log(`Fin: ${endOfDay.toISOString()}`);
    
    // Verificar si hay datos en ese rango
    const salesInRange = await Sale.countDocuments({
      notes: { $regex: /STRATEGIC_TEST/ },
      saleDate: { $gte: startOfDay, $lte: endOfDay }
    });
    
    console.log(`\n✅ VENTAS DE TESTING EN RANGO DE HOY: ${salesInRange}`);
    
    if (salesInRange === 0) {
      console.log('\n❌ PROBLEMA CONFIRMADO: No hay datos de testing en el rango de hoy');
      console.log('🔧 SOLUCIÓN: Regenerar datos con timezone correcto');
    } else {
      console.log('\n✅ Los datos están en el rango correcto');
    }
    
    // Verificar timezone del sistema
    console.log(`\n🌍 TIMEZONE DEL SISTEMA:`);
    console.log(`Offset: ${now.getTimezoneOffset()} minutos`);
    console.log(`Zona: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verifyTimezones();
