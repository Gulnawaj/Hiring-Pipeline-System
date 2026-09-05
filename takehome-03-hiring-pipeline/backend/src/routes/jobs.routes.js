import { Router } from 'express';
import { JobOpening } from '../models/JobOpening.js';
import { Application } from '../models/Application.js';
import { InterviewPanel } from '../models/InterviewPanel.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRecruiter } from '../middleware/role.middleware.js';

const router = Router();

// GET /api/jobs
router.get('/', authenticate, async (req, res) => {
  try {
    const includeArchived = req.query.include_archived === 'true';
    const user = req.user;

    if (user.role === 'recruiter') {
      const whereClause = includeArchived ? {} : { status: { $ne: 'archived' } };

      const jobs = await JobOpening.find(whereClause).sort({ created_at: -1 }).lean();
      
      const jobIds = jobs.map(j => j._id);
      const applications = await Application.find({ job_opening_id: { $in: jobIds } })
        .select('_id job_opening_id stage is_rejected')
        .lean();

      const appsByJob = applications.reduce((acc, app) => {
        const jobId = app.job_opening_id.toString();
        if(!acc[jobId]) acc[jobId] = [];
        acc[jobId].push(app);
        return acc;
      }, {});

      const formatted = jobs.map((job) => {
        const jobId = job._id.toString();
        const jobApps = appsByJob[jobId] || [];
        const total = jobApps.length;
        const active = jobApps.filter(
          (a) => a.is_rejected === 0 && a.stage !== 'hired'
        ).length;

        const { _id, __v, ...rest } = job;
        return {
          ...rest,
          id: jobId,
          total_applications: total,
          active_applications: active,
        };
      });

      res.json(formatted);
      return;
    }

    // Interviewer role
    const assignedPanels = await InterviewPanel.find({ interviewer_id: user.id }).lean();
    const assignedAppIds = assignedPanels.map(p => p.application_id);

    const assignedApps = await Application.find({ _id: { $in: assignedAppIds } }).lean();
    const assignedJobIds = assignedApps.map(a => a.job_opening_id);

    const jobs = await JobOpening.find({ 
      _id: { $in: assignedJobIds }, 
      status: { $ne: 'archived' } 
    }).sort({ created_at: -1 }).lean();

    const appsByJob = assignedApps.reduce((acc, app) => {
      const jobId = app.job_opening_id.toString();
      if(!acc[jobId]) acc[jobId] = [];
      acc[jobId].push(app);
      return acc;
    }, {});

    const formatted = jobs.map((job) => {
      const jobId = job._id.toString();
      const jobApps = appsByJob[jobId] || [];
      const { _id, __v, ...rest } = job;
      return {
        ...rest,
        id: jobId,
        total_applications: jobApps.length,
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching jobs:', err);
    res.status(500).json({ error: 'Failed to fetch job openings' });
  }
});

// GET /api/jobs/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const job = await JobOpening.findById(id).lean();
    if (!job) {
      res.status(404).json({ error: 'Job opening not found' });
      return;
    }

    const applications = await Application.find({ job_opening_id: id }).lean();
    const appIds = applications.map(a => a._id);
    const panels = await InterviewPanel.find({ application_id: { $in: appIds } }).lean();
    
    // Attach panels to applications
    applications.forEach(app => {
      app.interview_panel = panels.filter(p => p.application_id.toString() === app._id.toString());
    });

    if (user.role === 'interviewer') {
      const hasAssigned = applications.some((app) =>
        app.interview_panel.some((p) => p.interviewer_id.toString() === user.id)
      );

      if (!hasAssigned) {
        res.status(403).json({
          error: 'Access denied. You have no assigned candidates in this job opening.',
        });
        return;
      }
    }

    const total = applications.length;
    const active = applications.filter(
      (a) => a.is_rejected === 0 && a.stage !== 'hired'
    ).length;

    const { _id, __v, ...rest } = job;
    res.json({
      ...rest,
      id: _id.toString(),
      total_applications: total,
      active_applications: active,
    });
  } catch (err) {
    console.error('Error fetching job opening:', err);
    res.status(500).json({ error: 'Failed to fetch job opening' });
  }
});

// POST /api/jobs (Recruiter only)
router.post('/', authenticate, requireRecruiter, async (req, res) => {
  try {
    const { title, department, description, status = 'open' } = req.body;

    if (!title?.trim() || !department?.trim() || !description?.trim()) {
      res.status(400).json({ error: 'Title, department, and description are required' });
      return;
    }

    if (!['open', 'closed', 'archived'].includes(status)) {
      res.status(400).json({ error: 'Invalid status. Must be open, closed, or archived.' });
      return;
    }

    const created = await JobOpening.create({
      title: title.trim(),
      department: department.trim(),
      description: description.trim(),
      status,
    });

    const obj = created.toObject();
    obj.id = obj._id.toString();
    delete obj._id;
    delete obj.__v;

    res.status(201).json(obj);
  } catch (err) {
    console.error('Error creating job opening:', err);
    res.status(500).json({ error: 'Failed to create job opening' });
  }
});

// PUT /api/jobs/:id (Recruiter only)
router.put('/:id', authenticate, requireRecruiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, department, description, status } = req.body;

    const existing = await JobOpening.findById(id);
    if (!existing) {
      res.status(404).json({ error: 'Job opening not found' });
      return;
    }

    if (!title?.trim() || !department?.trim() || !description?.trim()) {
      res.status(400).json({ error: 'Title, department, and description are required' });
      return;
    }

    if (status && !['open', 'closed', 'archived'].includes(status)) {
      res.status(400).json({ error: 'Invalid status. Must be open, closed, or archived.' });
      return;
    }

    existing.title = title.trim();
    existing.department = department.trim();
    existing.description = description.trim();
    if (status) existing.status = status;

    const updated = await existing.save();

    const obj = updated.toObject();
    obj.id = obj._id.toString();
    delete obj._id;
    delete obj.__v;

    res.json(obj);
  } catch (err) {
    console.error('Error updating job opening:', err);
    res.status(500).json({ error: 'Failed to update job opening' });
  }
});

// POST /api/jobs/:id/archive (Recruiter only)
router.post('/:id/archive', authenticate, requireRecruiter, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await JobOpening.findById(id);
    if (!existing) {
      res.status(404).json({ error: 'Job opening not found' });
      return;
    }

    existing.status = 'archived';
    await existing.save();

    res.json({ message: 'Job opening archived successfully', id });
  } catch (err) {
    console.error('Error archiving job opening:', err);
    res.status(500).json({ error: 'Failed to archive job opening' });
  }
});

// POST /api/jobs/:id/restore (Recruiter only)
router.post('/:id/restore', authenticate, requireRecruiter, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await JobOpening.findById(id);
    if (!existing) {
      res.status(404).json({ error: 'Job opening not found' });
      return;
    }

    existing.status = 'open';
    await existing.save();

    res.json({ message: 'Job opening restored successfully', id });
  } catch (err) {
    console.error('Error restoring job opening:', err);
    res.status(500).json({ error: 'Failed to restore job opening' });
  }
});

export default router;
