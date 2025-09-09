import morgan from 'morgan';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

// Token personalizado para el ID de usuario
morgan.token('user-id', (req) => req.user ? req.user._id : 'anonymous');

// Token personalizado para el cuerpo de la petición
morgan.token('body', (req) => {
  const body = { ...req.body };
  
  // Eliminar campos sensibles
  const sensitiveFields = ['password', 'token', 'authorization'];
  sensitiveFields.forEach(field => {
    if (body[field]) body[field] = '[REDACTED]';
  });
  
  return JSON.stringify(body);
});

// Token personalizado para los parámetros de consulta
morgan.token('query', (req) => JSON.stringify(req.query));

// Token personalizado para errores
morgan.token('error', (req) => req.error ? req.error.message : '');

// Formato personalizado basado en el ambiente
const getFormat = () => {
  if (config.app.nodeEnv === 'development') {
    return ':method :url :status :response-time ms - :res[content-length] - :user-id';
  }
  
  return JSON.stringify({
    method: ':method',
    url: ':url',
    status: ':status',
    responseTime: ':response-time',
    contentLength: ':res[content-length]',
    userId: ':user-id',
    ip: ':remote-addr',
    timestamp: ':date[iso]',
    userAgent: ':user-agent',
    error: ':error'
  });
};

// Opciones de Morgan
const options = {
  stream: logger.stream,
  skip: (req) => {
    // Skip health checks en producción
    if (config.app.nodeEnv === 'production' && req.originalUrl === '/health') {
      return true;
    }
    
    // Skip assets estáticos
    if (req.originalUrl.startsWith('/static/') || req.originalUrl.startsWith('/assets/')) {
      return true;
    }

    return false;
  }
};

// Middleware de Morgan personalizado
export const morganMiddleware = morgan(getFormat(), options);

// Middleware para logging detallado de errores
export const errorLoggingMiddleware = (err, req, res, next) => {
  // Añadir el error a la request para el token de morgan
  req.error = err;
  
  // Continuar con el siguiente middleware
  next(err);
};

export default morganMiddleware;
