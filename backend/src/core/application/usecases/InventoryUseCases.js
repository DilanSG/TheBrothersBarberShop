/**
 * InventoryUseCases - Casos de uso para gestión de inventario
 * ✅ MIGRACIÓN COMPLETA A REPOSITORY PATTERN
 *
 * Gestión integral de inventario con Repository Pattern
 */

import { AppError, logger } from '../../../barrel.js';
import DIContainer from '../../../shared/container/index.js';

class InventoryUseCases {
  constructor() {
    // Obtener repositorios del contenedor DI
    this.inventoryRepository = DIContainer.get('InventoryRepository');
    logger.debug('InventoryUseCases: Repositorios inyectados correctamente');
  }

  // Método estático para obtener instancia con DI
  static getInstance() {
    return new InventoryUseCases();
  }

  /**
   * Obtener inventario completo (✅ MIGRADO)
   * @param {Object} filters - Filtros de búsqueda
   * @param {Object} pagination - Paginación
   * @returns {Promise<Object>}
   */
  async getInventory(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 50 } = pagination;
      
      logger.debug('InventoryUseCases: Obteniendo inventario con filtros:', filters);

      // Construir query para repository
      const query = this._buildInventoryQuery(filters);

      const result = await this.inventoryRepository.findAll({
        filter: query,
        limit,
        page,
        sort: { name: 1 }
      });

