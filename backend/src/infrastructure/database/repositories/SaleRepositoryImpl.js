/**
 * Implementación Repository de Ventas
 * Implementación concreta del repositorio de ventas usando Mongoose
 */

import ISaleRepository from '../../../core/domain/repositories/ISaleRepository.js';
import { Sale, logger, AppError } from '../../../barrel.js';

class SaleRepositoryImpl extends ISaleRepository {
  /**
   * Buscar venta por ID
   * @param {string} id - ID de la venta
   * @returns {Promise<Sale|null>}
   */
  async findById(id) {
    try {
      logger.info(`Buscando venta por ID: ${id}`);
      // ✅ FIXED: Remove populate calls since fields are not ObjectIds in the actual data
      const sale = await Sale.findById(id).lean();
      
      if (sale) {
        logger.info(`Venta encontrada: ${sale._id}`);
      }
      
      return sale;
    } catch (error) {
      logger.error(`Error al buscar venta por ID ${id}:`, error);
      throw new AppError(`Error al buscar venta: ${error.message}`, 500);
    }
  }

  /**
   * Crear nueva venta
   * @param {Object} saleData - Datos de la venta
   * @returns {Promise<Sale>}
   */
  async create(saleData) {
    try {
      logger.info('Creando nueva venta');
      const sale = await Sale.create(saleData);
      logger.info(`Venta creada exitosamente: ${sale._id}`);
      
      // Retornar con populate
      return await this.findById(sale._id);
    } catch (error) {
      logger.error('Error al crear venta:', error);
      throw new AppError(`Error al crear venta: ${error.message}`, 500);
    }
  }

