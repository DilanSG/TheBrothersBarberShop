import jwt from 'jsonwebtoken';
import User from '../../core/domain/entities/User.js';

// Middleware principal de autenticación
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. Token no proporcionado.'
      });
    }
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. Token no válido.'
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
    console.error('Error en autenticación:', error.message);
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

// Verificar si es administrador
export const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren privilegios de administrador.'
    });
  }
  next();
};

// Verificar si es barbero o admin
export const barberAuth = (req, res, next) => {
  if (req.user.role !== 'barber' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren privilegios de barbero.'
    });
  }
  next();
};

// Verificar si es el mismo usuario o admin
export const sameUserOrAdmin = async (req, res, next) => {
  try {
    // Si es admin, permitir acceso directo
    if (req.user.role === 'admin') {
      return next();
    }

    // Si la ruta incluye /profile, buscar el barbero y comparar con el usuario
    if (req.path.includes('/profile')) {
      const Barber = (await import('../../core/domain/entities/Barber.js')).default;
      const barber = await Barber.findById(req.params.id);
      if (!barber) {
        return res.status(404).json({
          success: false,
          message: 'Barbero no encontrado'
        });
      }
      if (barber.user.toString() === req.user._id.toString()) {
        return next();
      }
    }
    // Para otras rutas, comparar directamente el ID del usuario
    else if (req.user._id.toString() === req.params.id) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo puedes acceder a tu propia información.'
    });
  } catch (error) {
    console.error('Error en middleware sameUserOrAdmin:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al verificar permisos'
    });
  }
};