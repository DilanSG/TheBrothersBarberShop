import SaleService from '../services/saleService.js';
import { asyncHandler } from '../middleware/index.js';
import { AppError } from '../utils/errors.js';

// @desc    Crear nueva venta
// @route   POST /api/v1/sales
// @access  Privado/Barbero+
export const createSale = asyncHandler(async (req, res) => {
  console.log('🛒 Datos recibidos para venta:', req.body);
  console.log('👤 Usuario autenticado:', req.user);
  
  const sale = await SaleService.createSale(req.body);
  
  res.status(201).json({
    success: true,
    message: 'Venta registrada exitosamente',
    data: sale
  });
});

// @desc    Crear venta walk-in (sin cliente registrado)
// @route   POST /api/v1/sales/walk-in
// @access  Privado/Barbero+
export const createWalkInSale = asyncHandler(async (req, res) => {
  const sale = await SaleService.createWalkInSale(req.body);
  
  res.status(201).json({
    success: true,
    message: 'Venta walk-in registrada exitosamente',
    data: sale
  });
});

// @desc    Obtener reporte por período
// @route   GET /api/v1/sales/reports
// @access  Privado/Admin
export const getReports = asyncHandler(async (req, res) => {
  const { type, date, barberId } = req.query;

  if (!type || !date) {
    throw new AppError('El tipo de reporte y la fecha son requeridos', 400);
  }

  if (!['daily', 'weekly', 'monthly'].includes(type)) {
    throw new AppError('Tipo de reporte no válido. Use: daily, weekly, monthly', 400);
  }

  const report = await SaleService.getReportByPeriod(type, new Date(date));

  // Si se pasa barberId, filtrar solo ese barbero
  if (barberId) {
    const productSalesArr = Array.isArray(report.productSales) ? report.productSales : [];
    const filtered = productSalesArr.filter(b => String(b._id) === String(barberId));
    res.json({
      success: true,
      ...report,
      productSales: filtered
    });
    return;
  }

  res.json({
    success: true,
    ...report
  });
});

// @desc    Obtener reporte diario (mantener compatibilidad)
// @route   GET /api/v1/sales/daily-report
// @access  Privado/Admin
export const getDailyReport = asyncHandler(async (req, res) => {
  const { date } = req.query;
  
  if (!date) {
    throw new AppError('La fecha es requerida', 400);
  }
  
  const report = await SaleService.getDailyReport(new Date(date));
  
  res.json({
    success: true,
    date: date,
    data: report
  });
});

// @desc    Obtener todas las ventas
// @route   GET /api/v1/sales
// @access  Privado/Admin
export const getAllSales = asyncHandler(async (req, res) => {
  const sales = await SaleService.getAllSales(req.query);
  
  res.json({
    success: true,
    count: sales.length,
    data: sales
  });
});

// @desc    Obtener venta por ID
// @route   GET /api/v1/sales/:id
// @access  Privado/Admin
export const getSale = asyncHandler(async (req, res) => {
  const sale = await SaleService.getSaleById(req.params.id);
  
  res.json({
    success: true,
    data: sale
  });
});

// @desc    Cancelar venta
// @route   PUT /api/v1/sales/:id/cancel
// @access  Privado/Admin
export const cancelSale = asyncHandler(async (req, res) => {
  const sale = await SaleService.cancelSale(req.params.id);
  
  res.json({
    success: true,
    message: 'Venta cancelada exitosamente',
    data: sale
  });
});

// @desc    Obtener estadísticas de ventas por barbero
// @route   GET /api/v1/sales/barber/:barberId/stats
// @access  Privado/Admin
export const getBarberSalesStats = asyncHandler(async (req, res) => {
  const { barberId } = req.params;
  const stats = await SaleService.getBarberSalesStats(barberId);
  
  res.json({
    success: true,
    data: stats
  });
});

// @desc    Obtener reporte diario de ventas
// @route   GET /api/v1/sales/daily-report
// @access  Privado/Admin
export const getDailySalesReport = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const report = await SaleService.getDailyReport(date);
  
  res.json({
    success: true,
    data: report
  });
});

// @desc    Obtener fechas disponibles con datos de ventas para un barbero
// @route   GET /api/v1/sales/barber/:barberId/available-dates
// @access  Privado/Admin
export const getAvailableDates = asyncHandler(async (req, res) => {
  const { barberId } = req.params;
  
  let dates = [];
  if (barberId) {
    dates = await SaleService.getAvailableDates(barberId);
  } else {
    dates = await SaleService.getAvailableDates();
  }
  
  res.status(200).json({
    success: true,
    message: 'Fechas disponibles obtenidas correctamente',
    data: dates
  });
});
