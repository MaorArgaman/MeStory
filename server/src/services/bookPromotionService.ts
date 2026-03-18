import { Book, IBook } from '../models/Book';
import { User } from '../models/User';

/**
 * Book Promotion Service
 * Handles organic book promotion based on quality, engagement, and author credibility
 * Simplified for Supabase (no MongoDB aggregations)
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
  velocityScore: number;
  qualityScore: number;
  engagementScore: number;
  overall: number;
}

// ==================== PROMOTION SCORING ====================

/**
 * Calculate overall promotion score for a book
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

    if (book.qualityScore.overallScore >= 90) {
      badges.push('MASTERPIECE');
    } else if (book.qualityScore.overallScore >= 80) {
      badges.push('EXCELLENT');
    } else if (book.qualityScore.overallScore >= 70) {
      badges.push('HIGH_QUALITY');
    }
  }

  // Velocity (simplified - based on recent views)
  const velocityScore = Math.min((book.statistics?.views || 0) / 1000, 1);
  if (velocityScore > 0.7) {
    badges.push('TRENDING');
  }

  // Social engagement
  const likes = book.likes || 0;
  const shares = book.statistics?.shares || 0;
  const comments = book.statistics?.comments || book.statistics?.totalReviews || 0;

  const likesNorm = Math.min(Math.log10(likes + 1) / 3, 1);
  const sharesNorm = Math.min(Math.log10(shares * 5 + 1) / 3, 1);
  const commentsNorm = Math.min(Math.log10(comments * 3 + 1) / 3, 1);

  const socialScore = (likesNorm * 0.3 + sharesNorm * 0.4 + commentsNorm * 0.3);

  if (likes >= 100) badges.push('POPULAR');
  if (shares >= 50) badges.push('VIRAL');
  if (comments >= 20) badges.push('ENGAGING');

  // Conversion rate
  const views = book.statistics?.views || 0;
  const purchases = book.statistics?.purchases || 0;
  const completionRate = book.statistics?.completionRate || 0;

  let conversionScore = 0;
  if (views > 0) {
    const purchaseRate = purchases / views;
    conversionScore = Math.min((purchaseRate * 10 + completionRate) / 2, 1);
  }

  // Author credibility (simplified)
  const authorCredibility = await getAuthorCredibilityScore(book.author);
  if (authorCredibility > 0.8) {
    badges.push('TOP_AUTHOR');
  }

  const score =
    qualityScore * 0.35 +
    velocityScore * 0.20 +
    socialScore * 0.20 +
    conversionScore * 0.15 +
    authorCredibility * 0.10;

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
 * Calculate author credibility score (simplified)
 */
export async function getAuthorCredibilityScore(authorId: string): Promise<number> {
  const books = await Book.find({ author: authorId, 'publishingStatus.status': 'published' });

  if (books.length === 0) return 0.1;

  const totalBooks = books.length;
  const totalViews = books.reduce((sum, b) => sum + (b.statistics?.views || 0), 0);
  const totalPurchases = books.reduce((sum, b) => sum + (b.statistics?.purchases || 0), 0);
  const avgQuality = books.reduce((sum, b) => sum + (b.qualityScore?.overallScore || 50), 0) / totalBooks;

  const booksScore = Math.min(totalBooks / 10, 1) * 0.2;
  const viewsScore = Math.min(Math.log10(totalViews + 1) / 5, 1) * 0.25;
  const purchasesScore = Math.min(Math.log10(totalPurchases + 1) / 3, 1) * 0.3;
  const qualityScore = (avgQuality / 100) * 0.25;

  return booksScore + viewsScore + purchasesScore + qualityScore;
}

// ==================== FEATURED BOOKS ====================

/**
 * Get featured/editor's choice books
 */
