import { Router } from 'express';
import { Application } from '../models/Application.js';
import { JobOpening } from '../models/JobOpening.js';
import { InterviewPanel } from '../models/InterviewPanel.js';
import { ApplicationTimeline } from '../models/ApplicationTimeline.js';
import { User } from '../models/User.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRecruiter } from '../middleware/role.middleware.js';
import mongoose from 'mongoose';

const router = Router();

function getDaysInStage(stageEnteredAt) {
  const diffMs = Date.now() - new Date(stageEnteredAt).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

// Formatter function to format mongoose documents to standard response
function formatApplication(app) {
  const days = getDaysInStage(app.stage_entered_at);
  const isStalled = days >= 10 && app.is_rejected === 0 && app.stage !== 'hired';
  
  return {
    id: app._id.toString(),
    job_opening_id: app.job_opening_id._id ? app.job_opening_id._id.toString() : app.job_opening_id.toString(),
    candidate_name: app.candidate_name,
    candidate_email: app.candidate_email,
    source: app.source,
    notes: app.notes,
    stage: app.stage,
    is_rejected: app.is_rejected,
    stage_before_rejection: app.stage_before_rejection,
    stage_entered_at: app.stage_entered_at ? app.stage_entered_at.toISOString() : undefined,
    created_at: app.created_at ? app.created_at.toISOString() : undefined,
    updated_at: app.updated_at ? app.updated_at.toISOString() : undefined,
    job_title: app.job_opening_id?.title,
    job_department: app.job_opening_id?.department,
    job_status: app.job_opening_id?.status,
    assigned_interviewers: app.interview_panel ? app.interview_panel.map(ip => ({
      id: ip.interviewer_id._id.toString(),
      name: ip.interviewer_id.name,
      email: ip.interviewer_id.email
    })) : [],
    timeline: app.timeline ? app.timeline.map(t => {
      const obj = t;
      obj.id = obj._id.toString();
      delete obj._id;
      delete obj.__v;
      return obj;
    }) : undefined,
    days_in_stage: days,
    is_stalled: isStalled,
  };
}

// GET /api/applications
router.get('/', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const {
      search,
      job_opening_id,
      stage,
      source,
      is_rejected,
      sort_by = 'created_at',
      order = 'desc',
      page = '1',
      limit = '10',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (user.role === 'interviewer') {
      const assignedPanels = await InterviewPanel.find({ interviewer_id: user.id }).lean();
      where._id = { $in: assignedPanels.map(p => p.application_id) };
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const term = search.trim();
      where.$or = [
        { candidate_name: { $regex: new RegExp(term, 'i') } },
        { candidate_email: { $regex: new RegExp(term, 'i') } },
      ];
    }

    if (job_opening_id && typeof job_opening_id === 'string' && job_opening_id.trim() !== '') {
      where.job_opening_id = job_opening_id.trim();
    }

    if (stage && typeof stage === 'string' && stage.trim() !== '') {
      where.stage = stage.trim().toLowerCase();
    }

    if (source && typeof source === 'string' && source.trim() !== '') {
      where.source = source.trim();
    }

    if (is_rejected !== undefined && is_rejected !== '') {
      where.is_rejected = is_rejected === 'true' || is_rejected === '1' ? 1 : 0;
    }

    const sortDirection = order.toLowerCase() === 'asc' ? 1 : -1;
    const validSortFields = {
      created_at: 'created_at',
      stage: 'stage',
      updated_at: 'updated_at',
      candidate_name: 'candidate_name',
    };
    const orderByField = validSortFields[sort_by] || 'created_at';
    const sort = { [orderByField]: sortDirection };

    const total = await Application.countDocuments(where);

    const applications = await Application.find(where)
      .populate('job_opening_id', 'title department status')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const appIds = applications.map(a => a._id);
    const panels = await InterviewPanel.find({ application_id: { $in: appIds } })
      .populate('interviewer_id', 'id name email')
      .lean();

    applications.forEach(app => {
      app.interview_panel = panels.filter(p => p.application_id.toString() === app._id.toString());
    });

    const enriched = applications.map(formatApplication);

    res.json({
      data: enriched,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        total_pages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    console.error('Error fetching applications:', err);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// GET /api/applications/assigned
router.get('/assigned', authenticate, async (req, res) => {
  try {
    const user = req.user;

    const assignedPanels = await InterviewPanel.find({ interviewer_id: user.id }).lean();
    const assignedAppIds = assignedPanels.map(p => p.application_id);

    const applications = await Application.find({ _id: { $in: assignedAppIds } })
      .populate('job_opening_id', 'title department')
      .sort({ updated_at: -1 })
      .lean();

    const panels = await InterviewPanel.find({ application_id: { $in: assignedAppIds } })
      .populate('interviewer_id', 'id name email')
      .lean();

    applications.forEach(app => {
      app.interview_panel = panels.filter(p => p.application_id.toString() === app._id.toString());
    });

    const enriched = applications.map(formatApplication);

    res.json(enriched);
  } catch (err) {
    console.error('Error fetching assigned applications:', err);
    res.status(500).json({ error: 'Failed to fetch assigned applications' });
  }
});

// GET /api/applications/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const app = await Application.findById(id)
      .populate('job_opening_id', 'title department status')
      .lean();

    if (!app) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    const panels = await InterviewPanel.find({ application_id: id })
      .populate('interviewer_id', 'id name email')
      .lean();
      
    app.interview_panel = panels;

    if (user.role === 'interviewer') {
      const isAssigned = app.interview_panel.some((ip) => ip.interviewer_id._id.toString() === user.id);
      if (!isAssigned) {
        res.status(403).json({ error: 'Access denied. You are not assigned to this candidate.' });
        return;
      }
    }

    app.timeline = await ApplicationTimeline.find({ application_id: id }).sort({ created_at: 1 }).lean();

    res.json(formatApplication(app));
  } catch (err) {
    console.error('Error fetching application details:', err);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// POST /api/applications
router.post('/', authenticate, requireRecruiter, async (req, res) => {
  try {
    const { job_opening_id, candidate_name, candidate_email, source, notes = '' } = req.body;
    const user = req.user;

    if (!job_opening_id?.trim() || !candidate_name?.trim() || !candidate_email?.trim() || !source?.trim()) {
      res.status(400).json({ error: 'Job opening, candidate name, candidate email, and source are required.' });
      return;
    }

    const job = await JobOpening.findById(job_opening_id);
    if (!job) {
      res.status(400).json({ error: 'Selected job opening does not exist.' });
      return;
    }

    const created = await Application.create({
      job_opening_id,
      candidate_name: candidate_name.trim(),
      candidate_email: candidate_email.trim(),
      source: source.trim(),
      notes: notes.trim(),
      stage: 'applied',
      is_rejected: 0,
    });

    await ApplicationTimeline.create({
      application_id: created._id,
      actor_id: user.id,
      actor_name: user.name,
      event_type: 'created',
      details: JSON.stringify({
        message: `Application created for job opening: ${job.title}`,
        source: source.trim(),
        notes: notes.trim(),
      }),
    });

    const obj = created.toObject();
    obj.id = obj._id.toString();
    delete obj._id;
    delete obj.__v;

    res.status(201).json(obj);
  } catch (err) {
    console.error('Error creating application:', err);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

// PUT /api/applications/:id
router.put('/:id', authenticate, requireRecruiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { candidate_name, candidate_email, source, notes, job_opening_id } = req.body;

    const existing = await Application.findById(id);
    if (!existing) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    if (!candidate_name?.trim() || !candidate_email?.trim() || !source?.trim()) {
      res.status(400).json({ error: 'Candidate name, candidate email, and source are required.' });
      return;
    }

    existing.candidate_name = candidate_name.trim();
    existing.candidate_email = candidate_email.trim();
    existing.source = source.trim();
    if (notes !== undefined) existing.notes = notes.trim();
    if (job_opening_id) existing.job_opening_id = job_opening_id;

    const updated = await existing.save();

    const obj = updated.toObject();
    obj.id = obj._id.toString();
    delete obj._id;
    delete obj.__v;

    res.json(obj);
  } catch (err) {
    console.error('Error updating application:', err);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// POST /api/applications/:id/interviewers
router.post('/:id/interviewers', authenticate, requireRecruiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { interviewer_id } = req.body;

    const app = await Application.findById(id);
    if (!app) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    const interviewer = await User.findById(interviewer_id);
    if (!interviewer) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (interviewer.role !== 'interviewer') {
      res.status(400).json({
        error: `Cannot assign user with role "${interviewer.role}". Only users with the interviewer role may be assigned.`,
      });
      return;
    }

    const existingAssignment = await InterviewPanel.findOne({
      application_id: id,
      interviewer_id,
    });

    if (existingAssignment) {
      res.status(400).json({ error: 'This interviewer is already assigned to this application.' });
      return;
    }

    // use mongoose transaction if replica set, otherwise normal
    await InterviewPanel.create({
      application_id: id,
      interviewer_id,
    });

    await ApplicationTimeline.create({
      application_id: id,
      actor_id: req.user.id,
      actor_name: req.user.name,
      event_type: 'feedback',
      details: JSON.stringify({
        message: `Assigned interviewer: ${interviewer.name} (${interviewer.email})`,
      }),
    });

    res.json({ message: 'Interviewer assigned successfully', interviewer_id, application_id: id });
  } catch (err) {
    console.error('Error assigning interviewer:', err);
    res.status(500).json({ error: 'Failed to assign interviewer' });
  }
});

// DELETE /api/applications/:id/interviewers/:interviewerId
router.delete('/:id/interviewers/:interviewerId', authenticate, requireRecruiter, async (req, res) => {
  try {
    const { id, interviewerId } = req.params;

    const deleted = await InterviewPanel.deleteMany({
      application_id: id,
      interviewer_id: interviewerId,
    });

    if (deleted.deletedCount === 0) {
      res.status(404).json({ error: 'Assignment not found' });
      return;
    }

    res.json({ message: 'Interviewer unassigned successfully' });
  } catch (err) {
    console.error('Error unassigning interviewer:', err);
    res.status(500).json({ error: 'Failed to unassign interviewer' });
  }
});

export default router;
