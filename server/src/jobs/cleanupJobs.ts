/**
 * Cleanup Cron Jobs
 * Handles scheduled cleanup tasks for transactions and notifications
 * - Every 15 minutes: cleanup expired pending transactions
 * - Daily at 3 AM: cleanup old notifications
 */

import * as cron from 'node-cron';
import {
  cleanupExpiredPendingTransactions,
  cleanupOldNotifications,
  cleanupOldReadNotifications,
  runAllCleanupTasks,
  CleanupStats,
} from '../services/transactionCleanupService';

// Track if jobs are initialized
let isInitialized = false;

// Store job references for potential cleanup
// Using 'any' since node-cron types vary between versions
const scheduledJobs: any[] = [];

// Statistics tracking
let lastCleanupStats: CleanupStats | null = null;
let totalCleanupRuns = 0;
let totalExpiredTransactions = 0;
let totalDeletedNotifications = 0;

/**
 * Initialize all cleanup cron jobs
 */
export function initializeCleanupJobs(): void {
  if (isInitialized) {
    console.log('[CleanupJobs] Jobs already initialized, skipping...');
    return;
  }

  console.log('[CleanupJobs] Initializing cleanup cron jobs...');

  // Job 1: Cleanup expired pending transactions - runs every 15 minutes
  const expiredTransactionsJob = cron.schedule('*/15 * * * *', async () => {
    console.log('[CleanupJobs] Running expired transactions cleanup...');
    try {
      const count = await cleanupExpiredPendingTransactions();
      totalExpiredTransactions += count;
      totalCleanupRuns++;
      console.log(`[CleanupJobs] Expired transactions cleanup complete - marked ${count} as expired`);
    } catch (error) {
      console.error('[CleanupJobs] Expired transactions cleanup failed:', error);
    }
  }, {
    timezone: 'Asia/Jerusalem', // Israel timezone
  });
  scheduledJobs.push(expiredTransactionsJob);

  // Job 2: Cleanup old read notifications (30+ days) - runs daily at 3:00 AM
  const oldReadNotificationsJob = cron.schedule('0 3 * * *', async () => {
    console.log('[CleanupJobs] Running old read notifications cleanup...');
    try {
      const count = await cleanupOldReadNotifications();
      totalDeletedNotifications += count;
      console.log(`[CleanupJobs] Old read notifications cleanup complete - deleted ${count} notifications`);
    } catch (error) {
      console.error('[CleanupJobs] Old read notifications cleanup failed:', error);
    }
  }, {
    timezone: 'Asia/Jerusalem',
  });
  scheduledJobs.push(oldReadNotificationsJob);

  // Job 3: Cleanup old notifications (90+ days) - runs daily at 3:15 AM
  const oldNotificationsJob = cron.schedule('15 3 * * *', async () => {
    console.log('[CleanupJobs] Running old notifications cleanup...');
    try {
      const count = await cleanupOldNotifications();
      totalDeletedNotifications += count;
      console.log(`[CleanupJobs] Old notifications cleanup complete - deleted ${count} notifications`);
    } catch (error) {
      console.error('[CleanupJobs] Old notifications cleanup failed:', error);
    }
  }, {
    timezone: 'Asia/Jerusalem',
  });
  scheduledJobs.push(oldNotificationsJob);

  isInitialized = true;
  console.log('[CleanupJobs] All cleanup jobs initialized successfully');
  console.log('[CleanupJobs] Job schedule (Asia/Jerusalem timezone):');
  console.log('  - Every 15 min: Expired pending transactions cleanup');
  console.log('  - 03:00 AM: Old read notifications cleanup (30+ days)');
  console.log('  - 03:15 AM: Old notifications cleanup (90+ days)');
}

/**
 * Stop all cleanup cron jobs
 * Useful for graceful shutdown
 */
export function stopCleanupJobs(): void {
  console.log('[CleanupJobs] Stopping all cleanup jobs...');
  scheduledJobs.forEach(job => job.stop());
  isInitialized = false;
  console.log('[CleanupJobs] All jobs stopped');
}

/**
 * Manually trigger all cleanup jobs (for testing/admin)
 */
export async function runAllCleanupJobsNow(): Promise<CleanupStats> {
  console.log('[CleanupJobs] Manually running all cleanup jobs...');

  const stats = await runAllCleanupTasks();

  // Update tracking
  lastCleanupStats = stats;
  totalCleanupRuns++;
  totalExpiredTransactions += stats.expiredTransactions;
  totalDeletedNotifications += stats.oldNotifications + stats.oldReadNotifications;

  return stats;
}

/**
 * Check if jobs are running
 */
export function areCleanupJobsRunning(): boolean {
  return isInitialized;
}

/**
 * Get cleanup statistics
 */
export function getCleanupStats(): {
  isRunning: boolean;
  totalRuns: number;
  totalExpiredTransactions: number;
  totalDeletedNotifications: number;
  lastStats: CleanupStats | null;
} {
  return {
    isRunning: isInitialized,
    totalRuns: totalCleanupRuns,
    totalExpiredTransactions,
    totalDeletedNotifications,
    lastStats: lastCleanupStats,
  };
}

export default {
  initializeCleanupJobs,
  stopCleanupJobs,
  runAllCleanupJobsNow,
  areCleanupJobsRunning,
  getCleanupStats,
};
