import express from 'express';
import { register, login, profile } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Registro
router.post('/register', register);

// Login
router.post('/login', login);

// Perfil (solo con token)
router.get('/profile', protect, profile);

export default router;