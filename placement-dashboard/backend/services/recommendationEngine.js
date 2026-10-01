const Contest = require('../models/Contest');

/**
 * Normalizes tier string format ('5LPA', '10LPA', '10+LPA', '>10LPA')
 */
const normalizeTier = (tier) => {
  if (!tier) return '10+LPA';
  const clean = String(tier).trim().toUpperCase();
  if (clean.includes('>10') || clean === '10+LPA' || clean === '>10') return '10+LPA';
  if (clean === '10LPA' || clean === '10') return '10LPA';
  if (clean === '5LPA' || clean === '5') return '5LPA';
  return '10+LPA';
};

/**
 * Checks if a contest's recommended tiers align with the user's target tier
 */
const isTierMatch = (contestTiers = [], targetTier) => {
  if (!Array.isArray(contestTiers) || contestTiers.length === 0) return false;
  const targetNorm = normalizeTier(targetTier);
  return contestTiers.some((t) => normalizeTier(t) === targetNorm);
};

/**
 * Platform prioritization weighting per placement target tier
 */
const PLATFORM_PRIORITIES = {
  '10+LPA': {
    preferredPlatforms: ['Codeforces', 'AtCoder', 'LeetCode'],
    preferredCategories: ['Coding', 'Hackathon'],
    minDuration: 3600, // 1h+
    rationalePrefix: 'Tier 1 Marquee Target (>10 LPA): Global competitive rating on Codeforces/AtCoder is the definitive differentiator for product firms (Google, Amazon, DE Shaw).'
  },
  '10LPA': {
    preferredPlatforms: ['LeetCode', 'CodeChef', 'HackerEarth'],
    preferredCategories: ['Coding'],
    minDuration: 3600,
    rationalePrefix: 'Tier 2 Accelerator Target (5-10 LPA): High speed and medium DSA consistency on LeetCode/CodeChef directly impacts Tier 2 placement screening rounds.'
  },
  '5LPA': {
    preferredPlatforms: ['Skillrack', 'TCS NQT', 'Cognizant Mock', 'GeeksforGeeks'],
    preferredCategories: ['Aptitude', 'Coding'],
    minDuration: 1800,
    rationalePrefix: 'Tier 3 Core Placement Target (Up to 5 LPA): Mandatory department Skillrack modules and Quantitative Aptitude tests are required for Day-1 mass drive eligibility.'
  }
};

// Aliases for user query compatibility
PLATFORM_PRIORITIES['>10LPA'] = PLATFORM_PRIORITIES['10+LPA'];

/**
 * Curated fallback actions when no live/imminent contests are scheduled within 48h
 */
const CURATED_FALLBACKS = {
  '10+LPA': {
    type: 'DSA_CURATED',
    title: 'Striver SDE Sheet: Advanced Dynamic Programming & Graph Patterns',
    platform: 'LeetCode',
    url: 'https://leetcode.com/problemset/all/?topicSlugs=dynamic-programming',
    category: 'Coding',
    isLive: false,
    duration: 5400,
    rationale: 'No live competitive contest within 24h. For >10 LPA targets, solve 2 Hard DP or Graph problems today to maintain your problem-solving velocity.'
  },
  '10LPA': {
    type: 'DSA_CURATED',
    title: 'Binary Search, Tree Traversals & Two Pointers Speed Drill',
    platform: 'LeetCode',
    url: 'https://leetcode.com/problemset/all/?difficulty=MEDIUM',
    category: 'Coding',
    isLive: false,
    duration: 3600,
    rationale: '5-10 LPA benchmark: Solve 3 LeetCode Medium problems in under 60 minutes to maintain optimal coding test speed.'
  },
  '5LPA': {
    type: 'APTITUDE_CURATED',
    title: 'Mandatory St. Joseph’s Skillrack Daily Challenge & TCS NQT Quantitative Drill',
    platform: 'Skillrack',
    url: 'https://www.skillrack.com',
    category: 'Aptitude',
    isLive: false,
    duration: 3600,
    rationale: 'Foundational Core Drive Benchmark: Complete today’s 20-question quantitative aptitude & logical reasoning drill on Skillrack.'
  }
};

CURATED_FALLBACKS['>10LPA'] = CURATED_FALLBACKS['10+LPA'];

/**
 * Placement Recommendation Engine
 * Evaluates target tier and returns the single highest leverage Next-Best-Action
 * 
 * @param {Object|string} userOrTier User mongoose document or targetTier string
 * @returns {Promise<Object>} Single Next-Best-Action object
 */
