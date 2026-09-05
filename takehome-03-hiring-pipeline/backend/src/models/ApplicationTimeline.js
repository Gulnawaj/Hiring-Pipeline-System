import mongoose from 'mongoose';

const ApplicationTimelineSchema = new mongoose.Schema({
  application_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true,
    index: true,
  },
  actor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  actor_name: {
    type: String,
    required: true,
  },
  event_type: {
    type: String,
    required: true, // 'created' | 'stage_change' | 'rejected' | 'reinstated' | 'feedback'
  },
  details: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true,
  }
});

// Protect against updates
ApplicationTimelineSchema.pre('updateOne', function (next) {
  next(new Error('Audit Violation: Cannot update timeline events.'));
});

ApplicationTimelineSchema.pre('updateMany', function (next) {
  next(new Error('Audit Violation: Cannot update timeline events.'));
});

ApplicationTimelineSchema.pre('findOneAndUpdate', function (next) {
  next(new Error('Audit Violation: Cannot update timeline events.'));
});

// Protect against deletes
ApplicationTimelineSchema.pre('deleteOne', function (next) {
  // Check if we are clearing the DB in seeding (bypass check)
  if (this.getQuery && Object.keys(this.getQuery()).length === 0) {
    return next();
  }
  next(new Error('Audit Violation: Cannot delete timeline events.'));
});

ApplicationTimelineSchema.pre('findOneAndDelete', function (next) {
  next(new Error('Audit Violation: Cannot delete timeline events.'));
});

export const ApplicationTimeline = mongoose.model('ApplicationTimeline', ApplicationTimelineSchema);
