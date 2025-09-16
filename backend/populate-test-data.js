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

const testData = {
  // Datos organizados por días específicos para facilitar testing
  dates: {
    today: getLocalDate(0),        // Hoy: 14/9/2025
    day1: getLocalDate(-1),        // Ayer: 13/9/2025
    day3: getLocalDate(-3),        // 3 días atrás: 11/9/2025
    day7: getLocalDate(-7),        // 7 días atrás: 7/9/2025
    day15: getLocalDate(-15),      // 15 días atrás: 30/8/2025
    day30: getLocalDate(-30),      // 30 días atrás: 15/8/2025
    day45: getLocalDate(-45)       // Más de 30 días: 31/7/2025
  }
};

console.log('📅 Fechas de prueba:', testData.dates);

const populateDatabase = async () => {
  try {
    await mongoose.connect(config.database.uri);
    console.log('📊 Conectado a MongoDB');

    // Limpiar datos existentes
    console.log('🧹 Limpiando datos existentes...');
    await Promise.all([
      Appointment.deleteMany({}),
      //Sale.deleteMany({}),
      Barber.deleteMany({}),
      User.deleteMany({ role: { $ne: 'admin' } }), // No eliminar admin
      Service.deleteMany({}),
      //Inventory.deleteMany({})
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
        name: 'Corte y Barba',
        description: 'Corte de cabello + arreglo de barba',
        price: 35000,
        duration: 45,
        category: 'combo',
        isActive: true
      },
      {
        name: 'Afeitado Premium',
        description: 'Afeitado completo con toalla caliente',
        price: 20000,
        duration: 25,
        category: 'afeitado',
        isActive: true
      }
    ]);

    // 2. Crear usuarios barberos
    console.log('👨‍💼 Creando usuarios barberos...');
    const hashedPassword = await bcrypt.hash('123456', 12);
    
    const barberUsers = await User.insertMany([
      {
        name: 'Carlos Martínez',
        email: 'carlos@barbershop.com',
        password: hashedPassword,
        role: 'barber',
        isActive: true
      },
      {
        name: 'Miguel González',
        email: 'miguel@barbershop.com',
        password: hashedPassword,
        role: 'barber',
        isActive: true
      },
      {
        name: 'Diego Herrera',
        email: 'diego@barbershop.com',
        password: hashedPassword,
        role: 'barber',
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
        specialty: 'Barbas y bigotes',
        experience: 3,
        description: 'Experto en cuidado y diseño de barbas y bigotes',
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
        specialty: 'Cortes clásicos y afeitado',
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

    // 4. Comentado temporalmente - crear productos de inventario
    /*
    console.log('📦 Creando productos de inventario...');
    const products = await Inventory.insertMany([
      // ... productos comentados por ahora
    ]);
    */
    const products = []; // Array vacío para que no falle el resto del código

    // 5. Crear citas distribuidas estratégicamente por fechas
    console.log('📅 Creando citas distribuidas por fechas...');
    
    const appointments = [];
    //const sales = [];
    let appointmentId = 1;
    //let saleId = 1;

    // Función para crear citas para un día específico
    const createAppointmentsForDate = (dateStr, appointmentsCount, status = 'completed') => {
      const dayAppointments = [];
      for (let i = 0; i < appointmentsCount; i++) {
        const barber = barbers[i % barbers.length];
        const service = services[i % services.length];
        const user = barberUsers[i % barberUsers.length]; // Usar barberos como usuarios de ejemplo
        const hour = 10 + (i * 2); // Espaciar citas cada 2 horas
        
        dayAppointments.push({
          appointmentNumber: `AP${appointmentId.toString().padStart(4, '0')}`,
          client: {
            name: `Cliente ${appointmentId}`,
            phone: `300${(1000000 + appointmentId).toString()}`,
            email: `cliente${appointmentId}@test.com`
          },
          user: user._id, // Usuario requerido
          barber: barber._id,
          service: service._id,
          date: createDateTime(dateStr, hour),
          duration: service.duration, // Duración del servicio
          status: status,
          price: service.price, // Precio del servicio
          totalAmount: service.price,
          notes: `Cita de prueba para ${dateStr}`,
          createdAt: createDateTime(dateStr, hour - 1),
          updatedAt: createDateTime(dateStr, hour + 1)
        });
        appointmentId++;
      }
      return dayAppointments;
    };

    // Función para crear ventas para un día específico (comentada temporalmente)
    /*
    const createSalesForDate = (dateStr, salesCount) => {
      // ... función comentada por ahora
    };
    */

    // DISTRIBUIR DATOS POR FECHAS ESPECÍFICAS PARA TESTING:

    // HOY (14/9/2025) - 3 citas
    appointments.push(...createAppointmentsForDate(testData.dates.today, 3));
    //sales.push(...createSalesForDate(testData.dates.today, 2));

    // AYER (13/9/2025) - 2 citas
    appointments.push(...createAppointmentsForDate(testData.dates.day1, 2));
    //sales.push(...createSalesForDate(testData.dates.day1, 1));

    // 3 DÍAS ATRÁS (11/9/2025) - 2 citas
    appointments.push(...createAppointmentsForDate(testData.dates.day3, 2));
    //sales.push(...createSalesForDate(testData.dates.day3, 2));

    // 7 DÍAS ATRÁS (7/9/2025) - 1 cita
    appointments.push(...createAppointmentsForDate(testData.dates.day7, 1));
    //sales.push(...createSalesForDate(testData.dates.day7, 1));

    // 15 DÍAS ATRÁS (30/8/2025) - 2 citas
    appointments.push(...createAppointmentsForDate(testData.dates.day15, 2));
    //sales.push(...createSalesForDate(testData.dates.day15, 1));

    // 30 DÍAS ATRÁS (15/8/2025) - 1 cita
    appointments.push(...createAppointmentsForDate(testData.dates.day30, 1));
    //sales.push(...createSalesForDate(testData.dates.day30, 1));

    // MÁS DE 30 DÍAS (31/7/2025) - 1 cita (no debe aparecer en filtro de 30 días)
    appointments.push(...createAppointmentsForDate(testData.dates.day45, 1));
    //sales.push(...createSalesForDate(testData.dates.day45, 1));

    // Insertar todos los datos
    await Appointment.insertMany(appointments);
    //await Sale.insertMany(sales);

    // Mostrar resumen de datos creados
    console.log('\n📊 RESUMEN DE DATOS CREADOS:');
    console.log('=====================================');
    console.log(`📅 HOY (${testData.dates.today}): 3 citas`);
    console.log(`📅 AYER (${testData.dates.day1}): 2 citas`);
    console.log(`📅 3 DÍAS (${testData.dates.day3}): 2 citas`);
    console.log(`📅 7 DÍAS (${testData.dates.day7}): 1 cita`);
    console.log(`📅 15 DÍAS (${testData.dates.day15}): 2 citas`);
    console.log(`📅 30 DÍAS (${testData.dates.day30}): 1 cita`);
    console.log(`📅 +30 DÍAS (${testData.dates.day45}): 1 cita`);
    
    console.log('\n🎯 RESULTADOS ESPERADOS POR FILTRO:');
    console.log('=====================================');
    console.log('📍 1 DÍA (HOY): 3 citas');
    console.log('📍 7 DÍAS: 8 citas total (3+2+2+1)');
    console.log('📍 15 DÍAS: 10 citas total (8+2)');
    console.log('📍 30 DÍAS: 11 citas total (10+1)');
    console.log('📍 GENERAL: 12 citas total (11+1)');

    console.log('\n✅ Base de datos poblada exitosamente!');
    console.log(`✅ Total barberos: ${barbers.length}`);
    console.log(`✅ Total servicios: ${services.length}`);
    //console.log(`✅ Total productos: ${products.length}`);
    console.log(`✅ Total citas: ${appointments.length}`);

  } catch (error) {
    console.error('❌ Error poblando la base de datos:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📊 Desconectado de MongoDB');
  }
};

populateDatabase();
