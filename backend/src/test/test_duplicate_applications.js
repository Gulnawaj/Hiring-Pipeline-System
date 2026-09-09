import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Application } from '../models/Application.js';
import { JobOpening } from '../models/JobOpening.js';
import { createApplication, updateApplication } from '../controllers/applications.controller.js';

dotenv.config();

const mockRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.body = data;
    return res;
  };
  return res;
};

const runTests = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');
  
  // Clean up test data before starting
  await Application.deleteMany({ candidate_name: 'Test Aman' });
  await JobOpening.deleteMany({ title: 'Test Job Aman' });
  await JobOpening.deleteMany({ title: 'Test Job Aman 2' });
  
  const job1 = await JobOpening.create({
    title: 'Test Job Aman',
    department: 'Engineering',
    location: 'Remote',
    status: 'open',
    created_at: new Date()
  });
  
  const job2 = await JobOpening.create({
    title: 'Test Job Aman 2',
    department: 'Engineering',
    location: 'Remote',
    status: 'open',
    created_at: new Date()
  });

  const reqUser = { id: new mongoose.Types.ObjectId(), name: 'Recruiter' };

  // Helper to create application through controller
  const createReq = (job_id, email) => ({
    user: reqUser,
    body: {
      job_opening_id: job_id.toString(),
      candidate_name: 'Test Aman',
      candidate_email: email,
      source: 'Careers Page'
    }
  });

  console.log('--- Creating initial active application ---');
  const res1 = mockRes();
  await createApplication(createReq(job1._id, 'Aman@test.com'), res1);
  if (res1.statusCode !== 201) throw new Error('Initial create failed: ' + JSON.stringify(res1.body));
  console.log('Success: created active application');
  const activeAppId = res1.body.id;

  console.log('\nA. Same candidate + same job + existing active application -> rejected with HTTP 409.');
  const resA = mockRes();
  await createApplication(createReq(job1._id, 'aman@test.com '), resA);
  if (resA.statusCode === 409) console.log('Passed A');
  else throw new Error('Failed A: expected 409, got ' + resA.statusCode);

  console.log('\nRejecting the first application...');
  await Application.findByIdAndUpdate(activeAppId, { is_rejected: 1 });

  console.log('\nB. Same candidate + same job + only rejected previous applications -> new application allowed.');
  const resB = mockRes();
  await createApplication(createReq(job1._id, ' aman@test.com'), resB);
  if (resB.statusCode === 201) console.log('Passed B');
  else throw new Error('Failed B: expected 201, got ' + resB.statusCode);
  const activeAppId2 = resB.body.id;

  console.log('\nC. Same candidate + different job -> allowed.');
  const resC = mockRes();
  await createApplication(createReq(job2._id, 'aman@test.com'), resC);
  if (resC.statusCode === 201) console.log('Passed C');
  else throw new Error('Failed C: expected 201, got ' + resC.statusCode);

  console.log('\nD. Different candidate + same job -> allowed.');
  const resD = mockRes();
  await createApplication(createReq(job1._id, 'other@test.com'), resD);
  if (resD.statusCode === 201) console.log('Passed D');
  else throw new Error('Failed D: expected 201, got ' + resD.statusCode);

  console.log('\nE. Editing an application without changing candidate/job -> allowed.');
  const resE = mockRes();
  const updateReqE = {
    user: reqUser,
    params: { id: activeAppId2 },
    body: {
      job_opening_id: job1._id.toString(),
      candidate_name: 'Test Aman Edited',
      candidate_email: 'aman@test.com',
      source: 'Careers Page',
      notes: 'Some notes'
    }
  };
  await updateApplication(updateReqE, resE);
  if (resE.statusCode === 200) console.log('Passed E');
  else throw new Error('Failed E: expected 200, got ' + resE.statusCode);

  console.log('\nF. Editing an application to a candidate/job combination that has another active application -> rejected with HTTP 409.');
  // Job 2 has an active application for aman@test.com (created in step C)
  // Let's try to update the application from D (other@test.com on Job 1) to aman@test.com on Job 2
  const resF = mockRes();
  const updateReqF = {
    user: reqUser,
    params: { id: resD.body.id },
    body: {
      job_opening_id: job2._id.toString(),
      candidate_name: 'Test Aman',
      candidate_email: 'Aman@test.com ',
      source: 'Careers Page'
    }
  };
  await updateApplication(updateReqF, resF);
  if (resF.statusCode === 409) console.log('Passed F');
  else throw new Error('Failed F: expected 409, got ' + resF.statusCode);

  console.log('\nG. Editing an application to a candidate/job combination where existing records are only rejected -> allowed.');
  // Reject application C on Job 2
  await Application.findByIdAndUpdate(resC.body.id, { is_rejected: 1 });
  
  // Now try again to edit application D to aman@test.com on Job 2
  const resG = mockRes();
  await updateApplication(updateReqF, resG); // Reuse request
  if (resG.statusCode === 200) console.log('Passed G');
  else throw new Error('Failed G: expected 200, got ' + resG.statusCode + ' body: ' + JSON.stringify(resG.body));

  console.log('\nH. Existing Hired application + same candidate + same job -> HTTP 409 with specific message.');
  // Mark the active app on Job 1 (activeAppId2) as 'hired'
  await Application.findByIdAndUpdate(activeAppId2, { stage: 'hired' });
  const resH = mockRes();
  await createApplication(createReq(job1._id, 'aman@test.com'), resH);
  if (resH.statusCode === 409 && resH.body.error === 'This candidate is already hired for this job opening.') console.log('Passed H');
  else throw new Error('Failed H: expected 409 and specific message, got ' + resH.statusCode + ' ' + JSON.stringify(resH.body));

  // Cleanup
  await Application.deleteMany({ candidate_name: { $regex: /Test Aman/ } });
  await JobOpening.deleteMany({ title: { $regex: /Test Job Aman/ } });
  
  console.log('\nALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
};

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
