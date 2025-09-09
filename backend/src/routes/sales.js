import express from 'express';
import {
  createSale,
  getAllSales,
  getSale,
  getDailyReport,
  getReports,
  cancelSale,
  getBarberSalesStats,
  getDailySalesReport,
  getAvailableDates,
  createWalkInSale
} from '../controllers/saleController.js';
import { protect, adminAuth, barberAuth } from '../middleware/auth.js';

const router = express.Router();

// Proteger todas las rutas
router.use(protect);

// Rutas para barberos y administradores (crear ventas)
router.post('/', barberAuth, createSale);
router.post('/walk-in', barberAuth, createWalkInSale);

// Rutas solo para administradores (reportes y gestión)
router.get('/', adminAuth, getAllSales);
router.get('/reports', adminAuth, getReports);
router.get('/daily-report', adminAuth, getDailyReport);

// Rutas de estadísticas (barberos pueden ver sus propias estadísticas)
router.get('/barber/:barberId/stats', barberAuth, getBarberSalesStats);
router.get('/barber/:barberId/available-dates', barberAuth, getAvailableDates);
// Endpoint global para fechas disponibles (solo admin)
router.get('/available-dates', adminAuth, getAvailableDates);


// Rutas específicas por ID (barberos pueden ver sus ventas, admin todas)
router.get('/:id', barberAuth, getSale);
router.put('/:id/cancel', adminAuth, cancelSale);

export default router;
