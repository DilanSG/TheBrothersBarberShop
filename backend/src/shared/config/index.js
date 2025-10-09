// Archivo principal de configuración que exporta todas las configuraciones
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Cargar variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Validar variables de entorno requeridas
export const validateEnv = () => {
  console.log('=== DEBUGGING VARIABLES DE ENTORNO ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('PORT:', process.env.PORT);
  console.log('JWT_SECRET presente:', !!process.env.JWT_SECRET);
  console.log('MONGODB_URI presente:', !!process.env.MONGODB_URI);
  console.log('EMAIL_USER presente:', !!process.env.EMAIL_USER);
  console.log('EMAIL_PASSWORD presente:', !!process.env.EMAIL_PASSWORD);
  console.log('EMAIL_SERVICE presente:', !!process.env.EMAIL_SERVICE);
  console.log('EMAIL_HOST presente:', !!process.env.EMAIL_HOST);
  console.log('EMAIL_PORT presente:', !!process.env.EMAIL_PORT);
  console.log('EMAIL_FROM_NAME presente:', !!process.env.EMAIL_FROM_NAME);
  console.log('EMAIL_FROM_ADDRESS presente:', !!process.env.EMAIL_FROM_ADDRESS);
  console.log('CLOUDINARY_CLOUD_NAME presente:', !!process.env.CLOUDINARY_CLOUD_NAME);
  console.log('CLOUDINARY_API_KEY presente:', !!process.env.CLOUDINARY_API_KEY);
  console.log('CLOUDINARY_API_SECRET presente:', !!process.env.CLOUDINARY_API_SECRET);
  console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
  console.log('ALLOWED_ORIGINS:', process.env.ALLOWED_ORIGINS);
  console.log('=== FIN DEBUGGING VARIABLES ===');

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
    console.error('Variables de entorno faltantes:', missingVars.join(', '));
    throw new Error('Configuración incompleta. Por favor configura todas las variables de entorno requeridas.');
  }
  
  // Solo advertir sobre email si no está configurado
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('Variables de email no configuradas. Sistema funcionará sin capacidades de email.');
  } else {
    console.log('Sistema de email configurado correctamente.');
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