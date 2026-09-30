const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Contest title is required'],
    trim: true
  },
  platform: {
    type: String,
    required: [true, 'Platform is required'],
    trim: true
  },
  url: {
    type: String,
    required: [true, 'Direct registration/contest URL is required'],
    trim: true
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  duration: {
    type: Number,
    required: [true, 'Duration in seconds is required']
  },
  endTime: {
    type: Date
  },
  category: {
    type: String,
    enum: ['Coding', 'Aptitude', 'Hackathon', 'Certification'],
    default: 'Coding'
  },
  externalId: {
    type: String,
    unique: true,
    sparse: true
  },
  isVerified: {
    type: Boolean,
    default: true
  },
  tierRecommendation: {
    type: [String],
    default: ['5LPA', '10LPA', '10+LPA']
  }
}, {
  timestamps: true
});

// Auto-compute endTime if duration and startTime are present
contestSchema.pre('save', function (next) {
  if (this.startTime && this.duration && !this.endTime) {
    this.endTime = new Date(this.startTime.getTime() + this.duration * 1000);
  }
  next();
});

module.exports = mongoose.model('Contest', contestSchema);
