import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
} from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { GlassCard, GlowingButton } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';

interface Book {
  _id: string;
  title: string;
  author: {
    _id: string;
    name: string;
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    loadBook();
  }, [id]);

  const loadBook = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/books/${id}`);
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
    } catch (error) {
      console.error('Failed to load book:', error);
      toast.error('Failed to load book details');
      navigate('/marketplace');
    } finally {
      setLoading(false);
    }
  };

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
      toast.error('Failed to like book');
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
        loadBook(); // Reload to show new review
      }
    } catch (error: any) {
      console.error('Failed to submit review:', error);
      toast.error(error.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-magic-gold mx-auto mb-4 animate-pulse" />
          <p className="text-gray-300 text-lg">Loading book details...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return null;
  }

  const coverImage = book.coverDesign?.front?.imageUrl;
  const coverBg = book.coverDesign?.front?.backgroundColor || '#1a1a3e';

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
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
                className="w-96 h-[576px] rounded-2xl shadow-2xl overflow-hidden"
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
                  className="absolute -top-4 -right-4"
                >
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-magic-gold to-yellow-600 flex items-center justify-center shadow-glow-gold">
                      <div className="text-center">
                        <Sparkles className="w-8 h-8 text-deep-space mx-auto mb-1" />
                        <p className="text-xs font-bold text-deep-space">
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
            <h1 className="text-6xl font-display font-bold gradient-gold mb-4">
              {book.title}
            </h1>

            {/* Author */}
            <Link
              to={`/profile/${book.author._id}`}
              className="flex items-center gap-3 mb-6 group w-fit"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-magic-gold to-yellow-600 flex items-center justify-center shadow-glow-gold">
                <User className="w-6 h-6 text-deep-space" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Written by</p>
                <p className="text-xl font-semibold text-white group-hover:text-magic-gold transition-colors">
                  {book.author.name}
                </p>
              </div>
            </Link>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-6 mb-8">
              {/* Rating */}
              {book.statistics.averageRating && (
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-magic-gold fill-magic-gold" />
                  <span className="text-white font-semibold">
                    {book.statistics.averageRating.toFixed(1)}
                  </span>
                  <span className="text-gray-400 text-sm">
                    ({book.statistics.totalReviews} reviews)
                  </span>
                </div>
              )}

              {/* Views */}
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-gray-400" />
                <span className="text-gray-300">{book.statistics.views} views</span>
              </div>

              {/* Word Count */}
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-gray-400" />
                <span className="text-gray-300">
                  {book.statistics.wordCount.toLocaleString()} words
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-8">
              {/* Read/Buy Button */}
              <GlowingButton
                variant="gold"
                size="lg"
                onClick={async () => {
                  if (book.publishingStatus.isFree) {
                    window.location.href = `/read/${book._id}`;
                  } else {
                    // Purchase the book
                    try {
                      toast.loading('Processing purchase...', { id: 'purchase' });
                      const response = await api.post(`/books/${book._id}/purchase`);
                      if (response.data.success) {
                        toast.success('Purchase successful! Redirecting to reader...', { id: 'purchase' });
                        setTimeout(() => {
                          window.location.href = `/read/${book._id}`;
                        }, 1500);
                      }
                    } catch (error: any) {
                      console.error('Purchase error:', error);
                      toast.error(
                        error.response?.data?.error || 'Failed to purchase book. Please try again.',
                        { id: 'purchase' }
                      );
                    }
                  }
                }}
              >
                <BookOpen className="w-5 h-5" />
                {book.publishingStatus.isFree
                  ? 'Read Now'
                  : `Buy for $${book.publishingStatus.price}`}
              </GlowingButton>

              {/* Like Button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleLike}
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
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Calendar className="w-4 h-4" />
              <span>
                Published {new Date(book.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
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
              <h2 className="text-3xl font-display font-bold text-magic-gold mb-6">
                Synopsis
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
              <h2 className="text-3xl font-display font-bold text-magic-gold flex items-center gap-3">
                <MessageCircle className="w-8 h-8" />
                Reviews ({book.statistics.totalReviews})
              </h2>

              {user && !book.reviews.some((r) => r.user === user._id) && (
                <GlowingButton
                  variant="cosmic"
                  size="md"
                  onClick={() => setShowReviewForm(!showReviewForm)}
                >
                  Write a Review
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
                      Your Review
                    </h3>

                    {/* Star Rating */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-400 mb-2">Rating</p>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <motion.button
                            key={star}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setReviewRating(star)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`w-8 h-8 transition-all ${
                                star <= reviewRating
                                  ? 'fill-magic-gold text-magic-gold'
                                  : 'text-gray-600 hover:text-gray-400'
                              }`}
                            />
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Comment */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-400 mb-2">Comment</p>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share your thoughts about this book..."
                        className="w-full h-32 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-magic-gold/50 focus:shadow-glow-gold transition-all resize-none"
                        maxLength={1000}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {reviewComment.length} / 1000 characters
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
                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                      </GlowingButton>
                      <GlowingButton
                        variant="cosmic"
                        size="md"
                        onClick={() => setShowReviewForm(false)}
                      >
                        Cancel
                      </GlowingButton>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reviews List */}
            <div className="space-y-6">
              {book.reviews.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">
                    No reviews yet. Be the first to review this book!
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
                                ? 'fill-magic-gold text-magic-gold'
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
