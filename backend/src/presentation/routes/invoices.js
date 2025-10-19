import express from 'express';
import { protect, barberAuth } from '../middleware/auth.js';
import * as invoiceController from '../controllers/invoiceController.js';

const router = express.Router();

// ========== RUTAS DE FACTURAS ==========

// Generar factura desde venta (Barber, Admin)
router.post(
  '/generate/:saleId',
  protect,
  barberAuth,
  invoiceController.generateInvoice
);

// Imprimir factura (Barber, Admin)
router.post(
  '/print/:invoiceId',
  protect,
  barberAuth,
  invoiceController.printInvoice
);

// Obtener factura por ID (Barber, Admin)
router.get(
  '/:invoiceId',
  protect,
  barberAuth,
  invoiceController.getInvoice
);

// Obtener facturas por venta (Barber, Admin)
router.get(
  '/sale/:saleId',
  protect,
  barberAuth,
  invoiceController.getInvoicesBySale
);

// Listar facturas con filtros (Barber: propias, Admin: todas)
router.get(
  '/',
  protect,
  barberAuth,
  invoiceController.listInvoices
);

// Estadísticas de facturas (Barber: propias, Admin: todas)
router.get(
  '/stats',
  protect,
  barberAuth,
  invoiceController.getInvoiceStats
);

// Cancelar factura (Solo Admin)
router.put(
  '/:invoiceId/cancel',
  protect,
  barberAuth,
  invoiceController.cancelInvoice
);

// ========== RUTAS DE IMPRESORA ==========

// Test de impresión (Solo Admin)
router.post(
  '/printer/test',
  protect,
  barberAuth,
  invoiceController.testPrinter
);

// Estado de impresora (Admin)
router.get(
  '/printer/status',
  protect,
  barberAuth,
  invoiceController.getPrinterStatus
);

// Conectar impresora (Admin)
router.post(
  '/printer/connect',
  protect,
  barberAuth,
  invoiceController.connectPrinter
);

// Desconectar impresora (Admin)
router.post(
  '/printer/disconnect',
  protect,
  barberAuth,
  invoiceController.disconnectPrinter
);

export default router;
