import { Router } from 'express';
import { Application } from '../models/Application.js';
import { ApplicationTimeline } from '../models/ApplicationTimeline.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRecruiter } from '../middleware/role.middleware.js';

const router = Router();

const PIPELINE_STAGES = ['applied', 'screening', 'interview', 'offer', 'hired'];

const NEXT_STAGE_MAP = {
  applied: 'screening',
  screening: 'interview',
  interview: 'offer',
  offer: 'hired',
  hired: null,
};

// POST /api/pipeline/:id/advance
router.post('/:id/advance', authenticate, requireRecruiter, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const app = await Application.findById(id);
    if (!app) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    if (app.is_rejected === 1) {
      res.status(400).json({
        error: 'Cannot advance: Candidate is currently rejected. You must reinstate the application before it can progress.',
      });
      return;
    }

    const nextStage = NEXT_STAGE_MAP[app.stage];
    if (!nextStage) {
      res.status(400).json({
        error: 'Cannot advance: Candidate has already reached the final stage (Hired).',
      });
      return;
    }

    const now = new Date();
    const oldStage = app.stage;

    app.stage = nextStage;
    app.stage_entered_at = now;
    await app.save();

    await ApplicationTimeline.create({
      application_id: id,
      actor_id: user.id,
      actor_name: user.name,
      event_type: 'stage_change',
      details: JSON.stringify({
        from_stage: oldStage,
        to_stage: nextStage,
        message: `Stage advanced from "${oldStage}" to "${nextStage}"`,
      }),
      created_at: now,
    });

    res.json(app);
  } catch (err) {
    console.error('Error advancing pipeline stage:', err);
    res.status(500).json({ error: 'Failed to advance application stage' });
  }
});

// POST /api/pipeline/:id/transition
router.post('/:id/transition', authenticate, requireRecruiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { target_stage } = req.body;
    const user = req.user;

    const app = await Application.findById(id);
    if (!app) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    if (app.is_rejected === 1) {
      res.status(400).json({
        error: 'Cannot transition: Candidate is currently rejected. Reinstate the application before moving stages.',
      });
      return;
    }

    if (!PIPELINE_STAGES.includes(target_stage)) {
      res.status(400).json({
        error: `Invalid stage "${target_stage}". Must be one of: ${PIPELINE_STAGES.join(', ')}.`,
      });
      return;
    }

    const expectedNextStage = NEXT_STAGE_MAP[app.stage];

    if (target_stage !== expectedNextStage) {
      res.status(400).json({
        error: `Cannot skip stages: Cannot move directly from "${app.stage}" to "${target_stage}". Pipeline rules require advancing sequentially: Applied → Screening → Interview → Offer → Hired. The next valid stage is "${expectedNextStage || 'None (Already Hired)'}".`,
      });
      return;
    }

    const now = new Date();
    const oldStage = app.stage;

    app.stage = target_stage;
    app.stage_entered_at = now;
    await app.save();

    await ApplicationTimeline.create({
      application_id: id,
      actor_id: user.id,
      actor_name: user.name,
      event_type: 'stage_change',
      details: JSON.stringify({
        from_stage: oldStage,
        to_stage: target_stage,
        message: `Stage moved from "${oldStage}" to "${target_stage}"`,
      }),
      created_at: now,
    });

    res.json(app);
  } catch (err) {
    console.error('Error transitioning pipeline stage:', err);
    res.status(500).json({ error: 'Failed to transition stage' });
  }
});

// POST /api/pipeline/:id/reject
router.post('/:id/reject', authenticate, requireRecruiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = '' } = req.body;
    const user = req.user;

    const app = await Application.findById(id);
    if (!app) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    if (app.is_rejected === 1) {
      res.status(400).json({ error: 'Application is already rejected.' });
      return;
    }

    const now = new Date();
    const oldStage = app.stage;

    app.is_rejected = 1;
    app.stage_before_rejection = oldStage;
    await app.save();

    await ApplicationTimeline.create({
      application_id: id,
      actor_id: user.id,
      actor_name: user.name,
      event_type: 'rejected',
      details: JSON.stringify({
        stage_at_rejection: oldStage,
        reason: reason.trim(),
        message: `Application rejected while in stage "${oldStage}"${reason ? `: ${reason.trim()}` : ''}`,
      }),
      created_at: now,
    });

    res.json(app);
  } catch (err) {
    console.error('Error rejecting application:', err);
    res.status(500).json({ error: 'Failed to reject application' });
  }
});

