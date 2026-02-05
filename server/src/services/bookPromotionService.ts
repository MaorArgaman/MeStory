import mongoose from 'mongoose';
import { Book, IBook } from '../models/Book';
import { UserActivity } from '../models/UserActivity';
import { User } from '../models/User';

/**
 * Book Promotion Service
 * Handles organic book promotion based on quality, engagement, and author credibility
 */

// ==================== INTERFACES ====================

export interface PromotionCriteria {
  minQualityScore: number;
  minReaderCount: number;
  minPurchases: number;
  publishedWithinDays: number;
}

export interface AuthorSpotlight {
  authorId: string;
  name: string;
  avatar?: string;
  totalBooks: number;
  totalReaders: number;
  averageQuality: number;
  credibilityScore: number;
  featuredBooks: IBook[];
}

export interface PromotedBook {
  book: IBook;
  promotionScore: number;
  promotionReasons: string[];
  badges: string[];
}

export interface TrendingMetrics {
  velocityScore: number;  // Rate of engagement growth
  qualityScore: number;
  engagementScore: number;
  overall: number;
}

// ==================== PROMOTION SCORING ====================

/**
 * Calculate overall promotion score for a book
 * This determines how prominently a book is featured
 *
 * Score breakdown:
 * - Quality: 35%
 * - Velocity: 20%
 * - Social engagement (likes, shares, comments): 20%
 * - Conversion: 15%
 * - Author credibility: 10%
 */
