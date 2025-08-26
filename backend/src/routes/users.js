const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController.js');
const auth = require('../middlewares/auth');
const {
    validateUserRegistration,
    validateUserLogin,
    checkValidationResults,
    loginLimiter
} = require('../middlewares/security');

// Registrar nuevo usuario
router.post('/register', 
    validateUserRegistration,
    checkValidationResults,
    userController.register
);

// Login de usuario
router.post('/login',
    loginLimiter,
    validateUserLogin,
    checkValidationResults, 
    userController.login
);

// Obtener todos los usuarios (solo admin)
router.get('/', auth, userController.getUsers);

// Obtener un usuario por ID
router.get('/:id', auth, userController.getUserById);

// Actualizar usuario
router.put('/:id', auth, userController.updateUser);

// Eliminar usuario
router.delete('/:id', auth, userController.deleteUser);

module.exports = router;