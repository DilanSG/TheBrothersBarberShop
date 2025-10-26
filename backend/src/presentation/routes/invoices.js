import express from 'express';
import { protect, barberAuth } from '../middleware/auth.js';
import { protectFlexible } from '../middleware/flexibleAuth.js';
import * as invoiceController from '../controllers/invoiceController.js';

const router = express.Router();

// ========== RUTAS DE FACTURAS ==========
// IMPORTANTE: Las rutas específicas (con palabras fijas) deben ir ANTES de las rutas con parámetros dinámicos

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

// ===== RUTAS GET CON PATHS ESPECÍFICOS (ANTES DE PARÁMETROS DINÁMICOS) =====

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

// Ver factura desde venta (genera si no existe) - /sale/:saleId/view
router.get(
  '/sale/:saleId/view',
  protectFlexible,
  invoiceController.viewInvoiceFromSale
);

// Obtener facturas por venta - /sale/:saleId
router.get(
  '/sale/:saleId',
  protect,
  barberAuth,
  invoiceController.getInvoicesBySale
);

// ===== RUTAS CON PARÁMETROS DINÁMICOS (AL FINAL) =====

// Ver factura en HTML (navegador) - /:invoiceId/view
router.get(
  '/:invoiceId/view',
  protectFlexible,
  invoiceController.viewInvoiceHTML
);

// Obtener factura por ID - /:invoiceId
router.get(
  '/:invoiceId',
  protect,
  barberAuth,
  invoiceController.getInvoice
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
