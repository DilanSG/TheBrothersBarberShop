const rateLimit = require('express-rate-limit');

// Limitador general para todas las rutas
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 peticiones por ventana de tiempo
    message: {
        error: 'Demasiadas peticiones, intenta nuevamente en 15 minutos'
    }
});

// Limitador para endpoints sensibles
const sensitiveLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 5, // máximo 5 intentos por hora
    message: {
        error: 'Demasiados intentos, intenta nuevamente en una hora'
    }
});

module.exports = {
    generalLimiter,
    sensitiveLimiter
};