import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BookLoader from '../components/common/BookLoader';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Star,
  User,
  Calendar,
  BookOpen,
  MessageCircle,
  Sparkles,
  Eye,
  Loader2,
} from 'lucide-react';
import { api, paymentApi } from '../services/api';
import toast from 'react-hot-toast';
import { GlassCard, GlowingButton, OptimizedImage, getAuthorProfileAlt } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { PaymentConfirmationModal, PaymentSuccessAnimation } from '../components/payment';
import { getFriendlyErrorMessage } from '../utils/errorMessages';
import { SEO, BookSchema, Breadcrumb } from '../components/seo';

interface Book {
  _id: string;
  title: string;
  author: {
    _id: string;
    name: string;
    profile?: {
      avatar?: string;
    };
  };
  genre: string;
  synopsis?: string;
  coverDesign?: {
    front?: {
      imageUrl?: string;
      backgroundColor?: string;
    };
  };
  qualityScore?: {
    overallScore: number;
    rating: number;
    ratingLabel: string;
  };
  publishingStatus: {
    price: number;
    isFree: boolean;
  };
  statistics: {
    wordCount: number;
    pageCount: number;
    views: number;
    averageRating?: number;
    totalReviews: number;
  };
  likes: number;
  likedBy: string[];
  reviews: Array<{
    _id: string;
    user: string;
    userName: string;
    rating: number;
    comment: string;
    createdAt: string;
  }>;
  createdAt: string;
}

