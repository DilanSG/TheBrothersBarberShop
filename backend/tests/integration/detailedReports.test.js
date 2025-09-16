const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app.js');
const User = require('../../src/models/User.js');
const Sale = require('../../src/models/Sale.js');
const Appointment = require('../../src/models/Appointment.js');
const Barber = require('../../src/models/Barber.js');
const Service = require('../../src/models/Service.js');
const Inventory = require('../../src/models/Inventory.js');

describe('Detailed Reports Endpoints', () => {
  let authToken;
  let adminUser;
  let testBarber;
  let testService;
  let testInventory;

  beforeAll(async () => {
    // Crear usuario admin para autenticación
    adminUser = await User.create({
      name: 'Admin Test',
      email: 'admin.test@example.com',
      password: 'password123',
      role: 'admin',
      phone: '1234567890'
    });

    // Crear barbero de prueba
    testBarber = await Barber.create({
      name: 'Test Barber',
      email: 'testbarber@example.com',
      phone: '1234567890',
      specialties: ['corte', 'barba'],
      available: true,
      schedule: {
        monday: { isWorking: true, startTime: '09:00', endTime: '18:00' },
        tuesday: { isWorking: true, startTime: '09:00', endTime: '18:00' },
        wednesday: { isWorking: true, startTime: '09:00', endTime: '18:00' },
        thursday: { isWorking: true, startTime: '09:00', endTime: '18:00' },
        friday: { isWorking: true, startTime: '09:00', endTime: '18:00' },
        saturday: { isWorking: true, startTime: '09:00', endTime: '16:00' },
        sunday: { isWorking: false }
      }
    });

    // Crear servicio de prueba
    testService = await Service.create({
      name: 'Corte Clásico',
      description: 'Corte de cabello tradicional',
      price: 25000,
      duration: 30,
      category: 'corte',
      isActive: true
    });

    // Crear productos de inventario de prueba
    testInventory = await Inventory.create({
      name: 'Shampoo Premium',
      description: 'Shampoo de alta calidad',
      price: 45000,
      cost: 25000,
      quantity: 100,
      minStock: 10,
      category: 'cuidado_capilar',
      isActive: true
    });

    // Obtener token de autenticación
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin.test@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    // Limpiar base de datos
    await User.deleteMany({});
    await Sale.deleteMany({});
    await Appointment.deleteMany({});
    await Barber.deleteMany({});
    await Service.deleteMany({});
    await Inventory.deleteMany({});
  });

  describe('GET /api/v1/sales/detailed-report', () => {
    beforeEach(async () => {
      // Limpiar ventas antes de cada test
      await Sale.deleteMany({});
      
      // Crear ventas de prueba
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const today = new Date();

      // Venta 1 - Ayer
      await Sale.create({
        barber: testBarber._id,
        items: [{
          product: testInventory._id,
          quantity: 2,
          unitPrice: 45000,
          totalPrice: 90000
        }],
        totalAmount: 90000,
        paymentMethod: 'efectivo',
        customer: {
          name: 'Cliente Test 1',
          phone: '1234567890'
        },
        saleDate: yesterday,
        saleType: 'product'
      });

      // Venta 2 - Hoy
      await Sale.create({
        barber: testBarber._id,
        items: [{
          product: testInventory._id,
          quantity: 1,
          unitPrice: 45000,
          totalPrice: 45000
        }],
        totalAmount: 45000,
        paymentMethod: 'tarjeta',
        customer: {
          name: 'Cliente Test 2',
          phone: '0987654321'
        },
        saleDate: today,
        saleType: 'product'
      });
    });

    it('should return detailed sales report for valid barber and date range', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 2);
      const endDate = new Date();

      const response = await request(app)
        .get(`/api/v1/sales/detailed-report`)
        .query({
          barberId: testBarber._id.toString(),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalRevenue).toBe(135000);
      expect(response.body.data.totalProducts).toBe(3);
      expect(response.body.data.salesByDate).toBeDefined();
      expect(Object.keys(response.body.data.salesByDate)).toHaveLength(2);
    });

    it('should return 400 for missing required parameters', async () => {
      const response = await request(app)
        .get(`/api/v1/sales/detailed-report`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('barberId, startDate y endDate son requeridos');
    });

    it('should return 404 for non-existent barber', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date();

      const response = await request(app)
        .get(`/api/v1/sales/detailed-report`)
        .query({
          barberId: fakeId.toString(),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Barbero no encontrado');
    });

    it('should require authentication', async () => {
      const startDate = new Date();
      const endDate = new Date();

      await request(app)
        .get(`/api/v1/sales/detailed-report`)
        .query({
          barberId: testBarber._id.toString(),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/sales/walk-in-details', () => {
    beforeEach(async () => {
      // Limpiar ventas antes de cada test
      await Sale.deleteMany({});
      
      // Crear cortes walk-in de prueba
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const today = new Date();

      // Corte walk-in 1 - Ayer
      await Sale.create({
        barber: testBarber._id,
        service: testService._id,
        totalAmount: 25000,
        paymentMethod: 'efectivo',
        customer: {
          name: 'Cliente Walk-in 1',
          phone: '1234567890'
        },
        saleDate: yesterday,
        saleType: 'walk_in'
      });

      // Corte walk-in 2 - Hoy
      await Sale.create({
        barber: testBarber._id,
        service: testService._id,
        totalAmount: 25000,
        paymentMethod: 'tarjeta',
        customer: {
          name: 'Cliente Walk-in 2',
          phone: '0987654321'
        },
        saleDate: today,
        saleType: 'walk_in'
      });
    });

    it('should return detailed walk-in cuts report', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 2);
      const endDate = new Date();

      const response = await request(app)
        .get(`/api/v1/sales/walk-in-details`)
        .query({
          barberId: testBarber._id.toString(),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalRevenue).toBe(50000);
      expect(response.body.data.totalCuts).toBe(2);
      expect(response.body.data.cutsByDate).toBeDefined();
      expect(Object.keys(response.body.data.cutsByDate)).toHaveLength(2);
    });

    it('should return empty data for date range without walk-ins', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 10);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - 5);

      const response = await request(app)
        .get(`/api/v1/sales/walk-in-details`)
        .query({
          barberId: testBarber._id.toString(),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalRevenue).toBe(0);
      expect(response.body.data.totalCuts).toBe(0);
      expect(Object.keys(response.body.data.cutsByDate)).toHaveLength(0);
    });
  });

  describe('GET /api/v1/appointments/completed-details', () => {
    beforeEach(async () => {
      // Limpiar citas antes de cada test
      await Appointment.deleteMany({});
      
      // Crear citas completadas de prueba
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(10, 0, 0, 0);
      
      const today = new Date();
      today.setHours(14, 0, 0, 0);

      // Cita completada 1 - Ayer
      await Appointment.create({
        client: {
          name: 'Cliente Cita 1',
          phone: '1234567890',
          email: 'cliente1@example.com'
        },
        barber: testBarber._id,
        services: [testService._id],
        appointmentDate: yesterday,
        startTime: '10:00',
        endTime: '10:30',
        status: 'completed',
        totalPrice: 25000,
        paymentMethod: 'efectivo',
        notes: 'Corte estándar completado'
      });

      // Cita completada 2 - Hoy
      await Appointment.create({
        client: {
          name: 'Cliente Cita 2',
          phone: '0987654321',
          email: 'cliente2@example.com'
        },
        barber: testBarber._id,
        services: [testService._id],
        appointmentDate: today,
        startTime: '14:00',
        endTime: '14:30',
        status: 'completed',
        totalPrice: 25000,
        paymentMethod: 'tarjeta',
        notes: 'Cliente satisfecho'
      });
    });

    it('should return detailed completed appointments report', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 2);
      const endDate = new Date();

      const response = await request(app)
        .get(`/api/v1/appointments/completed-details`)
        .query({
          barberId: testBarber._id.toString(),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.totalRevenue).toBe(50000);
      expect(response.body.data.totalAppointments).toBe(2);
      expect(response.body.data.appointmentsByDate).toBeDefined();
      expect(Object.keys(response.body.data.appointmentsByDate)).toHaveLength(2);
    });

    it('should include client and service information', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date();

      const response = await request(app)
        .get(`/api/v1/appointments/completed-details`)
        .query({
          barberId: testBarber._id.toString(),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const appointmentsByDate = response.body.data.appointmentsByDate;
      const firstDateKey = Object.keys(appointmentsByDate)[0];
      const firstAppointment = appointmentsByDate[firstDateKey].appointments[0];

      expect(firstAppointment).toHaveProperty('client');
      expect(firstAppointment).toHaveProperty('services');
      expect(firstAppointment).toHaveProperty('startTime');
      expect(firstAppointment).toHaveProperty('endTime');
      expect(firstAppointment).toHaveProperty('totalPrice');
      expect(firstAppointment.client).toHaveProperty('name');
      expect(firstAppointment.services).toBeInstanceOf(Array);
    });

    it('should only return completed appointments', async () => {
      // Crear una cita pendiente que NO debe aparecer
      await Appointment.create({
        client: {
          name: 'Cliente Pendiente',
          phone: '1111111111',
          email: 'pendiente@example.com'
        },
        barber: testBarber._id,
        services: [testService._id],
        appointmentDate: new Date(),
        startTime: '16:00',
        endTime: '16:30',
        status: 'confirmed', // NO completed
        totalPrice: 25000
      });

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date();

      const response = await request(app)
        .get(`/api/v1/appointments/completed-details`)
        .query({
          barberId: testBarber._id.toString(),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Solo deben aparecer las 2 citas completed, no la confirmed
      expect(response.body.data.totalAppointments).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid date formats', async () => {
      const response = await request(app)
        .get(`/api/v1/sales/detailed-report`)
        .query({
          barberId: testBarber._id.toString(),
          startDate: 'invalid-date',
          endDate: 'also-invalid'
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle invalid ObjectId format', async () => {
      const response = await request(app)
        .get(`/api/v1/sales/detailed-report`)
        .query({
          barberId: 'invalid-objectid',
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString()
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
