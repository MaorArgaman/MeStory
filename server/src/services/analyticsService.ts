import { Book } from '../models/Book';
import { User } from '../models/User';
import { UserActivity } from '../models/UserActivity';

/**
 * Analytics Service
 * Provides platform-wide analytics for admin dashboard
 * Simplified for Supabase (no MongoDB aggregations)
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
  lastActiveAt: string | Date;
  daysSinceActive: number;
  booksStarted: number;
  booksCompleted: number;
  registeredAt: string | Date;
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
  growthRate: number;
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
  publishedAt: string | Date;
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
  const allUsers = await User.find({});
  const totalUsers = allUsers.length;
  const newUsersThisWeek = allUsers.filter(u => new Date(u.createdAt) >= weekAgo).length;

  // Active users
  const allActivities = await UserActivity.find({});
  const activeUsers = allActivities.filter(a => new Date(a.lastActiveAt) >= monthAgo).length;

  // Book metrics
  const allBooks = await Book.find({ _lightweight: true });
  const totalBooks = allBooks.length;
  const publishedBooks = allBooks.filter(b => b.publishingStatus?.status === 'published').length;
  const newBooksThisWeek = allBooks.filter(b => new Date(b.createdAt) >= weekAgo).length;

  // Revenue and quality
  let totalRevenue = 0;
  let totalQuality = 0;
  let qualityCount = 0;

  for (const book of allBooks) {
    totalRevenue += book.statistics?.revenue || 0;
    if (book.qualityScore?.overallScore) {
      totalQuality += book.qualityScore.overallScore;
      qualityCount++;
    }
  }

  return {
    totalUsers,
    activeUsers,
    newUsersThisWeek,
    totalBooks,
    publishedBooks,
    newBooksThisWeek,
    totalRevenue,
    averageQualityScore: qualityCount > 0 ? totalQuality / qualityCount : 0,
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

  const allActivities = await UserActivity.find({});
  const churnedActivities = allActivities
    .filter(a => new Date(a.lastActiveAt) < cutoffDate && a.totalBooksRead > 0)
    .sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime())
    .slice(0, limit);

  const userIds = churnedActivities.map(a => a.userId);
  const users = await Promise.all(userIds.map(id => User.findById(id)));
  const userMap = new Map(users.filter(u => u).map(u => [u!.id, u!]));

  return churnedActivities.map(activity => {
    const user = userMap.get(activity.userId);
    const daysSinceActive = Math.floor(
      (Date.now() - new Date(activity.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      userId: activity.userId,
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

  const allUsers = await User.find({});
  const recentUsers = allUsers.filter(u => new Date(u.createdAt) >= cutoffDate);
  const recentUserIds = new Set(recentUsers.map(u => u.id));

  const allActivities = await UserActivity.find({});
  const activeUserIds = new Set(
    allActivities
      .filter(a => recentUserIds.has(a.userId) && (a.totalBooksRead > 0 || a.totalBooksWritten > 0))
      .map(a => a.userId)
  );

  return recentUsers
    .filter(u => !activeUserIds.has(u.id))
    .slice(0, limit)
    .map(u => ({
      userId: u.id,
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
  const books = await Book.find({
    'publishingStatus.status': 'published',
    _lightweight: true,
  });

  // Group by author
  const authorStats = new Map<string, {
    totalBooks: number;
    totalViews: number;
    totalPurchases: number;
    totalRevenue: number;
    totalQuality: number;
  }>();

  for (const book of books) {
    const authorId = book.author;
    if (!authorStats.has(authorId)) {
      authorStats.set(authorId, {
        totalBooks: 0,
        totalViews: 0,
        totalPurchases: 0,
        totalRevenue: 0,
        totalQuality: 0,
      });
    }
    const stats = authorStats.get(authorId)!;
    stats.totalBooks++;
    stats.totalViews += book.statistics?.views || 0;
    stats.totalPurchases += book.statistics?.purchases || 0;
    stats.totalRevenue += book.statistics?.revenue || 0;
    stats.totalQuality += book.qualityScore?.overallScore || 50;
  }

  // Calculate scores and sort
  const authorsWithScores = Array.from(authorStats.entries()).map(([authorId, stats]) => {
    const avgQuality = stats.totalBooks > 0 ? stats.totalQuality / stats.totalBooks : 50;
    const engagementScore =
      stats.totalBooks * 10 +
      stats.totalViews * 0.1 +
      stats.totalPurchases * 5 +
      avgQuality * 0.5 +
      stats.totalRevenue * 0.2;

    return { authorId, ...stats, avgQuality, engagementScore };
  });

  authorsWithScores.sort((a, b) => b.engagementScore - a.engagementScore);

  // Fetch author details
  const results: TopAuthorData[] = [];
  for (const stats of authorsWithScores.slice(0, limit)) {
    const author = await User.findById(stats.authorId);
    if (author) {
      results.push({
        authorId: stats.authorId,
        name: author.name,
        email: author.email,
        avatar: author.profile?.avatar,
        totalBooks: stats.totalBooks,
        totalViews: stats.totalViews,
        totalPurchases: stats.totalPurchases,
        totalRevenue: stats.totalRevenue,
        averageQuality: stats.avgQuality,
        engagementScore: stats.engagementScore,
      });
    }
  }

  return results;
}

/**
 * Get genre analytics
 */
