import { Application } from '../models/Application.js';
import { InterviewPanel } from '../models/InterviewPanel.js';
import { ApplicationTimeline } from '../models/ApplicationTimeline.js';

export const getTimeline = async (req, res) => {
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

    const events = await ApplicationTimeline.find({ application_id: id })
      .populate('actor_id', 'name email')
      .sort({ created_at: 1 })
      .lean();

    const formattedEvents = events.map((e) => {
      const { _id, __v, actor_id, ...rest } = e;
      const formattedEvent = { ...rest, id: _id.toString() };
      
      if (actor_id && typeof actor_id === 'object') {
        formattedEvent.actor = {
          id: actor_id._id.toString(),
          name: actor_id.name,
          email: actor_id.email
        };
      }
      return formattedEvent;
    });

    res.json(formattedEvents);
  } catch (err) {
    console.error('Error fetching timeline:', err);
    res.status(500).json({ error: 'Failed to fetch application timeline' });
  }
};

export const submitFeedback = async (req, res) => {
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

    const hasComments = comments && typeof comments === 'string' && comments.trim() !== '';
    const numericRating = typeof rating === 'number' ? rating : parseInt(rating, 10);
    const hasRating = rating !== undefined && !isNaN(numericRating) && numericRating >= 1 && numericRating <= 5;
    const hasRecommendation = recommendation && typeof recommendation === 'string' && recommendation.trim() !== '';

    if (!hasComments && !hasRating && !hasRecommendation) {
      res.status(400).json({ error: 'Feedback cannot be empty. Please provide comments, a rating, or a recommendation.' });
      return;
    }

    if (rating !== undefined && rating !== null && (isNaN(numericRating) || numericRating < 1 || numericRating > 5)) {
      res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
      return;
    }

    const details = JSON.stringify({
      rating: numericRating || null,
      recommendation: recommendation || null,
      comments: comments ? comments.trim() : '',
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
};

export const editTimelineEvent = (_req, res) => {
  res.status(403).json({
    error: 'Timeline is immutable. Past events and feedback cannot be edited after creation.',
  });
};

export const deleteTimelineEvent = (_req, res) => {
  res.status(403).json({
    error: 'Timeline is immutable. Past events and feedback cannot be deleted after creation.',
  });
};
