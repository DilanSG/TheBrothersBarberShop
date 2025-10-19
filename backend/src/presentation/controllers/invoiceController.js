import InvoiceUseCases from '../../core/application/usecases/InvoiceUseCases.js';
import printerService from '../../services/printerService.js';
import { asyncHandler } from '../middleware/index.js';
import { logger } from '../../shared/utils/logger.js';
import { AppError } from '../../shared/utils/errors.js';
import { getPrinterConfig, getBusinessInfo } from '../../../config/printer.config.js';

/**
 * @desc    Generar factura desde una venta
 * @route   POST /api/invoices/generate/:saleId
 * @access  Private (Barber/Admin)
 */
export const generateInvoice = asyncHandler(async (req, res) => {
  const { saleId } = req.params;
  const { notes, source, device } = req.body;

  const options = {
    notes,
    source: source || 'pos',
    device,
    ipAddress: req.ip,
    location: req.headers['x-forwarded-for'] || req.connection.remoteAddress
  };

  const invoice = await InvoiceUseCases.generateInvoiceFromSale(saleId, options);

  logger.info('Factura generada', {
    invoiceId: invoice._id,
    invoiceNumber: invoice.invoiceNumber,
    saleId,
    userId: req.user.id
  });

  res.status(201).json({
    success: true,
    message: 'Factura generada exitosamente',
    data: invoice
  });
});

/**
 * @desc    Imprimir factura
 * @route   POST /api/invoices/print/:invoiceId
 * @access  Private (Barber/Admin)
 */
export const printInvoice = asyncHandler(async (req, res) => {
  const { invoiceId } = req.params;
  const { printerInterface = 'tcp' } = req.body;

  // Formatear datos de la factura
  const invoiceData = await InvoiceUseCases.formatForPrint(invoiceId);

  // Agregar información del negocio
  invoiceData.business = getBusinessInfo();

  // Conectar a la impresora si no está conectada
  const printerStatus = printerService.getStatus();
  if (!printerStatus.connected) {
    const printerConfig = getPrinterConfig(printerInterface);
    await printerService.connectPrinter(printerConfig);
  }

  // Imprimir
  await printerService.printInvoice(invoiceData);

  // Marcar como impresa
  await InvoiceUseCases.markAsPrinted(invoiceId, req.user.id);

  logger.info('Factura impresa', {
    invoiceId,
    invoiceNumber: invoiceData.invoice.number,
    userId: req.user.id
  });

  res.status(200).json({
    success: true,
    message: 'Factura impresa exitosamente',
    data: {
      invoiceId,
      invoiceNumber: invoiceData.invoice.number,
      printed: true
    }
  });
});

/**
 * @desc    Obtener factura por ID
 * @route   GET /api/invoices/:invoiceId
 * @access  Private (Barber/Admin)
 */
export const getInvoice = asyncHandler(async (req, res) => {
  const { invoiceId } = req.params;

  const invoice = await InvoiceUseCases.getInvoiceById(invoiceId);

  res.status(200).json({
    success: true,
    data: invoice
  });
});

/**
 * @desc    Obtener facturas de una venta
 * @route   GET /api/invoices/sale/:saleId
 * @access  Private (Barber/Admin)
 */
export const getInvoicesBySale = asyncHandler(async (req, res) => {
  const { saleId } = req.params;

  const invoices = await InvoiceUseCases.getInvoicesBySale(saleId);

  res.status(200).json({
    success: true,
    count: invoices.length,
    data: invoices
  });
});

/**
 * @desc    Listar facturas con filtros
 * @route   GET /api/invoices
 * @access  Private (Admin) / Barber (own invoices)
 */
export const listInvoices = asyncHandler(async (req, res) => {
  const { page, limit, sortBy, sortOrder, status, barberId, startDate, endDate, invoiceNumber } = req.query;

  const filters = {};
  if (status) filters.status = status;
  if (startDate) filters.startDate = startDate;
  if (endDate) filters.endDate = endDate;
  if (invoiceNumber) filters.invoiceNumber = invoiceNumber;

  // Si es barbero, solo ver sus propias facturas
  if (req.user.role === 'barber') {
    filters.barberId = req.user.barberId || req.user.id;
  } else if (barberId) {
    filters.barberId = barberId;
  }

  const pagination = {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    sortBy: sortBy || 'createdAt',
    sortOrder: sortOrder || 'desc'
  };

  const result = await InvoiceUseCases.listInvoices(filters, pagination);

  res.status(200).json({
    success: true,
    ...result
  });
});

