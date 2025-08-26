const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const auth = require('../middlewares/auth');
const { validateService, validateServiceId } = require('../middlewares/serviceValidation');

// Obtener servicios (público)
router.get('/', serviceController.getServices);

// Las siguientes rutas requieren autenticación
router.use(auth);

// Crear servicio (solo admin)
router.post('/', validateService, serviceController.createService);

// Actualizar servicio (solo admin)
router.put('/:id', validateServiceId, validateService, serviceController.updateService);

// Eliminar servicio (solo admin)
router.delete('/:id', validateServiceId, serviceController.deleteService);

module.exports = router;