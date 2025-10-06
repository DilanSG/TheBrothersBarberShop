import express from 'express';
import {
  getInventory,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  adjustStock,
  getItemsByCategory,
  getLowStockItems,
  getMovementHistory,
  getInventoryStats,
  getInventoryLogs,
  getInventoryLogStats,
  getDailyInventoryReport,
  debugLogs,
  fixInventoryConsistency
} from '../controllers/inventoryController.js';
import { protect, adminAuth, barberAuth } from '../middleware/auth.js';
import { validateIdParam, validateInventoryItem } from '../middleware/validation.js';

const router = express.Router();

// Rutas protegidas - Barberos y admin pueden ver
router.get('/', protect, barberAuth, getInventory);
router.get('/low-stock', protect, barberAuth, getLowStockItems);
router.get('/stats/overview', protect, adminAuth, getInventoryStats);
router.get('/daily-report', protect, adminAuth, getDailyInventoryReport);
router.get('/logs', protect, adminAuth, getInventoryLogs);
router.get('/logs/stats', protect, adminAuth, getInventoryLogStats);
router.get('/debug/logs', protect, adminAuth, debugLogs);
router.get('/category/:category', protect, barberAuth, validateIdParam, getItemsByCategory);
router.get('/:id', protect, barberAuth, validateIdParam, getInventoryItem);
router.get('/:id/history', protect, barberAuth, validateIdParam, getMovementHistory);

// Rutas protegidas - Barberos pueden crear/editar, admin puede todo
router.post('/', protect, barberAuth, validateInventoryItem, createInventoryItem);
router.put('/:id', protect, barberAuth, validateIdParam, validateInventoryItem, updateInventoryItem);
router.post('/:id/stock', protect, barberAuth, validateIdParam, adjustStock);

// Rutas solo para admin
router.delete('/:id', protect, adminAuth, validateIdParam, deleteInventoryItem);
router.post('/fix-consistency', protect, adminAuth, fixInventoryConsistency);

export default router;
