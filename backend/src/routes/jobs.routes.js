import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRecruiter } from '../middleware/role.middleware.js';
import * as jobsController from '../controllers/jobs.controller.js';

const router = Router();

// GET /api/jobs
router.get('/', authenticate, jobsController.getJobs);

// GET /api/jobs/:id
router.get('/:id', authenticate, jobsController.getJobById);

// POST /api/jobs (Recruiter only)
router.post('/', authenticate, requireRecruiter, jobsController.createJob);

// PUT /api/jobs/:id (Recruiter only)
router.put('/:id', authenticate, requireRecruiter, jobsController.updateJob);

// POST /api/jobs/:id/archive (Recruiter only)
router.post('/:id/archive', authenticate, requireRecruiter, jobsController.archiveJob);

// POST /api/jobs/:id/restore (Recruiter only)
router.post('/:id/restore', authenticate, requireRecruiter, jobsController.restoreJob);

export default router;