const calculateNextBestAction = async (userOrTier) => {
  const rawTier = typeof userOrTier === 'string' ? userOrTier : userOrTier?.targetTier;
  const targetTier = normalizeTier(rawTier);
  const tierConfig = PLATFORM_PRIORITIES[targetTier] || PLATFORM_PRIORITIES['10+LPA'];
  const now = new Date();
  const nowMs = now.getTime();

  // Allow contests starting up to 3 hours ago (live) or in the next 72 hours
  const startCutoff = new Date(nowMs - 3 * 60 * 60 * 1000);
  const endCutoff = new Date(nowMs + 72 * 60 * 60 * 1000);

  // Fetch upcoming and ongoing contests
  const candidateContests = await Contest.find({
    $or: [
      { endTime: { $gte: now } },
      { startTime: { $gte: startCutoff, $lte: endCutoff } }
    ]
  }).sort({ startTime: 1 });

  if (candidateContests && candidateContests.length > 0) {
    // Score each contest based on tier alignment, platform weight, category, and urgency
    const scoredContests = candidateContests
      .map((contest) => {
        const startTimeMs = new Date(contest.startTime).getTime();
        const durationSeconds = contest.duration || 7200;
        const endTimeMs = contest.endTime
          ? new Date(contest.endTime).getTime()
          : startTimeMs + durationSeconds * 1000;

        // Skip contests that have already concluded
        if (endTimeMs < nowMs) return null;

        const startsInMs = startTimeMs - nowMs;
        const isLive = startTimeMs <= nowMs && endTimeMs >= nowMs;
        let score = 0;

        // 1. Tier recommendation match (+50)
        if (isTierMatch(contest.tierRecommendation, targetTier)) {
          score += 50;
        }

        // 2. Platform priority match (+20 to +60 based on tierConfig)
        const platformIndex = tierConfig.preferredPlatforms.findIndex(
          (p) => p.toLowerCase() === (contest.platform || '').trim().toLowerCase()
        );
        if (platformIndex !== -1) {
          score += (tierConfig.preferredPlatforms.length - platformIndex) * 20;
        }

        // 3. Category match (+20)
        if (tierConfig.preferredCategories.includes(contest.category)) {
          score += 20;
        }

        // 4. Urgency scoring: Live contests get massive priority boost
        if (isLive) {
          score += 100;
        } else if (startsInMs > 0 && startsInMs <= 6 * 60 * 60 * 1000) {
          score += 40; // Starts within 6 hours
        } else if (startsInMs > 0 && startsInMs <= 24 * 60 * 60 * 1000) {
          score += 20; // Starts within 24 hours
        }

        return { contest, score, isLive, startsInMs };
      })
      .filter(Boolean);

    // Sort by highest score first; if tied, earliest start time
    scoredContests.sort((a, b) => b.score - a.score || a.startsInMs - b.startsInMs);

    const topCandidate = scoredContests[0];
    if (topCandidate && topCandidate.score > 20) {
      const { contest, isLive, startsInMs } = topCandidate;
      const startsInMinutes = Math.max(0, Math.round(startsInMs / (1000 * 60)));

      let contextualRationale = tierConfig.rationalePrefix;
      if (isLive) {
        contextualRationale = `LIVE NOW: Competing in ${contest.platform} delivers instant proof-of-work. ${tierConfig.rationalePrefix}`;
      } else if (startsInMinutes <= 180 && startsInMinutes > 0) {
        contextualRationale = `Imminent milestone (starts in ${startsInMinutes} mins): Register and warm up now. ${tierConfig.rationalePrefix}`;
      }

      return {
        type: 'CONTEST_PRIORITY',
        id: contest._id,
        title: contest.title,
        platform: contest.platform,
        url: contest.url,
        startTime: contest.startTime,
        duration: contest.duration,
        category: contest.category,
        isLive,
        startsInMinutes,
        rationale: contextualRationale,
        targetTier,
        priorityScore: topCandidate.score
      };
    }
  }

  // Fallback to high-yield curated task for this placement tier
  const fallback = CURATED_FALLBACKS[targetTier] || CURATED_FALLBACKS['10+LPA'];
  return {
    ...fallback,
    targetTier,
    isFallback: true
  };
};

module.exports = {
  calculateNextBestAction,
  normalizeTier,
  isTierMatch,
  PLATFORM_PRIORITIES,
  CURATED_FALLBACKS
};
