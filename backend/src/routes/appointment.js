import { Router } from 'express';
import {
  getAppointments,
  getBarberAppointments,
  getBarberAvailability,
  createAppointment,
  getAppointment,
  updateAppointment,
  cancelAppointment,
  completeAppointment,
  approveAppointment,
  markNoShow,
  getAppointmentStats,
  deleteAppointment,
  cleanupDeletedAppointments,
  cleanupExpiredAppointments,
  getCancellationReason,
  getBarberAppointmentStats,
  getDailyAppointmentReport,
  getAvailableDates
} from '../controllers/appointmentController.js';
import { protect, adminAuth } from '../middleware/auth.js';
import { 
  validateAppointmentCreation, 
  validateAppointmentUpdate, 
  validateId,
  validateBarberId
} from '../middleware/validation.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas públicas (requieren autenticación)
router.get('/', getAppointments);
router.get('/barber/:barberId', validateBarberId, getBarberAppointments);
router.get('/availability/:barberId', validateBarberId, getBarberAvailability);
router.post('/', validateAppointmentCreation, createAppointment);

// Rutas admin (deben ir antes que las rutas con :id)
router.get('/stats', adminAuth, getAppointmentStats);
router.get('/barber/:barberId/stats', adminAuth, getBarberAppointmentStats);
router.get('/barber/:barberId/available-dates', adminAuth, getAvailableDates);
router.get('/daily-report', adminAuth, getDailyAppointmentReport);
router.post('/cleanup', adminAuth, cleanupDeletedAppointments);
router.post('/cleanup-expired', adminAuth, cleanupExpiredAppointments);

// Rutas específicas por ID (deben ir al final)
router.get('/:id', validateId, getAppointment);
router.get('/:id/cancellation-reason', validateId, getCancellationReason);
router.put('/:id', validateId, validateAppointmentUpdate, updateAppointment);
router.delete('/:id', validateId, deleteAppointment);

// Rutas de cambio de estado
router.put('/:id/cancel', validateId, cancelAppointment);
router.put('/:id/approve', validateId, approveAppointment);
router.put('/:id/complete', validateId, completeAppointment);
router.put('/:id/no-show', validateId, markNoShow);

export default router;