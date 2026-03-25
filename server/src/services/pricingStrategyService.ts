import { Book } from '../models/Book';
import { User } from '../models/User';

// Supported languages
type Language = 'en' | 'he';

// Translation map for pricing strategy messages
const pricingTranslations = {
  firstBook: {
    en: {
      reasoning: 'This is your first book! We recommend offering it for free to build an initial readership and collect reviews. Readers are more likely to try a new author when there\'s no financial risk.',
      tips: [
        'A free first book helps build a loyal reader base',
        'Ask readers to leave reviews - they\'re critical for future success',
        'Share the book on social media and reading communities',
        'Use positive reviews to market future books'
      ]
    },
    he: {
      reasoning: 'זה הספר הראשון שלך! מומלץ להציע אותו בחינם כדי לבנות קהל קוראים ראשוני ולאסוף ביקורות. קוראים נוטים יותר לנסות סופר חדש כשאין סיכון כספי.',
      tips: [
        'ספר ראשון בחינם עוזר לבנות בסיס קוראים נאמן',
        'בקש מקוראים להשאיר ביקורות - הן קריטיות להצלחה עתידית',
        'שתף את הספר ברשתות חברתיות ובקהילות קריאה',
        'השתמש בביקורות החיוביות לשווק ספרים עתידיים'
      ]
    }
  },
  secondBookSuccess: {
    en: {
      reasoning: (sales: number) => `You already have ${sales} sales from your first book - great! Now is the time to start generating income. A relatively low price is recommended to continue building your audience.`,
      tips: [
        'A below-average price will help you continue to grow',
        'Offer a discount to readers who read your first book',
        'Consider making your first book free for a limited time to attract new readers',
        'Build a mailing list of interested readers'
      ]
    },
    he: {
      reasoning: (sales: number) => `יש לך כבר ${sales} מכירות מהספר הראשון - מצוין! עכשיו הזמן להתחיל לייצר הכנסה. מומלץ מחיר נמוך יחסית כדי להמשיך לבנות את הקהל.`,
      tips: [
        'מחיר נמוך מהממוצע יעזור להמשיך לגדול',
        'הצע הנחה לקוראים שקראו את הספר הראשון',
        'שקול להציע את הספר הראשון בחינם לתקופה מוגבלת למשוך קוראים חדשים',
        'בנה רשימת תפוצה של קוראים מעוניינים'
      ]
    }
  },
  secondBookNoSuccess: {
    en: {
      reasoning: 'Your first book hasn\'t gained enough readers yet. We recommend offering this book for free or at a symbolic price to increase exposure.',
      tips: [
        'Focus on marketing and reaching new readers',
        'Check the reviews of your first book and learn from them',
        'Consider updating the cover or description of your first book',
        'Join reading and writing communities on social networks'
      ]
    },
    he: {
      reasoning: 'הספר הראשון לא צבר עדיין מספיק קוראים. מומלץ להציע גם את הספר הזה בחינם או במחיר סמלי כדי להגדיל את החשיפה.',
      tips: [
        'התמקד בשיווק ובהגעה לקוראים חדשים',
        'בדוק את הביקורות של הספר הראשון ולמד מהן',
        'שקול לעדכן את הכריכה או התיאור של הספר הראשון',
        'הצטרף לקהילות קריאה וסופרים ברשתות'
      ]
    }
  },
  experiencedSuccess: {
    en: {
      reasoning: (sales: number, books: number) => `With ${sales} sales and ${books} published books, you have a loyal audience! The recommended price is based on your performance and genre prices.`,
      tips: [
        'Your readers are willing to pay - give them value!',
        'Consider offering subscriptions or bundles for loyal readers',
        'Add bonuses like exclusive chapters or behind-the-scenes content',
        'Use a higher price for special or longer books'
      ]
    },
    he: {
      reasoning: (sales: number, books: number) => `עם ${sales} מכירות ו-${books} ספרים מפורסמים, יש לך קהל נאמן! המחיר המומלץ מבוסס על הביצועים שלך והמחירים בז'אנר.`,
      tips: [
        'הקוראים שלך מוכנים לשלם - תן להם ערך!',
        'שקול להציע מנויים או חבילות לקוראים נאמנים',
        'הוסף בונוסים כמו פרקים בלעדיים או תוכן מאחורי הקלעים',
        'השתמש במחיר גבוה יותר לספרים מיוחדים או ארוכים יותר'
      ]
    }
  },
  experiencedNoSuccess: {
    en: {
      reasoning: 'You have experience publishing books. A slightly reduced price from the average can help increase sales and build momentum.',
      tips: [
        'Analyze what works for successful authors in your genre',
        'Consider improving the covers and descriptions of all your books',
        'Build a presence on social media',
        'Consider collaborations with other authors'
      ]
    },
    he: {
      reasoning: 'יש לך ניסיון בפרסום ספרים. מחיר מופחת מעט מהממוצע יכול לעזור להגדיל את המכירות ולבנות תאוצה.',
      tips: [
        'נתח מה עובד אצל סופרים מצליחים בז\'אנר שלך',
        'שקול לשפר את הכריכות והתיאורים של כל הספרים',
        'בנה נוכחות ברשתות חברתיות',
        'שקול שיתופי פעולה עם סופרים אחרים'
      ]
    }
  },
  highDemand: {
    en: (genre: string) => `Demand in the ${genre} genre is high - you can raise the price`,
    he: (genre: string) => `הביקוש בז'אנר ${genre} גבוה - אפשר להעלות מחיר`
  },
  lowDemand: {
    en: 'Genre demand is relatively low - a competitive price will help',
    he: 'הביקוש בז\'אנר נמוך יחסית - מחיר תחרותי יעזור'
  },
  highQuality: {
    en: 'The high quality score justifies a premium price',
    he: 'ציון האיכות הגבוה מצדיק מחיר פרימיום'
  }
};

