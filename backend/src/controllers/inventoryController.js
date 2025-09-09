import InventoryService from '../services/inventoryService.js';
import InventoryLogService from '../services/inventoryLogService.js';
import { asyncHandler } from '../middleware/index.js';
import { AppError } from '../utils/errors.js';

// @desc    Obtener lista de items del inventario
// @route   GET /api/inventory
// @access  Privado
export const getInventory = asyncHandler(async (req, res) => {
  const filters = {};
  if (req.query.category) filters.category = req.query.category;
  if (req.query.minStock) filters.stock = { $lte: parseInt(req.query.minStock) };

  const items = await InventoryService.getAllItems(filters);
  res.json({ 
    success: true, 
    count: items.length,
    data: items 
  });
});

// @desc    Obtener un item específico
// @route   GET /api/inventory/:id
// @access  Privado
export const getInventoryItem = asyncHandler(async (req, res) => {
  const item = await InventoryService.getItemById(req.params.id);
  res.json({ success: true, data: item });
});

// @desc    Crear nuevo item
// @route   POST /api/inventory
// @access  Privado/Admin
export const createInventoryItem = asyncHandler(async (req, res) => {
  const item = await InventoryService.createItem(req.body);
  
  // Registrar log de creación
  await InventoryLogService.createLog(
    'create',
    item._id,
    item.name,
    req.user._id,
    req.user.role,
    {
      message: `Item "${item.name}" creado`,
      category: item.category,
      initialStock: item.stock
    },
    null,
    item
  );

  res.status(201).json({ 
    success: true, 
    message: 'Item creado exitosamente',
    data: item 
  });
});

// @desc    Actualizar item
// @route   PUT /api/inventory/:id
// @access  Privado/Admin
export const updateInventoryItem = asyncHandler(async (req, res) => {
  // Obtener estado anterior
  const previousItem = await InventoryService.getItemById(req.params.id);
  const item = await InventoryService.updateItem(req.params.id, req.body);
  
  // Registrar log de actualización
  await InventoryLogService.createLog(
    'update',
    item._id,
    item.name,
    req.user._id,
    req.user.role,
    {
      message: `Item "${item.name}" actualizado`,
      updatedFields: Object.keys(req.body)
    },
    previousItem,
    item
  );

  res.json({ 
    success: true, 
    message: 'Item actualizado exitosamente',
    data: item 
  });
});

// @desc    Eliminar item
// @route   DELETE /api/inventory/:id
// @access  Privado/Admin
export const deleteInventoryItem = asyncHandler(async (req, res) => {
  const result = await InventoryService.deleteItem(req.params.id);
  res.json({ 
    success: true, 
    message: result.message 
  });
});

// @desc    Ajustar stock de un item
// @route   POST /api/inventory/:id/stock
// @access  Privado/Admin
export const adjustStock = asyncHandler(async (req, res) => {
  const { quantity, type, reason } = req.body;
  
  if (!quantity || !type || !reason) {
    throw new AppError('Cantidad, tipo y razón son requeridos', 400);
  }

  const item = await InventoryService.adjustStock(
    req.params.id,
    Number(quantity),
    type,
    reason
  );

  res.json({ 
    success: true, 
    message: 'Stock ajustado exitosamente',
    data: item 
  });
});

// @desc    Obtener items por categoría
// @route   GET /api/inventory/category/:category
// @access  Privado
export const getItemsByCategory = asyncHandler(async (req, res) => {
  const items = await InventoryService.getItemsByCategory(req.params.category);
  res.json({ 
    success: true, 
    count: items.length,
    data: items 
  });
});

// @desc    Obtener items con bajo stock
// @route   GET /api/inventory/low-stock
// @access  Privado
export const getLowStockItems = asyncHandler(async (req, res) => {
  const threshold = req.query.threshold ? parseInt(req.query.threshold) : 5;
  const items = await InventoryService.getLowStockItems(threshold);
  res.json({ 
    success: true, 
    count: items.length,
    data: items 
  });
});

// @desc    Obtener historial de movimientos
// @route   GET /api/inventory/:id/history
// @access  Privado
export const getMovementHistory = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const history = await InventoryService.getMovementHistory(
    req.params.id,
    startDate,
    endDate
  );
  res.json({ 
    success: true, 
    data: history 
  });
});

// @desc    Obtener estadísticas del inventario
// @route   GET /api/inventory/stats
// @access  Privado/Admin
export const getInventoryStats = asyncHandler(async (req, res) => {
  const stats = await InventoryService.getInventoryStats();
  res.json({ 
    success: true, 
    data: stats 
  });
});

// @desc    Obtener logs de inventario (solo admin)
// @route   GET /api/inventory/logs
// @access  Privado/Admin
export const getInventoryLogs = asyncHandler(async (req, res) => {
  const filters = {
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    action: req.query.action,
    performedBy: req.query.performedBy,
    userRole: req.query.userRole,
    limit: parseInt(req.query.limit) || 100
  };

  const logs = await InventoryLogService.getLogsForAdmin(filters);
  res.json({ 
    success: true, 
    count: logs.length,
    data: logs 
  });
});

// @desc    Obtener estadísticas de logs
// @route   GET /api/inventory/logs/stats
// @access  Privado/Admin
export const getInventoryLogStats = asyncHandler(async (req, res) => {
  const filters = {
    startDate: req.query.startDate,
    endDate: req.query.endDate
  };

  const stats = await InventoryLogService.getLogStats(filters);
  res.json({ 
    success: true, 
    data: stats 
  });
});

// @desc    Obtener reporte diario de inventario
// @route   GET /api/v1/inventory/daily-report
// @access  Privado/Admin
export const getDailyInventoryReport = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const report = await InventoryService.getDailyReport(date);
  
  res.json({
    success: true,
    data: report
  });
});
