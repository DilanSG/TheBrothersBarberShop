import InventoryLog from '../models/InventoryLog.js';
import { logger } from '../utils/logger.js';

class InventoryLogService {
  // Crear un log de acción en inventario
  static async createLog(action, itemId, itemName, userId, userRole, details, previousState = null, newState = null) {
    try {
      const log = new InventoryLog({
        action,
        itemId,
        itemName,
        performedBy: userId,
        userRole,
        details,
        previousState,
        newState
      });

      await log.save();
      logger.info(`Inventory log created: ${action} on ${itemName} by ${userRole} ${userId}`);
      return log;
    } catch (error) {
      logger.error('Error creating inventory log:', error);
      throw error;
    }
  }

  // Obtener logs para admin
  static async getLogsForAdmin(filters = {}) {
    try {
      const query = {};
      
      // Filtros opcionales
      if (filters.startDate && filters.endDate) {
        query.timestamp = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate)
        };
      }
      
      if (filters.action) {
        query.action = filters.action;
      }
      
      if (filters.performedBy) {
        query.performedBy = filters.performedBy;
      }
      
      if (filters.userRole) {
        query.userRole = filters.userRole;
      }

      const logs = await InventoryLog.find(query)
        .populate('performedBy', 'name email')
        .populate('itemId', 'name')
        .sort({ timestamp: -1 })
        .limit(filters.limit || 100);

      return logs;
    } catch (error) {
      logger.error('Error fetching inventory logs:', error);
      throw error;
    }
  }

  // Obtener logs por item específico
  static async getLogsByItem(itemId) {
    try {
      const logs = await InventoryLog.find({ itemId })
        .populate('performedBy', 'name email')
        .sort({ timestamp: -1 });

      return logs;
    } catch (error) {
      logger.error('Error fetching logs for item:', error);
      throw error;
    }
  }

  // Obtener estadísticas de logs
  static async getLogStats(filters = {}) {
    try {
      const matchStage = {};
      
      if (filters.startDate && filters.endDate) {
        matchStage.timestamp = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate)
        };
      }

      const stats = await InventoryLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              action: '$action',
              userRole: '$userRole'
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.action',
            totalCount: { $sum: '$count' },
            byRole: {
              $push: {
                role: '$_id.userRole',
                count: '$count'
              }
            }
          }
        }
      ]);

      return stats;
    } catch (error) {
      logger.error('Error fetching log stats:', error);
      throw error;
    }
  }
}

export default InventoryLogService;
