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
 * Script para probar el endpoint de detailed-report y comparar con los datos esperados
 */

async function testDetailedSalesEndpoint() {
  try {
    console.log('\n🔍 PROBANDO ENDPOINT DE DETAILED SALES REPORT\n');

    // Obtener un barbero con datos de prueba
    const barber = await User.findOne({ 
      role: 'barber',
      'notes': { $regex: 'DATOS DE PRUEBA ESTRATEGICOS', $options: 'i' }
    }).select('_id name email');

    if (!barber) {
      console.log('❌ No se encontró barbero con datos de prueba');
      return;
    }

    console.log('👨‍💼 Barbero encontrado:', {
      id: barber._id,
      name: barber.name,
      email: barber.email
    });

    // Simular los diferentes filtros que se usan en el frontend
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const testCases = [
      {
        name: 'GENERAL',
        barberId: barber._id,
        startDate: null,
        endDate: null
      },
      {
        name: '1 DÍA (HOY)',
        barberId: barber._id,
        startDate: todayStr,
        endDate: todayStr
      },
      {
        name: '7 DÍAS',
        barberId: barber._id,
        startDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: todayStr
      },
      {
        name: '15 DÍAS',
        barberId: barber._id,
        startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: todayStr
      },
      {
        name: '30 DÍAS',
        barberId: barber._id,
        startDate: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: todayStr
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n📊 PROBANDO FILTRO: ${testCase.name}`);
      console.log('📅 Parámetros:', {
        barberId: testCase.barberId,
        startDate: testCase.startDate,
        endDate: testCase.endDate
      });

      // Simular la misma lógica que usa el controlador
      const matchStage = { barberId: testCase.barberId };
      
      if (testCase.startDate && testCase.endDate) {
        // Convertir fechas a UTC para comparación
        const startDateUTC = new Date(testCase.startDate + 'T00:00:00.000Z');
        const endDateUTC = new Date(testCase.endDate + 'T23:59:59.999Z');
        
        matchStage.createdAt = {
          $gte: startDateUTC,
          $lte: endDateUTC
        };
        
        console.log('🗓️ Filtro de fechas aplicado:', {
          startDateUTC: startDateUTC.toISOString(),
          endDateUTC: endDateUTC.toISOString()
        });
      }

      console.log('🔍 Query Match Stage:', matchStage);

      // Obtener datos agregados (similar al detailed-report endpoint)
      const pipeline = [
        { $match: matchStage },
        {
          $addFields: {
            dateOnly: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: { $dateFromString: { dateString: { $dateToString: { format: "%Y-%m-%dT%H:%M:%S.%LZ", date: "$createdAt" } } } },
                timezone: "America/Bogota"
              }
            }
          }
        },
        {
          $group: {
            _id: "$dateOnly",
            totalAmount: { $sum: "$totalAmount" },
            totalProducts: { $sum: "$totalQuantity" },
            transactionCount: { $sum: 1 },
            products: { $push: "$$ROOT" }
          }
        },
        {
          $project: {
            _id: 0,
            date: "$_id",
            totalAmount: 1,
            totalProducts: 1,
            transactionCount: 1,
            products: {
              $map: {
                input: "$products",
                as: "product",
                in: {
                  _id: "$$product._id",
                  productId: "$$product.productId",
                  productName: "$$product.productName",
                  quantity: "$$product.totalQuantity",
                  unitPrice: "$$product.unitPrice",
                  totalAmount: "$$product.totalAmount",
                  date: "$$product.createdAt"
                }
              }
            }
          }
        },
        { $sort: { date: -1 } }
      ];

      const salesData = await Sale.aggregate(pipeline);
      
      // Calcular totales
      const totalAmount = salesData.reduce((sum, day) => sum + (day.totalAmount || 0), 0);
      const totalProducts = salesData.reduce((sum, day) => sum + (day.totalProducts || 0), 0);
      const totalDays = salesData.length;

      console.log('📈 RESULTADOS DEL DETAILED REPORT:');
      console.log('   💰 Total Amount:', totalAmount);
      console.log('   📦 Total Products:', totalProducts);
      console.log('   📅 Días con ventas:', totalDays);
      
      if (salesData.length > 0) {
        console.log('📋 Días con datos:');
        salesData.slice(0, 3).forEach(day => {
          console.log(`   ${day.date}: $${day.totalAmount} (${day.totalProducts} productos, ${day.transactionCount} transacciones)`);
        });
        if (salesData.length > 3) {
          console.log(`   ... y ${salesData.length - 3} días más`);
        }
      } else {
        console.log('❌ No se encontraron datos para este filtro');
      }

      // Comparar con datos directos (sin agregación)
      const directSales = await Sale.find(matchStage).select('totalAmount totalQuantity createdAt productName');
      const directTotal = directSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const directProducts = directSales.reduce((sum, sale) => sum + sale.totalQuantity, 0);

      console.log('🔍 COMPARACIÓN CON DATOS DIRECTOS:');
      console.log('   💰 Direct Total:', directTotal, '| Aggregated Total:', totalAmount, '| Match:', directTotal === totalAmount ? '✅' : '❌');
      console.log('   📦 Direct Products:', directProducts, '| Aggregated Products:', totalProducts, '| Match:', directProducts === totalProducts ? '✅' : '❌');
      console.log('   📊 Direct Records:', directSales.length, '| Aggregated Days:', totalDays);

      console.log('\n' + '='.repeat(80));
    }

  } catch (error) {
    console.error('❌ Error en el test:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Ejecutar automáticamente
testDetailedSalesEndpoint();

export { testDetailedSalesEndpoint };