export async function getFeaturedBooks(limit: number = 10): Promise<PromotedBook[]> {
  const books = await Book.find({
    'publishingStatus.status': 'published',
    'publishingStatus.isPublic': true,
  });

  // Filter and sort in memory
  const qualityBooks = books.filter(b => (b.qualityScore?.overallScore || 0) >= 75);
  qualityBooks.sort((a, b) => (b.qualityScore?.overallScore || 0) - (a.qualityScore?.overallScore || 0));

  const promoted: PromotedBook[] = [];

  for (const book of qualityBooks.slice(0, limit)) {
    const { score, badges } = await calculatePromotionScore(book);
    const reasons: string[] = [];

    if ((book.qualityScore?.overallScore || 0) >= 85) {
      reasons.push('Exceptional writing quality');
    }
    if (badges.includes('TOP_AUTHOR')) {
      reasons.push('From a top-rated author');
    }

    promoted.push({
      book,
      promotionScore: score,
      promotionReasons: reasons.length > 0 ? reasons : ['Featured selection'],
      badges,
    });
  }

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
  });

  // Filter recent books
  const recentBooks = books.filter(b => {
    const publishedAt = b.publishingStatus?.publishedAt;
    return publishedAt && new Date(publishedAt) >= fourteenDaysAgo;
  });

  recentBooks.sort((a, b) => (b.statistics?.views || 0) - (a.statistics?.views || 0));

  const promoted: PromotedBook[] = [];

  for (const book of recentBooks.slice(0, limit)) {
    const { score, badges } = await calculatePromotionScore(book);

    promoted.push({
      book,
      promotionScore: score,
      promotionReasons: ['Rising in popularity', 'Gaining readers quickly'],
      badges: [...badges, 'RISING_STAR'],
    });
  }

  return promoted;
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

  const startDate = new Date(Date.now() - config.publishedWithinDays * 24 * 60 * 60 * 1000);

  const books = await Book.find({
    'publishingStatus.status': 'published',
    'publishingStatus.isPublic': true,
  });

  const filteredBooks = books.filter(b => {
    const publishedAt = b.publishingStatus?.publishedAt;
    if (!publishedAt || new Date(publishedAt) < startDate) return false;
    if ((b.qualityScore?.overallScore || 0) < config.minQualityScore && b.qualityScore) return false;
    if ((b.statistics?.views || 0) < config.minReaderCount) return false;
    if ((b.statistics?.purchases || 0) < config.minPurchases) return false;
    return true;
  });

  filteredBooks.sort((a, b) => {
    const dateA = new Date(a.publishingStatus?.publishedAt || 0);
    const dateB = new Date(b.publishingStatus?.publishedAt || 0);
    return dateB.getTime() - dateA.getTime();
  });

  const promoted: PromotedBook[] = [];

  for (const book of filteredBooks.slice(0, limit)) {
    const { score, badges } = await calculatePromotionScore(book);
    const daysSince = Math.floor(
      (Date.now() - new Date(book.publishingStatus?.publishedAt || 0).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    const reasons: string[] = [`Published ${daysSince} day${daysSince === 1 ? '' : 's'} ago`];
    if ((book.qualityScore?.overallScore || 0) >= 75) {
      reasons.push('High quality score');
    }

    promoted.push({
      book,
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
  _timeframeDays: number = 7,
  limit: number = 20
): Promise<PromotedBook[]> {
  const books = await Book.find({
    'publishingStatus.status': 'published',
    'publishingStatus.isPublic': true,
  });

  // Sort by views as proxy for trending
  books.sort((a, b) => (b.statistics?.views || 0) - (a.statistics?.views || 0));

  const promoted: PromotedBook[] = [];

  for (const book of books.slice(0, limit)) {
    const { score, badges } = await calculatePromotionScore(book);

    promoted.push({
      book,
      promotionScore: score,
      promotionReasons: ['Trending this week'],
      badges,
    });
  }

  return promoted;
}

// ==================== TOP AUTHORS ====================

/**
 * Get top authors spotlight with their best books
 */
export async function getTopAuthorsSpotlight(limit: number = 10): Promise<AuthorSpotlight[]> {
  const allBooks = await Book.find({
    'publishingStatus.status': 'published',
    'publishingStatus.isPublic': true,
  });

  // Group by author
  const authorMap = new Map<string, IBook[]>();
  for (const book of allBooks) {
    const authorId = book.author;
    if (!authorMap.has(authorId)) {
      authorMap.set(authorId, []);
    }
    authorMap.get(authorId)!.push(book);
  }

  const spotlights: AuthorSpotlight[] = [];

  for (const [authorId, books] of authorMap) {
    const author = await User.findById(authorId);
    if (!author) continue;

    const totalViews = books.reduce((sum, b) => sum + (b.statistics?.views || 0), 0);
    const avgQuality = books.reduce((sum, b) => sum + (b.qualityScore?.overallScore || 50), 0) / books.length;
    const credibilityScore = await getAuthorCredibilityScore(authorId);

    // Sort books by quality for featured
    const sortedBooks = [...books].sort((a, b) =>
      (b.qualityScore?.overallScore || 0) - (a.qualityScore?.overallScore || 0)
    );

    spotlights.push({
      authorId,
      name: author.name,
      avatar: author.profile?.avatar,
      totalBooks: books.length,
      totalReaders: totalViews,
      averageQuality: avgQuality,
      credibilityScore,
      featuredBooks: sortedBooks.slice(0, 3),
    });
  }

  // Sort by credibility
  spotlights.sort((a, b) => b.credibilityScore - a.credibilityScore);
  return spotlights.slice(0, limit);
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
    genre,
  });

  books.sort((a, b) => (b.qualityScore?.overallScore || 0) - (a.qualityScore?.overallScore || 0));

  const promoted: PromotedBook[] = [];

  for (const book of books.slice(0, limit)) {
    const { score, badges } = await calculatePromotionScore(book);

    promoted.push({
      book,
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
  const allBooks = await Book.find({
    'publishingStatus.status': 'published',
  });

  const featured = allBooks.filter(b => (b.qualityScore?.overallScore || 0) >= 80).length;

  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const risingStars = allBooks.filter(b => {
    const publishedAt = b.publishingStatus?.publishedAt;
    return publishedAt && new Date(publishedAt) >= fourteenDaysAgo && (b.statistics?.views || 0) >= 50;
  }).length;

  // Group by genre
  const genreMap = new Map<string, { count: number; totalQuality: number }>();
  const authorSet = new Set<string>();

  for (const book of allBooks) {
    const genre = book.genre || 'Unknown';
    if (!genreMap.has(genre)) {
      genreMap.set(genre, { count: 0, totalQuality: 0 });
    }
    const stats = genreMap.get(genre)!;
    stats.count++;
    stats.totalQuality += book.qualityScore?.overallScore || 50;

    if ((book.statistics?.views || 0) >= 100) {
      authorSet.add(book.author);
    }
  }

  const topGenres = Array.from(genreMap.entries())
    .map(([genre, stats]) => ({
      genre,
      count: stats.count,
      avgQuality: stats.totalQuality / stats.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalFeatured: featured,
    totalRisingStars: risingStars,
    totalTrending: risingStars,
    topGenres,
    topAuthorsCount: authorSet.size,
  };
}
