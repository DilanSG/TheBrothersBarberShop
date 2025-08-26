// Clases de error personalizadas
export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(errors) {
    super('Errores de validación', 400);
    this.errors = errors;
  }
}

export class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource || 'Recurso'} no encontrado`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acceso prohibido') {
    super(message, 403);
  }
}

// Middleware de manejo de errores
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log del error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user ? req.user._id : 'No autenticado'
  });

  // Error de Mongoose - ObjectId inválido
  if (err.name === 'CastError') {
    const message = 'ID inválido';
    error = new AppError(message, 400);
  }

  // Error de Mongoose - Validación
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    error = new ValidationError(errors);
  }

  // Error de Mongoose - Duplicado
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} ya existe`;
    error = new AppError(message, 400);
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token inválido';
    error = new AppError(message, 401);
  }

  // Error de JWT expirado
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expirado';
    error = new AppError(message, 401);
  }

  // Respuesta de error
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Error interno del servidor',
    ...(error.errors && { errors: error.errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

// Middleware para rutas no encontradas
export const notFound = (req, res, next) => {
  next(new NotFoundError(`Ruta ${req.originalUrl} no encontrada`));
};

// Wrapper async para evitar try-catch
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};