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

/**
 * Auto-onboards or retrieves student document from Clerk credentials
 * Creates a MongoDB user document linking Clerk ID and Gmail address on first sign-in
 */
userSchema.statics.findOrCreateByClerk = async function ({
  clerkId,
  email,
  name,
  avatarUrl
}) {
  if (!clerkId) throw new Error('Clerk ID is required');

  // 1. Check if user already exists by Clerk ID
  let user = await this.findOne({ clerkId });
  if (user) {
    if (avatarUrl && !user.avatarUrl) {
      user.avatarUrl = avatarUrl;
      await user.save();
    }
    return user;
  }

  // 2. Link existing pre-seeded record if matched by email
  const normalizedEmail = (email || `${clerkId}@stjosephs.ac.in`).toLowerCase().trim();
  user = await this.findOne({ email: normalizedEmail });
  if (user) {
    user.clerkId = clerkId;
    if (avatarUrl) user.avatarUrl = avatarUrl;
    if (name && (!user.name || user.name === 'Student')) user.name = name;
    await user.save();
    return user;
  }

  // 3. Auto-provision new student document on first sign-in
  user = await this.create({
    clerkId,
    email: normalizedEmail,
    name: name || 'Student',
    avatarUrl: avatarUrl || '',
    activityStreak: 1,
    lastActiveDate: new Date(),
    targetTier: '10+LPA'
  });

  return user;
};

module.exports = mongoose.model('User', userSchema);
