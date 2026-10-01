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
  clerkId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  registerNumber: {
    type: String,
    required: false,
    trim: true,
    default: function () {
      return '31232' + Math.floor(100000 + Math.random() * 900000);
    }
  },
  name: {
    type: String,
    required: [true, 'Student Name is required'],
    trim: true,
    default: 'Student'
  },
  avatarUrl: {
    type: String,
    default: ''
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
    default: '10+LPA'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
