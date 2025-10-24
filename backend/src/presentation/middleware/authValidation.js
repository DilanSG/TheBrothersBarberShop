import { body } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation.js';

export const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios')
    .escape(),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Debe proporcionar un email válido')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .matches(/\d/)
    .withMessage('La contraseña debe contener al menos un número'),
  
  body('role')
    .optional()
    .isIn(['user', 'barber'])
    .withMessage('Rol no válido'),
  
  handleValidationErrors
];

export const validatePasswordChange = [
  body('currentPassword')
    .exists()
    .withMessage('La contraseña actual es requerida'),
    
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('La nueva contraseña debe tener al menos 6 caracteres')
    .matches(/\d/)
    .withMessage('La nueva contraseña debe contener al menos un número'),
  
  handleValidationErrors
];
