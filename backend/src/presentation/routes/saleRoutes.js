import express from 'express';
import { 
  createSale,
  createWalkInSale,
  getAllSales,
  getSaleById,
  updateSale,
  deleteSale,
  getSalesByDateRange,
  getSalesByBarber,
  getSalesByProduct,
  getSalesStatistics,
  getFinancialSummary
} from '../controllers/saleController.js';
import { protect, adminAuth, barberAuth } from '../middleware/auth.js';
import { validateIdParam } from '../middleware/validation.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = express.Router();

// Rutas públicas (requieren autenticación básica)
router.use(protect);

// Crear nueva venta
router.post('/', barberAuth, createSale);

// Crear venta walk-in
router.post('/walk-in', barberAuth, createWalkInSale);

// Obtener todas las ventas
router.get('/', cacheMiddleware(60), getAllSales);

// Obtener resumen financiero
router.get('/financial-summary', cacheMiddleware(300), getFinancialSummary);

// Obtener estadísticas de ventas
router.get('/statistics', adminAuth, cacheMiddleware(300), getSalesStatistics);

// Obtener ventas por rango de fechas
router.get('/date-range', cacheMiddleware(60), getSalesByDateRange);

// Obtener ventas por barbero
router.get('/barber/:barberId', validateIdParam, cacheMiddleware(60), getSalesByBarber);

// Obtener ventas por producto
router.get('/product/:productId', validateIdParam, cacheMiddleware(60), getSalesByProduct);

// Obtener venta por ID
router.get('/:id', validateIdParam, cacheMiddleware(60), getSaleById);

// Actualizar venta
router.put('/:id', validateIdParam, adminAuth, updateSale);

// Eliminar venta
router.delete('/:id', validateIdParam, adminAuth, deleteSale);

export default router;