export async function getGenreAnalytics(): Promise<GenreAnalytics[]> {
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const books = await Book.find({
    'publishingStatus.status': 'published',
    _lightweight: true,
  });

  // Group by genre
  const genreStats = new Map<string, {
    bookCount: number;
    totalViews: number;
    totalPurchases: number;
    totalQuality: number;
    lastMonthCount: number;
  }>();

  for (const book of books) {
    const genre = book.genre || 'Unknown';
    if (!genreStats.has(genre)) {
      genreStats.set(genre, {
        bookCount: 0,
        totalViews: 0,
        totalPurchases: 0,
        totalQuality: 0,
        lastMonthCount: 0,
      });
    }
    const stats = genreStats.get(genre)!;
    stats.bookCount++;
    stats.totalViews += book.statistics?.views || 0;
    stats.totalPurchases += book.statistics?.purchases || 0;
    stats.totalQuality += book.qualityScore?.overallScore || 50;

    const createdAt = new Date(book.createdAt);
    if (createdAt >= twoMonthsAgo && createdAt < monthAgo) {
      stats.lastMonthCount++;
    }
  }

  return Array.from(genreStats.entries())
    .map(([genre, stats]) => {
      const growthRate = stats.lastMonthCount > 0
        ? ((stats.bookCount - stats.lastMonthCount) / stats.lastMonthCount) * 100
        : 100;

      return {
        genre,
        bookCount: stats.bookCount,
        totalViews: stats.totalViews,
        totalPurchases: stats.totalPurchases,
        averageQuality: stats.bookCount > 0 ? stats.totalQuality / stats.bookCount : 0,
        growthRate: Math.round(growthRate * 10) / 10,
      };
    })
    .sort((a, b) => b.totalViews - a.totalViews);
}

/**
 * Get top performing books
 */
export async function getTopBooks(
  limit: number = 20,
  sortBy: 'views' | 'purchases' | 'quality' | 'revenue' = 'views'
): Promise<BookPerformance[]> {
  const books = await Book.find({
    'publishingStatus.status': 'published',
    _lightweight: true,
  });

  // Sort in memory
  const sorted = books.sort((a, b) => {
    switch (sortBy) {
      case 'views':
        return (b.statistics?.views || 0) - (a.statistics?.views || 0);
      case 'purchases':
        return (b.statistics?.purchases || 0) - (a.statistics?.purchases || 0);
      case 'quality':
        return (b.qualityScore?.overallScore || 0) - (a.qualityScore?.overallScore || 0);
      case 'revenue':
        return (b.statistics?.revenue || 0) - (a.statistics?.revenue || 0);
      default:
        return 0;
    }
  }).slice(0, limit);

  // Fetch author names
  const results: BookPerformance[] = [];
  for (const book of sorted) {
    const author = await User.findById(book.author);
    results.push({
      bookId: book.id,
      title: book.title,
      author: author?.name || 'Unknown',
      genre: book.genre,
      views: book.statistics?.views || 0,
      purchases: book.statistics?.purchases || 0,
      revenue: book.statistics?.revenue || 0,
      qualityScore: book.qualityScore?.overallScore || 0,
      publishedAt: book.publishingStatus?.publishedAt || book.createdAt,
      performanceScore:
        (book.statistics?.views || 0) * 0.1 +
        (book.statistics?.purchases || 0) * 5 +
        (book.qualityScore?.overallScore || 50) * 0.5,
    });
  }

  return results;
}

