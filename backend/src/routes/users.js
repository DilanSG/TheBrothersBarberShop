import { Router } from 'express';
import { protect, adminAuth } from '../middleware/auth.js';
import { upload, uploadToCloudinary, validateImageRequired } from '../middleware/upload.js';
import { validateId, validateUserUpdate } from '../middleware/validation.js';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  changeUserRole,
  getUserStats,
  updateUserPreferences,
  changePassword,
  uploadProfilePicture,
  deleteProfilePicture
} from '../controllers/userController.js';

const router = Router();

// Rutas protegidas - requieren autenticación
router.use(protect);

// Rutas para administradores
router.get('/', adminAuth, getUsers);
router.get('/stats', adminAuth, getUserStats);
router.put('/:id/role', adminAuth, validateId, changeUserRole);
router.delete('/:id', adminAuth, validateId, deleteUser);

// Rutas para usuarios autenticados
router.get('/profile', getUserById); // Para obtener el perfil del usuario actual
router.put('/profile', validateUserUpdate, updateUser); // Para actualizar solo datos del perfil (sin archivo)
router.put('/profile-with-file', validateUserUpdate, upload.single('avatar'), uploadToCloudinary, updateUser); // Para actualizar con archivo
router.put('/preferences', updateUserPreferences); // Para actualizar las preferencias del usuario
router.put('/change-password', changePassword); // Para cambiar la contraseña del usuario
router.post('/upload-profile-picture', upload.single('profilePicture'), validateImageRequired, uploadToCloudinary, uploadProfilePicture); // Para subir foto de perfil
router.delete('/profile-picture', deleteProfilePicture); // Para eliminar foto de perfil

// Ruta de prueba
router.get('/test', (req, res) => {
  res.json({ message: 'Rutas de usuarios funcionando correctamente' });
});

// Rutas con parámetros dinámicos (deben ir al final)
router.get('/:id', validateId, getUserById);
router.put('/:id', validateId, validateUserUpdate, upload.single('avatar'), uploadToCloudinary, updateUser);

export default router;