// POST /api/pipeline/:id/reinstate
router.post('/:id/reinstate', authenticate, requireRecruiter, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const app = await Application.findById(id);
    if (!app) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    if (app.is_rejected === 0) {
      res.status(400).json({ error: 'Application is not rejected. Cannot reinstate an active application.' });
      return;
    }

    const restoredStage = app.stage_before_rejection || app.stage;
    const now = new Date();

    app.is_rejected = 0;
    app.stage = restoredStage;
    app.stage_before_rejection = undefined;
    app.stage_entered_at = now;
    await app.save();

    await ApplicationTimeline.create({
      application_id: id,
      actor_id: user.id,
      actor_name: user.name,
      event_type: 'reinstated',
      details: JSON.stringify({
        restored_to_stage: restoredStage,
        message: `Application reinstated back to stage "${restoredStage}"`,
      }),
      created_at: now,
    });

    res.json(app);
  } catch (err) {
    console.error('Error reinstating application:', err);
    res.status(500).json({ error: 'Failed to reinstate application' });
  }
});

// POST /api/pipeline/bulk-advance
router.post('/bulk-advance', authenticate, requireRecruiter, async (req, res) => {
  try {
    const { application_ids } = req.body;
    const user = req.user;

    if (!Array.isArray(application_ids) || application_ids.length === 0) {
      res.status(400).json({ error: 'application_ids must be a non-empty array' });
      return;
    }

    const results = [];
    const now = new Date();

    for (const id of application_ids) {
      const app = await Application.findById(id);

      if (!app) {
        results.push({
          id,
          candidate_name: 'Unknown',
          success: false,
          message: 'Application not found.',
        });
        continue;
      }

      if (app.is_rejected === 1) {
        results.push({
          id,
          candidate_name: app.candidate_name,
          success: false,
          message: `Refused: Candidate is currently rejected at stage "${app.stage}". Reinstate first.`,
        });
        continue;
      }

      const nextStage = NEXT_STAGE_MAP[app.stage];
      if (!nextStage) {
        results.push({
          id,
          candidate_name: app.candidate_name,
          success: false,
          message: 'Refused: Candidate is already at the final stage (Hired).',
        });
        continue;
      }
      
      const oldStage = app.stage;

      app.stage = nextStage;
      app.stage_entered_at = now;
      await app.save();

      await ApplicationTimeline.create({
        application_id: id,
        actor_id: user.id,
        actor_name: user.name,
        event_type: 'stage_change',
        details: JSON.stringify({
          from_stage: oldStage,
          to_stage: nextStage,
          message: `Bulk advanced from "${oldStage}" to "${nextStage}"`,
        }),
        created_at: now,
      });

      results.push({
        id,
        candidate_name: app.candidate_name,
        success: true,
        message: `Successfully advanced to ${nextStage}`,
        new_stage: nextStage,
      });
    }

    res.json({ results });
  } catch (err) {
    console.error('Error during bulk advance:', err);
    res.status(500).json({ error: 'Failed to complete bulk advance' });
  }
});

// POST /api/pipeline/bulk-reject
router.post('/bulk-reject', authenticate, requireRecruiter, async (req, res) => {
  try {
    const { application_ids, reason = 'Bulk rejection' } = req.body;
    const user = req.user;

    if (!Array.isArray(application_ids) || application_ids.length === 0) {
      res.status(400).json({ error: 'application_ids must be a non-empty array' });
      return;
    }

    const results = [];
    const now = new Date();

    for (const id of application_ids) {
      const app = await Application.findById(id);

      if (!app) {
        results.push({
          id,
          candidate_name: 'Unknown',
          success: false,
          message: 'Application not found.',
        });
        continue;
      }

      if (app.is_rejected === 1) {
        results.push({
          id,
          candidate_name: app.candidate_name,
          success: false,
          message: 'Refused: Application is already rejected.',
        });
        continue;
      }

      const oldStage = app.stage;

      app.is_rejected = 1;
      app.stage_before_rejection = oldStage;
      await app.save();

      await ApplicationTimeline.create({
        application_id: id,
        actor_id: user.id,
        actor_name: user.name,
        event_type: 'rejected',
        details: JSON.stringify({
          stage_at_rejection: oldStage,
          reason: reason.trim(),
          message: `Bulk rejected while in stage "${oldStage}": ${reason.trim()}`,
        }),
        created_at: now,
      });

      results.push({
        id,
        candidate_name: app.candidate_name,
        success: true,
        message: `Successfully marked as rejected at stage ${oldStage}`,
      });
    }

    res.json({ results });
  } catch (err) {
    console.error('Error during bulk reject:', err);
    res.status(500).json({ error: 'Failed to complete bulk reject' });
  }
});

export default router;
