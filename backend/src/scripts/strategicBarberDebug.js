/**
 * SCRIPT DE DEBUG ESTRATÉGICO PARA ADMIN/BARBEROS
 * 
 * Este script genera datos específicos para probar todas las funcionalidades
 * de reportes y filtros temporales (1, 7, 15, 30 días)
 * 
 * PATRÓN DE DATOS GENERADOS:
 * - Datos estratégicos con fechas específicas conocidas
 * - Cantidades exactas para verificar cálculos
 * - Distribución por barberos para probar filtros
 * - Casos edge para validar lógica de negocio
 */

import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Modelos
import User from '../models/User.js';
import Barber from '../models/Barber.js';
import Service from '../models/Service.js';
import Inventory from '../models/Inventory.js';
import Sale from '../models/Sale.js';
import Appointment from '../models/Appointment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
config({ path: join(__dirname, '../../.env') });

const DEBUG_PATTERNS = {
  // Patrones de datos conocidos para testing
  DAILY: {
    description: "Datos del último día (hoy)",
    sales: 5,
    appointments: 3,
    expectedRevenue: 15000, // 5 ventas * 3000 promedio
    expectedCuts: 3
  },
  WEEKLY: {
    description: "Datos de los últimos 7 días",
    sales: 21, // 3 por día
    appointments: 14, // 2 por día
    expectedRevenue: 63000,
    expectedCuts: 14
  },
  BIWEEKLY: {
    description: "Datos de los últimos 15 días", 
    sales: 45, // 3 por día
    appointments: 30, // 2 por día
    expectedRevenue: 135000,
    expectedCuts: 30
  },
  MONTHLY: {
    description: "Datos de los últimos 30 días",
    sales: 90, // 3 por día
    appointments: 60, // 2 por día  
    expectedRevenue: 270000,
    expectedCuts: 60
  }
};

class BarberDebugger {
  constructor() {
    this.testUsers = [];
    this.testBarbers = [];
    this.testServices = [];
    this.testProducts = [];
    this.generatedData = {
      sales: [],
      appointments: []
    };
  }

