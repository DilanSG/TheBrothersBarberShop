import express from 'express';
import { protect, adminAuth } from '../middleware/auth.js';
import * as refundController from '../controllers/refundController.js';

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(protect);

// @route   POST /api/refunds/:saleId
// @desc    Procesar reembolso de una venta específica
// @access  Privado (Barberos con código admin)
router.post('/:saleId', refundController.processRefund);

// @route   GET /api/refunds
// @desc    Obtener todas las ventas reembolsadas (filtradas por rol)
// @access  Privado
router.get('/', refundController.getRefundedSales);

// @route   GET /api/refunds/my-sales
// @desc    Obtener ventas del barbero para poder reembolsar
// @access  Privado (Barberos)
router.get('/my-sales', refundController.getMySalesForRefund);

// @route   GET /api/refunds/summary
// @desc    Obtener resumen de reembolsos por barbero
// @access  Solo Admin
router.get('/summary', adminAuth, refundController.getRefundsSummary);

// @route   GET /api/refunds/verification-code
// @desc    Obtener código de verificación actual para reembolsos
// @access  Solo Admin
router.get('/verification-code', adminAuth, refundController.getVerificationCode);

// @route   DELETE /api/refunds/:saleId
// @desc    Eliminar reembolso (reversar a venta normal)
// @access  Solo Admin
router.delete('/:saleId', adminAuth, refundController.deleteRefund);

// @route   DELETE /api/refunds/:saleId/permanent
// @desc    Eliminar reembolso permanentemente del sistema
// @access  Solo Admin
router.delete('/:saleId/permanent', adminAuth, refundController.permanentDeleteRefund);

export default router;