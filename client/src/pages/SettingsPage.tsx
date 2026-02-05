import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  User,
  DollarSign,
  CreditCard,
  TrendingUp,
  Download,
  Loader2,
  Check,
  Crown,
  Mail,
  Save,
  Shield,
  Bell,
  Lock,
  Smartphone,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

type Tab = 'profile' | 'earnings' | 'billing' | 'security' | 'notifications';

interface EarningsData {
  earnings: {
    total: number;
    available: number;
    withdrawn: number;
    pending: number;
  };
  sales: {
    totalBooks: number;
    totalSales: number;
    totalRevenue: number;
  };
  dailySales: Array<{ date: string; amount: number }>;
  monthlySales: Array<{ month: string; amount: number }>;
  topBooks: Array<{
    id: string;
    title: string;
    sales: number;
    revenue: string;
    price: number;
  }>;
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [loading, setLoading] = useState(false);

  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [bio, setBio] = useState(user?.profile?.bio || '');
  const [avatar, setAvatar] = useState(user?.profile?.avatar || '');

  // Earnings state
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [loadingEarnings, setLoadingEarnings] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Security state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notifications state
  const [notifications, setNotifications] = useState({
    newReview: true,
    newFollower: true,
    newSale: true,
    systemUpdate: false,
    weeklyDigest: true,
  });

  useEffect(() => {
    if (activeTab === 'earnings') {
      loadEarnings();
    }
  }, [activeTab]);

