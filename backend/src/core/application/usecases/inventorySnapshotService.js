import InventorySnapshot from '../../domain/entities/InventorySnapshot.js';
import Inventory from '../../domain/entities/Inventory.js';
import { AppError, logger } from '../../../barrel.js';
import ExcelJS from 'exceljs';

export class InventorySnapshotService {
  
  /**
   * Crear un nuevo snapshot de inventario
   * @param {Object} snapshotData - Datos del snapshot
   * @param {string} userId - ID del usuario que crea el snapshot
   * @returns {Promise<Object>} Snapshot creado
   */
  static async createSnapshot(snapshotData, userId) {
    try {
      logger.info('Creando snapshot de inventario', { 
        userId,
        itemsCount: snapshotData.items?.length || 0
      });

      // Validar que hay items
      if (!snapshotData.items || snapshotData.items.length === 0) {
        throw new AppError('No se puede crear un snapshot sin productos', 400);
      }

      // Crear el snapshot
      const snapshot = new InventorySnapshot({
        createdBy: userId,
        items: snapshotData.items,
        notes: snapshotData.notes
      });

      const savedSnapshot = await snapshot.save();
      
      // Actualizar el stock real en los productos del inventario
      for (const item of snapshotData.items) {
        await Inventory.findByIdAndUpdate(
          item.productId,
          { 
            realStock: item.realStock,
            lastUpdated: new Date()
          }
        );
      }

      logger.info('Snapshot de inventario creado exitosamente', { 
        snapshotId: savedSnapshot._id,
        totalItems: savedSnapshot.totalItems,
        totalDifference: savedSnapshot.totalDifference
      });

      return savedSnapshot;

    } catch (error) {
      logger.error('Error al crear snapshot de inventario:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Error interno al crear el snapshot de inventario', 500);
    }
  }

