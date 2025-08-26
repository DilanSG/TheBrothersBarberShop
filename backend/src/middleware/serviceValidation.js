
const { body, param } = require('express-validator');
const { checkValidationResults } = require('./security');

// Validación para creación/actualización de servicios
const validateService = [
    body('name')
        .notEmpty().withMessage('El nombre del servicio es requerido')
        .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres')
        .trim()
        .escape(),
    body('description')
        .optional()
        .trim()
        .escape(),
    body('price')
        .isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo'),
    body('duration')
        .isInt({ min: 15, max: 180 }).withMessage('La duración debe estar entre 15 y 180 minutos'),
    checkValidationResults
];

// Validación para ID de servicio
const validateServiceId = [
    param('id')
        .isMongoId().withMessage('ID de servicio inválido'),
    checkValidationResults
];

module.exports = {
    validateService,
    validateServiceId
};