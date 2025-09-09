import express from 'express';
import {
  getBarbers,
  getBarber,
  getBarberAvailability,
  getBarberStats,
  getBarberByUserId,
  createBarber,
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
  validateImageRequired
} from '../middleware/upload.js';
import { cacheMiddleware, invalidateCacheMiddleware } from '../middleware/cache.js';

const router = express.Router();

// Cache patterns para invalidación
const CACHE_PATTERNS = [
  '^/api/barbers',
  '^/api/barbers/\\w+',
  '^/api/barbers/by-user/\\w+'
];

// Rutas públicas
router.get('/', cacheMiddleware(60 * 5), getBarbers); // Cache por 5 minutos

// Rutas protegidas que requieren autenticación
router.use(protect);

// Obtener barbero por ID de usuario (requiere autenticación)
router.get('/by-user/:userId', cacheMiddleware(60 * 5), getBarberByUserId);

// Rutas con ID genérico
router.get('/:id', validateIdParam, cacheMiddleware(60 * 5), getBarber);
router.get('/:id/availability', validateIdParam, cacheMiddleware(60), getBarberAvailability); // Cache por 1 minuto

// Estadísticas (admin o el mismo barbero)
router.get('/:id/stats', validateIdParam, sameUserOrAdmin, cacheMiddleware(60 * 15), getBarberStats); // Cache por 15 minutos

// Rutas que modifican datos
router.post('/',
  adminAuth,
  validateBarber,
  upload.single('image'),
  uploadToCloudinary,
  invalidateCacheMiddleware(CACHE_PATTERNS),
  createBarber
);

router.put('/:id',
  validateIdParam,
  validateBarber,
  sameUserOrAdmin,
  upload.single('image'),
  validateImageRequired,
  uploadToCloudinary,
  invalidateCacheMiddleware(CACHE_PATTERNS),
  editBarberProfile
);

router.delete('/:id',
  validateIdParam,
  adminAuth,
  invalidateCacheMiddleware(CACHE_PATTERNS),
  removeBarber
);

// Actualizar perfil de barbero (admin o el mismo barbero) - con upload opcional
router.put('/:id/profile', 
  validateIdParam, 
  sameUserOrAdmin, 
  upload.single('image'),  // Upload opcional (sin validateImageRequired)
  uploadToCloudinary,      // Procesar imagen si existe
  invalidateCacheMiddleware(CACHE_PATTERNS),
  editBarberProfile
);

// Remover barbero (cambiar a rol user) - solo admin
router.put('/:id/remove', validateIdParam, adminAuth, removeBarber);

export default router;