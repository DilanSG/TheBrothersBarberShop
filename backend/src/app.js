import express from 'express';
import helmet from 'helmet';
import { generalLimiter, authLimiter } from './config/rateLimit.js';
import { corsMiddleware } from './config/cors.js';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { requestLogger, errorLogger } from './utils/logger.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import serviceRoutes from './routes/services.js';
import barberRoutes from './routes/barbers.js';
import appointmentRoutes from './routes/appointment.js';
import inventoryRoutes from './routes/inventory.js';
import debugRoutes from './routes/debug.js';

const swaggerDocument = YAML.load('./docs/swagger.yaml');

const app = express();

// Seguridad y CORS
app.use(helmet());
app.use(corsMiddleware);

// Rate limiting global
app.use(generalLimiter);

// Rate limiting para login
app.use('/api/auth/login', authLimiter);

// Logger de requests
app.use(requestLogger);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/barbers', barberRoutes);  // Registrar la ruta de barberos
app.use('/api/barbers', barberRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/debug', debugRoutes);

// Documentación API
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Manejador de rutas no encontradas (404)
app.use((req, res, next) => {
  if (!res.headersSent) {
    console.log(`❌ Ruta no encontrada: ${req.method} ${req.path}`);
    res.status(404).json({
      success: false,
      message: `Ruta no encontrada: ${req.method} ${req.path}`
    });
  }
});

// Ruta de salud
// Middleware para imprimir las rutas solicitadas
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'The Brothers Barber Shop API está funcionando',
    timestamp: new Date().toISOString()
  });
});

// Logger de errores
app.use(errorLogger);

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Middleware de manejo de errores
import { errorHandler } from './middleware/errorHandler.js';
app.use(errorHandler);

export default app;