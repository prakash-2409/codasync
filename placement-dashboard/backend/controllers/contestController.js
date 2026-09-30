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

    // Include contests that are either currently ongoing or starting in the future
    const now = new Date();
    // Allow contests starting within the last 2 hours or in the future
    const cutoff = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    filter.startTime = { $gte: cutoff };

    const contests = await Contest.find(filter)
      .sort({ startTime: 1 })
      .limit(30);

    res.status(200).json({
      success: true,
      count: contests.length,
      data: contests
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Single-Threaded Recommendation Engine: Get the Single "Next-Best-Action"
 * Isolates high-leverage task according to user target tier and urgency
 */
const getNextBestAction = async (req, res, next) => {
  try {
    const user = await User.findOne();
    const targetTier = user ? user.targetTier : '10+LPA';
    const now = new Date();

    // 1. Look for live or imminent contests (starting within 48 hours)
    const upcomingContests = await Contest.find({
      startTime: { $gte: new Date(now.getTime() - 1 * 60 * 60 * 1000) },
      tierRecommendation: targetTier
    }).sort({ startTime: 1 });

    let nextAction = null;

    if (upcomingContests.length > 0) {
      const topContest = upcomingContests[0];
      const startsInMs = new Date(topContest.startTime).getTime() - now.getTime();
      const isLive = startsInMs <= 0;

      nextAction = {
        type: 'CONTEST_PRIORITY',
        id: topContest._id,
        title: topContest.title,
        platform: topContest.platform,
        url: topContest.url,
        startTime: topContest.startTime,
        duration: topContest.duration,
        category: topContest.category,
        isLive,
        startsInMinutes: Math.max(0, Math.round(startsInMs / (1000 * 60))),
        rationale: targetTier === '10+LPA'
          ? `High-leverage Tier 1 milestone: Competing in ${topContest.platform} builds global rating for >10 LPA shortlist criteria.`
          : targetTier === '10LPA'
          ? `Crucial Tier 2 consistency: Participating in ${topContest.platform} meets the weekly 5-10 LPA speed benchmark.`
          : `Foundational Aptitude/Coding test for 5 LPA eligibility.`
      };
    } else {
      // Fallback default high-yield action based on tier
      if (targetTier === '10+LPA') {
        nextAction = {
          type: 'DSA_CURATED',
          title: 'Dynamic Programming & Graph Patterns (Striver SDE Sheet)',
          platform: 'LeetCode',
          url: 'https://leetcode.com/problemset/all/?topicSlugs=dynamic-programming',
          category: 'Coding',
          isLive: false,
          rationale: 'Target Tier >10 LPA requires master-level DP & Graph proficiency. Complete 2 patterns today.'
        };
      } else if (targetTier === '10LPA') {
        nextAction = {
          type: 'APTITUDE_CURATED',
          title: 'Advanced TCS NQT / Cognizant Aptitude Drill',
          platform: 'Skillrack',
          url: 'https://www.skillrack.com',
          category: 'Aptitude',
          isLive: false,
          rationale: '5-10 LPA placement screening requires >85% accuracy in Quantitative Aptitude.'
        };
      } else {
        nextAction = {
          type: 'FOUNDATION_CURATED',
          title: 'Core Java & Data Structures Fundamentals',
          platform: 'Skillrack',
          url: 'https://www.skillrack.com',
          category: 'Coding',
          isLive: false,
          rationale: 'Core 5 LPA drive eligibility: Complete today’s mandatory departmental coding challenge.'
        };
      }
    }

    res.status(200).json({
      success: true,
      data: nextAction
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin Injection of Private Tests (Skillrack, TCS NQT mock, Internal Assessment)
 */
const createPrivateContest = async (req, res, next) => {
  try {
    const { title, platform, url, startTime, duration, category, tierRecommendation } = req.body;

    if (!title || !platform || !url || !startTime || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, platform, url, startTime, and duration.'
      });
    }

    const contest = await Contest.create({
      title,
      platform,
      url,
      startTime: new Date(startTime),
      duration: Number(duration),
      category: category || 'Coding',
      tierRecommendation: tierRecommendation || ['5LPA', '10LPA', '10+LPA'],
      isVerified: true
    });

    res.status(201).json({
      success: true,
      message: 'Private test / contest successfully injected',
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
          startTime: new Date(now.getTime() + 4 * 60 * 60 * 1000), // in 4 hours
          duration: 7200,
          category: 'Coding',
          externalId: 'cc_starters_142',
          tierRecommendation: ['5LPA', '10LPA', '10+LPA']
        },
        {
          title: 'LeetCode Weekly Contest 412',
          platform: 'LeetCode',
          url: 'https://leetcode.com/contest/weekly-contest-412',
          startTime: new Date(now.getTime() + 18 * 60 * 60 * 1000), // in 18 hours
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
  createPrivateContest,
  seedInitialContests
};
