import { JobOpening } from '../models/JobOpening.js';
import { Application } from '../models/Application.js';
import { InterviewPanel } from '../models/InterviewPanel.js';

const PIPELINE_STAGES = [
  'applied',
  'screening',
  'interview',
  'offer',
  'hired',
];

export const getDashboardMetrics = async (req, res) => {
  try {
    const now = new Date();

    // ============================================================
    // 1. HEADLINE NUMBERS
    // ============================================================

    // Currently open job openings only.
    const openPositions = await JobOpening.countDocuments({
      status: 'open',
    });

    // Applications still active in the hiring pipeline.
    const activeApplications = await Application.countDocuments({
      is_rejected: 0,
      stage: { $ne: 'hired' },
    });

    // ------------------------------------------------------------
    // Interviews scheduled THIS CALENDAR WEEK
    // Monday 00:00 -> next Monday 00:00
    // ------------------------------------------------------------

    const startOfWeek = new Date(now);
    const dayOfWeek = startOfWeek.getDay();

    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(startOfWeek.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const interviewsThisWeekResult = await InterviewPanel.aggregate([
      {
        $match: {
          scheduled_at: {
            $gte: startOfWeek,
            $lt: endOfWeek,
          },
        },
      },
      {
        $group: {
          _id: {
            application_id: '$application_id',
            scheduled_at: '$scheduled_at',
          },
        },
      },
      {
        $count: 'unique_interviews',
      },
    ]);

    const interviewsThisWeek =
      interviewsThisWeekResult.length > 0
        ? interviewsThisWeekResult[0].unique_interviews
        : 0;

    // ------------------------------------------------------------
    // Hires THIS CALENDAR MONTH
    // ------------------------------------------------------------

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const hiresThisMonth = await Application.countDocuments({
      stage: 'hired',
      is_rejected: 0,
      stage_entered_at: {
        $gte: startOfMonth,
      },
    });

    // ============================================================
    // 2. BREAKDOWN BY JOB OPENING
    // ============================================================

    const jobs = await JobOpening.find()
      .sort({ created_at: -1 })
      .lean();

    const jobIds = jobs.map((job) => job._id);

    const applications = await Application.find({
      job_opening_id: { $in: jobIds },
    })
      .select('job_opening_id stage is_rejected')
      .lean();

    const appsByJob = applications.reduce((acc, app) => {
      const jobId = app.job_opening_id.toString();

      if (!acc[jobId]) {
        acc[jobId] = [];
      }

      acc[jobId].push(app);

      return acc;
    }, {});

    const jobBreakdown = jobs.map((job) => {
      const jobApplications =
        appsByJob[job._id.toString()] || [];

      const total = jobApplications.length;

      const active = jobApplications.filter(
        (app) =>
          app.is_rejected === 0 &&
          app.stage !== 'hired'
      ).length;

      const hired = jobApplications.filter(
        (app) =>
          app.stage === 'hired' &&
          app.is_rejected === 0
      ).length;

      const rejected = jobApplications.filter(
        (app) => app.is_rejected === 1
      ).length;

      return {
        id: job._id.toString(),
        title: job.title,
        department: job.department,
        status: job.status,
        total_applications: total,
        active_count: active,
        hired_count: hired,
        rejected_count: rejected,
      };
    });

    // ============================================================
    // 3. BREAKDOWN BY STAGE
    // ============================================================

    const stageCounts = {};

    for (const stage of PIPELINE_STAGES) {
      stageCounts[stage] = 0;
    }

    stageCounts.rejected = 0;

    const allApplications = await Application.find()
      .select('stage is_rejected')
      .lean();

    for (const application of allApplications) {
      if (application.is_rejected === 1) {
        stageCounts.rejected += 1;
      } else if (application.stage) {
        stageCounts[application.stage] =
          (stageCounts[application.stage] || 0) + 1;
      }
    }

    // ============================================================
    // 4. APPLICATIONS RECEIVED PER WEEK
    // LAST 12 WEEKS
    // ============================================================

    const weeklyTrends = [];

    const startOfCurrentWeek = new Date(now);
    const currentDay = startOfCurrentWeek.getDay();

    startOfCurrentWeek.setDate(
      startOfCurrentWeek.getDate() - currentDay
    );

    startOfCurrentWeek.setHours(0, 0, 0, 0);

    // Generate the previous 12 completed/current weekly buckets.
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(startOfCurrentWeek);

      weekStart.setDate(
        weekStart.getDate() - i * 7
      );

      const weekEnd = new Date(weekStart);

      weekEnd.setDate(
        weekEnd.getDate() + 7
      );

      const count = await Application.countDocuments({
        created_at: {
          $gte: weekStart,
          $lt: weekEnd,
        },
      });

      const monthName = weekStart.toLocaleDateString(
        'en-US',
        {
          month: 'short',
        }
      );

      const day = weekStart.getDate();

      weeklyTrends.push({
        week_label: `${monthName} ${day}`,
        week_start: weekStart.toISOString(),
        week_end: weekEnd.toISOString(),
        count,
      });
    }

    // ============================================================
    // RESPONSE
    // ============================================================

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

    res.status(500).json({
      error: 'Failed to load dashboard metrics',
    });
  }
};
