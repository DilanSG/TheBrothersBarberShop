const express = require('express');
const router = express.Router();
const {
  getBarbers,
  getBarber,
  getBarberAvailability,
  createBarber,
  updateBarber,
  deleteBarber,
  getBarberStats
} = require('../controllers/barberController');
const {
  auth,
  adminAuth,
  barberAuth,
  sameUserOrAdmin
} = require('../middleware/auth');
const {
  validateBarber,
  validateIdParam,
  validatePagination
} = require('../middleware/validation');
const {
  upload,
  uploadToCloudinary,
  validateImage
} = require('../middleware/upload');

// Rutas públicas
router.get('/', validatePagination, getBarbers);
router.get('/:id', validateIdParam, getBarber);
router.get('/:id/availability', validateIdParam, getBarberAvailability);

// Rutas protegidas
router.use(auth);

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

module.exports = router;