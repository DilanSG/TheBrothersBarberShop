import express from 'express';
import { register, login, profile } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validateRegister } from '../middleware/authValidation.js';

const router = express.Router();

// Registro con validación
router.post('/register', validateRegister, register);

// Login
router.post('/login', login);

// Perfil (solo con token)
router.get('/profile', protect, profile);

export default router;