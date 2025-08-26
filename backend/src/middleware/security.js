const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

// Rate limiting para prevenir ataques de fuerza bruta
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // máximo 5 intentos por ventana de tiempo
    message: {
        error: 'Demasiados intentos de login, intenta nuevamente en 15 minutos'
    }
});

// Validación y sanitización para registro de usuarios
const validateUserRegistration = [
    body('name')
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres')
        .trim()
        .escape(),
    body('email')
        .isEmail().withMessage('Debe ser un email válido')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número')
];

// Validación y sanitización para login
const validateUserLogin = [
    body('email')
        .isEmail().withMessage('Debe ser un email válido')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('La contraseña es requerida')
];

// Middleware para verificar los resultados de la validación
const checkValidationResults = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Datos de entrada inválidos',
            details: errors.array()
        });
    }
    next();
};

module.exports = {
    loginLimiter,
    validateUserRegistration,
    validateUserLogin,
    checkValidationResults
};