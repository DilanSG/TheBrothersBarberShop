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
  const { username, email, password, role } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) throw new AppError("El email ya está registrado", 400);

  const usernameExists = await User.findOne({ username });
  if (usernameExists) throw new AppError("El nombre de usuario ya está registrado", 400);

  const newUser = new User({ username, email, password, role });
  await newUser.save();

  const token = createAccessToken(newUser);

  res.status(201).json({
    message: "Usuario registrado con éxito",
    token,
    user: { id: newUser._id, username: newUser.username, email: newUser.email, role: newUser.role },
  });
});

// Login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.password) throw new AppError('Usuario o contraseña incorrectos', 401);

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new AppError('Credenciales incorrectas', 401);

  const token = createAccessToken(user);

  res.json({
    message: 'Login exitoso',
    token,
    user: { id: user._id, username: user.username, email: user.email, role: user.role },
  });
});

// Perfil del usuario autenticado
export const profile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) throw new AppError("Usuario no encontrado", 404);

  res.json(user);
});
