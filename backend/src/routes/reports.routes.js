import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { dailyReport } from '../controllers/reports.controller.js';


const router = Router();


router.get('/daily', authRequired, requireRole('admin'), dailyReport);


export default router;