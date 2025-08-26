import express from 'express';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser
} from '../controllers/userController.js';
import { register, login } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
// Si tienes middlewares de validación para usuarios, impórtalos aquí
// import { validateUserUpdate, validateIdParam } from '../middleware/validation.js';

const router = express.Router();

// Registro y login de usuario (para frontend)
router.post('/register', register);
router.post('/login', login);

// Obtener todos los usuarios (solo admin)
router.get('/', protect, getUsers);

// Obtener un usuario por ID
router.get('/:id', protect, getUserById);

// Actualizar usuario
router.put('/:id', protect, updateUser);

// Eliminar usuario
router.delete('/:id', protect, deleteUser);

export default router;