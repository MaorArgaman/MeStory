import Book from '../models/Book';
import User from '../models/User';
import Transaction from '../models/Transaction';

interface AuthorStats {
  totalBooks: number;
  publishedBooks: number;
  totalSales: number;
  totalRevenue: number;
  averageRating: number;
  averageQualityScore: number;
}

interface MarketAnalysis {
  genreAveragePrice: number;
  competitorPriceRange: { min: number; max: number };
  demandLevel: 'low' | 'medium' | 'high';
  recentSalesInGenre: number;
}

interface PricingStrategy {
  recommendedPrice: number;
  recommendFree: boolean;
  reasoning: string;
  authorStats: AuthorStats;
  marketAnalysis: MarketAnalysis;
  strategyTips: string[];
}

/**
 * Get author statistics for pricing decisions
 */
async function getAuthorStats(authorId: string): Promise<AuthorStats> {
  // Get all books by author
  const books = await Book.find({ author: authorId });
  const publishedBooks = books.filter(
    (b) => b.publishingStatus?.status === 'published'
  );

  // Calculate total sales and revenue
  let totalSales = 0;
  let totalRevenue = 0;
  let totalRatings = 0;
  let ratingSum = 0;
  let qualitySum = 0;
  let qualityCount = 0;

  for (const book of publishedBooks) {
    totalSales += book.statistics?.purchases || 0;
    totalRevenue += (book.statistics?.purchases || 0) * (book.publishingStatus?.price || 0);

    // Calculate average rating from reviews
    if (book.reviews && book.reviews.length > 0) {
      for (const review of book.reviews) {
        if (review.rating) {
          ratingSum += review.rating;
          totalRatings++;
        }
      }
    }

    // Calculate quality scores
    if (book.qualityScore?.overallScore) {
      qualitySum += book.qualityScore.overallScore;
      qualityCount++;
    }
  }

  return {
    totalBooks: books.length,
    publishedBooks: publishedBooks.length,
    totalSales,
    totalRevenue,
    averageRating: totalRatings > 0 ? ratingSum / totalRatings : 0,
    averageQualityScore: qualityCount > 0 ? qualitySum / qualityCount : 0,
  };
}

/**
 * Analyze market conditions for the book's genre
 */
async function analyzeMarket(genre: string): Promise<MarketAnalysis> {
  // Get all published books in the genre
  const genreBooks = await Book.find({
    genre: { $regex: new RegExp(genre, 'i') },
    'publishingStatus.status': 'published',
  }).limit(100);

  // Calculate price statistics
  const prices = genreBooks
    .filter((b) => !b.publishingStatus?.isFree && b.publishingStatus?.price)
    .map((b) => b.publishingStatus?.price || 0);

  const avgPrice = prices.length > 0
    ? prices.reduce((a, b) => a + b, 0) / prices.length
    : 25;

  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 100;

  // Calculate recent sales (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let recentSales = 0;
  for (const book of genreBooks) {
    recentSales += book.statistics?.purchases || 0;
  }

  // Determine demand level
  let demandLevel: 'low' | 'medium' | 'high' = 'medium';
  const avgSalesPerBook = genreBooks.length > 0 ? recentSales / genreBooks.length : 0;

  if (avgSalesPerBook > 50) {
    demandLevel = 'high';
  } else if (avgSalesPerBook < 10) {
    demandLevel = 'low';
  }

  return {
    genreAveragePrice: Math.round(avgPrice),
    competitorPriceRange: { min: Math.round(minPrice), max: Math.round(maxPrice) },
    demandLevel,
    recentSalesInGenre: recentSales,
  };
}

/**
 * Generate pricing strategy using AI-like logic
 */
