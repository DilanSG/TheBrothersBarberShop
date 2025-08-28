import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { asyncHandler } from "../middleware/index.js";
import { AppError } from "../middleware/errorHandler.js";

// Utilidad para crear el token JWT
const createAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// Registro de usuario
export const register = asyncHandler(async (req, res) => {
  const { username, name, email, password, role = 'user' } = req.body;

  // Verificar si el email ya está registrado
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new AppError("El email ya está registrado", 400);
  }

  // Verificar si el nombre de usuario ya existe
  const usernameExists = await User.findOne({ username });
  if (usernameExists) {
    throw new AppError("El nombre de usuario ya está registrado", 400);
  }

  try {
    // Crear el nuevo usuario
    const newUser = new User({
      username,
      name,
      email,
      password,
      role
    });

    await newUser.save();

    // Si el usuario es un barbero, crear automáticamente su perfil de barbero
    if (role === 'barber') {
      const Barber = (await import('../models/Barber.js')).default;
      const newBarber = new Barber({
        user: newUser._id,
        specialty: 'Barbero General', // Valor por defecto
        experience: 0,
        isActive: true,
        description: `Barbero profesional ${name}`,
        schedule: {
          monday: { start: '09:00', end: '18:00', isAvailable: true },
          tuesday: { start: '09:00', end: '18:00', isAvailable: true },
          wednesday: { start: '09:00', end: '18:00', isAvailable: true },
          thursday: { start: '09:00', end: '18:00', isAvailable: true },
          friday: { start: '09:00', end: '18:00', isAvailable: true },
          saturday: { start: '09:00', end: '14:00', isAvailable: true },
          sunday: { start: '09:00', end: '14:00', isAvailable: false }
        }
      });
      await newBarber.save();
    }

    // Generar token
    const token = createAccessToken(newUser);

    // Devolver respuesta sin incluir la contraseña
    const userResponse = {
      id: newUser._id,
      username: newUser.username,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    };

    res.status(201).json({
      success: true,
      message: "Usuario registrado con éxito",
      token,
      user: userResponse
    });
  } catch (error) {
    if (error.code === 11000) {
      // Error de duplicado en MongoDB
      const field = Object.keys(error.keyPattern)[0];
      throw new AppError(`El ${field} ya está en uso`, 400);
    }
    throw error;
  }
});

// Login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Por favor proporcione email y contraseña', 400);
  }

  try {
    // Buscar usuario por email incluyendo la contraseña
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      throw new AppError('Usuario no encontrado', 401);
    }

    if (!user.isActive) {
      throw new AppError('Esta cuenta está desactivada', 401);
    }

    // Verificar contraseña usando el método del modelo
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      throw new AppError('Credenciales incorrectas', 401);
    }

    // Generar token
    const token = createAccessToken(user);

    // Obtener datos del usuario sin la contraseña
    const userWithoutPassword = {
      _id: user._id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      photo: user.photo
    };

    // Enviar respuesta exitosa
    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Error en la autenticación:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Error en la autenticación', 401);
  }
});

// Perfil del usuario autenticado
export const profile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) throw new AppError("Usuario no encontrado", 404);

  res.json(user);
});
