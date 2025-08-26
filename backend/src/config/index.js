// Archivo principal de configuración que exporta todas las configuraciones
const database = require('./database');
const cloudinary = require('./cloudinary');
const email = require('./email');
const cors = require('./cors');
const rateLimit = require('./rateLimit');
const jwt = require('./jwt');

// Validar variables de entorno requeridas
const validateEnv = () => {
  const requiredEnvVars = [
    'JWT_SECRET',
    'MONGODB_URI',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Variables de entorno faltantes:', missingVars.join(', '));
    throw new Error('Configuración incompleta. Por favor configura todas las variables de entorno requeridas.');
  }

  console.log('✅ Todas las variables de entorno requeridas están configuradas');
};

// Configuración global
const config = {
  // Configuración de la aplicación
  app: {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  // Configuración de base de datos
  database: {
    uri: process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },

  // Configuración de JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // Configuración de Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  // Configuración de email
  email: {
    service: process.env.EMAIL_SERVICE || 'Gmail',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: `"The Brothers Barber Shop" <${process.env.EMAIL_USER}>`,
  },

  // Configuración de rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // límite por IP
  },
};

module.exports = {
  database,
  cloudinary,
  email,
  cors,
  rateLimit,
  jwt,
  config,
  validateEnv,
};