/**
 * Tests Unitarios para SaleUseCases
 * Valida ventas, cálculos, barberos y estadísticas
 */

import SaleUseCases from '../../src/core/application/usecases/SaleUseCases.js';
import Sale from '../../src/core/domain/entities/Sale.js';
import Barber from '../../src/core/domain/entities/Barber.js';
import Service from '../../src/core/domain/entities/Service.js';
import Inventory from '../../src/core/domain/entities/Inventory.js';

// Mocks
jest.mock('../../src/core/domain/entities/Sale.js');
jest.mock('../../src/core/domain/entities/Barber.js');
jest.mock('../../src/core/domain/entities/Service.js');
jest.mock('../../src/core/domain/entities/Inventory.js');

describe('SaleUseCases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSale', () => {
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
        _id: 'sale789',
        ...saleData,
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          _id: 'sale789',
          ...saleData,
          barber: mockBarber,
          services: mockServices
        })
      };

      Barber.findById = jest.fn().mockResolvedValue(mockBarber);
      Service.find = jest.fn().mockResolvedValue(mockServices);
      Sale.mockImplementation(() => mockSale);

      const result = await SaleUseCases.createSale(saleData);

      expect(Barber.findById).toHaveBeenCalledWith('barber123');
      expect(Service.find).toHaveBeenCalledWith({ _id: { $in: saleData.services } });
      expect(mockSale.save).toHaveBeenCalled();
      expect(mockBarber.save).toHaveBeenCalled();
      expect(result).toHaveProperty('_id', 'sale789');
    });

    it('debería crear venta con productos y actualizar inventario', async () => {
      const saleData = {
        barber: 'barber123',
        client: null,
        services: [],
        products: [
          { product: 'product1', quantity: 2, price: 15000 },
          { product: 'product2', quantity: 1, price: 20000 }
        ],
        paymentMethod: 'card',
        total: 50000
      };

      const mockBarber = {
        _id: 'barber123',
        isActive: true,
        totalSales: 0,
        save: jest.fn().mockResolvedValue(true)
      };

      const mockProducts = [
        { _id: 'product1', name: 'Gel', stock: 10, save: jest.fn().mockResolvedValue(true) },
        { _id: 'product2', name: 'Cera', stock: 5, save: jest.fn().mockResolvedValue(true) }
      ];

      const mockSale = {
        _id: 'sale789',
        ...saleData,
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          _id: 'sale789',
          ...saleData
        })
      };

      Barber.findById = jest.fn().mockResolvedValue(mockBarber);
      Inventory.findById = jest.fn()
        .mockResolvedValueOnce(mockProducts[0])
        .mockResolvedValueOnce(mockProducts[1]);
      Sale.mockImplementation(() => mockSale);

      const result = await SaleUseCases.createSale(saleData);

      expect(mockProducts[0].stock).toBe(8); // 10 - 2
      expect(mockProducts[1].stock).toBe(4); // 5 - 1
      expect(mockProducts[0].save).toHaveBeenCalled();
      expect(mockProducts[1].save).toHaveBeenCalled();
      expect(result).toHaveProperty('_id', 'sale789');
    });

    it('debería rechazar venta con barbero inactivo', async () => {
      const saleData = {
        barber: 'barber123',
        client: 'client456',
        services: ['service1'],
        products: [],
        paymentMethod: 'cash',
        total: 25000
      };

      const mockBarber = {
        _id: 'barber123',
        name: 'Juan Barbero',
        isActive: false
      };

      Barber.findById = jest.fn().mockResolvedValue(mockBarber);

      await expect(SaleUseCases.createSale(saleData)).rejects.toThrow('Barbero inactivo');
    });

    it('debería rechazar venta con stock insuficiente', async () => {
      const saleData = {
        barber: 'barber123',
        client: null,
        services: [],
        products: [
          { product: 'product1', quantity: 10, price: 15000 }
        ],
        paymentMethod: 'cash',
        total: 150000
      };

      const mockBarber = {
        _id: 'barber123',
        isActive: true
      };

      const mockProduct = {
        _id: 'product1',
        name: 'Gel',
        stock: 5 // Stock insuficiente
      };

      Barber.findById = jest.fn().mockResolvedValue(mockBarber);
      Inventory.findById = jest.fn().mockResolvedValue(mockProduct);

      await expect(SaleUseCases.createSale(saleData)).rejects.toThrow('Stock insuficiente para Gel');
    });

    it('debería calcular total correctamente', async () => {
      const saleData = {
        barber: 'barber123',
        client: 'client456',
        services: ['service1'],
        products: [
          { product: 'product1', quantity: 2, price: 15000 }
        ],
        paymentMethod: 'cash'
      };

      const mockBarber = {
        _id: 'barber123',
        isActive: true,
        totalSales: 0,
        save: jest.fn().mockResolvedValue(true)
      };

      const mockServices = [
        { _id: 'service1', name: 'Corte', price: 25000, isActive: true }
      ];

      const mockProduct = {
        _id: 'product1',
        stock: 10,
        save: jest.fn().mockResolvedValue(true)
      };

      const mockSale = {
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          _id: 'sale789',
          total: 55000 // 25000 + (15000 * 2)
        })
      };

      Barber.findById = jest.fn().mockResolvedValue(mockBarber);
      Service.find = jest.fn().mockResolvedValue(mockServices);
      Inventory.findById = jest.fn().mockResolvedValue(mockProduct);
      Sale.mockImplementation(() => mockSale);

      const result = await SaleUseCases.createSale(saleData);

      expect(result.total).toBe(55000);
    });
  });

  describe('findBarberByIdOrUserId', () => {
    it('debería encontrar barbero por ID directo', async () => {
      const barberId = 'barber123';
      const mockBarber = {
        _id: 'barber123',
        name: 'Juan Barbero',
        user: 'user456'
      };

      Barber.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockBarber)
      });

      const result = await SaleUseCases.findBarberByIdOrUserId(barberId);

      expect(Barber.findById).toHaveBeenCalledWith(barberId);
      expect(result).toEqual(mockBarber);
    });

    it('debería encontrar barbero por userId si no encuentra por ID', async () => {
      const userId = 'user456';
      const mockBarber = {
        _id: 'barber123',
        name: 'Juan Barbero',
        user: userId
      };

      Barber.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });
      Barber.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockBarber)
      });

      const result = await SaleUseCases.findBarberByIdOrUserId(userId);

      expect(Barber.findOne).toHaveBeenCalledWith({ user: userId });
      expect(result).toEqual(mockBarber);
    });

    it('debería retornar null si no encuentra barbero', async () => {
      const invalidId = 'invalid123';

      Barber.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });
      Barber.findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      const result = await SaleUseCases.findBarberByIdOrUserId(invalidId);

      expect(result).toBeNull();
    });
  });

  describe('getSalesByBarber', () => {
    it('debería obtener ventas de un barbero con filtros de fecha', async () => {
      const barberId = 'barber123';
      const filters = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31')
      };

      const mockSales = [
        { _id: 'sale1', total: 25000, date: new Date('2025-06-15') },
        { _id: 'sale2', total: 50000, date: new Date('2025-07-20') }
      ];

      Sale.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockSales)
        })
      });

      const result = await SaleUseCases.getSalesByBarber(barberId, filters);

      expect(Sale.find).toHaveBeenCalledWith({
        barber: barberId,
        date: {
          $gte: filters.startDate,
          $lte: filters.endDate
        }
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('total', 25000);
    });

    it('debería calcular estadísticas de ventas correctamente', async () => {
      const barberId = 'barber123';
      const mockSales = [
        { _id: 'sale1', total: 25000 },
        { _id: 'sale2', total: 50000 },
        { _id: 'sale3', total: 75000 }
      ];

      Sale.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockSales)
        })
      });

      const result = await SaleUseCases.getSalesByBarber(barberId);
      const stats = SaleUseCases.calculateSalesStats(result);

      expect(stats).toHaveProperty('totalSales', 3);
      expect(stats).toHaveProperty('totalRevenue', 150000);
      expect(stats).toHaveProperty('averageSale', 50000);
    });
  });

  describe('updateBarberStats', () => {
    it('debería actualizar estadísticas del barbero después de venta', async () => {
      const barberId = 'barber123';
      const saleAmount = 50000;

      const mockBarber = {
        _id: barberId,
        totalSales: 10,
        totalRevenue: 500000,
        save: jest.fn().mockResolvedValue(true)
      };

      Barber.findById = jest.fn().mockResolvedValue(mockBarber);

      await SaleUseCases.updateBarberStats(barberId, saleAmount);

      expect(mockBarber.totalSales).toBe(11);
      expect(mockBarber.totalRevenue).toBe(550000);
      expect(mockBarber.save).toHaveBeenCalled();
    });

    it('debería inicializar estadísticas si es primera venta', async () => {
      const barberId = 'barber123';
      const saleAmount = 25000;

      const mockBarber = {
        _id: barberId,
        totalSales: undefined,
        totalRevenue: undefined,
        save: jest.fn().mockResolvedValue(true)
      };

      Barber.findById = jest.fn().mockResolvedValue(mockBarber);

      await SaleUseCases.updateBarberStats(barberId, saleAmount);

      expect(mockBarber.totalSales).toBe(1);
      expect(mockBarber.totalRevenue).toBe(25000);
      expect(mockBarber.save).toHaveBeenCalled();
    });
  });

  describe('cancelSale', () => {
    it('debería cancelar venta y restaurar inventario', async () => {
      const saleId = 'sale789';
      const mockSale = {
        _id: saleId,
        barber: 'barber123',
        products: [
          { product: { _id: 'product1', name: 'Gel' }, quantity: 2 },
          { product: { _id: 'product2', name: 'Cera' }, quantity: 1 }
        ],
        total: 50000,
        status: 'completed',
        save: jest.fn().mockResolvedValue(true)
      };

      const mockProducts = [
        { _id: 'product1', stock: 8, save: jest.fn().mockResolvedValue(true) },
        { _id: 'product2', stock: 4, save: jest.fn().mockResolvedValue(true) }
      ];

      const mockBarber = {
        _id: 'barber123',
        totalSales: 11,
        totalRevenue: 550000,
        save: jest.fn().mockResolvedValue(true)
      };

      Sale.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockSale)
      });
      Inventory.findById = jest.fn()
        .mockResolvedValueOnce(mockProducts[0])
        .mockResolvedValueOnce(mockProducts[1]);
      Barber.findById = jest.fn().mockResolvedValue(mockBarber);

      await SaleUseCases.cancelSale(saleId);

      expect(mockSale.status).toBe('cancelled');
      expect(mockProducts[0].stock).toBe(10); // 8 + 2 restaurado
      expect(mockProducts[1].stock).toBe(5); // 4 + 1 restaurado
      expect(mockBarber.totalSales).toBe(10); // 11 - 1
      expect(mockBarber.totalRevenue).toBe(500000); // 550000 - 50000
    });

    it('debería rechazar cancelación de venta ya cancelada', async () => {
      const saleId = 'sale789';
      const mockSale = {
        _id: saleId,
        status: 'cancelled'
      };

      Sale.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockSale)
      });

      await expect(SaleUseCases.cancelSale(saleId)).rejects.toThrow('Venta ya cancelada');
    });
  });
});
