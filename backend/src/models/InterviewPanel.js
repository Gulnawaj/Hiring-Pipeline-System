import mongoose from 'mongoose';

const InterviewPanelSchema = new mongoose.Schema({
  application_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true,
  },

  interviewer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  assigned_at: {
    type: Date,
    default: Date.now,
  },

  // Date and time when the interview is actually scheduled.
  scheduled_at: {
    type: Date,
    default: null,
  },
});

InterviewPanelSchema.index(
  { application_id: 1, interviewer_id: 1 },
  { unique: true }
);

export const InterviewPanel = mongoose.model(
  'InterviewPanel',
  InterviewPanelSchema
);