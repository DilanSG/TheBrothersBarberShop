const express = require('express');
const router = express.Router();
const {
  getServices,
  getService,
  createService,
  updateService,
  deleteService
} = require('../controllers/serviceController');
const { auth, adminAuth } = require('../middleware/auth');
const { validateService, validateIdParam } = require('../middleware/validation');

// Rutas públicas
router.get('/', getServices);
router.get('/:id', validateIdParam, getService);

// Rutas protegidas - Admin only
router.post('/', auth, adminAuth, validateService, createService);
router.put('/:id', auth, adminAuth, validateIdParam, validateService, updateService);
router.delete('/:id', auth, adminAuth, validateIdParam, deleteService);

module.exports = router;