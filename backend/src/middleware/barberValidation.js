const { body, param } = require('express-validator');
const { checkValidationResults } = require('./security');

// Validación para creación/actualización de barberos
const validateBarber = [
    body('name')
        .notEmpty().withMessage('El nombre del barbero es requerido')
        .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres')
        .trim()
        .escape(),
    body('email')
        .isEmail().withMessage('Debe ser un email válido')
        .normalizeEmail(),
    body('phone')
        .optional()
        .isMobilePhone().withMessage('Número de teléfono inválido'),
    body('specialty')
        .optional()
        .trim()
        .escape(),
    body('experience')
        .optional()
        .isInt({ min: 0 }).withMessage('La experiencia debe ser un número positivo'),
    checkValidationResults
];

// Validación para ID de barbero
const validateBarberId = [
    param('id')
        .isMongoId().withMessage('ID de barbero inválido'),
    checkValidationResults
];

module.exports = {
    validateBarber,
    validateBarberId
};