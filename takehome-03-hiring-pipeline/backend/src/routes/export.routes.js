import { Router } from 'express';
import { Application } from '../models/Application.js';
import { JobOpening } from '../models/JobOpening.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRecruiter } from '../middleware/role.middleware.js';

const router = Router();

function escapeCsv(value) {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

// GET /api/export/csv
router.get('/csv', authenticate, requireRecruiter, async (_req, res) => {
  try {
    const validJobs = await JobOpening.find({ status: { $ne: 'archived' } }).lean();
    const validJobIds = validJobs.map(j => j._id);

    const applications = await Application.find({
      is_rejected: 0,
      job_opening_id: { $in: validJobIds },
    })
      .populate('job_opening_id', 'title department')
      .sort({ created_at: -1 })
      .lean();

    // sort in JS by title asc then created_at desc (already sorted by desc above)
    applications.sort((a, b) => {
      const titleA = a.job_opening_id?.title || '';
      const titleB = b.job_opening_id?.title || '';
      if (titleA < titleB) return -1;
      if (titleA > titleB) return 1;
      return 0;
    });

    const headers = [
      'Application ID',
      'Candidate Name',
      'Candidate Email',
      'Job Opening',
      'Department',
      'Source',
      'Current Stage',
      'Days in Stage',
      'Applied At',
      'Last Updated',
    ];

    const rows = applications.map((app) => {
      const diffMs = Date.now() - new Date(app.stage_entered_at).getTime();
      const daysInStage = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      return [
        escapeCsv(app._id.toString()),
        escapeCsv(app.candidate_name),
        escapeCsv(app.candidate_email),
        escapeCsv(app.job_opening_id?.title),
        escapeCsv(app.job_opening_id?.department),
        escapeCsv(app.source),
        escapeCsv(app.stage),
        escapeCsv(daysInStage),
        escapeCsv(app.created_at.toISOString()),
        escapeCsv(app.updated_at.toISOString()),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const today = new Date().toISOString().split('T')[0];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="pipeline-snapshot-${today}.csv"`);
    res.status(200).send(csvContent);
  } catch (err) {
    console.error('Error generating CSV export:', err);
    res.status(500).json({ error: 'Failed to generate pipeline CSV export' });
  }
});

export default router;
