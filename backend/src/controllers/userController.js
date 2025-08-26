import User from '../models/User.js';
import { asyncHandler } from '../middleware/index.js';
import { AppError } from '../middleware/errorHandler.js';

// Obtener todos los usuarios (solo admin)
export const getUsers = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new AppError('Acceso denegado. Se requieren privilegios de administrador', 403);
  }

  const users = await User.find().select('-password');
  res.json({ success: true, data: users });
});

// Obtener un usuario por ID
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }

  // Verificar si el usuario solicita sus propios datos o es admin
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    throw new AppError('Acceso denegado', 403);
  }

  res.json({ success: true, data: user });
});

// Actualizar usuario
export const updateUser = asyncHandler(async (req, res) => {
  const { username, email, phone } = req.body;

  // Verificar si el usuario actualiza sus propios datos o es admin
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    throw new AppError('Acceso denegado', 403);
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { username, email, phone },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }

  res.json({
    success: true,
    message: 'Usuario actualizado correctamente',
    data: user
  });
});

// Eliminar usuario
export const deleteUser = asyncHandler(async (req, res) => {
  // Verificar si el usuario se está eliminando a sí mismo o es admin
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    throw new AppError('Acceso denegado', 403);
  }

  // Prevenir que un usuario se elimine a sí mismo
  if (req.user.id === req.params.id) {
    throw new AppError('No puedes eliminar tu propia cuenta', 403);
  }

  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }

  res.json({
    success: true,
    message: 'Usuario eliminado correctamente'
  });
});