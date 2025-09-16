import { reportsCacheService } from '../services/reportsCacheService.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware para invalidación automática de cache de reportes
 * Se ejecuta después de operaciones que afectan los datos de reportes
 */
class CacheInvalidationMiddleware {
  
  /**
   * Invalidar cache después de crear/actualizar/eliminar una venta
   */
  static async invalidateSalesCache(req, res, next) {
    try {
      // Solo proceder si la operación fue exitosa
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const { barberId } = req.params;
        const { barber } = req.body;
        
        // Determinar el ID del barbero
        const targetBarberId = barberId || barber;
        
        if (targetBarberId) {
          await reportsCacheService.invalidateBarber(targetBarberId);
          await reportsCacheService.invalidateReportType('detailed-sales');
          await reportsCacheService.invalidateReportType('walk-in-details');
          
          logger.info(`Cache invalidado para ventas - Barbero: ${targetBarberId}`);
        }
      }
    } catch (error) {
      logger.error('Error invalidando cache de ventas:', error);
      // No lanzar error para no afectar la respuesta principal
    }
    
    next();
  }

  /**
   * Invalidar cache después de crear/actualizar/eliminar una cita
   */
  static async invalidateAppointmentsCache(req, res, next) {
    try {
      // Solo proceder si la operación fue exitosa
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const { barberId } = req.params;
        const { barber } = req.body;
        
        // Determinar el ID del barbero
        const targetBarberId = barberId || barber;
        
        if (targetBarberId) {
          await reportsCacheService.invalidateBarber(targetBarberId);
          await reportsCacheService.invalidateReportType('completed-appointments');
          
          logger.info(`Cache invalidado para citas - Barbero: ${targetBarberId}`);
        }
      }
    } catch (error) {
      logger.error('Error invalidando cache de citas:', error);
      // No lanzar error para no afectar la respuesta principal
    }
    
    next();
  }

  /**
   * Invalidar cache después de cambios en inventario que afecten reportes
   */
  static async invalidateInventoryCache(req, res, next) {
    try {
      // Solo proceder si la operación fue exitosa
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Invalidar todos los reportes de ventas ya que pueden verse afectados
        await reportsCacheService.invalidateReportType('detailed-sales');
        
        logger.info('Cache de reportes de ventas invalidado por cambio en inventario');
      }
    } catch (error) {
      logger.error('Error invalidando cache por inventario:', error);
    }
    
    next();
  }

  /**
   * Limpiar completamente el cache en situaciones críticas
   */
  static async clearAllCache(req, res, next) {
    try {
      await reportsCacheService.clearAll();
      logger.info('Todo el cache de reportes ha sido limpiado');
    } catch (error) {
      logger.error('Error limpiando cache completo:', error);
    }
    
    next();
  }

  /**
   * Middleware de invalidación inteligente basado en la ruta
   */
  static intelligentCacheInvalidation(req, res, next) {
    // Configurar invalidación post-respuesta basada en la ruta
    const originalSend = res.send;
    
    res.send = function(data) {
      // Llamar al método original primero
      const result = originalSend.call(this, data);
      
      // Solo invalidar si la operación fue exitosa
      if (this.statusCode >= 200 && this.statusCode < 300) {
        // Invalidación asíncrona para no bloquear la respuesta
        setImmediate(async () => {
          try {
            const path = req.path;
            const method = req.method;
            
            if (path.includes('/sales') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
              await CacheInvalidationMiddleware.invalidateSalesCache(req, res, () => {});
            }
            
            if (path.includes('/appointments') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
              await CacheInvalidationMiddleware.invalidateAppointmentsCache(req, res, () => {});
            }
            
            if (path.includes('/inventory') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
              await CacheInvalidationMiddleware.invalidateInventoryCache(req, res, () => {});
            }
          } catch (error) {
            logger.error('Error en invalidación inteligente de cache:', error);
          }
        });
      }
      
      return result;
    };
    
    next();
  }
}

export default CacheInvalidationMiddleware;
