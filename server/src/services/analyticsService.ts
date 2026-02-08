// mongoose kept for potential future use
import { Book } from '../models/Book';
import { User } from '../models/User';
import { UserActivity } from '../models/UserActivity';

/**
 * Analytics Service
 * Provides platform-wide analytics for admin dashboard
 */

export interface PlatformMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisWeek: number;
  totalBooks: number;
  publishedBooks: number;
  newBooksThisWeek: number;
  totalRevenue: number;
  averageQualityScore: number;
}

export interface UserChurnData {
  userId: string;
  name: string;
  email: string;
  lastActiveAt: Date;
  daysSinceActive: number;
  booksStarted: number;
  booksCompleted: number;
  registeredAt: Date;
}

export interface TopAuthorData {
  authorId: string;
  name: string;
  email: string;
  avatar?: string;
  totalBooks: number;
  totalViews: number;
  totalPurchases: number;
  totalRevenue: number;
  averageQuality: number;
  engagementScore: number;
}

export interface GenreAnalytics {
  genre: string;
  bookCount: number;
  totalViews: number;
  totalPurchases: number;
  averageQuality: number;
  growthRate: number; // % change from last month
}

export interface BookPerformance {
  bookId: string;
  title: string;
  author: string;
  genre: string;
  views: number;
  purchases: number;
  revenue: number;
  qualityScore: number;
  publishedAt: Date;
  performanceScore: number;
}

/**
 * Get platform-wide metrics overview
 */
export async function getPlatformMetrics(): Promise<PlatformMetrics> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // User metrics
  const totalUsers = await User.countDocuments();
  const activeUsers = await UserActivity.countDocuments({
    lastActiveAt: { $gte: monthAgo },
  });
  const newUsersThisWeek = await User.countDocuments({
    createdAt: { $gte: weekAgo },
  });

  // Book metrics
  const totalBooks = await Book.countDocuments();
  const publishedBooks = await Book.countDocuments({
    'publishingStatus.status': 'published',
  });
  const newBooksThisWeek = await Book.countDocuments({
    createdAt: { $gte: weekAgo },
  });

  // Revenue and quality
  const revenueResult = await Book.aggregate([
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$statistics.revenue' },
        avgQuality: { $avg: '$qualityScore.overallScore' },
      },
    },
  ]);

  return {
    totalUsers,
    activeUsers,
    newUsersThisWeek,
    totalBooks,
    publishedBooks,
    newBooksThisWeek,
    totalRevenue: revenueResult[0]?.totalRevenue || 0,
    averageQualityScore: revenueResult[0]?.avgQuality || 0,
  };
}

/**
 * Get users who started but stopped using the platform (churn analysis)
 */
