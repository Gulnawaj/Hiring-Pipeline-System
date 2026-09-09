import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import * as timelineController from '../controllers/timeline.controller.js';

const router = Router();

// GET /api/applications/:id/timeline
router.get('/:id/timeline', authenticate, timelineController.getTimeline);

// POST /api/applications/:id/feedback
router.post('/:id/feedback', authenticate, timelineController.submitFeedback);

// Explicitly reject any attempts to edit or delete timeline events
router.put('/:id/timeline/:eventId', authenticate, timelineController.editTimelineEvent);

router.delete('/:id/timeline/:eventId', authenticate, timelineController.deleteTimelineEvent);

export default router;
