import express from 'express';
import {
  getBarbers,
  getBarber,
  getBarberAvailability,
  getBarberStats,
  getBarberByUserId,
  editBarberProfile,
  removeBarber
} from '../controllers/barberController.js';
import {
  protect,
  adminAuth,
  barberAuth,
  sameUserOrAdmin
} from '../middleware/auth.js';
import {
  validateBarber,
  validateIdParam,
  validatePagination
} from '../middleware/validation.js';
import {
  upload,
  uploadToCloudinary,
  validateImage
} from '../middleware/upload.js';

const router = express.Router();

// Rutas públicas
router.get('/', getBarbers);

// Rutas protegidas que requieren autenticación
router.use(protect);

// Obtener barbero por ID de usuario (requiere autenticación)
router.get('/by-user/:userId', getBarberByUserId);

// Rutas con ID genérico
router.get('/:id', validateIdParam, getBarber);
router.get('/:id/availability', validateIdParam, getBarberAvailability);

// Estadísticas (admin o el mismo barbero)
router.get('/:id/stats', validateIdParam, sameUserOrAdmin, getBarberStats);

// Actualizar perfil de barbero (admin o el mismo barbero)
router.put('/:id/profile', validateIdParam, sameUserOrAdmin, editBarberProfile);

// Remover barbero (cambiar a rol user) - solo admin
router.put('/:id/remove', validateIdParam, adminAuth, removeBarber);

export default router;