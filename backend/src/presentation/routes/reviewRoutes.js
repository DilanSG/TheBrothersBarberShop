import express from 'express';
import { 
  createReview,
  getBarberReviews,
  getBarberRatingStats,
  checkReviewEligibility,
  getMyReviews,
  updateReview,
  deleteReview
} from '../controllers/reviewController.js';
import { protect, adminAuth } from '../middleware/auth.js';
import { body } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Validaciones
const createReviewValidation = [
  body('appointmentId')
    .notEmpty().withMessage('El ID de la cita es requerido')
    .isMongoId().withMessage('ID de cita inválido'),
  body('barberId')
    .notEmpty().withMessage('El ID del barbero es requerido')
    .isMongoId().withMessage('ID de barbero inválido'),
  body('rating')
    .notEmpty().withMessage('La calificación es requerida')
    .isInt({ min: 1, max: 5 }).withMessage('La calificación debe ser entre 1 y 5'),
  body('comment')
    .optional()
    .isString().withMessage('El comentario debe ser texto')
    .isLength({ max: 500 }).withMessage('El comentario no puede exceder 500 caracteres'),
  handleValidationErrors
];

const updateReviewValidation = [
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('La calificación debe ser entre 1 y 5'),
  body('comment')
    .optional()
    .isString().withMessage('El comentario debe ser texto')
    .isLength({ max: 500 }).withMessage('El comentario no puede exceder 500 caracteres'),
  handleValidationErrors
];

// Rutas públicas
router.get('/barber/:barberId', getBarberReviews);
router.get('/barber/:barberId/stats', getBarberRatingStats);

// Rutas privadas (usuarios autenticados)
router.post('/', protect, createReviewValidation, createReview);
router.get('/check/:appointmentId', protect, checkReviewEligibility);
router.get('/my-reviews', protect, getMyReviews);
router.put('/:id', protect, updateReviewValidation, updateReview);

// Rutas de admin
router.delete('/:id', protect, adminAuth, deleteReview);

export default router;