/**
 * Get user's preferred language
 */
async function getUserLanguage(userId: string): Promise<Language> {
  try {
    const user = await User.findById(userId);
    return (user?.profile?.language as Language) || 'en';
  } catch {
    return 'en';
  }
}

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
    (b: any) => b.publishingStatus?.status === 'published'
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
  const allBooks = await Book.find({
    'publishingStatus.status': 'published',
  });

  // Filter by genre in memory (case-insensitive) and limit to 100
  const genreLower = genre.toLowerCase();
  const genreBooks = allBooks
    .filter((b: any) => (b.genre || '').toLowerCase().includes(genreLower))
    .slice(0, 100);

  // Calculate price statistics
  const prices = genreBooks
    .filter((b: any) => !b.publishingStatus?.isFree && b.publishingStatus?.price)
    .map((b: any) => b.publishingStatus?.price || 0);

  const avgPrice = prices.length > 0
    ? prices.reduce((a: number, b: number) => a + b, 0) / prices.length
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
  // Get the book and user's language preference
  const [book, lang] = await Promise.all([
    Book.findById(bookId),
    getUserLanguage(authorId),
  ]);

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
    const t = pricingTranslations.firstBook[lang];
    reasoning = t.reasoning;
    strategyTips.push(...t.tips);
  }
  // Second book with some success
  else if (authorStats.publishedBooks === 1 && authorStats.totalSales > 10) {
    recommendFree = false;
    recommendedPrice = Math.min(20, marketAnalysis.genreAveragePrice * 0.5);
    const t = pricingTranslations.secondBookSuccess[lang];
    reasoning = t.reasoning(authorStats.totalSales);
    strategyTips.push(...t.tips);
  }
  // Second book without much success
  else if (authorStats.publishedBooks === 1 && authorStats.totalSales <= 10) {
    recommendFree = true;
    recommendedPrice = 0;
    const t = pricingTranslations.secondBookNoSuccess[lang];
    reasoning = t.reasoning;
    strategyTips.push(...t.tips);
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

    const t = pricingTranslations.experiencedSuccess[lang];
    reasoning = t.reasoning(authorStats.totalSales, authorStats.publishedBooks);
    strategyTips.push(...t.tips);
  }
  // Third+ book without great success
  else if (authorStats.publishedBooks >= 2) {
    recommendFree = false;
    recommendedPrice = Math.round(marketAnalysis.genreAveragePrice * 0.7);
    const t = pricingTranslations.experiencedNoSuccess[lang];
    reasoning = t.reasoning;
    strategyTips.push(...t.tips);
  }

  // Adjust based on market demand
  if (marketAnalysis.demandLevel === 'high' && !recommendFree) {
    recommendedPrice = Math.round(recommendedPrice * 1.2);
    strategyTips.push(pricingTranslations.highDemand[lang](book.genre || 'Fiction'));
  } else if (marketAnalysis.demandLevel === 'low' && !recommendFree) {
    recommendedPrice = Math.round(recommendedPrice * 0.8);
    strategyTips.push(pricingTranslations.lowDemand[lang]);
  }

  // Adjust based on quality score
  if (book.qualityScore?.overallScore && book.qualityScore.overallScore >= 85 && !recommendFree) {
    recommendedPrice = Math.round(recommendedPrice * 1.15);
    strategyTips.push(pricingTranslations.highQuality[lang]);
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
      totalRevenue: authorStats.totalRevenue,
      averageRating: Math.round(authorStats.averageRating * 10) / 10,
      averageQualityScore: Math.round(authorStats.averageQualityScore * 10) / 10,
    },
    marketAnalysis,
    strategyTips: strategyTips.slice(0, 4), // Limit to 4 tips
  };
}
