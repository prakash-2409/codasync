const mongoose = require('mongoose');
const User = require('../models/User');
const Contest = require('../models/Contest');
const ActivityLog = require('../models/ActivityLog');

/**
 * Helper to determine date difference in calendar days (ignoring hours)
 */
const isSameDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const isYesterday = (d1, d2) => {
  if (!d1 || !d2) return false;
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  const oneDay = 24 * 60 * 60 * 1000;
  const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return (utc2 - utc1) === oneDay;
};

/**
 * Smart Redirect Handler: /api/redirect
 * Wrapped click telemetry tracking with automatic streak calculation & 302 HTTP redirection
 */
const handleSmartRedirect = async (req, res, next) => {
  try {
    const { targetUrl, contestId, userId, category, json } = req.query;

    if (!targetUrl) {
      return res.status(400).json({
        success: false,
        message: 'targetUrl query parameter is required.'
      });
    }

    let decodedUrl;
    try {
      decodedUrl = decodeURIComponent(targetUrl);
      new URL(decodedUrl); // Validate proper URL structure
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid targetUrl format provided.'
      });
    }

    // Validate optional contestId
    let validContestId = null;
    let contestObj = null;
    if (contestId && mongoose.Types.ObjectId.isValid(contestId)) {
      validContestId = contestId;
      contestObj = await Contest.findById(contestId);
    }

    // Capture User Info (or default primary user if single-user mode)
    let validUserId = null;
    let targetUser = null;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      validUserId = userId;
      targetUser = await User.findById(userId);
    } else {
      // Fallback: lookup or create default student profile
      targetUser = await User.findOne();
      if (targetUser) {
        validUserId = targetUser._id;
      }
    }

    // 1. Immutable Activity Audit Log
    const activityLog = new ActivityLog({
      userId: validUserId,
      contestId: validContestId,
      targetUrl: decodedUrl,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
      userAgent: req.headers['user-agent'] || '',
      category: category || (contestObj ? contestObj.category : 'General'),
      clickedAt: new Date()
    });
    await activityLog.save();

    // 2. Atomic Streak & User Engagement Update
    let updatedStreak = 0;
    if (targetUser) {
      const now = new Date();
      const lastActive = targetUser.lastActiveDate;

      if (!lastActive) {
        // First ever activity
        targetUser.activityStreak = 1;
      } else if (isSameDay(lastActive, now)) {
        // Already active today, maintain streak
        targetUser.activityStreak = targetUser.activityStreak || 1;
      } else if (isYesterday(lastActive, now)) {
        // Consecutive active day
        targetUser.activityStreak = (targetUser.activityStreak || 0) + 1;
      } else {
        // Streak broken
        targetUser.activityStreak = 1;
      }

      targetUser.lastActiveDate = now;
      targetUser.engagementLogs.push({
        contestId: validContestId,
        targetUrl: decodedUrl,
        clickedAt: now
      });

      await targetUser.save();
      updatedStreak = targetUser.activityStreak;
    }

    // If client requested JSON response (e.g. for preview / frontend async telemetry)
    if (json === 'true' || json === '1') {
      return res.status(200).json({
        success: true,
        redirectUrl: decodedUrl,
        streak: updatedStreak,
        loggedAt: new Date()
      });
    }

    // 3. Perform 302 Redirect to destination platform
    return res.redirect(302, decodedUrl);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleSmartRedirect
};
