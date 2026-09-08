import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  password_hash: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['recruiter', 'interviewer'],
    required: true,
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

export const User = mongoose.model('User', UserSchema);
