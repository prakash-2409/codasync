const cron = require('node-cron');
const { fetchAndIngestContests } = require('./clistService');

let cronJobInstance = null;

/**
 * Initialize automated background cron workers
 * Runs every 12 hours (cron format: "0 * /12 * * *" without space) to fetch and sync contests from CLIST API
 */
const initCronJobs = () => {
  console.log('[Cron Service] Initializing CLIST ingestion cron scheduler (Every 12 hours: 0 */12 * * *)...');

  // Schedule task every 12 hours
  cronJobInstance = cron.schedule('0 */12 * * *', async () => {
    console.log('[Cron Service] Executing scheduled 12-hour CLIST contest sync...');
    try {
      await fetchAndIngestContests();
    } catch (err) {
      console.error('[Cron Service] Scheduled sync encounter an error:', err.message);
    }
  });

  // Execute an immediate initial sync in the background (with 3-second delay for DB stabilization)
  setTimeout(async () => {
    console.log('[Cron Service] Executing initial startup contest synchronization...');
    try {
      await fetchAndIngestContests();
    } catch (err) {
      console.error('[Cron Service] Initial sync failed:', err.message);
    }
  }, 3000);

  return cronJobInstance;
};

module.exports = {
  initCronJobs
};
