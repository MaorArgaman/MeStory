/**
 * Subscription Cron Jobs
 * Handles scheduled tasks for subscription management
 * - Daily expiry warning notifications (7 days and 1 day before)
 * - Daily subscription renewals processing
 * - Daily credit replenishment
 */

import * as cron from 'node-cron';
import {
  sendExpiryWarningNotifications,
  processSubscriptionRenewals,
  replenishFreeCredits,
  replenishSubscriptionCredits,
} from '../services/subscriptionRenewalService';

// Track if jobs are initialized
let isInitialized = false;

// Store job references for potential cleanup
// Using 'any' since node-cron types vary between versions
const scheduledJobs: any[] = [];

/**
 * Initialize all subscription cron jobs
 * Jobs run at 2:00 AM server time to minimize impact on users
 */
export function initializeSubscriptionJobs(): void {
  if (isInitialized) {
    console.log('[SubscriptionJobs] Jobs already initialized, skipping...');
    return;
  }

  console.log('[SubscriptionJobs] Initializing subscription cron jobs...');

  // Job 1: Send 7-day expiry warnings - runs daily at 2:00 AM
  const sevenDayWarningJob = cron.schedule('0 2 * * *', async () => {
    console.log('[SubscriptionJobs] Running 7-day expiry warning job...');
    try {
      const count = await sendExpiryWarningNotifications(7);
      console.log(`[SubscriptionJobs] Sent ${count} 7-day expiry warnings`);
    } catch (error) {
      console.error('[SubscriptionJobs] 7-day warning job failed:', error);
    }
  }, {
    timezone: 'Asia/Jerusalem', // Israel timezone
  });
  scheduledJobs.push(sevenDayWarningJob);

  // Job 2: Send 1-day expiry warnings - runs daily at 2:15 AM
  const oneDayWarningJob = cron.schedule('15 2 * * *', async () => {
    console.log('[SubscriptionJobs] Running 1-day expiry warning job...');
    try {
      const count = await sendExpiryWarningNotifications(1);
      console.log(`[SubscriptionJobs] Sent ${count} 1-day expiry warnings`);
    } catch (error) {
      console.error('[SubscriptionJobs] 1-day warning job failed:', error);
    }
  }, {
    timezone: 'Asia/Jerusalem',
  });
  scheduledJobs.push(oneDayWarningJob);

  // Job 3: Process subscription renewals - runs daily at 2:30 AM
  const renewalJob = cron.schedule('30 2 * * *', async () => {
    console.log('[SubscriptionJobs] Running subscription renewal job...');
    try {
      const results = await processSubscriptionRenewals();
      const renewed = results.filter(r => r.action === 'renewed').length;
      const downgraded = results.filter(r => r.action === 'downgraded').length;
      const failed = results.filter(r => r.action === 'failed').length;
      console.log(`[SubscriptionJobs] Renewal job complete - Renewed: ${renewed}, Downgraded: ${downgraded}, Failed: ${failed}`);
    } catch (error) {
      console.error('[SubscriptionJobs] Renewal job failed:', error);
    }
  }, {
    timezone: 'Asia/Jerusalem',
  });
  scheduledJobs.push(renewalJob);

  // Job 4: Replenish FREE tier credits - runs daily at 2:45 AM
  const freeCreditJob = cron.schedule('45 2 * * *', async () => {
    console.log('[SubscriptionJobs] Running FREE tier credit replenishment job...');
    try {
      const count = await replenishFreeCredits();
      console.log(`[SubscriptionJobs] Replenished credits for ${count} FREE users`);
    } catch (error) {
      console.error('[SubscriptionJobs] FREE credit replenishment job failed:', error);
    }
  }, {
    timezone: 'Asia/Jerusalem',
  });
  scheduledJobs.push(freeCreditJob);

  // Job 5: Replenish paid tier credits - runs daily at 3:00 AM
  const paidCreditJob = cron.schedule('0 3 * * *', async () => {
    console.log('[SubscriptionJobs] Running paid tier credit replenishment job...');
    try {
      const count = await replenishSubscriptionCredits();
      console.log(`[SubscriptionJobs] Replenished credits for ${count} paid users`);
    } catch (error) {
      console.error('[SubscriptionJobs] Paid credit replenishment job failed:', error);
    }
  }, {
    timezone: 'Asia/Jerusalem',
  });
  scheduledJobs.push(paidCreditJob);

  isInitialized = true;
  console.log('[SubscriptionJobs] All subscription jobs initialized successfully');
  console.log('[SubscriptionJobs] Job schedule (Asia/Jerusalem timezone):');
  console.log('  - 02:00 AM: 7-day expiry warnings');
  console.log('  - 02:15 AM: 1-day expiry warnings');
  console.log('  - 02:30 AM: Process renewals');
  console.log('  - 02:45 AM: FREE tier credit reset');
  console.log('  - 03:00 AM: Paid tier credit replenishment');
}

/**
 * Stop all subscription cron jobs
 * Useful for graceful shutdown
 */
export function stopSubscriptionJobs(): void {
  console.log('[SubscriptionJobs] Stopping all subscription jobs...');
  scheduledJobs.forEach(job => job.stop());
  isInitialized = false;
  console.log('[SubscriptionJobs] All jobs stopped');
}

/**
 * Manually trigger all subscription jobs (for testing/admin)
 */
export async function runAllJobsNow(): Promise<{
  sevenDayWarnings: number;
  oneDayWarnings: number;
  renewals: { renewed: number; downgraded: number; failed: number };
  freeCredits: number;
  paidCredits: number;
}> {
  console.log('[SubscriptionJobs] Manually running all jobs...');

  const sevenDayWarnings = await sendExpiryWarningNotifications(7);
  const oneDayWarnings = await sendExpiryWarningNotifications(1);
  const renewalResults = await processSubscriptionRenewals();
  const freeCredits = await replenishFreeCredits();
  const paidCredits = await replenishSubscriptionCredits();

  return {
    sevenDayWarnings,
    oneDayWarnings,
    renewals: {
      renewed: renewalResults.filter(r => r.action === 'renewed').length,
      downgraded: renewalResults.filter(r => r.action === 'downgraded').length,
      failed: renewalResults.filter(r => r.action === 'failed').length,
    },
    freeCredits,
    paidCredits,
  };
}

/**
 * Check if jobs are running
 */
export function areJobsRunning(): boolean {
  return isInitialized;
}

export default {
  initializeSubscriptionJobs,
  stopSubscriptionJobs,
  runAllJobsNow,
  areJobsRunning,
};