/**
 * Get daily activity trends
 */
export async function getDailyActivityTrends(days: number = 30): Promise<any[]> {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const allActivities = await UserActivity.find({});

  // Group events by date
  const dateStats = new Map<string, Record<string, number>>();

  for (const activity of allActivities) {
    for (const event of activity.interactionEvents || []) {
      const eventDate = new Date(event.timestamp);
      if (eventDate < startDate) continue;

      const dateKey = eventDate.toISOString().split('T')[0];
      if (!dateStats.has(dateKey)) {
        dateStats.set(dateKey, {});
      }
      const stats = dateStats.get(dateKey)!;
      stats[event.type] = (stats[event.type] || 0) + 1;
    }
  }

  return Array.from(dateStats.entries())
    .map(([date, breakdown]) => ({
      date,
      totalInteractions: Object.values(breakdown).reduce((sum, count) => sum + count, 0),
      breakdown,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get books that need quality evaluation
 */
export async function getBooksNeedingEvaluation(limit: number = 50): Promise<any[]> {
  const books = await Book.find({
    'publishingStatus.status': 'published',
    _lightweight: true,
  });

  const needsEval = books
    .filter(b => !b.qualityScore?.overallScore)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

  const results: any[] = [];
  for (const book of needsEval) {
    const author = await User.findById(book.author);
    results.push({
      bookId: book.id,
      title: book.title,
      author: author?.name || 'Unknown',
      genre: book.genre,
      wordCount: book.statistics?.wordCount || 0,
      publishedAt: book.publishingStatus?.publishedAt,
    });
  }

  return results;
}

/**
 * Get user engagement funnel
 */
export async function getEngagementFunnel(): Promise<any> {
  const allUsers = await User.find({});
  const totalUsers = allUsers.length;

  const allActivities = await UserActivity.find({});

  const usersWithActivity = allActivities.filter(
    a => a.totalBooksRead > 0 || a.totalBooksWritten > 0
  ).length;

  const usersCompleted = allActivities.filter(
    a => a.completedBooks && a.completedBooks.length > 0
  ).length;

  const usersWithPurchases = allActivities.filter(
    a => a.interactionEvents?.some(e => e.type === 'purchase')
  ).length;

  const usersWriting = allActivities.filter(
    a => a.totalBooksWritten > 0
  ).length;

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
 * Get retention cohort analysis (simplified)
 */
export async function getRetentionCohorts(monthsBack: number = 6): Promise<RetentionCohort[]> {
  const cohorts: RetentionCohort[] = [];
  const now = new Date();

  const allUsers = await User.find({});
  const allActivities = await UserActivity.find({});
  const activityByUser = new Map(allActivities.map(a => [a.userId, a]));

  for (let i = monthsBack - 1; i >= 0; i--) {
    const cohortStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const cohortEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

    const cohortUsers = allUsers.filter(u => {
      const createdAt = new Date(u.createdAt);
      return createdAt >= cohortStart && createdAt <= cohortEnd;
    });

    const totalUsers = cohortUsers.length;
    if (totalUsers === 0) continue;

    const retainedByWeek: number[] = [];
    const retentionRates: number[] = [];
    const weeksToCheck = Math.min(12, Math.floor((now.getTime() - cohortStart.getTime()) / (7 * 24 * 60 * 60 * 1000)));

    for (let week = 1; week <= weeksToCheck; week++) {
      const weekStart = new Date(cohortStart.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(cohortStart.getTime() + week * 7 * 24 * 60 * 60 * 1000);

      let activeInWeek = 0;
      for (const user of cohortUsers) {
        const activity = activityByUser.get(user.id);
        if (activity?.interactionEvents) {
          const hasActivity = activity.interactionEvents.some(e => {
            const timestamp = new Date(e.timestamp);
            return timestamp >= weekStart && timestamp < weekEnd;
          });
          if (hasActivity) activeInWeek++;
        }
      }

      retainedByWeek.push(activeInWeek);
      retentionRates.push(Math.round((activeInWeek / totalUsers) * 100));
    }

    cohorts.push({
      cohortMonth: cohortStart.toISOString().slice(0, 7),
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
  const user = await User.findById(userId);
  if (!user) return null;

  const userActivity = await UserActivity.findOne({ userId });

  const purchaseEvents = userActivity?.interactionEvents?.filter(
    e => e.type === 'purchase'
  ) || [];

  let bookPurchasesTotal = 0;
  for (const event of purchaseEvents) {
    if (event.metadata?.amount) {
      bookPurchasesTotal += event.metadata.amount;
    }
  }

  const tier = user.subscription?.tier;
  const subscriptionValue = tier === 'premium' ? 99 : tier === 'standard' ? 49 : 0;

  const daysSinceRegistration = Math.max(1, Math.floor(
    (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  ));

  const totalSpent = bookPurchasesTotal + subscriptionValue;
  const dailySpendRate = totalSpent / daysSinceRegistration;
  const projectedLTV = dailySpendRate * 365;

  let userSegment: 'high' | 'medium' | 'low' = 'low';
  if (projectedLTV > 200) userSegment = 'high';
  else if (projectedLTV > 50) userSegment = 'medium';

  return {
    userId: user.id,
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
  const users = await User.find({});
  const ltvData: number[] = [];
  const byPlan: Record<string, number[]> = { FREE: [], STANDARD: [], PREMIUM: [] };
  const byEngagement: Record<string, number[]> = { high: [], medium: [], low: [] };

  for (const user of users.slice(0, 500)) {
    const ltv = await calculateUserLTV(user.id);
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
  lastActiveAt: string | Date;
  recommendedAction: string;
}

function calculateChurnProbability(userActivity: any, user: any): {
  probability: number;
  riskFactors: string[];
} {
  const riskFactors: string[] = [];
  let riskScore = 0;

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

  if (userActivity.currentStreak === 0 && userActivity.longestStreak > 7) {
    riskScore += 0.15;
    riskFactors.push('Broken activity streak');
  }

  if (userActivity.totalBooksRead < 1 && userActivity.totalBooksWritten < 1) {
    riskScore += 0.15;
    riskFactors.push('No completed activities');
  }

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

  const activities = await UserActivity.find({});
  const userIds = activities.map(a => a.userId);
  const users = await Promise.all(userIds.map(id => User.findById(id)));
  const userMap = new Map(users.filter(u => u).map(u => [u!.id, u!]));

  for (const activity of activities.slice(0, 500)) {
    const user = userMap.get(activity.userId);
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
        userId: user.id,
        name: user.name,
        email: user.email,
        churnProbability: Math.round(probability * 100) / 100,
        riskFactors,
        lastActiveAt: activity.lastActiveAt,
        recommendedAction,
      });
    }
  }

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

  const allActivities = await UserActivity.find({});
  const activeNow = allActivities.filter(a => new Date(a.lastActiveAt) >= fifteenMinutesAgo).length;

  // Activity breakdown
  let reading = 0;
  let browsing = 0;
  let recentPurchases = 0;

  for (const activity of allActivities) {
    for (const event of activity.interactionEvents || []) {
      const timestamp = new Date(event.timestamp);
      if (timestamp >= fifteenMinutesAgo) {
        if (event.type === 'read') reading++;
        if (event.type === 'view') browsing++;
      }
      if (timestamp >= oneHourAgo && event.type === 'purchase') {
        recentPurchases++;
      }
    }
  }

  const allUsers = await User.find({});
  const recentSignups = allUsers.filter(u => new Date(u.createdAt) >= oneHourAgo).length;

  const allBooks = await Book.find({ _lightweight: true });
  const recentPublished = allBooks.filter(b => {
    const publishedAt = b.publishingStatus?.publishedAt;
    return publishedAt && new Date(publishedAt) >= oneHourAgo;
  }).length;

  return {
    activeNow,
    reading,
    writing: 0,
    browsing,
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
  const books = await Book.find({
    'publishingStatus.status': 'published',
    _lightweight: true,
  });

  // Book sales revenue
  let bookSalesRevenue = 0;
  const revenueByGenre = new Map<string, number>();
  const revenueByAuthor = new Map<string, number>();

  for (const book of books) {
    const revenue = book.statistics?.revenue || 0;
    bookSalesRevenue += revenue;

    const genre = book.genre || 'Unknown';
    revenueByGenre.set(genre, (revenueByGenre.get(genre) || 0) + revenue);

    const authorId = book.author;
    revenueByAuthor.set(authorId, (revenueByAuthor.get(authorId) || 0) + revenue);
  }

  // Subscription revenue
  const users = await User.find({});
  const premiumUsers = users.filter(u => u.subscription?.plan === 'PREMIUM').length;
  const standardUsers = users.filter(u => u.subscription?.plan === 'STANDARD').length;
  const periodDays = period === 'day' ? 1 : period === 'week' ? 7 : 30;
  const subscriptionRevenue = (premiumUsers * 99 + standardUsers * 49) / 12 * (periodDays / 30);

  const totalRevenue = bookSalesRevenue + subscriptionRevenue;

  // Top genres
  const sortedGenres = Array.from(revenueByGenre.entries())
    .map(([genre, revenue]) => ({ genre, revenue: Math.round(revenue * 100) / 100 }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Top authors
  const sortedAuthors = Array.from(revenueByAuthor.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const topEarningAuthors: Array<{ authorId: string; name: string; revenue: number }> = [];
  for (const [authorId, revenue] of sortedAuthors) {
    const author = await User.findById(authorId);
    if (author) {
      topEarningAuthors.push({
        authorId,
        name: author.name,
        revenue: Math.round(revenue * 100) / 100,
      });
    }
  }

  // Purchase count for AOV
  let purchaseCount = 0;
  const allActivities = await UserActivity.find({});
  for (const activity of allActivities) {
    purchaseCount += (activity.interactionEvents || []).filter(e => e.type === 'purchase').length;
  }

  const averageOrderValue = purchaseCount > 0 ? bookSalesRevenue / purchaseCount : 0;

  return {
    period,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    bookSalesRevenue: Math.round(bookSalesRevenue * 100) / 100,
    subscriptionRevenue: Math.round(subscriptionRevenue * 100) / 100,
    averageOrderValue: Math.round(averageOrderValue * 100) / 100,
    revenueByGenre: sortedGenres,
    topEarningAuthors,
    revenueGrowth: 0, // Would need historical data
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
  likesGrowth: number;
  sharesGrowth: number;
  commentsGrowth: number;
}

/**
 * Get social engagement overview metrics
 */
export async function getSocialEngagementOverview(): Promise<SocialEngagementOverview> {
  const books = await Book.find({
    'publishingStatus.status': 'published',
    _lightweight: true,
  });

  let totalLikes = 0;
  let totalShares = 0;
  let totalComments = 0;

  for (const book of books) {
    totalLikes += book.likes || 0;
    totalShares += book.statistics?.shares || 0;
    totalComments += book.statistics?.totalReviews || 0;
  }

  const bookCount = books.length || 1;

  // Get messaging stats
  let totalConversations = 0;
  let totalMessages = 0;
  try {
    const { Conversation, Message } = await import('../models/Message');
    const conversations = await Conversation.find({});
    totalConversations = conversations.filter(c => c.isActive).length;
    const messages = await Message.find({});
    totalMessages = messages.length;
  } catch {
    // Message model might not exist
  }

  return {
    totalLikes,
    totalShares,
    totalComments,
    totalConversations,
    totalMessages,
    averageLikesPerBook: Math.round((totalLikes / bookCount) * 10) / 10,
    averageSharesPerBook: Math.round((totalShares / bookCount) * 10) / 10,
    averageCommentsPerBook: Math.round((totalComments / bookCount) * 10) / 10,
    likesGrowth: 0,
    sharesGrowth: 0,
    commentsGrowth: 0,
  };
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
  joinedAt: string | Date;
}

/**
 * Get most engaged users
 */
export async function getMostEngagedUsers(limit: number = 20): Promise<EngagedUser[]> {
  const allActivities = await UserActivity.find({});
  const userStats = new Map<string, {
    likes: number;
    shares: number;
    comments: number;
  }>();

  for (const activity of allActivities) {
    if (!userStats.has(activity.userId)) {
      userStats.set(activity.userId, { likes: 0, shares: 0, comments: 0 });
    }
    const stats = userStats.get(activity.userId)!;

    for (const event of activity.interactionEvents || []) {
      if (event.type === 'like') stats.likes++;
      if (event.type === 'share') stats.shares++;
      if (event.type === 'comment' || event.type === 'review') stats.comments++;
    }
  }

  const users: EngagedUser[] = [];
  for (const [userId, stats] of userStats) {
    const user = await User.findById(userId);
    if (!user) continue;

    const engagementScore = stats.likes * 1 + stats.shares * 5 + stats.comments * 3;

    users.push({
      userId,
      name: user.name,
      email: user.email,
      avatar: user.profile?.avatar,
      totalLikes: stats.likes,
      totalShares: stats.shares,
      totalComments: stats.comments,
      conversationsStarted: 0,
      messagesSent: 0,
      engagementScore: Math.round(engagementScore * 10) / 10,
      joinedAt: user.createdAt,
    });
  }

  return users
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, limit);
}

export interface TopEngagedBook {
  bookId: string;
  title: string;
  authorName: string;
  likes: number;
  shares: number;
  comments: number;
  engagementScore: number;
  socialVelocity: number;
}

/**
 * Get top engaged books by social metrics
 */
export async function getTopEngagedBooks(limit: number = 20): Promise<TopEngagedBook[]> {
  const books = await Book.find({
    'publishingStatus.status': 'published',
    _lightweight: true,
  });

  const results: TopEngagedBook[] = [];

  for (const book of books) {
    const likes = book.likes || 0;
    const shares = book.statistics?.shares || 0;
    const comments = book.statistics?.totalReviews || 0;

    if (likes === 0 && shares === 0 && comments === 0) continue;

    const author = await User.findById(book.author);
    const engagementScore = likes * 1 + shares * 5 + comments * 3;

    results.push({
      bookId: book.id,
      title: book.title,
      authorName: author?.name || 'Unknown',
      likes,
      shares,
      comments,
      engagementScore,
      socialVelocity: 0,
    });
  }

  return results
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, limit);
}

/**
 * Get engagement trends over time
 */
export async function getSocialEngagementTrends(days: number = 30): Promise<any[]> {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const allActivities = await UserActivity.find({});
  const dateStats = new Map<string, { likes: number; shares: number; comments: number }>();

  for (const activity of allActivities) {
    for (const event of activity.interactionEvents || []) {
      const timestamp = new Date(event.timestamp);
      if (timestamp < startDate) continue;
      if (!['like', 'share', 'comment', 'review'].includes(event.type)) continue;

      const dateKey = timestamp.toISOString().split('T')[0];
      if (!dateStats.has(dateKey)) {
        dateStats.set(dateKey, { likes: 0, shares: 0, comments: 0 });
      }
      const stats = dateStats.get(dateKey)!;

      if (event.type === 'like') stats.likes++;
      if (event.type === 'share') stats.shares++;
      if (event.type === 'comment' || event.type === 'review') stats.comments++;
    }
  }

  return Array.from(dateStats.entries())
    .map(([date, stats]) => ({
      date,
      likes: stats.likes,
      shares: stats.shares,
      comments: stats.comments,
      total: stats.likes + stats.shares + stats.comments,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