export default function BookDetailsPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  const { formatCurrency } = useCurrency();

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Purchase states
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();

    const loadBook = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/books/public/${id}`, {
          signal: abortController.signal,
        });
        if (response.data.success) {
          const bookData = response.data.data;
          setBook(bookData);
          setLocalLikes(bookData.likes || 0);

          // Check if user has liked this book
          if (user && bookData.likedBy) {
            setIsLiked(bookData.likedBy.includes(user._id));
          }

          // Increment view count
          await api.post(`/books/${id}/view`).catch(() => {});
        }
      } catch (error: unknown) {
        // Ignore abort errors
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        // Check for axios cancel
        if (error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'ERR_CANCELED') {
          return;
        }
        console.error('Failed to load book:', error);
        const friendlyMessage = getFriendlyErrorMessage(error, language as 'en' | 'he');
        toast.error(friendlyMessage);
        navigate('/marketplace');
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadBook();

    return () => {
      abortController.abort();
    };
  }, [id, user, navigate, language]);

  // Separate reload function for use after submitting reviews
  const reloadBook = useCallback(async () => {
    try {
      const response = await api.get(`/books/public/${id}`);
      if (response.data.success) {
        const bookData = response.data.data;
        setBook(bookData);
        setLocalLikes(bookData.likes || 0);
        if (user && bookData.likedBy) {
          setIsLiked(bookData.likedBy.includes(user._id));
        }
      }
    } catch (error) {
      console.error('Failed to reload book:', error);
    }
  }, [id, user]);

  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to like books');
      navigate('/login');
      return;
    }

    try {
      const response = await api.post(`/books/${id}/like`);
      if (response.data.success) {
        setIsLiked(response.data.data.isLiked);
        setLocalLikes(response.data.data.likes);
      }
    } catch (error) {
      console.error('Failed to like book:', error);
      const friendlyMessage = getFriendlyErrorMessage(error, language as 'en' | 'he');
      toast.error(friendlyMessage);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error('Please login to review books');
      navigate('/login');
      return;
    }

    if (reviewRating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!reviewComment.trim()) {
      toast.error('Please write a comment');
      return;
    }

    try {
      setSubmittingReview(true);
      const response = await api.post(`/books/${id}/review`, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      if (response.data.success) {
        toast.success('Review submitted successfully');
        setShowReviewForm(false);
        setReviewRating(0);
        setReviewComment('');
        reloadBook(); // Reload to show new review
      }
    } catch (error: unknown) {
      console.error('Failed to submit review:', error);
      const friendlyMessage = getFriendlyErrorMessage(error, language as 'en' | 'he');
      toast.error(friendlyMessage);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Handle read/buy button click
  const handleReadOrBuy = () => {
    if (!book) return;

    if (book.publishingStatus?.isFree) {
      window.location.href = `/read/${book._id}`;
    } else {
      // Show confirmation modal for paid books
      setShowConfirmModal(true);
    }
  };

  // Handle purchase confirmation
  const handleConfirmPurchase = async () => {
    if (!book) return;

    try {
      setIsPurchasing(true);

      // Step 1: Create purchase order with idempotency key
      toast.loading('Creating order...', { id: 'purchase' });

      const orderResponse = await paymentApi.createBookPurchaseOrder(book._id);

      if (!orderResponse.success) {
        throw new Error(orderResponse.error || 'Failed to create order');
      }

      const { orderId, mockMode } = orderResponse.data;
      toast.loading('Processing payment...', { id: 'purchase' });

      // Step 2: Capture payment with idempotency key
      const captureResponse = await paymentApi.captureBookPurchase(orderId);

      if (!captureResponse.success) {
        throw new Error(captureResponse.error || 'Failed to capture payment');
      }

      // Close modal and show success animation
      setShowConfirmModal(false);
      setShowSuccessAnimation(true);

      toast.success(
        mockMode
          ? 'Purchase successful (Mock Mode)!'
          : 'Purchase successful!',
        { id: 'purchase' }
      );

      // Redirect to reader after showing success animation
      setTimeout(() => {
        window.location.href = `/read/${book._id}`;
      }, 2500);

    } catch (error: unknown) {
      console.error('Purchase error:', error);
      const friendlyMessage = getFriendlyErrorMessage(error, language as 'en' | 'he');
      toast.error(friendlyMessage, { id: 'purchase' });
    } finally {
      setIsPurchasing(false);
    }
  };

  // Close confirmation modal
  const handleCloseModal = () => {
    if (!isPurchasing) {
      setShowConfirmModal(false);
    }
  };

  if (loading) {
    return <BookLoader variant="fullscreen" message="טוען..." />;
  }

  if (!book) {
    return null;
  }

  const coverImage = book.coverDesign?.front?.imageUrl;
  const coverBg = book.coverDesign?.front?.backgroundColor || '#1a1a3e';

  return (
    <div className="min-h-screen pt-32 pb-20">
      {/* Breadcrumb Navigation */}
      <div className="max-w-7xl mx-auto px-6 mb-6">
        <Breadcrumb
          items={[
            { name: language === 'he' ? 'שוק הספרים' : 'Marketplace', url: '/marketplace' },
            { name: book.title, url: `/book/${book._id}` },
          ]}
        />
      </div>

      <SEO
        title={book.title}
        description={book.synopsis || `Read "${book.title}" by ${book.author?.name || 'Unknown'} on MeStory`}
        type="book"
        image={coverImage}
        locale={language === 'he' ? 'he_IL' : 'en_US'}
        url={`/book/${book._id}`}
        author={book.author?.name || 'Unknown'}
        publishedTime={book.createdAt}
      />
      <BookSchema
        title={book.title}
        description={book.synopsis}
        author={{
          name: book.author?.name || 'Unknown',
          url: book.author?._id ? `/profile/${book.author._id}` : '#',
        }}
        image={coverImage}
        datePublished={book.createdAt}
        genre={book.genre ? [book.genre] : undefined}
        numberOfPages={book.statistics?.pageCount}
        inLanguage={language === 'he' ? 'he' : 'en'}
        price={book.publishingStatus?.isFree ? undefined : book.publishingStatus?.price}
        currency="USD"
        url={`/book/${book._id}`}
        rating={book.statistics?.averageRating && book.statistics?.totalReviews ? {
          value: book.statistics.averageRating,
          count: book.statistics.totalReviews,
        } : undefined}
      />

      {/* Payment Confirmation Modal */}
      <PaymentConfirmationModal
        isOpen={showConfirmModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmPurchase}
        isProcessing={isPurchasing}
        type="book"
        bookTitle={book.title}
        bookAuthor={book.author?.name || 'Unknown'}
        bookPrice={book.publishingStatus?.price || 0}
        bookCover={coverImage}
      />

      {/* Success Animation Overlay */}
      <AnimatePresence>
        {showSuccessAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <PaymentSuccessAnimation
              size="lg"
              variant="gold"
              message={language === 'he' ? 'הרכישה הושלמה!' : 'Purchase Successful!'}
              subMessage={language === 'he' ? 'מעביר לקורא...' : 'Redirecting to reader...'}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-6">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12 lg:mb-16">
          {/* Book Cover */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex justify-center lg:justify-end"
          >
            <div className="relative">
              <motion.div
                whileHover={{ scale: 1.05, rotateY: 5 }}
                transition={{ duration: 0.3 }}
                className="w-64 sm:w-80 md:w-96 h-[384px] sm:h-[480px] md:h-[576px] rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden"
                style={{
                  background: coverImage ? `url(${coverImage})` : coverBg,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {!coverImage && (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-32 h-32 text-white/20" />
                  </div>
                )}
              </motion.div>

              {/* Floating Quality Badge */}
              {book.qualityScore && book.qualityScore.overallScore >= 80 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                  className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4"
                >
                  <div className="relative">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-memorial-gold to-yellow-600 flex items-center justify-center shadow-glow-gold">
                      <div className="text-center">
                        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-deep-space mx-auto mb-1" />
                        <p className="text-[10px] sm:text-xs font-bold text-deep-space">
                          {book.qualityScore.ratingLabel}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Book Info */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col justify-center"
          >
            {/* Genre Badge */}
            <div className="mb-4">
              <span className="px-4 py-2 rounded-full bg-indigo-600/30 text-indigo-300 text-sm font-semibold border border-indigo-500/30">
                {book.genre}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold gradient-gold mb-4">
              {book.title}
            </h1>

            {/* Author */}
            <Link
              to={book.author?._id ? `/profile/${book.author._id}` : '#'}
              className="flex items-center gap-3 mb-6 group w-fit"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-memorial-gold to-yellow-600 flex items-center justify-center shadow-glow-gold overflow-hidden">
                {book.author?.profile?.avatar ? (
                  <OptimizedImage
                    src={book.author?.profile?.avatar}
                    alt={getAuthorProfileAlt(book.author?.name || 'Author')}
                    lazy={false}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-deep-space" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-400">{t('book_details.written_by')}</p>
                <p className="text-xl font-semibold text-white group-hover:text-memorial-gold transition-colors">
                  {book.author?.name || 'Unknown Author'}
                </p>
              </div>
            </Link>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
              {/* Rating */}
              {book.statistics?.averageRating && (
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-memorial-gold fill-memorial-gold" />
                  <span className="text-white font-semibold">
                    {book.statistics.averageRating.toFixed(1)}
                  </span>
                  <span className="text-gray-400 text-sm">
                    ({book.statistics?.totalReviews || 0} {t('book_details.reviews.title')})
                  </span>
                </div>
              )}

              {/* Views */}
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-gray-400" />
                <span className="text-gray-300">{book.statistics?.views || 0} {t('book_details.views')}</span>
              </div>

              {/* Word Count */}
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-gray-400" />
                <span className="text-gray-300">
                  {(book.statistics?.wordCount || 0).toLocaleString()} {t('book_details.words')}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
              {/* Read/Buy Button */}
              <GlowingButton
                variant="gold"
                size="lg"
                onClick={handleReadOrBuy}
                disabled={isPurchasing}
              >
                {isPurchasing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {language === 'he' ? 'מעבד...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <BookOpen className="w-5 h-5" />
                    {book.publishingStatus?.isFree
                      ? t('book_details.read_now')
                      : t('book_details.buy_for', { price: formatCurrency(book.publishingStatus?.price || 0) })}
                  </>
                )}
              </GlowingButton>

              {/* Like Button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleLike}
                aria-label={isLiked ? 'Unlike this book' : 'Like this book'}
                aria-pressed={isLiked}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  isLiked
                    ? 'bg-red-600 text-white shadow-glow-gold'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                <motion.div
                  animate={isLiked ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <Heart
                    className={`w-5 h-5 ${isLiked ? 'fill-white' : ''}`}
                  />
                </motion.div>
                <span>{localLikes}</span>
              </motion.button>
            </div>

            {/* Published Date */}
            {book.createdAt && !isNaN(new Date(book.createdAt).getTime()) && (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Calendar className="w-4 h-4" />
                <span>
                  {t('book_details.published_on', {
                    date: new Date(book.createdAt).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  })}
                </span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Synopsis Section */}
        {book.synopsis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-16"
          >
            <GlassCard>
              <h2 className="text-3xl font-display font-bold text-memorial-gold mb-6">
                {t('book_details.synopsis')}
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-line">
                {book.synopsis}
              </p>
            </GlassCard>
          </motion.div>
        )}

        {/* Reviews Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-display font-bold text-memorial-gold flex items-center gap-3">
                <MessageCircle className="w-8 h-8" />
                {t('book_details.reviews_section')} ({book.statistics?.totalReviews || 0})
              </h2>

              {user && !book.reviews?.some((r) => r.user === user._id) && (
                <GlowingButton
                  variant="cosmic"
                  size="md"
                  onClick={() => setShowReviewForm(!showReviewForm)}
                >
                  {t('book_details.reviews.title')}
                </GlowingButton>
              )}
            </div>

            {/* Review Form */}
            <AnimatePresence>
              {showReviewForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-8 pb-8 border-b border-white/10"
                >
                  <div className="bg-white/5 rounded-xl p-6">
                    <h3 className="font-display font-semibold text-white mb-4">
                      {t('book_details.reviews.your_review')}
                    </h3>

                    {/* Star Rating */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-400 mb-2" id="rating-label">{t('book_details.reviews.rating')}</p>
                      <div className="flex gap-2" role="radiogroup" aria-labelledby="rating-label">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <motion.button
                            key={star}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setReviewRating(star)}
                            className="focus:outline-none focus:ring-2 focus:ring-memorial-gold focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                            aria-checked={reviewRating === star}
                            role="radio"
                          >
                            <Star
                              className={`w-8 h-8 transition-all ${
                                star <= reviewRating
                                  ? 'fill-memorial-gold text-memorial-gold'
                                  : 'text-gray-600 hover:text-gray-400'
                              }`}
                            />
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Comment */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-400 mb-2">{t('book_details.reviews.comment')}</p>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder={t('book_details.reviews.comment_placeholder')}
                        className="w-full h-32 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-memorial-gold/50 focus:shadow-glow-gold transition-all resize-none"
                        maxLength={1000}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {reviewComment.length} / 1000 {t('book_details.reviews.characters')}
                      </p>
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3">
                      <GlowingButton
                        variant="gold"
                        size="md"
                        onClick={handleSubmitReview}
                        disabled={submittingReview}
                      >
                        {submittingReview ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            {t('book_details.reviews.submitting')}
                          </>
                        ) : (
                          t('book_details.reviews.submit')
                        )}
                      </GlowingButton>
                      <GlowingButton
                        variant="cosmic"
                        size="md"
                        onClick={() => setShowReviewForm(false)}
                      >
                        {t('buttons.cancel')}
                      </GlowingButton>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reviews List */}
            <div className="space-y-6">
              {!book.reviews || book.reviews.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">
                    {t('book_details.reviews.empty')}
                  </p>
                </div>
              ) : (
                book.reviews.map((review) => (
                  <motion.div
                    key={review._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 rounded-xl p-6"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{review.userName}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating
                                ? 'fill-memorial-gold text-memorial-gold'
                                : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-gray-300 leading-relaxed">{review.comment}</p>
                  </motion.div>
                ))
              )}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
