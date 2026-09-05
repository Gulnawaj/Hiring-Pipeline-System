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
  console.log('🌱 Starting MongoDB database seed...');

  await connectDB();

  console.log('Clearing existing records...');
  await StalledAlertDismissal.deleteMany({});
  await ApplicationTimeline.deleteMany({});
  await InterviewPanel.deleteMany({});
  await Application.deleteMany({});
  await JobOpening.deleteMany({});
  await User.deleteMany({});

  console.log(' Seeding users...');
  const passwordHash = bcrypt.hashSync('Password123!', 10);

  const recruiter = await User.create({
    email: 'recruiter@example.com',
    password_hash: passwordHash,
    name: 'Rachel Adams',
    role: 'recruiter',
  });

  const interviewer1 = await User.create({
    email: 'interviewer1@example.com',
    password_hash: passwordHash,
    name: 'Sarah Chen',
    role: 'interviewer',
  });

  const interviewer2 = await User.create({
    email: 'interviewer2@example.com',
    password_hash: passwordHash,
    name: 'Alex Rivera',
    role: 'interviewer',
  });

  const interviewer3 = await User.create({
    email: 'interviewer3@example.com',
    password_hash: passwordHash,
    name: 'Marcus Vance',
    role: 'interviewer',
  });

  console.log('Seeding job openings...');
  const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const jobEng = await JobOpening.create({
    title: 'Senior Full-Stack Engineer',
    department: 'Engineering',
    description: 'Build reliable web services and user experiences across our core platform products.',
    status: 'open',
    created_at: daysAgo(21),
    updated_at: daysAgo(21),
  });

  const jobInfra = await JobOpening.create({
    title: 'Staff Infrastructure Engineer',
    department: 'DevOps',
    description: 'Own cloud reliability, CI/CD pipelines, and multi-region deployment automation.',
    status: 'open',
    created_at: daysAgo(14),
    updated_at: daysAgo(14),
  });

  const jobSales = await JobOpening.create({
    title: 'Enterprise Account Executive',
    department: 'Sales',
    description: 'Drive revenue growth with enterprise accounts and lead deal cycles from discovery to closing.',
    status: 'open',
    created_at: daysAgo(21),
    updated_at: daysAgo(21),
  });

  const jobDesign = await JobOpening.create({
    title: 'Senior Product Designer',
    department: 'Design',
    description: 'Design modern, accessible workflows and systems for complex data-intensive applications.',
    status: 'open',
    created_at: daysAgo(14),
    updated_at: daysAgo(14),
  });

  await JobOpening.create({
    title: 'Customer Support Lead',
    department: 'Support',
    description: 'Lead customer success operations, streamline onboarding, and resolve escalated tickets.',
    status: 'closed',
    created_at: daysAgo(21),
    updated_at: daysAgo(14),
  });

  await JobOpening.create({
    title: 'Marketing Growth Specialist (Legacy)',
    department: 'Marketing',
    description: 'Archived role preserved for historical reporting and compliance.',
    status: 'archived',
    created_at: daysAgo(21),
    updated_at: daysAgo(7),
  });

  console.log('Seeding applications and pipeline progression...');

  // 1. Candidate Maya Lin - Applied stage
  const appMaya = await Application.create({
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

  await ApplicationTimeline.create({
    application_id: appMaya._id,
    actor_id: recruiter._id,
    actor_name: recruiter.name,
    event_type: 'created',
    details: JSON.stringify({ message: 'Application submitted via LinkedIn', source: 'LinkedIn' }),
    created_at: daysAgo(3),
  });

  // 2. Candidate David Kim - Screening stage (STALLED)
  const appDavid = await Application.create({
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

  await ApplicationTimeline.insertMany([
    {
      application_id: appDavid._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'created',
      details: JSON.stringify({ message: 'Application created via Referral' }),
      created_at: daysAgo(18),
    },
    {
      application_id: appDavid._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'stage_change',
      details: JSON.stringify({ from_stage: 'applied', to_stage: 'screening', message: 'Passed initial resume review' }),
      created_at: daysAgo(14),
    }
  ]);

  // 3. Candidate Sophia Wang - Interview stage
  const appSophia = await Application.create({
    job_opening_id: jobEng._id,
    candidate_name: 'Sophia Wang',
    candidate_email: 'sophia.wang@example.com',
    source: 'Job Board',
    notes: 'Excellent open source contributions; scheduled for technical loop.',
    stage: 'interview',
    is_rejected: 0,
    stage_entered_at: daysAgo(4),
    created_at: daysAgo(12),
    updated_at: daysAgo(2),
  });

  await InterviewPanel.insertMany([
    { application_id: appSophia._id, interviewer_id: interviewer1._id, assigned_at: daysAgo(4) },
    { application_id: appSophia._id, interviewer_id: interviewer2._id, assigned_at: daysAgo(4) }
  ]);

  await ApplicationTimeline.insertMany([
    {
      application_id: appSophia._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'created',
      details: JSON.stringify({ message: 'Application submitted via Job Board' }),
      created_at: daysAgo(12),
    },
    {
      application_id: appSophia._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'stage_change',
      details: JSON.stringify({ from_stage: 'applied', to_stage: 'screening' }),
      created_at: daysAgo(9),
    },
    {
      application_id: appSophia._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'stage_change',
      details: JSON.stringify({ from_stage: 'screening', to_stage: 'interview' }),
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
        comments: 'Phenomenal system design interview. Walked through caching, horizontal sharding, and edge failure recovery effortlessly.',
      }),
      created_at: daysAgo(2),
    }
  ]);

  // 4. Candidate Liam Johnson - Interview stage (STALLED)
  const appLiam = await Application.create({
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

  await InterviewPanel.create({ application_id: appLiam._id, interviewer_id: interviewer2._id, assigned_at: daysAgo(12) });

  await ApplicationTimeline.insertMany([
    {
      application_id: appLiam._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'created',
      details: JSON.stringify({ message: 'Application received' }),
      created_at: daysAgo(25),
    },
    {
      application_id: appLiam._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'stage_change',
      details: JSON.stringify({ from_stage: 'applied', to_stage: 'screening' }),
      created_at: daysAgo(20),
    },
    {
      application_id: appLiam._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'stage_change',
      details: JSON.stringify({ from_stage: 'screening', to_stage: 'interview' }),
      created_at: daysAgo(12),
    }
  ]);

  // 5. Candidate Elena Rostova - Offer stage
  const appElena = await Application.create({
    job_opening_id: jobDesign._id,
    candidate_name: 'Elena Rostova',
    candidate_email: 'elena.rostova@example.com',
    source: 'Agency',
    notes: 'Portfolio review scored 10/10. Formal offer letter prepared.',
    stage: 'offer',
    is_rejected: 0,
    stage_entered_at: daysAgo(2),
    created_at: daysAgo(20),
    updated_at: daysAgo(2),
  });

  await InterviewPanel.create({ application_id: appElena._id, interviewer_id: interviewer3._id, assigned_at: daysAgo(9) });

  await ApplicationTimeline.insertMany([
    {
      application_id: appElena._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'created',
      details: JSON.stringify({ message: 'Application created from Agency referral' }),
      created_at: daysAgo(20),
    },
    {
      application_id: appElena._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'stage_change',
      details: JSON.stringify({ from_stage: 'applied', to_stage: 'screening' }),
      created_at: daysAgo(16),
    },
    {
      application_id: appElena._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'stage_change',
      details: JSON.stringify({ from_stage: 'screening', to_stage: 'interview' }),
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
        comments: 'World-class design sensibility and thorough design system expertise.',
      }),
      created_at: daysAgo(5),
    },
    {
      application_id: appElena._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'stage_change',
      details: JSON.stringify({ from_stage: 'interview', to_stage: 'offer' }),
      created_at: daysAgo(2),
    }
  ]);

  // 6. Candidate Zachary Taylor - Hired stage
  const appZach = await Application.create({
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

  await ApplicationTimeline.insertMany([
    {
      application_id: appZach._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'created',
      details: JSON.stringify({ message: 'Application submitted' }),
      created_at: daysAgo(30),
    },
    {
      application_id: appZach._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'stage_change',
      details: JSON.stringify({ from_stage: 'applied', to_stage: 'screening' }),
      created_at: daysAgo(22),
    },
    {
      application_id: appZach._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'stage_change',
      details: JSON.stringify({ from_stage: 'screening', to_stage: 'interview' }),
      created_at: daysAgo(15),
    },
    {
      application_id: appZach._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'stage_change',
      details: JSON.stringify({ from_stage: 'interview', to_stage: 'offer' }),
      created_at: daysAgo(8),
    },
    {
      application_id: appZach._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'stage_change',
      details: JSON.stringify({ from_stage: 'offer', to_stage: 'hired', message: 'Offer accepted!' }),
      created_at: daysAgo(5),
    }
  ]);

  // 7. Candidate Lucas Scott - Rejected stage
  const appLucas = await Application.create({
    job_opening_id: jobEng._id,
    candidate_name: 'Lucas Scott',
    candidate_email: 'lucas.scott@example.com',
    source: 'Job Board',
    notes: 'Interview loop completed. Currently rejected but eligible for reinstatement.',
    stage: 'interview',
    is_rejected: 1,
    stage_before_rejection: 'interview',
    stage_entered_at: daysAgo(6),
    created_at: daysAgo(22),
    updated_at: daysAgo(6),
  });

  await InterviewPanel.create({ application_id: appLucas._id, interviewer_id: interviewer1._id, assigned_at: daysAgo(10) });

  await ApplicationTimeline.insertMany([
    {
      application_id: appLucas._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'created',
      details: JSON.stringify({ message: 'Applied online' }),
      created_at: daysAgo(22),
    },
    {
      application_id: appLucas._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'stage_change',
      details: JSON.stringify({ from_stage: 'applied', to_stage: 'screening' }),
      created_at: daysAgo(17),
    },
    {
      application_id: appLucas._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'stage_change',
      details: JSON.stringify({ from_stage: 'screening', to_stage: 'interview' }),
      created_at: daysAgo(10),
    },
    {
      application_id: appLucas._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'rejected',
      details: JSON.stringify({
        stage_at_rejection: 'interview',
        reason: 'Role filled by higher seniority candidate; candidate agreed to stay in touch.',
      }),
      created_at: daysAgo(6),
    }
  ]);

  // 8. Candidate Priya Patel - In screening, dismissed alert
  const appPriya = await Application.create({
    job_opening_id: jobSales._id,
    candidate_name: 'Priya Patel',
    candidate_email: 'priya.patel@example.com',
    source: 'Referral',
    notes: 'Alert was previously dismissed by recruiter for screening stage.',
    stage: 'screening',
    is_rejected: 0,
    stage_entered_at: daysAgo(15),
    created_at: daysAgo(20),
    updated_at: daysAgo(15),
  });

  await ApplicationTimeline.insertMany([
    {
      application_id: appPriya._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'created',
      details: JSON.stringify({ message: 'Referral submitted' }),
      created_at: daysAgo(20),
    },
    {
      application_id: appPriya._id,
      actor_id: recruiter._id,
      actor_name: recruiter.name,
      event_type: 'stage_change',
      details: JSON.stringify({ from_stage: 'applied', to_stage: 'screening' }),
      created_at: daysAgo(15),
    }
  ]);

  await StalledAlertDismissal.create({
    application_id: appPriya._id,
    user_id: recruiter._id,
    dismissed_stage: 'screening',
    dismissed_at: daysAgo(2),
  });

  console.log('✅ MongoDB seeding complete!');
  console.log('Demo Credentials:');
  console.log('  Recruiter:   recruiter@example.com / Password123!');
  console.log('  Interviewer: interviewer1@example.com / Password123! (Sarah Chen)');
  console.log('  Interviewer: interviewer2@example.com / Password123! (Alex Rivera)');
  console.log('  Interviewer: interviewer3@example.com / Password123! (Marcus Vance)');
}

if (process.argv[1].endsWith('seed.js')) {
  runSeed().then(() => mongoose.connection.close()).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
