import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './database.js';
import { User } from '../models/User.js';
import { JobOpening } from '../models/JobOpening.js';
import { Application } from '../models/Application.js';
import { InterviewPanel } from '../models/InterviewPanel.js';
import { ApplicationTimeline } from '../models/ApplicationTimeline.js';
import { StalledAlertDismissal } from '../models/StalledAlertDismissal.js';

dotenv.config();

export async function runSeed() {
  console.log('🌱 Starting safe/idempotent MongoDB database seed...');

  await connectDB();

  const daysAgo = (days) =>
    new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  /*
   * IMPORTANT:
   * This seed is intentionally NON-DESTRUCTIVE.
   *
   * It NEVER calls deleteMany() and NEVER clears existing:
   * - Users
   * - Job openings
   * - Applications
   * - Interview panels
   * - Application timelines
   * - Stalled-alert dismissals
   *
   * Existing records are preserved, including their history,
   * timestamps, updates, assignments, and manually-created data.
   */

  async function ensureUser({
    currentEmail,
    legacyEmails = [],
    name,
    role,
  }) {
    let user = await User.findOne({ email: currentEmail });

    if (user) {
      /*
       * Do not touch an existing user's password.
       * We only ensure the requested demo identity is correct.
       */
      if (user.name !== name || user.role !== role) {
        user.name = name;
        user.role = role;
        await user.save();
      }

      return user;
    }

    /*
     * Support migration from old demo email addresses to
     * the current demo email addresses.
     *
     * password_hash remains unchanged.
     */
    for (const legacyEmail of legacyEmails) {
      user = await User.findOne({ email: legacyEmail });

      if (user) {
        const conflictingUser = await User.findOne({
          email: currentEmail,
          _id: { $ne: user._id },
        });

        if (conflictingUser) {
          throw new Error(
            `Cannot migrate ${legacyEmail} to ${currentEmail}: the new email is already used by another user.`
          );
        }

        user.email = currentEmail;
        user.name = name;
        user.role = role;

        await user.save();

        return user;
      }
    }

    /*
     * Create the demo user only when it does not exist.
     */
    const passwordHash = bcrypt.hashSync('Password123!', 10);

    return User.create({
      email: currentEmail,
      password_hash: passwordHash,
      name,
      role,
    });
  }

  async function ensureJob(jobData) {
    /*
     * Stable identity for demo jobs = title.
     *
     * If a job already exists, DO NOT modify it.
     */
    const existing = await JobOpening.findOne({
      title: jobData.title,
    });

    if (existing) {
      return existing;
    }

    return JobOpening.create({
      ...jobData,
    });
  }

  async function ensureApplication(applicationData) {
    /*
     * Stable identity for seeded applications = candidate email.
     *
     * If the application already exists, DO NOT modify it.
     * This preserves manually-created data and history.
     */
    const existing = await Application.findOne({
      candidate_email: applicationData.candidate_email,
    });

    if (existing) {
      return existing;
    }

    return Application.create({
      ...applicationData,
    });
  }

  async function ensureInterviewPanel(panelData) {
    const existing = await InterviewPanel.findOne({
      application_id: panelData.application_id,
      interviewer_id: panelData.interviewer_id,
    });

    if (existing) {
      return existing;
    }

    return InterviewPanel.create(panelData);
  }

  async function ensureTimelineEvent(eventData) {
    /*
     * Timeline records are immutable.
     *
     * Compare the relevant fields so repeated seed runs do not create
     * duplicate audit events.
     */
    const existing = await ApplicationTimeline.findOne({
      application_id: eventData.application_id,
      actor_id: eventData.actor_id,
      event_type: eventData.event_type,
      details: eventData.details,
    });

    if (existing) {
      return existing;
    }

    return ApplicationTimeline.create(eventData);
  }

  async function ensureTimelineEvents(events) {
    for (const event of events) {
      await ensureTimelineEvent(event);
    }
  }

  async function ensureDismissal(dismissalData) {
    const existing = await StalledAlertDismissal.findOne({
      application_id: dismissalData.application_id,
      user_id: dismissalData.user_id,
      dismissed_stage: dismissalData.dismissed_stage,
    });

    if (existing) {
      return existing;
    }

    return StalledAlertDismissal.create(dismissalData);
  }

  console.log('Ensuring demo users...');

  const recruiter = await ensureUser({
    currentEmail: 'sarah@gmail.com',
    legacyEmails: ['recruiter@example.com'],
    name: 'Sarah',
    role: 'recruiter',
  });

  const interviewer1 = await ensureUser({
    currentEmail: 'vikas@gmail.com',
    legacyEmails: ['interviewer1@example.com'],
    name: 'Vikas Kumar',
    role: 'interviewer',
  });

  const interviewer2 = await ensureUser({
    currentEmail: 'rohan@gmail.com',
    legacyEmails: ['interviewer2@example.com'],
    name: 'Rohan Singh',
    role: 'interviewer',
  });

  const interviewer3 = await ensureUser({
    currentEmail: 'gulnawaj@gmail.com',
    legacyEmails: [
      'interviewer3@example.com',
      'gulnawaj@123',
    ],
    name: 'Gulnawaj',
    role: 'interviewer',
  });

  console.log('Ensuring demo job openings...');

  const jobEng = await ensureJob({
    title: 'Senior Full-Stack Engineer',
    department: 'Engineering',
    description:
      'Build reliable web services and user experiences across our core platform products.',
    status: 'open',
    created_at: daysAgo(21),
    updated_at: daysAgo(21),
  });

  const jobInfra = await ensureJob({
    title: 'Staff Infrastructure Engineer',
    department: 'DevOps',
    description:
      'Own cloud reliability, CI/CD pipelines, and multi-region deployment automation.',
    status: 'open',
    created_at: daysAgo(14),
    updated_at: daysAgo(14),
  });

  const jobSales = await ensureJob({
    title: 'Enterprise Account Executive',
    department: 'Sales',
    description:
      'Drive revenue growth with enterprise accounts and lead deal cycles from discovery to closing.',
    status: 'open',
    created_at: daysAgo(21),
    updated_at: daysAgo(21),
  });

  const jobDesign = await ensureJob({
    title: 'Senior Product Designer',
    department: 'Design',
    description:
      'Design modern, accessible workflows and systems for complex data-intensive applications.',
    status: 'open',
    created_at: daysAgo(14),
    updated_at: daysAgo(14),
  });

  const jobSupport = await ensureJob({
    title: 'Customer Support Lead',
    department: 'Support',
    description:
      'Lead customer success operations, streamline onboarding, and resolve escalated tickets.',
    status: 'closed',
    created_at: daysAgo(21),
    updated_at: daysAgo(14),
  });

  const jobLegacy = await ensureJob({
    title: 'Marketing Growth Specialist (Legacy)',
    department: 'Marketing',
    description:
      'Archived role preserved for historical reporting and compliance.',
    status: 'archived',
    created_at: daysAgo(21),
    updated_at: daysAgo(7),
  });

  console.log('Ensuring demo applications and pipeline history...');

  // =========================================================
  // 1. Candidate Maya Lin - Applied stage
  // =========================================================

  const appMaya = await ensureApplication({
    job_opening_id: jobEng._id,
    candidate_name: 'Maya Lin',
    candidate_email: 'maya.lin@example.com',
    source: 'LinkedIn',
    notes: 'Strong background in distributed systems and React.',
    stage: 'applied',
    is_rejected: 0,
    stage_entered_at: daysAgo(3),
    created_at: daysAgo(3),
    updated_at: daysAgo(3),
  });

  await ensureTimelineEvent({
    application_id: appMaya._id,
    actor_id: recruiter._id,
    actor_name: recruiter.name,
    event_type: 'created',
    details: JSON.stringify({
      message: 'Application submitted via LinkedIn',
      source: 'LinkedIn',
    }),
    created_at: daysAgo(3),
  });

  // =========================================================
  // 2. Candidate David Kim - Screening stage (STALLED)
  // =========================================================

  const appDavid = await ensureApplication({
    job_opening_id: jobEng._id,
    candidate_name: 'David Kim',
    candidate_email: 'david.kim@example.com',
    source: 'Referral',
    notes: 'Referred by engineering lead. Sat in screening past 10 days.',
    stage: 'screening',
    is_rejected: 0,
    stage_entered_at: daysAgo(14),
    created_at: daysAgo(18),
    updated_at: daysAgo(14),
  });

  await ensureTimelineEvents([
    {
      application_id: appDavid._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'created',
      details: JSON.stringify({
        message: 'Application created via Referral',
      }),
      created_at: daysAgo(18),
    },
    {
      application_id: appDavid._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'stage_change',
      details: JSON.stringify({
        from_stage: 'applied',
        to_stage: 'screening',
        message: 'Passed initial resume review',
      }),
      created_at: daysAgo(14),
    },
  ]);

  // =========================================================
  // 3. Candidate Sophia Wang - Interview stage
  // =========================================================

  const appSophia = await ensureApplication({
    job_opening_id: jobEng._id,
    candidate_name: 'Sophia Wang',
    candidate_email: 'sophia.wang@example.com',
    source: 'Job Board',
    notes:
      'Excellent open source contributions; scheduled for technical loop.',
    stage: 'interview',
    is_rejected: 0,
    stage_entered_at: daysAgo(4),
    created_at: daysAgo(12),
    updated_at: daysAgo(2),
  });

  await ensureInterviewPanel({
    application_id: appSophia._id,
    interviewer_id: interviewer1._id,
    assigned_at: daysAgo(4),
  });

  await ensureInterviewPanel({
    application_id: appSophia._id,
    interviewer_id: interviewer2._id,
    assigned_at: daysAgo(4),
  });

  await ensureTimelineEvents([
    {
      application_id: appSophia._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'created',
      details: JSON.stringify({
        message: 'Application submitted via Job Board',
      }),
      created_at: daysAgo(12),
    },
    {
      application_id: appSophia._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'stage_change',
      details: JSON.stringify({
        from_stage: 'applied',
        to_stage: 'screening',
      }),
      created_at: daysAgo(9),
    },
    {
      application_id: appSophia._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'stage_change',
      details: JSON.stringify({
        from_stage: 'screening',
        to_stage: 'interview',
      }),
      created_at: daysAgo(4),
    },
    {
      application_id: appSophia._id,
      actor_id: interviewer1._id,
      actor_name: interviewer1.name,
      event_type: 'feedback',
      details: JSON.stringify({
        rating: 5,
        recommendation: 'strong_hire',
        comments:
          'Phenomenal system design interview. Walked through caching, horizontal sharding, and edge failure recovery effortlessly.',
      }),
      created_at: daysAgo(2),
    },
  ]);

  // =========================================================
  // 4. Candidate Liam Johnson - Interview stage (STALLED)
  // =========================================================

  const appLiam = await ensureApplication({
    job_opening_id: jobInfra._id,
    candidate_name: 'Liam Johnson',
    candidate_email: 'liam.johnson@example.com',
    source: 'Direct',
    notes: 'Kubernetes specialist. Waiting on second panel round.',
    stage: 'interview',
    is_rejected: 0,
    stage_entered_at: daysAgo(12),
    created_at: daysAgo(25),
    updated_at: daysAgo(12),
  });

  await ensureInterviewPanel({
    application_id: appLiam._id,
    interviewer_id: interviewer2._id,
    assigned_at: daysAgo(12),
  });

  await ensureTimelineEvents([
    {
      application_id: appLiam._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'created',
      details: JSON.stringify({
        message: 'Application received',
      }),
      created_at: daysAgo(25),
    },
    {
      application_id: appLiam._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'stage_change',
      details: JSON.stringify({
        from_stage: 'applied',
        to_stage: 'screening',
      }),
      created_at: daysAgo(20),
    },
    {
      application_id: appLiam._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'stage_change',
      details: JSON.stringify({
        from_stage: 'screening',
        to_stage: 'interview',
      }),
      created_at: daysAgo(12),
    },
  ]);

  // =========================================================
  // 5. Candidate Elena Rostova - Offer stage
  // =========================================================

  const appElena = await ensureApplication({
    job_opening_id: jobDesign._id,
    candidate_name: 'Elena Rostova',
    candidate_email: 'elena.rostova@example.com',
    source: 'Agency',
    notes:
      'Portfolio review scored 10/10. Formal offer letter prepared.',
    stage: 'offer',
    is_rejected: 0,
    stage_entered_at: daysAgo(2),
    created_at: daysAgo(20),
    updated_at: daysAgo(2),
  });

  await ensureInterviewPanel({
    application_id: appElena._id,
    interviewer_id: interviewer3._id,
    assigned_at: daysAgo(9),
  });

  await ensureTimelineEvents([
    {
      application_id: appElena._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'created',
      details: JSON.stringify({
        message: 'Application created from Agency referral',
      }),
      created_at: daysAgo(20),
    },
    {
      application_id: appElena._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'stage_change',
      details: JSON.stringify({
        from_stage: 'applied',
        to_stage: 'screening',
      }),
      created_at: daysAgo(16),
    },
    {
      application_id: appElena._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'stage_change',
      details: JSON.stringify({
        from_stage: 'screening',
        to_stage: 'interview',
      }),
      created_at: daysAgo(9),
    },
    {
      application_id: appElena._id,
      actor_id: interviewer3._id,
      actor_name: interviewer3.name,
      event_type: 'feedback',
      details: JSON.stringify({
        rating: 5,
        recommendation: 'strong_hire',
        comments:
          'World-class design sensibility and thorough design system expertise.',
      }),
      created_at: daysAgo(5),
    },
    {
      application_id: appElena._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'stage_change',
      details: JSON.stringify({
        from_stage: 'interview',
        to_stage: 'offer',
      }),
      created_at: daysAgo(2),
    },
  ]);

  // =========================================================
  // 6. Candidate Zachary Taylor - Hired stage
  // =========================================================

  const appZach = await ensureApplication({
    job_opening_id: jobSales._id,
    candidate_name: 'Zachary Taylor',
    candidate_email: 'zachary.taylor@example.com',
    source: 'LinkedIn',
    notes: 'Accepted offer with start date next Monday.',
    stage: 'hired',
    is_rejected: 0,
    stage_entered_at: daysAgo(5),
    created_at: daysAgo(30),
    updated_at: daysAgo(5),
  });

  await ensureTimelineEvents([
    {
      application_id: appZach._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'created',
      details: JSON.stringify({
        message: 'Application submitted',
      }),
      created_at: daysAgo(30),
    },
    {
      application_id: appZach._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'stage_change',
      details: JSON.stringify({
        from_stage: 'applied',
        to_stage: 'screening',
      }),
      created_at: daysAgo(22),
    },
    {
      application_id: appZach._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'stage_change',
      details: JSON.stringify({
        from_stage: 'screening',
        to_stage: 'interview',
      }),
      created_at: daysAgo(15),
    },
    {
      application_id: appZach._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'stage_change',
      details: JSON.stringify({
        from_stage: 'interview',
        to_stage: 'offer',
      }),
      created_at: daysAgo(8),
    },
    {
      application_id: appZach._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'stage_change',
      details: JSON.stringify({
        from_stage: 'offer',
        to_stage: 'hired',
        message: 'Offer accepted!',
      }),
      created_at: daysAgo(5),
    },
  ]);

  // =========================================================
  // 7. Candidate Lucas Scott - Rejected
  // =========================================================

  const appLucas = await ensureApplication({
    job_opening_id: jobEng._id,
    candidate_name: 'Lucas Scott',
    candidate_email: 'lucas.scott@example.com',
    source: 'Job Board',
    notes:
      'Interview loop completed. Currently rejected but eligible for reinstatement.',
    stage: 'interview',
    is_rejected: 1,
    stage_before_rejection: 'interview',
    stage_entered_at: daysAgo(6),
    created_at: daysAgo(22),
    updated_at: daysAgo(6),
  });

  await ensureInterviewPanel({
    application_id: appLucas._id,
    interviewer_id: interviewer1._id,
    assigned_at: daysAgo(10),
  });

  await ensureTimelineEvents([
    {
      application_id: appLucas._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'created',
      details: JSON.stringify({
        message: 'Applied online',
      }),
      created_at: daysAgo(22),
    },
    {
      application_id: appLucas._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'stage_change',
      details: JSON.stringify({
        from_stage: 'applied',
        to_stage: 'screening',
      }),
      created_at: daysAgo(17),
    },
    {
      application_id: appLucas._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'stage_change',
      details: JSON.stringify({
        from_stage: 'screening',
        to_stage: 'interview',
      }),
      created_at: daysAgo(10),
    },
    {
      application_id: appLucas._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'rejected',
      details: JSON.stringify({
        stage_at_rejection: 'interview',
        reason:
          'Role filled by higher seniority candidate; candidate agreed to stay in touch.',
      }),
      created_at: daysAgo(6),
    },
  ]);

  // =========================================================
  // 8. Candidate Priya Patel - Screening + dismissed alert
  // =========================================================

  const appPriya = await ensureApplication({
    job_opening_id: jobSales._id,
    candidate_name: 'Priya Patel',
    candidate_email: 'priya.patel@example.com',
    source: 'Referral',
    notes:
      'Alert was previously dismissed by recruiter for screening stage.',
    stage: 'screening',
    is_rejected: 0,
    stage_entered_at: daysAgo(15),
    created_at: daysAgo(20),
    updated_at: daysAgo(15),
  });

  await ensureTimelineEvents([
    {
      application_id: appPriya._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'created',
      details: JSON.stringify({
        message: 'Referral submitted',
      }),
      created_at: daysAgo(20),
    },
    {
      application_id: appPriya._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'stage_change',
      details: JSON.stringify({
        from_stage: 'applied',
        to_stage: 'screening',
      }),
      created_at: daysAgo(15),
    },
  ]);

  await ensureDismissal({
    application_id: appPriya._id,
    user_id: recruiter._id,
    dismissed_stage: 'screening',
    dismissed_at: daysAgo(2),
  });

  console.log('✅ Safe/idempotent MongoDB seed complete!');
  console.log('Demo Credentials:');
  console.log(
    '  Recruiter:   sarah@gmail.com / Password123! (Sarah)'
  );
  console.log(
    '  Interviewer: vikas@gmail.com / Password123! (Vikas Kumar)'
  );
  console.log(
    '  Interviewer: rohan@gmail.com / Password123! (Rohan Singh)'
  );
  console.log(
    '  Interviewer: gulnawaj@gmail.com / Password123! (Gulnawaj)'
  );
}

if (
  process.argv[1] &&
  process.argv[1].endsWith('seed.js')
) {
  runSeed()
    .then(() => mongoose.connection.close())
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}