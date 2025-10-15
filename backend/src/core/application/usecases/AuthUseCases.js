import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User, AppError, logger, config } from '../../../barrel.js';
import emailService from '../../../services/emailService.js';

class AuthUseCases {
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

      // Enviar notificación de login (sin bloquear el response)
      if (emailService.isConfigured) {
        emailService.sendLoginNotification(user, {
          timestamp: new Date(),
          device: 'Web Browser',
          location: 'Colombia' // TODO: Detectar ubicación real
        }).catch(err => logger.error('Error enviando notificación de login:', err));
      }

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

      // Enviar email de bienvenida (sin bloquear el response)
      if (emailService.isConfigured) {
        emailService.sendWelcomeEmail(user)
          .catch(err => logger.error('Error enviando email de bienvenida:', err));
      }

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

      // Generar token temporal seguro
      const resetToken = this.generateResetToken();
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hora
      await user.save();

      // Enviar email con token (el token original, no el hash)
      if (emailService.isConfigured) {
        await emailService.sendPasswordResetEmail(user, resetToken);
        logger.info(`Email de reset de contraseña enviado a: ${email}`);
      } else {
        logger.warn(`Servicio de email no configurado. Token de reset: ${resetToken}`);
      }

      return { message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña.' };
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

      // Enviar confirmación de cambio de contraseña
      if (emailService.isConfigured) {
        emailService.sendPasswordChangedConfirmation(user)
          .catch(err => logger.error('Error enviando confirmación de cambio de contraseña:', err));
      }

      logger.info(`Contraseña cambiada para usuario: ${user.email}`);
      return { message: 'Contraseña actualizada correctamente' };
    } catch (error) {
      logger.error('Error en changePassword:', error);
      throw error;
    }
  }

  /**
   * Verificar token de reset y actualizar contraseña
   */
  static async verifyResetTokenAndUpdatePassword(token, newPassword) {
    try {
      // Hash del token para comparar con el almacenado
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      
      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
        throw new AppError('Token inválido o expirado', 400);
      }

      // Actualizar contraseña
      user.password = await this.hashPassword(newPassword);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      // Enviar confirmación de cambio de contraseña
      if (emailService.isConfigured) {
        emailService.sendPasswordChangedConfirmation(user)
          .catch(err => logger.error('Error enviando confirmación de cambio de contraseña:', err));
      }

      logger.info(`Contraseña restablecida exitosamente para: ${user.email}`);
      return { message: 'Contraseña restablecida exitosamente' };
    } catch (error) {
      logger.error('Error en verifyResetTokenAndUpdatePassword:', error);
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

export default AuthUseCases;
