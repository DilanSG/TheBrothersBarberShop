import rateLimit from 'express-rate-limit';

// Configuración general de rate limiting
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300, // Incrementado para desarrollo: máximo 300 requests por ventana
  message: {
    success: false,
    message: 'Demasiadas peticiones, intenta nuevamente en 15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting más estricto para auth
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos de login
  message: {
    success: false,
    message: 'Demasiados intentos de login, intenta nuevamente en 15 minutos'
  },
  skipSuccessfulRequests: true,
});

// Rate limiting para endpoints sensibles
export const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // máximo 10 requests por hora
  message: {
    success: false,
    message: 'Demasiadas peticiones a este endpoint, intenta nuevamente en una hora'
  },
});

// Rate limiting para creación de recursos
export const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // máximo 20 creaciones por hora
  message: {
    success: false,
    message: 'Límite de creación alcanzado, intenta nuevamente en una hora'
  },
});

// Store para rate limiting (puede ser Redis en producción)
export const createMemoryStore = () => {
  return new rateLimit.MemoryStore();
};