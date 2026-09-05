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
  }
});

InterviewPanelSchema.index({ application_id: 1, interviewer_id: 1 }, { unique: true });

export const InterviewPanel = mongoose.model('InterviewPanel', InterviewPanelSchema);
