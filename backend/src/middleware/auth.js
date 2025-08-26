const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verificar token JWT
const auth = async (req, res, next) => {
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
const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren privilegios de administrador.'
    });
  }
  next();
};

// Verificar si es barbero o admin
const barberAuth = (req, res, next) => {
  if (req.user.role !== 'barber' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren privilegios de barbero.'
    });
  }
  next();
};

// Verificar si es el mismo usuario o admin
const sameUserOrAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Solo puedes acceder a tu propia información.'
    });
  }
  next();
};

module.exports = {
  auth,
  adminAuth,
  barberAuth,
  sameUserOrAdmin
};