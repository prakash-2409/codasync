const cron = require('node-cron');
const { fetchAndIngestContests } = require('./clistService');

/**
 * Initialize automated background cron workers
 */
const initCronJobs = () => {
  console.log('[Cron Service] Scheduling CLIST automated contest ingestion every 12 hours...');

  // Schedule to run every 12 hours
  cron.schedule('0 */12 * * *', async () => {
    console.log('[Cron Service] Running scheduled CLIST contest sync...');
    await fetchAndIngestContests();
  });

  // Run initial sync 5 seconds after startup
  setTimeout(async () => {
    console.log('[Cron Service] Triggering initial background contest synchronization...');
    await fetchAndIngestContests();
  }, 5000);
};

module.exports = {
  initCronJobs
};
