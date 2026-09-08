import mongoose from 'mongoose';

const ApplicationSchema = new mongoose.Schema({
  job_opening_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobOpening',
    required: true,
    index: true,
  },
  candidate_name: {
    type: String,
    required: true,
    index: true,
  },
  candidate_email: {
    type: String,
    required: true,
    index: true,
  },
  source: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
    default: '',
  },
  stage: {
    type: String,
    enum: ['applied', 'screening', 'interview', 'offer', 'hired'],
    default: 'applied',
    index: true,
  },
  is_rejected: {
    type: Number,
    default: 0,
  },
  stage_before_rejection: {
    type: String,
  },
  stage_entered_at: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

export const Application = mongoose.model('Application', ApplicationSchema);
