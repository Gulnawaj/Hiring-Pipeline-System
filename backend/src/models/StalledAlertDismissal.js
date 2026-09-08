import mongoose from 'mongoose';

const StalledAlertDismissalSchema = new mongoose.Schema({
  application_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  dismissed_stage: {
    type: String,
    required: true,
  },
  dismissed_at: {
    type: Date,
    default: Date.now,
  }
});

StalledAlertDismissalSchema.index({ application_id: 1, user_id: 1, dismissed_stage: 1 }, { unique: true });
StalledAlertDismissalSchema.index({ application_id: 1, user_id: 1 });

export const StalledAlertDismissal = mongoose.model('StalledAlertDismissal', StalledAlertDismissalSchema);
