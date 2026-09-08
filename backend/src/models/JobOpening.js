import mongoose from 'mongoose';

const JobOpeningSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'archived'],
    default: 'open',
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

export const JobOpening = mongoose.model('JobOpening', JobOpeningSchema);
