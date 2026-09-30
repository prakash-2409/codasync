const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

/**
 * Get primary student profile or create default profile for St. Joseph's Engineering Student
 */
const getUserProfile = async (req, res, next) => {
  try {
    let user = await User.findOne();
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
 * Update user target placement tier
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

    let user = await User.findOne();
    if (!user) {
      user = new User({
        name: 'Prakash R',
        registerNumber: '312320104001',
        email: 'prakash.cse@stjosephs.ac.in'
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
 * Get Platform-Agnostic Sienna Heatmap matrix (last 16 to 52 weeks activity logs)
 */
const getUserHeatmap = async (req, res, next) => {
  try {
    // Generate dates for the past 112 days (16 weeks)
    const daysToShow = 112;
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - daysToShow + 1);
    startDate.setHours(0, 0, 0, 0);

    // Aggregate activity counts per calendar day (UTC/Local)
    const logs = await ActivityLog.aggregate([
      {
        $match: {
          clickedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$clickedAt' }
          },
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

      // Tier 0 to 4 for styling in Sienna Palette
      let level = 0;
      if (count >= 4) level = 4;
      else if (count >= 3) level = 3;
      else if (count >= 2) level = 2;
      else if (count >= 1) level = 1;

      heatmap.push({
        date: dateStr,
        count,
        level,
        dayOfWeek: d.getDay()
      });
    }

    const totalContributions = logs.reduce((sum, item) => sum + item.count, 0);
    const user = await User.findOne();

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
