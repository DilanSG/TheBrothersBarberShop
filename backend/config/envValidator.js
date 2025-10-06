import { logger } from '../utils/logger.js';

/**
 * Variables de entorno requeridas
 */
const requiredEnvVars = {
  // Configuración básica
  NODE_ENV: {
    required: true,
    default: 'development',
    validator: (value) => ['development', 'production', 'test'].includes(value)
  },
  PORT: {
    required: false,
    default: '5000',
    validator: (value) => !isNaN(parseInt(value)) && parseInt(value) > 0
  },

  // Base de datos
  MONGODB_URI: {
    required: true,
    validator: (value) => value.startsWith('mongodb://') || value.startsWith('mongodb+srv://')
  },

  // JWT
  JWT_SECRET: {
    required: true,
    validator: (value) => value.length >= 32
  },
  JWT_EXPIRES_IN: {
    required: false,
    default: '7d'
  },

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: {
    required: true,
    validator: (value) => value.length > 0
  },
  CLOUDINARY_API_KEY: {
    required: true,
    validator: (value) => !isNaN(parseInt(value))
  },
  CLOUDINARY_API_SECRET: {
    required: true,
    validator: (value) => value.length > 0
  },

  // CORS
  CORS_ORIGIN: {
    required: false,
    default: 'http://localhost:5173'
  },

  // Rate Limiting
  RATE_LIMIT_MAX: {
    required: false,
    default: '100',
    validator: (value) => !isNaN(parseInt(value)) && parseInt(value) > 0
  },

  // Email (opcional)
  EMAIL_HOST: {
    required: false
  },
  EMAIL_PORT: {
    required: false,
    validator: (value) => !value || (!isNaN(parseInt(value)) && parseInt(value) > 0)
  },
  EMAIL_USER: {
    required: false
  },
  EMAIL_PASS: {
    required: false
  },

  // Redis (opcional)
  REDIS_URL: {
    required: false,
    validator: (value) => !value || value.startsWith('redis://')
  }
};

/**
 * Validar una variable de entorno individual
 */
const validateEnvVar = (name, config) => {
  const value = process.env[name];
  
  // Verificar si es requerida
  if (config.required && !value) {
    return {
      valid: false,
      error: `Variable de entorno requerida faltante: ${name}`
    };
  }

  // Usar valor por defecto si no está presente
  if (!value && config.default) {
    process.env[name] = config.default;
    return { valid: true, usingDefault: true };
  }

  // Validar formato si hay validator y valor presente
  if (value && config.validator && !config.validator(value)) {
    return {
      valid: false,
      error: `Variable de entorno con formato inválido: ${name} = "${value}"`
    };
  }

  return { valid: true };
};

/**
 * Validar todas las variables de entorno
 */
export const validateEnvironment = () => {
  const errors = [];
  const warnings = [];
  const defaults = [];

  logger.info('🔍 Validando variables de entorno...');

  // Validar cada variable
  Object.entries(requiredEnvVars).forEach(([name, config]) => {
    const result = validateEnvVar(name, config);
    
    if (!result.valid) {
      errors.push(result.error);
    } else if (result.usingDefault) {
      defaults.push(`${name} = "${process.env[name]}" (valor por defecto)`);
    }
  });

  // Verificar variables sensibles en producción
  if (process.env.NODE_ENV === 'production') {
    const productionChecks = [
      {
        condition: process.env.JWT_SECRET === 'your_super_secret_jwt_key_here',
        message: 'JWT_SECRET debe cambiarse en producción'
      },
      {
        condition: process.env.CLOUDINARY_API_KEY === 'your_cloudinary_api_key',
        message: 'CLOUDINARY_API_KEY debe configurarse en producción'
      },
      {
        condition: process.env.MONGODB_URI.includes('localhost'),
        message: 'MONGODB_URI no debería apuntar a localhost en producción'
      }
    ];

    productionChecks.forEach(check => {
      if (check.condition) {
        warnings.push(`⚠️  PRODUCCIÓN: ${check.message}`);
      }
    });
  }

  // Mostrar resultados
  if (defaults.length > 0) {
    logger.info('📝 Variables usando valores por defecto:');
    defaults.forEach(def => logger.info(`   ${def}`));
  }

  if (warnings.length > 0) {
    logger.warn('⚠️  Advertencias de configuración:');
    warnings.forEach(warning => logger.warn(`   ${warning}`));
  }

  if (errors.length > 0) {
    logger.error('❌ Errores de configuración:');
    errors.forEach(error => logger.error(`   ${error}`));
    logger.error('🚫 La aplicación no puede iniciarse con errores de configuración');
    process.exit(1);
  }

  logger.info('✅ Validación de variables de entorno completada');
  return true;
};

/**
 * Obtener configuración de email si está disponible
 */
export const getEmailConfig = () => {
  const hasEmailConfig = process.env.EMAIL_HOST && 
                        process.env.EMAIL_USER && 
                        process.env.EMAIL_PASS;
  
  if (!hasEmailConfig) {
    return null;
  }

  return {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: parseInt(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  };
};

/**
 * Obtener configuración de Redis si está disponible
 */
export const getRedisConfig = () => {
  if (!process.env.REDIS_URL) {
    return null;
  }

  return {
    url: process.env.REDIS_URL
  };
};

export default {
  validateEnvironment,
  getEmailConfig,
  getRedisConfig
};
