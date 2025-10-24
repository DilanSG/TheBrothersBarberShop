import { InventorySnapshot, Inventory, AppError, logger } from '../../../barrel.js';
import ExcelJS from 'exceljs';

export class InventorySnapshotUseCases {
  
  /**
   * Crear un nuevo snapshot de inventario
   * @param {Object} snapshotData - Datos del snapshot
   * @param {string} userId - ID del usuario que crea el snapshot
   * @returns {Promise<Object>} Snapshot creado
   */
  static async createSnapshot(snapshotData, userId) {
    try {
      logger.info('📸 Creando snapshot de inventario', { 
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

      logger.info('✅ Snapshot de inventario creado exitosamente', { 
        snapshotId: savedSnapshot._id,
        totalItems: savedSnapshot.totalItems,
        totalDifference: savedSnapshot.totalDifference
      });

      return savedSnapshot;

    } catch (error) {
      logger.error('❌ Error al crear snapshot de inventario:', error);
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
      logger.error('❌ Error al obtener snapshots de inventario:', error);
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
      logger.error('❌ Error al obtener snapshot por ID:', error);
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
      
      logger.info('🗑️ Snapshot de inventario eliminado', { snapshotId });

    } catch (error) {
      logger.error('❌ Error al eliminar snapshot:', error);
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
      logger.error('❌ Error al obtener estadísticas de snapshots:', error);
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
      logger.info('📊 Generando archivo Excel para snapshot', { snapshotId });

      const snapshot = await this.getSnapshotById(snapshotId);
      
      // Crear workbook y worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Inventario');

      // Agregar información del header
      worksheet.addRow([`Inventario Guardado - ${new Date(snapshot.date).toLocaleDateString('es-ES')}`]);
      worksheet.addRow([`Fecha: ${new Date(snapshot.date).toLocaleDateString('es-ES')}`]);
      worksheet.addRow([`Total de productos: ${snapshot.totalItems}`]);
      worksheet.addRow([`Diferencia total: ${snapshot.totalDifference}`]);
      worksheet.addRow([]); // Fila vacía

      // Estilo para el header principal
      worksheet.getRow(1).font = { bold: true, size: 14 };
      worksheet.getRow(2).font = { bold: true };
      worksheet.getRow(3).font = { bold: true };
      worksheet.getRow(4).font = { bold: true };

      // Agregar headers de columnas
      const headerRow = worksheet.addRow([
        'Producto',
        'Categoría',
        'Stock Inicial',
        'Entradas',
        'Salidas',
        'Ventas',
        'Stock Esperado',
        'Stock Real',
        'Diferencia'
      ]);

      // Estilo para el header de columnas
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

      // Agregar datos
      snapshot.items.forEach(item => {
        worksheet.addRow([
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
      });

      // Ajustar ancho de columnas
      worksheet.columns = [
        { key: 'producto', width: 30 },
        { key: 'categoria', width: 15 },
        { key: 'stockInicial', width: 12 },
        { key: 'entradas', width: 10 },
        { key: 'salidas', width: 10 },
        { key: 'ventas', width: 10 },
        { key: 'stockEsperado', width: 15 },
        { key: 'stockReal', width: 12 },
        { key: 'diferencia', width: 12 }
      ];

      // Agregar bordes a todas las celdas con datos
      const dataStartRow = 6;
      const dataEndRow = 6 + snapshot.items.length;
      for (let row = dataStartRow; row <= dataEndRow; row++) {
        for (let col = 1; col <= 9; col++) {
          const cell = worksheet.getRow(row).getCell(col);
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          
          // Alinear números al centro
          if (col >= 3) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
        }
      }

      // Resaltar diferencias negativas en rojo
      for (let row = dataStartRow + 1; row <= dataEndRow; row++) {
        const differenceCell = worksheet.getRow(row).getCell(9);
        if (differenceCell.value < 0) {
          differenceCell.font = { color: { argb: 'FFFF0000' }, bold: true };
        }
      }

      // Generar buffer
      const excelBuffer = await workbook.xlsx.writeBuffer();
      
      logger.info('✅ Archivo Excel generado exitosamente', { 
        snapshotId,
        itemsCount: snapshot.items.length
      });

      return excelBuffer;

    } catch (error) {
      logger.error('❌ Error al generar archivo Excel:', error);
      throw new AppError('Error interno al generar archivo Excel', 500);
    }
  }
}

export default InventorySnapshotUseCases;
