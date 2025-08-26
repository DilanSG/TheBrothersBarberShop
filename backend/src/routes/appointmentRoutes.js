const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const auth = require('../middlewares/auth');
const {
    validateAppointmentCreation,
    validateAppointmentUpdate,
    checkAppointmentConflict,
    checkAppointmentOwnership
} = require('../middlewares/appointmentValidation');

// Todas las rutas requieren autenticación
router.use(auth);

// Obtener citas
router.get('/', appointmentController.getAppointments);

// Crear cita
router.post('/',
    validateAppointmentCreation,
    checkAppointmentConflict,
    appointmentController.createAppointment
);

// Obtener/actualizar/eliminar cita específica
router.route('/:id')
    .all(checkAppointmentOwnership)
    .get(appointmentController.getAppointmentById)
    .put(validateAppointmentUpdate, appointmentController.updateAppointment)
    .delete(appointmentController.deleteAppointment);

module.exports = router;