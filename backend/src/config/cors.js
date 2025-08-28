import cors from 'cors';

// Lista de dominios permitidos
const allowedOrigins = [
  'http://localhost:3000',   // Desarrollo frontend
  'http://localhost:3001',   // Desarrollo alternativo
  'http://localhost:5173',   // Vite frontend
  'http://localhost:5174',   // Vite frontend alternativo
  'http://127.0.0.1:5173',  // Vite frontend local IP
  'http://127.0.0.1:5174',  // Vite frontend local IP alternativo
  process.env.FRONTEND_URL,  // Producción frontend
].filter(Boolean);

// Configuración de CORS
export const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (como mobile apps, postman o desarrollo local)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ Origen no permitido por CORS:', origin);
      console.log('Orígenes permitidos:', allowedOrigins);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true, // Permitir cookies y autenticación
  optionsSuccessStatus: 200, // Para navegadores legacy
  exposedHeaders: ['Authorization'], // Exponer headers personalizados
};

// Middleware de CORS
export const corsMiddleware = cors(corsOptions);

// Función para configurar CORS dinámicamente
export const configureCors = (app) => {
  app.use(corsMiddleware);

  // Manejar preflight requests
  app.options('*', corsMiddleware);
};