const express = require('express');
const router = express.Router();
const barberController = require('../controllers/barberController');
const auth = require('../middlewares/auth');
const { validateBarber, validateBarberId } = require('../middlewares/barberValidation');

// Obtener barberos y disponibilidad (público)
router.get('/', barberController.getBarbers);
router.get('/:id/availability', barberController.getBarberAvailability);

// Las siguientes rutas requieren autenticación
router.use(auth);

// Crear barbero (solo admin)
router.post('/', validateBarber, barberController.createBarber);

// Actualizar barbero (solo admin)
router.put('/:id', validateBarberId, validateBarber, barberController.updateBarber);

// Eliminar barbero (solo admin)
router.delete('/:id', validateBarberId, barberController.deleteBarber);

module.exports = router;