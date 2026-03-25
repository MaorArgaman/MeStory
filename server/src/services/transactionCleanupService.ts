/**
 * Transaction Cleanup Service
 * Handles cleanup of expired transactions and old notifications
 */

import { supabaseAdmin } from '../config/supabase';

// Cleanup statistics interface
export interface CleanupStats {
  expiredTransactions: number;
  oldNotifications: number;
  oldReadNotifications: number;
  timestamp: string;
}

/**
 * Mark pending transactions as 'expired' if they've been pending for more than 30 minutes
 * @returns Number of transactions marked as expired
 */
export async function cleanupExpiredPendingTransactions(): Promise<number> {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
      .from('transactions')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString(),
      })
      .eq('status', 'pending')
      .lt('created_at', thirtyMinutesAgo)
      .select('id');

    if (error) {
      console.error('[TransactionCleanup] Error marking transactions as expired:', error);
      return 0;
    }

    const count = data?.length || 0;
    if (count > 0) {
      console.log(`[TransactionCleanup] Marked ${count} pending transactions as expired`);
    }
    return count;
  } catch (error) {
    console.error('[TransactionCleanup] Failed to cleanup expired transactions:', error);
    return 0;
  }
}

/**
 * Delete notifications older than 90 days
 * @returns Number of notifications deleted
 */
export async function cleanupOldNotifications(): Promise<number> {
  try {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    // First count how many will be deleted
    const { count: countToDelete } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .lt('created_at', ninetyDaysAgo);

    if (!countToDelete || countToDelete === 0) {
      return 0;
    }

    // Delete notifications older than 90 days
    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .lt('created_at', ninetyDaysAgo);

    if (error) {
      console.error('[TransactionCleanup] Error deleting old notifications:', error);
      return 0;
    }

    console.log(`[TransactionCleanup] Deleted ${countToDelete} notifications older than 90 days`);
    return countToDelete;
  } catch (error) {
    console.error('[TransactionCleanup] Failed to cleanup old notifications:', error);
    return 0;
  }
}

/**
 * Delete read notifications older than 30 days
 * @returns Number of read notifications deleted
 */
export async function cleanupOldReadNotifications(): Promise<number> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // First count how many will be deleted
    const { count: countToDelete } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', true)
      .lt('created_at', thirtyDaysAgo);

    if (!countToDelete || countToDelete === 0) {
      return 0;
    }

    // Delete read notifications older than 30 days
    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('is_read', true)
      .lt('created_at', thirtyDaysAgo);

    if (error) {
      console.error('[TransactionCleanup] Error deleting old read notifications:', error);
      return 0;
    }

    console.log(`[TransactionCleanup] Deleted ${countToDelete} read notifications older than 30 days`);
    return countToDelete;
  } catch (error) {
    console.error('[TransactionCleanup] Failed to cleanup old read notifications:', error);
    return 0;
  }
}

/**
 * Run all cleanup tasks and return statistics
 * @returns Cleanup statistics
 */
export async function runAllCleanupTasks(): Promise<CleanupStats> {
  console.log('[TransactionCleanup] Starting all cleanup tasks...');

  const expiredTransactions = await cleanupExpiredPendingTransactions();
  const oldReadNotifications = await cleanupOldReadNotifications();
  const oldNotifications = await cleanupOldNotifications();

  const stats: CleanupStats = {
    expiredTransactions,
    oldNotifications,
    oldReadNotifications,
    timestamp: new Date().toISOString(),
  };

  console.log('[TransactionCleanup] Cleanup complete:', stats);
  return stats;
}

export default {
  cleanupExpiredPendingTransactions,
  cleanupOldNotifications,
  cleanupOldReadNotifications,
  runAllCleanupTasks,
};