  async connect() {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('🔗 Conectado a MongoDB');
    } catch (error) {
      console.error('❌ Error conectando a MongoDB:', error);
      process.exit(1);
    }
  }

  async disconnect() {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }

  /**
   * PASO 1: Obtener datos existentes (NO crear usuarios)
   */
  async loadExistingData() {
    console.log('\n📋 Cargando datos existentes...');
    
    // Cargar barberos existentes
    this.testBarbers = await Barber.find({ isActive: true })
      .populate('user', 'name email')
      .limit(3); // Tomar máximo 3 barberos para testing

    if (this.testBarbers.length === 0) {
      throw new Error('❌ No se encontraron barberos activos. Primero crea barberos en el sistema.');
    }

    console.log(`✅ Barberos encontrados: ${this.testBarbers.length}`);
    this.testBarbers.forEach((barber, index) => {
      const barberName = barber.user?.name || `Barbero ${index + 1}`;
      console.log(`   ${index + 1}. ${barberName} (${barber.user?.email || 'Sin email'})`);
    });

    // Cargar servicios existentes
    this.testServices = await Service.find({ isActive: true }).limit(5);
    if (this.testServices.length === 0) {
      throw new Error('❌ No se encontraron servicios activos.');
    }

    console.log(`✅ Servicios encontrados: ${this.testServices.length}`);
    this.testServices.forEach((service, index) => {
      console.log(`   ${index + 1}. ${service.name} - $${service.price}`);
    });

    // Cargar productos de inventario existentes
    this.testProducts = await Inventory.find({ 
      stock: { $gt: 0 },
      isActive: true 
    }).limit(10);

    if (this.testProducts.length === 0) {
      console.log('⚠️ No se encontraron productos con stock. Saltando ventas de productos.');
    } else {
      console.log(`✅ Productos encontrados: ${this.testProducts.length}`);
      this.testProducts.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} - $${product.price} (Stock: ${product.stock})`);
      });
    }

    // Cargar algunos usuarios existentes para citas
    this.testUsers = await User.find({ 
      role: 'user',
      isActive: true 
    }).limit(10);

    if (this.testUsers.length === 0) {
      throw new Error('❌ No se encontraron usuarios activos para crear citas.');
    }

    console.log(`✅ Usuarios encontrados: ${this.testUsers.length}`);
  }

  /**
   * PASO 2: Limpiar datos de testing previos
   */
  async cleanPreviousTestData() {
    console.log('\n🧹 Limpiando datos de testing previos...');
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Eliminar ventas de testing (identificadas por notas específicas)
    const deletedSales = await Sale.deleteMany({
      $or: [
        { notes: { $regex: /DEBUG_TEST|STRATEGIC_TEST/ } },
        { notes: { $regex: /TEST DATA/ } }
      ],
      saleDate: { $gte: thirtyDaysAgo }
    });

    // Eliminar citas de testing
    const deletedAppointments = await Appointment.deleteMany({
      notes: { $regex: /DEBUG_TEST|STRATEGIC_TEST/ },
      date: { $gte: thirtyDaysAgo }
    });

    console.log(`✅ Eliminadas ${deletedSales.deletedCount} ventas de testing`);
    console.log(`✅ Eliminadas ${deletedAppointments.deletedCount} citas de testing`);
  }

  /**
   * PASO 3: Generar datos estratégicos por período
   */
  async generateStrategicData() {
    console.log('\n🎯 Generando datos estratégicos...');

    const now = new Date();
    const patterns = [];

    // Generar patrones de datos por cada día de los últimos 30 días
    for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() - daysAgo);
      
      // Determinar qué tipo de día es para el patrón
      let salesCount, appointmentsCount;
      
      if (daysAgo === 0) {
        // HOY: Datos específicos para prueba diaria
        salesCount = 5;
        appointmentsCount = 3;
      } else if (daysAgo >= 1 && daysAgo <= 6) {
        // DÍAS 1-6: Para completar semana (21 total - 5 de hoy = 16 / 6 días = 2.67)
        // Alternamos entre 2 y 3 para llegar exacto
        salesCount = (daysAgo % 2 === 1) ? 3 : 2; // días impares=3, pares=2
        appointmentsCount = (daysAgo % 2 === 1) ? 2 : 1; // días impares=2, pares=1
      } else if (daysAgo >= 7 && daysAgo <= 14) {
        // DÍAS 7-14: Para completar quincena (45 total - 21 de semana = 24 / 8 días = 3)
        salesCount = 3;
        appointmentsCount = 2;
      } else {
        // DÍAS 15-29: Para completar mes (90 total - 45 de quincena = 45 / 15 días = 3)
        salesCount = 3;
        appointmentsCount = 2;
      }

      await this.generateDayData(targetDate, salesCount, appointmentsCount, daysAgo);
    }

    console.log(`✅ Datos generados para 30 días`);
  }

  /**
   * Generar datos para un día específico
   */
  async generateDayData(date, salesCount, appointmentsCount, daysAgo) {
    const dayLabel = daysAgo === 0 ? 'HOY' : `${daysAgo} días atrás`;
    
    // GENERAR VENTAS - DISTRIBUIDAS ENTRE TODOS LOS BARBEROS
    if (this.testProducts.length > 0) {
      for (let i = 0; i < salesCount; i++) {
        // Distribuir entre barberos: cada venta va a un barbero diferente
        const barberIndex = i % this.testBarbers.length;
        const selectedBarber = this.testBarbers[barberIndex];
        
        const product = this.testProducts[i % this.testProducts.length];
        const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 productos
        
        const saleDate = new Date(date);
        saleDate.setHours(9 + (i * 2), Math.floor(Math.random() * 60), 0, 0);

        const sale = new Sale({
          productId: product._id,
          productName: product.name,
          type: 'product',
          quantity: quantity,
          unitPrice: product.price,
          totalAmount: quantity * product.price,
          barberId: selectedBarber._id,
          barberName: selectedBarber.user?.name || `Barbero ${barberIndex + 1}`,
          customerName: `Cliente Test ${daysAgo}-${i}`,
          saleDate: saleDate,
          status: 'completed',
          paymentMethod: ['cash', 'card', 'transfer'][i % 3],
          notes: `STRATEGIC_TEST_${dayLabel}_VENTA_${i + 1}`
        });

        await sale.save();
        this.generatedData.sales.push(sale);
      }
    }

    // GENERAR WALK-INS (CORTES) - DISTRIBUIDOS ENTRE TODOS LOS BARBEROS
    const walkInsCount = Math.max(1, Math.floor(salesCount * 0.6)); // 60% de las ventas como walk-ins
    for (let i = 0; i < walkInsCount; i++) {
      // Distribuir entre barberos: cada walk-in va a un barbero diferente
      const barberIndex = i % this.testBarbers.length;
      const selectedBarber = this.testBarbers[barberIndex];
      
      // Usar un servicio existente para el walk-in
      const service = this.testServices[i % this.testServices.length];
      
      const walkInDate = new Date(date);
      walkInDate.setHours(11 + (i * 2), Math.floor(Math.random() * 60), 0, 0);

      const walkIn = new Sale({
        type: 'walkIn',
        serviceId: service._id,
        serviceName: service.name,
        quantity: 1,
        unitPrice: service.price,
        totalAmount: service.price,
        barberId: selectedBarber._id,
        barberName: selectedBarber.user?.name || `Barbero ${barberIndex + 1}`,
        customerName: `Cliente Walk-in ${daysAgo}-${i}`,
        saleDate: walkInDate,
        status: 'completed',
        paymentMethod: ['cash', 'card'][i % 2],
        notes: `STRATEGIC_TEST_${dayLabel}_WALKIN_${i + 1}`
      });

      await walkIn.save();
      this.generatedData.sales.push(walkIn);
    }

    // GENERAR CITAS COMPLETADAS - DISTRIBUIDAS ENTRE TODOS LOS BARBEROS
    for (let i = 0; i < appointmentsCount; i++) {
      // Distribuir entre barberos: cada cita va a un barbero diferente
      const barberIndex = i % this.testBarbers.length;
      const selectedBarber = this.testBarbers[barberIndex];
      
      const service = this.testServices[i % this.testServices.length];
      const user = this.testUsers[i % this.testUsers.length];
      
      const appointmentDate = new Date(date);
      appointmentDate.setHours(10 + (i * 2), 0, 0, 0);

      const appointment = new Appointment({
        user: user._id,
        barber: selectedBarber._id,
        service: service._id,
        date: appointmentDate,
        duration: service.duration || 60,
        status: 'completed',
        price: service.price,
        notes: `STRATEGIC_TEST_${dayLabel}_CITA_${i + 1}`
      });

      await appointment.save();
      this.generatedData.appointments.push(appointment);
    }
  }

  /**
   * PASO 4: Verificar que los datos son correctos
   */
  async verifyGeneratedData() {
    console.log('\n🔍 Verificando datos generados...');

    const now = new Date();
    const checks = [];

    // Verificar datos de hoy (1 día)
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const endToday = new Date(now);
    endToday.setHours(23, 59, 59, 999);

    const todaySales = await Sale.find({
      saleDate: { $gte: today, $lte: endToday },
      notes: { $regex: /STRATEGIC_TEST/ }
    });

    const todayAppointments = await Appointment.find({
      date: { $gte: today, $lte: endToday },
      notes: { $regex: /STRATEGIC_TEST/ }
    });

    checks.push({
      period: 'HOY (1 día)',
      expectedSales: DEBUG_PATTERNS.DAILY.sales,
      actualSales: todaySales.length,
      expectedAppointments: DEBUG_PATTERNS.DAILY.appointments,
      actualAppointments: todayAppointments.length
    });

    // Verificar datos de última semana (7 días)
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);

    const weekSales = await Sale.find({
      saleDate: { $gte: weekAgo, $lte: endToday },
      notes: { $regex: /STRATEGIC_TEST/ }
    });

    const weekAppointments = await Appointment.find({
      date: { $gte: weekAgo, $lte: endToday },
      notes: { $regex: /STRATEGIC_TEST/ }
    });

    checks.push({
      period: 'ÚLTIMA SEMANA (7 días)',
      expectedSales: DEBUG_PATTERNS.WEEKLY.sales,
      actualSales: weekSales.length,
      expectedAppointments: DEBUG_PATTERNS.WEEKLY.appointments,
      actualAppointments: weekAppointments.length
    });

    // Verificar datos de últimos 15 días
    const biweekAgo = new Date(now);
    biweekAgo.setDate(now.getDate() - 14);
    biweekAgo.setHours(0, 0, 0, 0);

    const biweekSales = await Sale.find({
      saleDate: { $gte: biweekAgo, $lte: endToday },
      notes: { $regex: /STRATEGIC_TEST/ }
    });

    const biweekAppointments = await Appointment.find({
      date: { $gte: biweekAgo, $lte: endToday },
      notes: { $regex: /STRATEGIC_TEST/ }
    });

    checks.push({
      period: 'ÚLTIMOS 15 DÍAS',
      expectedSales: DEBUG_PATTERNS.BIWEEKLY.sales,
      actualSales: biweekSales.length,
      expectedAppointments: DEBUG_PATTERNS.BIWEEKLY.appointments,
      actualAppointments: biweekAppointments.length
    });

    // Verificar datos de último mes (30 días)
    const monthAgo = new Date(now);
    monthAgo.setDate(now.getDate() - 29);
    monthAgo.setHours(0, 0, 0, 0);

    const monthSales = await Sale.find({
      saleDate: { $gte: monthAgo, $lte: endToday },
      notes: { $regex: /STRATEGIC_TEST/ }
    });

    const monthAppointments = await Appointment.find({
      date: { $gte: monthAgo, $lte: endToday },
      notes: { $regex: /STRATEGIC_TEST/ }
    });

    checks.push({
      period: 'ÚLTIMO MES (30 días)',
      expectedSales: DEBUG_PATTERNS.MONTHLY.sales,
      actualSales: monthSales.length,
      expectedAppointments: DEBUG_PATTERNS.MONTHLY.appointments,
      actualAppointments: monthAppointments.length
    });

    // Mostrar resultados
    console.log('\n📊 RESUMEN DE VERIFICACIÓN:');
    console.log('='.repeat(80));
    
    let allCorrect = true;
    
    checks.forEach(check => {
      const salesOK = check.actualSales === check.expectedSales;
      const appointmentsOK = check.actualAppointments === check.expectedAppointments;
      const status = (salesOK && appointmentsOK) ? '✅' : '❌';
      
      if (!salesOK || !appointmentsOK) allCorrect = false;
      
      console.log(`${status} ${check.period}:`);
      console.log(`   Ventas: ${check.actualSales}/${check.expectedSales} ${salesOK ? '✅' : '❌'}`);
      console.log(`   Citas: ${check.actualAppointments}/${check.expectedAppointments} ${appointmentsOK ? '✅' : '❌'}`);
      console.log('');
    });

    if (allCorrect) {
      console.log('🎉 ¡TODOS LOS DATOS SON CORRECTOS!');
    } else {
      console.log('⚠️ Algunos datos no coinciden con lo esperado.');
    }

    return checks;
  }

  /**
   * PASO 5: Generar documentación de testing
   */
  generateTestingGuide() {
    const guide = `
🎯 GUÍA DE TESTING PARA ADMIN/BARBEROS
=====================================

Los datos han sido generados estratégicamente para probar todos los filtros.

📅 DATOS ESPERADOS POR PERÍODO:

1️⃣ FILTRO DIARIO (HOY):
   • Ventas: ${DEBUG_PATTERNS.DAILY.sales}
   • Citas completadas: ${DEBUG_PATTERNS.DAILY.appointments}
   • Ingresos aprox: $${DEBUG_PATTERNS.DAILY.expectedRevenue.toLocaleString()}

7️⃣ FILTRO SEMANAL (7 días):
   • Ventas: ${DEBUG_PATTERNS.WEEKLY.sales}
   • Citas completadas: ${DEBUG_PATTERNS.WEEKLY.appointments}
   • Ingresos aprox: $${DEBUG_PATTERNS.WEEKLY.expectedRevenue.toLocaleString()}

1️⃣5️⃣ FILTRO QUINCENAL (15 días):
   • Ventas: ${DEBUG_PATTERNS.BIWEEKLY.sales}
   • Citas completadas: ${DEBUG_PATTERNS.BIWEEKLY.appointments}
   • Ingresos aprox: $${DEBUG_PATTERNS.BIWEEKLY.expectedRevenue.toLocaleString()}

3️⃣0️⃣ FILTRO MENSUAL (30 días):
   • Ventas: ${DEBUG_PATTERNS.MONTHLY.sales}
   • Citas completadas: ${DEBUG_PATTERNS.MONTHLY.appointments}
   • Ingresos aprox: $${DEBUG_PATTERNS.MONTHLY.expectedRevenue.toLocaleString()}

🔍 CÓMO PROBAR:

1. Ve a la sección Admin/Barberos
2. Selecciona cada filtro temporal (1, 7, 15, 30 días)
3. Verifica que los números coincidan con los esperados arriba
4. Prueba filtrar por barbero específico
5. Verifica que las sumas sean correctas

🏷️ IDENTIFICACIÓN DE DATOS DE PRUEBA:
   • Todas las ventas tienen "STRATEGIC_TEST" en las notas
   • Todas las citas tienen "STRATEGIC_TEST" en las notas
   • Los clientes se llaman "Cliente Test X-Y"

🗑️ LIMPIAR DATOS DE PRUEBA:
   Ejecuta: node cleanTestData.js
`;

    console.log(guide);
    return guide;
  }

  /**
   * Ejecutar todo el proceso
   */
  async run() {
    try {
      console.log('🚀 INICIANDO DEBUG ESTRATÉGICO DE ADMIN/BARBEROS');
      console.log('='.repeat(60));

      await this.connect();
      await this.loadExistingData();
      await this.cleanPreviousTestData();
      await this.generateStrategicData();
      const verification = await this.verifyGeneratedData();
      this.generateTestingGuide();

      console.log('\n✅ DEBUG ESTRATÉGICO COMPLETADO');
      console.log('📖 Consulta la guía arriba para probar las funcionalidades');

    } catch (error) {
      console.error('❌ Error en debug estratégico:', error);
    } finally {
      await this.disconnect();
    }
  }
}

// Ejecutar si se llama directamente
if (process.argv[1] && process.argv[1].endsWith('strategicBarberDebug.js')) {
  const barberDebugger = new BarberDebugger();
  barberDebugger.run().catch(error => {
    console.error('❌ Error ejecutando debug:', error);
    process.exit(1);
  });
}

export default BarberDebugger;
