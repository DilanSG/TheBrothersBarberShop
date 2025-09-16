const mongoose = require('mongoose');
const SaleService = require('../../src/services/saleService.js');
const AppointmentService = require('../../src/services/appointmentService.js');
const Sale = require('../../src/models/Sale.js');
const Appointment = require('../../src/models/Appointment.js');
const Barber = require('../../src/models/Barber.js');
const Service = require('../../src/models/Service.js');
const Inventory = require('../../src/models/Inventory.js');

describe('Detailed Reports Services', () => {
  let testBarber;
  let testService;
  let testInventory;

  beforeAll(async () => {
    // Configurar datos de prueba
    testBarber = await Barber.create({
      name: 'Test Barber Service',
      email: 'testservice@example.com',
      phone: '1234567890',
      specialties: ['corte'],
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

    testService = await Service.create({
      name: 'Corte Test Service',
      description: 'Corte para testing',
      price: 30000,
      duration: 30,
      category: 'corte',
      isActive: true
    });

    testInventory = await Inventory.create({
      name: 'Producto Test Service',
      description: 'Producto para testing',
      price: 50000,
      cost: 30000,
      quantity: 100,
      minStock: 10,
      category: 'cuidado_capilar',
      isActive: true
    });
  });

  afterAll(async () => {
    await Sale.deleteMany({});
    await Appointment.deleteMany({});
    await Barber.deleteMany({});
    await Service.deleteMany({});
    await Inventory.deleteMany({});
  });

  describe('SaleService.getDetailedSalesReport', () => {
    beforeEach(async () => {
      await Sale.deleteMany({});
    });

    it('should return detailed sales report grouped by date', async () => {
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      // Crear ventas de prueba
      await Sale.create({
        barber: testBarber._id,
        items: [{
          product: testInventory._id,
          quantity: 2,
          unitPrice: 50000,
          totalPrice: 100000
        }],
        totalAmount: 100000,
        paymentMethod: 'efectivo',
        customer: { name: 'Cliente 1', phone: '123' },
        saleDate: yesterday,
        saleType: 'product'
      });

      await Sale.create({
        barber: testBarber._id,
        items: [{
          product: testInventory._id,
          quantity: 1,
          unitPrice: 50000,
          totalPrice: 50000
        }],
        totalAmount: 50000,
        paymentMethod: 'tarjeta',
        customer: { name: 'Cliente 2', phone: '456' },
        saleDate: today,
        saleType: 'product'
      });

      const result = await SaleService.getDetailedSalesReport(
        testBarber._id,
        yesterday,
        today
      );

      expect(result).toBeDefined();
      expect(result.totalRevenue).toBe(150000);
      expect(result.totalProducts).toBe(3);
      expect(result.salesByDate).toBeDefined();
      expect(Object.keys(result.salesByDate)).toHaveLength(2);

      // Verificar estructura de datos por día
      const yesterdayKey = yesterday.toISOString().split('T')[0];
      const todayKey = today.toISOString().split('T')[0];
      
      expect(result.salesByDate[yesterdayKey]).toBeDefined();
      expect(result.salesByDate[yesterdayKey].dayTotal).toBe(100000);
      expect(result.salesByDate[yesterdayKey].dayProductCount).toBe(2);
      expect(result.salesByDate[yesterdayKey].sales).toHaveLength(1);

      expect(result.salesByDate[todayKey]).toBeDefined();
      expect(result.salesByDate[todayKey].dayTotal).toBe(50000);
      expect(result.salesByDate[todayKey].dayProductCount).toBe(1);
    });

    it('should return empty result for barber without sales', async () => {
      const startDate = new Date();
      const endDate = new Date();

      const result = await SaleService.getDetailedSalesReport(
        testBarber._id,
        startDate,
        endDate
      );

      expect(result.totalRevenue).toBe(0);
      expect(result.totalProducts).toBe(0);
      expect(Object.keys(result.salesByDate)).toHaveLength(0);
    });

    it('should filter sales by date range correctly', async () => {
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      // Venta fuera del rango (muy antigua)
      await Sale.create({
        barber: testBarber._id,
        items: [{ 
          product: testInventory._id, 
          quantity: 1, 
          unitPrice: 50000, 
          totalPrice: 50000 
        }],
        totalAmount: 50000,
        paymentMethod: 'efectivo',
        customer: { name: 'Cliente Antiguo', phone: '999' },
        saleDate: twoDaysAgo,
        saleType: 'product'
      });

      // Venta dentro del rango
      await Sale.create({
        barber: testBarber._id,
        items: [{ 
          product: testInventory._id, 
          quantity: 1, 
          unitPrice: 50000, 
          totalPrice: 50000 
        }],
        totalAmount: 50000,
        paymentMethod: 'efectivo',
        customer: { name: 'Cliente Reciente', phone: '111' },
        saleDate: today,
        saleType: 'product'
      });

      // Solo buscar desde ayer hasta hoy
      const result = await SaleService.getDetailedSalesReport(
        testBarber._id,
        yesterday,
        today
      );

      expect(result.totalRevenue).toBe(50000); // Solo la venta de hoy
      expect(result.totalProducts).toBe(1);
      expect(Object.keys(result.salesByDate)).toHaveLength(1);
    });
  });

  describe('SaleService.getWalkInDetails', () => {
    beforeEach(async () => {
      await Sale.deleteMany({});
    });

    it('should return detailed walk-in cuts report', async () => {
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await Sale.create({
        barber: testBarber._id,
        service: testService._id,
        totalAmount: 30000,
        paymentMethod: 'efectivo',
        customer: { name: 'Cliente Walk-in 1', phone: '123' },
        saleDate: yesterday,
        saleType: 'walk_in'
      });

      await Sale.create({
        barber: testBarber._id,
        service: testService._id,
        totalAmount: 30000,
        paymentMethod: 'tarjeta',
        customer: { name: 'Cliente Walk-in 2', phone: '456' },
        saleDate: today,
        saleType: 'walk_in'
      });

      const result = await SaleService.getWalkInDetails(
        testBarber._id,
        yesterday,
        today
      );

      expect(result.totalRevenue).toBe(60000);
      expect(result.totalCuts).toBe(2);
      expect(Object.keys(result.cutsByDate)).toHaveLength(2);
    });

    it('should only include walk-in sales', async () => {
      const today = new Date();

      // Crear una venta de producto (NO debe incluirse)
      await Sale.create({
        barber: testBarber._id,
        items: [{ 
          product: testInventory._id, 
          quantity: 1, 
          unitPrice: 50000, 
          totalPrice: 50000 
        }],
        totalAmount: 50000,
        paymentMethod: 'efectivo',
        customer: { name: 'Cliente Producto', phone: '999' },
        saleDate: today,
        saleType: 'product'
      });

      // Crear corte walk-in (SÍ debe incluirse)
      await Sale.create({
        barber: testBarber._id,
        service: testService._id,
        totalAmount: 30000,
        paymentMethod: 'efectivo',
        customer: { name: 'Cliente Walk-in', phone: '111' },
        saleDate: today,
        saleType: 'walk_in'
      });

      const result = await SaleService.getWalkInDetails(
        testBarber._id,
        today,
        today
      );

      expect(result.totalRevenue).toBe(30000); // Solo el walk-in
      expect(result.totalCuts).toBe(1);
    });
  });

  describe('AppointmentService.getDetailedCompletedReport', () => {
    beforeEach(async () => {
      await Appointment.deleteMany({});
    });

    it('should return detailed completed appointments report', async () => {
      const today = new Date();
      today.setHours(10, 0, 0, 0);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(14, 0, 0, 0);

      await Appointment.create({
        client: {
          name: 'Cliente Cita 1',
          phone: '123',
          email: 'cliente1@test.com'
        },
        barber: testBarber._id,
        services: [testService._id],
        appointmentDate: yesterday,
        startTime: '14:00',
        endTime: '14:30',
        status: 'completed',
        totalPrice: 30000,
        paymentMethod: 'efectivo'
      });

      await Appointment.create({
        client: {
          name: 'Cliente Cita 2',
          phone: '456',
          email: 'cliente2@test.com'
        },
        barber: testBarber._id,
        services: [testService._id],
        appointmentDate: today,
        startTime: '10:00',
        endTime: '10:30',
        status: 'completed',
        totalPrice: 30000,
        paymentMethod: 'tarjeta'
      });

      const result = await AppointmentService.getDetailedCompletedReport(
        testBarber._id,
        yesterday,
        today
      );

      expect(result.totalRevenue).toBe(60000);
      expect(result.totalAppointments).toBe(2);
      expect(Object.keys(result.appointmentsByDate)).toHaveLength(2);
    });

    it('should only include completed appointments', async () => {
      const today = new Date();
      today.setHours(10, 0, 0, 0);

      // Cita completada (SÍ debe incluirse)
      await Appointment.create({
        client: {
          name: 'Cliente Completado',
          phone: '123',
          email: 'completado@test.com'
        },
        barber: testBarber._id,
        services: [testService._id],
        appointmentDate: today,
        startTime: '10:00',
        endTime: '10:30',
        status: 'completed',
        totalPrice: 30000,
        paymentMethod: 'efectivo'
      });

      // Cita pendiente (NO debe incluirse)
      await Appointment.create({
        client: {
          name: 'Cliente Pendiente',
          phone: '456',
          email: 'pendiente@test.com'
        },
        barber: testBarber._id,
        services: [testService._id],
        appointmentDate: today,
        startTime: '11:00',
        endTime: '11:30',
        status: 'confirmed', // NO completed
        totalPrice: 30000
      });

      const result = await AppointmentService.getDetailedCompletedReport(
        testBarber._id,
        today,
        today
      );

      expect(result.totalRevenue).toBe(30000); // Solo la completada
      expect(result.totalAppointments).toBe(1);
    });

    it('should populate client and service information', async () => {
      const today = new Date();
      today.setHours(10, 0, 0, 0);

      await Appointment.create({
        client: {
          name: 'Cliente Test Population',
          phone: '123',
          email: 'population@test.com'
        },
        barber: testBarber._id,
        services: [testService._id],
        appointmentDate: today,
        startTime: '10:00',
        endTime: '10:30',
        status: 'completed',
        totalPrice: 30000,
        paymentMethod: 'efectivo',
        notes: 'Test population'
      });

      const result = await AppointmentService.getDetailedCompletedReport(
        testBarber._id,
        today,
        today
      );

      const todayKey = today.toISOString().split('T')[0];
      const appointment = result.appointmentsByDate[todayKey].appointments[0];

      expect(appointment.client).toBeDefined();
      expect(appointment.client.name).toBe('Cliente Test Population');
      expect(appointment.services).toBeDefined();
      expect(appointment.services).toHaveLength(1);
      expect(appointment.services[0].name).toBe('Corte Test Service');
      expect(appointment.startTime).toBe('10:00');
      expect(appointment.endTime).toBe('10:30');
      expect(appointment.notes).toBe('Test population');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid barber ID in sales service', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const today = new Date();

      const result = await SaleService.getDetailedSalesReport(fakeId, today, today);
      
      expect(result.totalRevenue).toBe(0);
      expect(result.totalProducts).toBe(0);
      expect(Object.keys(result.salesByDate)).toHaveLength(0);
    });

    it('should handle invalid date range', async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - 5); // End before start

      const result = await SaleService.getDetailedSalesReport(
        testBarber._id,
        startDate,
        endDate
      );

      expect(result.totalRevenue).toBe(0);
      expect(result.totalProducts).toBe(0);
    });
  });
});
