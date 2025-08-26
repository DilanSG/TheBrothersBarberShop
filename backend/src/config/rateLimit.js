const rateLimit = require('express-rate-limit');

// Configuración general de rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: {
    success: false,
    message: 'Demasiadas peticiones, intenta nuevamente en 15 minutos'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Rate limiting más estricto para auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos de login
  message: {
    success: false,
    message: 'Demasiados intentos de login, intenta nuevamente en 15 minutos'
  },
  skipSuccessfulRequests: true, // No contar requests exitosos
});

// Rate limiting para endpoints sensibles
const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // máximo 10 requests por hora
  message: {
    success: false,
    message: 'Demasiadas peticiones a este endpoint, intenta nuevamente en una hora'
  },
});

// Rate limiting para creación de recursos
const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // máximo 20 creaciones por hora
  message: {
    success: false,
    message: 'Límite de creación alcanzado, intenta nuevamente en una hora'
  },
});

// Store para rate limiting (puede ser Redis en producción)
const createMemoryStore = () => {
  return new rateLimit.MemoryStore();
};

module.exports = {
  generalLimiter,
  authLimiter,
  sensitiveLimiter,
  createLimiter,
  createMemoryStore,
};