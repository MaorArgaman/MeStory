import { Book, IBook } from '../models/Book';
import { UserActivity } from '../models/UserActivity';

/**
 * ML-Enhanced Recommendation Service
 * Provides advanced recommendation algorithms including:
 * - Collaborative Filtering (User-User and Item-Item)
 * - Content-Based Similarity
 * - Diversity Optimization
 * - Hybrid Scoring
 *
 * Simplified for Supabase (no MongoDB aggregations)
 */

// ==================== INTERFACES ====================

export interface MLFeatureVector {
  genreAffinities: Record<string, number>;
  authorAffinities: Record<string, number>;
  qualityPreference: number;
  readingLengthPreference: 'short' | 'medium' | 'long' | 'any';
  avgReadingTime: number;
  completionRate: number;
  recentActivityLevel: number;
}

export interface SimilarityResult {
  id: string;
  similarity: number;
}

export interface RecommendationWithReason {
  book: IBook;
  score: number;
  reasons: string[];
  category: 'personalized' | 'trending' | 'new' | 'similar' | 'explore';
}

export interface PersonalizedFeed {
  recommendedForYou: RecommendationWithReason[];
  continueReading: Array<{ book: IBook; progress: number; lastReadAt: Date }>;
  continueWriting: Array<{ book: IBook; lastEditedAt: Date; wordCount: number }>;
  becauseYouRead: Array<{ basedOn: IBook; recommendations: IBook[] }>;
  trending: IBook[];
  newReleases: IBook[];
}

// ==================== FEATURE EXTRACTION ====================

/**
 * Build a feature vector representing a user's preferences
 */