export async function generatePricingStrategy(
  bookId: string,
  authorId: string
): Promise<PricingStrategy> {
  // Get the book
  const book = await Book.findById(bookId);
  if (!book) {
    throw new Error('Book not found');
  }

  // Get author statistics
  const authorStats = await getAuthorStats(authorId);

  // Analyze market
  const marketAnalysis = await analyzeMarket(book.genre || 'Fiction');

  // Determine pricing strategy
  let recommendedPrice = 0;
  let recommendFree = true;
  let reasoning = '';
  const strategyTips: string[] = [];

  // First book - recommend free
  if (authorStats.publishedBooks === 0) {
    recommendFree = true;
    recommendedPrice = 0;
    reasoning = 'זה הספר הראשון שלך! מומלץ להציע אותו בחינם כדי לבנות קהל קוראים ראשוני ולאסוף ביקורות. קוראים נוטים יותר לנסות סופר חדש כשאין סיכון כספי.';
    strategyTips.push(
      'ספר ראשון בחינם עוזר לבנות בסיס קוראים נאמן',
      'בקש מקוראים להשאיר ביקורות - הן קריטיות להצלחה עתידית',
      'שתף את הספר ברשתות חברתיות ובקהילות קריאה',
      'השתמש בביקורות החיוביות לשווק ספרים עתידיים'
    );
  }
  // Second book with some success
  else if (authorStats.publishedBooks === 1 && authorStats.totalSales > 10) {
    recommendFree = false;
    recommendedPrice = Math.min(20, marketAnalysis.genreAveragePrice * 0.5);
    reasoning = `יש לך כבר ${authorStats.totalSales} מכירות מהספר הראשון - מצוין! עכשיו הזמן להתחיל לייצר הכנסה. מומלץ מחיר נמוך יחסית כדי להמשיך לבנות את הקהל.`;
    strategyTips.push(
      'מחיר נמוך מהממוצע יעזור להמשיך לגדול',
      'הצע הנחה לקוראים שקראו את הספר הראשון',
      'שקול להציע את הספר הראשון בחינם לתקופה מוגבלת למשוך קוראים חדשים',
      'בנה רשימת תפוצה של קוראים מעוניינים'
    );
  }
  // Second book without much success
  else if (authorStats.publishedBooks === 1 && authorStats.totalSales <= 10) {
    recommendFree = true;
    recommendedPrice = 0;
    reasoning = 'הספר הראשון לא צבר עדיין מספיק קוראים. מומלץ להציע גם את הספר הזה בחינם או במחיר סמלי כדי להגדיל את החשיפה.';
    strategyTips.push(
      'התמקד בשיווק ובהגעה לקוראים חדשים',
      'בדוק את הביקורות של הספר הראשון ולמד מהן',
      'שקול לעדכן את הכריכה או התיאור של הספר הראשון',
      'הצטרף לקהילות קריאה וסופרים ברשתות'
    );
  }
  // Third+ book with good track record
  else if (authorStats.publishedBooks >= 2 && authorStats.totalSales > 50) {
    recommendFree = false;
    // Calculate based on average rating and quality
    const performanceFactor = Math.min(
      1.5,
      1 + (authorStats.averageRating / 5) * 0.3 + (authorStats.totalSales / 100) * 0.2
    );
    recommendedPrice = Math.round(
      marketAnalysis.genreAveragePrice * performanceFactor
    );
    recommendedPrice = Math.min(recommendedPrice, marketAnalysis.competitorPriceRange.max);

    reasoning = `עם ${authorStats.totalSales} מכירות ו-${authorStats.publishedBooks} ספרים מפורסמים, יש לך קהל נאמן! המחיר המומלץ מבוסס על הביצועים שלך והמחירים בז'אנר.`;
    strategyTips.push(
      'הקוראים שלך מוכנים לשלם - תן להם ערך!',
      'שקול להציע מנויים או חבילות לקוראים נאמנים',
      'הוסף בונוסים כמו פרקים בלעדיים או תוכן מאחורי הקלעים',
      'השתמש במחיר גבוה יותר לספרים מיוחדים או ארוכים יותר'
    );
  }
  // Third+ book without great success
  else if (authorStats.publishedBooks >= 2) {
    recommendFree = false;
    recommendedPrice = Math.round(marketAnalysis.genreAveragePrice * 0.7);
    reasoning = 'יש לך ניסיון בפרסום ספרים. מחיר מופחת מעט מהממוצע יכול לעזור להגדיל את המכירות ולבנות תאוצה.';
    strategyTips.push(
      'נתח מה עובד אצל סופרים מצליחים בז\'אנר שלך',
      'שקול לשפר את הכריכות והתיאורים של כל הספרים',
      'בנה נוכחות ברשתות חברתיות',
      'שקול שיתופי פעולה עם סופרים אחרים'
    );
  }

  // Adjust based on market demand
  if (marketAnalysis.demandLevel === 'high' && !recommendFree) {
    recommendedPrice = Math.round(recommendedPrice * 1.2);
    strategyTips.push(
      `הביקוש בז'אנר ${book.genre} גבוה - אפשר להעלות מחיר`
    );
  } else if (marketAnalysis.demandLevel === 'low' && !recommendFree) {
    recommendedPrice = Math.round(recommendedPrice * 0.8);
    strategyTips.push(
      `הביקוש בז'אנר נמוך יחסית - מחיר תחרותי יעזור`
    );
  }

  // Adjust based on quality score
  if (book.qualityScore?.overallScore && book.qualityScore.overallScore >= 85 && !recommendFree) {
    recommendedPrice = Math.round(recommendedPrice * 1.15);
    strategyTips.push('ציון האיכות הגבוה מצדיק מחיר פרימיום');
  }

  // Ensure price is within reasonable bounds
  recommendedPrice = Math.max(0, Math.min(recommendedPrice, 150));

  return {
    recommendedPrice,
    recommendFree,
    reasoning,
    authorStats: {
      totalBooks: authorStats.totalBooks,
      publishedBooks: authorStats.publishedBooks,
      totalSales: authorStats.totalSales,
      averageRating: Math.round(authorStats.averageRating * 10) / 10,
    },
    marketAnalysis,
    strategyTips: strategyTips.slice(0, 4), // Limit to 4 tips
  };
}
