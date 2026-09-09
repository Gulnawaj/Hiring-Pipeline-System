import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRecruiter } from '../middleware/role.middleware.js';
import * as pipelineController from '../controllers/pipeline.controller.js';

const router = Router();

// POST /api/pipeline/:id/advance
router.post('/:id/advance', authenticate, requireRecruiter, pipelineController.advancePipelineStage);

// POST /api/pipeline/:id/transition
router.post('/:id/transition', authenticate, requireRecruiter, pipelineController.transitionPipelineStage);

// POST /api/pipeline/:id/reject
router.post('/:id/reject', authenticate, requireRecruiter, pipelineController.rejectApplication);

// POST /api/pipeline/:id/reinstate
router.post('/:id/reinstate', authenticate, requireRecruiter, pipelineController.reinstateApplication);

// POST /api/pipeline/bulk-advance
router.post('/bulk-advance', authenticate, requireRecruiter, pipelineController.bulkAdvancePipelineStage);

// POST /api/pipeline/bulk-reject
router.post('/bulk-reject', authenticate, requireRecruiter, pipelineController.bulkRejectApplication);

export default router;
