import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

/**
 * Configuración de middleware de seguridad
 */
export const securityMiddleware = {
  // Helmet - Configuración de headers de seguridad
  helmet: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        connectSrc: ["'self'", "ws:", "wss:"],
        mediaSrc: ["'self'", "data:", "https:"],
        objectSrc: ["'none'"],
        baseSrc: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { 
      policy: process.env.NODE_ENV === 'production' ? 'same-site' : 'cross-origin' 
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }),

  // Sanitización MongoDB
  mongoSanitize: mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      logger.warn(`MongoDB injection attempt detected: ${key} in ${req.method} ${req.path}`);
    }
  }),

  // Protección XSS
  xss: xss({
    whiteList: {}, // No permitir ningún HTML
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script']
  }),

  // Protección contra HTTP Parameter Pollution
  hpp: hpp({
    whitelist: ['sort', 'fields', 'page', 'limit', 'category', 'status', 'date']
  }),

  // Rate limiting por IP
  rateLimiter: rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: {
      status: 'error',
      message: config.rateLimit.message,
      retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        status: 'error',
        message: config.rateLimit.message,
        retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
      });
    }
  }),

  // Rate limiting específico para auth
  authRateLimiter: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // máximo 5 intentos por IP
    message: {
      status: 'error',
      message: 'Demasiados intentos de inicio de sesión. Intente de nuevo en 15 minutos.',
      retryAfter: 900
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: (req, res) => {
      logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        status: 'error',
        message: 'Demasiados intentos de inicio de sesión. Intente de nuevo en 15 minutos.',
        retryAfter: 900
      });
    }
  })
};

/**
 * Validación de archivos subidos
 */
export const fileValidation = {
  // Tipos MIME permitidos
  allowedMimeTypes: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ],

  // Extensiones permitidas
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],

  // Tamaño máximo (5MB)
  maxFileSize: 5 * 1024 * 1024,

  // Validar tipo de archivo
  validateFileType: (file) => {
    const isValidMime = fileValidation.allowedMimeTypes.includes(file.mimetype);
    const isValidExt = fileValidation.allowedExtensions.some(ext => 
      file.originalname.toLowerCase().endsWith(ext)
    );
    return isValidMime && isValidExt;
  },

  // Validar tamaño de archivo
  validateFileSize: (file) => {
    return file.size <= fileValidation.maxFileSize;
  },

  // Validación completa
  validateFile: (file) => {
    const errors = [];
    
    if (!fileValidation.validateFileType(file)) {
      errors.push('Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG, WebP, GIF).');
    }
    
    if (!fileValidation.validateFileSize(file)) {
      errors.push(`Archivo demasiado grande. Tamaño máximo: ${fileValidation.maxFileSize / (1024 * 1024)}MB.`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

/**
 * Middleware de logging de seguridad
 */
export const securityLogger = (req, res, next) => {
  // Log de actividad sospechosa
  const suspiciousPatterns = [
    /(\<|\%3C)script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload/i,
    /onerror/i,
    /\$\(/,
    /document\./,
    /window\./,
    /eval\(/,
    /expression\(/,
    /\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c/i
  ];

  const requestData = JSON.stringify({
    body: req.body,
    query: req.query,
    params: req.params
  });

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(requestData));

  if (isSuspicious) {
    logger.warn(`Suspicious request detected from ${req.ip}:`, {
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
      body: req.body,
      query: req.query,
      params: req.params
    });
  }

  next();
};

export default {
  securityMiddleware,
  fileValidation,
  securityLogger
};
