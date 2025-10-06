import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../../domain/entities/index.js';
import { AppError } from '../../../shared/utils/errors.js';
import { logger } from '../../../shared/utils/logger.js';
import { config } from '../../../shared/config/index.js';

class AuthService {
  static async login(email, password) {
    try {
      // Buscar usuario y seleccionar explícitamente el password
      const user = await User.findOne({ email }).select('+password');
      
      if (!user) {
        logger.warn(`Intento de inicio de sesión fallido: usuario no encontrado (${email})`);
        throw new AppError('Credenciales inválidas', 401);
      }

      if (!user.isActive) {
        logger.warn(`Intento de inicio de sesión: cuenta desactivada (${email})`);
        throw new AppError('Cuenta desactivada. Contacta al administrador.', 401);
      }

      // Verificar contraseña
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        logger.warn(`Intento de inicio de sesión fallido: contraseña incorrecta (${email})`);
        throw new AppError('Credenciales inválidas', 401);
      }

      // Generar token
      const token = this.generateToken(user);
      
      // Limpiar datos sensibles
      const userResponse = this.sanitizeUser(user);

      logger.info(`Inicio de sesión exitoso: ${email}`);
      return { token, user: userResponse };
    } catch (error) {
      logger.error('Error en login:', error);
      throw error;
    }
  }

  static async register(userData) {
    try {
      // Verificar si el usuario ya existe entre usuarios activos
      const existingUser = await User.findOne({ 
        email: userData.email,
        isActive: true
      });

      if (existingUser) {
        throw new AppError('El email ya está registrado', 400);
      }

      // Hashear la contraseña antes de crear el usuario
      const hashedPassword = await bcrypt.hash(userData.password, config.security.bcryptRounds);
      
      // Crear usuario con contraseña hasheada
      const user = await User.create({
        ...userData,
        password: hashedPassword
      });

      // Generar token
      const token = this.generateToken(user);
      
      // Limpiar datos sensibles
      const userResponse = this.sanitizeUser(user);

      logger.info(`Nuevo usuario registrado: ${userData.email}`);
      return { token, user: userResponse };
    } catch (error) {
      logger.error('Error en registro:', error);
      throw error;
    }
  }

  static async resetPassword(email) {
    try {
      const user = await User.findOne({ email, isActive: true });
      if (!user) {
        // Por seguridad, no revelamos si el email existe
        return { message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña.' };
      }

      // Generar token temporal
      const resetToken = this.generateResetToken();
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hora
      await user.save();

      // TODO: Enviar email con token
      logger.info(`Solicitud de reset de contraseña: ${email}`);
      return { message: 'Instrucciones enviadas al email.' };
    } catch (error) {
      logger.error('Error en resetPassword:', error);
      throw error;
    }
  }

  static async changePassword(userId, oldPassword, newPassword) {
    try {
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new AppError('Usuario no encontrado', 404);
      }

      // Verificar contraseña actual
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        throw new AppError('Contraseña actual incorrecta', 401);
      }

      // Actualizar contraseña
      user.password = await this.hashPassword(newPassword);
      await user.save();

      logger.info(`Contraseña cambiada para usuario: ${user.email}`);
      return { message: 'Contraseña actualizada correctamente' };
    } catch (error) {
      logger.error('Error en changePassword:', error);
      throw error;
    }
  }

  // Métodos auxiliares
  static generateToken(user) {
    // Tiempos de expiración diferenciados por rol
    const expirationTimes = {
      'user': '6h',      // Clientes: 6 horas (navegación y reservas cómodas)
      'barber': '8h',    // Barberos: 8 horas (jornada laboral completa)
      'admin': '4h'      // Admins: 4 horas (mayor seguridad para operaciones sensibles)
    };
    
    const expiresIn = expirationTimes[user.role] || config.jwt.accessExpiresIn;
    
    return jwt.sign(
      { id: user._id, role: user.role },
      config.jwt.secret,
      { expiresIn }
    );
  }

  static generateResetToken() {
    return crypto.randomBytes(20).toString('hex');
  }

  static async hashPassword(password) {
    return bcrypt.hash(password, config.security.bcryptRounds);
  }

  static sanitizeUser(user) {
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.resetPasswordToken;
    delete userObj.resetPasswordExpires;
    return userObj;
  }

  static async validateToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await User.findById(decoded.id);
      
      if (!user || !user.isActive) {
        throw new AppError('Token inválido o usuario inactivo', 401);
      }

      return user;
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new AppError('Token inválido', 401);
      }
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Token expirado', 401);
      }
      throw error;
    }
  }
}

export default AuthService;
