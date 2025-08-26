import express from 'express';
import {
  getServices,
  getService,
  createService,
  updateService,
  deleteService
} from '../controllers/serviceController.js';
import { protect, adminAuth } from '../middleware/auth.js';
import { validateService, validateIdParam } from '../middleware/validation.js';

const router = express.Router();

// Rutas públicas
router.get('/', getServices);
router.get('/:id', validateIdParam, getService);

// Rutas protegidas - Solo admin
router.post('/', protect, adminAuth, validateService, createService);
router.put('/:id', protect, adminAuth, validateIdParam, validateService, updateService);
router.delete('/:id', protect, adminAuth, validateIdParam, deleteService);

export default router;