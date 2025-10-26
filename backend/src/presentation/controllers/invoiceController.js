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
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Factura ${invoiceData.invoice.number}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    @media print {
      body { 
        margin: 0;
        padding: 0;
      }
      .no-print { 
        display: none !important; 
      }
      @page { 
        size: 80mm auto;
        margin: 2mm;
      }
    }
    
    body {
      font-family: 'Courier New', monospace;
      width: 80mm;
      max-width: 80mm;
      margin: 0 auto;
      padding: 5mm;
      color: #000;
      background: #fff;
      font-size: 10pt;
      line-height: 1.2;
    }
    
    .header {
      text-align: center;
      border-bottom: 2px dashed #000;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    
    .header h1 {
      font-size: 14pt;
      font-weight: bold;
      color: #000;
      margin-bottom: 3px;
      letter-spacing: 0.5px;
    }
    
    .header .business-name {
      font-size: 11pt;
      font-weight: bold;
      color: #000;
      margin-bottom: 5px;
    }
    
    .invoice-info {
      margin-bottom: 12px;
      font-size: 9pt;
      line-height: 1.4;
    }
    
    .invoice-info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
      border-bottom: 1px dotted #ccc;
      padding-bottom: 2px;
    }
    
    .invoice-info-row strong {
      font-weight: bold;
      text-transform: uppercase;
      font-size: 8pt;
    }
    
    .invoice-info-row span {
      font-size: 9pt;
      text-align: right;
      max-width: 50%;
      word-wrap: break-word;
    }
    
    .separator {
      border-top: 1px dashed #000;
      margin: 8px 0;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      font-size: 9pt;
    }
    
    thead {
      border-bottom: 1px solid #000;
    }
    
    th {
      padding: 4px 2px;
      text-align: left;
      font-weight: bold;
      font-size: 8pt;
      text-transform: uppercase;
    }
    
    td {
      padding: 4px 2px;
      font-size: 9pt;
    }
    
    tbody tr {
      border-bottom: 1px dotted #ccc;
    }
    
    .text-right {
      text-align: right;
    }
    
    .text-center {
      text-align: center;
    }
    
    .totals {
      margin-top: 10px;
      border-top: 1px solid #000;
      padding-top: 8px;
    }
    
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
      font-size: 10pt;
    }
    
    .totals-row.final {
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
      font-size: 12pt;
      font-weight: bold;
      padding: 6px 0;
      margin-top: 5px;
    }
    
    .totals-label {
      font-weight: bold;
      text-transform: uppercase;
    }
    
    .totals-value {
      font-weight: bold;
      text-align: right;
    }
    
    .print-btn {
      padding: 12px 30px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      margin: 20px auto;
      display: block;
      transition: all 0.3s;
      box-shadow: 0 2px 4px rgba(0, 123, 255, 0.3);
      width: 90%;
      max-width: 250px;
    }
    
    .print-btn:hover {
      background: #0056b3;
      box-shadow: 0 4px 8px rgba(0, 123, 255, 0.4);
    }
    
    .print-btn:active {
      transform: scale(0.98);
    }
    
    @media screen {
      body {
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
        margin: 20px auto;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="business-name">THE BROTHERS</div>
    <div class="business-name">BARBER SHOP</div>
    <h1>FACTURA</h1>
    <div style="font-size: 11pt; font-weight: bold; margin-top: 4px;">${invoiceData.invoice.number}</div>
  </div>
  
  <div class="invoice-info">
    <div class="invoice-info-row">
      <strong>Fecha:</strong>
      <span>${invoiceData.invoice.date}</span>
    </div>
    <div class="invoice-info-row">
      <strong>Barbero:</strong>
      <span>${invoiceData.barber.name}</span>
    </div>
    <div class="invoice-info-row">
      <strong>Pago:</strong>
      <span>${invoiceData.payment.methodLabel}</span>
    </div>
  </div>
  
  <div class="separator"></div>
  
  <table>
    <thead>
      <tr>
        <th style="width: 50%;">Item</th>
        <th class="text-center" style="width: 15%;">Cant</th>
        <th class="text-right" style="width: 35%;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${invoiceData.items.map(item => `
        <tr>
          <td>${item.description}</td>
          <td class="text-center">${item.quantity}</td>
          <td class="text-right">$${item.subtotal.toLocaleString('es-CO')}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="separator"></div>
  
  <div class="totals">
    ${invoiceData.totals.subtotal !== invoiceData.totals.total ? `
      <div class="totals-row">
        <div class="totals-label">Subtotal:</div>
        <div class="totals-value">$${invoiceData.totals.subtotal.toLocaleString('es-CO')}</div>
      </div>
    ` : ''}
    ${invoiceData.totals.discount > 0 ? `
      <div class="totals-row">
        <div class="totals-label">Descuento:</div>
        <div class="totals-value">-$${invoiceData.totals.discount.toLocaleString('es-CO')}</div>
      </div>
    ` : ''}
    ${invoiceData.totals.tax > 0 ? `
      <div class="totals-row">
        <div class="totals-label">IVA:</div>
        <div class="totals-value">$${invoiceData.totals.tax.toLocaleString('es-CO')}</div>
      </div>
    ` : ''}
    <div class="totals-row final">
      <div class="totals-label">TOTAL:</div>
      <div class="totals-value">$${invoiceData.totals.total.toLocaleString('es-CO')}</div>
    </div>
  </div>
  
  <div class="separator"></div>
  
  <div style="text-align: center; font-size: 8pt; margin-top: 12px; line-height: 1.3;">
    <p style="font-weight: bold; margin-bottom: 4px;">¡GRACIAS POR SU VISITA!</p>
    <p>The Brothers Barber Shop</p>
    <p>www.thebrothersbarber.com</p>
  </div>
  
  <button class="print-btn no-print" id="printButton">
    🖨️ Imprimir Factura
  </button>
  
  <script>
    function handlePrint() {
      console.log('🖨️ Iniciando impresión...');
      try {
        window.print();
        console.log('✅ window.print() ejecutado exitosamente');
      } catch (error) {
        console.error('❌ Error al imprimir:', error);
        alert('Error al abrir la ventana de impresión: ' + error.message);
      }
    }
    
    // Agregar event listener al botón (evita CSP inline issues)
    document.addEventListener('DOMContentLoaded', function() {
      const printBtn = document.getElementById('printButton');
      if (printBtn) {
        printBtn.addEventListener('click', handlePrint);
        console.log('✅ Event listener agregado al botón de impresión');
      } else {
        console.error('❌ No se encontró el botón de impresión');
      }
    });
    
    // Atajos de teclado para imprimir
    document.addEventListener('keydown', function(e) {
      // Ctrl+P o Cmd+P
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handlePrint();
      }
    });
    
    // Auto-print opcional (comentado por defecto)
    // window.addEventListener('load', function() {
    //   setTimeout(() => handlePrint(), 500);
    // });
  </script>
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
 * @desc    Generar factura consolidada para un barbero en un período
 * @route   GET /api/invoices/consolidated/:barberId
 * @access  Private (Admin)
 * @query   startDate, endDate (opcional - si no se proporcionan, trae todos los registros)
 */
export const generateConsolidatedInvoice = asyncHandler(async (req, res) => {
  const { barberId } = req.params;
  const { startDate, endDate } = req.query;
  
  logger.info('Generando factura consolidada', {
    barberId,
    startDate,
    endDate,
    userId: req.user.id
  });

  // Importar modelos necesarios
  const { default: Sale } = await import('../../core/domain/entities/Sale.js');
  const { default: Appointment } = await import('../../core/domain/entities/Appointment.js');
  const { default: Barber } = await import('../../core/domain/entities/Barber.js');

  // Buscar barbero
  const barber = await Barber.findById(barberId).populate('user', 'name email phone profilePicture');
  if (!barber) {
    throw new AppError('Barbero no encontrado', 404);
  }

  // Construir query de filtros
  const dateFilter = {};
  if (startDate && endDate) {
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);
    dateFilter.createdAt = { $gte: start, $lte: end };
  }

  // Obtener todas las ventas del barbero
  const sales = await Sale.find({
    barberId: barberId,
    status: { $ne: 'cancelled' },
    ...dateFilter
  }).sort({ createdAt: -1 }).lean();

  // Obtener todas las citas completadas del barbero
  const appointments = await Appointment.find({
    barber: barberId,
    status: 'completed',
    ...(dateFilter.createdAt && { date: dateFilter.createdAt })
  }).populate('service', 'name basePrice').sort({ date: -1 }).lean();

  // Calcular totales
  const salesTotal = sales.reduce((sum, sale) => {
    if (sale.type === 'walkIn') {
      return sum + (sale.servicePrice || 0);
    }
    return sum + (sale.total || 0);
  }, 0);

  const appointmentsTotal = appointments.reduce((sum, apt) => {
    return sum + (apt.finalPrice || apt.service?.basePrice || 0);
  }, 0);

  const grandTotal = salesTotal + appointmentsTotal;

  // Agrupar ventas por tipo
  const productSales = sales.filter(s => s.type === 'product');
  const walkInSales = sales.filter(s => s.type === 'walkIn');

  // Formatear datos para la factura HTML
  const invoiceData = {
    invoiceNumber: `CONS-${barberId.slice(-6)}-${Date.now()}`,
    barber: {
      name: barber.user?.name || 'N/A',
      email: barber.user?.email || 'N/A',
      phone: barber.user?.phone || 'N/A'
    },
    period: {
      startDate: startDate || 'Desde el inicio',
      endDate: endDate || 'Hasta la fecha'
    },
    summary: {
      productSales: {
        count: productSales.length,
        total: productSales.reduce((sum, s) => sum + (s.total || 0), 0)
      },
      walkInSales: {
        count: walkInSales.length,
        total: walkInSales.reduce((sum, s) => sum + (s.servicePrice || 0), 0)
      },
      appointments: {
        count: appointments.length,
        total: appointmentsTotal
      },
      grandTotal
    },
    details: {
      productSales,
      walkInSales,
      appointments
    },
    generatedAt: new Date(),
    generatedBy: req.user.name || req.user.email
  };

  // Generar HTML de la factura
  const html = generateConsolidatedInvoiceHTML(invoiceData);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

/**
 * Genera el HTML para la factura consolidada
 */
function generateConsolidatedInvoiceHTML(data) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Factura Consolidada - ${data.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Courier New', Courier, monospace;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    
    .header h1 { font-size: 28px; margin-bottom: 10px; font-weight: bold; }
    .header .invoice-number { font-size: 14px; opacity: 0.9; letter-spacing: 2px; }
    
    .content { padding: 30px; }
    .section { margin-bottom: 30px; }
    
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #667eea;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #667eea;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    
    .info-item {
      padding: 15px;
      background: #f7fafc;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    
    .info-label {
      font-size: 12px;
      color: #718096;
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .info-value { font-size: 14px; color: #2d3748; font-weight: bold; }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    
    .summary-card {
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
      border: 2px solid #e2e8f0;
    }
    
    .summary-card.total {
      grid-column: 1 / -1;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
    }
    
    .summary-label {
      font-size: 12px;
      margin-bottom: 8px;
      opacity: 0.8;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .summary-value { font-size: 24px; font-weight: bold; }
    .summary-count { font-size: 12px; margin-top: 5px; opacity: 0.7; }
    
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
      font-size: 12px;
    }
    
    .details-table th {
      background: #667eea;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .details-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .details-table tr:hover { background: #f7fafc; }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px dashed #cbd5e0;
      text-align: center;
      color: #718096;
      font-size: 12px;
    }
    
    .print-button {
      position: fixed;
      bottom: 30px;
      right: 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 15px 30px;
      border-radius: 50px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
      transition: transform 0.2s;
    }
    
    .print-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 40px rgba(102, 126, 234, 0.6);
    }
    
    @media print {
      body { background: white; padding: 0; }
      .invoice-container { box-shadow: none; border-radius: 0; }
      .print-button { display: none; }
    }
    
    @media (max-width: 768px) {
      .info-grid, .summary-grid { grid-template-columns: 1fr; }
      .summary-card.total { grid-column: 1; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <h1>📊 FACTURA CONSOLIDADA</h1>
      <div class="invoice-number">${data.invoiceNumber}</div>
    </div>
    
    <div class="content">
      <!-- Información del Barbero -->
      <div class="section">
        <div class="section-title">👤 Información del Barbero</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Nombre</div>
            <div class="info-value">${data.barber.name}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Email</div>
            <div class="info-value">${data.barber.email}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Teléfono</div>
            <div class="info-value">${data.barber.phone}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Período</div>
            <div class="info-value">${data.period.startDate} - ${data.period.endDate}</div>
          </div>
        </div>
      </div>
      
      <!-- Resumen -->
      <div class="section">
        <div class="section-title">📈 Resumen de Ingresos</div>
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-label">🛒 Ventas de Productos</div>
            <div class="summary-value">${formatCurrency(data.summary.productSales.total)}</div>
            <div class="summary-count">${data.summary.productSales.count} ventas</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">✂️ Cortes Walk-In</div>
            <div class="summary-value">${formatCurrency(data.summary.walkInSales.total)}</div>
            <div class="summary-count">${data.summary.walkInSales.count} cortes</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">📅 Citas Completadas</div>
            <div class="summary-value">${formatCurrency(data.summary.appointments.total)}</div>
            <div class="summary-count">${data.summary.appointments.count} citas</div>
          </div>
          <div class="summary-card total">
            <div class="summary-label">💰 TOTAL CONSOLIDADO</div>
            <div class="summary-value">${formatCurrency(data.summary.grandTotal)}</div>
          </div>
        </div>
      </div>
      
      ${data.details.productSales.length > 0 ? `
      <div class="section">
        <div class="section-title">🛒 Detalle de Ventas de Productos (${data.details.productSales.length})</div>
        <table class="details-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Productos</th>
              <th>Método de Pago</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${data.details.productSales.map(sale => `
              <tr>
                <td>${formatDate(sale.createdAt)}</td>
                <td>${sale.items?.length || 0} items</td>
                <td>${sale.paymentMethod || 'N/A'}</td>
                <td><strong>${formatCurrency(sale.total)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
      
      ${data.details.walkInSales.length > 0 ? `
      <div class="section">
        <div class="section-title">✂️ Detalle de Cortes Walk-In (${data.details.walkInSales.length})</div>
        <table class="details-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Servicio</th>
              <th>Método de Pago</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${data.details.walkInSales.map(sale => `
              <tr>
                <td>${formatDate(sale.createdAt)}</td>
                <td>${sale.serviceName || 'Corte'}</td>
                <td>${sale.paymentMethod || 'N/A'}</td>
                <td><strong>${formatCurrency(sale.servicePrice)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
      
      ${data.details.appointments.length > 0 ? `
      <div class="section">
        <div class="section-title">📅 Detalle de Citas Completadas (${data.details.appointments.length})</div>
        <table class="details-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Servicio</th>
              <th>Precio</th>
            </tr>
          </thead>
          <tbody>
            ${data.details.appointments.map(apt => `
              <tr>
                <td>${formatDate(apt.date)}</td>
                <td>${apt.service?.name || 'N/A'}</td>
                <td><strong>${formatCurrency(apt.finalPrice || apt.service?.basePrice || 0)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
      
      <div class="footer">
        <p><strong>The Brothers Barber Shop</strong></p>
        <p>Factura generada el ${formatDate(data.generatedAt)}</p>
        <p>Generada por: ${data.generatedBy}</p>
      </div>
    </div>
  </div>
  
  <button class="print-button" onclick="window.print()">
    🖨️ Imprimir Factura
  </button>
</body>
</html>
  `;
}

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
