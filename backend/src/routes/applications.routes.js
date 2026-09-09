import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRecruiter } from '../middleware/role.middleware.js';
import * as applicationsController from '../controllers/applications.controller.js';

const router = Router();

// GET /api/applications
router.get('/', authenticate, applicationsController.getApplications);

// GET /api/applications/assigned
router.get('/assigned', authenticate, applicationsController.getAssignedApplications);

// GET /api/applications/sources — returns distinct source values for filter dropdowns
router.get('/sources', authenticate, applicationsController.getApplicationSources);

// GET /api/applications/:id
router.get('/:id', authenticate, applicationsController.getApplicationById);

// POST /api/applications
router.post('/', authenticate, requireRecruiter, applicationsController.createApplication);

// PUT /api/applications/:id
router.put('/:id', authenticate, requireRecruiter, applicationsController.updateApplication);

// POST /api/applications/:id/interviewers
router.post('/:id/interviewers', authenticate, requireRecruiter, applicationsController.assignInterviewer);

// DELETE /api/applications/:id/interviewers/:interviewerId
router.delete('/:id/interviewers/:interviewerId', authenticate, requireRecruiter, applicationsController.unassignInterviewer);

export default router;
