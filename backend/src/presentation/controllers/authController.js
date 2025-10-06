import { asyncHandler } from "../middleware/index.js";
import AuthService from "../../core/application/usecases/authService.js";
import { logger } from "../../shared/utils/logger.js";
import { AppError } from "../../shared/utils/errors.js";
import { User } from "../../core/domain/entities/index.js";

// @desc    Registrar un nuevo usuario
// @route   POST /api/auth/register
// @access  Público
export const register = asyncHandler(async (req, res) => {
  const { token, user } = await AuthService.register(req.body);

  logger.info(`Usuario registrado exitosamente: ${user.email}`);
  
  res.status(201).json({
    success: true,
    message: "Usuario registrado con éxito",
    token,
    user
  });
});

// @desc    Login de usuario
// @route   POST /api/auth/login
// @access  Público
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    logger.warn('Intento de login sin credenciales completas');
    return res.status(400).json({
      success: false,
      message: 'Por favor proporcione email y contraseña'
    });
  }

  const { token, user } = await AuthService.login(email, password);

  res.json({
    success: true,
    message: 'Login exitoso',
    token,
    user
  });
});

// @desc    Cambiar contraseña
// @route   POST /api/auth/change-password
// @access  Privado
export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user._id;

  const result = await AuthService.changePassword(userId, oldPassword, newPassword);

  res.json({
    success: true,
    message: result.message
  });
});

// @desc    Solicitar reset de contraseña
// @route   POST /api/auth/reset-password
// @access  Público
export const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Por favor proporcione un email'
    });
  }

  const result = await AuthService.resetPassword(email);

  res.json({
    success: true,
    message: result.message
  });
});

// @desc    Validar token JWT
// @route   GET /api/auth/validate-token
// @access  Privado
export const validateToken = asyncHandler(async (req, res) => {
  // El middleware protect ya validó el token y agregó el usuario a req
  const user = req.user;
  
  res.json({
    success: true,
    user: AuthService.sanitizeUser(user)
  });
});

// @desc    Logout (invalidar token)
// @route   POST /api/auth/logout
// @access  Privado
export const logout = asyncHandler(async (req, res) => {
  // En el futuro, aquí podríamos agregar el token a una lista negra
  res.json({
    success: true,
    message: 'Logout exitoso'
  });
});

// @desc    Perfil del usuario autenticado
// @route   GET /api/auth/profile
// @access  Privado
export const profile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) throw new AppError("Usuario no encontrado", 404);

  res.json(user);
});
