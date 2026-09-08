import { Router } from 'express';
import { Application } from '../models/Application.js';
import { InterviewPanel } from '../models/InterviewPanel.js';
import { StalledAlertDismissal } from '../models/StalledAlertDismissal.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRecruiter } from '../middleware/role.middleware.js';

const router = Router();
const STALLED_THRESHOLD_DAYS = 10;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// GET /api/alerts
router.get('/', authenticate, requireRecruiter, async (req, res) => {
  try {
    const user = req.user;
    const thresholdDate = new Date(Date.now() - STALLED_THRESHOLD_DAYS * MS_PER_DAY);

    const apps = await Application.find({
      is_rejected: 0,
      stage: { $ne: 'hired' },
      stage_entered_at: { $lte: thresholdDate },
    })
      .populate('job_opening_id', 'title department')
      .sort({ stage_entered_at: 1 })
      .lean();

    const appIds = apps.map(a => a._id);
    const dismissals = await StalledAlertDismissal.find({
      application_id: { $in: appIds },
      user_id: user.id,
    }).lean();

    const panels = await InterviewPanel.find({ application_id: { $in: appIds } })
      .populate('interviewer_id', 'id name email')
      .lean();

    const activeAlerts = apps
      .filter((app) => {
        const appDismissals = dismissals.filter(d => d.application_id.toString() === app._id.toString());
        return !appDismissals.some((d) => d.dismissed_stage === app.stage);
      })
      .map((app) => {
        const diffMs = Date.now() - new Date(app.stage_entered_at).getTime();
        const days = Math.floor(diffMs / MS_PER_DAY);
        const appPanels = panels.filter(p => p.application_id.toString() === app._id.toString());

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
          stage_entered_at: app.stage_entered_at.toISOString(),
          created_at: app.created_at.toISOString(),
          updated_at: app.updated_at.toISOString(),
          job_title: app.job_opening_id?.title,
          job_department: app.job_opening_id?.department,
          assigned_interviewers: appPanels.map((ip) => ip.interviewer_id),
          days_in_stage: days,
        };
      });

    res.json(activeAlerts);
  } catch (err) {
    console.error('Error fetching stalled alerts:', err);
    res.status(500).json({ error: 'Failed to fetch stalled application alerts' });
  }
});

// GET /api/alerts/count
router.get('/count', authenticate, async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== 'recruiter') {
      res.json({ count: 0 });
      return;
    }

    const thresholdDate = new Date(Date.now() - STALLED_THRESHOLD_DAYS * MS_PER_DAY);

    const apps = await Application.find({
      is_rejected: 0,
      stage: { $ne: 'hired' },
      stage_entered_at: { $lte: thresholdDate },
    }).lean();

    const appIds = apps.map(a => a._id);
    const dismissals = await StalledAlertDismissal.find({
      application_id: { $in: appIds },
      user_id: user.id,
    }).lean();

    const activeCount = apps.filter(
      (app) => {
        const appDismissals = dismissals.filter(d => d.application_id.toString() === app._id.toString());
        return !appDismissals.some((d) => d.dismissed_stage === app.stage);
      }
    ).length;

    res.json({ count: activeCount });
  } catch (err) {
    console.error('Error getting alerts count:', err);
    res.status(500).json({ error: 'Failed to get alert count' });
  }
});

// POST /api/alerts/:id/dismiss
router.post('/:id/dismiss', authenticate, requireRecruiter, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const app = await Application.findById(id);
    if (!app) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    await StalledAlertDismissal.findOneAndUpdate(
      {
        application_id: id,
        user_id: user.id,
        dismissed_stage: app.stage,
      },
      {
        dismissed_at: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({
      message: `Alert dismissed for application in stage "${app.stage}"`,
      application_id: id,
      dismissed_stage: app.stage,
    });
  } catch (err) {
    console.error('Error dismissing alert:', err);
    res.status(500).json({ error: 'Failed to dismiss alert' });
  }
});

export default router;
