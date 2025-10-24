import { Review, Appointment, Barber } from '../../core/domain/entities/index.js';
import { asyncHandler } from '../middleware/index.js';
import { logger } from '../../shared/utils/logger.js';
import { AppError, CommonErrors } from '../../shared/utils/errors.js';

/**
 * @desc    Crear una nueva reseña
 * @route   POST /api/v1/reviews
 * @access  Private (Client)
 */
export const createReview = asyncHandler(async (req, res) => {
  const { appointmentId, barberId, rating, comment } = req.body;
  const userId = req.user._id;

  // Validar que la cita existe y pertenece al usuario
  const appointment = await Appointment.findById(appointmentId);
  
  if (!appointment) {
    throw new AppError('Cita no encontrada', 404);
  }

  if (appointment.user.toString() !== userId.toString()) {
    throw new AppError('No tienes permiso para calificar esta cita', 403);
  }

  if (appointment.status !== 'completed') {
    throw new AppError('Solo puedes calificar citas completadas', 400);
  }

  // Verificar que no exista ya una review para esta cita
  const existingReview = await Review.findOne({ appointment: appointmentId });
  
  if (existingReview) {
    throw new AppError('Ya has dejado una reseña para esta cita', 400);
  }

  // Crear la reseña con manejo de error de duplicado
  let review;
  try {
    review = await Review.create({
      appointment: appointmentId,
      user: userId,
      barber: barberId,
      rating,
      comment: comment || ''
    });
  } catch (error) {
    // Manejar error de índice duplicado (por si acaso pasa concurrentemente)
    if (error.code === 11000) {
      throw new AppError('Ya has dejado una reseña para esta cita o barbero', 400);
    }
    throw error;
  }

  // Poblar información del usuario y barbero
  await review.populate([
    { path: 'user', select: 'name email' },
    { path: 'barber', select: 'user specialty' }
  ]);

  logger.info(`Review creada - Usuario: ${userId}, Barbero: ${barberId}, Rating: ${rating}`);

  res.status(201).json({
    success: true,
    message: 'Reseña creada exitosamente',
    data: review
  });
});

/**
 * @desc    Obtener reseñas de un barbero
 * @route   GET /api/v1/reviews/barber/:barberId
 * @access  Public
 */
export const getBarberReviews = asyncHandler(async (req, res) => {
  const { barberId } = req.params;
  const { page = 1, limit = 10, status = 'approved' } = req.query;

  const query = { barber: barberId, status };

  const reviews = await Review.find(query)
    .populate('user', 'name')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();

  const total = await Review.countDocuments(query);

  res.status(200).json({
    success: true,
    data: reviews,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @desc    Obtener estadísticas de rating de un barbero
 * @route   GET /api/v1/reviews/barber/:barberId/stats
 * @access  Public
 */
export const getBarberRatingStats = asyncHandler(async (req, res) => {
  const { barberId } = req.params;

  const stats = await Review.calculateBarberRating(barberId);

  res.status(200).json({
    success: true,
    data: stats
  });
});

/**
 * @desc    Verificar si un usuario puede dejar reseña para una cita
 * @route   GET /api/v1/reviews/check/:appointmentId
 * @access  Private
 */
export const checkReviewEligibility = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const userId = req.user._id;

  const appointment = await Appointment.findById(appointmentId);
  
  if (!appointment) {
    throw new AppError('Cita no encontrada', 404);
  }

  if (appointment.user.toString() !== userId.toString()) {
    throw new AppError('No tienes permiso para verificar esta cita', 403);
  }

  const existingReview = await Review.findOne({ appointment: appointmentId });

  // Permitir entrar si la cita está completada (con o sin reseña)
  const eligible = appointment.status === 'completed';

  // Poblar datos del appointment para mostrar en el frontend
  await appointment.populate([
    { 
      path: 'barber', 
      select: 'user specialty',
      populate: { path: 'user', select: 'name email' }
    },
    { path: 'service', select: 'name price duration' }
  ]);

  res.status(200).json({
    success: true,
    data: {
      eligible,
      message: !eligible ? 
        'Solo puedes calificar citas completadas' : 
        (existingReview ? 'Ya has calificado esta cita' : null),
      appointment,
      hasReview: !!existingReview,
      review: existingReview || null
    }
  });
});

/**
 * @desc    Obtener reseñas del usuario autenticado
 * @route   GET /api/v1/reviews/my-reviews
 * @access  Private
 */
export const getMyReviews = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const reviews = await Review.find({ user: userId })
    .populate('barber', 'user specialty')
    .populate('appointment', 'date service')
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    data: reviews
  });
});

/**
 * @desc    Actualizar una reseña (solo comentario, no rating)
 * @route   PUT /api/v1/reviews/:id
 * @access  Private
 */
export const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;
  const userId = req.user._id;

  const review = await Review.findById(id);

  if (!review) {
    throw new AppError('Reseña no encontrada', 404);
  }

  if (review.user.toString() !== userId.toString()) {
    throw new AppError('No tienes permiso para editar esta reseña', 403);
  }

  review.comment = comment;
  await review.save();

  logger.info(`Review actualizada - ID: ${id}, Usuario: ${userId}`);

  res.status(200).json({
    success: true,
    message: 'Reseña actualizada exitosamente',
    data: review
  });
});

/**
 * @desc    Eliminar una reseña
 * @route   DELETE /api/v1/reviews/:id
 * @access  Private/Admin
 */
export const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findByIdAndDelete(id);

  if (!review) {
    throw new AppError('Reseña no encontrada', 404);
  }

  logger.info(`Review eliminada - ID: ${id}`);

  res.status(200).json({
    success: true,
    message: 'Reseña eliminada exitosamente'
  });
});
