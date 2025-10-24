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
  createWalkInSale,
  getDetailedSalesReport,
  getWalkInDetails,
  getDetailedCutsReport,
  getFinancialSummary,
  createCartSale
} from '../controllers/saleController.js';
import { protect, adminAuth, barberAuth } from '../middleware/auth.js';
import { validateSale, validateCartSale } from '../middleware/validation.js';

const router = express.Router();

// Proteger todas las rutas
router.use(protect);

// Rutas para barberos y administradores (crear ventas)
router.post('/', barberAuth, validateSale, createSale);
router.post('/walk-in', barberAuth, validateSale, createWalkInSale);
router.post('/cart', barberAuth, validateCartSale, createCartSale);

// Rutas solo para administradores (reportes y gestión)
router.get('/', adminAuth, getAllSales);
router.get('/reports', adminAuth, getReports);
router.get('/daily-report', adminAuth, getDailyReport);
router.get('/detailed-report', adminAuth, getDetailedSalesReport);
router.get('/detailed-cuts-report', adminAuth, getDetailedCutsReport);
router.get('/financial-summary', adminAuth, getFinancialSummary);
router.get('/walk-in-details', adminAuth, getWalkInDetails);

// Rutas de estadísticas (barberos pueden ver sus propias estadísticas)
router.get('/barber/:barberId/stats', barberAuth, getBarberSalesStats);
router.get('/barber/:barberId/available-dates', barberAuth, getAvailableDates);
// Endpoint global para fechas disponibles (solo admin)
router.get('/available-dates', adminAuth, getAvailableDates);

// Rutas específicas por ID (barberos pueden ver sus ventas, admin todas)
router.get('/:id', barberAuth, getSale);
router.put('/:id/cancel', adminAuth, cancelSale);

export default router;