export async function calculatePromotionScore(book: IBook): Promise<{
  score: number;
  breakdown: {
    quality: number;
    velocity: number;
    social: number;
    conversion: number;
    authorCredibility: number;
  };
  badges: string[];
}> {
  const badges: string[] = [];

  // Quality component (35%)
  let qualityScore = 0;
  if (book.qualityScore?.overallScore) {
    qualityScore = book.qualityScore.overallScore / 100;

    // Add quality badges
    if (book.qualityScore.overallScore >= 90) {
      badges.push('MASTERPIECE');
    } else if (book.qualityScore.overallScore >= 80) {
      badges.push('EXCELLENT');
    } else if (book.qualityScore.overallScore >= 70) {
      badges.push('HIGH_QUALITY');
    }
  }

  // Velocity component (20%) - engagement growth rate
  const velocityScore = await calculateEngagementVelocity(book._id.toString(), 7);
  if (velocityScore > 0.7) {
    badges.push('TRENDING');
  }

  // Social engagement component (20%) - likes, shares, comments
  const likes = book.likes || 0;
  const shares = book.statistics?.shares || 0;
  const comments = book.statistics?.comments || book.statistics?.totalReviews || 0;

  // Calculate social score with weighted components
  // Normalize to 0-1 scale (assuming max ~1000 interactions for very popular books)
  const likesNorm = Math.min(Math.log10(likes + 1) / 3, 1);
  const sharesNorm = Math.min(Math.log10(shares * 5 + 1) / 3, 1); // Shares weighted 5x
  const commentsNorm = Math.min(Math.log10(comments * 3 + 1) / 3, 1); // Comments weighted 3x

  const socialScore = (likesNorm * 0.3 + sharesNorm * 0.4 + commentsNorm * 0.3);

  // Social badges
  if (likes >= 100) {
    badges.push('POPULAR');
  }
  if (shares >= 50) {
    badges.push('VIRAL');
  }
  if (comments >= 20) {
    badges.push('ENGAGING');
  }

  // Conversion rate (15%) - views to purchases/completions
  const views = book.statistics?.views || 0;
  const purchases = book.statistics?.purchases || 0;
  const completionRate = book.statistics?.completionRate || 0;

  let conversionScore = 0;
  if (views > 0) {
    const purchaseRate = purchases / views;
    conversionScore = Math.min((purchaseRate * 10 + completionRate) / 2, 1);
  }

  // Author credibility (10%)
  const authorCredibility = await getAuthorCredibilityScore(book.author.toString());
  if (authorCredibility > 0.8) {
    badges.push('TOP_AUTHOR');
  }

  // Calculate final score with updated weights
  const score =
    qualityScore * 0.35 +
    velocityScore * 0.20 +
    socialScore * 0.20 +
    conversionScore * 0.15 +
    authorCredibility * 0.10;

  // Additional badges based on metrics
  if (book.publishingStatus?.price === 0 || book.publishingStatus?.isFree) {
    badges.push('FREE');
  }

  const publishedAt = book.publishingStatus?.publishedAt;
  if (publishedAt) {
    const daysSince = Math.floor(
      (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince <= 7) {
      badges.push('NEW');
    }
  }

  return {
    score,
    breakdown: {
      quality: qualityScore,
      velocity: velocityScore,
      social: socialScore,
      conversion: conversionScore,
      authorCredibility,
    },
    badges,
  };
}

/**
 * Calculate engagement velocity (rate of growth in last N days)
 * Includes social interactions (likes, shares, comments)
 */
async function calculateEngagementVelocity(
  bookId: string,
  days: number = 7
): Promise<number> {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Count recent interactions
  const recentInteractions = await UserActivity.aggregate([
    { $unwind: '$interactionEvents' },
    {
      $match: {
        'interactionEvents.bookId': new mongoose.Types.ObjectId(bookId),
        'interactionEvents.timestamp': { $gte: startDate },
      },
    },
    {
      $group: {
        _id: null,
        views: {
          $sum: { $cond: [{ $eq: ['$interactionEvents.type', 'view'] }, 1, 0] },
        },
        reads: {
          $sum: { $cond: [{ $eq: ['$interactionEvents.type', 'read'] }, 1, 0] },
        },
        completes: {
          $sum: { $cond: [{ $eq: ['$interactionEvents.type', 'complete'] }, 1, 0] },
        },
        purchases: {
          $sum: { $cond: [{ $eq: ['$interactionEvents.type', 'purchase'] }, 1, 0] },
        },
        likes: {
          $sum: { $cond: [{ $eq: ['$interactionEvents.type', 'like'] }, 1, 0] },
        },
        shares: {
          $sum: { $cond: [{ $eq: ['$interactionEvents.type', 'share'] }, 1, 0] },
        },
        comments: {
          $sum: { $cond: [{ $eq: ['$interactionEvents.type', 'comment'] }, 1, 0] },
        },
      },
    },
  ]);

  if (recentInteractions.length === 0) return 0;

  const { views, reads, completes, purchases, likes, shares, comments } = recentInteractions[0];

  // Weighted engagement score - social interactions have high impact
  const engagement =
    (views || 0) * 0.05 +
    (reads || 0) * 0.15 +
    (completes || 0) * 0.2 +
    (purchases || 0) * 0.2 +
    (likes || 0) * 0.1 +
    (shares || 0) * 0.2 +    // Shares weighted heavily (viral potential)
    (comments || 0) * 0.1;    // Comments indicate deep engagement

  // Normalize to 0-1 scale (assuming max ~100 interactions/week for popular books)
  return Math.min(engagement / 30, 1);
}

/**
 * Calculate author credibility score
 */
export async function getAuthorCredibilityScore(authorId: string): Promise<number> {
  const result = await Book.aggregate([
    {
      $match: {
        author: new mongoose.Types.ObjectId(authorId),
        'publishingStatus.status': 'published',
      },
    },
    {
      $group: {
        _id: null,
        totalBooks: { $sum: 1 },
        totalViews: { $sum: '$statistics.views' },
        totalPurchases: { $sum: '$statistics.purchases' },
        avgQuality: { $avg: '$qualityScore.overallScore' },
        totalRevenue: { $sum: '$statistics.revenue' },
      },
    },
  ]);

  if (result.length === 0) return 0.1; // New author default

  const { totalBooks, totalViews, totalPurchases, avgQuality } = result[0];

  // Weighted credibility calculation
  const booksScore = Math.min(totalBooks / 10, 1) * 0.2;
  const viewsScore = Math.min(Math.log10(totalViews + 1) / 5, 1) * 0.25;
  const purchasesScore = Math.min(Math.log10(totalPurchases + 1) / 3, 1) * 0.3;
  const qualityScore = ((avgQuality || 50) / 100) * 0.25;

  return booksScore + viewsScore + purchasesScore + qualityScore;
}

// ==================== FEATURED BOOKS ====================

/**
 * Get featured/editor's choice books
 * High quality + good engagement
 */
export async function getFeaturedBooks(limit: number = 10): Promise<PromotedBook[]> {
  const books = await Book.find({
    'publishingStatus.status': 'published',
    'publishingStatus.isPublic': true,
    'qualityScore.overallScore': { $gte: 75 },
  })
    .sort({ 'qualityScore.overallScore': -1, 'statistics.views': -1 })
    .limit(limit * 2) // Get extra for scoring
    .populate('author', 'name profile.avatar')
    .lean();

  const promoted: PromotedBook[] = [];

  for (const book of books) {
    const { score, badges } = await calculatePromotionScore(book as unknown as IBook);
    const reasons: string[] = [];

    if (book.qualityScore?.overallScore >= 85) {
      reasons.push('Exceptional writing quality');
    }
    if (badges.includes('TOP_AUTHOR')) {
      reasons.push('From a top-rated author');
    }

    promoted.push({
      book: book as unknown as IBook,
      promotionScore: score,
      promotionReasons: reasons.length > 0 ? reasons : ['Featured selection'],
      badges,
    });
  }

  // Sort by promotion score and return top results
  promoted.sort((a, b) => b.promotionScore - a.promotionScore);
  return promoted.slice(0, limit);
}

/**
 * Get rising stars - new books gaining traction
 */
export async function getRisingStars(limit: number = 10): Promise<PromotedBook[]> {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const books = await Book.find({
    'publishingStatus.status': 'published',
    'publishingStatus.isPublic': true,
    'publishingStatus.publishedAt': { $gte: fourteenDaysAgo },
    $or: [
      { 'qualityScore.overallScore': { $gte: 60 } },
      { qualityScore: { $exists: false } },
    ],
  })
    .sort({ 'statistics.views': -1 })
    .limit(limit * 3)
    .populate('author', 'name profile.avatar')
    .lean();

  const promoted: PromotedBook[] = [];

  for (const book of books) {
    const velocity = await calculateEngagementVelocity(book._id.toString(), 7);
    const { score, badges } = await calculatePromotionScore(book as unknown as IBook);

    // Rising stars need good velocity
    if (velocity >= 0.2) {
      promoted.push({
        book: book as unknown as IBook,
        promotionScore: score + velocity * 0.5, // Boost velocity weight
        promotionReasons: ['Rising in popularity', 'Gaining readers quickly'],
        badges: [...badges, 'RISING_STAR'],
      });
    }
  }

  promoted.sort((a, b) => b.promotionScore - a.promotionScore);
  return promoted.slice(0, limit);
}

/**
 * Get quality new releases
 */
export async function getQualityNewReleases(
  limit: number = 20,
  criteria?: Partial<PromotionCriteria>
): Promise<PromotedBook[]> {
  const defaults: PromotionCriteria = {
    minQualityScore: 60,
    minReaderCount: 0,
    minPurchases: 0,
    publishedWithinDays: 30,
  };
  const config = { ...defaults, ...criteria };

  const startDate = new Date(
    Date.now() - config.publishedWithinDays * 24 * 60 * 60 * 1000
  );

  const books = await Book.find({
    'publishingStatus.status': 'published',
    'publishingStatus.isPublic': true,
    'publishingStatus.publishedAt': { $gte: startDate },
    $or: [
      { 'qualityScore.overallScore': { $gte: config.minQualityScore } },
      { qualityScore: { $exists: false } },
    ],
    'statistics.views': { $gte: config.minReaderCount },
    'statistics.purchases': { $gte: config.minPurchases },
  })
    .sort({ 'publishingStatus.publishedAt': -1 })
    .limit(limit)
    .populate('author', 'name profile.avatar')
    .lean();

  const promoted: PromotedBook[] = [];

  for (const book of books) {
    const { score, badges } = await calculatePromotionScore(book as unknown as IBook);
    const daysSince = Math.floor(
      (Date.now() - new Date(book.publishingStatus.publishedAt!).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    const reasons: string[] = [`Published ${daysSince} day${daysSince === 1 ? '' : 's'} ago`];
    if (book.qualityScore?.overallScore >= 75) {
      reasons.push('High quality score');
    }

    promoted.push({
      book: book as unknown as IBook,
      promotionScore: score,
      promotionReasons: reasons,
      badges: [...badges, 'NEW_RELEASE'],
    });
  }

  return promoted;
}

/**
 * Get trending books by velocity
 */
export async function getTrendingByVelocity(
  timeframeDays: number = 7,
  limit: number = 20
): Promise<PromotedBook[]> {
  const books = await Book.find({
    'publishingStatus.status': 'published',
    'publishingStatus.isPublic': true,
  })
    .sort({ 'statistics.views': -1 })
    .limit(100) // Get top 100 by views for velocity calculation
    .populate('author', 'name profile.avatar')
    .lean();

  const withVelocity: Array<{ book: any; velocity: number }> = [];

  for (const book of books) {
    const velocity = await calculateEngagementVelocity(book._id.toString(), timeframeDays);
    withVelocity.push({ book, velocity });
  }

  // Sort by velocity
  withVelocity.sort((a, b) => b.velocity - a.velocity);

  const promoted: PromotedBook[] = [];

  for (const { book, velocity } of withVelocity.slice(0, limit)) {
    const { score, badges } = await calculatePromotionScore(book as unknown as IBook);

    promoted.push({
      book: book as unknown as IBook,
      promotionScore: score,
      promotionReasons: [`Trending this week`, `${Math.round(velocity * 100)}% engagement growth`],
      badges: velocity > 0.5 ? [...badges, 'HOT'] : badges,
    });
  }

  return promoted;
}

// ==================== TOP AUTHORS ====================

/**
 * Get top authors spotlight with their best books
 */
export async function getTopAuthorsSpotlight(limit: number = 10): Promise<AuthorSpotlight[]> {
  const authorStats = await Book.aggregate([
    {
      $match: {
        'publishingStatus.status': 'published',
        'publishingStatus.isPublic': true,
      },
    },
    {
      $group: {
        _id: '$author',
        totalBooks: { $sum: 1 },
        totalViews: { $sum: '$statistics.views' },
        totalPurchases: { $sum: '$statistics.purchases' },
        avgQuality: { $avg: '$qualityScore.overallScore' },
        bestBookId: { $first: '$_id' }, // Will get actual best later
      },
    },
    {
      $addFields: {
        credibilityScore: {
          $add: [
            { $multiply: [{ $min: [{ $divide: ['$totalBooks', 10] }, 1] }, 0.2] },
            {
              $multiply: [
                { $min: [{ $divide: [{ $log10: { $add: ['$totalViews', 1] } }, 5] }, 1] },
                0.25,
              ],
            },
            {
              $multiply: [
                { $min: [{ $divide: [{ $log10: { $add: ['$totalPurchases', 1] } }, 3] }, 1] },
                0.3,
              ],
            },
            { $multiply: [{ $divide: [{ $ifNull: ['$avgQuality', 50] }, 100] }, 0.25] },
          ],
        },
      },
    },
    { $sort: { credibilityScore: -1 } },
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

  const spotlights: AuthorSpotlight[] = [];

  for (const stat of authorStats) {
    // Get featured books for this author
    const featuredBooks = await Book.find({
      author: stat._id,
      'publishingStatus.status': 'published',
    })
      .sort({ 'qualityScore.overallScore': -1, 'statistics.views': -1 })
      .limit(3)
      .populate('author', 'name profile.avatar')
      .lean();

    spotlights.push({
      authorId: stat._id.toString(),
      name: stat.authorInfo.name,
      avatar: stat.authorInfo.profile?.avatar,
      totalBooks: stat.totalBooks,
      totalReaders: stat.totalViews,
      averageQuality: stat.avgQuality || 0,
      credibilityScore: stat.credibilityScore,
      featuredBooks: featuredBooks as unknown as IBook[],
    });
  }

  return spotlights;
}

// ==================== GENRE-BASED PROMOTIONS ====================

/**
 * Get top books in a specific genre
 */
export async function getTopInGenre(
  genre: string,
  limit: number = 10
): Promise<PromotedBook[]> {
  const books = await Book.find({
    'publishingStatus.status': 'published',
    'publishingStatus.isPublic': true,
    genre: { $regex: new RegExp(genre, 'i') },
  })
    .sort({ 'qualityScore.overallScore': -1, 'statistics.views': -1 })
    .limit(limit)
    .populate('author', 'name profile.avatar')
    .lean();

  const promoted: PromotedBook[] = [];

  for (const book of books) {
    const { score, badges } = await calculatePromotionScore(book as unknown as IBook);

    promoted.push({
      book: book as unknown as IBook,
      promotionScore: score,
      promotionReasons: [`Top ${genre} book`, 'Highly rated in category'],
      badges: [...badges, `TOP_${genre.toUpperCase().replace(/\s+/g, '_')}`],
    });
  }

  return promoted;
}

/**
 * Get promotion summary for admin dashboard
 */
export async function getPromotionSummary(): Promise<{
  totalFeatured: number;
  totalRisingStars: number;
  totalTrending: number;
  topGenres: Array<{ genre: string; count: number; avgQuality: number }>;
  topAuthorsCount: number;
}> {
  const featured = await Book.countDocuments({
    'publishingStatus.status': 'published',
    'qualityScore.overallScore': { $gte: 80 },
  });

  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const risingStars = await Book.countDocuments({
    'publishingStatus.status': 'published',
    'publishingStatus.publishedAt': { $gte: fourteenDaysAgo },
    'statistics.views': { $gte: 50 },
  });

  const genreStats = await Book.aggregate([
    {
      $match: {
        'publishingStatus.status': 'published',
        'publishingStatus.isPublic': true,
      },
    },
    {
      $group: {
        _id: '$genre',
        count: { $sum: 1 },
        avgQuality: { $avg: '$qualityScore.overallScore' },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  const topAuthorsCount = await Book.aggregate([
    {
      $match: { 'publishingStatus.status': 'published' },
    },
    {
      $group: {
        _id: '$author',
        totalViews: { $sum: '$statistics.views' },
      },
    },
    {
      $match: { totalViews: { $gte: 100 } },
    },
    { $count: 'count' },
  ]);

  return {
    totalFeatured: featured,
    totalRisingStars: risingStars,
    totalTrending: risingStars, // Simplified for now
    topGenres: genreStats.map((g) => ({
      genre: g._id || 'Unknown',
      count: g.count,
      avgQuality: g.avgQuality || 0,
    })),
    topAuthorsCount: topAuthorsCount[0]?.count || 0,
  };
}