/**
 * @desc    Obtener estadísticas de facturas
 * @route   GET /api/invoices/stats
 * @access  Private (Admin) / Barber (own stats)
 */
export const getInvoiceStats = asyncHandler(async (req, res) => {
  const { barberId, startDate, endDate } = req.query;

  const filters = {};
  if (startDate) filters.startDate = startDate;
  if (endDate) filters.endDate = endDate;

  // Si es barbero, solo ver sus propias estadísticas
  if (req.user.role === 'barber') {
    filters.barberId = req.user.barberId || req.user.id;
  } else if (barberId) {
    filters.barberId = barberId;
  }

  const stats = await InvoiceUseCases.getInvoiceStats(filters);

  res.status(200).json({
    success: true,
    data: stats
  });
});

/**
 * @desc    Cancelar factura
 * @route   PUT /api/invoices/:invoiceId/cancel
 * @access  Private (Admin)
 */
export const cancelInvoice = asyncHandler(async (req, res) => {
  const { invoiceId } = req.params;
  const { reason } = req.body;

  if (!reason) {
    throw new AppError('La razón de cancelación es requerida', 400);
  }

  const invoice = await InvoiceUseCases.cancelInvoice(invoiceId, reason);

  logger.info('Factura cancelada', {
    invoiceId,
    invoiceNumber: invoice.invoiceNumber,
    reason,
    userId: req.user.id
  });

  res.status(200).json({
    success: true,
    message: 'Factura cancelada exitosamente',
    data: invoice
  });
});

/**
 * @desc    Test de impresión
 * @route   POST /api/invoices/printer/test
 * @access  Private (Admin)
 */
export const testPrinter = asyncHandler(async (req, res) => {
  const { printerInterface = 'tcp' } = req.body;

  // Conectar a la impresora si no está conectada
  const printerStatus = printerService.getStatus();
  if (!printerStatus.connected) {
    const printerConfig = getPrinterConfig(printerInterface);
    await printerService.connectPrinter(printerConfig);
  }

  // Ejecutar test
  await printerService.printTest();

  logger.info('Test de impresión ejecutado', {
    userId: req.user.id
  });

  res.status(200).json({
    success: true,
    message: 'Test de impresión ejecutado exitosamente'
  });
});

/**
 * @desc    Obtener estado de la impresora
 * @route   GET /api/invoices/printer/status
 * @access  Private (Admin)
 */
export const getPrinterStatus = asyncHandler(async (req, res) => {
  const status = printerService.getStatus();

  res.status(200).json({
    success: true,
    data: status
  });
});

/**
 * @desc    Conectar impresora
 * @route   POST /api/invoices/printer/connect
 * @access  Private (Admin)
 */
export const connectPrinter = asyncHandler(async (req, res) => {
  const { interface: printerInterface = 'tcp', host, port, deviceName } = req.body;

  const config = getPrinterConfig(printerInterface);

  // Sobrescribir con valores del request si existen
  if (host) config.host = host;
  if (port) config.port = port;
  if (deviceName) config.deviceName = deviceName;

  await printerService.connectPrinter(config);

  logger.info('Impresora conectada', {
    interface: printerInterface,
    userId: req.user.id
  });

  res.status(200).json({
    success: true,
    message: 'Impresora conectada exitosamente',
    data: printerService.getStatus()
  });
});

/**
 * @desc    Desconectar impresora
 * @route   POST /api/invoices/printer/disconnect
 * @access  Private (Admin)
 */
export const disconnectPrinter = asyncHandler(async (req, res) => {
  await printerService.disconnectPrinter();

  logger.info('Impresora desconectada', {
    userId: req.user.id
  });

  res.status(200).json({
    success: true,
    message: 'Impresora desconectada exitosamente'
  });
});
