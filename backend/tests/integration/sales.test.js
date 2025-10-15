/**
 * Tests de Integración - API de Ventas
 * Valida flujo completo de endpoints sales
 */

import request from 'supertest';
import app from '../../src/app.js';
import Sale from '../../src/core/domain/entities/Sale.js';
import Barber from '../../src/core/domain/entities/Barber.js';
import Service from '../../src/core/domain/entities/Service.js';
import Product from '../../src/core/domain/entities/Product.js';
import jwt from 'jsonwebtoken';

// Mocks
jest.mock('../../src/core/domain/entities/Sale.js');
jest.mock('../../src/core/domain/entities/Barber.js');
jest.mock('../../src/core/domain/entities/Service.js');
jest.mock('../../src/core/domain/entities/Product.js');

describe('Sales API Integration Tests', () => {
  let authToken;
  let adminToken;

  beforeAll(() => {
    // Crear tokens de prueba
    authToken = jwt.sign(
      { id: 'barber123', role: 'barber' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { id: 'admin123', role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('POST /api/sales', () => {
    it('debería crear venta con servicios correctamente', async () => {
      const saleData = {
        barber: 'barber123',
        client: 'client456',
        services: ['service1', 'service2'],
        products: [],
        paymentMethod: 'cash',
        total: 50000
      };

      const mockBarber = {
        _id: 'barber123',
        name: 'Juan Barbero',
        isActive: true,
        totalSales: 0,
        save: jest.fn().mockResolvedValue(true)
      };

      const mockServices = [
        { _id: 'service1', name: 'Corte', price: 25000, isActive: true },
        { _id: 'service2', name: 'Barba', price: 25000, isActive: true }
      ];

      const mockSale = {
        _id: 'sale123',
        ...saleData,
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          _id: 'sale123',
          ...saleData,
          barber: mockBarber,
          services: mockServices
        })
      };

      Barber.findById = jest.fn().mockResolvedValue(mockBarber);
      Service.find = jest.fn().mockResolvedValue(mockServices);
      Sale.mockImplementation(() => mockSale);

      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .send(saleData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('_id', 'sale123');
      expect(response.body.data).toHaveProperty('total', 50000);
    });

    it('debería crear venta con productos y actualizar stock', async () => {
      const saleData = {
        barber: 'barber123',
        client: null,
        services: [],
        products: [
          { product: 'product1', quantity: 2, price: 15000 }
        ],
        paymentMethod: 'card',
        total: 30000
      };

      const mockBarber = {
        _id: 'barber123',
        isActive: true,
        totalSales: 0,
        save: jest.fn().mockResolvedValue(true)
      };

      const mockProduct = {
        _id: 'product1',
        name: 'Gel',
        stock: 10,
        save: jest.fn().mockResolvedValue(true)
      };

      const mockSale = {
        _id: 'sale123',
        ...saleData,
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          _id: 'sale123',
          ...saleData
        })
      };

      Barber.findById = jest.fn().mockResolvedValue(mockBarber);
      Product.findById = jest.fn().mockResolvedValue(mockProduct);
      Sale.mockImplementation(() => mockSale);

      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .send(saleData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(mockProduct.stock).toBe(8); // 10 - 2
    });

    it('debería rechazar venta sin autenticación', async () => {
      const saleData = {
        barber: 'barber123',
        services: ['service1'],
        total: 25000
      };

      const response = await request(app)
        .post('/api/sales')
        .send(saleData)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('debería rechazar venta con barbero inactivo', async () => {
      const saleData = {
        barber: 'barber123',
        services: ['service1'],
        total: 25000
      };

      const mockBarber = {
        _id: 'barber123',
        isActive: false
      };

      Barber.findById = jest.fn().mockResolvedValue(mockBarber);

      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .send(saleData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('inactivo');
    });

    it('debería rechazar venta con stock insuficiente', async () => {
      const saleData = {
        barber: 'barber123',
        services: [],
        products: [
          { product: 'product1', quantity: 20, price: 15000 }
        ],
        total: 300000
      };

      const mockBarber = {
        _id: 'barber123',
        isActive: true
      };

      const mockProduct = {
        _id: 'product1',
        name: 'Gel',
        stock: 5 // Insuficiente
      };

      Barber.findById = jest.fn().mockResolvedValue(mockBarber);
      Product.findById = jest.fn().mockResolvedValue(mockProduct);

      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .send(saleData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Stock');
    });

    it('debería validar campos requeridos', async () => {
      const invalidSaleData = {
        // Falta barber, services/products, total
        paymentMethod: 'cash'
      };

      const response = await request(app)
        .post('/api/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidSaleData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/sales', () => {
    it('debería obtener todas las ventas (admin)', async () => {
      const mockSales = [
        { _id: 'sale1', total: 25000, date: new Date() },
        { _id: 'sale2', total: 50000, date: new Date() }
      ];

      Sale.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockSales)
        })
      });

      const response = await request(app)
        .get('/api/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveLength(2);
    });

    it('debería filtrar ventas por fecha', async () => {
      const startDate = '2025-01-01';
      const endDate = '2025-12-31';

      const mockSales = [
        { _id: 'sale1', total: 25000, date: new Date('2025-06-15') }
      ];

      Sale.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockSales)
        })
      });

      const response = await request(app)
        .get(`/api/sales?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Sale.find).toHaveBeenCalledWith(
        expect.objectContaining({
          date: expect.any(Object)
        })
      );
    });

    it('debería filtrar ventas por barbero', async () => {
      const barberId = 'barber123';

      const mockSales = [
        { _id: 'sale1', barber: barberId, total: 25000 }
      ];

      Sale.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockSales)
        })
      });

      const response = await request(app)
        .get(`/api/sales?barber=${barberId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Sale.find).toHaveBeenCalledWith(
        expect.objectContaining({ barber: barberId })
      );
    });

    it('barbero solo debería ver sus propias ventas', async () => {
      const barberId = 'barber123';
      const otherBarber = 'barber456';

      const mockSales = [
        { _id: 'sale1', barber: barberId, total: 25000 }
      ];

      Sale.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockSales)
        })
      });

      // Intentar ver ventas de otro barbero
      const response = await request(app)
        .get(`/api/sales?barber=${otherBarber}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/sales/:id', () => {
    it('debería obtener venta específica por ID', async () => {
      const saleId = 'sale123';
      const mockSale = {
        _id: saleId,
        barber: { _id: 'barber123', name: 'Juan' },
        total: 50000
      };

      Sale.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockSale)
      });

      const response = await request(app)
        .get(`/api/sales/${saleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('_id', saleId);
    });

    it('debería retornar 404 si venta no existe', async () => {
      const saleId = 'nonexistent123';

      Sale.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      const response = await request(app)
        .get(`/api/sales/${saleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('DELETE /api/sales/:id', () => {
    it('admin debería poder cancelar cualquier venta', async () => {
      const saleId = 'sale123';
      const mockSale = {
        _id: saleId,
        barber: 'barber123',
        status: 'completed',
        total: 50000,
        products: [],
        save: jest.fn().mockResolvedValue(true)
      };

      const mockBarber = {
        _id: 'barber123',
        totalSales: 10,
        totalRevenue: 500000,
        save: jest.fn().mockResolvedValue(true)
      };

      Sale.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockSale)
      });
      Barber.findById = jest.fn().mockResolvedValue(mockBarber);

      const response = await request(app)
        .delete(`/api/sales/${saleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(mockSale.status).toBe('cancelled');
    });

    it('debería rechazar cancelación de venta ya cancelada', async () => {
      const saleId = 'sale123';
      const mockSale = {
        _id: saleId,
        status: 'cancelled'
      };

      Sale.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockSale)
      });

      const response = await request(app)
        .delete(`/api/sales/${saleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('cancelada');
    });
  });

  describe('GET /api/sales/stats/summary', () => {
    it('debería retornar estadísticas de ventas', async () => {
      const mockSales = [
        { total: 25000, paymentMethod: 'cash' },
        { total: 50000, paymentMethod: 'card' },
        { total: 75000, paymentMethod: 'cash' }
      ];

      Sale.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockSales)
        })
      });

      const response = await request(app)
        .get('/api/sales/stats/summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('totalSales', 3);
      expect(response.body.data).toHaveProperty('totalRevenue', 150000);
      expect(response.body.data).toHaveProperty('averageSale', 50000);
    });
  });
});
