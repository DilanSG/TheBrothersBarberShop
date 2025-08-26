import express from 'express';
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  cancelAppointmentWithReason
} from '../controllers/appointmentController.js';
import { protect } from '../middleware/auth.js';
import { validateAppointmentCreation, validateAppointmentUpdate, checkAppointmentConflict, checkAppointmentOwnership } from '../middleware/validation.js';

const router = express.Router();

// Cancelar cita por barbero con motivo
router.post('/:id/cancel', cancelAppointmentWithReason);

// Todas las rutas requieren autenticación
router.use(protect);

// Obtener citas
router.get('/', getAppointments);

// Crear cita
router.post(
  '/',
  validateAppointmentCreation,
  checkAppointmentConflict,
  createAppointment
);

// Obtener/actualizar/eliminar cita específica
router.route('/:id')
  .all(checkAppointmentOwnership)
  .put(validateAppointmentUpdate, updateAppointment)
  .delete(deleteAppointment);

export default router;