/**
 * SaleUseCases - Casos de uso para gestión de ventas
 * ✅ MIGRACIÓN COMPLETA A REPOSITORY PATTERN
 *
 * Gestión integral de ventas con Repository Pattern
 */

import { AppError } from '../../../shared/utils/errors.js';
import { logger } from '../../../shared/utils/logger.js';
import DIContainer from '../../../shared/container/index.js';
import Sale from '../../domain/entities/Sale.js';
import Appointment from '../../domain/entities/Appointment.js';

class SaleUseCases {
  constructor() {
    // Obtener repositorios del contenedor DI
    this.saleRepository = DIContainer.get('SaleRepository');
    this.appointmentRepository = DIContainer.get('AppointmentRepository');
    this.inventoryRepository = DIContainer.get('InventoryRepository');
    this.barberRepository = DIContainer.get('BarberRepository');
    logger.debug('SaleUseCases: Repositorios inyectados correctamente');
  }

  // Método estático para obtener instancia con DI
  static getInstance() {
    return new SaleUseCases();
  }

  /**
   * Obtener ventas con filtros (✅ MIGRADO)
   * @param {Object} filters - Filtros de búsqueda
   * @param {Object} pagination - Paginación
   * @returns {Promise<Object>}
   */
  async getSales(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 50 } = pagination;
      
      logger.debug('SaleUseCases: Obteniendo ventas con filtros:', filters);

      // Construir query para repository
      const query = this._buildSalesQuery(filters);

      const result = await this.saleRepository.findAll({
        filters: query,  // Changed from 'filter' to 'filters'
        limit,
        page,
        sort: { createdAt: -1 }
      });

