const Contest = require('../models/Contest');
const User = require('../models/User');

/**
 * Get all active and upcoming contests/events
 */
const getContests = async (req, res, next) => {
  try {
    const { category, platform } = req.query;
    const filter = {};

    if (category) {
      filter.category = category;
    }
    if (platform) {
      filter.platform = new RegExp(platform, 'i');
    }

    // Include contests starting from 2 hours ago onwards
    const now = new Date();
    const cutoff = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    filter.startTime = { $gte: cutoff };

    const contests = await Contest.find(filter)
      .sort({ startTime: 1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: contests.length,
      data: contests
    });
  } catch (error) {
    next(error);
  }
};

const { calculateNextBestAction } = require('../services/recommendationEngine');

/**
 * Single-Threaded Recommendation Engine: Get the Single "Next-Best-Action"
 * Isolates high-leverage task according to user target tier and urgency
 */
const getNextBestAction = async (req, res, next) => {
  try {
    const user = await User.findOne();
    // Allow overriding tier via query param (e.g., /api/contests/next-best-action?tier=5LPA)
    const targetTier = req.query.tier || (user ? user.targetTier : '10+LPA');

    const nextAction = await calculateNextBestAction(targetTier);

    res.status(200).json({
      success: true,
      data: nextAction
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Manual Admin Injection Endpoint (/api/contests/custom)
 * Injects private college placement tests (e.g., Skillrack, TCS NQT) into timeline
 */
const createCustomContest = async (req, res, next) => {
  try {
    const {
      title,
      platform,
      url,
      startTime,
      duration,
      category,
      tierRecommendation,
      externalId
    } = req.body;

    if (!title || !platform || !url || !startTime || duration === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide required fields: title, platform, url, startTime, and duration.'
      });
    }

    // Normalize duration: if duration is less than 300, it was likely passed in minutes
    const durationInSeconds = Number(duration) < 300 ? Number(duration) * 60 : Number(duration);
    const parsedStartTime = new Date(startTime);
    const computedEndTime = new Date(parsedStartTime.getTime() + durationInSeconds * 1000);

    const generatedExternalId = externalId || `custom_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Upsert or create contest to prevent duplicate injections of the same test
    const contest = await Contest.findOneAndUpdate(
      { $or: [{ externalId: generatedExternalId }, { url, startTime: parsedStartTime }] },
      {
        title: title.trim(),
        platform: platform.trim(),
        url: url.trim(),
        startTime: parsedStartTime,
        duration: durationInSeconds,
        endTime: computedEndTime,
        category: category || 'Coding',
        tierRecommendation: Array.isArray(tierRecommendation) && tierRecommendation.length > 0
          ? tierRecommendation
          : ['5LPA', '10LPA', '10+LPA'],
        externalId: generatedExternalId,
        isVerified: true
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({
      success: true,
      message: 'Private test / placement contest successfully injected into timeline',
      data: contest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Seed initial contest data if database is fresh
 */
const seedInitialContests = async () => {
  try {
    const count = await Contest.countDocuments();
    if (count === 0) {
      const now = new Date();
      const seedData = [
        {
          title: 'CodeChef Starters 142 (Div 2 & 3)',
          platform: 'CodeChef',
          url: 'https://www.codechef.com/START142',
          startTime: new Date(now.getTime() + 4 * 60 * 60 * 1000),
          duration: 7200,
          category: 'Coding',
          externalId: 'cc_starters_142',
          tierRecommendation: ['5LPA', '10LPA', '10+LPA']
        },
        {
          title: 'LeetCode Weekly Contest 412',
          platform: 'LeetCode',
          url: 'https://leetcode.com/contest/weekly-contest-412',
          startTime: new Date(now.getTime() + 18 * 60 * 60 * 1000),
          duration: 5400,
          category: 'Coding',
          externalId: 'lc_weekly_412',
          tierRecommendation: ['10LPA', '10+LPA']
        },
        {
          title: 'Codeforces Round 970 (Div. 3)',
          platform: 'Codeforces',
          url: 'https://codeforces.com/contests',
          startTime: new Date(now.getTime() + 28 * 60 * 60 * 1000),
          duration: 8100,
          category: 'Coding',
          externalId: 'cf_round_970',
          tierRecommendation: ['10+LPA']
        },
        {
          title: 'St. Joseph’s Skillrack Daily Challenge #24',
          platform: 'Skillrack',
          url: 'https://www.skillrack.com',
          startTime: new Date(now.getTime() + 1 * 60 * 60 * 1000),
          duration: 3600,
          category: 'Coding',
          externalId: 'sjce_sr_24',
          tierRecommendation: ['5LPA', '10LPA', '10+LPA']
        },
        {
          title: 'TCS NQT Advanced Quantitative Mock Drive',
          platform: 'TCS NQT',
          url: 'https://www.tcsion.com/hub/national-qualifier-test/',
          startTime: new Date(now.getTime() + 12 * 60 * 60 * 1000),
          duration: 5400,
          category: 'Aptitude',
          externalId: 'tcs_nqt_mock_1',
          tierRecommendation: ['5LPA', '10LPA']
        }
      ];

      await Contest.insertMany(seedData);
      console.log('[Seed] Initial placement events populated.');
    }
  } catch (err) {
    console.error('[Seed Error]', err.message);
  }
};

module.exports = {
  getContests,
  getNextBestAction,
  createCustomContest,
  createPrivateContest: createCustomContest,
  seedInitialContests
};
