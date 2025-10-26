import jwt from 'jsonwebtoken';
import User from '../../core/domain/entities/User.js';
import { logger } from '../../shared/utils/logger.js';

/**
 * Middleware flexible de autenticación
 * Acepta token desde:
 * 1. Query parameter (?token=xxx) - Para enlaces directos (facturas, etc)
 * 2. Authorization header (Bearer xxx) - Para API calls normales
 */
export const protectFlexible = async (req, res, next) => {
  try {
    let token = null;

    // Opción 1: Token desde query parameter (para enlaces directos)
    if (req.query.token) {
      token = req.query.token;
      logger.debug('Token obtenido desde query parameter');
    }
    // Opción 2: Token desde Authorization header (método estándar)
    else if (req.header('Authorization')?.startsWith('Bearer ')) {
      token = req.header('Authorization').replace('Bearer ', '');
      logger.debug('Token obtenido desde Authorization header');
    }

    // Si no hay token, denegar acceso
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. Token no proporcionado.'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuario
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido - usuario no existe'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Cuenta desactivada. Contacta al administrador.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Error en autenticación flexible:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error en el servidor de autenticación'
    });
  }
};

export default protectFlexible;
