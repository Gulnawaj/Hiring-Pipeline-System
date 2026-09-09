import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRecruiter } from '../middleware/role.middleware.js';
import * as exportController from '../controllers/export.controller.js';

const router = Router();

// GET /api/export/applications
// Export a snapshot of every currently open application and its stage.
router.get('/applications', authenticate, requireRecruiter, exportController.exportApplications);

export default router;