export async function getChurnedUsers(
  daysInactive: number = 30,
  limit: number = 50
): Promise<UserChurnData[]> {
  const cutoffDate = new Date(Date.now() - daysInactive * 24 * 60 * 60 * 1000);

  // Find users who were active but haven't been active recently
  const churnedActivities = await UserActivity.find({
    lastActiveAt: { $lt: cutoffDate },
    totalBooksRead: { $gt: 0 }, // Had some activity
  })
    .sort({ lastActiveAt: -1 })
    .limit(limit)
    .lean();

  const userIds = churnedActivities.map((a) => a.userId);
  const users = await User.find({ _id: { $in: userIds } }).lean();

  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  return churnedActivities.map((activity) => {
    const user = userMap.get(activity.userId.toString());
    const daysSinceActive = Math.floor(
      (Date.now() - new Date(activity.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      userId: activity.userId.toString(),
      name: user?.name || 'Unknown',
      email: user?.email || 'Unknown',
      lastActiveAt: activity.lastActiveAt,
      daysSinceActive,
      booksStarted: activity.currentlyReading.length + activity.completedBooks.length,
      booksCompleted: activity.completedBooks.length,
      registeredAt: user?.createdAt || new Date(),
    };
  });
}

/**
 * Get new users who haven't engaged yet
 */
export async function getNewUsersWithoutEngagement(
  daysSinceRegistration: number = 7,
  limit: number = 50
): Promise<any[]> {
  const cutoffDate = new Date(Date.now() - daysSinceRegistration * 24 * 60 * 60 * 1000);

  // Get users registered recently
  const recentUsers = await User.find({
    createdAt: { $gte: cutoffDate },
  }).lean();

  const recentUserIds = recentUsers.map((u) => u._id.toString());

  // Find which ones have activity
  const usersWithActivity = await UserActivity.find({
    userId: { $in: recentUserIds },
    $or: [
      { totalBooksRead: { $gt: 0 } },
      { totalBooksWritten: { $gt: 0 } },
    ],
  }).select('userId').lean();

  const activeUserIds = new Set(usersWithActivity.map((a) => a.userId.toString()));

  // Filter to users without engagement
  return recentUsers
    .filter((u) => !activeUserIds.has(u._id.toString()))
    .slice(0, limit)
    .map((u) => ({
      userId: u._id.toString(),
      name: u.name,
      email: u.email,
      registeredAt: u.createdAt,
      daysSinceRegistration: Math.floor(
        (Date.now() - new Date(u.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));
}

/**
 * Get top performing authors
 */
export async function getTopAuthors(limit: number = 20): Promise<TopAuthorData[]> {
  const result = await Book.aggregate([
    {
      $match: {
        'publishingStatus.status': 'published',
      },
    },
    {
      $group: {
        _id: '$author',
        totalBooks: { $sum: 1 },
        totalViews: { $sum: '$statistics.views' },
        totalPurchases: { $sum: '$statistics.purchases' },
        totalRevenue: { $sum: '$statistics.revenue' },
        avgQuality: { $avg: '$qualityScore.overallScore' },
      },
    },
    {
      $addFields: {
        engagementScore: {
          $add: [
            { $multiply: ['$totalBooks', 10] },
            { $multiply: ['$totalViews', 0.1] },
            { $multiply: ['$totalPurchases', 5] },
            { $multiply: [{ $ifNull: ['$avgQuality', 50] }, 0.5] },
            { $multiply: ['$totalRevenue', 0.2] },
          ],
        },
      },
    },
    { $sort: { engagementScore: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'authorInfo',
      },
    },
    { $unwind: '$authorInfo' },
  ]);

  return result.map((r) => ({
    authorId: r._id.toString(),
    name: r.authorInfo.name,
    email: r.authorInfo.email,
    avatar: r.authorInfo.profile?.avatar,
    totalBooks: r.totalBooks,
    totalViews: r.totalViews,
    totalPurchases: r.totalPurchases,
    totalRevenue: r.totalRevenue,
    averageQuality: r.avgQuality || 0,
    engagementScore: r.engagementScore,
  }));
}

/**
 * Get genre analytics
 */
export async function getGenreAnalytics(): Promise<GenreAnalytics[]> {
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Current month stats
  const currentStats = await Book.aggregate([
    {
      $match: {
        'publishingStatus.status': 'published',
      },
    },
    {
      $group: {
        _id: '$genre',
        bookCount: { $sum: 1 },
        totalViews: { $sum: '$statistics.views' },
        totalPurchases: { $sum: '$statistics.purchases' },
        avgQuality: { $avg: '$qualityScore.overallScore' },
      },
    },
    { $sort: { totalViews: -1 } },
  ]);

  // Last month stats for growth calculation
  const lastMonthStats = await Book.aggregate([
    {
      $match: {
        'publishingStatus.status': 'published',
        createdAt: { $lt: monthAgo, $gte: twoMonthsAgo },
      },
    },
    {
      $group: {
        _id: '$genre',
        bookCount: { $sum: 1 },
      },
    },
  ]);

  const lastMonthMap = new Map(lastMonthStats.map((s) => [s._id, s.bookCount]));

  return currentStats.map((stat) => {
    const lastMonthCount = lastMonthMap.get(stat._id) || 0;
    const growthRate = lastMonthCount > 0
      ? ((stat.bookCount - lastMonthCount) / lastMonthCount) * 100
      : 100;

    return {
      genre: stat._id,
      bookCount: stat.bookCount,
      totalViews: stat.totalViews,
      totalPurchases: stat.totalPurchases,
      averageQuality: stat.avgQuality || 0,
      growthRate: Math.round(growthRate * 10) / 10,
    };
  });
}

/**
 * Get top performing books
 */
export async function getTopBooks(
  limit: number = 20,
  sortBy: 'views' | 'purchases' | 'quality' | 'revenue' = 'views'
): Promise<BookPerformance[]> {
  const sortField = {
    views: 'statistics.views',
    purchases: 'statistics.purchases',
    quality: 'qualityScore.overallScore',
    revenue: 'statistics.revenue',
  }[sortBy];

  const books = await Book.find({
    'publishingStatus.status': 'published',
  })
    .sort({ [sortField]: -1 })
    .limit(limit)
    .populate('author', 'name')
    .lean();

  return books.map((book) => ({
    bookId: book._id.toString(),
    title: book.title,
    author: (book.author as any).name || 'Unknown',
    genre: book.genre,
    views: book.statistics.views,
    purchases: book.statistics.purchases,
    revenue: book.statistics.revenue,
    qualityScore: book.qualityScore?.overallScore || 0,
    publishedAt: book.publishingStatus.publishedAt || book.createdAt,
    performanceScore:
      book.statistics.views * 0.1 +
      book.statistics.purchases * 5 +
      (book.qualityScore?.overallScore || 50) * 0.5,
  }));
}

/**
 * Get daily activity trends
 */
export async function getDailyActivityTrends(days: number = 30): Promise<any[]> {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const trends = await UserActivity.aggregate([
    {
      $match: {
        'interactionEvents.timestamp': { $gte: startDate },
      },
    },
    { $unwind: '$interactionEvents' },
    {
      $match: {
        'interactionEvents.timestamp': { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$interactionEvents.timestamp',
            },
          },
          type: '$interactionEvents.type',
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.date',
        interactions: {
          $push: {
            type: '$_id.type',
            count: '$count',
          },
        },
        totalInteractions: { $sum: '$count' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return trends.map((t) => ({
    date: t._id,
    totalInteractions: t.totalInteractions,
    breakdown: t.interactions.reduce((acc: any, curr: any) => {
      acc[curr.type] = curr.count;
      return acc;
    }, {}),
  }));
}

/**
 * Get books that need quality evaluation
 */
export async function getBooksNeedingEvaluation(limit: number = 50): Promise<any[]> {
  const books = await Book.find({
    'publishingStatus.status': 'published',
    $or: [
      { qualityScore: { $exists: false } },
      { 'qualityScore.overallScore': { $exists: false } },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('author', 'name')
    .lean();

  return books.map((book) => ({
    bookId: book._id.toString(),
    title: book.title,
    author: (book.author as any).name,
    genre: book.genre,
    wordCount: book.statistics.wordCount,
    publishedAt: book.publishingStatus.publishedAt,
  }));
}

/**
 * Get user engagement funnel
 */
export async function getEngagementFunnel(): Promise<any> {
  const totalUsers = await User.countDocuments();

  const usersWithActivity = await UserActivity.countDocuments({
    $or: [
      { totalBooksRead: { $gt: 0 } },
      { totalBooksWritten: { $gt: 0 } },
    ],
  });

  const usersWithPurchases = await UserActivity.countDocuments({
    'interactionEvents.type': 'purchase',
  });

  const usersCompleted = await UserActivity.countDocuments({
    completedBooks: { $ne: [] },
  });

  const usersWriting = await UserActivity.countDocuments({
    totalBooksWritten: { $gt: 0 },
  });

  return {
    registered: totalUsers,
    engaged: usersWithActivity,
    readers: usersCompleted,
    purchasers: usersWithPurchases,
    writers: usersWriting,
    conversionRates: {
      registeredToEngaged: totalUsers > 0 ? (usersWithActivity / totalUsers * 100).toFixed(1) : 0,
      engagedToReader: usersWithActivity > 0 ? (usersCompleted / usersWithActivity * 100).toFixed(1) : 0,
      readerToPurchaser: usersCompleted > 0 ? (usersWithPurchases / usersCompleted * 100).toFixed(1) : 0,
    },
  };
}

// ==================== RETENTION & COHORT ANALYSIS ====================

export interface RetentionCohort {
  cohortMonth: string;
  totalUsers: number;
  retainedByWeek: number[];
  retentionRates: number[];
}

/**
 * Get retention cohort analysis
 * Shows how users from each month retain over time
 */
export async function getRetentionCohorts(monthsBack: number = 6): Promise<RetentionCohort[]> {
  const cohorts: RetentionCohort[] = [];
  const now = new Date();

  for (let i = monthsBack - 1; i >= 0; i--) {
    const cohortStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const cohortEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

    // Get users registered in this cohort
    const cohortUsers = await User.find({
      createdAt: { $gte: cohortStart, $lte: cohortEnd },
    }).select('_id').lean();

    const totalUsers = cohortUsers.length;
    if (totalUsers === 0) continue;

    const userIds = cohortUsers.map((u) => u._id.toString());
    const retainedByWeek: number[] = [];
    const retentionRates: number[] = [];

    // Check retention for each week after registration
    const weeksToCheck = Math.min(12, Math.floor((now.getTime() - cohortStart.getTime()) / (7 * 24 * 60 * 60 * 1000)));

    for (let week = 1; week <= weeksToCheck; week++) {
      const weekStart = new Date(cohortStart.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(cohortStart.getTime() + week * 7 * 24 * 60 * 60 * 1000);

      // Count users who were active in this week
      const activeInWeek = await UserActivity.countDocuments({
        userId: { $in: userIds },
        'interactionEvents.timestamp': { $gte: weekStart, $lt: weekEnd },
      });

      retainedByWeek.push(activeInWeek);
      retentionRates.push(Math.round((activeInWeek / totalUsers) * 100));
    }

    cohorts.push({
      cohortMonth: cohortStart.toISOString().slice(0, 7), // YYYY-MM format
      totalUsers,
      retainedByWeek,
      retentionRates,
    });
  }

  return cohorts;
}

// ==================== LIFETIME VALUE (LTV) ====================

export interface UserLTV {
  userId: string;
  name: string;
  totalSpent: number;
  subscriptionValue: number;
  bookPurchases: number;
  projectedLTV: number;
  userSegment: 'high' | 'medium' | 'low';
}

/**
 * Calculate lifetime value for a specific user
 */
export async function calculateUserLTV(userId: string): Promise<UserLTV | null> {
  const user = await User.findById(userId).lean();
  if (!user) return null;

  const userActivity = await UserActivity.findOne({ userId }).lean();

  // Get purchase history from interactions
  const purchaseEvents = userActivity?.interactionEvents.filter(
    (e) => e.type === 'purchase'
  ) || [];

  // Calculate total from book purchases
  let bookPurchasesTotal = 0;
  for (const event of purchaseEvents) {
    if (event.metadata?.amount) {
      bookPurchasesTotal += event.metadata.amount;
    }
  }

  // Calculate subscription value (simplified)
  const tier = user.subscription?.tier;
  const subscriptionValue = tier === 'premium' ? 99 :
    tier === 'standard' ? 49 : 0;

  // Days since registration
  const daysSinceRegistration = Math.max(1, Math.floor(
    (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  ));

  const totalSpent = bookPurchasesTotal + subscriptionValue;

  // Project LTV based on average spending rate
  const dailySpendRate = totalSpent / daysSinceRegistration;
  const projectedLTV = dailySpendRate * 365; // 1 year projection

  // Segment user
  let userSegment: 'high' | 'medium' | 'low' = 'low';
  if (projectedLTV > 200) userSegment = 'high';
  else if (projectedLTV > 50) userSegment = 'medium';

  return {
    userId: user._id.toString(),
    name: user.name,
    totalSpent,
    subscriptionValue,
    bookPurchases: bookPurchasesTotal,
    projectedLTV: Math.round(projectedLTV * 100) / 100,
    userSegment,
  };
}

/**
 * Get average LTV by user segment
 */
export async function getAverageLTVBySegment(): Promise<{
  overall: number;
  byPlan: Record<string, number>;
  byEngagement: Record<string, number>;
}> {
  const users = await User.find().lean();
  const ltvData: number[] = [];
  const byPlan: Record<string, number[]> = { FREE: [], STANDARD: [], PREMIUM: [] };
  const byEngagement: Record<string, number[]> = { high: [], medium: [], low: [] };

  for (const user of users.slice(0, 500)) { // Limit for performance
    const ltv = await calculateUserLTV(user._id.toString());
    if (ltv) {
      ltvData.push(ltv.projectedLTV);
      byPlan[user.subscription?.tier?.toUpperCase() || 'FREE'].push(ltv.projectedLTV);
      byEngagement[ltv.userSegment].push(ltv.projectedLTV);
    }
  }

  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  return {
    overall: Math.round(avg(ltvData) * 100) / 100,
    byPlan: {
      FREE: Math.round(avg(byPlan.FREE) * 100) / 100,
      STANDARD: Math.round(avg(byPlan.STANDARD) * 100) / 100,
      PREMIUM: Math.round(avg(byPlan.PREMIUM) * 100) / 100,
    },
    byEngagement: {
      high: Math.round(avg(byEngagement.high) * 100) / 100,
      medium: Math.round(avg(byEngagement.medium) * 100) / 100,
      low: Math.round(avg(byEngagement.low) * 100) / 100,
    },
  };
}

// ==================== PREDICTIVE CHURN ====================

export interface ChurnPrediction {
  userId: string;
  name: string;
  email: string;
  churnProbability: number;
  riskFactors: string[];
  lastActiveAt: Date;
  recommendedAction: string;
}

/**
 * Calculate churn probability for a user
 */
function calculateChurnProbability(userActivity: any, user: any): {
  probability: number;
  riskFactors: string[];
} {
  const riskFactors: string[] = [];
  let riskScore = 0;

  // Days since last activity
  const daysSinceActive = Math.floor(
    (Date.now() - new Date(userActivity.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceActive > 14) {
    riskScore += 0.25;
    riskFactors.push('Inactive for 2+ weeks');
  }
  if (daysSinceActive > 30) {
    riskScore += 0.2;
    riskFactors.push('Inactive for 1+ month');
  }

  // Abandoned books ratio
  const totalStarted =
    userActivity.currentlyReading.length +
    userActivity.completedBooks.length +
    userActivity.abandonedBooks.length;
  if (totalStarted > 0) {
    const abandonRate = userActivity.abandonedBooks.length / totalStarted;
    if (abandonRate > 0.5) {
      riskScore += 0.2;
      riskFactors.push('High book abandonment rate (>50%)');
    }
  }

  // Declining activity streak
  if (userActivity.currentStreak === 0 && userActivity.longestStreak > 7) {
    riskScore += 0.15;
    riskFactors.push('Broken activity streak');
  }

  // Low engagement depth
  if (userActivity.totalBooksRead < 1 && userActivity.totalBooksWritten < 1) {
    riskScore += 0.15;
    riskFactors.push('No completed activities');
  }

  // Recent interaction frequency decline
  const recentEvents = userActivity.interactionEvents.filter((e: any) => {
    const daysSince = (Date.now() - new Date(e.timestamp).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 30;
  });
  const olderEvents = userActivity.interactionEvents.filter((e: any) => {
    const daysSince = (Date.now() - new Date(e.timestamp).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince > 30 && daysSince <= 60;
  });
  if (olderEvents.length > 0 && recentEvents.length < olderEvents.length * 0.5) {
    riskScore += 0.15;
    riskFactors.push('Activity declining');
  }

  // Free tier without engagement
  if (user.subscription?.plan === 'FREE' && userActivity.totalBooksRead < 2) {
    riskScore += 0.1;
    riskFactors.push('Free tier with low engagement');
  }

  return {
    probability: Math.min(riskScore, 1),
    riskFactors,
  };
}

/**
 * Get users predicted to churn
 */
export async function getPredictedChurnUsers(
  threshold: number = 0.5,
  limit: number = 50
): Promise<ChurnPrediction[]> {
  const predictions: ChurnPrediction[] = [];

  // Get active users (to predict potential churn)
  const activities = await UserActivity.find({
    lastActiveAt: { $exists: true },
  })
    .limit(500) // Limit for performance
    .lean();

  const userIds = activities.map((a) => a.userId);
  const users = await User.find({ _id: { $in: userIds } }).lean();
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  for (const activity of activities) {
    const user = userMap.get(activity.userId.toString());
    if (!user) continue;

    const { probability, riskFactors } = calculateChurnProbability(activity, user);

    if (probability >= threshold) {
      let recommendedAction = 'Send engagement email';
      if (probability > 0.7) {
        recommendedAction = 'Personal outreach recommended';
      } else if (riskFactors.includes('High book abandonment rate (>50%)')) {
        recommendedAction = 'Recommend shorter, easier books';
      }

      predictions.push({
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        churnProbability: Math.round(probability * 100) / 100,
        riskFactors,
        lastActiveAt: activity.lastActiveAt,
        recommendedAction,
      });
    }
  }

  // Sort by probability descending
  predictions.sort((a, b) => b.churnProbability - a.churnProbability);
  return predictions.slice(0, limit);
}

// ==================== REAL-TIME ACTIVITY ====================

export interface RealTimeActivity {
  activeNow: number;
  reading: number;
  writing: number;
  browsing: number;
  recentPurchases: number;
  recentSignups: number;
  recentPublished: number;
}

/**
 * Get real-time activity snapshot
 */
export async function getRealTimeActivity(): Promise<RealTimeActivity> {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // Active users in last 15 minutes
  const activeNow = await UserActivity.countDocuments({
    lastActiveAt: { $gte: fifteenMinutesAgo },
  });

  // Breakdown by recent activity type
  const recentActivities = await UserActivity.aggregate([
    { $unwind: '$interactionEvents' },
    {
      $match: {
        'interactionEvents.timestamp': { $gte: fifteenMinutesAgo },
      },
    },
    {
      $group: {
        _id: '$interactionEvents.type',
        count: { $sum: 1 },
      },
    },
  ]);

  const activityMap = new Map(recentActivities.map((a) => [a._id, a.count]));

  // Recent purchases (last hour)
  const recentPurchases = await UserActivity.countDocuments({
    'interactionEvents': {
      $elemMatch: {
        type: 'purchase',
        timestamp: { $gte: oneHourAgo },
      },
    },
  });

  // Recent signups (last hour)
  const recentSignups = await User.countDocuments({
    createdAt: { $gte: oneHourAgo },
  });

  // Recently published books (last hour)
  const recentPublished = await Book.countDocuments({
    'publishingStatus.publishedAt': { $gte: oneHourAgo },
  });

  return {
    activeNow,
    reading: activityMap.get('read') || 0,
    writing: 0, // Would need separate tracking
    browsing: activityMap.get('view') || 0,
    recentPurchases,
    recentSignups,
    recentPublished,
  };
}

// ==================== REVENUE ANALYTICS ====================

export interface RevenueAnalytics {
  period: string;
  totalRevenue: number;
  bookSalesRevenue: number;
  subscriptionRevenue: number;
  averageOrderValue: number;
  revenueByGenre: Array<{ genre: string; revenue: number }>;
  topEarningAuthors: Array<{ authorId: string; name: string; revenue: number }>;
  revenueGrowth: number;
}

/**
 * Get revenue analytics for a period
 */
export async function getRevenueAnalytics(
  period: 'day' | 'week' | 'month' = 'month'
): Promise<RevenueAnalytics> {
  const periodDays = period === 'day' ? 1 : period === 'week' ? 7 : 30;
  const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
  // previousStart kept for future period comparison feature
  const _previousStart = new Date(Date.now() - periodDays * 2 * 24 * 60 * 60 * 1000);

  // Book sales revenue
  const bookRevenue = await Book.aggregate([
    {
      $match: {
        'publishingStatus.status': 'published',
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$statistics.revenue' },
      },
    },
  ]);

  // Revenue by genre
  const revenueByGenre = await Book.aggregate([
    {
      $match: {
        'publishingStatus.status': 'published',
        'statistics.revenue': { $gt: 0 },
      },
    },
    {
      $group: {
        _id: '$genre',
        revenue: { $sum: '$statistics.revenue' },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 },
  ]);

  // Top earning authors
  const topAuthors = await Book.aggregate([
    {
      $match: {
        'publishingStatus.status': 'published',
        'statistics.revenue': { $gt: 0 },
      },
    },
    {
      $group: {
        _id: '$author',
        revenue: { $sum: '$statistics.revenue' },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'authorInfo',
      },
    },
    { $unwind: '$authorInfo' },
  ]);

  // Calculate subscription revenue (simplified estimate)
  const premiumUsers = await User.countDocuments({ 'subscription.plan': 'PREMIUM' });
  const standardUsers = await User.countDocuments({ 'subscription.plan': 'STANDARD' });
  const subscriptionRevenue = (premiumUsers * 99 + standardUsers * 49) / 12 * (periodDays / 30);

  const totalRevenue = (bookRevenue[0]?.totalRevenue || 0) + subscriptionRevenue;

  // Calculate growth (simplified)
  const previousPeriodRevenue = totalRevenue * 0.9; // Placeholder
  const revenueGrowth = previousPeriodRevenue > 0
    ? ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100
    : 0;

  // Average order value (from purchases)
  const purchaseCount = await UserActivity.aggregate([
    { $unwind: '$interactionEvents' },
    {
      $match: {
        'interactionEvents.type': 'purchase',
        'interactionEvents.timestamp': { $gte: startDate },
      },
    },
    { $count: 'total' },
  ]);

  const totalPurchases = purchaseCount[0]?.total || 1;
  const averageOrderValue = (bookRevenue[0]?.totalRevenue || 0) / totalPurchases;

  return {
    period,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    bookSalesRevenue: Math.round((bookRevenue[0]?.totalRevenue || 0) * 100) / 100,
    subscriptionRevenue: Math.round(subscriptionRevenue * 100) / 100,
    averageOrderValue: Math.round(averageOrderValue * 100) / 100,
    revenueByGenre: revenueByGenre.map((r) => ({
      genre: r._id || 'Unknown',
      revenue: Math.round(r.revenue * 100) / 100,
    })),
    topEarningAuthors: topAuthors.map((a) => ({
      authorId: a._id.toString(),
      name: a.authorInfo.name,
      revenue: Math.round(a.revenue * 100) / 100,
    })),
    revenueGrowth: Math.round(revenueGrowth * 10) / 10,
  };
}

// ==================== SOCIAL ENGAGEMENT ANALYTICS ====================

export interface SocialEngagementOverview {
  totalLikes: number;
  totalShares: number;
  totalComments: number;
  totalConversations: number;
  totalMessages: number;
  averageLikesPerBook: number;
  averageSharesPerBook: number;
  averageCommentsPerBook: number;
  likesGrowth: number; // % change from previous period
  sharesGrowth: number;
  commentsGrowth: number;
}

export interface EngagedUser {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  totalLikes: number;
  totalShares: number;
  totalComments: number;
  conversationsStarted: number;
  messagesSent: number;
  engagementScore: number;
  joinedAt: Date;
}

export interface TopEngagedBook {
  bookId: string;
  title: string;
  authorName: string;
  likes: number;
  shares: number;
  comments: number;
  engagementScore: number;
  socialVelocity: number; // Engagement growth rate
}

/**
 * Get social engagement overview metrics
 */
export async function getSocialEngagementOverview(): Promise<SocialEngagementOverview> {
  // Get current totals
  const bookStats = await Book.aggregate([
    {
      $match: { 'publishingStatus.status': 'published' },
    },
    {
      $group: {
        _id: null,
        totalLikes: { $sum: '$likes' },
        totalShares: { $sum: '$statistics.shares' },
        totalComments: { $sum: '$statistics.totalReviews' },
        bookCount: { $sum: 1 },
      },
    },
  ]);

  // Get messaging stats (if Message model exists)
  let totalConversations = 0;
  let totalMessages = 0;
  try {
    const { Conversation, Message } = await import('../models/Message');
    totalConversations = await Conversation.countDocuments({ isActive: true });
    totalMessages = await Message.countDocuments();
  } catch {
    // Message model might not exist
  }

  // Calculate previous period stats for growth calculation
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const previousPeriodStats = await UserActivity.aggregate([
    { $unwind: '$interactionEvents' },
    {
      $match: {
        'interactionEvents.timestamp': { $lt: thirtyDaysAgo },
        'interactionEvents.type': { $in: ['like', 'share', 'comment'] },
      },
    },
    {
      $group: {
        _id: '$interactionEvents.type',
        count: { $sum: 1 },
      },
    },
  ]);

  const prevStats = new Map(previousPeriodStats.map((s) => [s._id, s.count]));
  const currentStats = bookStats[0] || { totalLikes: 0, totalShares: 0, totalComments: 0, bookCount: 1 };

  // Calculate growth rates
  const calcGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  };

  return {
    totalLikes: currentStats.totalLikes,
    totalShares: currentStats.totalShares,
    totalComments: currentStats.totalComments,
    totalConversations,
    totalMessages,
    averageLikesPerBook: Math.round((currentStats.totalLikes / currentStats.bookCount) * 10) / 10,
    averageSharesPerBook: Math.round((currentStats.totalShares / currentStats.bookCount) * 10) / 10,
    averageCommentsPerBook: Math.round((currentStats.totalComments / currentStats.bookCount) * 10) / 10,
    likesGrowth: calcGrowth(currentStats.totalLikes, prevStats.get('like') || 0),
    sharesGrowth: calcGrowth(currentStats.totalShares, prevStats.get('share') || 0),
    commentsGrowth: calcGrowth(currentStats.totalComments, prevStats.get('comment') || 0),
  };
}

/**
 * Get most engaged users
 */
export async function getMostEngagedUsers(limit: number = 20): Promise<EngagedUser[]> {
  // Get messaging stats
  let conversationsByUser: Map<string, number> = new Map();
  let messagesByUser: Map<string, number> = new Map();

  try {
    const { Conversation, Message } = await import('../models/Message');

    const convStats = await Conversation.aggregate([
      { $unwind: '$participants' },
      { $group: { _id: '$participants', count: { $sum: 1 } } },
    ]);
    conversationsByUser = new Map(convStats.map((s) => [s._id.toString(), s.count]));

    const msgStats = await Message.aggregate([
      { $group: { _id: '$sender', count: { $sum: 1 } } },
    ]);
    messagesByUser = new Map(msgStats.map((s) => [s._id.toString(), s.count]));
  } catch {
    // Ignore if models don't exist
  }

  // Get interaction stats from UserActivity
  const engagementStats = await UserActivity.aggregate([
    { $unwind: '$interactionEvents' },
    {
      $match: {
        'interactionEvents.type': { $in: ['like', 'share', 'comment', 'review'] },
      },
    },
    {
      $group: {
        _id: {
          userId: '$userId',
          type: '$interactionEvents.type',
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.userId',
        interactions: {
          $push: { type: '$_id.type', count: '$count' },
        },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userInfo',
      },
    },
    { $unwind: '$userInfo' },
  ]);

  const users: EngagedUser[] = engagementStats.map((stat) => {
    const interactionMap = new Map(stat.interactions.map((i: any) => [i.type, i.count]));
    const likes = Number(interactionMap.get('like') || 0);
    const shares = Number(interactionMap.get('share') || 0);
    const comments = Number(interactionMap.get('comment') || 0) + Number(interactionMap.get('review') || 0);
    const conversations = conversationsByUser.get(stat._id.toString()) || 0;
    const messages = messagesByUser.get(stat._id.toString()) || 0;

    // Calculate engagement score
    const engagementScore =
      likes * 1 +
      shares * 5 +
      comments * 3 +
      conversations * 2 +
      messages * 0.5;

    return {
      userId: stat._id.toString(),
      name: stat.userInfo.name,
      email: stat.userInfo.email,
      avatar: stat.userInfo.profile?.avatar,
      totalLikes: likes,
      totalShares: shares,
      totalComments: comments,
      conversationsStarted: conversations,
      messagesSent: messages,
      engagementScore: Math.round(engagementScore * 10) / 10,
      joinedAt: stat.userInfo.createdAt,
    };
  });

  // Sort by engagement score and return top users
  return users
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, limit);
}

/**
 * Get top engaged books by social metrics
 */
export async function getTopEngagedBooks(limit: number = 20): Promise<TopEngagedBook[]> {
  const books = await Book.find({
    'publishingStatus.status': 'published',
    $or: [
      { likes: { $gt: 0 } },
      { 'statistics.shares': { $gt: 0 } },
      { 'statistics.totalReviews': { $gt: 0 } },
    ],
  })
    .sort({ likes: -1 })
    .limit(limit * 2) // Get extra for scoring
    .populate('author', 'name')
    .lean();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const results: TopEngagedBook[] = [];

  for (const book of books) {
    // Calculate recent engagement for velocity
    const recentEngagement = await UserActivity.countDocuments({
      'interactionEvents.bookId': book._id,
      'interactionEvents.type': { $in: ['like', 'share', 'comment'] },
      'interactionEvents.timestamp': { $gte: weekAgo },
    });

    const likes = book.likes || 0;
    const shares = book.statistics?.shares || 0;
    const comments = book.statistics?.totalReviews || 0;

    // Calculate engagement score with weighted components
    const engagementScore =
      likes * 1 +
      shares * 5 + // Shares are valuable (viral)
      comments * 3; // Comments indicate deep engagement

    results.push({
      bookId: book._id.toString(),
      title: book.title,
      authorName: (book.author as any)?.name || 'Unknown',
      likes,
      shares,
      comments,
      engagementScore,
      socialVelocity: recentEngagement, // How active this week
    });
  }

  // Sort by engagement score
  return results
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, limit);
}

/**
 * Get engagement trends over time
 */
export async function getSocialEngagementTrends(days: number = 30): Promise<any[]> {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const trends = await UserActivity.aggregate([
    { $unwind: '$interactionEvents' },
    {
      $match: {
        'interactionEvents.timestamp': { $gte: startDate },
        'interactionEvents.type': { $in: ['like', 'share', 'comment', 'review'] },
      },
    },
    {
      $group: {
        _id: {
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$interactionEvents.timestamp',
            },
          },
          type: '$interactionEvents.type',
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.date',
        metrics: {
          $push: { type: '$_id.type', count: '$count' },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return trends.map((t) => {
    const metricsMap = new Map(t.metrics.map((m: any) => [m.type, m.count]));
    const likes = Number(metricsMap.get('like') || 0);
    const shares = Number(metricsMap.get('share') || 0);
    const commentCount = Number(metricsMap.get('comment') || 0);
    const reviewCount = Number(metricsMap.get('review') || 0);
    return {
      date: t._id,
      likes,
      shares,
      comments: commentCount + reviewCount,
      total: likes + shares + commentCount + reviewCount,
    };
  });
}
