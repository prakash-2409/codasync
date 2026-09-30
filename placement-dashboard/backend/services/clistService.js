const axios = require('axios');
const Contest = require('../models/Contest');

/**
 * Normalizes host/platform name from CLIST to clean display names
 */
const normalizePlatform = (resource) => {
  const r = (resource || '').toLowerCase();
  if (r.includes('codeforces')) return 'Codeforces';
  if (r.includes('leetcode')) return 'LeetCode';
  if (r.includes('codechef')) return 'CodeChef';
  if (r.includes('atcoder')) return 'AtCoder';
  if (r.includes('hackerearth')) return 'HackerEarth';
  if (r.includes('geeksforgeeks')) return 'GeeksforGeeks';
  if (r.includes('topcoder')) return 'TopCoder';
  return resource || 'Competitive Coding';
};

/**
 * Ingest upcoming contests from CLIST API
 */
const fetchAndIngestContests = async () => {
  try {
    console.log('[CLIST Pipeline] Starting automated contest ingestion...');
    const rawClistEnv = process.env.CLIST_API_KEY;

    if (!rawClistEnv) {
      console.warn('[CLIST Pipeline] No CLIST_API_KEY / URL configured in environment. Skipping CLIST fetch.');
      return { count: 0, message: 'No API key provided' };
    }

    let fetchUrl = rawClistEnv;
    // Ensure upcoming parameters are provided
    const nowIso = new Date().toISOString();
    const parsedUrl = new URL(fetchUrl.startsWith('http') ? fetchUrl : `https://clist.by/api/v4/contest/?${fetchUrl}`);
    parsedUrl.searchParams.set('upcoming', 'true');
    parsedUrl.searchParams.set('order_by', 'start');
    parsedUrl.searchParams.set('limit', '40');

    const response = await axios.get(parsedUrl.toString(), {
      timeout: 15000,
      headers: {
        'User-Agent': 'Sienna-OS-Placement-Dashboard/1.0'
      }
    });

    const objects = response.data?.objects || [];
    console.log(`[CLIST Pipeline] Received ${objects.length} contests from CLIST API.`);

    let insertedOrUpdated = 0;
    for (const item of objects) {
      if (!item.event || !item.href || !item.start) continue;

      const platform = normalizePlatform(item.resource || item.host);
      const startTime = new Date(item.start);
      const duration = item.duration || 7200; // default 2 hours
      const externalId = `clist_${item.id || item.event.replace(/\s+/g, '_')}`;

      // Assign tier recommendation based on platform & difficulty
      let tierRecommendation = ['10+LPA'];
      if (['LeetCode', 'CodeChef', 'GeeksforGeeks'].includes(platform)) {
        tierRecommendation = ['5LPA', '10LPA', '10+LPA'];
      } else if (['Codeforces', 'AtCoder'].includes(platform)) {
        tierRecommendation = ['10LPA', '10+LPA'];
      }

      await Contest.findOneAndUpdate(
        { externalId },
        {
          title: item.event,
          platform,
          url: item.href,
          startTime,
          duration,
          endTime: new Date(startTime.getTime() + duration * 1000),
          category: 'Coding',
          externalId,
          isVerified: true,
          tierRecommendation
        },
        { upsert: true, new: true }
      );
      insertedOrUpdated++;
    }

    console.log(`[CLIST Pipeline] Successfully synced ${insertedOrUpdated} contests to MongoDB.`);
    return { success: true, count: insertedOrUpdated };
  } catch (error) {
    console.error('[CLIST Pipeline Error]', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  fetchAndIngestContests
};
