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

async function checkSaleStructure() {
  try {
    console.log('\n📊 VERIFICANDO ESTRUCTURA DE VENTAS\n');

    // Obtener una venta de Carlos Martínez
    const sale = await Sale.findOne({
      barberId: '68c78565f9bfe4d76bf97629',
      notes: { $regex: 'STRATEGIC_TEST' }
    });

    if (!sale) {
      console.log('❌ No se encontró venta de prueba');
      return;
    }

    console.log('📋 ESTRUCTURA DE UNA VENTA:');
    console.log(JSON.stringify(sale, null, 2));

    console.log('\n🔍 CAMPOS DE FECHA DISPONIBLES:');
    console.log('createdAt:', sale.createdAt);
    console.log('saleDate:', sale.saleDate);
    console.log('updatedAt:', sale.updatedAt);

    // Verificar todas las ventas de hoy para este barbero
    const today = new Date('2025-09-15');
    const tomorrow = new Date('2025-09-16');

    console.log('\n📅 VENTAS DE HOY USANDO createdAt:');
    const salesByCreatedAt = await Sale.find({
      barberId: '68c78565f9bfe4d76bf97629',
      createdAt: { $gte: today, $lt: tomorrow }
    });
    console.log(`Encontradas: ${salesByCreatedAt.length}`);

    console.log('\n📅 VENTAS DE HOY USANDO saleDate:');
    const salesBySaleDate = await Sale.find({
      barberId: '68c78565f9bfe4d76bf97629',
      saleDate: { $gte: today, $lt: tomorrow }
    });
    console.log(`Encontradas: ${salesBySaleDate.length}`);

    // Mostrar fechas de las primeras ventas
    if (salesByCreatedAt.length > 0) {
      console.log('\n🔍 COMPARACIÓN DE FECHAS:');
      salesByCreatedAt.slice(0, 3).forEach((sale, i) => {
        console.log(`Venta ${i + 1}:`);
        console.log(`  createdAt: ${sale.createdAt}`);
        console.log(`  saleDate: ${sale.saleDate}`);
        console.log(`  totalAmount: ${sale.totalAmount}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkSaleStructure();
