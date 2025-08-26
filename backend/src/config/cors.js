const cors = require('cors');

// Lista de dominios permitidos
const allowedOrigins = [
  'http://localhost:3000', // Desarrollo frontend
  'http://localhost:3001', // Desarrollo alternativo
  process.env.FRONTEND_URL, // Producción frontend
].filter(Boolean); // Filtra valores undefined

// Configuración de CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (como mobile apps o curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ Origen no permitido por CORS:', origin);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true, // Permitir cookies y autenticación
  optionsSuccessStatus: 200, // Para navegadores legacy
  exposedHeaders: ['Authorization'], // Exponer headers personalizados
};

// Middleware de CORS
const corsMiddleware = cors(corsOptions);

// Función para configurar CORS dinámicamente
const configureCors = (app) => {
  app.use(corsMiddleware);
  
  // Manejar preflight requests
  app.options('*', corsMiddleware);
};

module.exports = {
  corsOptions,
  corsMiddleware,
  configureCors,
};