// Archivo principal de configuración que exporta todas las configuraciones
// NOTA: dotenv se carga en index.js ANTES de importar cualquier módulo
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importar logger
import { logger } from '../utils/logger.js';

// Validar variables de entorno requeridas
export const validateEnv = () => {
  logger.debug('=== DEBUGGING VARIABLES DE ENTORNO ===');
  logger.debug('NODE_ENV:', process.env.NODE_ENV);
  logger.debug('PORT:', process.env.PORT);
  logger.debug('JWT_SECRET presente:', !!process.env.JWT_SECRET);
  logger.debug('MONGODB_URI presente:', !!process.env.MONGODB_URI);
  logger.debug('EMAIL_USER presente:', !!process.env.EMAIL_USER);
  logger.debug('EMAIL_PASSWORD presente:', !!process.env.EMAIL_PASSWORD);
  logger.debug('EMAIL_SERVICE presente:', !!process.env.EMAIL_SERVICE);
  logger.debug('EMAIL_HOST presente:', !!process.env.EMAIL_HOST);
  logger.debug('EMAIL_PORT presente:', !!process.env.EMAIL_PORT);
  logger.debug('EMAIL_FROM_NAME presente:', !!process.env.EMAIL_FROM_NAME);
  logger.debug('EMAIL_FROM_ADDRESS presente:', !!process.env.EMAIL_FROM_ADDRESS);
  logger.debug('CLOUDINARY_CLOUD_NAME presente:', !!process.env.CLOUDINARY_CLOUD_NAME);
  logger.debug('CLOUDINARY_API_KEY presente:', !!process.env.CLOUDINARY_API_KEY);
  logger.debug('CLOUDINARY_API_SECRET presente:', !!process.env.CLOUDINARY_API_SECRET);
  logger.debug('FRONTEND_URL:', process.env.FRONTEND_URL);
  logger.debug('ALLOWED_ORIGINS:', process.env.ALLOWED_ORIGINS);
  logger.debug('=== FIN DEBUGGING VARIABLES ===');

  const requiredEnvVars = [
    'JWT_SECRET',
    'MONGODB_URI',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
  ];

  // Email es opcional - el sistema puede funcionar sin emails
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    logger.error('Variables de entorno faltantes:', missingVars.join(', '));
    throw new Error('Configuración incompleta. Por favor configura todas las variables de entorno requeridas.');
  }
  
  // Verificar configuración de email (SendGrid o SMTP)
  const hasSendGrid = !!process.env.SENDGRID_API_KEY;
  const hasSMTP = !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
  
  if (!hasSendGrid && !hasSMTP) {
    logger.warn('Variables de email no configuradas. Sistema funcionará sin capacidades de email.');
  } else if (hasSendGrid) {
    logger.info('✅ Sistema de email configurado con SendGrid');
  } else if (hasSMTP) {
    logger.info('✅ Sistema de email configurado con SMTP');
  }
};

// Configuración global
export const config = {
  // Configuración de la aplicación
  app: {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    apiVersion: process.env.API_VERSION || 'v1',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    uploadsDir: path.join(__dirname, '../../uploads'),
    maxFileSize: process.env.MAX_FILE_SIZE || '5mb',
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
  },

  // Configuración de base de datos
  database: {
    uri: process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
    debug: process.env.DB_DEBUG === 'true',
    maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE || '10'),
    minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE || '2'),
  },

  // Configuración de JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
    // Fallback para tokens no diferenciados por rol (se usarán tiempos específicos por rol en authService)
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '4h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    resetPasswordExpiresIn: '1h',
    emailVerificationExpiresIn: '24h',
  },

  // Configuración de Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER || 'thebrothers',
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
  },

  // Configuración de email
  email: {
    service: process.env.EMAIL_SERVICE || 'Gmail',
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || `"The Brothers Barber Shop" <${process.env.EMAIL_USER}>`,
    templateDir: path.join(__dirname, '../templates/email'),
  },

  // Configuración de rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos por defecto
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // límite por IP
    message: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo más tarde',
  },

  // Configuración de logging
  logging: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'info'),
    maxFiles: process.env.LOG_MAX_FILES || '30d', // Aumentado a 30 días para mejor troubleshooting
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    dirname: path.join(__dirname, '../../logs'),
  },

  // Configuración de cache
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '300'), // 5 minutos por defecto
    checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD || '600'), // 10 minutos por defecto
  },

  // Configuración de seguridad
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10'),
    corsMaxAge: parseInt(process.env.CORS_MAX_AGE || '86400'), // 24 horas por defecto
    rateLimitBypassKey: process.env.RATE_LIMIT_BYPASS_KEY,
    allowedHosts: (process.env.ALLOWED_HOSTS || 'localhost').split(','),
  },

  // Configuración de servicios externos
  services: {
    smsProvider: {
      apiKey: process.env.SMS_API_KEY,
      sender: process.env.SMS_SENDER || 'TheBrothers',
    },
    maps: {
      apiKey: process.env.MAPS_API_KEY,
    },
  }
};

// Configuraciones específicas por ambiente
const envConfigs = {
  development: {
    logLevel: 'debug',
    morgan: 'dev',
  },
  test: {
    logLevel: 'error',
    morgan: 'tiny',
  },
  production: {
    logLevel: 'info',
    morgan: 'combined',
  },
};

// Añadir configuraciones específicas del ambiente
Object.assign(config, envConfigs[config.app.nodeEnv] || envConfigs.development);

// Exportar configuraciones individuales
export * from './database.js';
export * from './cloudinary.js';
export * from './email.js';
export * from './cors.js';
export * from './rateLimit.js';
export * from './jwt.js';

// Exportar configuración principal como default
export default config;