import Sale from '../core/domain/entities/Sale.js';
import Inventory from '../core/domain/entities/Inventory.js';
import InventoryLogService from '../core/application/usecases/inventoryLogService.js';
import { AppError } from '../shared/utils/errors.js';
import { logger } from '../shared/utils/logger.js';
import { refundVerificationService } from './refundVerificationService.js';
import { SALE_TYPES } from '../shared/constants/salesConstants.js';

/**
 * Servicio para manejar reembolsos de ventas
 */
class RefundService {
  
  /**
   * Procesar reembolso de una venta
   */
  static async processRefund(saleId, reason, adminCode, userId, userRole) {
    logger.info('🔄 Iniciando proceso de reembolso', {
      saleId,
      reason,
      userId,
      userRole,
      adminCodeProvided: !!adminCode,
      isAdmin: userRole === 'admin'
    });

    // Validar código de administrador solo si el usuario no es admin
    if (userRole !== 'admin') {
      if (!refundVerificationService.validateCode(adminCode)) {
        logger.error('❌ Código de verificación inválido para reembolso', {
          saleId,
          userId,
          userRole,
          providedCode: adminCode
        });
        throw new AppError('Código de verificación inválido', 400);
      }
    } else {
      logger.info('✅ Usuario admin procesando reembolso - sin validación de código', {
        saleId,
        userId,
        userRole
      });
    }

    // Buscar la venta
    const sale = await Sale.findById(saleId);
    if (!sale) {
      throw new AppError('Venta no encontrada', 404);
    }

    // Verificar que no esté ya reembolsada
    if (sale.status === 'refunded') {
      throw new AppError('Esta venta ya ha sido reembolsada', 400);
    }

    // Verificar que sea una venta completada
    if (sale.status !== 'completed') {
      throw new AppError('Solo se pueden reembolsar ventas completadas', 400);
    }

    const originalSaleData = { ...sale.toObject() };

    try {
      // Marcar la venta como reembolsada
      sale.status = 'refunded';
      sale.refundedAt = new Date();
      sale.refundReason = reason;
      sale.refundedBy = userId;
      
      await sale.save();

      // Si es una venta de producto, devolver stock
      if (sale.type === SALE_TYPES.PRODUCT && sale.productId) {
        // Actualizar tanto stock como realStock para mantener consistencia
        await Inventory.findByIdAndUpdate(
          sale.productId,
          { 
            $inc: { 
              stock: sale.quantity, // Devolver stock teórico
              realStock: sale.quantity, // Devolver stock real también
              sales: -sale.quantity // Restar de ventas
            }
          }
        );

        logger.info('📦 Stock devuelto por reembolso', {
          productId: sale.productId,
          productName: sale.productName,
          quantityReturned: sale.quantity,
          updatedFields: ['stock', 'realStock', 'sales']
        });

        // Crear log de inventario
        try {
          await InventoryLogService.createLog(
            'refund',
            sale.productId,
            `Reembolso de venta: ${sale.productName}`,
            userId,
            'admin',
            {
              saleId: sale._id,
              quantity: sale.quantity,
              reason: reason,
              originalSaleDate: originalSaleData.saleDate
            }
          );
        } catch (logError) {
          logger.error('❌ Error creando log de reembolso', logError);
        }
      }

      logger.info('✅ Reembolso procesado exitosamente', {
        saleId: sale._id,
        productId: sale.productId,
        amount: sale.totalAmount,
        refundedBy: userId,
        reason
      });

      return {
        success: true,
        refundedSale: sale,
        originalData: originalSaleData,
        message: 'Reembolso procesado exitosamente'
      };

    } catch (error) {
      logger.error('❌ Error procesando reembolso', {
        saleId,
        error: error.message,
        userId
      });
      throw new AppError(`Error procesando reembolso: ${error.message}`, 500);
    }
  }

