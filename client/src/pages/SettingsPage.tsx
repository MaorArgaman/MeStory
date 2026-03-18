import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage, Language } from '../contexts/LanguageContext';
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
  Globe,
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
  const { language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [loading, setLoading] = useState(false);
  const [languageLoading, setLanguageLoading] = useState(false);

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
      toast.error(language === 'he' ? 'טעינת נתוני רווחים נכשלה' : 'Failed to load earnings data');
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
        toast.success(language === 'he' ? 'הפרופיל עודכן בהצלחה' : 'Profile updated successfully');
        await refreshUser();
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error(error.response?.data?.error || (language === 'he' ? 'עדכון הפרופיל נכשל' : 'Failed to update profile'));
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);

    if (!amount || amount < 10) {
      toast.error(language === 'he' ? 'סכום מינימלי למשיכה הוא $10' : 'Minimum withdrawal amount is $10');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/user/withdraw', { amount });

      if (response.data.success) {
        toast.success(language === 'he' ? 'בקשת המשיכה הוגשה בהצלחה' : 'Withdrawal request submitted successfully');
        setWithdrawAmount('');
        loadEarnings();
      }
    } catch (error: any) {
      console.error('Failed to request withdrawal:', error);
      toast.error(error.response?.data?.error || (language === 'he' ? 'בקשת המשיכה נכשלה' : 'Failed to request withdrawal'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error(language === 'he' ? 'נא למלא את כל שדות הסיסמה' : 'Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(language === 'he' ? 'הסיסמאות החדשות אינן תואמות' : 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error(language === 'he' ? 'הסיסמה חייבת להכיל לפחות 6 תווים' : 'Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      const response = await api.put('/user/password', {
        oldPassword,
        newPassword,
      });

      if (response.data.success) {
        toast.success(language === 'he' ? 'הסיסמה שונתה בהצלחה' : 'Password changed successfully');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      console.error('Failed to change password:', error);
      toast.error(error.response?.data?.error || (language === 'he' ? 'שינוי הסיסמה נכשל' : 'Failed to change password'));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    toast.success(language === 'he' ? 'העדפות ההתראות עודכנו' : 'Notification preferences updated');
  };

  const handleLanguageChange = async (newLanguage: Language) => {
    try {
      setLanguageLoading(true);
      await setLanguage(newLanguage);
      toast.success(newLanguage === 'he' ? 'השפה שונתה לעברית' : 'Language changed to English');
    } catch (error) {
      console.error('Failed to change language:', error);
      toast.error(language === 'he' ? 'שינוי השפה נכשל' : 'Failed to change language');
    } finally {
      setLanguageLoading(false);
    }
  };

  const tabs = [
    { id: 'profile' as Tab, label: language === 'he' ? 'פרופיל' : 'Profile', icon: User },
    { id: 'security' as Tab, label: language === 'he' ? 'אבטחה' : 'Security', icon: Shield },
    { id: 'earnings' as Tab, label: language === 'he' ? 'רווחים' : 'Earnings', icon: DollarSign },
    { id: 'billing' as Tab, label: language === 'he' ? 'חיובים' : 'Billing', icon: CreditCard },
    { id: 'notifications' as Tab, label: language === 'he' ? 'התראות' : 'Notifications', icon: Bell },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text mb-1 sm:mb-2">
            {language === 'he' ? 'הגדרות' : 'Settings'}
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            {language === 'he' ? 'ניהול החשבון וההעדפות שלך' : 'Manage your account and preferences'}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Sidebar Tabs - Horizontal scroll on mobile */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="glass-strong rounded-xl p-2 sm:p-4 lg:sticky lg:top-8 overflow-x-auto">
              <div className="flex lg:flex-col gap-1 sm:gap-2 min-w-max lg:min-w-0">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-all whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border border-indigo-500/50 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="font-medium text-sm sm:text-base">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass-strong rounded-xl p-4 sm:p-6 lg:p-8"
                >
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
                    {language === 'he' ? 'פרטי פרופיל' : 'Profile Information'}
                  </h2>

                  <div className="space-y-4 sm:space-y-6">
                    {/* Language Selection - First for visibility */}
                    <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border border-indigo-500/30">
                      <label className="block text-sm font-medium mb-2 sm:mb-3 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-indigo-400" />
                        {language === 'he' ? 'שפת המערכת' : 'System Language'}
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                        <button
                          onClick={() => handleLanguageChange('en')}
                          disabled={languageLoading}
                          className={`flex-1 flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-xl border transition-all ${
                            language === 'en'
                              ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border-indigo-500/50 text-white'
                              : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {languageLoading && language !== 'en' ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <span className="text-xl sm:text-2xl">🇺🇸</span>
                              <span className="font-medium text-sm sm:text-base">English</span>
                              {language === 'en' && <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />}
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleLanguageChange('he')}
                          disabled={languageLoading}
                          className={`flex-1 flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-xl border transition-all ${
                            language === 'he'
                              ? 'bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border-indigo-500/50 text-white'
                              : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {languageLoading && language !== 'he' ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <span className="text-xl sm:text-2xl">🇮🇱</span>
                              <span className="font-medium text-sm sm:text-base">עברית</span>
                              {language === 'he' && <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />}
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {language === 'he'
                          ? 'שינוי השפה ישפיע על כל האפליקציה כולל תגובות ה-AI'
                          : 'This will change the language of the entire application including AI responses'}
                      </p>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {language === 'he' ? 'שם מלא' : 'Full Name'}
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input"
                        placeholder={language === 'he' ? 'השם שלך' : 'Your name'}
                      />
                    </div>

                    {/* Email (readonly) */}
                    <div>
                      <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {language === 'he' ? 'כתובת אימייל' : 'Email Address'}
                      </label>
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="input opacity-50 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {language === 'he' ? 'לא ניתן לשנות את האימייל' : 'Email cannot be changed'}
                      </p>
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {language === 'he' ? 'אודות' : 'Bio'}
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="input min-h-[100px] resize-none"
                        placeholder={language === 'he' ? 'ספר לקוראים על עצמך...' : 'Tell readers about yourself...'}
                      />
                    </div>

                    {/* Avatar URL */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {language === 'he' ? 'כתובת תמונת פרופיל' : 'Avatar URL'}
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
                      {language === 'he' ? 'שמור שינויים' : 'Save Changes'}
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
                  <div className="glass-strong rounded-xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                      <h2 className="text-xl sm:text-2xl font-bold">
                        {language === 'he' ? 'לוח בקרת רווחים' : 'Earnings Dashboard'}
                      </h2>
                      <button
                        onClick={loadEarnings}
                        className="btn-secondary text-sm py-2 px-4"
                      >
                        {language === 'he' ? 'רענן' : 'Refresh'}
                      </button>
                    </div>

                    {loadingEarnings ? (
                      <div className="flex items-center justify-center py-12 sm:py-20">
                        <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-indigo-500" />
                      </div>
                    ) : earningsData ? (
                      <>
                        {/* Earnings Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
                          {/* Total Earnings */}
                          <div className="glass rounded-xl p-4 sm:p-6">
                            <div className="flex items-center gap-2 mb-1 sm:mb-2">
                              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                              <span className="text-xs sm:text-sm text-gray-400">
                                {language === 'he' ? 'סה״כ רווחים' : 'Total Earnings'}
                              </span>
                            </div>
                            <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                              ${earningsData.earnings.total.toFixed(2)}
                            </div>
                          </div>

                          {/* Available Balance */}
                          <div className="glass rounded-xl p-4 sm:p-6">
                            <div className="flex items-center gap-2 mb-1 sm:mb-2">
                              <Download className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                              <span className="text-xs sm:text-sm text-gray-400">
                                {language === 'he' ? 'זמין למשיכה' : 'Available'}
                              </span>
                            </div>
                            <div className="text-2xl sm:text-3xl font-bold text-white">
                              ${earningsData.earnings.available.toFixed(2)}
                            </div>
                          </div>

                          {/* Total Sales */}
                          <div className="glass rounded-xl p-4 sm:p-6 sm:col-span-2 md:col-span-1">
                            <div className="flex items-center gap-2 mb-1 sm:mb-2">
                              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                              <span className="text-xs sm:text-sm text-gray-400">
                                {language === 'he' ? 'סה״כ מכירות' : 'Total Sales'}
                              </span>
                            </div>
                            <div className="text-2xl sm:text-3xl font-bold text-white">
                              {earningsData.sales.totalSales}
                            </div>
                          </div>
                        </div>

                        {/* Simple Chart (SVG visualization) */}
                        <div className="glass rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
                          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                            {language === 'he' ? 'מגמת הכנסות' : 'Revenue Trend'}
                          </h3>
                          <div className="h-36 sm:h-48 flex items-end justify-between gap-1 sm:gap-2">
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
                        <div className="glass rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
                          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                            {language === 'he' ? 'הספרים המרוויחים ביותר' : 'Top Earning Books'}
                          </h3>
                          <div className="space-y-2 sm:space-y-3">
                            {earningsData.topBooks.map((book) => (
                              <div
                                key={book.id}
                                className="flex items-center justify-between p-2 sm:p-3 bg-white/5 rounded-lg"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-white text-sm sm:text-base truncate">{book.title}</div>
                                  <div className="text-xs sm:text-sm text-gray-400">
                                    {book.sales} {language === 'he' ? 'מכירות' : 'sales'} • ${book.price}
                                  </div>
                                </div>
                                <div className="text-base sm:text-lg font-bold text-green-400 ml-2">
                                  ${book.revenue}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Withdrawal Section */}
                        <div className="glass rounded-xl p-4 sm:p-6">
                          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                            {language === 'he' ? 'משיכת כספים' : 'Withdraw Funds'}
                          </h3>
                          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <div className="flex-1">
                              <input
                                type="number"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                className="input"
                                placeholder={language === 'he' ? 'סכום (מינימום $10)' : 'Amount (min $10)'}
                                min="10"
                                step="0.01"
                              />
                            </div>
                            <button
                              onClick={handleWithdraw}
                              disabled={loading || !withdrawAmount || parseFloat(withdrawAmount) < 10}
                              className="btn-primary px-6 sm:px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                language === 'he' ? 'משוך כספים' : 'Withdraw'
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">
                            {language === 'he'
                              ? 'הכספים יועברו לחשבון ה-PayPal המקושר שלך תוך 3-5 ימי עסקים'
                              : 'Funds will be sent to your connected PayPal account within 3-5 business days'}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-20">
                        <p className="text-gray-400">
                          {language === 'he' ? 'אין נתוני רווחים זמינים' : 'No earnings data available'}
                        </p>
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
                  className="glass-strong rounded-xl p-4 sm:p-6 lg:p-8"
                >
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
                    {language === 'he' ? 'מנוי וחיובים' : 'Subscription & Billing'}
                  </h2>

                  {/* Current Plan */}
                  <div className="glass rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-3 sm:mb-4">
                      <div className="flex items-center gap-3">
                        {user?.role === 'premium' && (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                            <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold capitalize">
                            {language === 'he' ? `תוכנית ${user?.role}` : `${user?.role} Plan`}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-400">
                            {user?.credits === 999999
                              ? (language === 'he' ? 'ללא הגבלה' : 'Unlimited')
                              : user?.credits.toLocaleString()}{' '}
                            {language === 'he' ? 'קרדיטים' : 'credits'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => window.location.href = '/subscription'}
                        className="btn-secondary px-4 sm:px-6 py-2 text-sm w-full sm:w-auto"
                      >
                        {language === 'he' ? 'שנה תוכנית' : 'Change Plan'}
                      </button>
                    </div>
                  </div>

                  {/* Subscription Details */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-white/10">
                      <span className="text-gray-400">{language === 'he' ? 'סטטוס' : 'Status'}</span>
                      <span className="flex items-center gap-2 text-green-400">
                        <Check className="w-4 h-4" />
                        {language === 'he' ? 'פעיל' : 'Active'}
                      </span>
                    </div>

                    {user?.subscription && (
                      <>
                        <div className="flex items-center justify-between py-3 border-b border-white/10">
                          <span className="text-gray-400">{language === 'he' ? 'מחזור חיוב' : 'Billing Cycle'}</span>
                          <span className="text-white">{language === 'he' ? 'חודשי' : 'Monthly'}</span>
                        </div>

                        <div className="flex items-center justify-between py-3 border-b border-white/10">
                          <span className="text-gray-400">{language === 'he' ? 'תאריך חיוב הבא' : 'Next Billing Date'}</span>
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
                  <div className="glass-strong rounded-xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
                    <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold">
                          {language === 'he' ? 'שינוי סיסמה' : 'Change Password'}
                        </h2>
                        <p className="text-gray-400 text-xs sm:text-sm">
                          {language === 'he' ? 'עדכן את הסיסמה שלך לשמירה על אבטחת החשבון' : 'Update your password to keep your account secure'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {language === 'he' ? 'סיסמה נוכחית' : 'Current Password'}
                        </label>
                        <input
                          type="password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          className="input"
                          placeholder={language === 'he' ? 'הזן את הסיסמה הנוכחית' : 'Enter your current password'}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {language === 'he' ? 'סיסמה חדשה' : 'New Password'}
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="input"
                          placeholder={language === 'he' ? 'הזן סיסמה חדשה (מינימום 6 תווים)' : 'Enter new password (min 6 characters)'}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {language === 'he' ? 'אישור סיסמה חדשה' : 'Confirm New Password'}
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="input"
                          placeholder={language === 'he' ? 'אשר את הסיסמה החדשה' : 'Confirm your new password'}
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
                        {language === 'he' ? 'עדכן סיסמה' : 'Update Password'}
                      </button>
                    </div>
                  </div>

                  {/* Active Sessions */}
                  <div className="glass-strong rounded-xl p-4 sm:p-6 lg:p-8">
                    <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold">
                          {language === 'he' ? 'הפעלות פעילות' : 'Active Sessions'}
                        </h2>
                        <p className="text-gray-400 text-xs sm:text-sm">
                          {language === 'he' ? 'נהל מכשירים שמחוברים לחשבון שלך' : 'Manage devices that are logged into your account'}
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
                                  {language === 'he' ? 'נוכחי' : 'Current'}
                                </span>
                              </div>
                              <div className="text-sm text-gray-400 mt-1">
                                {language === 'he' ? 'פעילות אחרונה: עכשיו' : 'Last active: Just now'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {language === 'he' ? 'תל אביב, ישראל • IP: 192.168.1.1' : 'IP: 192.168.1.1 • Location: Tel Aviv, Israel'}
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
                                {language === 'he' ? 'פעילות אחרונה: לפני יומיים' : 'Last active: 2 days ago'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {language === 'he' ? 'תל אביב, ישראל • IP: 192.168.1.15' : 'IP: 192.168.1.15 • Location: Tel Aviv, Israel'}
                              </div>
                            </div>
                          </div>
                          <button className="text-sm text-red-400 hover:text-red-300 transition">
                            {language === 'he' ? 'בטל' : 'Revoke'}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                        <p className="text-sm text-yellow-200">
                          {language === 'he'
                            ? 'אם אתה רואה הפעלות שאינך מזהה, בטל אותן מיידית ושנה את הסיסמה שלך.'
                            : 'If you see any sessions you don\'t recognize, revoke them immediately and change your password.'}
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
                  className="glass-strong rounded-xl p-4 sm:p-6 lg:p-8"
                >
                  <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                      <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold">
                        {language === 'he' ? 'העדפות התראות' : 'Notification Preferences'}
                      </h2>
                      <p className="text-gray-400 text-xs sm:text-sm">
                        {language === 'he' ? 'בחר אילו עדכונים תרצה לקבל' : 'Choose what updates you want to receive'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Email Notifications */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Mail className="w-5 h-5 text-indigo-400" />
                        {language === 'he' ? 'התראות באימייל' : 'Email Notifications'}
                      </h3>

                      <div className="space-y-4">
                        {/* New Review */}
                        <div className="flex items-center justify-between p-4 glass rounded-lg">
                          <div>
                            <div className="font-medium text-white">
                              {language === 'he' ? 'ביקורת חדשה' : 'New Review'}
                            </div>
                            <div className="text-sm text-gray-400">
                              {language === 'he' ? 'קבל התראה כשמישהו כותב ביקורת על הספר שלך' : 'Get notified when someone reviews your book'}
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
                            <div className="font-medium text-white">
                              {language === 'he' ? 'עוקב חדש' : 'New Follower'}
                            </div>
                            <div className="text-sm text-gray-400">
                              {language === 'he' ? 'קבל התראה כשמישהו עוקב אחריך' : 'Get notified when someone follows you'}
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
                            <div className="font-medium text-white">
                              {language === 'he' ? 'מכירה חדשה' : 'New Sale'}
                            </div>
                            <div className="text-sm text-gray-400">
                              {language === 'he' ? 'קבל התראה כשהספר שלך נרכש' : 'Get notified when your book is purchased'}
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
                            <div className="font-medium text-white">
                              {language === 'he' ? 'עדכוני מערכת' : 'System Updates'}
                            </div>
                            <div className="text-sm text-gray-400">
                              {language === 'he' ? 'קבל התראות על עדכונים והודעות מהפלטפורמה' : 'Get notified about platform updates and announcements'}
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
                            <div className="font-medium text-white">
                              {language === 'he' ? 'סיכום שבועי' : 'Weekly Digest'}
                            </div>
                            <div className="text-sm text-gray-400">
                              {language === 'he' ? 'קבל סיכום שבועי של הפעילות והסטטיסטיקות שלך' : 'Receive a weekly summary of your activity and stats'}
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
