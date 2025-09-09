import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';

// TODO: Implementar validación de variables de entorno
// import { validateEnvironment } from '../config/envValidator.js';
import YAML from 'yamljs';
import swaggerUi from 'swagger-ui-express';
import mongoose from 'mongoose';

// Configuraciones
import { config, validateEnv } from './config/index.js';
import { corsOptions } from './config/cors.js';
import { cloudinaryConfig } from './config/cloudinary.js';
import { setupSwagger } from './config/swagger.js';

// TODO: Implementar validación de entorno
// validateEnvironment();

// Utilidades y middleware
import { logger } from './utils/logger.js';
import { morganMiddleware } from './middleware/morgan.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

// Rutas
import routes from './routes/index.js';

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__dirname);

// Validar variables de entorno
validateEnv();

// Inicializar Express
const app = express();

// Configuración de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Configuración de CORS
app.use(cors(corsOptions));

// Compresión de respuestas
app.use(compression());

// Middleware de seguridad mejorado
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "*.cloudinary.com"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Sanitización de datos
app.use(mongoSanitize());
app.use(xss());

// Prevenir contaminación de parámetros HTTP
app.use(hpp({
  whitelist: ['sort', 'page', 'limit', 'fields']
}));

// TODO: Implementar monitoreo de performance
// app.use(performanceMonitor);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: config.rateLimit.message,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Logging
app.use(morganMiddleware);

// Configurar Swagger
setupSwagger(app);

// Body parsers y sanitización
app.use(express.json({ limit: config.app.maxFileSize }));
app.use(express.urlencoded({ extended: true, limit: config.app.maxFileSize }));
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Configuración de Cloudinary
cloudinaryConfig();

// Directorio estático para uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Documentación API
const swaggerDocument = YAML.load(path.join(__dirname, '../docs/swagger.yaml'));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Rutas de la API
app.use(`/api/${config.app.apiVersion}`, routes);

// Ruta raíz
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'The Brothers Barber Shop API is running!',
    version: config.app.apiVersion,
    timestamp: new Date().toISOString(),
    status: 'healthy'
  });
});

// Ruta de estado de salud
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    service: 'The Brothers Barber Shop API',
    time: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    }
  });
});

// Manejo de rutas no encontradas
app.use(notFound);

// Manejo de errores
app.use(errorHandler);

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥');
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥');
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  process.exit(1);
});

// Exportar la app
export default app;