  /**
   * Actualizar venta existente
   * @param {string} id - ID de la venta
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Sale>}
   */
  async update(id, updateData) {
    try {
      logger.info(`Actualizando venta: ${id}`);
      
      const sale = await Sale.findByIdAndUpdate(
        id,
        updateData,
        { 
          new: true, 
          runValidators: true 
        }
      ).populate('barberId', 'name email')
       .populate('client', 'name email phone')
       .populate('services.service', 'name price duration')
       .populate('paymentMethod', 'name type')
       .populate('products.product', 'name price category');

      if (!sale) {
        throw new AppError('Venta no encontrada', 404);
      }

      logger.info(`Venta actualizada exitosamente: ${id}`);
      return sale;
    } catch (error) {
      logger.error(`Error actualizando venta ${id}:`, error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError(`Error al actualizar venta: ${error.message}`, 500);
    }
  }

  /**
   * Eliminar venta
   * @param {string} id - ID de la venta
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    try {
      logger.info(`Eliminando venta: ${id}`);
      const result = await Sale.findByIdAndDelete(id);
      
      if (!result) {
        throw new AppError('Venta no encontrada', 404);
      }

      logger.info(`Venta eliminada exitosamente: ${id}`);
      return true;
    } catch (error) {
      logger.error(`Error eliminando venta ${id}:`, error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError(`Error al eliminar venta: ${error.message}`, 500);
    }
  }

  /**
   * Buscar ventas por rango de fechas
   * @param {Date} startDate - Fecha de inicio
   * @param {Date} endDate - Fecha de fin
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Sale[]>}
   */
  async findByDateRange(startDate, endDate, options = {}) {
    try {
      const { sort = { date: -1 }, filters = {} } = options;
      
      logger.info(`Buscando ventas por rango de fechas: ${startDate} a ${endDate}`);
      
      const query = {
        date: {
          $gte: startDate,
          $lte: endDate
        },
        ...filters
      };
      
      const sales = await Sale.find(query)
        .populate('barberId', 'name email')
        .populate('client', 'name email phone')
        .populate('services.service', 'name price duration')
        .populate('paymentMethod', 'name type')
        .populate('products.product', 'name price category')
        .sort(sort);
      
      logger.info(`Encontradas ${sales.length} ventas en el rango de fechas`);
      return sales;
    } catch (error) {
      logger.error(`Error buscando ventas por rango de fechas:`, error);
      throw new AppError(`Error al buscar ventas por rango de fechas: ${error.message}`, 500);
    }
  }

  /**
   * Buscar ventas por barbero
   * @param {string} barberId - ID del barbero
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Sale[]>}
   */
  async findByBarberId(barberId, options = {}) {
    try {
      const { sort = { date: -1 }, limit } = options;
      
      logger.info(`Buscando ventas por barbero ID: ${barberId}`);
      
      let query = Sale.find({ barberId: barberId })
        .populate('client', 'name email phone')
        .populate('services.service', 'name price duration')
        .populate('paymentMethod', 'name type')
        .populate('products.product', 'name price category')
        .sort(sort);
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const sales = await query;
      logger.info(`Encontradas ${sales.length} ventas para barbero ${barberId}`);
      
      return sales;
    } catch (error) {
      logger.error(`Error buscando ventas por barbero ${barberId}:`, error);
      throw new AppError(`Error al buscar ventas del barbero: ${error.message}`, 500);
    }
  }

  /**
   * Buscar ventas por método de pago
   * @param {string} paymentMethodId - ID del método de pago
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Sale[]>}
   */
  async findByPaymentMethod(paymentMethodId, options = {}) {
    try {
      const { sort = { date: -1 }, limit } = options;
      
      logger.info(`Buscando ventas por método de pago: ${paymentMethodId}`);
      
      let query = Sale.find({ paymentMethod: paymentMethodId })
        .populate('barberId', 'name email')
        .populate('client', 'name email phone')
        .populate('services.service', 'name price duration')
        .populate('products.product', 'name price category')
        .sort(sort);
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const sales = await query;
      logger.info(`Encontradas ${sales.length} ventas para método de pago ${paymentMethodId}`);
      
      return sales;
    } catch (error) {
      logger.error(`Error buscando ventas por método de pago ${paymentMethodId}:`, error);
      throw new AppError(`Error al buscar ventas por método de pago: ${error.message}`, 500);
    }
  }

  /**
   * Calcular total de ventas por período
   * @param {Date} startDate - Fecha de inicio
   * @param {Date} endDate - Fecha de fin
   * @param {Object} filters - Filtros adicionales
   * @returns {Promise<number>}
   */
  async calculateTotalByPeriod(startDate, endDate, filters = {}) {
    try {
      logger.info(`Calculando total de ventas de ${startDate} a ${endDate}`);
      
      const query = {
        date: {
          $gte: startDate,
          $lte: endDate
        },
        ...filters
      };
      
      const result = await Sale.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            total: { $sum: '$total' }
          }
        }
      ]);
      
      const total = result.length > 0 ? result[0].total : 0;
      logger.info(`Total de ventas calculado: ${total}`);
      
      return total;
    } catch (error) {
      logger.error('Error calculando total de ventas:', error);
      throw new AppError(`Error al calcular total de ventas: ${error.message}`, 500);
    }
  }

  /**
   * Obtener estadísticas de ventas
   * @param {Date} startDate - Fecha de inicio
   * @param {Date} endDate - Fecha de fin
   * @returns {Promise<Object>}
   */
  async getSalesStats(startDate, endDate) {
    try {
      logger.info(`Obteniendo estadísticas de ventas de ${startDate} a ${endDate}`);
      
      const [totalStats, barberStats, paymentStats, serviceStats] = await Promise.all([
        // Total general
        Sale.aggregate([
          {
            $match: {
              date: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$total' },
              count: { $sum: 1 },
              avgAmount: { $avg: '$total' }
            }
          }
        ]),
        // Por barbero
        Sale.aggregate([
          {
            $match: {
              date: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: '$barberId',
              total: { $sum: '$total' },
              count: { $sum: 1 }
            }
          },
          { $sort: { total: -1 } }
        ]),
        // Por método de pago
        Sale.aggregate([
          {
            $match: {
              date: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: '$paymentMethod',
              total: { $sum: '$total' },
              count: { $sum: 1 }
            }
          },
          { $sort: { total: -1 } }
        ]),
        // Por servicio
        Sale.aggregate([
          {
            $match: {
              date: { $gte: startDate, $lte: endDate }
            }
          },
          { $unwind: '$services' },
          {
            $group: {
              _id: '$services.service',
              total: { $sum: '$services.price' },
              count: { $sum: 1 }
            }
          },
          { $sort: { total: -1 } }
        ])
      ]);
      
      const stats = {
        total: totalStats[0]?.total || 0,
        count: totalStats[0]?.count || 0,
        average: totalStats[0]?.avgAmount || 0,
        byBarber: barberStats,
        byPaymentMethod: paymentStats,
        byService: serviceStats
      };
      
      logger.info('Estadísticas de ventas calculadas exitosamente');
      return stats;
    } catch (error) {
      logger.error('Error obteniendo estadísticas de ventas:', error);
      throw new AppError(`Error al obtener estadísticas de ventas: ${error.message}`, 500);
    }
  }

  /**
   * Listar todas las ventas con paginación y filtros
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<{sales: Sale[], total: number, page: number, totalPages: number}>}
   */
  async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = { createdAt: -1 }, // ✅ FIXED: Use createdAt instead of date
        filters = {}
      } = options;

      logger.info(`Listando ventas - Página: ${page}, Límite: ${limit}`);

      const skip = (page - 1) * limit;
      
      // ✅ FIXED: Remove populate calls since fields are not ObjectIds
      const [sales, total] = await Promise.all([
        Sale.find(filters)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Sale.countDocuments(filters)
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info(`Encontradas ${sales.length} ventas de ${total} totales`);

      return {
        sales,
        total,
        page: Number(page),
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      };
    } catch (error) {
      logger.error('Error listando ventas:', error);
      throw new AppError(`Error al listar ventas: ${error.message}`, 500);
    }
  }

  /**
   * Obtener ventas por cliente
   * @param {string} clientId - ID del cliente
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Sale[]>}
   */
  async findByClientId(clientId, options = {}) {
    try {
      const { sort = { date: -1 }, limit } = options;
      
      logger.info(`Buscando ventas por cliente ID: ${clientId}`);
      
      let query = Sale.find({ client: clientId })
        .populate('barberId', 'name email')
        .populate('services.service', 'name price duration')
        .populate('paymentMethod', 'name type')
        .populate('products.product', 'name price category')
        .sort(sort);
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const sales = await query;
      logger.info(`Encontradas ${sales.length} ventas para cliente ${clientId}`);
      
      return sales;
    } catch (error) {
      logger.error(`Error buscando ventas por cliente ${clientId}:`, error);
      throw new AppError(`Error al buscar ventas del cliente: ${error.message}`, 500);
    }
  }

  /**
   * Obtener ingresos por día
   * @param {Date} date - Fecha específica
   * @returns {Promise<number>}
   */
  async getDailyRevenue(date) {
    try {
      logger.info(`Obteniendo ingresos del día: ${date}`);
      
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const result = await Sale.aggregate([
        {
          $match: {
            date: {
              $gte: startOfDay,
              $lte: endOfDay
            }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' }
          }
        }
      ]);
      
      const revenue = result.length > 0 ? result[0].totalRevenue : 0;
      logger.info(`Ingresos del día calculados: ${revenue}`);
      
      return revenue;
    } catch (error) {
      logger.error('Error obteniendo ingresos del día:', error);
      throw new AppError(`Error al obtener ingresos del día: ${error.message}`, 500);
    }
  }
}

export default SaleRepositoryImpl;

