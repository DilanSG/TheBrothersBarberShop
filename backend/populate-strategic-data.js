import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from './src/config/index.js';
import User from './src/models/User.js';
import Barber from './src/models/Barber.js';
import Service from './src/models/Service.js';
import Appointment from './src/models/Appointment.js';
import Sale from './src/models/Sale.js';
import Inventory from './src/models/Inventory.js';

// Helper para obtener fecha local en formato YYYY-MM-DD
const getLocalDate = (daysOffset = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
};

// Helper para crear fecha específica con hora
const createDateTime = (dateStr, hour = 12) => {
  return new Date(`${dateStr}T${hour.toString().padStart(2, '0')}:00:00`);
};

// Datos estratégicos organizados por días específicos
const testData = {
  dates: {
    today: getLocalDate(0),        // Hoy: 14/9/2025
    day1: getLocalDate(-1),        // 1 día: 13/9/2025
    day2: getLocalDate(-2),        // 2 días: 12/9/2025
    day3: getLocalDate(-3),        // 3 días: 11/9/2025
    day4: getLocalDate(-4),        // 4 días: 10/9/2025
    day5: getLocalDate(-5),        // 5 días: 9/9/2025
    day6: getLocalDate(-6),        // 6 días: 8/9/2025
    day7: getLocalDate(-7),        // 7 días: 7/9/2025
    day10: getLocalDate(-10),      // 10 días: 4/9/2025
    day12: getLocalDate(-12),      // 12 días: 2/9/2025
    day15: getLocalDate(-15),      // 15 días: 30/8/2025
    day20: getLocalDate(-20),      // 20 días: 25/8/2025
    day25: getLocalDate(-25),      // 25 días: 20/8/2025
    day30: getLocalDate(-30),      // 30 días: 15/8/2025
    day35: getLocalDate(-35),      // 35 días: 10/8/2025
    day40: getLocalDate(-40),      // 40 días: 5/8/2025
    day45: getLocalDate(-45)       // Más de 30 días: 31/7/2025
  }
};

console.log('📅 Fechas estratégicas de prueba:');
Object.entries(testData.dates).forEach(([key, date]) => {
  console.log(`  ${key}: ${date}`);
});

