// Archivo principal que exporta todos los middlewares
const { auth, adminAuth, barberAuth, sameUserOrAdmin } = require('./auth');
const {
  validateUser,
  validateService,
  validateBarber,
  validateAppointment,
  validateReview,
  validateIdParam,
  validatePagination,
  handleValidationErrors
} = require('./validation');
const {
  errorHandler,
  notFound,
  asyncHandler,
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError
} = require('./errorHandler');
const {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
  validateImage
} = require('./upload');
const {
  logger,
  requestLogger,
  errorLogger
} = require('./logger');

module.exports = {
  // Autenticación
  auth,
  adminAuth,
  barberAuth,
  sameUserOrAdmin,
  
  // Validación
  validateUser,
  validateService,
  validateBarber,
  validateAppointment,
  validateReview,
  validateIdParam,
  validatePagination,
  handleValidationErrors,
  
  // Manejo de errores
  errorHandler,
  notFound,
  asyncHandler,
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  
  // Upload de archivos
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
  validateImage,
  
  // Logging
  logger,
  requestLogger,
  errorLogger
};