  const loadEarnings = async () => {
    try {
      setLoadingEarnings(true);
      const response = await api.get('/user/earnings');
      if (response.data.success) {
        setEarningsData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load earnings:', error);
      toast.error('Failed to load earnings data');
    } finally {
      setLoadingEarnings(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const response = await api.put('/user/profile', {
        name,
        bio,
        avatar,
      });

      if (response.data.success) {
        toast.success('Profile updated successfully');
        await refreshUser();
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);

    if (!amount || amount < 10) {
      toast.error('Minimum withdrawal amount is $10');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/user/withdraw', { amount });

      if (response.data.success) {
        toast.success('Withdrawal request submitted successfully');
        setWithdrawAmount('');
        loadEarnings();
      }
    } catch (error: any) {
      console.error('Failed to request withdrawal:', error);
      toast.error(error.response?.data?.error || 'Failed to request withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      const response = await api.put('/user/password', {
        oldPassword,
        newPassword,
      });

      if (response.data.success) {
        toast.success('Password changed successfully');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      console.error('Failed to change password:', error);
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    toast.success('Notification preferences updated');
  };

  const tabs = [
    { id: 'profile' as Tab, label: 'Profile', icon: User },
    { id: 'security' as Tab, label: 'Security', icon: Shield },
    { id: 'earnings' as Tab, label: 'Earnings', icon: DollarSign },
    { id: 'billing' as Tab, label: 'Billing', icon: CreditCard },
    { id: 'notifications' as Tab, label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account and preferences</p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Tabs */}
          <div className="w-64 flex-shrink-0">
            <div className="glass-strong rounded-xl p-4 sticky top-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all mb-2 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border border-indigo-500/50 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass-strong rounded-xl p-8"
                >
                  <h2 className="text-2xl font-bold mb-6">Profile Information</h2>

                  <div className="space-y-6">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input"
                        placeholder="Your name"
                      />
                    </div>

                    {/* Email (readonly) */}
                    <div>
                      <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="input opacity-50 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Email cannot be changed
                      </p>
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Bio
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="input min-h-[100px] resize-none"
                        placeholder="Tell readers about yourself..."
                      />
                    </div>

                    {/* Avatar URL */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Avatar URL
                      </label>
                      <input
                        type="url"
                        value={avatar}
                        onChange={(e) => setAvatar(e.target.value)}
                        className="input"
                        placeholder="https://..."
                      />
                    </div>

                    {/* Save Button */}
                    <button
                      onClick={handleUpdateProfile}
                      disabled={loading}
                      className="btn-primary px-8 py-3 flex items-center gap-2"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      Save Changes
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Earnings Tab */}
              {activeTab === 'earnings' && (
                <motion.div
                  key="earnings"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="glass-strong rounded-xl p-8 mb-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold">Earnings Dashboard</h2>
                      <button
                        onClick={loadEarnings}
                        className="btn-secondary text-sm py-2 px-4"
                      >
                        Refresh
                      </button>
                    </div>

                    {loadingEarnings ? (
                      <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                      </div>
                    ) : earningsData ? (
                      <>
                        {/* Earnings Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                          {/* Total Earnings */}
                          <div className="glass rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-2">
                              <DollarSign className="w-5 h-5 text-green-400" />
                              <span className="text-sm text-gray-400">Total Earnings</span>
                            </div>
                            <div className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                              ${earningsData.earnings.total.toFixed(2)}
                            </div>
                          </div>

                          {/* Available Balance */}
                          <div className="glass rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-2">
                              <Download className="w-5 h-5 text-indigo-400" />
                              <span className="text-sm text-gray-400">Available</span>
                            </div>
                            <div className="text-3xl font-bold text-white">
                              ${earningsData.earnings.available.toFixed(2)}
                            </div>
                          </div>

                          {/* Total Sales */}
                          <div className="glass rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="w-5 h-5 text-purple-400" />
                              <span className="text-sm text-gray-400">Total Sales</span>
                            </div>
                            <div className="text-3xl font-bold text-white">
                              {earningsData.sales.totalSales}
                            </div>
                          </div>
                        </div>

                        {/* Simple Chart (SVG visualization) */}
                        <div className="glass rounded-xl p-6 mb-8">
                          <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
                          <div className="h-48 flex items-end justify-between gap-2">
                            {earningsData.monthlySales.slice(-6).map((month, index) => {
                              const maxAmount = Math.max(...earningsData.monthlySales.map(m => m.amount));
                              const height = maxAmount > 0 ? (month.amount / maxAmount) * 100 : 0;

                              return (
                                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                  <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${height}%` }}
                                    transition={{ delay: index * 0.1 }}
                                    className="w-full bg-gradient-to-t from-indigo-600 to-purple-600 rounded-t-lg min-h-[20px]"
                                    title={`$${month.amount.toFixed(2)}`}
                                  />
                                  <span className="text-xs text-gray-400">
                                    {month.month.split('-')[1]}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Top Books */}
                        <div className="glass rounded-xl p-6 mb-8">
                          <h3 className="text-lg font-semibold mb-4">Top Earning Books</h3>
                          <div className="space-y-3">
                            {earningsData.topBooks.map((book) => (
                              <div
                                key={book.id}
                                className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-white">{book.title}</div>
                                  <div className="text-sm text-gray-400">
                                    {book.sales} sales • ${book.price}
                                  </div>
                                </div>
                                <div className="text-lg font-bold text-green-400">
                                  ${book.revenue}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Withdrawal Section */}
                        <div className="glass rounded-xl p-6">
                          <h3 className="text-lg font-semibold mb-4">Withdraw Funds</h3>
                          <div className="flex gap-4">
                            <div className="flex-1">
                              <input
                                type="number"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                className="input"
                                placeholder="Amount (min $10)"
                                min="10"
                                step="0.01"
                              />
                            </div>
                            <button
                              onClick={handleWithdraw}
                              disabled={loading || !withdrawAmount || parseFloat(withdrawAmount) < 10}
                              className="btn-primary px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                'Withdraw'
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">
                            Funds will be sent to your connected PayPal account within 3-5 business days
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-20">
                        <p className="text-gray-400">No earnings data available</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Billing Tab */}
              {activeTab === 'billing' && (
                <motion.div
                  key="billing"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass-strong rounded-xl p-8"
                >
                  <h2 className="text-2xl font-bold mb-6">Subscription & Billing</h2>

                  {/* Current Plan */}
                  <div className="glass rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {user?.role === 'premium' && (
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                            <Crown className="w-6 h-6 text-gray-900" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-semibold capitalize">{user?.role} Plan</h3>
                          <p className="text-sm text-gray-400">
                            {user?.credits === 999999 ? 'Unlimited' : user?.credits.toLocaleString()} credits
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => window.location.href = '/subscription'}
                        className="btn-secondary px-6 py-2"
                      >
                        Change Plan
                      </button>
                    </div>
                  </div>

                  {/* Subscription Details */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-white/10">
                      <span className="text-gray-400">Status</span>
                      <span className="flex items-center gap-2 text-green-400">
                        <Check className="w-4 h-4" />
                        Active
                      </span>
                    </div>

                    {user?.subscription && (
                      <>
                        <div className="flex items-center justify-between py-3 border-b border-white/10">
                          <span className="text-gray-400">Billing Cycle</span>
                          <span className="text-white">Monthly</span>
                        </div>

                        <div className="flex items-center justify-between py-3 border-b border-white/10">
                          <span className="text-gray-400">Next Billing Date</span>
                          <span className="text-white">
                            {new Date(user.subscription.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {/* Change Password */}
                  <div className="glass-strong rounded-xl p-8 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Lock className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Change Password</h2>
                        <p className="text-gray-400 text-sm">
                          Update your password to keep your account secure
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          className="input"
                          placeholder="Enter your current password"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="input"
                          placeholder="Enter new password (min 6 characters)"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="input"
                          placeholder="Confirm your new password"
                        />
                      </div>

                      <button
                        onClick={handleChangePassword}
                        disabled={loading}
                        className="btn-primary px-8 py-3 flex items-center gap-2"
                      >
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Lock className="w-5 h-5" />
                        )}
                        Update Password
                      </button>
                    </div>
                  </div>

                  {/* Active Sessions */}
                  <div className="glass-strong rounded-xl p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                        <Smartphone className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Active Sessions</h2>
                        <p className="text-gray-400 text-sm">
                          Manage devices that are logged into your account
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Current Session */}
                      <div className="glass rounded-xl p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <Smartphone className="w-5 h-5 text-green-400 mt-1" />
                            <div>
                              <div className="font-semibold text-white flex items-center gap-2">
                                Windows PC - Chrome
                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                                  Current
                                </span>
                              </div>
                              <div className="text-sm text-gray-400 mt-1">
                                Last active: Just now
                              </div>
                              <div className="text-sm text-gray-500">
                                IP: 192.168.1.1 • Location: Tel Aviv, Israel
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Other Sessions (Mock Data) */}
                      <div className="glass rounded-xl p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <Smartphone className="w-5 h-5 text-gray-400 mt-1" />
                            <div>
                              <div className="font-semibold text-white">
                                iPhone 13 - Safari
                              </div>
                              <div className="text-sm text-gray-400 mt-1">
                                Last active: 2 days ago
                              </div>
                              <div className="text-sm text-gray-500">
                                IP: 192.168.1.15 • Location: Tel Aviv, Israel
                              </div>
                            </div>
                          </div>
                          <button className="text-sm text-red-400 hover:text-red-300 transition">
                            Revoke
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                        <p className="text-sm text-yellow-200">
                          If you see any sessions you don't recognize, revoke them immediately and change your password.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass-strong rounded-xl p-8"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                      <Bell className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Notification Preferences</h2>
                      <p className="text-gray-400 text-sm">
                        Choose what updates you want to receive
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Email Notifications */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-indigo-400" />
                        Email Notifications
                      </h3>

                      <div className="space-y-4">
                        {/* New Review */}
                        <div className="flex items-center justify-between p-4 glass rounded-lg">
                          <div>
                            <div className="font-medium text-white">New Review</div>
                            <div className="text-sm text-gray-400">
                              Get notified when someone reviews your book
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleNotification('newReview')}
                            className={`relative w-14 h-8 rounded-full transition-colors ${
                              notifications.newReview
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                                : 'bg-gray-600'
                            }`}
                          >
                            <motion.div
                              animate={{ x: notifications.newReview ? 24 : 2 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                            />
                          </button>
                        </div>

                        {/* New Follower */}
                        <div className="flex items-center justify-between p-4 glass rounded-lg">
                          <div>
                            <div className="font-medium text-white">New Follower</div>
                            <div className="text-sm text-gray-400">
                              Get notified when someone follows you
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleNotification('newFollower')}
                            className={`relative w-14 h-8 rounded-full transition-colors ${
                              notifications.newFollower
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                                : 'bg-gray-600'
                            }`}
                          >
                            <motion.div
                              animate={{ x: notifications.newFollower ? 24 : 2 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                            />
                          </button>
                        </div>

                        {/* New Sale */}
                        <div className="flex items-center justify-between p-4 glass rounded-lg">
                          <div>
                            <div className="font-medium text-white">New Sale</div>
                            <div className="text-sm text-gray-400">
                              Get notified when your book is purchased
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleNotification('newSale')}
                            className={`relative w-14 h-8 rounded-full transition-colors ${
                              notifications.newSale
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                                : 'bg-gray-600'
                            }`}
                          >
                            <motion.div
                              animate={{ x: notifications.newSale ? 24 : 2 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                            />
                          </button>
                        </div>

                        {/* System Update */}
                        <div className="flex items-center justify-between p-4 glass rounded-lg">
                          <div>
                            <div className="font-medium text-white">System Updates</div>
                            <div className="text-sm text-gray-400">
                              Get notified about platform updates and announcements
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleNotification('systemUpdate')}
                            className={`relative w-14 h-8 rounded-full transition-colors ${
                              notifications.systemUpdate
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                                : 'bg-gray-600'
                            }`}
                          >
                            <motion.div
                              animate={{ x: notifications.systemUpdate ? 24 : 2 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                            />
                          </button>
                        </div>

                        {/* Weekly Digest */}
                        <div className="flex items-center justify-between p-4 glass rounded-lg">
                          <div>
                            <div className="font-medium text-white">Weekly Digest</div>
                            <div className="text-sm text-gray-400">
                              Receive a weekly summary of your activity and stats
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleNotification('weeklyDigest')}
                            className={`relative w-14 h-8 rounded-full transition-colors ${
                              notifications.weeklyDigest
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                                : 'bg-gray-600'
                            }`}
                          >
                            <motion.div
                              animate={{ x: notifications.weeklyDigest ? 24 : 2 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