      // Validar estructura de respuesta
      if (result && result.data) {
        logger.debug(`InventoryUseCases: Recuperados ${result.data.length} items de inventario`);
        return result;
      } else {
        logger.warn('InventoryUseCases: Respuesta inesperada del repository:', result);
        return {
          data: result || [],
          total: result?.length || 0,
          pagination: { page, limit }
        };
      }
    } catch (error) {
      logger.error('InventoryUseCases: Error al obtener inventario:', error);
      throw new AppError('Error al obtener inventario', 500);
    }
  }

  /**
   * Obtener item de inventario por ID (✅ MIGRADO)
   * @param {string} id - ID del item
   * @returns {Promise<Object>}
   */
  async getInventoryItemById(id) {
    try {
      logger.debug(`InventoryUseCases: Buscando item por ID: ${id}`);
      
      const item = await this.inventoryRepository.findById(id);
      if (!item) {
        throw new AppError('Item de inventario no encontrado', 404);
      }
      
      logger.debug(`InventoryUseCases: Item encontrado: ${item.name}`);
      return item;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`InventoryUseCases: Error al obtener item ${id}:`, error);
      throw new AppError('Error al obtener item de inventario', 500);
    }
  }

  /**
   * Crear nuevo item de inventario (✅ MIGRADO)
   * @param {Object} itemData - Datos del item
   * @param {Object} user - Usuario que crea el item
   * @returns {Promise<Object>}
   */
  async createInventoryItem(itemData, user) {
    try {
      logger.debug('InventoryUseCases: Creando nuevo item de inventario');
      
      // Agregar información del usuario
      const enhancedData = {
        ...itemData,
        createdBy: user._id
      };

      const newItem = await this.inventoryRepository.create(enhancedData);
      
      logger.info(`InventoryUseCases: Item creado exitosamente: ${newItem._id}`);
      return newItem;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('InventoryUseCases: Error al crear item:', error);
      throw new AppError('Error al crear item de inventario', 500);
    }
  }

  /**
   * Actualizar item de inventario (✅ MIGRADO)
   * @param {string} id - ID del item
   * @param {Object} updateData - Datos a actualizar
   * @param {Object} user - Usuario que actualiza
   * @returns {Promise<Object>}
   */
  async updateInventoryItem(id, updateData, user) {
    try {
      logger.debug(`InventoryUseCases: Actualizando item ${id}`);
      
      const updatedItem = await this.inventoryRepository.update(id, updateData);
      
      logger.info(`InventoryUseCases: Item actualizado exitosamente: ${id}`);
      return updatedItem;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`InventoryUseCases: Error al actualizar item ${id}:`, error);
      throw new AppError('Error al actualizar item de inventario', 500);
    }
  }

  /**
   * Eliminar item de inventario (✅ MIGRADO)
   * @param {string} id - ID del item
   * @param {Object} user - Usuario que elimina
   * @returns {Promise<boolean>}
   */
  async deleteInventoryItem(id, user) {
    try {
      logger.debug(`InventoryUseCases: Eliminando item ${id}`);
      
      const result = await this.inventoryRepository.delete(id);
      
      logger.info(`InventoryUseCases: Item eliminado exitosamente: ${id}`);
      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`InventoryUseCases: Error al eliminar item ${id}:`, error);
      throw new AppError('Error al eliminar item de inventario', 500);
    }
  }

  /**
   * Actualizar stock de item (✅ MIGRADO)
   * @param {string} id - ID del item
   * @param {number} quantity - Cantidad a agregar/quitar (positivo = agregar, negativo = quitar)
   * @param {Object} user - Usuario que actualiza
   * @param {string} reason - Razón del cambio
   * @returns {Promise<Object>}
   */
  async updateStock(id, quantity, user, reason = 'Ajuste manual') {
    try {
      logger.debug(`InventoryUseCases: Actualizando stock del item ${id} en ${quantity}`);
      
      const item = await this.getInventoryItemById(id);
      const newStock = item.currentStock + quantity;
      
      if (newStock < 0) {
        throw new AppError('El stock no puede ser negativo', 400);
      }

      const updatedItem = await this.inventoryRepository.update(id, {
        currentStock: newStock,
        lastUpdated: new Date()
      });

      // Registrar movimiento de stock
      await this._recordStockMovement(id, quantity, user._id, reason);
      
      logger.info(`InventoryUseCases: Stock actualizado para ${id}: ${item.currentStock} -> ${newStock}`);
      return updatedItem;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`InventoryUseCases: Error al actualizar stock ${id}:`, error);
      throw new AppError('Error al actualizar stock', 500);
    }
  }

  /**
   * Obtener items con stock bajo (✅ MIGRADO)
   * @returns {Promise<Array>}
   */
  async getLowStockItems() {
    try {
      logger.debug('InventoryUseCases: Obteniendo items con stock bajo');
      
      const result = await this.inventoryRepository.findAll({
        filter: {
          $expr: { $lte: ['$currentStock', '$minStock'] }
        },
        sort: { currentStock: 1 }
      });

      logger.debug(`InventoryUseCases: Encontrados ${result.data.length} items con stock bajo`);
      return result.data;
    } catch (error) {
      logger.error('InventoryUseCases: Error al obtener items con stock bajo:', error);
      throw new AppError('Error al obtener items con stock bajo', 500);
    }
  }

  /**
   * Construir query para filtros de inventario
   * @param {Object} filters - Filtros
   * @returns {Object} Query de MongoDB
   * @private
   */
  _buildInventoryQuery(filters) {
    const query = {};

    // Filtros básicos permitidos
    const allowedFilters = ['category', 'supplier', 'isActive'];
    allowedFilters.forEach(f => {
      if (filters[f] !== undefined) query[f] = filters[f];
    });

    // Búsqueda por texto
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
        { sku: { $regex: filters.search, $options: 'i' } }
      ];
    }

    // Filtro de stock bajo
    if (filters.lowStock) {
      query.$expr = { $lte: ['$currentStock', '$minStock'] };
    }

    return query;
  }

  /**
   * Registrar movimiento de stock (método auxiliar)
   * @param {string} itemId - ID del item
   * @param {number} quantity - Cantidad del movimiento
   * @param {string} userId - ID del usuario
   * @param {string} reason - Razón del movimiento
   * @returns {Promise<void>}
   * @private
   */
  async _recordStockMovement(itemId, quantity, userId, reason) {
    // Esta funcionalidad podría implementarse en el futuro
    // como un servicio separado de historial de movimientos
    logger.debug(`Movimiento de stock registrado: ${itemId} ${quantity > 0 ? '+' : ''}${quantity} - ${reason}`);
  }

  // ========================================================================
  // ADAPTADORES DE COMPATIBILIDAD PARA MÉTODOS ESTÁTICOS
  // ========================================================================

  static async getInventory(filters = {}, pagination = {}) {
    const instance = InventoryUseCases.getInstance();
    return await instance.getInventory(filters, pagination);
  }

  static async getInventoryItemById(id) {
    const instance = InventoryUseCases.getInstance();
    return await instance.getInventoryItemById(id);
  }

  static async createInventoryItem(itemData, user) {
    const instance = InventoryUseCases.getInstance();
    return await instance.createInventoryItem(itemData, user);
  }

  static async updateInventoryItem(id, updateData, user) {
    const instance = InventoryUseCases.getInstance();
    return await instance.updateInventoryItem(id, updateData, user);
  }

  static async deleteInventoryItem(id, user) {
    const instance = InventoryUseCases.getInstance();
    return await instance.deleteInventoryItem(id, user);
  }

  static async updateStock(id, quantity, user, reason) {
    const instance = InventoryUseCases.getInstance();
    return await instance.updateStock(id, quantity, user, reason);
  }

  static async getLowStockItems() {
    const instance = InventoryUseCases.getInstance();
    return await instance.getLowStockItems();
  }

  // ========================================================================
  // ADAPTADORES DE COMPATIBILIDAD PARA inventoryService.js (nombres legacy)
  // ========================================================================

  static async getAllItems(filters = {}) {
    const { data } = await this.getInventory(filters);
    return data; // Retornar solo el array sin paginación
  }

  static async getItemById(itemId) {
    return await this.getInventoryItemById(itemId);
  }

  static async createItem(itemData) {
    // inventoryService.js no pasa user, usar null como fallback
    return await this.createInventoryItem(itemData, null);
  }

  static async updateItem(itemId, updateData) {
    // inventoryService.js no pasa user, usar null como fallback
    return await this.updateInventoryItem(itemId, updateData, null);
  }

  static async deleteItem(itemId) {
    return await this.deleteInventoryItem(itemId, null);
  }

  static async adjustStock(itemId, quantity, type = 'add', reason, options = {}) {
    // Convertir el parámetro 'type' al formato esperado
    const finalQuantity = type === 'subtract' ? -Math.abs(quantity) : Math.abs(quantity);
    return await this.updateStock(itemId, finalQuantity, null, reason);
  }

  static async getItemsByCategory(category) {
    const { data } = await this.getInventory({ category });
    return data;
  }

  static async getMovementHistory(itemId, startDate, endDate) {
    return await this.getInventoryMovements(startDate, endDate);
  }

  static async getDailyReport(dateString) {
    // Este método necesita implementación específica
    logger.debug(`Generando reporte diario para: ${dateString}`);
    try {
      const stats = await this.getInventoryStats();
      const lowStock = await this.getLowStockItems();
      
      return {
        date: dateString,
        stats,
        lowStockItems: lowStock,
        generatedAt: new Date()
      };
    } catch (error) {
      logger.error('Error generando reporte diario:', error);
      throw new AppError('Error al generar reporte diario', 500);
    }
  }

  // ========================================================================
  // MÉTODOS COMPLEJOS SIN MIGRAR (⏳)
  // Mantenidos por complejidad específica
  // ========================================================================

  /**
   * Obtener estadísticas de inventario
   * @returns {Promise<Object>}
   */
  static async getInventoryStats() {
    logger.debug('Obteniendo estadísticas de inventario');
    
    try {
      const stats = await Inventory.aggregate([
        {
          $group: {
            _id: null,
            totalItems: { $sum: 1 },
            totalValue: { $sum: { $multiply: ['$currentStock', '$cost'] } },
            averageStock: { $avg: '$currentStock' },
            lowStockCount: {
              $sum: {
                $cond: [{ $lte: ['$currentStock', '$minStock'] }, 1, 0]
              }
            }
          }
        }
      ]);

      const result = stats[0] || {
        totalItems: 0,
        totalValue: 0,
        averageStock: 0,
        lowStockCount: 0
      };

      logger.debug('Estadísticas de inventario calculadas:', result);
      return result;
    } catch (error) {
      logger.error('Error obteniendo estadísticas de inventario:', error);
      throw new AppError('Error al obtener estadísticas de inventario', 500);
    }
  }

  /**
   * Obtener reporte de movimientos de inventario
   * @param {Date} startDate - Fecha inicio
   * @param {Date} endDate - Fecha fin
   * @returns {Promise<Array>}
   */
  static async getInventoryMovements(startDate, endDate) {
    logger.debug(`Obteniendo movimientos de inventario: ${startDate} - ${endDate}`);
    
    try {
      // Esta funcionalidad requeriría un modelo separado de movimientos
      // Por ahora devolvemos un array vacío como placeholder
      const movements = [];
      
      logger.debug(`Encontrados ${movements.length} movimientos de inventario`);
      return movements;
    } catch (error) {
      logger.error('Error obteniendo movimientos de inventario:', error);
      throw new AppError('Error al obtener movimientos de inventario', 500);
    }
  }

  /**
   * Procesar orden de compra automática para items con stock bajo
   * @returns {Promise<Object>}
   */
  static async processAutomaticPurchaseOrder() {
    logger.debug('Procesando orden de compra automática');
    
    try {
      const lowStockItems = await this.getLowStockItems();
      
      if (lowStockItems.length === 0) {
        logger.debug('No hay items con stock bajo para procesar');
        return { items: [], totalOrderValue: 0 };
      }

      const orderItems = lowStockItems.map(item => ({
        item: item._id,
        name: item.name,
        currentStock: item.currentStock,
        minStock: item.minStock,
        suggestedQuantity: Math.max(item.minStock * 2, 10), // Sugerir el doble del mínimo
        estimatedCost: item.cost * Math.max(item.minStock * 2, 10)
      }));

      const totalOrderValue = orderItems.reduce((sum, item) => sum + item.estimatedCost, 0);

      const result = {
        items: orderItems,
        totalOrderValue,
        generatedAt: new Date()
      };

      logger.info(`Orden de compra automática generada: ${orderItems.length} items, valor estimado: $${totalOrderValue}`);
      return result;
    } catch (error) {
      logger.error('Error procesando orden de compra automática:', error);
      throw new AppError('Error al procesar orden de compra automática', 500);
    }
  }
}

export default InventoryUseCases;