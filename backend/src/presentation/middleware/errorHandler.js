import mongoose from 'mongoose';
import { AppError, CommonErrors, logger } from '../../barrel.js';

const handleCastErrorDB = err => {
  const message = `Valor inválido ${err.value} para el campo ${err.path}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Valor duplicado: ${value}. Por favor use otro valor`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Datos inválidos. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () => CommonErrors.INVALID_TOKEN;

const handleJWTExpiredError = () => CommonErrors.EXPIRED_TOKEN;

const handleMulterError = err => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new AppError('El archivo es demasiado grande. Máximo 5MB permitido.', 400);
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError('Tipo de archivo no permitido', 400);
  }
  return new AppError('Error procesando el archivo', 400);
};

const sendErrorDev = (err, req, res) => {
  // Log completo para desarrollo
  logger.error('ERROR 💥', {
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });

  // API
  if (req.originalUrl && req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode || 500).json({
      success: false,
      status: err.status || 'error',
      message: err.message || 'Error interno del servidor',
      error: err,
      stack: err.stack,
      details: err.details
    });
  }

  // Renderizado Web
  res.status(err.statusCode || 500).json({
    title: 'Something went wrong!',
    message: err.message || 'Error interno del servidor'
  });
};

const sendErrorProd = (err, req, res) => {
  // A) API
  if (req.originalUrl && req.originalUrl.startsWith('/api')) {
    // Error operacional, de confianza: enviar mensaje al cliente
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        success: false,
        status: err.status,
        message: err.message,
        ...(err.details && { details: err.details })
      });
    }
    
    // B) Error de programación u otro: no filtrar detalles
    // 1) Log del error
    logger.error('ERROR 💥', err);

    // 2) Enviar mensaje genérico
    return res.status(500).json({
      success: false,
      status: 'error',
      message: 'Algo salió mal!'
    });
  }

  // B) Renderizado Web
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      title: 'Something went wrong!',
      message: err.message
    });
  }
  
  // Error de programación u otro: no filtrar detalles
  logger.error('ERROR 💥', err);
  
  res.status(err.statusCode).json({
    title: 'Something went wrong!',
    message: 'Please try again later.'
  });
};

// Middleware principal de manejo de errores
export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Errores específicos de Mongoose
    if (error instanceof mongoose.Error.CastError) error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error instanceof mongoose.Error.ValidationError) error = handleValidationErrorDB(error);

    // Errores de JWT
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    // Errores de Multer
    if (error.name === 'MulterError') error = handleMulterError(error);

    sendErrorProd(error, req, res);
  }
};

// Wrapper async para evitar try-catch
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};