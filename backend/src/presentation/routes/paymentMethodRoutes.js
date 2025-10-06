import express from 'express';
import { 
  getPaymentMethods, 
  createPaymentMethod, 
  updatePaymentMethod, 
  deletePaymentMethod,
  initializePaymentMethods,
  normalizePaymentMethods
} from '../controllers/paymentMethodController.js';
import { protect, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas para usuarios autenticados
router.get('/', protect, getPaymentMethods);

// Rutas administrativas
router.use(protect, adminAuth); // Todas las rutas siguientes requieren admin

router.post('/', createPaymentMethod);
router.put('/:backendId', updatePaymentMethod);
router.delete('/:backendId', deletePaymentMethod);

// Rutas especiales para gestión del sistema
router.post('/initialize', initializePaymentMethods);
router.post('/normalize', normalizePaymentMethods);

export default router;