  /**
   * Obtener todas las ventas reembolsadas
   */
  static async getRefundedSales(filters = {}) {
    const {
      startDate,
      endDate,
      barberId,
      type,
      limit = 100,
      page = 1
    } = filters;

    const query = { status: 'refunded' };

    // Filtros de fecha
    if (startDate || endDate) {
      query.refundedAt = {};
      if (startDate) {
        query.refundedAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.refundedAt.$lte = new Date(endDate);
      }
    }

    // Filtros adicionales
    if (barberId) {
      query.barberId = barberId;
    }

    if (type) {
      query.type = type;
    }

    const skip = (page - 1) * limit;

    const [refundedSales, total] = await Promise.all([
      Sale.find(query)
        .sort({ refundedAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      Sale.countDocuments(query)
    ]);

    // Calcular estadísticas
    const totalRefundedAmount = await Sale.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const stats = {
      totalRefunded: total,
      totalAmount: totalRefundedAmount[0]?.total || 0,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    };

    logger.info('📊 Consulta de ventas reembolsadas', {
      filters,
      resultsCount: refundedSales.length,
      totalAmount: stats.totalAmount
    });

    return {
      refundedSales,
      stats,
      pagination: {
        currentPage: page,
        totalPages: stats.totalPages,
        totalItems: total,
        limit
      }
    };
  }

  /**
   * Obtener resumen de reembolsos por barbero
   */
  static async getRefundsSummaryByBarber(startDate, endDate) {
    const matchStage = {
      status: 'refunded'
    };

    if (startDate || endDate) {
      matchStage.refundedAt = {};
      if (startDate) matchStage.refundedAt.$gte = new Date(startDate);
      if (endDate) matchStage.refundedAt.$lte = new Date(endDate);
    }

    const summary = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$barberId',
          barberName: { $first: '$barberName' },
          totalRefunds: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          productRefunds: {
            $sum: { $cond: [{ $eq: ['$type', SALE_TYPES.PRODUCT] }, 1, 0] }
          },
          serviceRefunds: {
            $sum: { $cond: [{ $eq: ['$type', SALE_TYPES.SERVICE] }, 1, 0] }
          }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    return summary;
  }

  /**
   * Obtener código de verificación actual
   */
  static getCurrentVerificationCode() {
    return refundVerificationService.getCurrentCode();
  }

  /**
   * Eliminar reembolso (reversar a venta normal)
   */
  static async deleteRefund(saleId, adminUserId) {
    logger.info('🗑️ Iniciando eliminación de reembolso', {
      saleId,
      adminUserId
    });

    // Buscar la venta reembolsada
    const sale = await Sale.findById(saleId);
    if (!sale) {
      throw new AppError('Venta no encontrada', 404);
    }

    if (sale.status !== 'refunded') {
      throw new AppError('Esta venta no está reembolsada', 400);
    }

    // Reversar el reembolso
    sale.status = 'completed';
    sale.refundedAt = undefined;
    sale.refundReason = undefined;

    // Si es un producto, reversar el inventario
    if (sale.type === SALE_TYPES.PRODUCT && sale.productId) {
      try {
        // Actualizar inventario usando los campos correctos
        await Inventory.findByIdAndUpdate(
          sale.productId,
          { 
            $inc: { 
              stock: -sale.quantity, // Reducir stock teórico
              realStock: -sale.quantity, // Reducir stock real también
              sales: sale.quantity // Sumar de nuevo a las ventas
            }
          }
        );

        logger.info('📦 Stock reducido por eliminación de reembolso', {
          productId: sale.productId,
          productName: sale.productName,
          quantityReduced: sale.quantity,
          updatedFields: ['stock', 'realStock', 'sales']
        });
      } catch (inventoryError) {
        logger.error('❌ Error al reversar inventario en eliminación de reembolso', {
          saleId,
          productId: sale.productId,
          error: inventoryError.message
        });
      }
    }

    await sale.save();

    logger.info('✅ Reembolso eliminado exitosamente', {
      saleId,
      productName: sale.productName,
      totalAmount: sale.totalAmount,
      adminUserId
    });

    return {
      message: 'Reembolso eliminado exitosamente',
      restoredSale: sale
    };
  }

  /**
   * Eliminar reembolso permanentemente del sistema
   */
  static async permanentDeleteRefund(saleId, adminUserId) {
    logger.info('🗑️ Iniciando eliminación permanente de reembolso', {
      saleId,
      adminUserId
    });

    // Buscar la venta reembolsada
    const sale = await Sale.findById(saleId);
    if (!sale) {
      throw new AppError('Venta no encontrada', 404);
    }

    if (sale.status !== 'refunded') {
      throw new AppError('Esta venta no está reembolsada', 400);
    }

    // Crear log de auditoría antes de eliminar
    logger.info('📋 Creando log de auditoría para eliminación permanente', {
      saleId,
      productName: sale.productName,
      totalAmount: sale.totalAmount,
      refundReason: sale.refundReason,
      originalBarber: sale.barberName,
      eliminatedBy: adminUserId,
      eliminationTimestamp: new Date().toISOString()
    });

    // Guardar datos para el log antes de eliminar
    const refundData = {
      _id: sale._id,
      productName: sale.productName,
      totalAmount: sale.totalAmount,
      refundReason: sale.refundReason,
      barberName: sale.barberName,
      customerName: sale.customerName,
      refundedAt: sale.refundedAt,
      originalDate: sale.createdAt
    };

    // Eliminar la venta permanentemente
    await Sale.findByIdAndDelete(saleId);

    logger.info('✅ Reembolso eliminado permanentemente del sistema', {
      saleId,
      productName: refundData.productName,
      totalAmount: refundData.totalAmount,
      adminUserId,
      action: 'PERMANENT_DELETE_REFUND'
    });

    return {
      message: 'Reembolso eliminado permanentemente del sistema',
      deletedRefund: refundData
    };
  }
}

export default RefundService;