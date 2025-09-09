import { Inventory } from '../models/index.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

class InventoryService {
  static async getAllItems(filters = {}) {
    try {
      const items = await Inventory.find(filters)
        .sort({ category: 1, name: 1 });
      
      logger.debug(`Recuperados ${items.length} items del inventario`);
      return items;
    } catch (error) {
      logger.error('Error obteniendo items del inventario:', error);
      throw new AppError('Error al obtener la lista de inventario', 500);
    }
  }

  static async getItemById(itemId) {
    try {
      const item = await Inventory.findById(itemId);
      if (!item) {
        throw new AppError('Item no encontrado', 404);
      }
      return item;
    } catch (error) {
      logger.error(`Error obteniendo item ${itemId}:`, error);
      throw error;
    }
  }

  static async createItem(itemData) {
    try {
      // Verificar si ya existe un item con el mismo nombre y código
      const existingItem = await Inventory.findOne({
        $or: [
          { name: itemData.name },
          { code: itemData.code }
        ]
      });

      if (existingItem) {
        throw new AppError(
          existingItem.name === itemData.name 
            ? 'Ya existe un item con este nombre' 
            : 'Ya existe un item con este código',
          400
        );
      }

      // Crear el item
      const item = await Inventory.create({
        ...itemData,
        lastUpdated: new Date()
      });
      
      logger.info(`Nuevo item creado: ${item.name}`);
      return item;
    } catch (error) {
      logger.error('Error creando item:', error);
      throw error;
    }
  }

  static async updateItem(itemId, updateData) {
    try {
      // Si se está actualizando el nombre o código, verificar que no exista otro con esos valores
      if (updateData.name || updateData.code) {
        const query = { _id: { $ne: itemId } };
        if (updateData.name) query.name = updateData.name;
        if (updateData.code) query.code = updateData.code;

        const existingItem = await Inventory.findOne(query);
        if (existingItem) {
          throw new AppError(
            existingItem.name === updateData.name 
              ? 'Ya existe un item con este nombre' 
              : 'Ya existe un item con este código',
            400
          );
        }
      }

      // Actualizar item
      const updatedItem = await Inventory.findByIdAndUpdate(
        itemId,
        { 
          $set: {
            ...updateData,
            lastUpdated: new Date()
          }
        },
        { new: true, runValidators: true }
      );

      logger.info(`Item ${itemId} actualizado`);
      return updatedItem;
    } catch (error) {
      logger.error(`Error actualizando item ${itemId}:`, error);
      throw error;
    }
  }

  static async deleteItem(itemId) {
    try {
      const item = await Inventory.findByIdAndDelete(itemId);
      if (!item) {
        throw new AppError('Item no encontrado', 404);
      }

      logger.info(`Item ${itemId} eliminado`);
      return { message: 'Item eliminado correctamente' };
    } catch (error) {
      logger.error(`Error eliminando item ${itemId}:`, error);
      throw error;
    }
  }

  static async adjustStock(itemId, quantity, type = 'add', reason) {
    try {
      const item = await this.getItemById(itemId);
      
      let newStock;
      if (type === 'add') {
        newStock = item.stock + quantity;
      } else if (type === 'remove') {
        newStock = item.stock - quantity;
        if (newStock < 0) {
          throw new AppError('Stock insuficiente para realizar esta operación', 400);
        }
      } else if (type === 'set') {
        newStock = quantity;
      } else {
        throw new AppError('Tipo de ajuste inválido', 400);
      }

      const updatedItem = await Inventory.findByIdAndUpdate(
        itemId,
        { 
          $set: { 
            stock: newStock,
            lastUpdated: new Date()
          },
          $push: {
            movements: {
              type,
              quantity,
              previousStock: item.stock,
              newStock,
              reason,
              date: new Date()
            }
          }
        },
        { new: true }
      );

      logger.info(`Stock ajustado para item ${itemId}: ${type} ${quantity}`);
      return updatedItem;
    } catch (error) {
      logger.error(`Error ajustando stock para item ${itemId}:`, error);
      throw error;
    }
  }

  static async getItemsByCategory(category) {
    try {
      const items = await Inventory.find({ category })
        .sort({ name: 1 });
      
      return items;
    } catch (error) {
      logger.error(`Error obteniendo items por categoría ${category}:`, error);
      throw new AppError('Error al obtener items por categoría', 500);
    }
  }

  static async getLowStockItems(threshold) {
    try {
      const items = await Inventory.find({
        $or: [
          { stock: { $lte: threshold } },
          { stock: { $lte: '$minStock' } }
        ]
      }).sort({ stock: 1 });

      return items;
    } catch (error) {
      logger.error('Error obteniendo items con bajo stock:', error);
      throw new AppError('Error al obtener items con bajo stock', 500);
    }
  }

  static async getMovementHistory(itemId, startDate, endDate) {
    try {
      const query = { _id: itemId };
      
      // Si se proporcionan fechas, filtrar por ellas
      if (startDate || endDate) {
        query['movements.date'] = {};
        if (startDate) query['movements.date'].$gte = new Date(startDate);
        if (endDate) query['movements.date'].$lte = new Date(endDate);
      }

      const item = await Inventory.findOne(query)
        .select('name code movements');

      if (!item) {
        throw new AppError('Item no encontrado', 404);
      }

      // Filtrar movimientos por fecha si es necesario
      let movements = item.movements;
      if (startDate || endDate) {
        movements = movements.filter(m => {
          if (startDate && m.date < new Date(startDate)) return false;
          if (endDate && m.date > new Date(endDate)) return false;
          return true;
        });
      }

      return {
        itemName: item.name,
        itemCode: item.code,
        movements: movements.sort((a, b) => b.date - a.date)
      };
    } catch (error) {
      logger.error(`Error obteniendo historial de movimientos para item ${itemId}:`, error);
      throw error;
    }
  }

  static async getInventoryStats() {
    try {
      const stats = await Inventory.aggregate([
        {
          $group: {
            _id: '$category',
            totalItems: { $sum: 1 },
            totalValue: { $sum: { $multiply: ['$stock', '$price'] } },
            averageStock: { $avg: '$stock' },
            lowStockItems: {
              $sum: {
                $cond: [
                  { $lte: ['$stock', '$minStock'] },
                  1,
                  0
                ]
              }
            },
            items: {
              $push: {
                _id: '$_id',
                name: '$name',
                stock: '$stock',
                price: '$price',
                value: { $multiply: ['$stock', '$price'] }
              }
            }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      // Calcular totales generales
      const totals = stats.reduce((acc, cat) => {
        acc.totalItems += cat.totalItems;
        acc.totalValue += cat.totalValue;
        acc.lowStockItems += cat.lowStockItems;
        return acc;
      }, { totalItems: 0, totalValue: 0, lowStockItems: 0 });

      return {
        byCategory: stats,
        totals
      };
    } catch (error) {
      logger.error('Error obteniendo estadísticas de inventario:', error);
      throw new AppError('Error al obtener estadísticas', 500);
    }
  }

  /**
   * Obtener reporte diario de inventario
   */
  static async getDailyReport(dateString) {
    try {
      // Para inventario, simplemente devolvemos la lista de productos
      // En el futuro se puede expandir para incluir movimientos del día
      const items = await Inventory.find({}).select('name category price stock');
      return items;
    } catch (error) {
      logger.error('Error getting daily inventory report:', error);
      return [];
    }
  }
}

export default InventoryService;