      // The repository returns { sales, total, page, ... }
      if (result && result.sales) {
        logger.debug(`SaleUseCases: Recuperadas ${result.sales.length} ventas`);
        return {
          data: result.sales,
          total: result.total,
          pagination: {
            page: result.page,
            totalPages: result.totalPages,
            hasNextPage: result.hasNextPage,
            hasPrevPage: result.hasPrevPage
          }
        };
      } else {
        logger.warn('SaleUseCases: Respuesta inesperada del repository:', result);
        return {
          data: result || [],
          total: result?.length || 0,
          pagination: { page, limit }
        };
      }
    } catch (error) {
      logger.error('SaleUseCases: Error al obtener ventas:', error);
      throw new AppError('Error al obtener lista de ventas', 500);
    }
  }

  /**
   * Obtener venta por ID (✅ MIGRADO)
   * @param {string} id - ID de la venta
   * @returns {Promise<Object>}
   */
  async getSaleById(id) {
    try {
      logger.debug(`SaleUseCases: Buscando venta por ID: ${id}`);
      
      const sale = await this.saleRepository.findById(id);
      if (!sale) {
        throw new AppError('Venta no encontrada', 404);
      }
      
      logger.debug(`SaleUseCases: Venta encontrada: ${sale._id}`);
      return sale;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`SaleUseCases: Error al obtener venta ${id}:`, error);
      throw new AppError('Error al obtener venta', 500);
    }
  }

  /**
   * Crear nueva venta (✅ MIGRADO)
   * @param {Object} saleData - Datos de la venta
   * @param {Object} user - Usuario que crea la venta
   * @returns {Promise<Object>}
   */
  async createSale(saleData, user) {
    try {
      logger.debug('SaleUseCases: Creando nueva venta');
      
      // Validar inventario si hay productos
      if (saleData.products && saleData.products.length > 0) {
        await this._validateInventoryForSale(saleData.products);
      }

      // Agregar información del usuario
      const enhancedData = {
        ...saleData,
        createdBy: user._id
      };

      const newSale = await this.saleRepository.create(enhancedData);
      
      // Actualizar inventario
      if (saleData.products && saleData.products.length > 0) {
        await this._updateInventoryAfterSale(saleData.products);
      }
      
      logger.info(`SaleUseCases: Venta creada exitosamente: ${newSale._id}`);
      return newSale;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('SaleUseCases: Error al crear venta:', error);
      throw new AppError('Error al crear venta', 500);
    }
  }

  /**
   * Actualizar venta (✅ MIGRADO)
   * @param {string} id - ID de la venta
   * @param {Object} updateData - Datos a actualizar
   * @param {Object} user - Usuario que actualiza
   * @returns {Promise<Object>}
   */
  async updateSale(id, updateData, user) {
    try {
      logger.debug(`SaleUseCases: Actualizando venta ${id}`);
      
      const updatedSale = await this.saleRepository.update(id, updateData);
      
      logger.info(`SaleUseCases: Venta actualizada exitosamente: ${id}`);
      return updatedSale;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`SaleUseCases: Error al actualizar venta ${id}:`, error);
      throw new AppError('Error al actualizar venta', 500);
    }
  }

  /**
   * Eliminar venta (✅ MIGRADO)
   * @param {string} id - ID de la venta
   * @param {Object} user - Usuario que elimina
   * @returns {Promise<boolean>}
   */
  async deleteSale(id, user) {
    try {
      logger.debug(`SaleUseCases: Eliminando venta ${id}`);
      
      // Obtener venta antes de eliminar para restaurar inventario
      const sale = await this.getSaleById(id);
      
      const result = await this.saleRepository.delete(id);
      
      // Restaurar inventario si tenía productos
      if (sale.products && sale.products.length > 0) {
        await this._restoreInventoryAfterSaleDelete(sale.products);
      }
      
      logger.info(`SaleUseCases: Venta eliminada exitosamente: ${id}`);
      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`SaleUseCases: Error al eliminar venta ${id}:`, error);
      throw new AppError('Error al eliminar venta', 500);
    }
  }

  /**
   * Validar inventario para venta (✅ MIGRADO)
   * @param {Array} products - Lista de productos a vender
   * @returns {Promise<boolean>}
   * @private
   */
  async _validateInventoryForSale(products) {
    for (const product of products) {
      const item = await this.inventoryRepository.findById(product.item);
      if (!item) {
        throw new AppError(`Producto no encontrado: ${product.item}`, 404);
      }
      
      if (item.currentStock < product.quantity) {
        throw new AppError(`Stock insuficiente para ${item.name}. Stock disponible: ${item.currentStock}`, 400);
      }
    }
    return true;
  }

  /**
   * Actualizar inventario después de venta (✅ MIGRADO)
   * @param {Array} products - Lista de productos vendidos
   * @returns {Promise<void>}
   * @private
   */
  async _updateInventoryAfterSale(products) {
    for (const product of products) {
      const item = await this.inventoryRepository.findById(product.item);
      if (item) {
        await this.inventoryRepository.update(product.item, {
          currentStock: item.currentStock - product.quantity
        });
      }
    }
  }

  /**
   * Restaurar inventario después de eliminar venta (✅ MIGRADO)
   * @param {Array} products - Lista de productos a restaurar
   * @returns {Promise<void>}
   * @private
   */
  async _restoreInventoryAfterSaleDelete(products) {
    for (const product of products) {
      const item = await this.inventoryRepository.findById(product.item);
      if (item) {
        await this.inventoryRepository.update(product.item, {
          currentStock: item.currentStock + product.quantity
        });
      }
    }
  }

  /**
   * Construir query para filtros de ventas
   * @param {Object} filters - Filtros
   * @returns {Object} Query de MongoDB
   * @private
   */
  _buildSalesQuery(filters) {
    const query = {};

    // Filtros básicos permitidos
    const allowedFilters = ['barber', 'customer', 'paymentMethod', 'type'];
    allowedFilters.forEach(f => {
      if (filters[f] !== undefined) query[f] = filters[f];
    });

    // Rango de fechas
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate + 'T00:00:00.000Z');
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate + 'T23:59:59.999Z');
    }

    return query;
  }

  // ========================================================================
  // ADAPTADORES DE COMPATIBILIDAD PARA MÉTODOS ESTÁTICOS
  // ========================================================================

  static async getSales(filters = {}, pagination = {}) {
    const instance = SaleUseCases.getInstance();
    return await instance.getSales(filters, pagination);
  }

  static async getSaleById(id) {
    const instance = SaleUseCases.getInstance();
    return await instance.getSaleById(id);
  }

  static async createSale(saleData, user) {
    const instance = SaleUseCases.getInstance();
    return await instance.createSale(saleData, user);
  }

  static async updateSale(id, updateData, user) {
    const instance = SaleUseCases.getInstance();
    return await instance.updateSale(id, updateData, user);
  }

  static async deleteSale(id, user) {
    const instance = SaleUseCases.getInstance();
    return await instance.deleteSale(id, user);
  }

  // ========================================================================
  // MÉTODOS COMPLEJOS SIN MIGRAR (⏳)
  // Mantenidos por complejidad de lógica de negocio
  // ========================================================================

  /**
   * Generar reporte de ventas por período
   * @param {Date} startDate - Fecha inicio
   * @param {Date} endDate - Fecha fin
   * @param {string} groupBy - Agrupación (day, week, month)
   * @returns {Promise<Object>}
   */
  static async getSalesReport(startDate, endDate, groupBy = 'day') {
    logger.debug(`Generando reporte de ventas: ${startDate} - ${endDate}, agrupado por ${groupBy}`);
    
    try {
      const matchQuery = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };

      let groupExpression;
      switch (groupBy) {
        case 'day':
          groupExpression = {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          };
          break;
        case 'week':
          groupExpression = {
            year: { $year: '$createdAt' },
            week: { $week: '$createdAt' }
          };
          break;
        case 'month':
          groupExpression = {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          };
          break;
        default:
          groupExpression = null;
      }

      const pipeline = [
        { $match: matchQuery },
        {
          $group: {
            _id: groupExpression,
            totalSales: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' }, // ✅ FIXED: Use totalAmount instead of total
            avgAmount: { $avg: '$totalAmount' },   // ✅ FIXED: Use totalAmount instead of total
            dates: { $push: '$createdAt' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
      ];

      const reportData = await Sale.aggregate(pipeline);
      
      const summary = await Sale.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalSales: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' }, // ✅ FIXED: Use totalAmount instead of total
            avgAmount: { $avg: '$totalAmount' }    // ✅ FIXED: Use totalAmount instead of total
          }
        }
      ]);

      const result = {
        period: { startDate, endDate },
        groupBy,
        data: reportData,
        summary: summary[0] || { totalSales: 0, totalAmount: 0, avgAmount: 0 }
      };

      logger.debug('Reporte de ventas generado:', result.summary);
      return result;
    } catch (error) {
      logger.error('Error generando reporte de ventas:', error);
      throw new AppError('Error al generar reporte de ventas', 500);
    }
  }

  /**
   * Obtener ventas por barbero
   * @param {string} barberId - ID del barbero
   * @param {Object} filters - Filtros adicionales
   * @returns {Promise<Array>}
   */
  static async getSalesByBarber(barberId, filters = {}) {
    logger.debug(`Obteniendo ventas del barbero: ${barberId}`);
    
    try {
      // Verificar que el barbero existe
      const barber = await Barber.findById(barberId);
      if (!barber) {
        throw new AppError('Barbero no encontrado', 404);
      }

      const query = { barber: barberId };
      
      // Aplicar filtros adicionales
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
        if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
      }

      const sales = await Sale.find(query)
        .populate('customer', 'name email phone')
        .populate('barber', 'name')
        .populate('products.item', 'name price')
        .populate('services.service', 'name price duration')
        .sort({ createdAt: -1 });

      logger.debug(`Encontradas ${sales.length} ventas para el barbero ${barberId}`);
      return sales;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Error obteniendo ventas del barbero ${barberId}:`, error);
      throw new AppError('Error al obtener ventas del barbero', 500);
    }
  }

  /**
   * Obtener estadísticas de ventas
   * @param {Object} filters - Filtros para las estadísticas
   * @returns {Promise<Object>}
   */
  static async getSalesStats(filters = {}) {
    logger.debug('Obteniendo estadísticas de ventas con filtros:', filters);
    
    try {
      const matchQuery = {};
      
      // Aplicar filtros de fecha
      if (filters.startDate || filters.endDate) {
        matchQuery.createdAt = {};
        if (filters.startDate) matchQuery.createdAt.$gte = new Date(filters.startDate);
        if (filters.endDate) matchQuery.createdAt.$lte = new Date(filters.endDate);
      }

      const stats = await Sale.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalSales: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' }, // ✅ FIXED: Use totalAmount instead of total
            avgAmount: { $avg: '$totalAmount' },   // ✅ FIXED: Use totalAmount instead of total
            maxAmount: { $max: '$totalAmount' },   // ✅ FIXED: Use totalAmount instead of total
            minAmount: { $min: '$totalAmount' }    // ✅ FIXED: Use totalAmount instead of total
          }
        }
      ]);

      const result = stats[0] || {
        totalSales: 0,
        totalAmount: 0,
        avgAmount: 0,
        maxAmount: 0,
        minAmount: 0
      };

      logger.debug('Estadísticas de ventas calculadas:', result);
      return result;
    } catch (error) {
      logger.error('Error obteniendo estadísticas de ventas:', error);
      throw new AppError('Error al obtener estadísticas de ventas', 500);
    }
  }

  /**
   * Crear venta desde cita completada
   * @param {string} appointmentId - ID de la cita
   * @param {Object} saleData - Datos adicionales de venta
   * @param {Object} user - Usuario que crea la venta
   * @returns {Promise<Object>}
   */
  static async createSaleFromAppointment(appointmentId, saleData = {}, user) {
    logger.debug(`Creando venta desde cita: ${appointmentId}`);
    
    try {
      // Verificar que la cita existe y está completada
      const appointment = await Appointment.findById(appointmentId)
        .populate('user', 'name email phone')
        .populate('barber', 'name')
        .populate('services.service', 'name price duration');

      if (!appointment) {
        throw new AppError('Cita no encontrada', 404);
      }

      if (appointment.status !== 'completed') {
        throw new AppError('Solo se pueden crear ventas de citas completadas', 400);
      }

      // Verificar si ya existe una venta para esta cita
      const existingSale = await Sale.findOne({ appointment: appointmentId });
      if (existingSale) {
        throw new AppError('Ya existe una venta para esta cita', 400);
      }

      // Calcular total de servicios
      const servicesTotal = appointment.services.reduce((sum, service) => {
        return sum + (service.service.price || 0);
      }, 0);

      // Crear datos de la venta
      const newSaleData = {
        customer: appointment.user._id,
        barber: appointment.barber._id,
        appointment: appointmentId,
        services: appointment.services.map(service => ({
          service: service.service._id,
          price: service.service.price,
          quantity: 1
        })),
        products: saleData.products || [],
        subtotal: servicesTotal + (saleData.productsTotal || 0),
        tax: saleData.tax || 0,
        discount: saleData.discount || 0,
        total: servicesTotal + (saleData.productsTotal || 0) + (saleData.tax || 0) - (saleData.discount || 0),
        paymentMethod: saleData.paymentMethod || appointment.paymentMethod,
        createdBy: user._id,
        ...saleData
      };

      const sale = new Sale(newSaleData);
      await sale.save();

      const populatedSale = await Sale.findById(sale._id)
        .populate('customer', 'name email phone')
        .populate('barber', 'name')
        .populate('appointment')
        .populate('services.service', 'name price duration')
        .populate('products.item', 'name price');

      logger.info(`Venta creada desde cita ${appointmentId}: ${sale._id}`);
      return populatedSale;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Error creando venta desde cita ${appointmentId}:`, error);
      throw new AppError('Error al crear venta desde cita', 500);
    }
  }
  /**
   * Obtener resumen financiero
   * @param {string} startDate - Fecha inicio
   * @param {string} endDate - Fecha fin
   * @returns {Object} Resumen financiero
   */
  static async getFinancialSummary(startDate, endDate) {
    try {
      logger.debug('SaleUseCases: Obteniendo resumen financiero');

      // Usar getSalesStats que ya existe
      const salesStats = await this.getSalesStats({
        startDate,
        endDate
      });

      // Obtener breakdown por métodos de pago desde Sales
      const salesPaymentMethodsBreakdown = await Sale.aggregate([
        { 
          $match: { 
            createdAt: { 
              $gte: new Date(startDate), 
              $lte: new Date(endDate) 
            } 
          } 
        },
        {
          $group: {
            _id: '$paymentMethod',
            total: { $sum: '$totalAmount' },
            count: { $sum: 1 }
          }
        }
      ]);

      // Obtener breakdown por métodos de pago desde Appointments
      const appointmentsPaymentMethodsBreakdown = await Appointment.aggregate([
        { 
          $match: { 
            createdAt: { 
              $gte: new Date(startDate), 
              $lte: new Date(endDate) 
            },
            status: 'completed'
          } 
        },
        {
          $group: {
            _id: '$paymentMethod',
            total: { $sum: '$totalRevenue' },
            count: { $sum: 1 }
          }
        }
      ]);

      // Obtener breakdown por tipo de venta (products vs services)
      // Basado en datos reales: products tienen type="product", services tienen type="walkIn" Y serviceId
      const salesTypeBreakdown = await Sale.aggregate([
        { 
          $match: { 
            createdAt: { 
              $gte: new Date(startDate), 
              $lte: new Date(endDate) 
            } 
          } 
        },
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ['$type', 'product'] }, // Si type es "product", es producto
                'product',
                { $cond: [
                  { $and: [
                    { $eq: ['$type', 'walkIn'] },
                    { $ne: ['$serviceId', null] },
                    { $ne: ['$serviceId', ''] }
                  ]}, // Si type es "walkIn" Y tiene serviceId, es servicio
                  'service',
                  'other' // Cualquier otra cosa
                ]}
              ]
            },
            total: { $sum: '$totalAmount' },
            count: { $sum: 1 }
          }
        }
      ]);

      // Obtener información de citas completadas
      const appointmentsStats = await Appointment.aggregate([
        { 
          $match: { 
            createdAt: { 
              $gte: new Date(startDate), 
              $lte: new Date(endDate) 
            },
            status: 'completed'
          } 
        },
        {
          $group: {
            _id: null,
            totalAppointments: { $sum: 1 },
            totalRevenue: { $sum: '$totalRevenue' }
          }
        }
      ]);

      const appointmentData = appointmentsStats[0] || { totalAppointments: 0, totalRevenue: 0 };

      // Convertir arrays a objetos y combinar métodos de pago
      const paymentMethods = {};
      
      // Agregar métodos de pago de Sales
      salesPaymentMethodsBreakdown.forEach(item => {
        paymentMethods[item._id] = (paymentMethods[item._id] || 0) + item.total;
      });
      
      // Agregar métodos de pago de Appointments
      appointmentsPaymentMethodsBreakdown.forEach(item => {
        paymentMethods[item._id] = (paymentMethods[item._id] || 0) + item.total;
      });

      const salesByType = {};
      salesTypeBreakdown.forEach(item => {
        salesByType[item._id] = {
          total: item.total,
          count: item.count
        };
      });

      // Obtener fechas disponibles para el filtro "general"
      const salesDates = await Sale.aggregate([
        {
          $group: {
            _id: null,
            dates: { $addToSet: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } }
          }
        }
      ]);

      const appointmentDates = await Appointment.aggregate([
        {
          $match: { status: 'completed' }
        },
        {
          $group: {
            _id: null,
            dates: { $addToSet: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } }
          }
        }
      ]);

      // Combinar y ordenar fechas únicas
      const allDates = [
        ...(salesDates[0]?.dates || []),
        ...(appointmentDates[0]?.dates || [])
      ];
      const uniqueDates = [...new Set(allDates)].sort();

      // Formatear como resumen financiero
      const productRevenue = salesByType.product?.total || 0;
      const serviceRevenue = salesByType.service?.total || 0;
      const appointmentRevenue = appointmentData.totalRevenue || 0;
      
      // ✅ FIXED: Calcular el revenue total real sumando todas las fuentes
      const realTotalRevenue = productRevenue + serviceRevenue + appointmentRevenue;
      
      const financialSummary = {
        totalRevenue: realTotalRevenue, // ✅ FIXED: Revenue real = productos + servicios + citas
        totalSales: salesStats.totalSales || 0,
        averageTicket: realTotalRevenue > 0 ? (realTotalRevenue / ((salesStats.totalSales || 0) + (appointmentData.totalAppointments || 0))) : 0,
        period: {
          startDate,
          endDate
        },
        stats: salesStats,
        // ✅ NEW: Add payment methods breakdown
        paymentMethods,
        // ✅ NEW: Add sales by type breakdown
        salesByType,
        // ✅ NEW: Add specific counts for dashboard
        productSales: salesByType.product?.count || 0,
        serviceSales: salesByType.service?.count || 0,
        productRevenue,
        serviceRevenue,
        // ✅ NEW: Add appointments data
        completedAppointments: appointmentData.totalAppointments,
        appointmentRevenue,
        // ✅ NEW: Add available dates for "general" filter
        availableDates: uniqueDates
      };

      logger.debug(`SaleUseCases: Resumen financiero generado - Revenue: ${financialSummary.totalRevenue}, availableDates: ${uniqueDates.length} fechas`);
      return financialSummary;

    } catch (error) {
      logger.error('Error obteniendo resumen financiero:', error);
      throw new AppError('Error al obtener el resumen financiero', 500);
    }
  }
}

export default SaleUseCases;