import User from '../models/User.js';
import { asyncHandler } from '../middleware/index.js';
import { AppError } from '../middleware/errorHandler.js';

// Cambiar el rol de un usuario (solo admin)
export const changeUserRole = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new AppError('Acceso denegado. Se requieren privilegios de administrador', 403);
  }
  const { role } = req.body;
  if (!['user', 'barber', 'admin'].includes(role)) {
    throw new AppError('Rol no válido', 400);
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  ).select('-password');
  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }
  res.json({ success: true, message: 'Rol actualizado correctamente', data: user });
});

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
  const { username, email, phone, birthdate } = req.body;

  // Verificar si el usuario actualiza sus propios datos o es admin
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    throw new AppError('Acceso denegado', 403);
  }

  const updateData = {};
  if (username) updateData.username = username;
  if (email) updateData.email = email;
  if (phone) updateData.phone = phone;
  if (birthdate) updateData.birthdate = birthdate;
  
  if (req.image) {
    updateData.photo = {
      public_id: req.image.public_id,
      url: req.image.url
    };
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    updateData,
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
  // Solo los administradores pueden eliminar usuarios
  if (req.user.role !== 'admin') {
    throw new AppError('Acceso denegado. Se requieren privilegios de administrador', 403);
  }

  // Prevenir que un admin se elimine a sí mismo
  if (req.user.id === req.params.id) {
    throw new AppError('No puedes eliminar tu propia cuenta', 403);
  }

  const userToDelete = await User.findById(req.params.id);
  if (!userToDelete) {
    throw new AppError('Usuario no encontrado', 404);
  }

  // Prevenir eliminar otros administradores
  if (userToDelete.role === 'admin') {
    throw new AppError('No puedes eliminar otros administradores', 403);
  }

  // Eliminar el usuario
  await User.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Usuario eliminado correctamente',
    data: null
  });

  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    throw new AppError('Usuario no encontrado', 404);
  }

  res.json({
    success: true,
    message: 'Usuario eliminado correctamente'
  });
});