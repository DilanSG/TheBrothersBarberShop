import express from 'express';
import { metricsEndpoint, healthCheck } from '../middleware/monitoring.js';
import { protect, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Health check público
router.get('/health', healthCheck);

// Métricas detalladas (solo admin)
router.get('/metrics', protect, adminAuth, metricsEndpoint);

export default router;
