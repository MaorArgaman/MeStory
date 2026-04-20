import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  DollarSign,
  BookOpen,
  Activity,
  TrendingUp,
  Shield,
  AlertCircle,
  Crown,
  Trash2,
  UserX,
  RefreshCw,
  Search,
  BarChart3,
  Eye,
  Clock,
  AlertTriangle,
  UserMinus,
  Zap,
  PieChart,
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from 'lucide-react';
import { api } from '../../services/api';
import { useCurrency } from '../../contexts/CurrencyContext';
import toast from 'react-hot-toast';
import { GlassCard, GlowingButton } from '../../components/ui';
import OrganizationsManager from '../../components/admin/OrganizationsManager';
import { Building2 } from 'lucide-react';

interface Stats {
  overview: {
    totalUsers: number;
    totalBooks: number;
    publishedBooks: number;
    platformRevenue: number;
    recentSignups: number;
  };
  users: {
    total: number;
    free: number;
    standard: number;
    premium: number;
  };
  books: {
    total: number;
    published: number;
    drafts: number;
  };
  revenue: {
    total: number;
    fromBooks: number;
    fromSubscriptions: number;
  };
  signupTrend: Array<{ _id: string; count: number }>;
  topAuthors: Array<{
    authorId: string;
    authorName: string;
    authorEmail: string;
    totalRevenue: number;
    totalSales: number;
    bookCount: number;
  }>;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  credits: number;
  createdAt: string;
}

interface FlaggedBook {
  _id: string;
  title: string;
  genre: string;
  author: {
    _id: string;
    name: string;
    email: string;
  };
  qualityScore: {
    overallScore: number;
    ratingLabel: string;
  };
  statistics: {
    views: number;
    purchases: number;
  };
}

interface RealTimeActivity {
  activeUsersNow: number;
  booksBeingRead: number;
  booksBeingWritten: number;
  recentPurchases: number;
  recentSignups: number;
  recentReviews: number;
  peakHour: number;
  averageSessionMinutes: number;
}

interface RetentionCohort {
  cohortMonth: string;
  totalUsers: number;
  retainedByWeek?: number[];
  retainedByMonth?: number[];
}

interface ChurnRiskUser {
  userId: string;
  userName: string;
  userEmail: string;
  churnProbability: number;
  riskFactors: string[];
  lastActiveAt: Date;
  daysSinceActive: number;
  abandonmentRate: number;
}

interface LTVSegment {
  segment: string;
  averageLTV: number;
  userCount: number;
  totalRevenue: number;
}

interface RevenueAnalytics {
  period: string;
  totalRevenue: number;
  subscriptionRevenue: number;
  bookSalesRevenue: number;
  averageOrderValue: number;
  transactionCount: number;
  revenueByDay: Array<{ date: string; amount: number }>;
  revenueBySource: { subscriptions: number; bookSales: number; credits: number };
}

interface DetailedRevenueAnalytics {
  overview: {
    totalRevenue: number;
    thisMonthRevenue: number;
    platformShare: number;
    authorPayouts: number;
  };
  revenueByPeriod: Array<{ date: string; amount: number }>;
  revenueByTier: {
    free: number;
    standard: number;
    premium: number;
  };
  bookSalesRevenue: number;
  topEarningBooks: Array<{
    bookId: string;
    title: string;
    authorName: string;
    totalSales: number;
    totalRevenue: number;
    platformShare: number;
  }>;
  recentTransactions: Array<{
    _id: string;
    date: string;
    userName: string;
    type: 'subscription' | 'book_purchase' | 'credit_purchase';
    amount: number;
    status: 'completed' | 'pending' | 'refunded';
  }>;
}

type Tab = 'overview' | 'users' | 'content' | 'analytics' | 'revenue' | 'organizations';

