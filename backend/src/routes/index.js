import { Router } from 'express';
import authRoutes from './auth.js';
import userRoutes from './users.js';
import serviceRoutes from './services.js';
import barberRoutes from './barbers.js';
import appointmentRoutes from './appointment.js';
import inventoryRoutes from './inventory.js';
import salesRoutes from './sales.js';
import inventorySnapshotRoutes from './inventorySnapshot.js';
import monitoringRoutes from './monitoring.js';
import debugRoutes from './debug.js';
import { errorHandler, monitoringMiddleware } from '../middleware/index.js';

const router = Router();

// Aplicar middleware de monitoreo a todas las rutas
router.use(monitoringMiddleware);

// Montar todas las rutas
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/services', serviceRoutes);
router.use('/barbers', barberRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/inventory-snapshots', inventorySnapshotRoutes);
router.use('/sales', salesRoutes);
router.use('/monitoring', monitoringRoutes);

// Solo montar rutas de debug en desarrollo
if (process.env.NODE_ENV === 'development') {
  router.use('/debug', debugRoutes);
}

// Manejador de errores global
router.use(errorHandler);

export default router;
