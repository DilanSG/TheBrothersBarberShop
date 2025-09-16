#!/usr/bin/env node

/**
 * Script de Debug y Testing para Reportes Detallados
 * Limpia completamente la base de datos y crea datos de prueba específicos
 * para validar todos los endpoints de reportes detallados
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Importar modelos
import User from '../models/User.js';
import Barber from '../models/Barber.js';
import Service from '../models/Service.js';
import Inventory from '../models/Inventory.js';
import Sale from '../models/Sale.js';
import Appointment from '../models/Appointment.js';

// Cargar variables de entorno
dotenv.config();

// Datos de prueba
const testData = {
  users: [],
  barbers: [],
  services: [],
  inventory: [],
  sales: [],
  appointments: []
};

async function connectDatabase() {
  try {
    const mongoUrl = process.env.MONGODB_URI;
    if (!mongoUrl) {
      throw new Error('MONGODB_URI no está definido');
    }
    
    await mongoose.connect(mongoUrl);
    console.log('✅ Conectado a MongoDB para testing');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
}

async function clearDatabase() {
  console.log('\n🧹 Limpiando base de datos completamente...');
  
  const collections = [
    'users', 'barbers', 'services', 'inventories', 
    'sales', 'appointments', 'reviews'
  ];
  
  for (const collection of collections) {
    try {
      await mongoose.connection.db.collection(collection).deleteMany({});
      console.log(`✅ Colección ${collection} limpiada`);
    } catch (error) {
      console.log(`⚠️ Error limpiando ${collection}:`, error.message);
    }
  }
}

async function createTestUsers() {
  console.log('\n👥 Creando usuarios de prueba...');
  
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  const users = [
    {
      name: 'Admin Test',
      email: 'admin@test.com',
      password: hashedPassword,
      role: 'admin',
      phone: '1234567890'
    },
    {
      name: 'Carlos Mendez',
      email: 'carlos@test.com',
      password: hashedPassword,
      role: 'barber',
      phone: '1111111111'
    },
    {
      name: 'Miguel Torres',
      email: 'miguel@test.com',
      password: hashedPassword,
      role: 'barber', 
      phone: '2222222222'
    },
    {
      name: 'Cliente Test 1',
      email: 'cliente1@test.com',
      password: hashedPassword,
      role: 'user',
      phone: '3333333333'
    },
    {
      name: 'Cliente Test 2',
      email: 'cliente2@test.com',
      password: hashedPassword,
      role: 'user',
      phone: '4444444444'
    }
  ];
  
  for (const userData of users) {
    const user = await User.create(userData);
    testData.users.push(user);
    console.log(`✅ Usuario creado: ${user.name} (${user.role})`);
  }
}

async function createTestBarbers() {
  console.log('\n💈 Creando barberos de prueba...');
  
  const barberUsers = testData.users.filter(user => user.role === 'barber');
  
  for (const user of barberUsers) {
    const barber = await Barber.create({
      user: user._id,
      specialty: 'Corte clásico y barba',
      experience: Math.floor(Math.random() * 10) + 1,
      description: `Barbero especializado en cortes modernos y tradicionales con ${Math.floor(Math.random() * 10) + 1} años de experiencia.`,
      schedule: {
        monday: { start: '09:00', end: '18:00', available: true },
        tuesday: { start: '09:00', end: '18:00', available: true },
        wednesday: { start: '09:00', end: '18:00', available: true },
        thursday: { start: '09:00', end: '18:00', available: true },
        friday: { start: '09:00', end: '18:00', available: true },
        saturday: { start: '09:00', end: '16:00', available: true },
        sunday: { start: '', end: '', available: false }
      }
    });
    
    testData.barbers.push(barber);
    console.log(`✅ Barbero creado: ${user.name}`);
  }
}

async function createTestServices() {
  console.log('\n✂️ Creando servicios de prueba...');
  
  const services = [
    {
      name: 'Corte Clásico',
      description: 'Corte de cabello tradicional',
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
      name: 'Arreglo de Barba',
      description: 'Solo arreglo y perfilado de barba',
      price: 15000,
      duration: 20,
      category: 'afeitado',
      isActive: true
    },
    {
      name: 'Corte Premium',
      description: 'Corte con lavado y peinado',
      price: 40000,
      duration: 60,
      category: 'combo',
      isActive: true
    }
  ];
  
  for (const serviceData of services) {
    const service = await Service.create(serviceData);
    testData.services.push(service);
    console.log(`✅ Servicio creado: ${service.name} - $${service.price}`);
  }
}

async function createTestInventory() {
  console.log('\n🧴 Creando productos de inventario...');
  
  const products = [
    {
      code: 'SHAMP001',
      name: 'Shampoo Premium',
      description: 'Shampoo profesional para cabello',
      price: 45000,
      cost: 25000,
      stock: 50,
      initialStock: 50,
      minStock: 10,
      category: 'productos_pelo',
      isActive: true
    },
    {
      code: 'CERA001',
      name: 'Cera para Cabello',
      description: 'Cera de fijación fuerte',
      price: 32000,
      cost: 18000,
      stock: 30,
      initialStock: 30,
      minStock: 5,
      category: 'ceras',
      isActive: true
    },
    {
      code: 'ACE001',
      name: 'Aceite para Barba',
      description: 'Aceite hidratante para barba',
      price: 38000,
      cost: 22000,
      stock: 25,
      initialStock: 25,
      minStock: 8,
      category: 'lociones',
      isActive: true
    },
    {
      code: 'POM001',
      name: 'Pomada Vintage',
      description: 'Pomada estilo clásico',
      price: 28000,
      cost: 16000,
      stock: 20,
      initialStock: 20,
      minStock: 5,
      category: 'geles',
      isActive: true
    }
  ];
  
  for (const productData of products) {
    const product = await Inventory.create(productData);
    testData.inventory.push(product);
    console.log(`✅ Producto creado: ${product.name} - $${product.price} (Stock: ${product.stock})`);
  }
}

async function createTestSales() {
  console.log('\n💰 Creando ventas de prueba...');
  
  const barber1 = testData.barbers[0]; // Carlos
  const barber2 = testData.barbers[1]; // Miguel
  const barber1User = testData.users.find(u => u._id.toString() === barber1.user.toString());
  const barber2User = testData.users.find(u => u._id.toString() === barber2.user.toString());
  
  // Fechas de prueba (últimos 7 días)
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date);
  }
  
  // Ventas de productos para ambos barberos
  for (let i = 0; i < 8; i++) {
    const date = dates[i % dates.length];
    const barber = i % 2 === 0 ? barber1 : barber2;
    const barberUser = i % 2 === 0 ? barber1User : barber2User;
    const product = testData.inventory[i % testData.inventory.length];
    const quantity = Math.floor(Math.random() * 3) + 1;
    
    const sale = await Sale.create({
      type: 'product',
      productId: product._id,
      productName: product.name,
      quantity: quantity,
      unitPrice: product.price,
      totalAmount: product.price * quantity,
      barberId: barber._id,
      barberName: barberUser.name,
      customerName: `Cliente Venta ${i + 1}`,
      paymentMethod: i % 3 === 0 ? 'cash' : i % 3 === 1 ? 'card' : 'transfer',
      saleDate: date,
      status: 'completed',
      notes: `Venta de producto ${product.name}`
    });
    
    testData.sales.push(sale);
    console.log(`✅ Venta creada: ${product.name} x${quantity} - $${sale.totalAmount} (${barberUser.name})`);
  }
  
  // Ventas walk-in para ambos barberos
  for (let i = 0; i < 10; i++) {
    const date = dates[i % dates.length];
    const barber = i % 2 === 0 ? barber1 : barber2;
    const barberUser = i % 2 === 0 ? barber1User : barber2User;
    const service = testData.services[i % testData.services.length];
    
    const sale = await Sale.create({
      type: 'walkIn',
      serviceId: service._id,
      serviceName: service.name,
      quantity: 1,
      unitPrice: service.price,
      totalAmount: service.price,
      barberId: barber._id,
      barberName: barberUser.name,
      customerName: `Cliente Walk-in ${i + 1}`,
      paymentMethod: i % 3 === 0 ? 'cash' : i % 3 === 1 ? 'card' : 'other',
      saleDate: date,
      status: 'completed',
      notes: `Servicio walk-in: ${service.name}`
    });
    
    testData.sales.push(sale);
    console.log(`✅ Walk-in creado: ${service.name} - $${service.price} (${barberUser.name})`);
  }
}

async function createTestAppointments() {
  console.log('\n📅 Creando citas de prueba...');
  
  const barber1 = testData.barbers[0]; // Carlos
  const barber2 = testData.barbers[1]; // Miguel
  const clients = testData.users.filter(user => user.role === 'user');
  
  // Fechas de prueba
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date);
  }
  
  // Citas completadas
  for (let i = 0; i < 8; i++) {
    const date = dates[i % dates.length];
    const barber = i % 2 === 0 ? barber1 : barber2;
    const client = clients[i % clients.length];
    const service = testData.services[i % testData.services.length];
    
    const appointment = await Appointment.create({
      user: client._id,
      barber: barber._id,
      service: service._id,
      date: date,
      duration: service.duration,
      price: service.price,
      status: 'completed',
      notes: `Cita completada ${i + 1} - Cliente satisfecho`
    });
    
    testData.appointments.push(appointment);
    console.log(`✅ Cita completada: ${client.name} con ${testData.users.find(u => u._id.toString() === barber.user.toString()).name} - $${appointment.price}`);
  }
  
  // Algunas citas pendientes (no deben aparecer en reportes)
  for (let i = 0; i < 3; i++) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + i + 1);
    const client = clients[i % clients.length];
    const service = testData.services[0];
    
    const appointment = await Appointment.create({
      user: client._id,
      barber: barber1._id,
      service: service._id,
      date: futureDate,
      duration: service.duration,
      price: service.price,
      status: 'confirmed', // No completada
      notes: `Cita futura ${i + 1}`
    });
    
    console.log(`✅ Cita pendiente: ${client.name} - ${futureDate.toDateString()}`);
  }
}

async function printTestSummary() {
  console.log('\n📊 RESUMEN DE DATOS DE PRUEBA CREADOS:');
  console.log('=====================================');
  
  console.log(`\n👥 USUARIOS: ${testData.users.length}`);
  testData.users.forEach(user => {
    console.log(`   • ${user.name} (${user.role}) - ${user.email}`);
  });
  
  console.log(`\n💈 BARBEROS: ${testData.barbers.length}`);
  testData.barbers.forEach(barber => {
    const barberUser = testData.users.find(u => u._id.toString() === barber.user.toString());
    console.log(`   • ${barberUser.name} - ID: ${barber._id}`);
  });
  
  console.log(`\n✂️ SERVICIOS: ${testData.services.length}`);
  testData.services.forEach(service => {
    console.log(`   • ${service.name} - $${service.price}`);
  });
  
  console.log(`\n🧴 PRODUCTOS: ${testData.inventory.length}`);
  testData.inventory.forEach(product => {
    console.log(`   • ${product.name} - $${product.price} (Stock: ${product.stock})`);
  });
  
  console.log(`\n💰 VENTAS: ${testData.sales.length}`);
  const salesByBarber = {};
  testData.sales.forEach(sale => {
    const barberName = sale.barberName;
    if (!salesByBarber[barberName]) salesByBarber[barberName] = [];
    salesByBarber[barberName].push(sale);
  });
  
  Object.entries(salesByBarber).forEach(([barberName, sales]) => {
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    console.log(`   • ${barberName}: ${sales.length} ventas - $${totalRevenue}`);
  });
  
  console.log(`\n📅 CITAS: ${testData.appointments.length}`);
  const completedAppointments = testData.appointments.filter(apt => apt.status === 'completed');
  const pendingAppointments = testData.appointments.filter(apt => apt.status === 'confirmed');
  console.log(`   • Completadas: ${completedAppointments.length}`);
  console.log(`   • Pendientes: ${pendingAppointments.length}`);
}

async function printDebugEndpoints() {
  console.log('\n🔧 ENDPOINTS PARA DEBUGGEAR:');
  console.log('============================');
  
  const barber1Id = testData.barbers[0]._id;
  const barber2Id = testData.barbers[1]._id;
  
  const endDate = new Date().toISOString();
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  console.log('\n💰 REPORTES DE VENTAS DETALLADAS:');
  console.log(`GET /api/v1/sales/detailed-report?barberId=${barber1Id}&startDate=${startDate}&endDate=${endDate}`);
  console.log(`GET /api/v1/sales/detailed-report?barberId=${barber2Id}&startDate=${startDate}&endDate=${endDate}`);
  
  console.log('\n✂️ REPORTES DE CORTES WALK-IN:');
  console.log(`GET /api/v1/sales/walk-in-details?barberId=${barber1Id}&startDate=${startDate}&endDate=${endDate}`);
  console.log(`GET /api/v1/sales/walk-in-details?barberId=${barber2Id}&startDate=${startDate}&endDate=${endDate}`);
  
  console.log('\n📅 REPORTES DE CITAS COMPLETADAS:');
  console.log(`GET /api/v1/appointments/completed-details?barberId=${barber1Id}&startDate=${startDate}&endDate=${endDate}`);
  console.log(`GET /api/v1/appointments/completed-details?barberId=${barber2Id}&startDate=${startDate}&endDate=${endDate}`);
  
  console.log('\n🔑 CREDENCIALES DE LOGIN:');
  console.log('Admin: admin@test.com / 123456');
  console.log('Barbero 1 (Carlos): carlos@test.com / 123456');
  console.log('Barbero 2 (Miguel): miguel@test.com / 123456');
  
  console.log('\n📋 IDs DE BARBEROS:');
  console.log(`Carlos: ${barber1Id}`);
  console.log(`Miguel: ${barber2Id}`);
}

async function main() {
  try {
    console.log('🚀 INICIANDO SCRIPT DE DEBUG PARA REPORTES DETALLADOS');
    console.log('=====================================================');
    
    await connectDatabase();
    await clearDatabase();
    await createTestUsers();
    await createTestBarbers();
    await createTestServices();
    await createTestInventory();
    await createTestSales();
    await createTestAppointments();
    await printTestSummary();
    await printDebugEndpoints();
    
    console.log('\n✅ ¡SCRIPT DE DEBUG COMPLETADO EXITOSAMENTE!');
    console.log('\n💡 Ahora puedes:');
    console.log('   1. Probar los endpoints listados arriba');
    console.log('   2. Verificar que los reportes muestren datos agrupados por día');
    console.log('   3. Confirmar que el cache funciona (segunda llamada más rápida)');
    console.log('   4. Validar los modales frontend con datos reales');
    
  } catch (error) {
    console.error('❌ Error ejecutando script de debug:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
    process.exit(0);
  }
}

// Ejecutar script
main();
