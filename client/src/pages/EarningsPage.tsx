import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { api, paymentRequest } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import {
  DollarSign,
  Clock,
  Wallet,
  TrendingUp,
  BookOpen,
  User,
  Calendar,
  Star,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Link as LinkIcon,
  ArrowUpRight,
  ShoppingCart,
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import toast from 'react-hot-toast';
import { format, subDays, parseISO } from 'date-fns';

// Types
interface EarningsSummary {
  totalEarned: number;
  pendingPayout: number;
  totalWithdrawn: number;
  thisMonthSales: number;
  thisMonthEarnings: number;
}

interface Sale {
  id: string;
  bookId: string;
  bookTitle: string;
  buyerName: string;
  isAnonymous: boolean;
  amount: number;
  authorShare: number;
  purchasedAt: string;
}

interface DailySale {
  date: string;
  amount: number;
  count: number;
}

interface BookPerformance {
  bookId: string;
  title: string;
  coverImage?: string;
  totalSales: number;
  totalRevenue: number;
  authorEarnings: number;
  averageRating: number;
  reviewCount: number;
}

interface PayoutHistory {
  id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  requestedAt: string;
  completedAt?: string;
  paypalEmail: string;
}

interface EarningsData {
  summary: EarningsSummary;
  recentSales: Sale[];
  dailySales: DailySale[];
  bookPerformance: BookPerformance[];
  payoutHistory: PayoutHistory[];
  paypalEmail?: string;
}

export default function EarningsPage() {
  const { t } = useTranslation('common');
  useAuth(); // Verify user is authenticated
  const { formatCurrency, getCurrencySymbol } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EarningsData | null>(null);

  // PayPal connection state
  const [showPayPalModal, setShowPayPalModal] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState('');
  const [connectingPayPal, setConnectingPayPal] = useState(false);

  // Payout request state
  const [requestingPayout, setRequestingPayout] = useState(false);

  const fetchEarnings = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await api.get('/book-purchases/earnings');
      if (response.data.success) {
        setData(response.data.data);
      } else {
        throw new Error(response.data.error || 'Failed to load earnings');
      }
    } catch (err: any) {
      console.error('Failed to load earnings:', err);
      setError(err.response?.data?.error || err.message || t('earnings.error_loading'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  // Format chart data for last 30 days
  const chartData = useMemo(() => {
    if (!data?.dailySales) return [];

    // Create a map of existing sales data
    const salesMap = new Map(
      data.dailySales.map(d => [d.date, d])
    );

    // Generate last 30 days
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const sale = salesMap.get(date);
      last30Days.push({
        date,
        displayDate: format(subDays(new Date(), i), 'MMM dd'),
        amount: sale?.amount || 0,
        count: sale?.count || 0,
      });
    }

    return last30Days;
  }, [data?.dailySales]);

  const handleConnectPayPal = async () => {
    if (!paypalEmail || !paypalEmail.includes('@')) {
      toast.error(t('earnings.invalid_email'));
      return;
    }

    setConnectingPayPal(true);
    try {
      const response = await api.post('/book-purchases/connect-paypal', {
        email: paypalEmail,
      });

      if (response.data.success) {
        toast.success(t('earnings.paypal_connected'));
        setShowPayPalModal(false);
        setPaypalEmail('');
        fetchEarnings(true);
      } else {
        throw new Error(response.data.error);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('earnings.connect_failed'));
    } finally {
      setConnectingPayPal(false);
    }
  };

  const handleRequestPayout = async () => {
    if (!data?.paypalEmail) {
      toast.error(t('earnings.connect_paypal_first'));
      return;
    }

    if ((data?.summary.pendingPayout || 0) < 10) {
      toast.error(t('earnings.min_payout_required'));
      return;
    }

    setRequestingPayout(true);
    try {
      const response = await paymentRequest('/book-purchases/request-payout', {});

      if (response.success) {
        toast.success(t('earnings.payout_requested'));
        fetchEarnings(true);
      } else {
        throw new Error(response.error);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('earnings.payout_failed'));
    } finally {
      setRequestingPayout(false);
    }
  };

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800/95 border border-white/20 rounded-lg p-3 shadow-xl backdrop-blur-sm">
          <p className="text-white font-medium text-sm">{label}</p>
          <p className="text-memorial-gold text-sm mt-1">
            {formatCurrency(payload[0].value)}
          </p>
          <p className="text-gray-400 text-xs">
            {payload[0].payload.count} {t('earnings.sales')}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-memorial-gold" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-gray-300 text-center mb-4">{error}</p>
        <button
          onClick={() => fetchEarnings()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  const summary = data?.summary || {
    totalEarned: 0,
    pendingPayout: 0,
    totalWithdrawn: 0,
    thisMonthSales: 0,
    thisMonthEarnings: 0,
  };

  const canRequestPayout = data?.paypalEmail && summary.pendingPayout >= 10;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-2">
                {t('earnings.title')}
              </h1>
              <p className="text-gray-400">{t('earnings.subtitle')}</p>
            </div>
            <button
              onClick={() => fetchEarnings(true)}
              disabled={refreshing}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Earned */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-strong rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-gray-400 text-sm mb-1">{t('earnings.total_earned')}</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(summary.totalEarned)}</p>
          </motion.div>

          {/* Pending Payout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-strong rounded-xl p-6 border border-memorial-gold/30"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-memorial-gold" />
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-1">{t('earnings.pending_payout')}</p>
            <p className="text-2xl font-bold text-memorial-gold">{formatCurrency(summary.pendingPayout)}</p>
          </motion.div>

          {/* Total Withdrawn */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-strong rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-1">{t('earnings.total_withdrawn')}</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(summary.totalWithdrawn)}</p>
          </motion.div>

          {/* This Month */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-strong rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-1">{t('earnings.this_month_sales')}</p>
            <p className="text-2xl font-bold text-white">{summary.thisMonthSales}</p>
            <p className="text-sm text-gray-500">{formatCurrency(summary.thisMonthEarnings || 0)}</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Chart & Sales Table */}
          <div className="lg:col-span-2 space-y-8">
            {/* Sales Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-strong rounded-xl p-6 border border-white/10"
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-memorial-gold" />
                {t('earnings.sales_chart_title')}
              </h2>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FFD700" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="displayDate"
                      tick={{ fill: '#9ca3af', fontSize: 10 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill: '#9ca3af', fontSize: 10 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      tickLine={false}
                      tickFormatter={(value) => `${getCurrencySymbol()}${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#FFD700"
                      strokeWidth={2}
                      fill="url(#earningsGradient)"
                      dot={false}
                      activeDot={{
                        r: 6,
                        fill: '#FFD700',
                        stroke: '#fff',
                        strokeWidth: 2,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Recent Sales Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="glass-strong rounded-xl p-6 border border-white/10"
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-memorial-gold" />
                {t('earnings.recent_sales')}
              </h2>

              {data?.recentSales && data.recentSales.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-gray-400 text-sm border-b border-white/10">
                        <th className="pb-3 font-medium">{t('earnings.book')}</th>
                        <th className="pb-3 font-medium">{t('earnings.buyer')}</th>
                        <th className="pb-3 font-medium text-right">{t('earnings.amount')}</th>
                        <th className="pb-3 font-medium text-right">{t('earnings.your_share')}</th>
                        <th className="pb-3 font-medium text-right">{t('earnings.date')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentSales.map((sale) => (
                        <tr key={sale.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3">
                            <span className="text-white">{sale.bookTitle}</span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-300">
                                {sale.isAnonymous ? t('earnings.anonymous') : sale.buyerName}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 text-right text-gray-300">
                            {formatCurrency(sale.amount)}
                          </td>
                          <td className="py-3 text-right text-memorial-gold font-medium">
                            {formatCurrency(sale.authorShare)}
                          </td>
                          <td className="py-3 text-right text-gray-400 text-sm">
                            {format(parseISO(sale.purchasedAt), 'MMM dd, yyyy')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">{t('earnings.no_sales_yet')}</p>
                  <p className="text-gray-500 text-sm mt-1">{t('earnings.publish_to_start')}</p>
                </div>
              )}
            </motion.div>

            {/* Book Performance Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="glass-strong rounded-xl p-6 border border-white/10"
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-memorial-gold" />
                {t('earnings.book_performance')}
              </h2>

              {data?.bookPerformance && data.bookPerformance.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-gray-400 text-sm border-b border-white/10">
                        <th className="pb-3 font-medium">{t('earnings.book')}</th>
                        <th className="pb-3 font-medium text-center">{t('earnings.total_sales')}</th>
                        <th className="pb-3 font-medium text-right">{t('earnings.total_revenue')}</th>
                        <th className="pb-3 font-medium text-right">{t('earnings.your_earnings')}</th>
                        <th className="pb-3 font-medium text-center">{t('earnings.avg_rating')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.bookPerformance.map((book) => (
                        <tr key={book.bookId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              {book.coverImage && (
                                <img
                                  src={book.coverImage}
                                  alt={book.title}
                                  className="w-10 h-14 object-cover rounded"
                                />
                              )}
                              <span className="text-white">{book.title}</span>
                            </div>
                          </td>
                          <td className="py-3 text-center text-gray-300">
                            {book.totalSales}
                          </td>
                          <td className="py-3 text-right text-gray-300">
                            {formatCurrency(book.totalRevenue)}
                          </td>
                          <td className="py-3 text-right text-memorial-gold font-medium">
                            {formatCurrency(book.authorEarnings)}
                          </td>
                          <td className="py-3 text-center">
                            {book.averageRating > 0 ? (
                              <div className="flex items-center justify-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="text-white">{book.averageRating.toFixed(1)}</span>
                                <span className="text-gray-500 text-sm">({book.reviewCount})</span>
                              </div>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">{t('earnings.no_books_published')}</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column - Payout Section */}
          <div className="space-y-8">
            {/* PayPal Connection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-strong rounded-xl p-6 border border-white/10"
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-memorial-gold" />
                {t('earnings.payout_section')}
              </h2>

              {/* PayPal Status */}
              <div className="mb-6">
                {data?.paypalEmail ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-green-400 text-sm font-medium">{t('earnings.paypal_connected')}</p>
                      <p className="text-gray-400 text-xs">{data.paypalEmail}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                      <AlertCircle className="w-5 h-5 text-yellow-400" />
                      <p className="text-yellow-400 text-sm">{t('earnings.paypal_not_connected')}</p>
                    </div>
                    <button
                      onClick={() => setShowPayPalModal(true)}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                    >
                      <LinkIcon className="w-5 h-5" />
                      {t('earnings.connect_paypal')}
                    </button>
                  </div>
                )}
              </div>

              {/* Minimum Threshold */}
              <div className="mb-6 p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-gray-400 text-sm">
                  {t('earnings.min_threshold')}: <span className="text-white font-medium">{formatCurrency(10)}</span>
                </p>
                <p className="text-gray-500 text-xs mt-1">{t('earnings.you_get_50')}</p>
              </div>

              {/* Request Payout Button */}
              <button
                onClick={handleRequestPayout}
                disabled={!canRequestPayout || requestingPayout}
                className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                  canRequestPayout
                    ? 'bg-gradient-to-r from-memorial-gold to-yellow-600 text-gray-900 hover:from-yellow-500 hover:to-yellow-700 shadow-lg shadow-yellow-500/20'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {requestingPayout ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <ArrowUpRight className="w-5 h-5" />
                    {t('earnings.request_payout')}
                  </>
                )}
              </button>

              {!data?.paypalEmail && (
                <p className="text-gray-500 text-xs text-center mt-2">
                  {t('earnings.connect_to_withdraw')}
                </p>
              )}
              {data?.paypalEmail && summary.pendingPayout < 10 && (
                <p className="text-gray-500 text-xs text-center mt-2">
                  {t('earnings.need_minimum', { amount: formatCurrency(10 - summary.pendingPayout) })}
                </p>
              )}
            </motion.div>

            {/* Payout History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="glass-strong rounded-xl p-6 border border-white/10"
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-memorial-gold" />
                {t('earnings.payout_history')}
              </h2>

              {data?.payoutHistory && data.payoutHistory.length > 0 ? (
                <div className="space-y-3">
                  {data.payoutHistory.map((payout) => (
                    <div
                      key={payout.id}
                      className="p-3 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{formatCurrency(payout.amount)}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            payout.status === 'completed'
                              ? 'bg-green-500/20 text-green-400'
                              : payout.status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {t(`earnings.status_${payout.status}`)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{payout.paypalEmail}</span>
                        <span>{format(parseISO(payout.requestedAt), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Wallet className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">{t('earnings.no_payouts_yet')}</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* PayPal Connection Modal */}
      {showPayPalModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-strong rounded-xl p-6 w-full max-w-md border border-white/20"
          >
            <h3 className="text-xl font-semibold text-white mb-4">
              {t('earnings.connect_paypal_title')}
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              {t('earnings.connect_paypal_desc')}
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('earnings.paypal_email')}
              </label>
              <input
                type="email"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-memorial-gold/50 transition-colors"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPayPalModal(false);
                  setPaypalEmail('');
                }}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleConnectPayPal}
                disabled={connectingPayPal || !paypalEmail}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {connectingPayPal ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  t('earnings.connect')
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
