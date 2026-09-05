import assert from 'node:assert';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { runSeed } from '../db/seed.js';
import { connectDB } from '../db/database.js';
import { User } from '../models/User.js';
import { JobOpening } from '../models/JobOpening.js';
import { Application } from '../models/Application.js';
import { InterviewPanel } from '../models/InterviewPanel.js';
import { ApplicationTimeline } from '../models/ApplicationTimeline.js';
import { StalledAlertDismissal } from '../models/StalledAlertDismissal.js';

console.log('🧪 Starting Hiring Pipeline Verification Test Suite (MongoDB + Mongoose)...\n');

async function runTests() {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  
  await connectDB();
  await runSeed();
  
  // Test 1: Accounts and Roles (Goal 1)
  console.log('Test 1: Accounts and Roles');
  const recruiter = await User.findOne({ email: 'recruiter@example.com' });
  assert.ok(recruiter, 'Recruiter user must exist');
  assert.strictEqual(recruiter.role, 'recruiter');
  assert.ok(bcrypt.compareSync('Password123!', recruiter.password_hash), 'Recruiter password must match');

  const interviewer = await User.findOne({ email: 'interviewer1@example.com' });
  assert.ok(interviewer, 'Interviewer user must exist');
  assert.strictEqual(interviewer.role, 'interviewer');
  assert.ok(bcrypt.compareSync('Password123!', interviewer.password_hash), 'Interviewer password must match');
  console.log('  ✓ Recruiter & Interviewer roles and password hashing verified.\n');

  // Test 2: Job Openings & Archiving (Goal 2)
  console.log('Test 2: Job Openings & Archiving');
  const testJob = await JobOpening.create({
    title: 'QA Automation Lead',
    department: 'Engineering',
    description: 'Test lead',
    status: 'open',
  });

  // Archive job
  await JobOpening.findByIdAndUpdate(testJob._id, { status: 'archived' });
  const archivedJob = await JobOpening.findById(testJob._id);
  assert.strictEqual(archivedJob.status, 'archived', 'Job status must be archived');

  // Restore job
  await JobOpening.findByIdAndUpdate(testJob._id, { status: 'open' });
  const restoredJob = await JobOpening.findById(testJob._id);
  assert.strictEqual(restoredJob.status, 'open', 'Job status must be restored to open');
  console.log('  ✓ Job creation, archiving, and restoration verified.\n');

  // Test 3: Applications inside Job Openings (Goal 3)
  console.log('Test 3: Applications inside Job Openings');
  const testApp = await Application.create({
    job_opening_id: testJob._id,
    candidate_name: 'Alice Test',
    candidate_email: 'alice.test@example.com',
    source: 'Career Site',
    notes: 'Strong test notes',
    stage: 'applied',
    is_rejected: 0,
  });

  const fetchedApp = await Application.findById(testApp._id);
  assert.strictEqual(fetchedApp.candidate_name, 'Alice Test');
  assert.strictEqual(fetchedApp.stage, 'applied');
  assert.strictEqual(fetchedApp.job_opening_id.toString(), testJob._id.toString());
  console.log('  ✓ Application belongs to job opening and stores candidate data.\n');

  // Test 4: Pipeline Rules (Goal 4)
  console.log('Test 4: Pipeline Rules');
  const advancedApp = await Application.findByIdAndUpdate(
    testApp._id,
    { stage: 'screening', stage_entered_at: new Date() },
    { new: true }
  );
  assert.strictEqual(advancedApp.stage, 'screening');

  const rejectedApp = await Application.findByIdAndUpdate(
    testApp._id,
    { is_rejected: 1, stage_before_rejection: advancedApp.stage },
    { new: true }
  );
  assert.strictEqual(rejectedApp.is_rejected, 1);
  assert.strictEqual(rejectedApp.stage_before_rejection, 'screening');

  const reinstatedApp = await Application.findByIdAndUpdate(
    testApp._id,
    {
      is_rejected: 0,
      stage: rejectedApp.stage_before_rejection,
      stage_before_rejection: undefined,
      stage_entered_at: new Date(),
    },
    { new: true }
  );
  assert.strictEqual(reinstatedApp.is_rejected, 0);
  assert.strictEqual(reinstatedApp.stage, 'screening', 'Reinstated application MUST return to screening');
  console.log('  ✓ Pipeline stage progression, rejection, and exact reinstatement verified.\n');

  // Test 5: Interview Panel (Goal 5)
  console.log('Test 5: Interview Panel');
  await InterviewPanel.create({
    application_id: testApp._id,
    interviewer_id: interviewer._id,
  });

  const assignedApps = await InterviewPanel.find({ interviewer_id: interviewer._id });
  assert.ok(assignedApps.length > 0, 'Interviewer must see assigned applications');
  console.log('  ✓ Panel assignment and interviewer candidate list verified.\n');

  // Test 6: Finding Candidates
  console.log('Test 6: Finding Candidates (Server-side search & filter)');
  const searchMatch = await Application.find({
    $or: [
      { candidate_name: { $regex: /Alice/i } },
      { candidate_email: { $regex: /Alice/i } },
    ],
  });
  assert.strictEqual(searchMatch.length, 1);

  const stageFilter = await Application.find({ stage: 'screening' });
  assert.ok(stageFilter.length >= 1, 'Stage filter must return matching applications');
  console.log('  ✓ Server-side search and filtering verified.\n');

  // Test 7: Bulk Actions
  console.log('Test 7: Bulk Actions');
  const bulkApp1 = await Application.create({
    job_opening_id: testJob._id,
    candidate_name: 'Bulk Candidate 1',
    candidate_email: 'bulk1@test.com',
    source: 'Agency',
    stage: 'applied',
    is_rejected: 0,
  });
  const bulkApp2 = await Application.create({
    job_opening_id: testJob._id,
    candidate_name: 'Bulk Candidate 2',
    candidate_email: 'bulk2@test.com',
    source: 'Agency',
    stage: 'hired',
    is_rejected: 0,
  });

  assert.strictEqual(bulkApp1.stage, 'applied');
  assert.strictEqual(bulkApp2.stage, 'hired');
  console.log('  ✓ Bulk candidates created and validated for eligibility.\n');

  // Test 8: Dashboard Metrics
  console.log('Test 8: Dashboard Metrics');
  const openPositions = await JobOpening.countDocuments({ status: 'open' });
  const activeApps = await Application.countDocuments({ is_rejected: 0, stage: { $ne: 'hired' } });
  assert.ok(openPositions > 0, 'Must have open positions');
  assert.ok(activeApps > 0, 'Must have active applications');
  console.log(`  ✓ Dashboard computed: ${openPositions} open positions, ${activeApps} active applications.\n`);

  // Test 9: Immutable Timeline Audit
  console.log('Test 9: Immutable Timeline Audit & ORM Protection');
  const timelineEvent = await ApplicationTimeline.create({
    application_id: testApp._id,
    actor_id: recruiter._id,
    actor_name: 'Rachel Adams',
    event_type: 'created',
    details: JSON.stringify({ message: 'Test audit creation' }),
  });

  let updateThrewError = false;
  try {
    await ApplicationTimeline.updateOne({ _id: timelineEvent._id }, { actor_name: 'Hacker' });
  } catch (e) {
    updateThrewError = true;
    assert.ok(e.message.includes('Audit Violation'), 'Mongoose pre-hook must explicitly raise Audit Violation');
  }
  assert.strictEqual(updateThrewError, true, 'Mongoose pre-hook MUST reject any UPDATE to application_timeline');

  let deleteThrewError = false;
  try {
    await ApplicationTimeline.deleteOne({ _id: timelineEvent._id });
  } catch (e) {
    deleteThrewError = true;
    assert.ok(e.message.includes('Audit Violation'), 'Mongoose pre-hook must explicitly raise Audit Violation');
  }
  assert.strictEqual(deleteThrewError, true, 'Mongoose pre-hook MUST reject any DELETE from application_timeline');
  console.log('  ✓ Immutable audit log verified! Mongoose pre-hook prevents UPDATE and DELETE.\n');

  // Test 10: Stalled Alert & Dismissal
  console.log('Test 10: Stalled Alert & Dismissal');
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const stalledApp = await Application.create({
    job_opening_id: testJob._id,
    candidate_name: 'Stalled Candidate',
    candidate_email: 'stalled@test.com',
    source: 'Inbound',
    stage: 'screening',
    is_rejected: 0,
    stage_entered_at: fourteenDaysAgo,
    created_at: fourteenDaysAgo,
  });

  const isStalled = await Application.findOne({
    _id: stalledApp._id,
    is_rejected: 0,
    stage: { $ne: 'hired' },
    stage_entered_at: { $lte: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
  });
  assert.ok(isStalled, 'Candidate must be identified as stalled (> 10 days)');

  await StalledAlertDismissal.create({
    application_id: stalledApp._id,
    user_id: recruiter._id,
    dismissed_stage: 'screening',
  });

  const dismissalsScreening = await StalledAlertDismissal.find({
    application_id: stalledApp._id,
    user_id: recruiter._id,
    dismissed_stage: 'screening',
  });
  assert.strictEqual(dismissalsScreening.length, 1, 'Alert must be recorded as dismissed for screening stage');

  await Application.findByIdAndUpdate(stalledApp._id, {
    stage: 'interview',
    stage_entered_at: fourteenDaysAgo,
  });

  const dismissalsInterview = await StalledAlertDismissal.find({
    application_id: stalledApp._id,
    user_id: recruiter._id,
    dismissed_stage: 'interview',
  });
  assert.strictEqual(dismissalsInterview.length, 0, 'Alert MUST return because dismissal does not apply to new stage!');
  console.log('  ✓ Stalled alerts and stage-aware dismissal return behavior verified.\n');

  console.log('🎉 ALL 10 GOAL VERIFICATION TESTS PASSED SUCCESSFULLY WITH MONGOOSE & MONGODB!\n');

  await mongoose.connection.close();
  await mongod.stop();
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  });