const populateDatabase = async () => {
  try {
    await mongoose.connect(config.database.uri);
    console.log('📊 Conectado a MongoDB');

    // Limpiar datos existentes
    console.log('🧹 Limpiando datos existentes...');
    await Promise.all([
      Appointment.deleteMany({}),
      Sale.deleteMany({}),
      Barber.deleteMany({}),
      User.deleteMany({ role: { $ne: 'admin' } }), // No eliminar admin
      Service.deleteMany({}),
      Inventory.deleteMany({})
    ]);

    // 1. Crear servicios
    console.log('✂️ Creando servicios...');
    const services = await Service.insertMany([
      {
        name: 'Corte Clásico',
        description: 'Corte tradicional de cabello',
        price: 25000,
        duration: 30,
        category: 'corte',
        isActive: true
      },
      {
        name: 'Corte Moderno',
        description: 'Corte moderno y estilizado',
        price: 30000,
        duration: 45,
        category: 'corte',
        isActive: true
      },
      {
        name: 'Barba y Bigote',
        description: 'Arreglo completo de barba y bigote',
        price: 20000,
        duration: 25,
        category: 'afeitado',
        isActive: true
      },
      {
        name: 'Combo Completo',
        description: 'Corte + barba + lavado',
        price: 45000,
        duration: 60,
        category: 'combo',
        isActive: true
      },
      {
        name: 'Afeitado Premium',
        description: 'Afeitado con toalla caliente',
        price: 15000,
        duration: 20,
        category: 'afeitado',
        isActive: true
      }
    ]);

    // 2. Crear usuarios (clientes y barberos)
    console.log('👥 Creando usuarios...');
    const hashedPassword = await bcrypt.hash('123456', 12);
    
    // Crear usuarios clientes
    const clientUsers = await User.insertMany([
      {
        name: 'Juan Pérez',
        email: 'juan@cliente.com',
        password: hashedPassword,
        role: 'user',
        phone: '3001234567',
        isActive: true
      },
      {
        name: 'Carlos Ramírez',
        email: 'carlos@cliente.com',
        password: hashedPassword,
        role: 'user',
        phone: '3007654321',
        isActive: true
      },
      {
        name: 'Luis Morales',
        email: 'luis@cliente.com',
        password: hashedPassword,
        role: 'user',
        phone: '3009876543',
        isActive: true
      },
      {
        name: 'Miguel Torres',
        email: 'miguel@cliente.com',
        password: hashedPassword,
        role: 'user',
        phone: '3005432109',
        isActive: true
      },
      {
        name: 'Diego Silva',
        email: 'diego@cliente.com',
        password: hashedPassword,
        role: 'user',
        phone: '3002345678',
        isActive: true
      }
    ]);

    // Crear usuarios barberos
    const barberUsers = await User.insertMany([
      {
        name: 'Carlos Martínez',
        email: 'carlos.martinez@barbershop.com',
        password: hashedPassword,
        role: 'barber',
        phone: '3101234567',
        isActive: true
      },
      {
        name: 'Miguel González',
        email: 'miguel.gonzalez@barbershop.com',
        password: hashedPassword,
        role: 'barber',
        phone: '3107654321',
        isActive: true
      },
      {
        name: 'Diego Herrera',
        email: 'diego.herrera@barbershop.com',
        password: hashedPassword,
        role: 'barber',
        phone: '3109876543',
        isActive: true
      }
    ]);

    // 3. Crear perfiles de barberos
    console.log('✂️ Creando perfiles de barberos...');
    const barbers = await Barber.insertMany([
      {
        user: barberUsers[0]._id,
        specialty: 'Cortes modernos y diseños',
        experience: 5,
        description: 'Especialista en cortes modernos y diseños creativos',
        schedule: {
          monday: { start: '09:00', end: '18:00', available: true },
          tuesday: { start: '09:00', end: '18:00', available: true },
          wednesday: { start: '09:00', end: '18:00', available: true },
          thursday: { start: '09:00', end: '18:00', available: true },
          friday: { start: '09:00', end: '18:00', available: true },
          saturday: { start: '09:00', end: '17:00', available: true },
          sunday: { start: '', end: '', available: false }
        },
        isActive: true
      },
      {
        user: barberUsers[1]._id,
        specialty: 'Barbas y bigotes clásicos',
        experience: 3,
        description: 'Experto en técnicas tradicionales de barba',
        schedule: {
          monday: { start: '10:00', end: '19:00', available: true },
          tuesday: { start: '10:00', end: '19:00', available: true },
          wednesday: { start: '10:00', end: '19:00', available: true },
          thursday: { start: '10:00', end: '19:00', available: true },
          friday: { start: '10:00', end: '19:00', available: true },
          saturday: { start: '10:00', end: '18:00', available: true },
          sunday: { start: '', end: '', available: false }
        },
        isActive: true
      },
      {
        user: barberUsers[2]._id,
        specialty: 'Cortes clásicos y afeitado premium',
        experience: 7,
        description: 'Maestro en técnicas tradicionales de barbería',
        schedule: {
          monday: { start: '08:00', end: '17:00', available: true },
          tuesday: { start: '08:00', end: '17:00', available: true },
          wednesday: { start: '08:00', end: '17:00', available: true },
          thursday: { start: '08:00', end: '17:00', available: true },
          friday: { start: '08:00', end: '17:00', available: true },
          saturday: { start: '08:00', end: '16:00', available: true },
          sunday: { start: '', end: '', available: false }
        },
        isActive: true
      }
    ]);

    // 4. Crear productos de inventario
    console.log('📦 Creando productos de inventario...');
    const products = await Inventory.insertMany([
      {
        code: 'SH001',
        name: 'Shampoo Premium',
        description: 'Shampoo para todo tipo de cabello',
        category: 'productos_pelo',
        stock: 50,
        initialStock: 50,
        minStock: 10,
        unit: 'ml',
        price: 25000,
        isActive: true
      },
      {
        code: 'GEL001',
        name: 'Gel Fijador Fuerte',
        description: 'Gel fijador extra fuerte',
        category: 'geles',
        stock: 30,
        initialStock: 30,
        minStock: 5,
        unit: 'ml',
        price: 15000,
        isActive: true
      },
      {
        code: 'ACB001',
        name: 'Aceite para Barba Premium',
        description: 'Aceite hidratante para barba',
        category: 'lociones',
        stock: 25,
        initialStock: 25,
        minStock: 8,
        unit: 'ml',
        price: 22000,
        isActive: true
      },
      {
        code: 'CER001',
        name: 'Cera Modeladora',
        description: 'Cera para modelar el cabello',
        category: 'ceras',
        stock: 20,
        initialStock: 20,
        minStock: 5,
        unit: 'g',
        price: 18000,
        isActive: true
      },
      {
        code: 'POM001',
        name: 'Pomada Vintage',
        description: 'Pomada para peinados vintage',
        category: 'ceras',
        stock: 15,
        initialStock: 15,
        minStock: 3,
        unit: 'g',
        price: 20000,
        isActive: true
      }
    ]);

    // 5. CREAR DATOS ESTRATÉGICOS DISTRIBUIDOS POR FECHAS
    console.log('📅 Creando datos estratégicos distribuidos por fechas...');
    
    const appointments = [];
    const sales = [];

    // Función para crear citas
    const createAppointmentsForDate = (dateStr, count, startHour = 10) => {
      const dayAppointments = [];
      for (let i = 0; i < count; i++) {
        const barber = barbers[i % barbers.length];
        const service = services[i % services.length];
        const client = clientUsers[i % clientUsers.length];
        const hour = startHour + (i * 2);
        
        dayAppointments.push({
          user: client._id,
          barber: barber._id,
          service: service._id,
          date: createDateTime(dateStr, hour),
          duration: service.duration,
          status: 'completed',
          price: service.price,
          notes: `Cita estratégica para ${dateStr}`,
          createdAt: createDateTime(dateStr, hour - 1),
          updatedAt: createDateTime(dateStr, hour + 1)
        });
      }
      return dayAppointments;
    };

    // Función para crear ventas
    const createSalesForDate = (dateStr, count, startHour = 14) => {
      const daySales = [];
      for (let i = 0; i < count; i++) {
        const barber = barbers[i % barbers.length];
        const product = products[i % products.length];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const hour = startHour + i;
        
        daySales.push({
          productId: product._id,
          productName: product.name,
          type: 'product',
          quantity: quantity,
          unitPrice: product.price,
          totalAmount: product.price * quantity,
          barberId: barber._id,
          barberName: barber.user ? `Barber ${i + 1}` : 'Barbero',
          customerName: `Cliente Venta ${dateStr}`,
          notes: `Venta estratégica para ${dateStr}`,
          saleDate: createDateTime(dateStr, hour),
          status: 'completed'
        });
      }
      return daySales;
    };

    // DISTRIBUCIÓN ESTRATÉGICA DE DATOS:
    console.log('\n📋 Distribuyendo datos estratégicamente...');

    // HOY (14/9/2025) - Base para filtro "1 día"
    appointments.push(...createAppointmentsForDate(testData.dates.today, 5, 10));
    sales.push(...createSalesForDate(testData.dates.today, 3, 14));
    console.log(`📅 HOY (${testData.dates.today}): 5 citas + 3 ventas`);

    // AYER (13/9/2025) - Para sumar a filtros de varios días
    appointments.push(...createAppointmentsForDate(testData.dates.day1, 3, 10));
    sales.push(...createSalesForDate(testData.dates.day1, 2, 14));
    console.log(`📅 AYER (${testData.dates.day1}): 3 citas + 2 ventas`);

    // Días 2-6 (12/9 al 9/9) - Para completar semana
    appointments.push(...createAppointmentsForDate(testData.dates.day2, 2, 10));
    sales.push(...createSalesForDate(testData.dates.day2, 1, 14));
    
    appointments.push(...createAppointmentsForDate(testData.dates.day3, 4, 10));
    sales.push(...createSalesForDate(testData.dates.day3, 2, 14));
    
    appointments.push(...createAppointmentsForDate(testData.dates.day4, 1, 10));
    sales.push(...createSalesForDate(testData.dates.day4, 1, 14));
    
    appointments.push(...createAppointmentsForDate(testData.dates.day5, 3, 10));
    sales.push(...createSalesForDate(testData.dates.day5, 2, 14));
    
    appointments.push(...createAppointmentsForDate(testData.dates.day6, 2, 10));
    sales.push(...createSalesForDate(testData.dates.day6, 1, 14));

    // Día 7 (7/9/2025) - Límite exacto del filtro "7 días"
    appointments.push(...createAppointmentsForDate(testData.dates.day7, 2, 10));
    sales.push(...createSalesForDate(testData.dates.day7, 1, 14));
    console.log(`📅 DÍA 7 (${testData.dates.day7}): 2 citas + 1 venta`);

    // Días 8-14 (entre 7 y 15 días)
    appointments.push(...createAppointmentsForDate(testData.dates.day10, 3, 10));
    sales.push(...createSalesForDate(testData.dates.day10, 2, 14));
    
    appointments.push(...createAppointmentsForDate(testData.dates.day12, 1, 10));
    sales.push(...createSalesForDate(testData.dates.day12, 1, 14));

    // Día 15 (30/8/2025) - Límite exacto del filtro "15 días"
    appointments.push(...createAppointmentsForDate(testData.dates.day15, 4, 10));
    sales.push(...createSalesForDate(testData.dates.day15, 2, 14));
    console.log(`📅 DÍA 15 (${testData.dates.day15}): 4 citas + 2 ventas`);

    // Días 16-29 (entre 15 y 30 días)
    appointments.push(...createAppointmentsForDate(testData.dates.day20, 2, 10));
    sales.push(...createSalesForDate(testData.dates.day20, 1, 14));
    
    appointments.push(...createAppointmentsForDate(testData.dates.day25, 3, 10));
    sales.push(...createSalesForDate(testData.dates.day25, 2, 14));

    // Día 30 (15/8/2025) - Límite exacto del filtro "30 días"
    appointments.push(...createAppointmentsForDate(testData.dates.day30, 2, 10));
    sales.push(...createSalesForDate(testData.dates.day30, 1, 14));
    console.log(`📅 DÍA 30 (${testData.dates.day30}): 2 citas + 1 venta`);

    // Más de 30 días - NO debe aparecer en filtro de 30 días
    appointments.push(...createAppointmentsForDate(testData.dates.day35, 1, 10));
    sales.push(...createSalesForDate(testData.dates.day35, 1, 14));
    
    appointments.push(...createAppointmentsForDate(testData.dates.day40, 2, 10));
    sales.push(...createSalesForDate(testData.dates.day40, 1, 14));
    
    appointments.push(...createAppointmentsForDate(testData.dates.day45, 1, 10));
    sales.push(...createSalesForDate(testData.dates.day45, 1, 14));
    console.log(`📅 +30 DÍAS: 4 citas + 3 ventas (NO deben aparecer en filtro 30 días)`);

    // Insertar todos los datos
    console.log('\n💾 Insertando datos en la base de datos...');
    await Appointment.insertMany(appointments);
    await Sale.insertMany(sales);

    // CÁLCULOS EXACTOS ESPERADOS
    const expectedResults = {
      day1: {
        appointments: 5,
        sales: 3,
        description: `Solo HOY (${testData.dates.today})`
      },
      day7: {
        appointments: 5 + 3 + 2 + 4 + 1 + 3 + 2 + 2, // Sum días 0-7
        sales: 3 + 2 + 1 + 2 + 1 + 2 + 1 + 1,
        description: `Desde HOY hasta 7 días atrás (${testData.dates.day7})`
      },
      day15: {
        appointments: 22 + 3 + 1 + 4, // 7 días + días 8-15
        sales: 13 + 2 + 1 + 2,
        description: `Desde HOY hasta 15 días atrás (${testData.dates.day15})`
      },
      day30: {
        appointments: 30 + 2 + 3 + 2, // 15 días + días 16-30
        sales: 18 + 1 + 2 + 1,
        description: `Desde HOY hasta 30 días atrás (${testData.dates.day30})`
      },
      general: {
        appointments: 37 + 1 + 2 + 1, // 30 días + más de 30 días
        sales: 22 + 1 + 1 + 1,
        description: 'Todos los registros en la base de datos'
      }
    };

    // Mostrar resumen detallado
    console.log('\n📊 RESUMEN DETALLADO DE DATOS CREADOS:');
    console.log('=====================================');
    console.log(`📅 Total citas creadas: ${appointments.length}`);
    console.log(`💰 Total ventas creadas: ${sales.length}`);
    console.log(`👥 Total barberos: ${barbers.length}`);
    console.log(`⚡ Total servicios: ${services.length}`);
    console.log(`📦 Total productos: ${products.length}`);
    console.log(`👤 Total clientes: ${clientUsers.length}`);

    console.log('\n🎯 RESULTADOS EXACTOS ESPERADOS POR FILTRO:');
    console.log('===========================================');
    console.log(`📍 1 DÍA: ${expectedResults.day1.appointments} citas + ${expectedResults.day1.sales} ventas`);
    console.log(`📍 7 DÍAS: ${expectedResults.day7.appointments} citas + ${expectedResults.day7.sales} ventas`);
    console.log(`📍 15 DÍAS: ${expectedResults.day15.appointments} citas + ${expectedResults.day15.sales} ventas`);
    console.log(`📍 30 DÍAS: ${expectedResults.day30.appointments} citas + ${expectedResults.day30.sales} ventas`);
    console.log(`📍 GENERAL: ${expectedResults.general.appointments} citas + ${expectedResults.general.sales} ventas`);

    console.log('\n✅ Base de datos poblada exitosamente con datos estratégicos!');
    console.log('✅ Ahora puedes probar cada filtro y verificar que los números coincidan exactamente.');

  } catch (error) {
    console.error('❌ Error poblando la base de datos:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📊 Desconectado de MongoDB');
  }
};

populateDatabase();
