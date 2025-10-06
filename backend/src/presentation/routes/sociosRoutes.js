import express from 'express';
import { 
  getSocios,
  getDistribucion, 
  getAdminsDisponibles,
  asignarSocio,
  updatePorcentaje,
  updateSocio,
  deleteSocio,
  getEstadisticas,
  getCurrentUser
} from '../controllers/sociosController.js';
import { 
  validateCreateSocio,
  validateUpdatePorcentaje,
  validateDistribucion,
  validateId
} from '../middleware/validation.js';
import { protect, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(protect);

// @desc    Obtener todos los socios activos
// @route   GET /api/socios
// @access  Privado
router.get('/', getSocios);

// @desc    Obtener información del usuario actual
// @route   GET /api/socios/current-user
// @access  Privado
router.get('/current-user', getCurrentUser);

// @desc    Obtener estadísticas de socios
// @route   GET /api/socios/estadisticas
// @access  Privado
router.get('/estadisticas', getEstadisticas);

// @desc    Obtener distribución de ganancias
// @route   GET /api/socios/distribucion
// @access  Privado
router.get('/distribucion', validateDistribucion, getDistribucion);

// @desc    Obtener admins disponibles para ser socios
// @route   GET /api/socios/admins-disponibles
// @access  Privado (solo fundador)
router.get('/admins-disponibles', getAdminsDisponibles);

// @desc    Asignar subrol de socio a un admin
// @route   POST /api/socios
// @access  Privado (solo fundador)
router.post('/', validateCreateSocio, asignarSocio);

// @desc    Actualizar porcentaje de socio
// @route   PUT /api/socios/:id/porcentaje
// @access  Privado (solo fundador o admin)
router.put('/:id/porcentaje', validateUpdatePorcentaje, updatePorcentaje);

// @desc    Actualizar datos de socio
// @route   PUT /api/socios/:id
// @access  Privado (el mismo socio o fundador)
router.put('/:id', validateId, updateSocio);

// @desc    Desactivar socio
// @route   DELETE /api/socios/:id
// @access  Privado (solo fundador)
router.delete('/:id', validateId, deleteSocio);

export default router;