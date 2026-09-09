import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRecruiter } from '../middleware/role.middleware.js';
import * as dashboardController from '../controllers/dashboard.controller.js';

const router = Router();

// GET /api/dashboard
router.get('/', authenticate, requireRecruiter, dashboardController.getDashboardMetrics);

export default router;