import mongoose from 'mongoose';
import { Book, IBook } from '../models/Book';
import { UserActivity, IUserActivity } from '../models/UserActivity';
import { User } from '../models/User';

/**
 * Recommendation Engine Service
 * Provides personalized book recommendations using collaborative filtering
 * and content-based recommendation algorithms
 */

interface RecommendationScore {
  bookId: string;
  score: number;
  reasons: string[];
}

interface RecommendationResult {
  books: IBook[];
  reasons: Map<string, string[]>;
}

/**
 * Calculate exponential temporal decay
 * Half-life of 14 days - preferences decay naturally over time
 */
function calculateTemporalDecay(lastInteractionDate: Date): number {
  const daysSince = Math.floor(
    (Date.now() - new Date(lastInteractionDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  // Exponential decay with half-life of 14 days
  // After 14 days: 0.5, after 28 days: 0.25, after 42 days: 0.125
  return Math.max(0.1, Math.exp(-0.693 * daysSince / 14));
}

/**
 * Calculate negative signal score based on abandonments and low ratings
 * Returns a penalty value (0 to 0.5) that will be subtracted from the final score
 */
function calculateNegativeSignalPenalty(
  userActivity: IUserActivity,
  book: any
): number {
  let penalty = 0;

  // Penalty for abandoned books in this genre
  const abandonedInGenre = userActivity.interactionEvents.filter(
    (e) => e.type === 'abandon' && e.genre?.toLowerCase() === book.genre?.toLowerCase()
  ).length;
  penalty += Math.min(abandonedInGenre * 0.08, 0.25);

  // Penalty for low ratings given to this author
  const authorPref = userActivity.authorPreferences.find(
    (a) => a.authorId.toString() === book.author?._id?.toString()
  );
  if (authorPref && authorPref.averageRating > 0 && authorPref.averageRating < 2.5 && authorPref.booksRead > 0) {
    penalty += 0.2;
  }

  // Penalty if user tends to abandon books of similar length
  const bookWordCount = book.statistics?.wordCount || 0;
  if (bookWordCount > 50000) { // Long books
    const longBookAbandons = userActivity.interactionEvents.filter(
      (e) => e.type === 'abandon' && e.metadata?.wordCount > 50000
    ).length;
    if (longBookAbandons >= 2) {
      penalty += 0.1;
    }
  }

  return Math.min(penalty, 0.5); // Cap at 50% penalty
}

/**
 * Calculate genre affinity score for a user
 * Higher weight = stronger preference
 */
function calculateGenreScore(
  userActivity: IUserActivity,
  bookGenre: string
): number {
  const genrePref = userActivity.genrePreferences.find(
    (g) => g.genre.toLowerCase() === bookGenre.toLowerCase()
  );

  if (!genrePref) return 0.3; // Default score for unknown genres (curiosity factor)

  // Weight calculation: combination of explicit preference and recency
  const baseWeight = genrePref.weight / 100;
  const interactionBonus = Math.min(genrePref.readCount * 0.05, 0.3);
  const writingBonus = genrePref.writtenCount > 0 ? 0.2 : 0;

  // Exponential recency decay: more recent interactions = higher score
  const recencyFactor = calculateTemporalDecay(genrePref.lastInteraction);

  return Math.min(1, (baseWeight + interactionBonus + writingBonus) * recencyFactor);
}

/**
 * Calculate author affinity score
 */
function calculateAuthorScore(
  userActivity: IUserActivity,
  authorId: string
): number {
  const authorPref = userActivity.authorPreferences.find(
    (a) => a.authorId.toString() === authorId
  );

  if (!authorPref) return 0;

  let score = 0;

  // Following bonus
  if (authorPref.isFollowing) score += 0.4;

  // Books read bonus
  score += Math.min(authorPref.booksRead * 0.1, 0.3);

  // Rating bonus
  if (authorPref.averageRating > 0) {
    score += (authorPref.averageRating / 5) * 0.3;
  }

  return Math.min(1, score);
}

/**
 * Calculate quality score based on book's AI evaluation
 */
function calculateQualityScore(book: IBook): number {
  if (!book.qualityScore) return 0.5; // Default for unscored books

  const overallScore = book.qualityScore.overallScore / 100;
  return overallScore;
}

/**
 * Calculate popularity/social proof score
 */
function calculatePopularityScore(book: IBook): number {
  const { views, purchases, totalReviews, averageRating } = book.statistics;

  // Normalize each metric (logarithmic scale to prevent outliers)
  const viewScore = Math.min(Math.log10(views + 1) / 5, 1);
  const purchaseScore = Math.min(Math.log10(purchases + 1) / 3, 1);
  const reviewScore = Math.min(Math.log10(totalReviews + 1) / 2, 1);
  const ratingScore = averageRating ? averageRating / 5 : 0.5;

  // Weighted combination
  return (
    viewScore * 0.2 +
    purchaseScore * 0.3 +
    reviewScore * 0.2 +
    ratingScore * 0.3
  );
}

/**
 * Calculate freshness score (new releases get boosted)
 */
function calculateFreshnessScore(book: IBook): number {
  const publishedAt = book.publishingStatus.publishedAt;
  if (!publishedAt) return 0;

  const daysSincePublish = Math.floor(
    (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Exponential decay over 30 days
  if (daysSincePublish <= 7) return 1; // First week: full boost
  if (daysSincePublish <= 30) return Math.max(0.5, 1 - (daysSincePublish - 7) * 0.02);
  return 0.3; // Older books get minimal freshness boost
}

/**
 * Check if user has already interacted with this book
 */
function hasUserInteracted(
  userActivity: IUserActivity,
  bookId: string
): boolean {
  const bookIdStr = bookId.toString();

  return (
    userActivity.completedBooks.some((id) => id.toString() === bookIdStr) ||
    userActivity.currentlyReading.some((id) => id.toString() === bookIdStr) ||
    userActivity.abandonedBooks.some((id) => id.toString() === bookIdStr)
  );
}

/**
 * Get personalized book recommendations for a user
 */
export async function getPersonalizedRecommendations(
  userId: string,
  limit: number = 20
): Promise<RecommendationResult> {
  try {
    // Get or create user activity profile
    let userActivity = await UserActivity.findOne({ userId });

    if (!userActivity) {
      // New user - create profile and return popular books
      userActivity = new UserActivity({ userId });
      await userActivity.save();
      return getTrendingBooks(limit);
    }

    // Get all published books
    const books = await Book.find({
      'publishingStatus.status': 'published',
      'publishingStatus.isPublic': true,
      author: { $ne: userId }, // Exclude user's own books
    })
      .populate('author', 'name profile.avatar')
      .lean();

    // Calculate scores for each book
    const scoredBooks: RecommendationScore[] = books
      .filter((book) => !hasUserInteracted(userActivity!, book._id.toString()))
      .map((book) => {
        const reasons: string[] = [];

        // Calculate individual scores
        const genreScore = calculateGenreScore(userActivity!, book.genre);
        const authorScore = calculateAuthorScore(userActivity!, book.author._id.toString());
        const qualityScore = calculateQualityScore(book as unknown as IBook);
        const popularityScore = calculatePopularityScore(book as unknown as IBook);
        const freshnessScore = calculateFreshnessScore(book as unknown as IBook);

        // Calculate negative signal penalty
        const negativePenalty = calculateNegativeSignalPenalty(userActivity!, book);

        // Add reasons based on scores
        if (genreScore > 0.6) reasons.push(`Matches your love for ${book.genre}`);
        if (authorScore > 0.5) reasons.push('From an author you enjoy');
        if (qualityScore > 0.8) reasons.push('Highly rated by AI');
        if (popularityScore > 0.7) reasons.push('Popular among readers');
        if (freshnessScore > 0.8) reasons.push('New release');

        // Weighted final score with negative signal penalty
        const baseScore =
          genreScore * 0.35 +      // Genre preference is most important
          authorScore * 0.2 +      // Author familiarity
          qualityScore * 0.25 +    // AI quality rating
          popularityScore * 0.1 +  // Social proof
          freshnessScore * 0.1;    // New content bonus

        const finalScore = Math.max(0, baseScore - negativePenalty);

        return {
          bookId: book._id.toString(),
          score: finalScore,
          reasons: reasons.length > 0 ? reasons : ['Recommended for you'],
        };
      });

    // Sort by score and take top results
    scoredBooks.sort((a, b) => b.score - a.score);
    const topBookIds = scoredBooks.slice(0, limit).map((s) => s.bookId);

    // Get full book objects
    const recommendedBooks = await Book.find({
      _id: { $in: topBookIds },
    })
      .populate('author', 'name profile.avatar')
      .lean();

    // Create reasons map
    const reasonsMap = new Map<string, string[]>();
    scoredBooks.forEach((s) => reasonsMap.set(s.bookId, s.reasons));

    // Sort books by their recommendation score
    const sortedBooks = recommendedBooks.sort((a, b) => {
      const scoreA = scoredBooks.find((s) => s.bookId === a._id.toString())?.score || 0;
      const scoreB = scoredBooks.find((s) => s.bookId === b._id.toString())?.score || 0;
      return scoreB - scoreA;
    });

    return {
      books: sortedBooks as unknown as IBook[],
      reasons: reasonsMap,
    };
  } catch (error) {
    console.error('Recommendation engine error:', error);
    return getTrendingBooks(limit);
  }
}

/**
 * Get trending/popular books (fallback for new users)
 */
export async function getTrendingBooks(limit: number = 20): Promise<RecommendationResult> {
  const books = await Book.find({
    'publishingStatus.status': 'published',
    'publishingStatus.isPublic': true,
  })
    .sort({
      'statistics.views': -1,
      'statistics.purchases': -1,
      'qualityScore.overallScore': -1,
    })
    .limit(limit)
    .populate('author', 'name profile.avatar')
    .lean();

  const reasonsMap = new Map<string, string[]>();
  books.forEach((book) => {
    reasonsMap.set(book._id.toString(), ['Trending on MeStory']);
  });

  return {
    books: books as unknown as IBook[],
    reasons: reasonsMap,
  };
}

/**
 * Get new releases with quality filter
 */
export async function getNewReleases(
  limit: number = 20,
  minQualityScore: number = 60
): Promise<IBook[]> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const books = await Book.find({
    'publishingStatus.status': 'published',
    'publishingStatus.isPublic': true,
    'publishingStatus.publishedAt': { $gte: thirtyDaysAgo },
    $or: [
      { 'qualityScore.overallScore': { $gte: minQualityScore } },
      { qualityScore: { $exists: false } }, // Include unscored new books
    ],
  })
    .sort({ 'publishingStatus.publishedAt': -1 })
    .limit(limit)
    .populate('author', 'name profile.avatar')
    .lean();

  return books as unknown as IBook[];
}

/**
 * Get books by genre with quality ranking
 */
export async function getBooksByGenre(
  genre: string,
  limit: number = 20
): Promise<IBook[]> {
  const books = await Book.find({
    'publishingStatus.status': 'published',
    'publishingStatus.isPublic': true,
    genre: { $regex: new RegExp(genre, 'i') },
  })
    .sort({
      'qualityScore.overallScore': -1,
      'statistics.views': -1,
    })
    .limit(limit)
    .populate('author', 'name profile.avatar')
    .lean();

  return books as unknown as IBook[];
}

/**
 * Get continue reading list for a user
 */
export async function getContinueReading(userId: string): Promise<IBook[]> {
  const userActivity = await UserActivity.findOne({ userId });

  if (!userActivity || userActivity.currentlyReading.length === 0) {
    return [];
  }

  const books = await Book.find({
    _id: { $in: userActivity.currentlyReading },
  })
    .populate('author', 'name profile.avatar')
    .lean();

  // Sort by last read date
  const progressMap = new Map<string, Date>();
  userActivity.readingHistory.forEach((progress) => {
    progressMap.set(progress.bookId.toString(), progress.lastReadAt);
  });

  books.sort((a, b) => {
    const dateA = progressMap.get(a._id.toString()) || new Date(0);
    const dateB = progressMap.get(b._id.toString()) || new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  return books as unknown as IBook[];
}

/**
 * Get continue writing list for a user
 */
export async function getContinueWriting(userId: string): Promise<IBook[]> {
  // Get unfinished drafts directly from books
  const draftBooks = await Book.find({
    author: userId,
    'publishingStatus.status': 'draft',
  })
    .sort({ updatedAt: -1 })
    .lean();

  return draftBooks as unknown as IBook[];
}

/**
 * Get similar books to a specific book
 */
export async function getSimilarBooks(
  bookId: string,
  limit: number = 10
): Promise<IBook[]> {
  const book = await Book.findById(bookId);
  if (!book) return [];

  // Find books with same genre and similar quality
  const books = await Book.find({
    _id: { $ne: bookId },
    'publishingStatus.status': 'published',
    'publishingStatus.isPublic': true,
    genre: book.genre,
  })
    .sort({
      'qualityScore.overallScore': -1,
      'statistics.views': -1,
    })
    .limit(limit)
    .populate('author', 'name profile.avatar')
    .lean();

  return books as unknown as IBook[];
}

/**
 * Get top authors with most engagement
 */
export async function getTopAuthors(limit: number = 10): Promise<any[]> {
  const result = await Book.aggregate([
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
        totalRevenue: { $sum: '$statistics.revenue' },
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
    {
      $project: {
        authorId: '$_id',
        name: '$authorInfo.name',
        avatar: '$authorInfo.profile.avatar',
        totalBooks: 1,
        totalViews: 1,
        totalPurchases: 1,
        avgQuality: 1,
        engagementScore: 1,
      },
    },
  ]);

  return result;
}

/**
 * Record user interaction for ML training
 */
export async function recordInteraction(
  userId: string,
  bookId: string,
  interactionType: 'view' | 'read' | 'complete' | 'purchase' | 'like' | 'share' | 'review' | 'abandon',
  duration?: number,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const book = await Book.findById(bookId);
    if (!book) return;

    let userActivity = await UserActivity.findOne({ userId });

    if (!userActivity) {
      userActivity = new UserActivity({ userId });
    }

    // Add interaction event
    userActivity.interactionEvents.push({
      type: interactionType,
      bookId: new mongoose.Types.ObjectId(bookId),
      genre: book.genre,
      authorId: book.author,
      duration,
      timestamp: new Date(),
      metadata,
    });

    // Update genre preferences
    const genrePrefIndex = userActivity.genrePreferences.findIndex(
      (g) => g.genre.toLowerCase() === book.genre.toLowerCase()
    );

    if (genrePrefIndex === -1) {
      userActivity.genrePreferences.push({
        genre: book.genre,
        weight: 50,
        readCount: interactionType === 'complete' ? 1 : 0,
        writtenCount: 0,
        lastInteraction: new Date(),
      });
    } else {
      userActivity.genrePreferences[genrePrefIndex].lastInteraction = new Date();

      // Increase weight based on interaction type
      const weightIncrease =
        interactionType === 'complete' ? 10 :
        interactionType === 'purchase' ? 15 :
        interactionType === 'like' ? 5 :
        interactionType === 'read' ? 3 : 1;

      userActivity.genrePreferences[genrePrefIndex].weight = Math.min(
        100,
        userActivity.genrePreferences[genrePrefIndex].weight + weightIncrease
      );

      if (interactionType === 'complete') {
        userActivity.genrePreferences[genrePrefIndex].readCount += 1;
      }
    }

    // Update author preferences
    const authorIdStr = book.author.toString();
    const author = await User.findById(book.author);

    const authorPrefIndex = userActivity.authorPreferences.findIndex(
      (a) => a.authorId.toString() === authorIdStr
    );

    if (authorPrefIndex === -1 && interactionType !== 'view') {
      userActivity.authorPreferences.push({
        authorId: book.author,
        authorName: author?.name || 'Unknown',
        booksRead: interactionType === 'complete' ? 1 : 0,
        averageRating: interactionType === 'review' && metadata?.rating ? metadata.rating : 0,
        isFollowing: false,
        lastInteraction: new Date(),
      });
    } else if (authorPrefIndex !== -1) {
      userActivity.authorPreferences[authorPrefIndex].lastInteraction = new Date();
      if (interactionType === 'complete') {
        userActivity.authorPreferences[authorPrefIndex].booksRead += 1;
      }
      // FIX: Update averageRating when user submits a review
      if (interactionType === 'review' && metadata?.rating) {
        const currentBooksRead = userActivity.authorPreferences[authorPrefIndex].booksRead || 1;
        const currentAvg = userActivity.authorPreferences[authorPrefIndex].averageRating || 0;
        // Calculate running average
        if (currentAvg === 0) {
          userActivity.authorPreferences[authorPrefIndex].averageRating = metadata.rating;
        } else {
          userActivity.authorPreferences[authorPrefIndex].averageRating =
            (currentAvg * (currentBooksRead - 1) + metadata.rating) / currentBooksRead;
        }
      }
    }

    // Update reading lists
    const bookIdObj = new mongoose.Types.ObjectId(bookId);

    if (interactionType === 'read' || interactionType === 'view') {
      if (!userActivity.currentlyReading.some((id) => id.toString() === bookId)) {
        userActivity.currentlyReading.push(bookIdObj);
      }
    } else if (interactionType === 'complete') {
      userActivity.currentlyReading = userActivity.currentlyReading.filter(
        (id) => id.toString() !== bookId
      );
      if (!userActivity.completedBooks.some((id) => id.toString() === bookId)) {
        userActivity.completedBooks.push(bookIdObj);
        userActivity.totalBooksRead += 1;
      }
    } else if (interactionType === 'abandon') {
      userActivity.currentlyReading = userActivity.currentlyReading.filter(
        (id) => id.toString() !== bookId
      );
      if (!userActivity.abandonedBooks.some((id) => id.toString() === bookId)) {
        userActivity.abandonedBooks.push(bookIdObj);
      }
    }

    // Update engagement metrics
    userActivity.lastActiveAt = new Date();
    if (duration) {
      userActivity.totalReadingTime += duration;
    }

    await userActivity.save();
  } catch (error) {
    console.error('Error recording interaction:', error);
  }
}

/**
 * Record writing activity - updates writtenCount for genre preferences
 * Should be called when a user publishes a book
 */
export async function recordWritingActivity(
  userId: string,
  bookId: string,
  genre: string
): Promise<void> {
  try {
    let userActivity = await UserActivity.findOne({ userId });

    if (!userActivity) {
      userActivity = new UserActivity({ userId });
    }

    // Update genre preferences with writtenCount
    const genrePrefIndex = userActivity.genrePreferences.findIndex(
      (g) => g.genre.toLowerCase() === genre.toLowerCase()
    );

    if (genrePrefIndex === -1) {
      userActivity.genrePreferences.push({
        genre,
        weight: 60, // Writers in a genre get higher initial weight
        readCount: 0,
        writtenCount: 1,
        lastInteraction: new Date(),
      });
    } else {
      userActivity.genrePreferences[genrePrefIndex].writtenCount += 1;
      userActivity.genrePreferences[genrePrefIndex].lastInteraction = new Date();
      // Boost weight for genres user writes in
      userActivity.genrePreferences[genrePrefIndex].weight = Math.min(
        100,
        userActivity.genrePreferences[genrePrefIndex].weight + 15
      );
    }

    // Update writing progress
    const bookIdObj = new mongoose.Types.ObjectId(bookId);
    if (!userActivity.completedWriting.some((id) => id.toString() === bookId)) {
      userActivity.completedWriting.push(bookIdObj);
    }
    userActivity.currentlyWriting = userActivity.currentlyWriting.filter(
      (id) => id.toString() !== bookId
    );

    userActivity.totalBooksWritten += 1;
    userActivity.lastActiveAt = new Date();

    await userActivity.save();
  } catch (error) {
    console.error('Error recording writing activity:', error);
  }
}

/**
 * Update reading progress
 */
export async function updateReadingProgress(
  userId: string,
  bookId: string,
  chapterNumber: number,
  percentageComplete: number,
  readingTime: number
): Promise<void> {
  try {
    let userActivity = await UserActivity.findOne({ userId });

    if (!userActivity) {
      userActivity = new UserActivity({ userId });
    }

    const progressIndex = userActivity.readingHistory.findIndex(
      (p) => p.bookId.toString() === bookId
    );

    if (progressIndex === -1) {
      userActivity.readingHistory.push({
        bookId: new mongoose.Types.ObjectId(bookId),
        lastChapterRead: chapterNumber,
        percentageComplete,
        totalReadingTime: readingTime,
        lastReadAt: new Date(),
        isCompleted: percentageComplete >= 100,
      });
    } else {
      userActivity.readingHistory[progressIndex].lastChapterRead = chapterNumber;
      userActivity.readingHistory[progressIndex].percentageComplete = percentageComplete;
      userActivity.readingHistory[progressIndex].totalReadingTime += readingTime;
      userActivity.readingHistory[progressIndex].lastReadAt = new Date();
      userActivity.readingHistory[progressIndex].isCompleted = percentageComplete >= 100;
    }

    await userActivity.save();

    // Record interaction
    if (percentageComplete >= 100) {
      await recordInteraction(userId, bookId, 'complete', readingTime);
    }
  } catch (error) {
    console.error('Error updating reading progress:', error);
  }
}