  /**
   * Obtener snapshots con paginación
   * @param {Object} filters - Filtros de búsqueda
   * @param {number} page - Página
   * @param {number} limit - Límite por página
   * @returns {Promise<Object>} Snapshots paginados
   */
  static async getSnapshots(filters = {}, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      
      // Construir filtros de fecha
      const dateFilter = {};
      if (filters.startDate) {
        dateFilter.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        dateFilter.$lte = new Date(filters.endDate);
      }

      const query = {};
      if (Object.keys(dateFilter).length > 0) {
        query.date = dateFilter;
      }
      if (filters.createdBy) {
        query.createdBy = filters.createdBy;
      }

      const [snapshots, total] = await Promise.all([
        InventorySnapshot.find(query)
          .populate('createdBy', 'name email')
          .sort({ date: -1 })
          .skip(skip)
          .limit(limit),
        InventorySnapshot.countDocuments(query)
      ]);

      return {
        snapshots,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };

    } catch (error) {
      logger.error('Error al obtener snapshots de inventario:', error);
      throw new AppError('Error interno al obtener los snapshots', 500);
    }
  }

  /**
   * Obtener un snapshot por ID
   * @param {string} snapshotId - ID del snapshot
   * @returns {Promise<Object>} Snapshot encontrado
   */
  static async getSnapshotById(snapshotId) {
    try {
      const snapshot = await InventorySnapshot.findById(snapshotId)
        .populate('createdBy', 'name email')
        .populate('items.productId', 'name category');

      if (!snapshot) {
        throw new AppError('Snapshot no encontrado', 404);
      }

      return snapshot;

    } catch (error) {
      logger.error('Error al obtener snapshot por ID:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Error interno al obtener el snapshot', 500);
    }
  }

  /**
   * Eliminar un snapshot
   * @param {string} snapshotId - ID del snapshot
   * @returns {Promise<void>}
   */
  static async deleteSnapshot(snapshotId) {
    try {
      const snapshot = await InventorySnapshot.findById(snapshotId);
      
      if (!snapshot) {
        throw new AppError('Snapshot no encontrado', 404);
      }

      await InventorySnapshot.findByIdAndDelete(snapshotId);
      
      logger.info('Snapshot de inventario eliminado', { snapshotId });

    } catch (error) {
      logger.error('Error al eliminar snapshot:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Error interno al eliminar el snapshot', 500);
    }
  }

  /**
   * Obtener estadísticas de snapshots
   * @param {Object} dateRange - Rango de fechas
   * @returns {Promise<Object>} Estadísticas
   */
  static async getSnapshotStats(dateRange = {}) {
    try {
      const matchStage = {};
      if (dateRange.startDate || dateRange.endDate) {
        matchStage.date = {};
        if (dateRange.startDate) {
          matchStage.date.$gte = new Date(dateRange.startDate);
        }
        if (dateRange.endDate) {
          matchStage.date.$lte = new Date(dateRange.endDate);
        }
      }

      const stats = await InventorySnapshot.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalSnapshots: { $sum: 1 },
            avgTotalDifference: { $avg: '$totalDifference' },
            maxTotalDifference: { $max: '$totalDifference' },
            minTotalDifference: { $min: '$totalDifference' },
            avgItemsCount: { $avg: '$totalItems' },
            totalItemsProcessed: { $sum: '$totalItems' }
          }
        }
      ]);

      return stats[0] || {
        totalSnapshots: 0,
        avgTotalDifference: 0,
        maxTotalDifference: 0,
        minTotalDifference: 0,
        avgItemsCount: 0,
        totalItemsProcessed: 0
      };

    } catch (error) {
      logger.error('Error al obtener estadísticas de snapshots:', error);
      throw new AppError('Error interno al obtener estadísticas', 500);
    }
  }

  /**
   * Generar archivo Excel para un snapshot
   * @param {string} snapshotId - ID del snapshot
   * @returns {Promise<Buffer>} Buffer del archivo Excel
   */
  static async generateExcel(snapshotId) {
    try {
      logger.info('Generando archivo Excel para snapshot', { snapshotId });

      const snapshot = await this.getSnapshotById(snapshotId);
      
      // Crear workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Inventario');

      // Información del header (primeras 5 filas)
      const formattedDate = new Date(snapshot.date).toLocaleDateString('es-ES');
      const headerInfo = [
        ['Inventario Guardado - The Brothers Barber Shop'],
        [`Fecha: ${formattedDate}`],
        [`Total de productos: ${snapshot.totalItems}`],
        [`Diferencia total: ${snapshot.totalDifference}`],
        [] // Fila vacía
      ];

      // Agregar header con estilo
      headerInfo.forEach((row, idx) => {
        const excelRow = worksheet.getRow(idx + 1);
        excelRow.values = row;
        if (idx === 0) {
          excelRow.font = { bold: true, size: 14 };
        } else if (idx < 4) {
          excelRow.font = { size: 11 };
        }
      });

      // Definir columnas (fila 6)
      worksheet.getRow(6).values = [
        'Producto', 'Categoría', 'Stock Inicial', 'Entradas', 
        'Salidas', 'Ventas', 'Stock Esperado', 'Stock Real', 'Diferencia'
      ];
      worksheet.getRow(6).font = { bold: true };
      worksheet.getRow(6).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Configurar anchos de columna
      worksheet.columns = [
        { width: 30 }, // Producto
        { width: 15 }, // Categoría
        { width: 12 }, // Stock Inicial
        { width: 10 }, // Entradas
        { width: 10 }, // Salidas
        { width: 10 }, // Ventas
        { width: 15 }, // Stock Esperado
        { width: 12 }, // Stock Real
        { width: 12 }  // Diferencia
      ];

      // Agregar datos (fila 7 en adelante)
      snapshot.items.forEach(item => {
        const row = worksheet.addRow([
          item.productName || item.name || 'Sin nombre',
          item.category || 'Sin categoría',
          item.initialStock || 0,
          item.entries || 0,
          item.exits || 0,
          item.sales || 0,
          item.expectedStock || 0,
          item.realStock || 0,
          item.difference || 0
        ]);

        // Colorear diferencias negativas en rojo
        if ((item.difference || 0) < 0) {
          row.getCell(9).font = { color: { argb: 'FFFF0000' } };
        }
      });

      // Generar buffer
      const excelBuffer = await workbook.xlsx.writeBuffer();
      
      logger.info('Archivo Excel generado exitosamente', { 
        snapshotId,
        itemsCount: snapshot.items.length
      });

      return excelBuffer;

    } catch (error) {
      logger.error('Error al generar archivo Excel:', error);
      throw new AppError('Error interno al generar archivo Excel', 500);
    }
  }
}

export default InventorySnapshotService;
