import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import {
  BookOpen,
  Sparkles,
  User,
  Library,
  PenTool,
  ShoppingBag,
  Eye,
  Heart,
  TrendingUp,
  Clock,
  DollarSign,
  Wallet,
  CreditCard,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { GlassCard, GlowingButton } from '../components/ui';

interface BookItem {
  _id: string;
  title: string;
  genre: string;
  description?: string;
  synopsis?: string;
  author: {
    _id: string;
    name: string;
    profile?: {
      avatar?: string;
    };
  };
  coverDesign?: {
    front?: {
      imageUrl?: string;
      backgroundColor?: string;
      gradientColors?: string[];
    };
  };
  publishingStatus: {
    status: string;
    price: number;
    isFree: boolean;
  };
  qualityScore?: {
    overallScore: number;
    rating: number;
  };
  statistics: {
    views: number;
    purchases: number;
    revenue?: number;
    shares?: number;
    totalReviews?: number;
    averageRating?: number;
  };
  likes?: number;
  chapters?: Array<{
    title: string;
    wordCount: number;
  }>;
  readingProgress?: number;
  lastRead?: string;
  createdAt: string;
}

interface Earnings {
  totalEarned: number;
  pendingPayout: number;
  withdrawn: number;
  payoutThreshold: number;
  canRequestPayout: boolean;
  hasPayPalConnected: boolean;
  paypalEmail?: string;
  recentSales: Array<{
    bookTitle: string;
    amount: number;
    authorShare: number;
    date: string;
  }>;
}

type TabType = 'purchased' | 'my-books' | 'earnings';

export default function LibraryPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const [activeTab, setActiveTab] = useState<TabType>('purchased');
  const [purchasedBooks, setPurchasedBooks] = useState<BookItem[]>([]);
  const [ownBooks, setOwnBooks] = useState<BookItem[]>([]);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredBook, setHoveredBook] = useState<string | null>(null);
  const [paypalEmail, setPaypalEmail] = useState('');
  const [connectingPayPal, setConnectingPayPal] = useState(false);
  const [requestingPayout, setRequestingPayout] = useState(false);

  useEffect(() => {
    loadLibrary();
    loadEarnings();
  }, []);

  const loadLibrary = async () => {
    try {
      setLoading(true);
      const response = await api.get('/book-purchases/library');

      if (response.data.success) {
        setPurchasedBooks(response.data.data.purchasedBooks || []);
        setOwnBooks(response.data.data.ownBooks || []);
      }
    } catch (error) {
      console.error('Failed to load library:', error);
      toast.error(t('messages.loading_failed'));
    } finally {
      setLoading(false);
    }
  };

  const loadEarnings = async () => {
    try {
      const response = await api.get('/book-purchases/earnings');
      if (response.data.success) {
        setEarnings(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load earnings:', error);
    }
  };

  const handleConnectPayPal = async () => {
    if (!paypalEmail) {
      toast.error(t('messages.paypal_enter_email'));
      return;
    }

    try {
      setConnectingPayPal(true);
      const response = await api.post('/book-purchases/connect-paypal', {
        paypalEmail,
      });

      if (response.data.success) {
        toast.success(t('messages.paypal_connected_success'));
        loadEarnings();
        setPaypalEmail('');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('messages.paypal_connect_failed'));
    } finally {
      setConnectingPayPal(false);
    }
  };

  const handleRequestPayout = async () => {
    try {
      setRequestingPayout(true);
      const response = await api.post('/book-purchases/request-payout');

      if (response.data.success) {
        toast.success(`${t('messages.payout_success')} $${response.data.data.amount?.toFixed(2)}`);
        loadEarnings();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('messages.payout_failed'));
    } finally {
      setRequestingPayout(false);
    }
  };

  const getBookCoverStyle = (book: BookItem) => {
    const cover = book.coverDesign?.front;
    if (!cover) {
      return {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      };
    }

    if (cover.imageUrl) {
      return {
        backgroundImage: `url(${cover.imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }

    if (cover.gradientColors && cover.gradientColors.length > 0) {
      return {
        background: `linear-gradient(135deg, ${cover.gradientColors.join(', ')})`,
      };
    }

    if (cover.backgroundColor) {
      return {
        backgroundColor: cover.backgroundColor,
      };
    }

    return {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const tabs = [
    {
      id: 'purchased' as TabType,
      label: t('library.tabs.purchased'),
      icon: ShoppingBag,
      count: purchasedBooks.length,
    },
    {
      id: 'my-books' as TabType,
      label: t('library.tabs.my_books'),
      icon: PenTool,
      count: ownBooks.length,
    },
    {
      id: 'earnings' as TabType,
      label: t('library.tabs.earnings'),
      icon: Wallet,
      count: null,
    },
  ];

  const renderBookCard = (book: BookItem, type: 'purchased' | 'own') => (
    <motion.div
      key={book._id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onMouseEnter={() => setHoveredBook(book._id)}
      onMouseLeave={() => setHoveredBook(null)}
    >
      <GlassCard
        hover={true}
        glow={(book.qualityScore?.overallScore ?? 0) >= 90 ? 'gold' : 'cosmic'}
        className="h-full flex flex-col relative overflow-visible"
      >
        {/* Reading Progress Indicator */}
        {type === 'purchased' && book.readingProgress !== undefined && book.readingProgress > 0 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-700 rounded-t-xl overflow-hidden z-10">
            <motion.div
              className="h-full bg-gradient-to-r from-magic-gold to-cosmic-purple"
              initial={{ width: 0 }}
              animate={{ width: `${book.readingProgress}%` }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
        )}

        {/* Status Badge */}
        {type === 'own' && (
          <div className="absolute -top-2 -right-2 z-20">
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                book.publishingStatus.status === 'published'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
              }`}
            >
              {book.publishingStatus.status === 'published' ? t('library.book.published') : t('library.book.draft')}
            </div>
          </div>
        )}

        {/* Book Cover */}
        <div className="relative mb-4 rounded-lg overflow-hidden group/cover">
          <div
            className="aspect-[2/3] relative"
            style={getBookCoverStyle(book)}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

            {/* Quality Score */}
            {book.qualityScore && (
              <div className="absolute top-3 left-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-lg backdrop-blur-sm ${
                    book.qualityScore.overallScore >= 90
                      ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                      : book.qualityScore.overallScore >= 80
                      ? 'bg-gradient-to-br from-green-400 to-green-600'
                      : 'bg-gradient-to-br from-blue-400 to-blue-600'
                  }`}
                >
                  <span className="text-sm">{book.qualityScore.overallScore}</span>
                </div>
              </div>
            )}

            {/* Title on Cover */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="font-display font-bold text-white text-lg line-clamp-2 drop-shadow-lg text-right">
                {book.title}
              </h3>
            </div>

            {/* Hover Actions */}
            <AnimatePresence>
              {hoveredBook === book._id && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 backdrop-blur-sm"
                >
                  {type === 'purchased' ? (
                    <>
                      <GlowingButton
                        variant="gold"
                        size="md"
                        onClick={() => navigate(`/reader/${book._id}`)}
                      >
                        <BookOpen className="w-5 h-5" />
                        {t('library.book.continue_reading')}
                      </GlowingButton>
                      <GlowingButton
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/book/${book._id}`)}
                      >
                        <Eye className="w-4 h-4" />
                        {t('library.book.details')}
                      </GlowingButton>
                    </>
                  ) : (
                    <>
                      <GlowingButton
                        variant="gold"
                        size="md"
                        onClick={() => navigate(`/book/${book._id}/write`)}
                      >
                        <PenTool className="w-5 h-5" />
                        {t('library.book.continue_writing')}
                      </GlowingButton>
                      {book.publishingStatus.status === 'published' && (
                        <GlowingButton
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`/book/${book._id}`)}
                        >
                          <Eye className="w-4 h-4" />
                          {t('library.book.view_in_store')}
                        </GlowingButton>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Book Info */}
        <div className="flex-1 flex flex-col text-right">
          {/* Author */}
          <div className="flex items-center justify-end gap-2 text-sm text-gray-400 mb-2">
            <span className="truncate">
              {type === 'purchased' ? book.author?.name : t('library.book.you_are_author')}
            </span>
            <User className="w-4 h-4" />
          </div>

          {/* Stats */}
          <div className="flex items-center justify-end gap-4 text-xs text-gray-500 mb-3">
            {type === 'own' && book.publishingStatus.status === 'published' && (
              <>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {book.statistics.views}
                </span>
                <span className="flex items-center gap-1">
                  <ShoppingBag className="w-3 h-3" />
                  {book.statistics.purchases}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {book.likes || 0}
                </span>
              </>
            )}
            {type === 'purchased' && (
              <>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {book.lastRead ? formatDate(book.lastRead) : t('library.book.not_read')}
                </span>
                {book.readingProgress !== undefined && (
                  <span className="flex items-center gap-1 text-magic-gold">
                    <TrendingUp className="w-3 h-3" />
                    {book.readingProgress}%
                  </span>
                )}
              </>
            )}
          </div>

          {/* Price / Revenue */}
          <div className="flex items-center justify-between mb-4">
            {type === 'own' && book.publishingStatus.status === 'published' ? (
              <>
                <span className="text-sm text-gray-400">
                  {t('library.book.revenue')}: ${(book.statistics.revenue || 0).toFixed(2)}
                </span>
                {book.publishingStatus.isFree ? (
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs">
                    {t('user.free')}
                  </span>
                ) : (
                  <span className="text-magic-gold font-bold">
                    ${book.publishingStatus.price.toFixed(2)}
                  </span>
                )}
              </>
            ) : type === 'purchased' ? (
              <div className="w-full">
                <GlowingButton
                  variant="cosmic"
                  size="sm"
                  fullWidth
                  onClick={() => navigate(`/reader/${book._id}`)}
                >
                  <BookOpen className="w-4 h-4" />
                  {t('library.book.read_now')}
                </GlowingButton>
              </div>
            ) : (
              <GlowingButton
                variant="primary"
                size="sm"
                fullWidth
                onClick={() => navigate(`/book/${book._id}/write`)}
              >
                <PenTool className="w-4 h-4" />
                {t('library.book.continue_editing')}
              </GlowingButton>
            )}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );

  const renderEarningsTab = () => (
    <div className="space-y-8">
      {/* Earnings Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="text-center p-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <DollarSign className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            ${earnings?.totalEarned?.toFixed(2) || '0.00'}
          </h3>
          <p className="text-gray-400 text-sm">{t('library.earnings.total')}</p>
        </GlassCard>

        <GlassCard className="text-center p-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-magic-gold to-yellow-600 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            ${earnings?.pendingPayout?.toFixed(2) || '0.00'}
          </h3>
          <p className="text-gray-400 text-sm">{t('library.earnings.pending')}</p>
        </GlassCard>

        <GlassCard className="text-center p-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cosmic-purple to-purple-600 flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            ${earnings?.withdrawn?.toFixed(2) || '0.00'}
          </h3>
          <p className="text-gray-400 text-sm">{t('library.earnings.withdrawn')}</p>
        </GlassCard>
      </div>

      {/* PayPal Connection */}
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold text-white mb-4 text-right flex items-center justify-end gap-2">
          <span>{t('library.earnings.connect_paypal')}</span>
          <CreditCard className="w-5 h-5 text-magic-gold" />
        </h3>

        {earnings?.hasPayPalConnected ? (
          <div className="text-right">
            <p className="text-green-400 mb-2">
              ✓ {t('library.earnings.paypal_connected')}: {earnings.paypalEmail}
            </p>
            <p className="text-gray-400 text-sm">
              {t('library.earnings.min_threshold')}: ${earnings?.payoutThreshold}
            </p>

            {earnings.canRequestPayout ? (
              <div className="mt-4">
                <GlowingButton
                  variant="gold"
                  size="lg"
                  onClick={handleRequestPayout}
                  disabled={requestingPayout}
                >
                  {requestingPayout ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('library.earnings.processing')}
                    </span>
                  ) : (
                    <>
                      <Wallet className="w-5 h-5" />
                      {t('library.earnings.withdraw_to_paypal')} ${earnings.pendingPayout?.toFixed(2)}
                    </>
                  )}
                </GlowingButton>
              </div>
            ) : (
              <p className="text-yellow-400 mt-4 text-sm">
                {t('library.earnings.need_minimum')} ${earnings?.payoutThreshold}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4 text-right">
            <p className="text-gray-400">
              {t('library.earnings.connect_paypal_desc')}
              <br />
              <span className="text-magic-gold">
                {t('library.earnings.you_get_50')}
              </span>
            </p>

            <div className="flex gap-3 flex-row-reverse">
              <input
                type="email"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                placeholder="your-email@paypal.com"
                className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-magic-gold text-left"
                dir="ltr"
              />
              <GlowingButton
                variant="gold"
                onClick={handleConnectPayPal}
                disabled={connectingPayPal}
              >
                {connectingPayPal ? t('library.earnings.connecting') : t('library.earnings.connect')}
              </GlowingButton>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Recent Sales */}
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold text-white mb-4 text-right flex items-center justify-end gap-2">
          <span>{t('library.earnings.recent_sales')}</span>
          <TrendingUp className="w-5 h-5 text-green-400" />
        </h3>

        {earnings?.recentSales && earnings.recentSales.length > 0 ? (
          <div className="space-y-3">
            {earnings.recentSales.map((sale, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <span className="text-green-400 font-bold">
                  +${sale.authorShare.toFixed(2)}
                </span>
                <div className="text-right">
                  <p className="text-white font-medium">{sale.bookTitle}</p>
                  <p className="text-gray-400 text-sm">
                    {new Date(sale.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <ShoppingBag className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">{t('library.earnings.no_sales_yet')}</p>
            <p className="text-gray-500 text-sm">{t('library.earnings.publish_to_earn')}</p>
          </div>
        )}
      </GlassCard>

      {/* Revenue Split Info */}
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold text-white mb-4 text-right">{t('library.earnings.revenue_split')}</h3>
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-2">
              <span className="text-2xl font-bold text-white">50%</span>
            </div>
            <p className="text-white font-medium">{t('library.earnings.to_you')}</p>
          </div>
          <div className="text-4xl text-gray-600">+</div>
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cosmic-purple to-purple-600 flex items-center justify-center mb-2">
              <span className="text-2xl font-bold text-white">50%</span>
            </div>
            <p className="text-white font-medium">{t('library.earnings.to_platform')}</p>
          </div>
        </div>
        <p className="text-center text-gray-400 text-sm mt-4">
          {t('library.earnings.paypal_receipts')}
        </p>
      </GlassCard>
    </div>
  );

  return (
    <div className="min-h-screen relative">
      {/* Header */}
      <div className="relative overflow-hidden py-20 px-8">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background:
              'radial-gradient(circle at 50% 30%, rgba(138, 43, 226, 0.3) 0%, transparent 50%)',
          }}
        />

        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <Library className="w-10 h-10 text-magic-gold" />
            <h1 className="text-5xl font-display font-bold gradient-gold">
              {t('library.title')}
            </h1>
          </motion.div>
          <p className="text-xl text-gray-400">
            {t('library.subtitle')}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 pb-20">
        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center gap-4 mb-12"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300
                ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-magic-gold to-cosmic-purple text-white shadow-glow-gold'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }
              `}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-white/10 text-gray-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-strong rounded-xl p-4 animate-pulse">
                <div className="aspect-[2/3] bg-gray-700 rounded-lg mb-4" />
                <div className="h-4 bg-gray-700 rounded mb-2" />
                <div className="h-3 bg-gray-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : activeTab === 'earnings' ? (
          renderEarningsTab()
        ) : (
          <>
            {/* Empty State */}
            {((activeTab === 'purchased' && purchasedBooks.length === 0) ||
              (activeTab === 'my-books' && ownBooks.length === 0)) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20"
              >
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                  {activeTab === 'purchased' ? (
                    <ShoppingBag className="w-12 h-12 text-gray-600" />
                  ) : (
                    <PenTool className="w-12 h-12 text-gray-600" />
                  )}
                </div>
                <h3 className="text-2xl font-display font-semibold text-gray-400 mb-3">
                  {activeTab === 'purchased'
                    ? t('library.empty.purchased_title')
                    : t('library.empty.my_books_title')}
                </h3>
                <p className="text-gray-500 text-lg mb-6">
                  {activeTab === 'purchased'
                    ? t('library.empty.purchased_subtitle')
                    : t('library.empty.my_books_subtitle')}
                </p>
                <GlowingButton
                  variant="gold"
                  size="lg"
                  onClick={() =>
                    navigate(activeTab === 'purchased' ? '/marketplace' : '/dashboard')
                  }
                >
                  {activeTab === 'purchased' ? (
                    <>
                      <Sparkles className="w-5 h-5" />
                      {t('library.empty.discover_books')}
                    </>
                  ) : (
                    <>
                      <PenTool className="w-5 h-5" />
                      {t('library.empty.start_writing')}
                    </>
                  )}
                </GlowingButton>
              </motion.div>
            )}

            {/* Books Grid */}
            {activeTab === 'purchased' && purchasedBooks.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {purchasedBooks.map((book) => renderBookCard(book, 'purchased'))}
              </div>
            )}

            {activeTab === 'my-books' && ownBooks.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {ownBooks.map((book) => renderBookCard(book, 'own'))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
