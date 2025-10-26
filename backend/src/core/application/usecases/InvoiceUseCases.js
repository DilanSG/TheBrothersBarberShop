import { Invoice, Sale, Barber, User, Appointment, Inventory } from '../../domain/entities/index.js';
import { logger } from '../../../shared/utils/logger.js';
import { AppError } from '../../../shared/utils/errors.js';
import { now, formatInColombiaTime } from '../../../shared/utils/dateUtils.js';

/**
 * Casos de uso para gestión de facturas
 */
class InvoiceUseCases {
  
  /**
   * Generar factura desde una venta
   * @param {string} saleId - ID de la venta
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Invoice>}
   */
  static async generateInvoiceFromSale(saleId, options = {}) {
    try {
      logger.info(`Generando factura para venta: ${saleId}`);

      // Validar que la venta exista
      const sale = await Sale.findById(saleId)
        .populate('barberId', 'name phone');

      if (!sale) {
        throw new AppError('Venta no encontrada', 404);
      }

      // Verificar si ya existe factura para esta venta
      const existingInvoice = await Invoice.findOne({ saleId });
      if (existingInvoice && !options.allowDuplicate) {
        logger.warn(`Factura ya existe para venta ${saleId}: ${existingInvoice.invoiceNumber}`);
        return existingInvoice;
      }

      // Generar número de factura
      const invoiceNumber = await Invoice.generateInvoiceNumber();

      // Preparar datos del barbero
      const barberData = {
        id: sale.barberId?._id || sale.barberId,
        name: sale.barberId?.name || sale.barberName || 'Barbero',
        phone: sale.barberId?.phone || null
      };

      logger.info('Datos del barbero preparados', { barberData });

      // Preparar datos del cliente
      const clientData = {
        name: sale.customerName || 'Cliente General',
        phone: null,
        email: null
      };

      // Preparar items de la factura
      const items = [];

      // Sale puede ser de tipo SERVICE o PRODUCT (solo uno por venta)
      if (sale.type === 'service') {
        items.push({
          description: sale.serviceName,
          quantity: sale.quantity,
          unitPrice: sale.unitPrice,
          subtotal: sale.totalAmount,
          serviceId: sale.serviceId
        });
      } else if (sale.type === 'product') {
        items.push({
          description: sale.productName,
          quantity: sale.quantity,
          unitPrice: sale.unitPrice,
          subtotal: sale.totalAmount,
          productId: sale.productId
        });
      }

      // Calcular totales (una venta simple solo tiene totalAmount)
      const subtotal = sale.totalAmount;
      const tax = 0; // Sale no tiene campo tax
      const discount = 0; // Sale no tiene campo discount
      const total = subtotal;

      // Crear la factura
      const invoice = new Invoice({
        invoiceNumber,
        saleId: sale._id,
        barber: barberData,
        client: clientData,
        items,
        subtotal,
        tax,
        discount,
        total,
        paymentMethod: sale.paymentMethod || 'efectivo',
        status: 'pending',
        notes: options.notes || sale.notes,
        metadata: {
          source: options.source || 'pos',
          device: options.device,
          ipAddress: options.ipAddress,
          location: options.location
        }
      });

      await invoice.save();

      // Actualizar la venta con el ID de la factura
      sale.invoiceId = invoice._id;
      await sale.save();

      logger.info(`Factura generada exitosamente: ${invoiceNumber}`, {
        invoiceId: invoice._id.toString(),
        saleId: saleId
      });
      
      // Retornar la factura recién guardada
      return invoice;

    } catch (error) {
      logger.error('Error generando factura desde venta:', {
        saleId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Obtener factura por ID
   * @param {string} invoiceId - ID de la factura
   * @returns {Promise<Invoice>}
   */
  static async getInvoiceById(invoiceId) {
    try {
      logger.info('Buscando factura por ID', { invoiceId, type: typeof invoiceId });
      
      const invoice = await Invoice.findById(invoiceId)
        .populate('saleId')
        .populate('barber.id', 'name phone email')
        .populate('printInfo.printedBy', 'name email');

      if (!invoice) {
        logger.warn('Factura no encontrada en BD', { invoiceId });
        throw new AppError('Factura no encontrada', 404);
      }

      logger.info('Factura encontrada exitosamente', { 
        invoiceId, 
        invoiceNumber: invoice.invoiceNumber 
      });
      
      return invoice;
    } catch (error) {
      logger.error('Error obteniendo factura:', {
        invoiceId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Obtener facturas por venta
   * @param {string} saleId - ID de la venta
   * @returns {Promise<Invoice[]>}
   */
  static async getInvoicesBySale(saleId) {
    try {
      const invoices = await Invoice.find({ saleId })
        .sort({ createdAt: -1 });

      return invoices;
    } catch (error) {
      logger.error('Error obteniendo facturas por venta:', {
        saleId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Listar facturas con filtros
   * @param {Object} filters - Filtros de búsqueda
   * @param {Object} pagination - Opciones de paginación
   * @returns {Promise<Object>}
   */
  static async listInvoices(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
      const skip = (page - 1) * limit;

      // Construir query
      const query = {};

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.barberId) {
        query['barber.id'] = filters.barberId;
      }

      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) {
          query.createdAt.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          query.createdAt.$lte = new Date(filters.endDate);
        }
      }

      if (filters.invoiceNumber) {
        query.invoiceNumber = new RegExp(filters.invoiceNumber, 'i');
      }

      // Ejecutar query
      const [invoices, total] = await Promise.all([
        Invoice.find(query)
          .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
          .skip(skip)
          .limit(limit)
          .populate('saleId', 'totalAmount createdAt')
          .populate('barber.id', 'name'),
        Invoice.countDocuments(query)
      ]);

      return {
        invoices,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error listando facturas:', {
        filters,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Formatear factura para impresión
   * @param {string} invoiceId - ID de la factura
   * @returns {Promise<Object>}
   */
  static async formatForPrint(invoiceId) {
    try {
      const invoice = await this.getInvoiceById(invoiceId);

      // Información de la barbería (esto debería venir de configuración)
      const businessInfo = {
        name: 'The Brothers Barber Shop',
        address: 'Dirección de la barbería',
        phone: 'Teléfono de contacto',
        nit: 'NIT: 000000000-0',
        email: 'contact@thebrothers.com'
      };

      // Formatear fecha
      const formattedDate = formatInColombiaTime(invoice.createdAt, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      return {
        business: businessInfo,
        invoice: {
          number: invoice.invoiceNumber,
          date: formattedDate,
          dateISO: invoice.createdAt
        },
        barber: {
          name: invoice.barber.name,
          phone: invoice.barber.phone
        },
        client: {
          name: invoice.client.name || 'Cliente General',
          phone: invoice.client.phone,
          email: invoice.client.email
        },
        items: invoice.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal
        })),
        totals: {
          subtotal: invoice.subtotal,
          tax: invoice.tax,
          discount: invoice.discount,
          total: invoice.total
        },
        payment: {
          method: invoice.paymentMethod,
          methodLabel: this.getPaymentMethodLabel(invoice.paymentMethod)
        },
        notes: invoice.notes,
        printCount: invoice.printInfo.printCount,
        isReprint: invoice.printInfo.printCount > 0
      };
    } catch (error) {
      logger.error('Error formateando factura para impresión:', {
        invoiceId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Marcar factura como impresa
   * @param {string} invoiceId - ID de la factura
   * @param {string} userId - ID del usuario que imprimió
   * @returns {Promise<Invoice>}
   */
  static async markAsPrinted(invoiceId, userId) {
    try {
      const invoice = await Invoice.findById(invoiceId);

      if (!invoice) {
        throw new AppError('Factura no encontrada', 404);
      }

      await invoice.markAsPrinted(userId);

      logger.info(`Factura marcada como impresa: ${invoice.invoiceNumber}`, {
        invoiceId,
        userId,
        printCount: invoice.printInfo.printCount
      });

      return invoice;
    } catch (error) {
      logger.error('Error marcando factura como impresa:', {
        invoiceId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Cancelar factura
   * @param {string} invoiceId - ID de la factura
   * @param {string} reason - Razón de cancelación
   * @returns {Promise<Invoice>}
   */
  static async cancelInvoice(invoiceId, reason) {
    try {
      const invoice = await Invoice.findById(invoiceId);

      if (!invoice) {
        throw new AppError('Factura no encontrada', 404);
      }

      if (invoice.status === 'cancelled') {
        throw new AppError('La factura ya está cancelada', 400);
      }

      await invoice.cancel(reason);

      logger.info(`Factura cancelada: ${invoice.invoiceNumber}`, {
        invoiceId,
        reason
      });

      return invoice;
    } catch (error) {
      logger.error('Error cancelando factura:', {
        invoiceId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Obtener estadísticas de facturas
   * @param {Object} filters - Filtros para las estadísticas
   * @returns {Promise<Object>}
   */
  static async getInvoiceStats(filters = {}) {
    try {
      const query = {};

      if (filters.barberId) {
        query['barber.id'] = filters.barberId;
      }

      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) {
          query.createdAt.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          query.createdAt.$lte = new Date(filters.endDate);
        }
      }

      const stats = await Invoice.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalInvoices: { $sum: 1 },
            totalAmount: { $sum: '$total' },
            totalTax: { $sum: '$tax' },
            totalDiscount: { $sum: '$discount' },
            printedInvoices: {
              $sum: { $cond: [{ $eq: ['$printInfo.printed', true] }, 1, 0] }
            },
            cancelledInvoices: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
            }
          }
        }
      ]);

      const result = stats[0] || {
        totalInvoices: 0,
        totalAmount: 0,
        totalTax: 0,
        totalDiscount: 0,
        printedInvoices: 0,
        cancelledInvoices: 0
      };

      return result;
    } catch (error) {
      logger.error('Error obteniendo estadísticas de facturas:', {
        filters,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Obtener etiqueta de método de pago
   * @param {string} method - Método de pago
   * @returns {string}
   */
  static getPaymentMethodLabel(method) {
    const labels = {
      efectivo: 'Efectivo',
      tarjeta: 'Tarjeta',
      transferencia: 'Transferencia',
      mixto: 'Pago Mixto'
    };
    return labels[method] || method;
  }
}

export default InvoiceUseCases;
