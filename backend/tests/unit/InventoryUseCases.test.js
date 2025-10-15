/**
 * Tests Unitarios para InventoryUseCases
 * Valida gestión de stock, productos y alertas
 */

import InventoryUseCases from '../../src/core/application/usecases/InventoryUseCases.js';
import Product from '../../src/core/domain/entities/Product.js';
import Sale from '../../src/core/domain/entities/Sale.js';

// Mocks
jest.mock('../../src/core/domain/entities/Product.js');
jest.mock('../../src/core/domain/entities/Sale.js');

describe('InventoryUseCases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    it('debería crear producto correctamente', async () => {
      const productData = {
        name: 'Gel Fijador',
        category: 'styling',
        price: 15000,
        cost: 8000,
        stock: 20,
        minStock: 5,
        barcode: '7891234567890'
      };

      const mockProduct = {
        _id: 'product123',
        ...productData,
        save: jest.fn().mockResolvedValue(true)
      };

      Product.findOne = jest.fn().mockResolvedValue(null);
      Product.mockImplementation(() => mockProduct);

      const result = await InventoryUseCases.createProduct(productData);

      expect(Product.findOne).toHaveBeenCalledWith({ barcode: productData.barcode });
      expect(mockProduct.save).toHaveBeenCalled();
      expect(result).toHaveProperty('_id', 'product123');
      expect(result).toHaveProperty('name', 'Gel Fijador');
    });

    it('debería rechazar producto con código de barras duplicado', async () => {
      const productData = {
        name: 'Gel Fijador',
        barcode: '7891234567890'
      };

      const existingProduct = {
        _id: 'existing123',
        barcode: '7891234567890'
      };

      Product.findOne = jest.fn().mockResolvedValue(existingProduct);

      await expect(InventoryUseCases.createProduct(productData)).rejects.toThrow('Código de barras ya existe');
    });

    it('debería validar stock mínimo mayor a cero', async () => {
      const productData = {
        name: 'Gel Fijador',
        stock: 20,
        minStock: -5 // Inválido
      };

      await expect(InventoryUseCases.createProduct(productData)).rejects.toThrow('Stock mínimo debe ser mayor a 0');
    });

    it('debería calcular margen de ganancia automáticamente', async () => {
      const productData = {
        name: 'Gel Fijador',
        price: 15000,
        cost: 8000,
        stock: 20,
        minStock: 5
      };

      const mockProduct = {
        _id: 'product123',
        ...productData,
        profitMargin: 0,
        save: jest.fn().mockResolvedValue(true)
      };

      Product.findOne = jest.fn().mockResolvedValue(null);
      Product.mockImplementation(() => mockProduct);

      await InventoryUseCases.createProduct(productData);

      // Margen = ((15000 - 8000) / 8000) * 100 = 87.5%
      expect(mockProduct.profitMargin).toBeCloseTo(87.5, 1);
    });
  });

  describe('updateStock', () => {
    it('debería actualizar stock correctamente', async () => {
      const productId = 'product123';
      const stockChange = 10;

      const mockProduct = {
        _id: productId,
        name: 'Gel Fijador',
        stock: 20,
        minStock: 5,
        save: jest.fn().mockResolvedValue(true)
      };

      Product.findById = jest.fn().mockResolvedValue(mockProduct);

      const result = await InventoryUseCases.updateStock(productId, stockChange);

      expect(mockProduct.stock).toBe(30); // 20 + 10
      expect(mockProduct.save).toHaveBeenCalled();
      expect(result).toHaveProperty('stock', 30);
    });

    it('debería disminuir stock correctamente', async () => {
      const productId = 'product123';
      const stockChange = -5;

      const mockProduct = {
        _id: productId,
        name: 'Gel Fijador',
        stock: 20,
        minStock: 5,
        save: jest.fn().mockResolvedValue(true)
      };

      Product.findById = jest.fn().mockResolvedValue(mockProduct);

      const result = await InventoryUseCases.updateStock(productId, stockChange);

      expect(mockProduct.stock).toBe(15); // 20 - 5
      expect(result).toHaveProperty('stock', 15);
    });

    it('debería rechazar stock negativo', async () => {
      const productId = 'product123';
      const stockChange = -25; // Mayor que stock actual

      const mockProduct = {
        _id: productId,
        name: 'Gel Fijador',
        stock: 20
      };

      Product.findById = jest.fn().mockResolvedValue(mockProduct);

      await expect(InventoryUseCases.updateStock(productId, stockChange))
        .rejects.toThrow('Stock insuficiente');
    });

    it('debería generar alerta cuando stock cae debajo del mínimo', async () => {
      const productId = 'product123';
      const stockChange = -16; // Dejará en 4, debajo del mínimo (5)

      const mockProduct = {
        _id: productId,
        name: 'Gel Fijador',
        stock: 20,
        minStock: 5,
        lowStockAlert: false,
        save: jest.fn().mockResolvedValue(true)
      };

      Product.findById = jest.fn().mockResolvedValue(mockProduct);

      const result = await InventoryUseCases.updateStock(productId, stockChange);

      expect(mockProduct.stock).toBe(4);
      expect(mockProduct.lowStockAlert).toBe(true);
      expect(result).toHaveProperty('alert', true);
    });
  });

  describe('getLowStockProducts', () => {
    it('debería retornar productos con stock bajo', async () => {
      const mockProducts = [
        { _id: 'p1', name: 'Gel', stock: 3, minStock: 5 },
        { _id: 'p2', name: 'Cera', stock: 2, minStock: 5 }
      ];

      Product.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockProducts)
      });

      const result = await InventoryUseCases.getLowStockProducts();

      expect(Product.find).toHaveBeenCalledWith({
        $expr: { $lt: ['$stock', '$minStock'] },
        isActive: true
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('name', 'Gel');
    });

    it('debería ordenar por urgencia (menor stock primero)', async () => {
      const mockProducts = [
        { _id: 'p1', name: 'Cera', stock: 1, minStock: 5 },
        { _id: 'p2', name: 'Gel', stock: 3, minStock: 5 }
      ];

      Product.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockProducts)
      });

      const result = await InventoryUseCases.getLowStockProducts();

      expect(result[0].stock).toBeLessThan(result[1].stock);
    });
  });

  describe('getProductMovements', () => {
    it('debería obtener historial de movimientos de un producto', async () => {
      const productId = 'product123';
      const filters = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31')
      };

      const mockSales = [
        {
          _id: 'sale1',
          date: new Date('2025-06-15'),
          products: [{ product: productId, quantity: 2 }]
        },
        {
          _id: 'sale2',
          date: new Date('2025-07-20'),
          products: [{ product: productId, quantity: 3 }]
        }
      ];

      Sale.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockSales)
        })
      });

      const result = await InventoryUseCases.getProductMovements(productId, filters);

      expect(Sale.find).toHaveBeenCalledWith({
        'products.product': productId,
        date: { $gte: filters.startDate, $lte: filters.endDate }
      });
      expect(result).toHaveLength(2);
    });

    it('debería calcular total vendido del producto', async () => {
      const productId = 'product123';

      const mockSales = [
        { products: [{ product: productId, quantity: 2 }] },
        { products: [{ product: productId, quantity: 3 }] },
        { products: [{ product: productId, quantity: 5 }] }
      ];

      Sale.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockSales)
        })
      });

      const result = await InventoryUseCases.getProductMovements(productId);
      const totalSold = result.reduce((sum, sale) => {
        const productInSale = sale.products.find(p => p.product === productId);
        return sum + (productInSale?.quantity || 0);
      }, 0);

      expect(totalSold).toBe(10); // 2 + 3 + 5
    });
  });

  describe('bulkUpdatePrices', () => {
    it('debería actualizar precios en masa con porcentaje', async () => {
      const updates = {
        category: 'styling',
        percentageIncrease: 10 // 10% aumento
      };

      const mockProducts = [
        { _id: 'p1', name: 'Gel', price: 10000, cost: 5000, save: jest.fn() },
        { _id: 'p2', name: 'Cera', price: 15000, cost: 8000, save: jest.fn() }
      ];

      Product.find = jest.fn().mockResolvedValue(mockProducts);

      await InventoryUseCases.bulkUpdatePrices(updates);

      expect(mockProducts[0].price).toBe(11000); // 10000 + 10%
      expect(mockProducts[1].price).toBe(16500); // 15000 + 10%
      expect(mockProducts[0].save).toHaveBeenCalled();
      expect(mockProducts[1].save).toHaveBeenCalled();
    });

    it('debería recalcular márgenes después de actualizar precios', async () => {
      const updates = {
        category: 'styling',
        percentageIncrease: 20
      };

      const mockProducts = [
        { _id: 'p1', price: 10000, cost: 5000, profitMargin: 100, save: jest.fn() }
      ];

      Product.find = jest.fn().mockResolvedValue(mockProducts);

      await InventoryUseCases.bulkUpdatePrices(updates);

      // Nuevo precio: 12000, Costo: 5000
      // Margen = ((12000 - 5000) / 5000) * 100 = 140%
      expect(mockProducts[0].profitMargin).toBeCloseTo(140, 1);
    });
  });

  describe('validateStock', () => {
    it('debería validar stock suficiente para venta', async () => {
      const items = [
        { productId: 'p1', quantity: 5 },
        { productId: 'p2', quantity: 3 }
      ];

      const mockProducts = [
        { _id: 'p1', name: 'Gel', stock: 10 },
        { _id: 'p2', name: 'Cera', stock: 5 }
      ];

      Product.findById = jest.fn()
        .mockResolvedValueOnce(mockProducts[0])
        .mockResolvedValueOnce(mockProducts[1]);

      const result = await InventoryUseCases.validateStock(items);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('debería detectar stock insuficiente', async () => {
      const items = [
        { productId: 'p1', quantity: 15 }, // Stock insuficiente
        { productId: 'p2', quantity: 3 }
      ];

      const mockProducts = [
        { _id: 'p1', name: 'Gel', stock: 10 },
        { _id: 'p2', name: 'Cera', stock: 5 }
      ];

      Product.findById = jest.fn()
        .mockResolvedValueOnce(mockProducts[0])
        .mockResolvedValueOnce(mockProducts[1]);

      const result = await InventoryUseCases.validateStock(items);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Gel');
      expect(result.errors[0]).toContain('Stock insuficiente');
    });

    it('debería rechazar productos inactivos', async () => {
      const items = [
        { productId: 'p1', quantity: 5 }
      ];

      const mockProduct = {
        _id: 'p1',
        name: 'Gel',
        stock: 10,
        isActive: false
      };

      Product.findById = jest.fn().mockResolvedValue(mockProduct);

      const result = await InventoryUseCases.validateStock(items);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('no está disponible');
    });
  });

  describe('getInventoryValue', () => {
    it('debería calcular valor total del inventario', async () => {
      const mockProducts = [
        { _id: 'p1', name: 'Gel', stock: 10, cost: 5000 },
        { _id: 'p2', name: 'Cera', stock: 5, cost: 8000 },
        { _id: 'p3', name: 'Shampoo', stock: 15, cost: 12000 }
      ];

      Product.find = jest.fn().mockResolvedValue(mockProducts);

      const result = await InventoryUseCases.getInventoryValue();

      // (10 * 5000) + (5 * 8000) + (15 * 12000) = 270000
      expect(result.totalValue).toBe(270000);
      expect(result.totalProducts).toBe(3);
      expect(result.totalUnits).toBe(30);
    });

    it('debería filtrar productos inactivos', async () => {
      const mockProducts = [
        { _id: 'p1', stock: 10, cost: 5000, isActive: true }
      ];

      Product.find = jest.fn().mockResolvedValue(mockProducts);

      await InventoryUseCases.getInventoryValue();

      expect(Product.find).toHaveBeenCalledWith({ isActive: true });
    });
  });
});