export default function AdminDashboard() {
  const { formatCurrency, formatCurrencyCompact } = useCurrency();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [flaggedBooks, setFlaggedBooks] = useState<FlaggedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Analytics state
  const [realTimeActivity, setRealTimeActivity] = useState<RealTimeActivity | null>(null);
  const [retentionCohorts, setRetentionCohorts] = useState<RetentionCohort[]>([]);
  const [churnRiskUsers, setChurnRiskUsers] = useState<ChurnRiskUser[]>([]);
  const [ltvSegments, setLtvSegments] = useState<LTVSegment[]>([]);
  const [revenueAnalytics, setRevenueAnalytics] = useState<RevenueAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Revenue tab state
  const [detailedRevenue, setDetailedRevenue] = useState<DetailedRevenueAnalytics | null>(null);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [revenueError, setRevenueError] = useState<string | null>(null);
  const [revenuePeriod, setRevenuePeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'content') {
      loadFlaggedBooks();
    } else if (activeTab === 'analytics') {
      loadAnalytics();
    } else if (activeTab === 'revenue') {
      loadRevenueAnalytics();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'revenue') {
      loadRevenueAnalytics();
    }
  }, [revenuePeriod]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to load stats:', error);
      toast.error(error.response?.data?.error || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users', {
        params: {
          role: roleFilter,
          search: searchQuery,
          limit: 50,
        },
      });
      if (response.data.success) {
        setUsers(response.data.data.users);
      }
    } catch (error: any) {
      console.error('Failed to load users:', error);
      toast.error(error.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadFlaggedBooks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/books/flagged');
      if (response.data.success) {
        setFlaggedBooks(response.data.data.books);
      }
    } catch (error: any) {
      console.error('Failed to load flagged books:', error);
      toast.error(error.response?.data?.error || 'Failed to load flagged books');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      // Load all analytics data in parallel
      const [realTimeRes, retentionRes, churnRes, ltvRes, revenueRes] = await Promise.all([
        api.get('/admin/analytics/real-time').catch(() => ({ data: { success: false } })),
        api.get('/admin/analytics/retention-cohorts').catch(() => ({ data: { success: false } })),
        api.get('/admin/analytics/predicted-churn').catch(() => ({ data: { success: false } })),
        api.get('/admin/analytics/ltv-segments').catch(() => ({ data: { success: false } })),
        api.get('/admin/analytics/revenue?period=month').catch(() => ({ data: { success: false } })),
      ]);

      if (realTimeRes.data.success) {
        setRealTimeActivity(realTimeRes.data.data);
      }
      if (retentionRes.data.success) {
        setRetentionCohorts(retentionRes.data.data.cohorts || []);
      }
      if (churnRes.data.success) {
        setChurnRiskUsers(churnRes.data.data.users || []);
      }
      if (ltvRes.data.success) {
        setLtvSegments(ltvRes.data.data.segments || []);
      }
      if (revenueRes.data.success) {
        setRevenueAnalytics(revenueRes.data.data);
      }
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load some analytics data');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const loadRevenueAnalytics = async () => {
    setRevenueLoading(true);
    setRevenueError(null);
    try {
      const response = await api.get(`/admin/analytics/revenue?period=${revenuePeriod}`);
      if (response.data.success) {
        // Transform the API response to match our DetailedRevenueAnalytics interface
        const data = response.data.data;
        setDetailedRevenue({
          overview: {
            totalRevenue: data.totalRevenue || 0,
            thisMonthRevenue: data.subscriptionRevenue + data.bookSalesRevenue || 0,
            platformShare: (data.totalRevenue || 0) * 0.5,
            authorPayouts: (data.totalRevenue || 0) * 0.5,
          },
          revenueByPeriod: data.revenueByDay || [],
          revenueByTier: {
            free: 0,
            standard: data.revenueBySource?.subscriptions * 0.4 || 0,
            premium: data.revenueBySource?.subscriptions * 0.6 || 0,
          },
          bookSalesRevenue: data.revenueBySource?.bookSales || 0,
          topEarningBooks: data.topEarningBooks || [],
          recentTransactions: data.recentTransactions || [],
        });
      }
    } catch (error: any) {
      console.error('Failed to load revenue analytics:', error);
      setRevenueError(error.response?.data?.error || 'Failed to load revenue analytics');
      toast.error('Failed to load revenue analytics');
    } finally {
      setRevenueLoading(false);
    }
  };

  const handlePromoteUser = async (userId: string, newRole: string) => {
    if (!userId) return;
    try {
      const response = await api.put(`/admin/users/${userId}`, { role: newRole });
      if (response.data.success) {
        toast.success(`User promoted to ${newRole}`);
        loadUsers();
      }
    } catch (error: any) {
      console.error('Failed to promote user:', error);
      toast.error(error.response?.data?.error || 'Failed to promote user');
    }
  };

  const handleBanUser = async (userId: string) => {
    if (!confirm('Are you sure you want to ban this user?')) return;

    try {
      const response = await api.put(`/admin/users/${userId}`, { action: 'ban' });
      if (response.data.success) {
        toast.success('User banned successfully');
        loadUsers();
      }
    } catch (error: any) {
      console.error('Failed to ban user:', error);
      toast.error(error.response?.data?.error || 'Failed to ban user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user and all their books?')) return;

    try {
      const response = await api.delete(`/admin/users/${userId}`);
      if (response.data.success) {
        toast.success('User deleted successfully');
        loadUsers();
      }
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      toast.error(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleUnpublishBook = async (bookId: string) => {
    const reason = prompt('Reason for unpublishing (will be sent to author):');
    if (!reason) return;

    try {
      const response = await api.put(`/admin/books/${bookId}/unpublish`, { reason });
      if (response.data.success) {
        toast.success('Book unpublished successfully');
        loadFlaggedBooks();
      }
    } catch (error: any) {
      console.error('Failed to unpublish book:', error);
      toast.error(error.response?.data?.error || 'Failed to unpublish book');
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-memorial-gold mx-auto mb-4 animate-pulse" />
          <p className="text-gray-300 text-lg">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-memorial-gold to-yellow-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-deep-space" />
            </div>
            <div>
              <h1 className="text-4xl font-display font-bold gradient-gold">Admin Dashboard</h1>
              <p className="text-gray-400">Platform control center</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 flex-wrap">
          {[
            { id: 'overview' as Tab, label: 'Overview', icon: Activity },
            { id: 'users' as Tab, label: 'Users', icon: Users },
            { id: 'organizations' as Tab, label: 'Organizations', icon: Building2 },
            { id: 'content' as Tab, label: 'Content Moderation', icon: AlertCircle },
            { id: 'analytics' as Tab, label: 'Analytics', icon: BarChart3 },
            { id: 'revenue' as Tab, label: 'Revenue', icon: Wallet },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeAdminTab"
                    className="absolute inset-0 bg-gradient-to-r from-memorial-gold/20 to-yellow-500/20 border border-memorial-gold/30 rounded-xl shadow-glow-gold"
                  />
                )}
                <Icon className="w-5 h-5 relative z-10" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <GlassCard glow="gold">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Total Users</p>
                    <p className="text-3xl font-bold gradient-gold">
                      {stats.overview.totalUsers.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-400 mt-1">
                      +{stats.overview.recentSignups} this week
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-memorial-gold" />
                </div>
              </GlassCard>

              <GlassCard glow="cosmic">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Platform Revenue</p>
                    <p className="text-3xl font-bold gradient-gold">
                      {formatCurrencyCompact(stats.overview.platformRevenue)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">50% from sales</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-cosmic-purple" />
                </div>
              </GlassCard>

              <GlassCard glow="purple">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Active Books</p>
                    <p className="text-3xl font-bold gradient-gold">
                      {stats.overview.publishedBooks.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {stats.books.drafts} drafts
                    </p>
                  </div>
                  <BookOpen className="w-8 h-8 text-purple-400" />
                </div>
              </GlassCard>

              <GlassCard glow="gold">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Server Status</p>
                    <p className="text-3xl font-bold text-green-400">Online</p>
                    <p className="text-xs text-gray-400 mt-1">All systems operational</p>
                  </div>
                  <Activity className="w-8 h-8 text-green-400" />
                </div>
              </GlassCard>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Signup Trend */}
              <GlassCard>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-display font-bold text-white">
                    Signups (Last 30 Days)
                  </h3>
                  <TrendingUp className="w-5 h-5 text-memorial-gold" />
                </div>
                <div className="h-64 flex items-end justify-between gap-2">
                  {stats.signupTrend.slice(-15).map((day, index) => {
                    const maxCount = Math.max(...stats.signupTrend.map((d) => d.count));
                    const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;

                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${height}%` }}
                          transition={{ delay: index * 0.05 }}
                          className="w-full bg-gradient-to-t from-memorial-gold to-yellow-600 rounded-t-lg min-h-[20px]"
                          title={`${day._id}: ${day.count} signups`}
                        />
                        <span className="text-xs text-gray-400">
                          {new Date(day._id).getDate()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>

              {/* User Distribution */}
              <GlassCard>
                <h3 className="text-xl font-display font-bold text-white mb-6">
                  User Distribution
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300">Free Users</span>
                      <span className="text-white font-semibold">
                        {stats.users.free} ({((stats.users.free / stats.users.total) * 100).toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(stats.users.free / stats.users.total) * 100}%` }}
                        className="h-full bg-gray-400"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300">Standard Users</span>
                      <span className="text-white font-semibold">
                        {stats.users.standard} ({((stats.users.standard / stats.users.total) * 100).toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(stats.users.standard / stats.users.total) * 100}%` }}
                        className="h-full bg-cosmic-purple"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300">Premium Users</span>
                      <span className="text-white font-semibold">
                        {stats.users.premium} ({((stats.users.premium / stats.users.total) * 100).toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(stats.users.premium / stats.users.total) * 100}%` }}
                        className="h-full bg-gradient-to-r from-memorial-gold to-yellow-600"
                      />
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Top Authors */}
            <GlassCard>
              <h3 className="text-xl font-display font-bold text-white mb-6">
                Top Authors by Revenue
              </h3>
              <div className="space-y-3">
                {stats.topAuthors.slice(0, 10).map((author, index) => (
                  <div
                    key={author.authorId}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-memorial-gold">#{index + 1}</div>
                      <div>
                        <div className="font-semibold text-white">{author.authorName}</div>
                        <div className="text-sm text-gray-400">
                          {author.bookCount} books • {author.totalSales} sales
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-400">
                        {formatCurrency(author.totalRevenue)}
                      </div>
                      <div className="text-xs text-gray-400">total revenue</div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="חיפוש לפי שם או אימייל..."
                    className="input pl-10"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="input w-full md:w-48"
                >
                  <option value="all">All Roles</option>
                  <option value="free">Free</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="admin">Admin</option>
                </select>
                <GlowingButton onClick={loadUsers} variant="cosmic">
                  <RefreshCw className="w-5 h-5" />
                  Refresh
                </GlowingButton>
              </div>

              {/* User Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Name</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Email</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Role</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Credits</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Joined</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4 text-white font-medium">{user.name}</td>
                        <td className="py-3 px-4 text-gray-300">{user.email}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              user.role === 'premium'
                                ? 'bg-gradient-to-r from-memorial-gold to-yellow-600 text-deep-space'
                                : user.role === 'standard'
                                ? 'bg-cosmic-purple/20 text-cosmic-purple'
                                : user.role === 'admin'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-gray-600/20 text-gray-400'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-300">{user.credits.toLocaleString()}</td>
                        <td className="py-3 px-4 text-gray-400 text-sm">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            {user.role !== 'premium' && user.role !== 'admin' && (
                              <button
                                type="button"
                                onClick={() => handlePromoteUser(user._id, 'premium')}
                                className="p-2 rounded-lg bg-memorial-gold/20 text-memorial-gold hover:bg-memorial-gold/30 transition"
                                title="Promote to Premium"
                              >
                                <Crown className="w-4 h-4" />
                              </button>
                            )}
                            {user.role !== 'admin' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleBanUser(user._id)}
                                  className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition"
                                  title="Ban User"
                                >
                                  <UserX className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(user._id)}
                                  className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Content Moderation Tab */}
        {activeTab === 'content' && (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-display font-bold text-white">
                    Flagged Books (Quality Score {'<'} 60)
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Review and moderate low-quality published books
                  </p>
                </div>
                <GlowingButton onClick={loadFlaggedBooks} variant="cosmic">
                  <RefreshCw className="w-5 h-5" />
                  Refresh
                </GlowingButton>
              </div>

              {flaggedBooks.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No flagged books at this time</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {flaggedBooks.map((book) => (
                    <div
                      key={book._id}
                      className="flex items-start justify-between p-4 bg-white/5 rounded-lg border border-red-500/20"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-white">{book.title}</h4>
                          <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-xs font-semibold">
                            Score: {book.qualityScore.overallScore}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mb-2">
                          <span className="font-semibold">Author:</span> {book.author.name} ({book.author.email})
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Genre: {book.genre}</span>
                          <span>•</span>
                          <span>{book.statistics.views} views</span>
                          <span>•</span>
                          <span>{book.statistics.purchases} purchases</span>
                        </div>
                      </div>
                      <GlowingButton
                        onClick={() => handleUnpublishBook(book._id)}
                        variant="gold"
                        size="sm"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Unpublish
                      </GlowingButton>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Refresh Button */}
            <div className="flex justify-end">
              <GlowingButton onClick={loadAnalytics} variant="cosmic" disabled={analyticsLoading}>
                <RefreshCw className={`w-5 h-5 ${analyticsLoading ? 'animate-spin' : ''}`} />
                {analyticsLoading ? 'Loading...' : 'Refresh Analytics'}
              </GlowingButton>
            </div>

            {/* Real-Time Activity Cards */}
            {realTimeActivity && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <GlassCard glow="gold">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Active Users Now</p>
                      <p className="text-3xl font-bold text-green-400">
                        {realTimeActivity.activeUsersNow}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Peak hour: {realTimeActivity.peakHour}:00
                      </p>
                    </div>
                    <Zap className="w-8 h-8 text-green-400" />
                  </div>
                </GlassCard>

                <GlassCard glow="cosmic">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Books Being Read</p>
                      <p className="text-3xl font-bold gradient-gold">
                        {realTimeActivity.booksBeingRead}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Avg session: {realTimeActivity.averageSessionMinutes}min
                      </p>
                    </div>
                    <Eye className="w-8 h-8 text-cosmic-purple" />
                  </div>
                </GlassCard>

                <GlassCard glow="purple">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Recent Purchases</p>
                      <p className="text-3xl font-bold text-purple-400">
                        {realTimeActivity.recentPurchases}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Last 24 hours</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-purple-400" />
                  </div>
                </GlassCard>

                <GlassCard glow="gold">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">New Signups</p>
                      <p className="text-3xl font-bold gradient-gold">
                        {realTimeActivity.recentSignups}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Last 24 hours</p>
                    </div>
                    <Users className="w-8 h-8 text-memorial-gold" />
                  </div>
                </GlassCard>
              </div>
            )}

            {/* Revenue Analytics and LTV Segments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue by Source */}
              {revenueAnalytics && (
                <GlassCard>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-display font-bold text-white">
                      Revenue Breakdown
                    </h3>
                    <PieChart className="w-5 h-5 text-memorial-gold" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-memorial-gold" />
                        <span className="text-gray-300">Subscriptions</span>
                      </div>
                      <span className="text-white font-bold">
                        {formatCurrency(revenueAnalytics.revenueBySource?.subscriptions || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-cosmic-purple" />
                        <span className="text-gray-300">Book Sales</span>
                      </div>
                      <span className="text-white font-bold">
                        {formatCurrency(revenueAnalytics.revenueBySource?.bookSales || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-gray-300">Credit Purchases</span>
                      </div>
                      <span className="text-white font-bold">
                        {formatCurrency(revenueAnalytics.revenueBySource?.credits || 0)}
                      </span>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Total Revenue ({revenueAnalytics.period})</span>
                        <span className="text-2xl font-bold gradient-gold">
                          {formatCurrency(revenueAnalytics.totalRevenue || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-gray-400">Avg Order Value</span>
                        <span className="text-white font-semibold">
                          {formatCurrency(revenueAnalytics.averageOrderValue || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              )}

              {/* LTV by Segment */}
              {ltvSegments.length > 0 && (
                <GlassCard>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-display font-bold text-white">
                      Lifetime Value by Segment
                    </h3>
                    <TrendingUp className="w-5 h-5 text-memorial-gold" />
                  </div>
                  <div className="space-y-4">
                    {ltvSegments.map((segment, index) => (
                      <div key={index} className="p-4 bg-white/5 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-semibold capitalize">{segment.segment}</span>
                          <span className="text-memorial-gold font-bold">
                            {formatCurrency(segment.averageLTV || 0)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <span>{segment.userCount} users</span>
                          <span>Total: {formatCurrency(segment.totalRevenue || 0)}</span>
                        </div>
                        <div className="mt-2 w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((segment.averageLTV / 100) * 100, 100)}%` }}
                            className="h-full bg-gradient-to-r from-memorial-gold to-yellow-600"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}
            </div>

            {/* Retention Cohorts Heatmap */}
            {retentionCohorts.length > 0 && (
              <GlassCard>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-display font-bold text-white">
                      Retention Cohorts
                    </h3>
                    <p className="text-gray-400 text-sm">User retention by signup month</p>
                  </div>
                  <Clock className="w-5 h-5 text-memorial-gold" />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left py-2 px-3 text-gray-400 font-semibold">Cohort</th>
                        <th className="text-center py-2 px-3 text-gray-400 font-semibold">Users</th>
                        {[0, 1, 2, 3, 4, 5].map((month) => (
                          <th key={month} className="text-center py-2 px-3 text-gray-400 font-semibold">
                            M{month}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {retentionCohorts.slice(0, 6).map((cohort, index) => (
                        <tr key={index} className="border-t border-white/5">
                          <td className="py-2 px-3 text-white font-medium">{cohort.cohortMonth}</td>
                          <td className="py-2 px-3 text-center text-gray-300">{cohort.totalUsers}</td>
                          {(cohort.retainedByWeek || cohort.retainedByMonth || []).slice(0, 6).map((retained, monthIndex) => {
                            const percentage = cohort.totalUsers > 0
                              ? (retained / cohort.totalUsers) * 100
                              : 0;
                            const bgOpacity = percentage / 100;
                            return (
                              <td key={monthIndex} className="py-2 px-3 text-center">
                                <div
                                  className="px-2 py-1 rounded text-sm font-medium"
                                  style={{
                                    backgroundColor: `rgba(218, 165, 32, ${bgOpacity})`,
                                    color: percentage > 50 ? '#1a1a2e' : '#fff',
                                  }}
                                >
                                  {percentage.toFixed(0)}%
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            )}

            {/* Churn Risk Users */}
            {churnRiskUsers.length > 0 && (
              <GlassCard>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-display font-bold text-white">
                      Churn Risk Users
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Users predicted to churn ({churnRiskUsers.length} at risk)
                    </p>
                  </div>
                  <UserMinus className="w-5 h-5 text-red-400" />
                </div>
                <div className="space-y-3">
                  {churnRiskUsers.slice(0, 10).map((user, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-red-500/20 hover:bg-white/10 transition"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-semibold text-white">{user.userName}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              user.churnProbability >= 0.8
                                ? 'bg-red-500/20 text-red-400'
                                : user.churnProbability >= 0.6
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-orange-500/20 text-orange-400'
                            }`}
                          >
                            {(user.churnProbability * 100).toFixed(0)}% risk
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm">{user.userEmail}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {user.riskFactors.slice(0, 3).map((factor, factorIndex) => (
                            <span
                              key={factorIndex}
                              className="flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded text-xs text-gray-300"
                            >
                              <AlertTriangle className="w-3 h-3 text-yellow-400" />
                              {factor}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-sm">Last active</p>
                        <p className="text-white font-semibold">{user.daysSinceActive} days ago</p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Empty State */}
            {!analyticsLoading && !realTimeActivity && retentionCohorts.length === 0 && (
              <GlassCard>
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Analytics Data</h3>
                  <p className="text-gray-400">
                    Analytics data will appear here once users start interacting with the platform.
                  </p>
                </div>
              </GlassCard>
            )}
          </motion.div>
        )}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <motion.div
            key="revenue"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header with Refresh and Period Toggle */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-display font-bold text-white">Revenue Analytics</h2>
                <p className="text-gray-400">Track platform revenue and payouts</p>
              </div>
              <div className="flex items-center gap-4">
                {/* Period Toggle */}
                <div className="flex bg-white/5 rounded-lg p-1">
                  {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => setRevenuePeriod(period)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        revenuePeriod === period
                          ? 'bg-memorial-gold text-deep-space'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </button>
                  ))}
                </div>
                <GlowingButton onClick={loadRevenueAnalytics} variant="cosmic" disabled={revenueLoading}>
                  <RefreshCw className={`w-5 h-5 ${revenueLoading ? 'animate-spin' : ''}`} />
                  {revenueLoading ? 'Loading...' : 'Refresh'}
                </GlowingButton>
              </div>
            </div>

            {/* Error State */}
            {revenueError && (
              <GlassCard>
                <div className="flex items-center gap-3 text-red-400">
                  <AlertCircle className="w-6 h-6" />
                  <p>{revenueError}</p>
                </div>
              </GlassCard>
            )}

            {/* Loading State */}
            {revenueLoading && !detailedRevenue && (
              <div className="text-center py-12">
                <DollarSign className="w-16 h-16 text-memorial-gold mx-auto mb-4 animate-pulse" />
                <p className="text-gray-300 text-lg">Loading revenue data...</p>
              </div>
            )}

            {/* Revenue Overview Cards */}
            {detailedRevenue && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <GlassCard glow="gold">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Total Revenue</p>
                        <p className="text-3xl font-bold gradient-gold">
                          ${detailedRevenue.overview.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3" />
                          All time earnings
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-memorial-gold" />
                    </div>
                  </GlassCard>

                  <GlassCard glow="cosmic">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-gray-400 text-sm mb-1">This Month</p>
                        <p className="text-3xl font-bold gradient-gold">
                          ${detailedRevenue.overview.thisMonthRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Current period
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-cosmic-purple" />
                    </div>
                  </GlassCard>

                  <GlassCard glow="purple">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Platform Share (50%)</p>
                        <p className="text-3xl font-bold text-green-400">
                          ${detailedRevenue.overview.platformShare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3 text-green-400" />
                          Net platform revenue
                        </p>
                      </div>
                      <Wallet className="w-8 h-8 text-green-400" />
                    </div>
                  </GlassCard>

                  <GlassCard glow="gold">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Author Payouts</p>
                        <p className="text-3xl font-bold text-purple-400">
                          ${detailedRevenue.overview.authorPayouts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <ArrowDownRight className="w-3 h-3 text-purple-400" />
                          50% to authors
                        </p>
                      </div>
                      <CreditCard className="w-8 h-8 text-purple-400" />
                    </div>
                  </GlassCard>
                </div>

                {/* Revenue Chart */}
                <GlassCard>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-display font-bold text-white">
                      Revenue Over Time ({revenuePeriod})
                    </h3>
                    <TrendingUp className="w-5 h-5 text-memorial-gold" />
                  </div>
                  {detailedRevenue.revenueByPeriod.length > 0 ? (
                    <div className="h-64 flex items-end justify-between gap-1">
                      {detailedRevenue.revenueByPeriod.slice(-30).map((day, index) => {
                        const maxAmount = Math.max(...detailedRevenue.revenueByPeriod.map((d) => d.amount));
                        const height = maxAmount > 0 ? (day.amount / maxAmount) * 100 : 0;

                        return (
                          <div key={index} className="flex-1 flex flex-col items-center gap-2 group relative">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${Math.max(height, 5)}%` }}
                              transition={{ delay: index * 0.02 }}
                              className="w-full bg-gradient-to-t from-memorial-gold to-yellow-600 rounded-t-lg min-h-[8px] hover:from-memorial-gold/80 hover:to-yellow-500 cursor-pointer"
                            />
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-2 hidden group-hover:block bg-deep-space border border-white/20 rounded-lg px-3 py-2 text-sm whitespace-nowrap z-10">
                              <p className="text-white font-semibold">{formatCurrency(day.amount)}</p>
                              <p className="text-gray-400 text-xs">{new Date(day.date).toLocaleDateString()}</p>
                            </div>
                            {index % Math.ceil(detailedRevenue.revenueByPeriod.length / 10) === 0 && (
                              <span className="text-xs text-gray-400 absolute -bottom-6">
                                {new Date(day.date).getDate()}/{new Date(day.date).getMonth() + 1}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-400">
                      No revenue data for this period
                    </div>
                  )}
                </GlassCard>

                {/* Revenue Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* By Subscription Tier */}
                  <GlassCard>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-display font-bold text-white">
                        Revenue by Source
                      </h3>
                      <PieChart className="w-5 h-5 text-memorial-gold" />
                    </div>
                    <div className="space-y-4">
                      {/* Pie Chart Visualization */}
                      <div className="flex justify-center mb-6">
                        <div className="relative w-48 h-48">
                          {(() => {
                            const total = detailedRevenue.revenueByTier.standard +
                                          detailedRevenue.revenueByTier.premium +
                                          detailedRevenue.bookSalesRevenue;
                            if (total === 0) {
                              return (
                                <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center">
                                  <span className="text-gray-400 text-sm">No data</span>
                                </div>
                              );
                            }
                            const standardPct = (detailedRevenue.revenueByTier.standard / total) * 100;
                            const premiumPct = (detailedRevenue.revenueByTier.premium / total) * 100;
                            const booksPct = (detailedRevenue.bookSalesRevenue / total) * 100;

                            return (
                              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                                {/* Standard tier */}
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="40"
                                  fill="transparent"
                                  stroke="#8B5CF6"
                                  strokeWidth="20"
                                  strokeDasharray={`${standardPct * 2.51} 251`}
                                  strokeDashoffset="0"
                                />
                                {/* Premium tier */}
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="40"
                                  fill="transparent"
                                  stroke="#DAA520"
                                  strokeWidth="20"
                                  strokeDasharray={`${premiumPct * 2.51} 251`}
                                  strokeDashoffset={`${-standardPct * 2.51}`}
                                />
                                {/* Book sales */}
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="40"
                                  fill="transparent"
                                  stroke="#22C55E"
                                  strokeWidth="20"
                                  strokeDasharray={`${booksPct * 2.51} 251`}
                                  strokeDashoffset={`${-(standardPct + premiumPct) * 2.51}`}
                                />
                              </svg>
                            );
                          })()}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-cosmic-purple" />
                          <span className="text-gray-300">Standard Subscriptions</span>
                        </div>
                        <span className="text-white font-bold">
                          {formatCurrency(detailedRevenue.revenueByTier.standard)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-memorial-gold" />
                          <span className="text-gray-300">Premium Subscriptions</span>
                        </div>
                        <span className="text-white font-bold">
                          {formatCurrency(detailedRevenue.revenueByTier.premium)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span className="text-gray-300">Book Sales</span>
                        </div>
                        <span className="text-white font-bold">
                          {formatCurrency(detailedRevenue.bookSalesRevenue)}
                        </span>
                      </div>
                    </div>
                  </GlassCard>

                  {/* Top Earning Books */}
                  <GlassCard>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-display font-bold text-white">
                        Top Earning Books
                      </h3>
                      <BookOpen className="w-5 h-5 text-memorial-gold" />
                    </div>
                    {detailedRevenue.topEarningBooks.length > 0 ? (
                      <div className="space-y-3">
                        {detailedRevenue.topEarningBooks.slice(0, 5).map((book, index) => (
                          <div
                            key={book.bookId}
                            className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition"
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-lg font-bold text-memorial-gold">#{index + 1}</div>
                              <div>
                                <div className="font-semibold text-white text-sm truncate max-w-[150px]">
                                  {book.title}
                                </div>
                                <div className="text-xs text-gray-400">{book.authorName}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-green-400">
                                {formatCurrency(book.totalRevenue)}
                              </div>
                              <div className="text-xs text-gray-400">
                                {book.totalSales} sales
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No book sales yet</p>
                      </div>
                    )}
                  </GlassCard>
                </div>

                {/* Top Earning Books Table (Full) */}
                {detailedRevenue.topEarningBooks.length > 0 && (
                  <GlassCard>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-display font-bold text-white">
                        All Top Earning Books
                      </h3>
                      <BookOpen className="w-5 h-5 text-memorial-gold" />
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-3 px-4 text-gray-400 font-semibold">#</th>
                            <th className="text-left py-3 px-4 text-gray-400 font-semibold">Book Title</th>
                            <th className="text-left py-3 px-4 text-gray-400 font-semibold">Author</th>
                            <th className="text-right py-3 px-4 text-gray-400 font-semibold">Total Sales</th>
                            <th className="text-right py-3 px-4 text-gray-400 font-semibold">Total Revenue</th>
                            <th className="text-right py-3 px-4 text-gray-400 font-semibold">Platform Share</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailedRevenue.topEarningBooks.map((book, index) => (
                            <tr key={book.bookId} className="border-b border-white/5 hover:bg-white/5">
                              <td className="py-3 px-4 text-memorial-gold font-bold">{index + 1}</td>
                              <td className="py-3 px-4 text-white font-medium">{book.title}</td>
                              <td className="py-3 px-4 text-gray-300">{book.authorName}</td>
                              <td className="py-3 px-4 text-right text-gray-300">{book.totalSales}</td>
                              <td className="py-3 px-4 text-right text-green-400 font-semibold">
                                {formatCurrency(book.totalRevenue)}
                              </td>
                              <td className="py-3 px-4 text-right text-memorial-gold font-semibold">
                                {formatCurrency(book.platformShare)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </GlassCard>
                )}

                {/* Recent Transactions */}
                <GlassCard>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-display font-bold text-white">
                      Recent Transactions
                    </h3>
                    <CreditCard className="w-5 h-5 text-memorial-gold" />
                  </div>
                  {detailedRevenue.recentTransactions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-3 px-4 text-gray-400 font-semibold">Date</th>
                            <th className="text-left py-3 px-4 text-gray-400 font-semibold">User</th>
                            <th className="text-left py-3 px-4 text-gray-400 font-semibold">Type</th>
                            <th className="text-right py-3 px-4 text-gray-400 font-semibold">Amount</th>
                            <th className="text-center py-3 px-4 text-gray-400 font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailedRevenue.recentTransactions.slice(0, 10).map((tx) => (
                            <tr key={tx._id} className="border-b border-white/5 hover:bg-white/5">
                              <td className="py-3 px-4 text-gray-400 text-sm">
                                {new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="py-3 px-4 text-white font-medium">{tx.userName}</td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    tx.type === 'subscription'
                                      ? 'bg-cosmic-purple/20 text-cosmic-purple'
                                      : tx.type === 'book_purchase'
                                      ? 'bg-green-500/20 text-green-400'
                                      : 'bg-memorial-gold/20 text-memorial-gold'
                                  }`}
                                >
                                  {tx.type === 'subscription' ? 'Subscription' :
                                   tx.type === 'book_purchase' ? 'Book Purchase' : 'Credits'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right text-green-400 font-semibold">
                                {formatCurrency(tx.amount)}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    tx.status === 'completed'
                                      ? 'bg-green-500/20 text-green-400'
                                      : tx.status === 'pending'
                                      ? 'bg-yellow-500/20 text-yellow-400'
                                      : 'bg-red-500/20 text-red-400'
                                  }`}
                                >
                                  {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No recent transactions</p>
                    </div>
                  )}
                </GlassCard>
              </>
            )}

            {/* Empty State */}
            {!revenueLoading && !detailedRevenue && !revenueError && (
              <GlassCard>
                <div className="text-center py-12">
                  <Wallet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Revenue Data</h3>
                  <p className="text-gray-400">
                    Revenue data will appear here once transactions start occurring.
                  </p>
                </div>
              </GlassCard>
            )}
          </motion.div>
        )}

        {/* Organizations Tab */}
        {activeTab === 'organizations' && (
          <motion.div
            key="organizations"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <OrganizationsManager />
          </motion.div>
        )}
      </div>
    </div>
  );
}
