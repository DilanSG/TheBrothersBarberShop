import express from 'express';
import {
  getBarbers,
  getBarber,
  getBarberAvailability,
  createBarber,
  updateBarber,
  deleteBarber,
  getBarberStats
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
router.get('/', validatePagination, getBarbers);
router.get('/:id', validateIdParam, getBarber);
router.get('/:id/availability', validateIdParam, getBarberAvailability);

// Rutas protegidas
router.use(protect);

// Estadísticas (admin o el mismo barbero)
router.get('/:id/stats', validateIdParam, sameUserOrAdmin, getBarberStats);

// Crear barbero (solo admin)
router.post(
  '/',
  adminAuth,
  upload.single('photo'),
  validateImage,
  uploadToCloudinary,
  validateBarber,
  createBarber
);

// Actualizar barbero (admin o el mismo barbero)
router.put(
  '/:id',
  validateIdParam,
  sameUserOrAdmin,
  upload.single('photo'),
  validateImage,
  uploadToCloudinary,
  validateBarber,
  updateBarber
);

// Eliminar barbero (solo admin)
router.delete('/:id', validateIdParam, adminAuth, deleteBarber);

export default router;