import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  User,
  UserPlus,
  UserMinus,
  BookOpen,
  Eye,
  Star,
  Sparkles,
  Crown,
} from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { GlassCard, GlowingButton } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook that animates a number from 0 to the target value over a given duration.
 */
function useCountUp(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startedRef = useRef(false);

  const start = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
  }, [target, duration]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Reset when target changes
  useEffect(() => {
    startedRef.current = false;
    setValue(0);
    if (target > 0) start();
  }, [target, start]);

  return value;
}

interface AuthorData {
  user: {
    id: string;
    name: string;
    email: string;
    bio?: string;
    avatar?: string;
    headerImage?: string;
    role: string;
    stats: {
      publishedBooks: number;
      totalReads: number;
      followers: number;
      rating: number;
    };
    isFollowing: boolean;
  };
  books: Array<{
    _id: string;
    title: string;
    genre: string;
    coverDesign?: {
      front?: {
        imageUrl?: string;
        backgroundColor?: string;
      };
    };
    qualityScore?: {
      overallScore: number;
      ratingLabel: string;
    };
    statistics: {
      views: number;
      averageRating?: number;
    };
    publishingStatus: {
      price: number;
      isFree: boolean;
    };
    createdAt: string;
  }>;
}

function AnimatedStatsGrid({ publishedBooks, totalReads, followers, rating, t }: {
  publishedBooks: number;
  totalReads: number;
  followers: number;
  rating: number;
  t: (key: string) => string;
}) {
  const animBooks = useCountUp(publishedBooks);
  const animReads = useCountUp(totalReads);
  const animFollowers = useCountUp(followers);
  const animRating = useCountUp(Math.round(rating * 10)); // animate integer, display as decimal

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      <div className="text-center">
        <p className="text-3xl font-bold text-memorial-gold">
          {animBooks}
        </p>
        <p className="text-gray-400 text-sm mt-1">{t('authorProfile.booksPublished')}</p>
      </div>
      <div className="text-center">
        <p className="text-3xl font-bold text-memorial-gold">
          {animReads.toLocaleString()}
        </p>
        <p className="text-gray-400 text-sm mt-1">{t('authorProfile.totalReads')}</p>
      </div>
      <div className="text-center">
        <p className="text-3xl font-bold text-memorial-gold">{animFollowers}</p>
        <p className="text-gray-400 text-sm mt-1">{t('authorProfile.followers')}</p>
      </div>
      {rating > 0 && (
        <div className="text-center">
          <p className="text-3xl font-bold text-memorial-gold">
            {(animRating / 10).toFixed(1)}
          </p>
          <p className="text-gray-400 text-sm mt-1">{t('authorProfile.averageRating')}</p>
        </div>
      )}
    </div>
  );
}

