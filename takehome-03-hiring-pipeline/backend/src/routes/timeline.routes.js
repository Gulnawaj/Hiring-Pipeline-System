import { Router } from 'express';
import { Application } from '../models/Application.js';
import { InterviewPanel } from '../models/InterviewPanel.js';
import { ApplicationTimeline } from '../models/ApplicationTimeline.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// GET /api/applications/:id/timeline
router.get('/:id/timeline', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const app = await Application.findById(id).lean();

    if (!app) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    if (user.role === 'interviewer') {
      const panel = await InterviewPanel.findOne({ application_id: id, interviewer_id: user.id });
      if (!panel) {
        res.status(403).json({ error: 'Access denied. You are not assigned to this application.' });
        return;
      }
    }

    const events = await ApplicationTimeline.find({ application_id: id }).sort({ created_at: 1 }).lean();

    const formattedEvents = events.map((e) => {
      const { _id, __v, ...rest } = e;
      return { ...rest, id: _id.toString() };
    });

    res.json(formattedEvents);
  } catch (err) {
    console.error('Error fetching timeline:', err);
    res.status(500).json({ error: 'Failed to fetch application timeline' });
  }
});

// POST /api/applications/:id/feedback
router.post('/:id/feedback', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { comments, rating, recommendation } = req.body;
    const user = req.user;

    const app = await Application.findById(id);

    if (!app) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    if (user.role === 'interviewer') {
      const panel = await InterviewPanel.findOne({ application_id: id, interviewer_id: user.id });
      if (!panel) {
        res.status(403).json({ error: 'Access denied. Only assigned interviewers can leave feedback.' });
        return;
      }
    }

    if (!comments || typeof comments !== 'string' || comments.trim() === '') {
      res.status(400).json({ error: 'Feedback comments are required.' });
      return;
    }

    const numericRating = typeof rating === 'number' ? rating : parseInt(rating, 10);
    if (rating !== undefined && (isNaN(numericRating) || numericRating < 1 || numericRating > 5)) {
      res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
      return;
    }

    const details = JSON.stringify({
      rating: numericRating || null,
      recommendation: recommendation || null,
      comments: comments.trim(),
      submitted_by_role: user.role,
    });

    const created = await ApplicationTimeline.create({
      application_id: id,
      actor_id: user.id,
      actor_name: user.name,
      event_type: 'feedback',
      details,
    });

    const obj = created.toObject();
    obj.id = obj._id.toString();
    delete obj._id;
    delete obj.__v;

    res.status(201).json(obj);
  } catch (err) {
    console.error('Error submitting feedback:', err);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Explicitly reject any attempts to edit or delete timeline events
router.put('/:id/timeline/:eventId', authenticate, (_req, res) => {
  res.status(403).json({
    error: 'Timeline is immutable. Past events and feedback cannot be edited after creation.',
  });
});

router.delete('/:id/timeline/:eventId', authenticate, (_req, res) => {
  res.status(403).json({
    error: 'Timeline is immutable. Past events and feedback cannot be deleted after creation.',
  });
});

export default router;
