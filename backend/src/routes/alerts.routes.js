import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRecruiter } from '../middleware/role.middleware.js';
import * as alertsController from '../controllers/alerts.controller.js';

const router = Router();

// GET /api/alerts
router.get('/', authenticate, requireRecruiter, alertsController.getAlerts);

// GET /api/alerts/count
router.get('/count', authenticate, alertsController.getAlertsCount);

// POST /api/alerts/:id/dismiss
router.post('/:id/dismiss', authenticate, requireRecruiter, alertsController.dismissAlert);

export default router;