export default function AuthorProfilePage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [authorData, setAuthorData] = useState<AuthorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'books' | 'about'>('books');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  useEffect(() => {
    loadAuthorProfile();
  }, [id]);

  const loadAuthorProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/user/profile/${id}`);
      if (response.data.success) {
        setAuthorData(response.data.data);
        setIsFollowing(response.data.data.user.isFollowing);
        setFollowersCount(response.data.data.user.stats.followers);
      }
    } catch (error) {
      console.error('Failed to load author profile:', error);
      toast.error('Failed to load profile');
      navigate('/marketplace');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      toast.error('Please login to follow authors');
      navigate('/login');
      return;
    }

    try {
      const response = await api.post(`/user/${id}/follow`);
      if (response.data.success) {
        setIsFollowing(response.data.data.isFollowing);
        setFollowersCount(response.data.data.followersCount);
        toast.success(response.data.message);
      }
    } catch (error: any) {
      console.error('Failed to follow user:', error);
      toast.error(error.response?.data?.error || 'Failed to follow user');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-memorial-gold mx-auto mb-4 animate-pulse" />
          <p className="text-gray-300 text-lg">{t('authorProfile.loading')}</p>
        </div>
      </div>
    );
  }

  if (!authorData) {
    return null;
  }

  const { user: author, books } = authorData;
  const headerImage = author.headerImage || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <div
        className="h-48 sm:h-64 md:h-80 lg:h-96 relative"
        style={{
          background: author.headerImage
            ? `url(${author.headerImage})`
            : headerImage,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-deep-space" />
      </div>

      {/* Profile Info Section */}
      <div className="relative -mt-16 sm:-mt-24 md:-mt-32 px-4 sm:px-6 pb-12 sm:pb-20">
        <div className="max-w-7xl mx-auto">
          <GlassCard className="mb-6 sm:mb-8">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-4 sm:gap-6">
              {/* Avatar */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="relative -mt-12 sm:-mt-16 md:-mt-24"
              >
                <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-memorial-gold to-yellow-600 flex items-center justify-center shadow-glow-gold ring-4 ring-deep-space">
                  {author.avatar ? (
                    <img
                      src={author.avatar}
                      alt={author.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-deep-space" />
                  )}
                </div>

                {/* Premium Badge */}
                {author.role === 'premium' && (
                  <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center border-2 sm:border-4 border-deep-space shadow-glow-gold">
                    <Crown className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-deep-space" />
                  </div>
                )}
              </motion.div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold gradient-gold mb-2">
                  {author.name}
                </h1>

                {/* Stats */}
                <div className="flex flex-wrap justify-center md:justify-start gap-3 sm:gap-4 md:gap-6 mb-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-memorial-gold" />
                    <span className="text-white font-semibold">
                      {author.stats.publishedBooks}
                    </span>
                    <span className="text-gray-400">{t('authorProfile.books')}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-memorial-gold" />
                    <span className="text-white font-semibold">
                      {author.stats.totalReads.toLocaleString()}
                    </span>
                    <span className="text-gray-400">{t('authorProfile.totalReads')}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-memorial-gold" />
                    <span className="text-white font-semibold">{followersCount}</span>
                    <span className="text-gray-400">{t('authorProfile.followers')}</span>
                  </div>

                  {author.stats.rating > 0 && (
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-memorial-gold fill-memorial-gold" />
                      <span className="text-white font-semibold">
                        {author.stats.rating.toFixed(1)}
                      </span>
                      <span className="text-gray-400">{t('authorProfile.rating')}</span>
                    </div>
                  )}
                </div>

                {/* Bio Preview */}
                {author.bio && (
                  <p className="text-gray-300 line-clamp-2 mb-4">{author.bio}</p>
                )}
              </div>

              {/* Follow Button */}
              {user && user._id !== id && (
                <GlowingButton
                  variant={isFollowing ? 'cosmic' : 'gold'}
                  size="lg"
                  onClick={handleFollow}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-5 h-5" />
                      {t('authorProfile.following')}
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      {t('authorProfile.follow')}
                    </>
                  )}
                </GlowingButton>
              )}
            </div>
          </GlassCard>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 sm:gap-4 mb-6 sm:mb-8">
            <button
              type="button"
              onClick={() => setActiveTab('books')}
              className={`relative px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all text-sm sm:text-base ${
                activeTab === 'books'
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {activeTab === 'books' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-memorial-gold/20 to-yellow-500/20 border border-memorial-gold/30 rounded-xl shadow-glow-gold"
                />
              )}
              <span className="relative z-10">{t('authorProfile.publishedBooks')} ({books.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('about')}
              className={`relative px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all text-sm sm:text-base ${
                activeTab === 'about'
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {activeTab === 'about' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-memorial-gold/20 to-yellow-500/20 border border-memorial-gold/30 rounded-xl shadow-glow-gold"
                />
              )}
              <span className="relative z-10">{t('authorProfile.about')}</span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'books' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">{t('authorProfile.noBooks')}</p>
                </div>
              ) : (
                books.map((book) => (
                  <motion.div
                    key={book._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -5 }}
                  >
                    <Link to={`/book/${book._id}`}>
                      <GlassCard
                        hover={true}
                        glow={
                          book.qualityScore && book.qualityScore.overallScore >= 90
                            ? 'gold'
                            : 'cosmic'
                        }
                        className="h-full cursor-pointer"
                      >
                        {/* Cover */}
                        <div className="relative mb-4">
                          <div
                            className="w-full aspect-[2/3] rounded-xl overflow-hidden"
                            style={{
                              background: book.coverDesign?.front?.imageUrl
                                ? `url(${book.coverDesign.front.imageUrl})`
                                : book.coverDesign?.front?.backgroundColor || '#1a1a3e',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }}
                          >
                            {!book.coverDesign?.front?.imageUrl && (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="w-16 h-16 text-white/20" />
                              </div>
                            )}
                          </div>

                          {/* Masterpiece Badge */}
                          {book.qualityScore && book.qualityScore.overallScore >= 90 && (
                            <div className="absolute -top-2 -right-2 px-3 py-1 rounded-full bg-gradient-to-r from-memorial-gold to-yellow-600 text-deep-space text-xs font-bold shadow-glow-gold flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              {book.qualityScore.ratingLabel}
                            </div>
                          )}
                        </div>

                        {/* Book Info */}
                        <h3 className="font-display font-bold text-xl text-white mb-2 line-clamp-2">
                          {book.title}
                        </h3>

                        <p className="text-sm text-gray-400 mb-3">{book.genre}</p>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm mb-3">
                          {book.statistics.averageRating && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-memorial-gold fill-memorial-gold" />
                              <span className="text-gray-300">
                                {book.statistics.averageRating.toFixed(1)}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-300">{book.statistics.views}</span>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="text-memorial-gold font-bold">
                          {book.publishingStatus.isFree
                            ? t('authorProfile.free')
                            : `$${book.publishingStatus.price}`}
                        </div>
                      </GlassCard>
                    </Link>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {activeTab === 'about' && (
            <GlassCard>
              <h2 className="text-3xl font-display font-bold text-memorial-gold mb-6">
                {t('authorProfile.aboutAuthor', { name: author.name })}
              </h2>

              {author.bio ? (
                <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-line">
                  {author.bio}
                </p>
              ) : (
                <div className="text-center py-12">
                  <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">{t('authorProfile.noBio')}</p>
                </div>
              )}

              {/* Additional Stats with Count-Up Animation */}
              <div className="mt-8 pt-8 border-t border-white/10">
                <h3 className="text-xl font-display font-semibold text-white mb-4">
                  {t('authorProfile.authorStatistics')}
                </h3>
                <AnimatedStatsGrid
                  publishedBooks={author.stats.publishedBooks}
                  totalReads={author.stats.totalReads}
                  followers={followersCount}
                  rating={author.stats.rating}
                  t={t}
                />
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
