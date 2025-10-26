import InvoiceUseCases from '../../core/application/usecases/InvoiceUseCases.js';
import printerService from '../../services/printerService.js';
import invoiceService from '../../services/invoiceService.js';
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
 * @desc    Ver factura en HTML (navegador)
 * @route   GET /api/invoices/:invoiceId/view
 * @access  Private (Barber/Admin) o Public con token
 */
export const viewInvoiceHTML = asyncHandler(async (req, res) => {
  const { invoiceId } = req.params;

  logger.info('🔵 EJECUTANDO viewInvoiceHTML (endpoint incorrecto)', { 
    invoiceId,
    url: req.url,
    params: req.params 
  });

  // Obtener datos completos de la factura
  const invoiceData = await InvoiceUseCases.formatForPrint(invoiceId);
  
  // Formatear datos para el template
  const formattedData = invoiceService.formatInvoiceData(
    invoiceData.invoice,
    invoiceData.sale
  );

  // Generar HTML
  const html = invoiceService.generateInvoiceHTML(formattedData);

  // Enviar como HTML
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);

  logger.info('Factura visualizada en HTML', {
    invoiceId,
    invoiceNumber: invoiceData.invoice.invoiceNumber,
    userId: req.user?.id
  });
});

/**
 * @desc    Ver factura desde venta (genera si no existe)
 * @route   GET /api/invoices/sale/:saleId/view
 * @access  Private (Barber/Admin) o Public con token
 */
export const viewInvoiceFromSale = asyncHandler(async (req, res) => {
  const { saleId } = req.params;

  logger.info('🟢 EJECUTANDO viewInvoiceFromSale (endpoint correcto)', { 
    saleId,
    url: req.originalUrl,
    method: req.method
  });

  // Buscar si ya existe una factura para esta venta
  let invoices = await InvoiceUseCases.getInvoicesBySale(saleId);
  
  let invoiceId;
  if (invoices.length === 0) {
    // No existe factura, generarla
    logger.info('Generando factura automáticamente para venta', { saleId });
    const newInvoice = await InvoiceUseCases.generateInvoiceFromSale(saleId, {
      source: 'admin',
      notes: 'Factura generada automáticamente al visualizar'
    });
    invoiceId = newInvoice._id.toString();
    logger.info('Factura generada con ID', { invoiceId });
  } else {
    // Usar la primera factura encontrada
    invoiceId = invoices[0]._id.toString();
    logger.info('Factura existente encontrada', { invoiceId });
  }

  logger.info('Formateando factura para print', { invoiceId });
  
  // Obtener datos completos de la factura
  const invoiceData = await InvoiceUseCases.formatForPrint(invoiceId);
  
  logger.info('📦 invoiceData recibido:', {
    hasInvoice: !!invoiceData.invoice,
    hasClient: !!invoiceData.client,
    hasBarber: !!invoiceData.barber,
    itemsCount: invoiceData.items?.length,
    invoiceNumber: invoiceData.invoice?.number
  });
  
  // Crear HTML simplificado directamente sin usar el servicio complejo
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Factura ${invoiceData.invoice.number}</title>
  <style>
    body { font-family: Arial; padding: 20px; max-width: 800px; margin: 0 auto; }
    h1 { color: #333; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f4f4f4; }
    .total { font-weight: bold; font-size: 1.2em; }
  </style>
</head>
<body>
  <h1>Factura #${invoiceData.invoice.number}</h1>
  <p><strong>Fecha:</strong> ${invoiceData.invoice.date}</p>
  <p><strong>Cliente:</strong> ${invoiceData.client.name}</p>
  <p><strong>Barbero:</strong> ${invoiceData.barber.name}</p>
  
  <table>
    <thead>
      <tr>
        <th>Descripción</th>
        <th>Cantidad</th>
        <th>Precio</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${invoiceData.items.map(item => `
        <tr>
          <td>${item.description}</td>
          <td>${item.quantity}</td>
          <td>$${item.unitPrice.toLocaleString()}</td>
          <td>$${item.subtotal.toLocaleString()}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <p class="total">Total: $${invoiceData.totals.total.toLocaleString()}</p>
  <p><strong>Método de pago:</strong> ${invoiceData.payment.methodLabel}</p>
  
  <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
    Imprimir
  </button>
</body>
</html>
  `;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);

  logger.info('Factura HTML enviada exitosamente', {
    saleId,
    invoiceNumber: invoiceData.invoice.number
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
