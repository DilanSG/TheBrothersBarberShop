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
import YAML from 'yamljs';
import swaggerUi from 'swagger-ui-express';
import mongoose from 'mongoose';

// Configuraciones
import { config, validateEnv } from './shared/config/index.js';
import { corsOptions } from './shared/config/cors.js';
import { cloudinaryConfig } from './shared/config/cloudinary.js';
import { setupSwagger } from './shared/config/swagger.js';

// Utilidades y middleware
import { logger } from './shared/utils/logger.js';
import { morganMiddleware } from './presentation/middleware/morgan.js';
import { errorHandler } from './presentation/middleware/errorHandler.js';
import { notFound } from './presentation/middleware/notFound.js';

// Rutas
import routes from './presentation/routes/index.js';

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Ruta raíz - Bienvenida de la API
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'The Brothers Barber Shop API',
    version: config.app.apiVersion,
    message: 'API funcionando correctamente',
    endpoints: {
      health: '/health',
      api: `/api/${config.app.apiVersion}`,
      documentation: '/api/docs'
    },
    timestamp: new Date().toISOString(),
    environment: config.app.nodeEnv
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
