const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

/**
 * Get student profile
 * Prefers authenticated user via req.user or looks up by Clerk ID / default profile
 */
const getUserProfile = async (req, res, next) => {
  try {
    let user = req.user;
    if (!user && req.auth?.userId) {
      user = await User.findOne({ clerkId: req.auth.userId });
    }
    if (!user) {
      user = await User.findOne();
    }

    if (!user) {
      user = await User.create({
        name: 'Prakash R',
        registerNumber: '312320104001',
        email: 'prakash.cse@stjosephs.ac.in',
        targetTier: '10+LPA',
        activityStreak: 3,
        lastActiveDate: new Date()
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update student target placement tier
 */
const updateTargetTier = async (req, res, next) => {
  try {
    const { targetTier } = req.body;
    if (!['5LPA', '10LPA', '10+LPA'].includes(targetTier)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid target tier. Must be 5LPA, 10LPA, or 10+LPA'
      });
    }

    let user = req.user;
    if (!user && req.auth?.userId) {
      user = await User.findOne({ clerkId: req.auth.userId });
    }
    if (!user) {
      user = await User.findOne();
    }

    if (!user) {
      user = new User({
        name: 'Student',
        email: req.auth?.userId ? `${req.auth.userId}@stjosephs.ac.in` : 'student@stjosephs.ac.in',
        targetTier
      });
    }

    user.targetTier = targetTier;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Target tier updated to ${targetTier}`,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Platform-Agnostic Sienna Heatmap matrix
 */
const getUserHeatmap = async (req, res, next) => {
  try {
    const daysToShow = 91;
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - daysToShow + 1);
    startDate.setHours(0, 0, 0, 0);

    const user = req.user || (req.auth?.userId ? await User.findOne({ clerkId: req.auth.userId }) : await User.findOne());

    const matchQuery = { clickedAt: { $gte: startDate } };
    if (user) {
      matchQuery.userId = user._id;
    }

    const logs = await ActivityLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$clickedAt' } },
          count: { $sum: 1 }
        }
      }
    ]);

    const logMap = {};
    logs.forEach(item => {
      logMap[item._id] = item.count;
    });

    const heatmap = [];
    for (let i = 0; i < daysToShow; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const count = logMap[dateStr] || 0;

      let level = 0;
      if (count >= 3) level = 3;
      else if (count === 2) level = 2;
      else if (count === 1) level = 1;

      heatmap.push({
        date: dateStr,
        count,
        level,
        dayOfWeek: d.getDay()
      });
    }

    const totalContributions = logs.reduce((sum, item) => sum + item.count, 0);

    res.status(200).json({
      success: true,
      data: {
        heatmap,
        totalContributions,
        currentStreak: user ? user.activityStreak : 0,
        targetTier: user ? user.targetTier : '10+LPA'
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  updateTargetTier,
  getUserHeatmap
};