export async function buildUserFeatureVector(userId: string): Promise<MLFeatureVector | null> {
  const userActivity = await UserActivity.findOne({ userId });

  if (!userActivity) {
    return null;
  }

  // Genre affinities
  const genreAffinities: Record<string, number> = {};
  for (const pref of userActivity.genrePreferences) {
    const recencyDecay = calculateRecencyDecay(pref.lastInteraction);
    genreAffinities[pref.genre.toLowerCase()] = (pref.weight / 100) * recencyDecay;
  }

  // Author affinities
  const authorAffinities: Record<string, number> = {};
  for (const pref of userActivity.authorPreferences) {
    let score = 0;
    if (pref.isFollowing) score += 0.5;
    score += Math.min(pref.booksRead * 0.15, 0.3);
    if (pref.averageRating > 0) score += (pref.averageRating / 5) * 0.2;
    authorAffinities[pref.authorId.toString()] = score;
  }

  // Quality preference - inferred from average quality of completed books
  let qualitySum = 0;
  let qualityCount = 0;
  if (userActivity.completedBooks.length > 0) {
    const allBooks = await Book.find({
      'publishingStatus.status': 'published',
    });

    // Filter to completed books in memory
    const completedBookIds = new Set(userActivity.completedBooks.map(id => id.toString()));
    const completedBooks = allBooks.filter(b => completedBookIds.has(b.id));

    for (const book of completedBooks) {
      if (book.qualityScore?.overallScore) {
        qualitySum += book.qualityScore.overallScore;
        qualityCount++;
      }
    }
  }
  const qualityPreference = qualityCount > 0 ? qualitySum / qualityCount : 70;

  // Reading length preference
  let readingLengthPreference: 'short' | 'medium' | 'long' | 'any' = 'any';
  if (userActivity.readingHistory.length >= 3) {
    const completedBookIds = userActivity.readingHistory
      .filter((h) => h.isCompleted)
      .map((h) => h.bookId);

    if (completedBookIds.length >= 3) {
      const allBooks = await Book.find({
        'publishingStatus.status': 'published',
      });

      const completedIdSet = new Set(completedBookIds.map(id => id.toString()));
      const books = allBooks.filter(b => completedIdSet.has(b.id));

      const avgWordCount =
        books.reduce((sum, b) => sum + (b.statistics?.wordCount || 0), 0) / books.length;

      if (avgWordCount < 30000) readingLengthPreference = 'short';
      else if (avgWordCount < 80000) readingLengthPreference = 'medium';
      else if (avgWordCount > 80000) readingLengthPreference = 'long';
    }
  }

  // Average reading time per session
  const avgReadingTime =
    userActivity.totalReadingTime > 0 && userActivity.totalBooksRead > 0
      ? userActivity.totalReadingTime / userActivity.totalBooksRead
      : 0;

  // Completion rate
  const totalStarted =
    userActivity.currentlyReading.length +
    userActivity.completedBooks.length +
    userActivity.abandonedBooks.length;
  const completionRate = totalStarted > 0 ? userActivity.completedBooks.length / totalStarted : 0;

  // Recent activity level (0-1)
  const daysSinceActive = Math.floor(
    (Date.now() - new Date(userActivity.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  const recentActivityLevel = Math.max(0, 1 - daysSinceActive / 30);

  return {
    genreAffinities,
    authorAffinities,
    qualityPreference,
    readingLengthPreference,
    avgReadingTime,
    completionRate,
    recentActivityLevel,
  };
}

// ==================== COLLABORATIVE FILTERING ====================

/**
 * Find users with similar reading patterns
 * Uses Jaccard similarity on completed books
 */
export async function findSimilarUsers(
  userId: string,
  k: number = 10
): Promise<SimilarityResult[]> {
  const userActivity = await UserActivity.findOne({ userId });
  if (!userActivity || userActivity.completedBooks.length === 0) {
    return [];
  }

  const userBooksSet = new Set(userActivity.completedBooks.map((id) => id.toString()));

  // Get all users with completed books
  const allActivities = await UserActivity.find({});
  const otherUsers = allActivities.filter(
    a => a.userId !== userId && a.completedBooks && a.completedBooks.length > 0
  );

  const similarities: SimilarityResult[] = [];

  for (const other of otherUsers) {
    const otherBooksSet = new Set(other.completedBooks.map((id) => id.toString()));

    // Jaccard similarity
    const intersection = [...userBooksSet].filter((id) => otherBooksSet.has(id)).length;
    const union = new Set([...userBooksSet, ...otherBooksSet]).size;
    const similarity = union > 0 ? intersection / union : 0;

    if (similarity > 0.05) {
      // Minimum threshold
      similarities.push({
        id: other.userId.toString(),
        similarity,
      });
    }
  }

  // Sort by similarity and return top k
  return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, k);
}

/**
 * Get collaborative filtering score for a book
 * Based on what similar users have read and enjoyed
 */
export async function calculateCollaborativeScore(
  userId: string,
  bookId: string,
  k: number = 10
): Promise<number> {
  const similarUsers = await findSimilarUsers(userId, k);
  if (similarUsers.length === 0) return 0;

  let weightedSum = 0;
  let weightTotal = 0;

  for (const similar of similarUsers) {
    const otherActivity = await UserActivity.findOne({ userId: similar.id });
    if (!otherActivity) continue;

    // Check if similar user has read this book
    const hasRead = otherActivity.completedBooks.some((id) => id.toString() === bookId);
    if (hasRead) {
      // Check their rating for the book/author
      const book = await Book.findById(bookId);
      if (book) {
        const authorPref = otherActivity.authorPreferences.find(
          (a) => a.authorId.toString() === book.author.toString()
        );
        const rating = authorPref?.averageRating || 3.5; // Default neutral rating
        weightedSum += similar.similarity * (rating / 5);
        weightTotal += similar.similarity;
      }
    }
  }

  return weightTotal > 0 ? weightedSum / weightTotal : 0;
}

/**
 * Find similar books based on co-completion patterns
 * Item-Item collaborative filtering
 */
export async function findSimilarBooks(
  bookId: string,
  limit: number = 10
): Promise<SimilarityResult[]> {
  // Find all users who completed this book
  const allActivities = await UserActivity.find({});
  const usersWhoRead = allActivities.filter(
    a => a.completedBooks && a.completedBooks.some(id => id.toString() === bookId)
  );

  if (usersWhoRead.length === 0) return [];

  // Count co-completions for other books
  const coCompletionCounts: Record<string, number> = {};

  for (const user of usersWhoRead) {
    for (const otherId of user.completedBooks) {
      const otherIdStr = otherId.toString();
      if (otherIdStr !== bookId) {
        coCompletionCounts[otherIdStr] = (coCompletionCounts[otherIdStr] || 0) + 1;
      }
    }
  }

  // Calculate similarity score (co-completion / sqrt(count_a * count_b))
  const totalReaders = usersWhoRead.length;
  const similarities: SimilarityResult[] = [];

  for (const [otherId, coCount] of Object.entries(coCompletionCounts)) {
    const otherReaders = allActivities.filter(
      a => a.completedBooks && a.completedBooks.some(id => id.toString() === otherId)
    ).length;

    // Cosine-like similarity
    const similarity = coCount / Math.sqrt(totalReaders * otherReaders);
    similarities.push({ id: otherId, similarity });
  }

  return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
}

// ==================== CONTENT-BASED SIMILARITY ====================

/**
 * Calculate content similarity between two books
 */
export async function calculateContentSimilarity(
  bookA: IBook,
  bookB: IBook
): Promise<number> {
  let similarity = 0;

  // Genre match (0.3 weight)
  if (bookA.genre?.toLowerCase() === bookB.genre?.toLowerCase()) {
    similarity += 0.3;
  }

  // Tags overlap - Jaccard similarity (0.25 weight)
  const tagsA = new Set((bookA.tags || []).map((t) => t.toLowerCase()));
  const tagsB = new Set((bookB.tags || []).map((t) => t.toLowerCase()));
  if (tagsA.size > 0 && tagsB.size > 0) {
    const intersection = [...tagsA].filter((t) => tagsB.has(t)).length;
    const union = new Set([...tagsA, ...tagsB]).size;
    similarity += (intersection / union) * 0.25;
  }

  // Quality score similarity (0.15 weight)
  if (bookA.qualityScore?.overallScore && bookB.qualityScore?.overallScore) {
    const qualityDiff = Math.abs(
      bookA.qualityScore.overallScore - bookB.qualityScore.overallScore
    );
    similarity += Math.max(0, (100 - qualityDiff) / 100) * 0.15;
  }

  // Target audience match (0.15 weight)
  if (bookA.targetAudience && bookA.targetAudience === bookB.targetAudience) {
    similarity += 0.15;
  }

  // Word count similarity (0.1 weight)
  const wordCountA = bookA.statistics?.wordCount || 0;
  const wordCountB = bookB.statistics?.wordCount || 0;
  if (wordCountA > 0 && wordCountB > 0) {
    const maxCount = Math.max(wordCountA, wordCountB);
    const minCount = Math.min(wordCountA, wordCountB);
    similarity += (minCount / maxCount) * 0.1;
  }

  // Age rating match (0.05 weight)
  if (bookA.ageRating && bookA.ageRating === bookB.ageRating) {
    similarity += 0.05;
  }

  return similarity;
}

/**
 * Get content-based similar books
 */
export async function getContentSimilarBooks(
  bookId: string,
  limit: number = 10
): Promise<IBook[]> {
  const sourceBook = await Book.findById(bookId);
  if (!sourceBook) return [];

  // Get all published books
  const allBooks = await Book.find({
    'publishingStatus.status': 'published',
    'publishingStatus.isPublic': true,
  });

  // Filter candidates (same genre or similar tags) in memory
  const sourceTags = new Set((sourceBook.tags || []).map(t => t.toLowerCase()));
  const candidates = allBooks.filter(b => {
    if (b.id === bookId) return false;
    if (b.genre === sourceBook.genre) return true;
    const bookTags = (b.tags || []).map(t => t.toLowerCase());
    return bookTags.some(t => sourceTags.has(t));
  }).slice(0, 100);

  // Score each candidate
  const scored: Array<{ book: IBook; similarity: number }> = [];
  for (const candidate of candidates) {
    const similarity = await calculateContentSimilarity(
      sourceBook as unknown as IBook,
      candidate as unknown as IBook
    );
    scored.push({ book: candidate as unknown as IBook, similarity });
  }

  // Sort by similarity and return top results
  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, limit).map((s) => s.book);
}

// ==================== DIVERSITY OPTIMIZATION ====================

/**
 * Apply diversity penalty to avoid filter bubbles
 * Ensures recommendations include variety of genres
 */
export function applyDiversityPenalty(
  recommendations: RecommendationWithReason[],
  diversityFactor: number = 0.3
): RecommendationWithReason[] {
  const result: RecommendationWithReason[] = [];
  const genreCounts: Record<string, number> = {};

  // Sort by initial score
  const sorted = [...recommendations].sort((a, b) => b.score - a.score);

  for (const rec of sorted) {
    const genre = (rec.book.genre || 'unknown').toLowerCase();
    const genreCount = genreCounts[genre] || 0;

    // Apply diminishing returns for repeated genres
    const diversityPenalty = genreCount * diversityFactor * 0.1;
    const adjustedScore = rec.score - diversityPenalty;

    result.push({
      ...rec,
      score: adjustedScore,
    });

    genreCounts[genre] = genreCount + 1;
  }

  // Re-sort with adjusted scores
  return result.sort((a, b) => b.score - a.score);
}

/**
 * Inject exploration recommendations for serendipity
 */
export async function getExplorationRecommendations(
  _userId: string,
  userFeatures: MLFeatureVector,
  count: number = 3
): Promise<IBook[]> {
  // Find genres user hasn't explored much
  const knownGenres = Object.keys(userFeatures.genreAffinities).map(g => g.toLowerCase());

  const allBooks = await Book.find({
    'publishingStatus.status': 'published',
    'publishingStatus.isPublic': true,
  });

  // Filter unexplored high-quality books in memory
  const unexploredBooks = allBooks
    .filter(b => {
      const bookGenre = (b.genre || '').toLowerCase();
      const isKnownGenre = knownGenres.some(g => bookGenre.includes(g) || g.includes(bookGenre));
      const hasHighQuality = (b.qualityScore?.overallScore || 0) >= 75;
      return !isKnownGenre && hasHighQuality;
    })
    .sort((a, b) => {
      const qualityA = b.qualityScore?.overallScore || 0;
      const qualityB = a.qualityScore?.overallScore || 0;
      if (qualityA !== qualityB) return qualityB - qualityA;
      return (b.statistics?.views || 0) - (a.statistics?.views || 0);
    })
    .slice(0, count);

  return unexploredBooks as unknown as IBook[];
}

// ==================== MAIN RECOMMENDATION FUNCTIONS ====================

/**
 * Get diversified personalized recommendations
 * Combines collaborative, content-based, and popularity signals
 */
export async function getDiversifiedRecommendations(
  userId: string,
  limit: number = 20,
  diversityFactor: number = 0.3
): Promise<RecommendationWithReason[]> {
  const userFeatures = await buildUserFeatureVector(userId);

  if (!userFeatures) {
    // New user - return trending books
    const trending = await getTrendingWithReasons(limit);
    return trending;
  }

  const userActivity = await UserActivity.findOne({ userId });
  if (!userActivity) return [];

  // Get candidate books
  const allBooks = await Book.find({
    'publishingStatus.status': 'published',
    'publishingStatus.isPublic': true,
  });

  // Filter out user's own books and already-read books
  const excludedBookIds = new Set([
    ...userActivity.completedBooks.map(id => id.toString()),
    ...userActivity.currentlyReading.map(id => id.toString()),
    ...userActivity.abandonedBooks.map(id => id.toString()),
  ]);

  const books = allBooks.filter(
    b => b.author !== userId && !excludedBookIds.has(b.id)
  );

  // PERF: Batch-compute collaborative scores for ALL candidate books at once,
  // instead of doing 5+ DB queries per book inside the scoring loop (was 100+
  // sequential round-trips). Fetch similar users + their activities ONCE,
  // then score every candidate book in memory against that dataset.
  const similarUsers = await findSimilarUsers(userId, 5);
  const similarUserIds = similarUsers.map((s) => s.id);
  const similarActivities = similarUserIds.length > 0
    ? await UserActivity.find({ userId: { $in: similarUserIds } })
    : [];
  const activityByUser = new Map(similarActivities.map((a: any) => [a.userId.toString(), a]));
  const collabScores = new Map<string, number>();
  for (const b of books) {
    let weightedSum = 0;
    let weightTotal = 0;
    for (const similar of similarUsers) {
      const act = activityByUser.get(similar.id);
      if (!act) continue;
      const hasRead = act.completedBooks?.some((id: any) => id.toString() === b.id);
      if (hasRead) {
        weightedSum += similar.similarity * (3.5 / 5);
        weightTotal += similar.similarity;
      }
    }
    collabScores.set(b.id, weightTotal > 0 ? weightedSum / weightTotal : 0);
  }

  const recommendations: RecommendationWithReason[] = [];

  for (const book of books) {
    const reasons: string[] = [];
    let score = 0;

    // Genre affinity (30%)
    const genreKey = (book.genre || '').toLowerCase();
    const genreAffinity = userFeatures.genreAffinities[genreKey] || 0.2;
    score += genreAffinity * 0.3;
    if (genreAffinity > 0.6) {
      reasons.push(`Matches your love for ${book.genre}`);
    }

    // Author affinity (20%)
    const authorKey = book.author || '';
    const authorAffinity = userFeatures.authorAffinities[authorKey] || 0;
    score += authorAffinity * 0.2;
    if (authorAffinity > 0.4) {
      reasons.push('From an author you enjoy');
    }

    // Quality match (20%)
    const bookQuality = book.qualityScore?.overallScore || 50;
    const qualityMatch = 1 - Math.abs(bookQuality - userFeatures.qualityPreference) / 100;
    score += qualityMatch * 0.2;
    if (bookQuality >= 85) {
      reasons.push('Highly rated by AI');
    }

    // Collaborative score (15%) — looked up from the precomputed batch above
    const collabScore = collabScores.get(book.id) || 0;
    score += collabScore * 0.15;
    if (collabScore > 0.5) {
      reasons.push('Loved by readers like you');
    }

    // Popularity (10%)
    const views = book.statistics?.views || 0;
    const purchases = book.statistics?.purchases || 0;
    const popularityScore = Math.min(
      (Math.log10(views + 1) / 5 + Math.log10(purchases + 1) / 3) / 2,
      1
    );
    score += popularityScore * 0.1;
    if (popularityScore > 0.6) {
      reasons.push('Popular among readers');
    }

    // Freshness bonus (5%)
    const publishedAt = book.publishingStatus?.publishedAt;
    if (publishedAt) {
      const daysSince = Math.floor(
        (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSince <= 14) {
        score += 0.05;
        reasons.push('New release');
      }
    }

    recommendations.push({
      book: book as unknown as IBook,
      score,
      reasons: reasons.length > 0 ? reasons : ['Recommended for you'],
      category: 'personalized',
    });
  }

  // Apply diversity optimization
  const diversified = applyDiversityPenalty(recommendations, diversityFactor);

  // Add exploration recommendations (10% of limit)
  const exploreCount = Math.max(1, Math.floor(limit * 0.1));
  const explorations = await getExplorationRecommendations(userId, userFeatures, exploreCount);
  const exploreRecs: RecommendationWithReason[] = explorations.map((book) => ({
    book,
    score: 0.5,
    reasons: ['Discover something new'],
    category: 'explore' as const,
  }));

  // Combine and limit
  const combined = [...diversified.slice(0, limit - exploreCount), ...exploreRecs];
  return combined.slice(0, limit);
}

/**
 * Get "Because you read X" recommendations
 */
export async function getBecauseYouRead(
  userId: string,
  limit: number = 3,
  booksPerSource: number = 4
): Promise<Array<{ basedOn: IBook; recommendations: IBook[] }>> {
  const userActivity = await UserActivity.findOne({ userId });
  if (!userActivity || userActivity.completedBooks.length === 0) {
    return [];
  }

  // Get recently completed books
  const recentlyCompleted = userActivity.readingHistory
    .filter((h) => h.isCompleted)
    .sort((a, b) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime())
    .slice(0, limit)
    .map((h) => h.bookId.toString());

  const allBooks = await Book.find({
    'publishingStatus.status': 'published',
  });

  const recentlyCompletedSet = new Set(recentlyCompleted);
  const sourceBooks = allBooks.filter(b => recentlyCompletedSet.has(b.id));

  const results: Array<{ basedOn: IBook; recommendations: IBook[] }> = [];

  for (const source of sourceBooks) {
    // Get similar books (hybrid: content + collaborative)
    const contentSimilar = await getContentSimilarBooks(source.id, booksPerSource);
    const collabSimilar = await findSimilarBooks(source.id, booksPerSource);

    // Merge and dedupe
    const collabBookIds = new Set(collabSimilar.map((s) => s.id));
    const collabBooks = allBooks.filter(
      b => collabBookIds.has(b.id) && b.publishingStatus?.status === 'published'
    );

    const allSimilar = [...contentSimilar, ...(collabBooks as unknown as IBook[])];
    const uniqueIds = new Set<string>();
    const unique = allSimilar.filter((b) => {
      const bookId = b.id;
      if (uniqueIds.has(bookId)) return false;
      uniqueIds.add(bookId);
      return true;
    });

    // Filter out books user has already interacted with
    const filtered = unique.filter(
      (b) =>
        !userActivity.completedBooks.some((completedId) => completedId.toString() === b.id) &&
        !userActivity.currentlyReading.some((readingId) => readingId.toString() === b.id)
    );

    if (filtered.length > 0) {
      results.push({
        basedOn: source as unknown as IBook,
        recommendations: filtered.slice(0, booksPerSource),
      });
    }
  }

  return results;
}

/**
 * Get personalized feed combining all recommendation types
 */
export async function getPersonalizedFeed(userId: string): Promise<PersonalizedFeed> {
  const userActivity = await UserActivity.findOne({ userId });

  // Recommended for you
  const recommendedForYou = await getDiversifiedRecommendations(userId, 12, 0.3);

  // PERF: Continue reading — fetch only the specific currently-reading books
  // by id, skipping the heavy full-table scan the old code did.
  let continueReading: Array<{ book: IBook; progress: number; lastReadAt: Date }> = [];
  if (userActivity && userActivity.currentlyReading.length > 0) {
    const currentlyReadingIds = userActivity.currentlyReading.map((id: any) => id.toString());
    const books = await Book.findByIds(currentlyReadingIds);

    continueReading = books.map((book) => {
      const progress = userActivity.readingHistory.find(
        (h: any) => h.bookId.toString() === book.id
      );
      return {
        book: book as unknown as IBook,
        progress: progress?.percentageComplete || 0,
        lastReadAt: progress?.lastReadAt ? new Date(progress.lastReadAt) : new Date(),
      };
    });
    continueReading.sort((a, b) => b.lastReadAt.getTime() - a.lastReadAt.getTime());
  }

  // PERF: Continue writing — limit to 5 drafts, skip heavy JSONB columns
  const drafts = await Book.find({
    author: userId,
    'publishingStatus.status': 'draft',
    _sort: 'updatedAt',
    _order: 'desc',
    _limit: 5,
    _lightweight: true,
  });

  const continueWriting = drafts.map((book) => ({
    book: book as unknown as IBook,
    lastEditedAt: book.updatedAt ? new Date(book.updatedAt) : new Date(),
    wordCount: book.statistics?.wordCount || 0,
  }));

  // Because you read
  const becauseYouRead = await getBecauseYouRead(userId, 2, 4);

  // PERF: Trending — fetch only the top 50 published books sorted by views
  // instead of pulling the whole published catalog and sorting in memory.
  const allPublishedBooks = await Book.find({
    'publishingStatus.status': 'published',
    'publishingStatus.isPublic': true,
    _sort: 'views',
    _order: 'desc',
    _limit: 50,
    _lightweight: true,
  });

  const trending = allPublishedBooks
    .slice()
    .sort((a, b) => {
      const viewsA = a.statistics?.views || 0;
      const viewsB = b.statistics?.views || 0;
      const purchasesA = a.statistics?.purchases || 0;
      const purchasesB = b.statistics?.purchases || 0;
      return (viewsB + purchasesB * 10) - (viewsA + purchasesA * 10);
    })
    .slice(0, 8);

  // New releases — reuse the same dataset we already loaded
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const newReleases = allPublishedBooks
    .filter(b => {
      const publishedAt = b.publishingStatus?.publishedAt;
      if (!publishedAt || new Date(publishedAt) < thirtyDaysAgo) return false;
      return (b.qualityScore?.overallScore || 0) >= 65;
    })
    .sort((a, b) => {
      const dateA = new Date(a.publishingStatus?.publishedAt || 0);
      const dateB = new Date(b.publishingStatus?.publishedAt || 0);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 8);

  return {
    recommendedForYou,
    continueReading,
    continueWriting,
    becauseYouRead,
    trending: trending as unknown as IBook[],
    newReleases: newReleases as unknown as IBook[],
  };
}

// ==================== HELPER FUNCTIONS ====================

function calculateRecencyDecay(date: Date): number {
  const daysSince = Math.floor(
    (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(0.1, Math.exp(-0.693 * daysSince / 14));
}

async function getTrendingWithReasons(limit: number): Promise<RecommendationWithReason[]> {
  const books = await Book.find({
    'publishingStatus.status': 'published',
    'publishingStatus.isPublic': true,
  });

  const sorted = books
    .sort((a, b) => {
      const viewsA = a.statistics?.views || 0;
      const viewsB = b.statistics?.views || 0;
      const purchasesA = a.statistics?.purchases || 0;
      const purchasesB = b.statistics?.purchases || 0;
      return (viewsB + purchasesB * 10) - (viewsA + purchasesA * 10);
    })
    .slice(0, limit);

  return sorted.map((book, index) => ({
    book: book as unknown as IBook,
    score: 1 - index * 0.05,
    reasons: ['Trending on MeStory'],
    category: 'trending' as const,
  }));
}
