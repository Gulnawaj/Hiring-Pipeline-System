import { Router } from 'express';
import { JobOpening } from '../models/JobOpening.js';
import { Application } from '../models/Application.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRecruiter } from '../middleware/role.middleware.js';

const router = Router();
const PIPELINE_STAGES = ['applied', 'screening', 'interview', 'offer', 'hired'];

// GET /api/dashboard
router.get('/', authenticate, requireRecruiter, async (req, res) => {
  try {
    const now = new Date();

    // 1. Headline Numbers
    const openPositions = await JobOpening.countDocuments({ status: 'open' });

    const activeApplications = await Application.countDocuments({
      is_rejected: 0,
      stage: { $ne: 'hired' },
    });

    const interviewsThisWeek = await Application.countDocuments({
      stage: 'interview',
      is_rejected: 0,
    });

    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const hiresThisMonth = await Application.countDocuments({
      stage: 'hired',
      is_rejected: 0,
      stage_entered_at: { $gte: thirtyDaysAgo },
    });

    // 2. Breakdown by Job Opening
    const jobs = await JobOpening.find().sort({ created_at: -1 }).lean();
    const jobIds = jobs.map(j => j._id);
    
    const applications = await Application.find({ job_opening_id: { $in: jobIds } })
      .select('job_opening_id stage is_rejected')
      .lean();
      
    const appsByJob = applications.reduce((acc, app) => {
      const jobId = app.job_opening_id.toString();
      if (!acc[jobId]) acc[jobId] = [];
      acc[jobId].push(app);
      return acc;
    }, {});

    const jobBreakdown = jobs.map((j) => {
      const jApps = appsByJob[j._id.toString()] || [];
      const total = jApps.length;
      const active = jApps.filter((a) => a.is_rejected === 0 && a.stage !== 'hired').length;
      const hired = jApps.filter((a) => a.stage === 'hired' && a.is_rejected === 0).length;
      const rejected = jApps.filter((a) => a.is_rejected === 1).length;

      return {
        id: j._id.toString(),
        title: j.title,
        department: j.department,
        status: j.status,
        total_applications: total,
        active_count: active,
        hired_count: hired,
        rejected_count: rejected,
      };
    });

    // 3. Breakdown by Stage
    const stageCounts = {};
    for (const s of PIPELINE_STAGES) {
      stageCounts[s] = 0;
    }
    stageCounts['rejected'] = 0;

    const allApps = await Application.find().select('stage is_rejected').lean();

    for (const app of allApps) {
      if (app.is_rejected === 1) {
        stageCounts['rejected'] = (stageCounts['rejected'] || 0) + 1;
      } else {
        stageCounts[app.stage] = (stageCounts[app.stage] || 0) + 1;
      }
    }

    // 4. Applications received per week over the last quarter (12 weeks)
    const weeklyTrends = [];
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const MS_PER_WEEK = 7 * MS_PER_DAY;

    for (let i = 11; i >= 0; i--) {
      const weekStartTime = new Date(now.getTime() - (i + 1) * MS_PER_WEEK);
      const weekEndTime = new Date(now.getTime() - i * MS_PER_WEEK);

      const count = await Application.countDocuments({
        created_at: {
          $gte: weekStartTime,
          $lt: weekEndTime,
        },
      });

      const monthName = weekStartTime.toLocaleDateString('en-US', { month: 'short' });
      const day = weekStartTime.getDate();

      weeklyTrends.push({
        week_label: `${monthName} ${day}`,
        week_start: weekStartTime.toISOString(),
        week_end: weekEndTime.toISOString(),
        count,
      });
    }

    res.json({
      metrics: {
        open_positions: openPositions,
        active_applications: activeApplications,
        interviews_scheduled: interviewsThisWeek,
        hires_this_month: hiresThisMonth,
      },
      by_job: jobBreakdown,
      by_stage: stageCounts,
      weekly_trend: weeklyTrends,
    });
  } catch (err) {
    console.error('Error loading dashboard:', err);
    res.status(500).json({ error: 'Failed to load dashboard metrics' });
  }
});

export default router;
