import rateLimit from 'express-rate-limit';

// Configuración general de rate limiting - OPTIMIZADA PARA DESARROLLO
export const generalLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos (reducido de 15)
  max: 2000, // Incrementado para desarrollo: máximo 2000 requests por ventana
  message: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo más tarde',
  standardHeaders: true,
  legacyHeaders: false,
  // Permitir ráfagas para cambios rápidos de filtros
  skipSuccessfulRequests: false,
  skipFailedRequests: true,
});

// Rate limiting más permisivo para auth en desarrollo
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // Incrementado para desarrollo
  message: 'Demasiados intentos de login, intenta nuevamente en 15 minutos',
  skipSuccessfulRequests: true,
});

// Rate limiting adaptativo para endpoints de stats
export const statsLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutos
  max: (req) => {
    // Más requests para usuarios autenticados
    if (req.user?.role === 'admin') return 1000;
    if (req.user?.role === 'barber') return 500;
    return 100;
  },
  message: 'Demasiadas peticiones a endpoints de estadísticas',
  // Permitir ráfagas para cambios de filtros
  skipSuccessfulRequests: false,
});

// Rate limiting para endpoints sensibles
export const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 200, // Incrementado para desarrollo
  message: 'Demasiadas peticiones a este endpoint, intenta nuevamente en una hora',
});

// Rate limiting para creación de recursos
export const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 100, // Incrementado para desarrollo
  message: 'Límite de creación alcanzado, intenta nuevamente en una hora',
});

// Store para rate limiting (puede ser Redis en producción)
export const createMemoryStore = () => {
  return new rateLimit.MemoryStore();
};