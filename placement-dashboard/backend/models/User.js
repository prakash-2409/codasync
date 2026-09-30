const mongoose = require('mongoose');

const engagementLogSchema = new mongoose.Schema({
  contestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest',
    default: null
  },
  targetUrl: {
    type: String,
    required: true
  },
  clickedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  registerNumber: {
    type: String,
    required: [true, 'Register Number is required'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Student Name is required'],
    trim: true
  },
  activityStreak: {
    type: Number,
    default: 0
  },
  lastActiveDate: {
    type: Date,
    default: null
  },
  engagementLogs: [engagementLogSchema],
  targetTier: {
    type: String,
    enum: ['5LPA', '10LPA', '10+LPA'],
    default: '10LPA'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
