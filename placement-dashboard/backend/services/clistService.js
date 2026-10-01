const axios = require('axios');
const Contest = require('../models/Contest');

// Target major platforms specified in Phase 2
const MAJOR_PLATFORMS = ['LeetCode', 'CodeChef', 'Codeforces', 'AtCoder'];

/**
 * Normalizes host/platform name from CLIST to standardized display names
 */
const normalizePlatform = (resource) => {
  const r = (resource || '').toLowerCase();
  if (r.includes('codeforces')) return 'Codeforces';
  if (r.includes('leetcode')) return 'LeetCode';
  if (r.includes('codechef')) return 'CodeChef';
  if (r.includes('atcoder')) return 'AtCoder';
  return null; // Return null if not one of the major target platforms
};

/**
 * Ingest upcoming contests from CLIST API
 * Filters strictly for major platforms (LeetCode, CodeChef, Codeforces, AtCoder)
 * Intelligently upserts to MongoDB avoiding duplicates
 */
const fetchAndIngestContests = async () => {
  try {
    console.log('[CLIST Pipeline] Initiating automated contest ingestion...');
    const rawClistEnv = process.env.CLIST_API_KEY;

    if (!rawClistEnv) {
      console.warn('[CLIST Pipeline] Warning: CLIST_API_KEY is not defined in environment. Skipping CLIST fetch.');
      return { success: false, count: 0, message: 'No CLIST_API_KEY provided' };
    }

    // Construct valid CLIST API endpoint URL
    let parsedUrl;
    if (rawClistEnv.startsWith('http://') || rawClistEnv.startsWith('https://')) {
      parsedUrl = new URL(rawClistEnv);
    } else {
      parsedUrl = new URL(`https://clist.by/api/v4/contest/?${rawClistEnv}`);
    }

    // Sanitize pathname (remove double slashes if present in env)
    parsedUrl.pathname = parsedUrl.pathname.replace(/\/+/g, '/');

    // Add query parameters for upcoming contests
    parsedUrl.searchParams.set('upcoming', 'true');
    parsedUrl.searchParams.set('order_by', 'start');
    parsedUrl.searchParams.set('limit', '50');

    const response = await axios.get(parsedUrl.toString(), {
      timeout: 15000,
      headers: {
        'User-Agent': 'Sienna-OS-Placement-Dashboard/1.0'
      }
    });

    const objects = response.data?.objects || [];
    console.log(`[CLIST Pipeline] Fetched ${objects.length} raw contests from CLIST API.`);

    let insertedOrUpdated = 0;
    for (const item of objects) {
      if (!item.event || !item.href || !item.start) continue;

      const rawResource = item.resource || item.host || '';
      const platform = normalizePlatform(rawResource);

      // Filter strictly for major platforms
      if (!platform || !MAJOR_PLATFORMS.includes(platform)) {
        continue;
      }

      const startTime = new Date(item.start);
      const duration = item.duration || 7200; // default 2 hours in seconds
      const externalId = `clist_${item.id || item.event.replace(/[^a-zA-Z0-9]/g, '_')}`;

      // Compute tier recommendations
      let tierRecommendation = ['10+LPA'];
      if (['LeetCode', 'CodeChef'].includes(platform)) {
        tierRecommendation = ['5LPA', '10LPA', '10+LPA'];
      } else if (['Codeforces', 'AtCoder'].includes(platform)) {
        tierRecommendation = ['10LPA', '10+LPA'];
      }

      // Upsert into MongoDB to prevent duplicates
      await Contest.findOneAndUpdate(
        { $or: [{ externalId }, { url: item.href }] },
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
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      insertedOrUpdated++;
    }

    console.log(`[CLIST Pipeline] Successfully upserted ${insertedOrUpdated} major platform contests (LeetCode, CodeChef, Codeforces, AtCoder) into MongoDB.`);
    return { success: true, count: insertedOrUpdated };
  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    console.error('[CLIST Pipeline Error]', errorDetails);
    return { success: false, error: error.message };
  }
};

module.exports = {
  fetchAndIngestContests,
  MAJOR_PLATFORMS,
  normalizePlatform
};
