import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { api, uploadAvatar } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage, Language } from '../contexts/LanguageContext';
import { useCurrency, Currency } from '../contexts/CurrencyContext';
import { useTabKeyboardNavigation } from '../hooks/useModal';
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
  FileDown,
  Camera,
  Clock,
  MessageSquare,
  BellRing,
} from 'lucide-react';
import toast from 'react-hot-toast';

type Tab = 'profile' | 'earnings' | 'billing' | 'security' | 'notifications';

// Notification preferences interfaces
interface EmailNotifications {
  purchases: boolean;
  subscriptions: boolean;
  bookUpdates: boolean;
  marketing: boolean;
}

interface PushNotifications {
  purchases: boolean;
  subscriptions: boolean;
  bookUpdates: boolean;
  mentions: boolean;
}

interface InAppNotifications {
  purchases: boolean;
  subscriptions: boolean;
  bookUpdates: boolean;
  mentions: boolean;
  likes: boolean;
  comments: boolean;
  shares: boolean;
  newFollowers: boolean;
  messages: boolean;
  payments: boolean;
  qualityScore: boolean;
  promotions: boolean;
  system: boolean;
}

type EmailDigestFrequency = 'none' | 'daily' | 'weekly';

interface NotificationPreferences {
  id: string;
  userId: string;
  emailNotifications: EmailNotifications;
  pushNotifications: PushNotifications;
  inAppNotifications: InAppNotifications;
  emailDigest: EmailDigestFrequency;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  quietHoursEnabled: boolean;
}

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
  const { t } = useTranslation('common');
  const { user, refreshUser } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [loading, setLoading] = useState(false);

  // Tab keys for keyboard navigation
  const tabKeys: Tab[] = ['profile', 'security', 'earnings', 'billing', 'notifications'];
  const handleTabKeyDown = useTabKeyboardNavigation(tabKeys, activeTab, setActiveTab);
  const [languageLoading, setLanguageLoading] = useState(false);
  const [currencyLoading, setCurrencyLoading] = useState(false);

  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [bio, setBio] = useState(user?.profile?.bio || '');
  const [avatar, setAvatar] = useState(user?.profile?.avatar || '');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Earnings state
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [loadingEarnings, setLoadingEarnings] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Security state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [exportingData, setExportingData] = useState(false);

  // Notifications state
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences | null>(null);
  const [loadingNotificationPrefs, setLoadingNotificationPrefs] = useState(false);
  const [savingNotificationPrefs, setSavingNotificationPrefs] = useState(false);

  useEffect(() => {
    if (activeTab === 'earnings') {
      loadEarnings();
    }
    if (activeTab === 'notifications') {
      loadNotificationPreferences();
    }
  }, [activeTab]);

  const loadNotificationPreferences = async () => {
    try {
      setLoadingNotificationPrefs(true);
      const response = await api.get('/notifications/preferences');
      if (response.data.success) {
        setNotificationPrefs(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
      toast.error(t('settings.toast.load_notification_prefs_failed', 'Failed to load notification preferences'));
    } finally {
      setLoadingNotificationPrefs(false);
    }
  };

  const saveNotificationPreferences = async (updates: Partial<NotificationPreferences>) => {
    try {
      setSavingNotificationPrefs(true);
      const response = await api.put('/notifications/preferences', updates);
      if (response.data.success) {
        setNotificationPrefs(response.data.data);
        toast.success(t('settings.toast.notification_prefs_saved', 'Notification preferences saved'));
      }
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
      toast.error(t('settings.toast.save_notification_prefs_failed', 'Failed to save notification preferences'));
    } finally {
      setSavingNotificationPrefs(false);
    }
  };

  const handleToggleEmailNotification = (key: keyof EmailNotifications) => {
    if (!notificationPrefs) return;
    const newValue = !notificationPrefs.emailNotifications[key];
    const updates = {
      emailNotifications: {
        ...notificationPrefs.emailNotifications,
        [key]: newValue,
      },
    };
    setNotificationPrefs({ ...notificationPrefs, ...updates });
    saveNotificationPreferences(updates);
  };

  const handleTogglePushNotification = (key: keyof PushNotifications) => {
    if (!notificationPrefs) return;
    const newValue = !notificationPrefs.pushNotifications[key];
    const updates = {
      pushNotifications: {
        ...notificationPrefs.pushNotifications,
        [key]: newValue,
      },
    };
    setNotificationPrefs({ ...notificationPrefs, ...updates });
    saveNotificationPreferences(updates);
  };

  const handleToggleInAppNotification = (key: keyof InAppNotifications) => {
    if (!notificationPrefs) return;
    const newValue = !notificationPrefs.inAppNotifications[key];
    const updates = {
      inAppNotifications: {
        ...notificationPrefs.inAppNotifications,
        [key]: newValue,
      },
    };
    setNotificationPrefs({ ...notificationPrefs, ...updates });
    saveNotificationPreferences(updates);
  };

  const handleEmailDigestChange = (value: EmailDigestFrequency) => {
    if (!notificationPrefs) return;
    const updates = { emailDigest: value };
    setNotificationPrefs({ ...notificationPrefs, ...updates });
    saveNotificationPreferences(updates);
  };

  const handleQuietHoursToggle = () => {
    if (!notificationPrefs) return;
    const newEnabled = !notificationPrefs.quietHoursEnabled;
    const updates = {
      quietHoursEnabled: newEnabled,
      quietHoursStart: newEnabled ? (notificationPrefs.quietHoursStart || '22:00') : notificationPrefs.quietHoursStart,
      quietHoursEnd: newEnabled ? (notificationPrefs.quietHoursEnd || '08:00') : notificationPrefs.quietHoursEnd,
    };
    setNotificationPrefs({ ...notificationPrefs, ...updates });
    saveNotificationPreferences(updates);
  };

  const handleQuietHoursChange = (field: 'quietHoursStart' | 'quietHoursEnd', value: string) => {
    if (!notificationPrefs) return;
    const updates = { [field]: value };
    setNotificationPrefs({ ...notificationPrefs, ...updates });
    saveNotificationPreferences(updates);
  };

  const loadEarnings = async () => {
    try {
      setLoadingEarnings(true);
      const response = await api.get('/user/earnings');
      if (response.data.success) {
        setEarningsData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load earnings:', error);
      toast.error(t('settings.toast.load_earnings_failed'));
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
        toast.success(t('settings.toast.profile_updated'));
        await refreshUser();
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error(error.response?.data?.error || t('settings.toast.profile_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error(t('settings.toast.invalid_image_type', 'Please upload a valid image (JPG, PNG, WebP, GIF)'));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('settings.toast.image_too_large', 'Image must be less than 5MB'));
      return;
    }

    try {
      setAvatarUploading(true);
      const avatarUrl = await uploadAvatar(file);
      setAvatar(avatarUrl);
      toast.success(t('settings.toast.avatar_uploaded', 'Profile picture uploaded'));
      await refreshUser();
    } catch (error: any) {
      console.error('Failed to upload avatar:', error);
      toast.error(error.message || t('settings.toast.avatar_failed', 'Failed to upload profile picture'));
    } finally {
      setAvatarUploading(false);
      // Reset input
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);

    if (!amount || amount < 10) {
      toast.error(t('settings.toast.min_withdrawal'));
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/user/withdraw', { amount });

      if (response.data.success) {
        toast.success(t('settings.toast.withdrawal_submitted'));
        setWithdrawAmount('');
        loadEarnings();
      }
    } catch (error: any) {
      console.error('Failed to request withdrawal:', error);
      toast.error(error.response?.data?.error || t('settings.toast.withdrawal_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error(t('settings.toast.fill_passwords'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('settings.toast.passwords_mismatch'));
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t('settings.toast.password_min_length'));
      return;
    }

    try {
      setLoading(true);
      const response = await api.put('/user/password', {
        oldPassword,
        newPassword,
      });

      if (response.data.success) {
        toast.success(t('settings.toast.password_changed'));
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      console.error('Failed to change password:', error);
      toast.error(error.response?.data?.error || t('settings.toast.password_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = async (newLanguage: Language) => {
    try {
      setLanguageLoading(true);
      await setLanguage(newLanguage);
      toast.success(newLanguage === 'he' ? t('settings.toast.language_hebrew') : t('settings.toast.language_english'));
    } catch (error) {
      console.error('Failed to change language:', error);
      toast.error(t('settings.toast.language_failed'));
    } finally {
      setLanguageLoading(false);
    }
  };

  const handleCurrencyChange = async (newCurrency: Currency) => {
    try {
      setCurrencyLoading(true);
      await setCurrency(newCurrency);
      toast.success(newCurrency === 'ILS' ? t('settings.toast.currency_ils') : t('settings.toast.currency_usd'));
    } catch (error) {
      console.error('Failed to change currency:', error);
      toast.error(t('settings.toast.currency_failed'));
    } finally {
      setCurrencyLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setExportingData(true);
      const response = await api.get('/user/export-data', {
        responseType: 'blob',
      });

      // Create a blob from the response and trigger download
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mestory-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(t('settings.toast.export_success'));
    } catch (error: any) {
      console.error('Failed to export data:', error);
      toast.error(error.response?.data?.error || t('settings.toast.export_failed'));
    } finally {
      setExportingData(false);
    }
  };

  const tabs = [
    { id: 'profile' as Tab, label: t('settings.tabs.profile'), icon: User },
    { id: 'security' as Tab, label: t('settings.tabs.security'), icon: Shield },
    { id: 'earnings' as Tab, label: t('settings.tabs.earnings'), icon: DollarSign },
    { id: 'billing' as Tab, label: t('settings.tabs.billing'), icon: CreditCard },
    { id: 'notifications' as Tab, label: t('settings.tabs.notifications'), icon: Bell },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold gradient-text mb-1 sm:mb-2">
            {t('settings.title')}
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            {t('settings.subtitle')}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Sidebar Tabs - Horizontal scroll on mobile */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="glass-strong rounded-xl p-2 sm:p-4 lg:sticky lg:top-8 overflow-x-auto">
              <div className="flex lg:flex-col gap-1 sm:gap-2 min-w-max lg:min-w-0" role="tablist">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      type="button"
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      onKeyDown={handleTabKeyDown}
                      role="tab"
                      aria-selected={activeTab === tab.id}
                      tabIndex={activeTab === tab.id ? 0 : -1}
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
                    {t('settings.profile.title')}
                  </h2>

                  <div className="space-y-4 sm:space-y-6">
                    {/* Language Selection - First for visibility */}
                    <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border border-indigo-500/30">
                      <label className="block text-sm font-medium mb-2 sm:mb-3 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-indigo-400" />
                        {t('settings.profile.language')}
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                        <button
                          type="button"
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
                          type="button"
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
                        {t('settings.profile.language_help')}
                      </p>
                    </div>

                    {/* Currency */}
                    <div>
                      <label className="block text-sm font-medium mb-2 sm:mb-3 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        {t('currency.select')}
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                        <button
                          type="button"
                          onClick={() => handleCurrencyChange('USD')}
                          disabled={currencyLoading}
                          className={`flex-1 flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-xl border transition-all ${
                            currency === 'USD'
                              ? 'bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-green-500/50 text-white'
                              : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {currencyLoading && currency !== 'USD' ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <span className="text-xl sm:text-2xl">$</span>
                              <span className="font-medium text-sm sm:text-base">USD</span>
                              {currency === 'USD' && <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />}
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCurrencyChange('ILS')}
                          disabled={currencyLoading}
                          className={`flex-1 flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-xl border transition-all ${
                            currency === 'ILS'
                              ? 'bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-green-500/50 text-white'
                              : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {currencyLoading && currency !== 'ILS' ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <span className="text-xl sm:text-2xl">&#8362;</span>
                              <span className="font-medium text-sm sm:text-base">ILS</span>
                              {currency === 'ILS' && <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />}
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {t('settings.profile.currency_help')}
                      </p>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {t('settings.profile.name')}
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input"
                        placeholder={t('settings.profile.name_placeholder')}
                      />
                    </div>

                    {/* Email (readonly) */}
                    <div>
                      <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {t('settings.profile.email')}
                      </label>
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="input opacity-50 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {t('settings.profile.email_help')}
                      </p>
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('settings.profile.bio')}
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="input min-h-[100px] resize-none"
                        placeholder={t('settings.profile.bio_placeholder')}
                      />
                    </div>

                    {/* Avatar Upload */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('settings.profile.avatar')}
                      </label>
                      <div className="flex items-center gap-4">
                        {/* Avatar Preview */}
                        <div className="relative">
                          <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-memorial-gold/20 to-purple-500/20 border-2 border-white/10 flex items-center justify-center">
                            {avatar ? (
                              <img
                                src={avatar}
                                alt={t('settings.profile.avatar')}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-10 h-10 text-gray-400" />
                            )}
                          </div>
                          {avatarUploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                              <Loader2 className="w-6 h-6 animate-spin text-white" />
                            </div>
                          )}
                        </div>

                        {/* Upload Button */}
                        <div className="flex-1">
                          <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={handleAvatarUpload}
                            className="hidden"
                            id="avatar-upload"
                          />
                          <label
                            htmlFor="avatar-upload"
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all
                              ${avatarUploading
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:border-white/20'
                              }`}
                          >
                            {avatarUploading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Camera className="w-4 h-4" />
                            )}
                            <span>{t('settings.profile.upload_avatar', 'Upload Picture')}</span>
                          </label>
                          <p className="mt-2 text-xs text-gray-400">
                            {t('settings.profile.avatar_hint', 'JPG, PNG, WebP or GIF. Max 5MB.')}
                          </p>
                        </div>
                      </div>
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
                      {t('settings.profile.save')}
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
                        {t('settings.earnings_tab.title')}
                      </h2>
                      <button
                        onClick={loadEarnings}
                        className="btn-secondary text-sm py-2 px-4"
                      >
                        {t('settings.earnings_tab.refresh')}
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
                                {t('settings.earnings_tab.total_earnings')}
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
                                {t('settings.earnings_tab.available')}
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
                                {t('settings.earnings_tab.total_sales')}
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
                            {t('settings.earnings_tab.revenue_trend')}
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
                            {t('settings.earnings_tab.top_books')}
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
                                    {t('settings.earnings_tab.sales_format', { sales: book.sales, amount: book.price })}
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
                            {t('settings.earnings_tab.withdraw_title')}
                          </h3>
                          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <div className="flex-1">
                              <input
                                type="number"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                className="input"
                                placeholder={t('settings.earnings_tab.withdraw_placeholder')}
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
                                t('settings.earnings_tab.withdraw_button')
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">
                            {t('settings.earnings_tab.withdraw_help')}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-20">
                        <p className="text-gray-400">
                          {t('settings.earnings_tab.no_data')}
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
                    {t('settings.billing.title')}
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
                            {t('settings.billing.plan')}: {user?.role}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-400">
                            {user?.credits === 999999
                              ? t('settings.billing.unlimited')
                              : user?.credits.toLocaleString()}{' '}
                            {t('user.credits')}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => window.location.href = '/subscription'}
                        className="btn-secondary px-4 sm:px-6 py-2 text-sm w-full sm:w-auto"
                      >
                        {t('settings.billing.change_plan')}
                      </button>
                    </div>
                  </div>

                  {/* Subscription Details */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-white/10">
                      <span className="text-gray-400">{t('settings.billing.status')}</span>
                      <span className="flex items-center gap-2 text-green-400">
                        <Check className="w-4 h-4" />
                        {t('settings.billing.active')}
                      </span>
                    </div>

                    {user?.subscription && (
                      <>
                        <div className="flex items-center justify-between py-3 border-b border-white/10">
                          <span className="text-gray-400">{t('settings.billing.billing_cycle')}</span>
                          <span className="text-white">{t('settings.billing.monthly')}</span>
                        </div>

                        <div className="flex items-center justify-between py-3 border-b border-white/10">
                          <span className="text-gray-400">{t('settings.billing.next_billing')}</span>
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
                          {t('settings.security.password_title')}
                        </h2>
                        <p className="text-gray-400 text-xs sm:text-sm">
                          {t('settings.security.password_subtitle')}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t('settings.security.current_password')}
                        </label>
                        <input
                          type="password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          className="input"
                          placeholder={t('settings.security.current_password_placeholder')}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t('settings.security.new_password')}
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="input"
                          placeholder={t('settings.security.new_password_placeholder')}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {t('settings.security.confirm_password')}
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="input"
                          placeholder={t('settings.security.confirm_password_placeholder')}
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
                        {t('settings.security.update_password')}
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
                          {t('settings.security.sessions_title')}
                        </h2>
                        <p className="text-gray-400 text-xs sm:text-sm">
                          {t('settings.security.sessions_subtitle')}
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
                                  {t('settings.security.current')}
                                </span>
                              </div>
                              <div className="text-sm text-gray-400 mt-1">
                                {t('settings.security.last_active', { time: t('notifications.time.just_now') })}
                              </div>
                              <div className="text-sm text-gray-500">
                                IP: 192.168.1.1 • Tel Aviv, Israel
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
                                {t('settings.security.last_active', { time: t('notifications.time.days_ago', { count: 2 }) })}
                              </div>
                              <div className="text-sm text-gray-500">
                                IP: 192.168.1.15 • Tel Aviv, Israel
                              </div>
                            </div>
                          </div>
                          <button className="text-sm text-red-400 hover:text-red-300 transition">
                            {t('settings.security.revoke')}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                        <p className="text-sm text-yellow-200">
                          {t('settings.security.security_warning')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Data Export Section (GDPR) */}
                  <div className="glass-strong rounded-xl p-4 sm:p-6 lg:p-8 mt-4 sm:mt-6">
                    <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                        <FileDown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold">
                          {t('settings.security.export_title')}
                        </h2>
                        <p className="text-gray-400 text-xs sm:text-sm">
                          {t('settings.security.export_subtitle')}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-sm text-gray-300">
                        {t('settings.security.export_description')}
                      </p>

                      <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
                        <li>{t('settings.security.export_includes_profile')}</li>
                        <li>{t('settings.security.export_includes_books')}</li>
                        <li>{t('settings.security.export_includes_summaries')}</li>
                        <li>{t('settings.security.export_includes_transactions')}</li>
                        <li>{t('settings.security.export_includes_activity')}</li>
                      </ul>

                      <button
                        onClick={handleExportData}
                        disabled={exportingData}
                        className="btn-primary px-8 py-3 flex items-center gap-2"
                      >
                        {exportingData ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <FileDown className="w-5 h-5" />
                        )}
                        {t('settings.security.export_button')}
                      </button>
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
                  className="space-y-6"
                >
                  {/* Header */}
                  <div className="glass-strong rounded-xl p-4 sm:p-6 lg:p-8">
                    <div className="flex items-start sm:items-center gap-3 mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                        <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl sm:text-2xl font-bold">
                          {t('settings.notifications_tab.title')}
                        </h2>
                        <p className="text-gray-400 text-xs sm:text-sm">
                          {t('settings.notifications_tab.subtitle')}
                        </p>
                      </div>
                      {savingNotificationPrefs && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t('common.saving', 'Saving...')}
                        </div>
                      )}
                    </div>
                  </div>

                  {loadingNotificationPrefs ? (
                    <div className="glass-strong rounded-xl p-8 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    </div>
                  ) : notificationPrefs ? (
                    <>
                      {/* Email Notifications */}
                      <div className="glass-strong rounded-xl p-4 sm:p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Mail className="w-5 h-5 text-indigo-400" />
                          {t('settings.notifications_tab.email_title', 'Email Notifications')}
                        </h3>

                        <div className="space-y-4">
                          {/* Purchases */}
                          <div className="flex items-center justify-between p-4 glass rounded-lg">
                            <div>
                              <div className="font-medium text-white">
                                {t('settings.notifications_tab.purchases', 'Purchases')}
                              </div>
                              <div className="text-sm text-gray-400">
                                {t('settings.notifications_tab.purchases_desc', 'Get notified when someone buys your book')}
                              </div>
                            </div>
                            <button
                              onClick={() => handleToggleEmailNotification('purchases')}
                              disabled={savingNotificationPrefs}
                              className={`relative w-14 h-8 rounded-full transition-colors ${
                                notificationPrefs.emailNotifications.purchases
                                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                                  : 'bg-gray-600'
                              }`}
                            >
                              <motion.div
                                animate={{ x: notificationPrefs.emailNotifications.purchases ? 24 : 2 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                              />
                            </button>
                          </div>

                          {/* Subscriptions */}
                          <div className="flex items-center justify-between p-4 glass rounded-lg">
                            <div>
                              <div className="font-medium text-white">
                                {t('settings.notifications_tab.subscriptions', 'Subscriptions')}
                              </div>
                              <div className="text-sm text-gray-400">
                                {t('settings.notifications_tab.subscriptions_desc', 'Subscription updates and renewals')}
                              </div>
                            </div>
                            <button
                              onClick={() => handleToggleEmailNotification('subscriptions')}
                              disabled={savingNotificationPrefs}
                              className={`relative w-14 h-8 rounded-full transition-colors ${
                                notificationPrefs.emailNotifications.subscriptions
                                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                                  : 'bg-gray-600'
                              }`}
                            >
                              <motion.div
                                animate={{ x: notificationPrefs.emailNotifications.subscriptions ? 24 : 2 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                              />
                            </button>
                          </div>

                          {/* Book Updates */}
                          <div className="flex items-center justify-between p-4 glass rounded-lg">
                            <div>
                              <div className="font-medium text-white">
                                {t('settings.notifications_tab.book_updates', 'Book Updates')}
                              </div>
                              <div className="text-sm text-gray-400">
                                {t('settings.notifications_tab.book_updates_desc', 'Updates about your published books')}
                              </div>
                            </div>
                            <button
                              onClick={() => handleToggleEmailNotification('bookUpdates')}
                              disabled={savingNotificationPrefs}
                              className={`relative w-14 h-8 rounded-full transition-colors ${
                                notificationPrefs.emailNotifications.bookUpdates
                                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                                  : 'bg-gray-600'
                              }`}
                            >
                              <motion.div
                                animate={{ x: notificationPrefs.emailNotifications.bookUpdates ? 24 : 2 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                              />
                            </button>
                          </div>

                          {/* Marketing */}
                          <div className="flex items-center justify-between p-4 glass rounded-lg">
                            <div>
                              <div className="font-medium text-white">
                                {t('settings.notifications_tab.marketing', 'Marketing & Promotions')}
                              </div>
                              <div className="text-sm text-gray-400">
                                {t('settings.notifications_tab.marketing_desc', 'Tips, offers, and product updates')}
                              </div>
                            </div>
                            <button
                              onClick={() => handleToggleEmailNotification('marketing')}
                              disabled={savingNotificationPrefs}
                              className={`relative w-14 h-8 rounded-full transition-colors ${
                                notificationPrefs.emailNotifications.marketing
                                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                                  : 'bg-gray-600'
                              }`}
                            >
                              <motion.div
                                animate={{ x: notificationPrefs.emailNotifications.marketing ? 24 : 2 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                              />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Push Notifications */}
                      <div className="glass-strong rounded-xl p-4 sm:p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <BellRing className="w-5 h-5 text-purple-400" />
                          {t('settings.notifications_tab.push_title', 'Push Notifications')}
                        </h3>

                        <div className="space-y-4">
                          {/* Purchases */}
                          <div className="flex items-center justify-between p-4 glass rounded-lg">
                            <div>
                              <div className="font-medium text-white">
                                {t('settings.notifications_tab.purchases', 'Purchases')}
                              </div>
                              <div className="text-sm text-gray-400">
                                {t('settings.notifications_tab.push_purchases_desc', 'Instant alerts for sales')}
                              </div>
                            </div>
                            <button
                              onClick={() => handleTogglePushNotification('purchases')}
                              disabled={savingNotificationPrefs}
                              className={`relative w-14 h-8 rounded-full transition-colors ${
                                notificationPrefs.pushNotifications.purchases
                                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                                  : 'bg-gray-600'
                              }`}
                            >
                              <motion.div
                                animate={{ x: notificationPrefs.pushNotifications.purchases ? 24 : 2 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                              />
                            </button>
                          </div>

                          {/* Mentions */}
                          <div className="flex items-center justify-between p-4 glass rounded-lg">
                            <div>
                              <div className="font-medium text-white">
                                {t('settings.notifications_tab.mentions', 'Mentions')}
                              </div>
                              <div className="text-sm text-gray-400">
                                {t('settings.notifications_tab.mentions_desc', 'When someone mentions you')}
                              </div>
                            </div>
                            <button
                              onClick={() => handleTogglePushNotification('mentions')}
                              disabled={savingNotificationPrefs}
                              className={`relative w-14 h-8 rounded-full transition-colors ${
                                notificationPrefs.pushNotifications.mentions
                                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                                  : 'bg-gray-600'
                              }`}
                            >
                              <motion.div
                                animate={{ x: notificationPrefs.pushNotifications.mentions ? 24 : 2 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                              />
                            </button>
                          </div>

                          {/* Book Updates */}
                          <div className="flex items-center justify-between p-4 glass rounded-lg">
                            <div>
                              <div className="font-medium text-white">
                                {t('settings.notifications_tab.book_updates', 'Book Updates')}
                              </div>
                              <div className="text-sm text-gray-400">
                                {t('settings.notifications_tab.push_book_updates_desc', 'Publishing and quality updates')}
                              </div>
                            </div>
                            <button
                              onClick={() => handleTogglePushNotification('bookUpdates')}
                              disabled={savingNotificationPrefs}
                              className={`relative w-14 h-8 rounded-full transition-colors ${
                                notificationPrefs.pushNotifications.bookUpdates
                                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                                  : 'bg-gray-600'
                              }`}
                            >
                              <motion.div
                                animate={{ x: notificationPrefs.pushNotifications.bookUpdates ? 24 : 2 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                              />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* In-App Notifications */}
                      <div className="glass-strong rounded-xl p-4 sm:p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-cyan-400" />
                          {t('settings.notifications_tab.inapp_title', 'In-App Notifications')}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Likes */}
                          <div className="flex items-center justify-between p-4 glass rounded-lg">
                            <div className="font-medium text-white">
                              {t('settings.notifications_tab.likes', 'Likes')}
                            </div>
                            <button
                              onClick={() => handleToggleInAppNotification('likes')}
                              disabled={savingNotificationPrefs}
                              className={`relative w-14 h-8 rounded-full transition-colors ${
                                notificationPrefs.inAppNotifications.likes
                                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                                  : 'bg-gray-600'
                              }`}
                            >
                              <motion.div
                                animate={{ x: notificationPrefs.inAppNotifications.likes ? 24 : 2 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                              />
                            </button>
                          </div>

                          {/* Comments */}
                          <div className="flex items-center justify-between p-4 glass rounded-lg">
                            <div className="font-medium text-white">
                              {t('settings.notifications_tab.comments', 'Comments')}
                            </div>
                            <button
                              onClick={() => handleToggleInAppNotification('comments')}
                              disabled={savingNotificationPrefs}
                              className={`relative w-14 h-8 rounded-full transition-colors ${
                                notificationPrefs.inAppNotifications.comments
                                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                                  : 'bg-gray-600'
                              }`}
                            >
                              <motion.div
                                animate={{ x: notificationPrefs.inAppNotifications.comments ? 24 : 2 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                              />
                            </button>
                          </div>

                          {/* Shares */}
                          <div className="flex items-center justify-between p-4 glass rounded-lg">
                            <div className="font-medium text-white">
                              {t('settings.notifications_tab.shares', 'Shares')}
                            </div>
                            <button
                              onClick={() => handleToggleInAppNotification('shares')}
                              disabled={savingNotificationPrefs}
                              className={`relative w-14 h-8 rounded-full transition-colors ${
                                notificationPrefs.inAppNotifications.shares
                                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                                  : 'bg-gray-600'
                              }`}
                            >
                              <motion.div
                                animate={{ x: notificationPrefs.inAppNotifications.shares ? 24 : 2 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                              />
                            </button>
                          </div>

                          {/* New Followers */}
                          <div className="flex items-center justify-between p-4 glass rounded-lg">
                            <div className="font-medium text-white">
                              {t('settings.notifications_tab.new_followers', 'New Followers')}
                            </div>
                            <button
                              onClick={() => handleToggleInAppNotification('newFollowers')}
                              disabled={savingNotificationPrefs}
                              className={`relative w-14 h-8 rounded-full transition-colors ${
                                notificationPrefs.inAppNotifications.newFollowers
                                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                                  : 'bg-gray-600'
                              }`}
                            >
                              <motion.div
                                animate={{ x: notificationPrefs.inAppNotifications.newFollowers ? 24 : 2 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                              />
                            </button>
                          </div>

                          {/* Messages */}
                          <div className="flex items-center justify-between p-4 glass rounded-lg">
                            <div className="font-medium text-white">
                              {t('settings.notifications_tab.messages', 'Messages')}
                            </div>
                            <button
                              onClick={() => handleToggleInAppNotification('messages')}
                              disabled={savingNotificationPrefs}
                              className={`relative w-14 h-8 rounded-full transition-colors ${
                                notificationPrefs.inAppNotifications.messages
                                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                                  : 'bg-gray-600'
                              }`}
                            >
                              <motion.div
                                animate={{ x: notificationPrefs.inAppNotifications.messages ? 24 : 2 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                              />
                            </button>
                          </div>

                          {/* Payments */}
                          <div className="flex items-center justify-between p-4 glass rounded-lg">
                            <div className="font-medium text-white">
                              {t('settings.notifications_tab.payments', 'Payments')}
                            </div>
                            <button
                              onClick={() => handleToggleInAppNotification('payments')}
                              disabled={savingNotificationPrefs}
                              className={`relative w-14 h-8 rounded-full transition-colors ${
                                notificationPrefs.inAppNotifications.payments
                                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                                  : 'bg-gray-600'
                              }`}
                            >
                              <motion.div
                                animate={{ x: notificationPrefs.inAppNotifications.payments ? 24 : 2 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                              />
                            </button>
                          </div>

                          {/* System */}
                          <div className="flex items-center justify-between p-4 glass rounded-lg">
                            <div className="font-medium text-white">
                              {t('settings.notifications_tab.system', 'System')}
                            </div>
                            <button
                              onClick={() => handleToggleInAppNotification('system')}
                              disabled={savingNotificationPrefs}
                              className={`relative w-14 h-8 rounded-full transition-colors ${
                                notificationPrefs.inAppNotifications.system
                                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                                  : 'bg-gray-600'
                              }`}
                            >
                              <motion.div
                                animate={{ x: notificationPrefs.inAppNotifications.system ? 24 : 2 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                              />
                            </button>
                          </div>

                          {/* Promotions */}
                          <div className="flex items-center justify-between p-4 glass rounded-lg">
                            <div className="font-medium text-white">
                              {t('settings.notifications_tab.promotions', 'Promotions')}
                            </div>
                            <button
                              onClick={() => handleToggleInAppNotification('promotions')}
                              disabled={savingNotificationPrefs}
                              className={`relative w-14 h-8 rounded-full transition-colors ${
                                notificationPrefs.inAppNotifications.promotions
                                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                                  : 'bg-gray-600'
                              }`}
                            >
                              <motion.div
                                animate={{ x: notificationPrefs.inAppNotifications.promotions ? 24 : 2 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                              />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Email Digest */}
                      <div className="glass-strong rounded-xl p-4 sm:p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Mail className="w-5 h-5 text-green-400" />
                          {t('settings.notifications_tab.digest_title', 'Email Digest')}
                        </h3>

                        <p className="text-sm text-gray-400 mb-4">
                          {t('settings.notifications_tab.digest_desc', 'Receive a summary of your activity and updates')}
                        </p>

                        <div className="flex flex-wrap gap-3">
                          {(['none', 'daily', 'weekly'] as EmailDigestFrequency[]).map((option) => (
                            <button
                              key={option}
                              onClick={() => handleEmailDigestChange(option)}
                              disabled={savingNotificationPrefs}
                              className={`px-4 py-2 rounded-lg transition-all ${
                                notificationPrefs.emailDigest === option
                                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                                  : 'glass text-gray-400 hover:text-white'
                              }`}
                            >
                              {t(`settings.notifications_tab.digest_${option}`, option.charAt(0).toUpperCase() + option.slice(1))}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Quiet Hours */}
                      <div className="glass-strong rounded-xl p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-yellow-400" />
                            <h3 className="text-lg font-semibold">
                              {t('settings.notifications_tab.quiet_hours_title', 'Quiet Hours')}
                            </h3>
                          </div>
                          <button
                            onClick={handleQuietHoursToggle}
                            disabled={savingNotificationPrefs}
                            className={`relative w-14 h-8 rounded-full transition-colors ${
                              notificationPrefs.quietHoursEnabled
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                                : 'bg-gray-600'
                            }`}
                          >
                            <motion.div
                              animate={{ x: notificationPrefs.quietHoursEnabled ? 24 : 2 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                            />
                          </button>
                        </div>

                        <p className="text-sm text-gray-400 mb-4">
                          {t('settings.notifications_tab.quiet_hours_desc', 'Pause non-urgent notifications during specified hours')}
                        </p>

                        {notificationPrefs.quietHoursEnabled && (
                          <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                              <label className="block text-sm font-medium mb-2">
                                {t('settings.notifications_tab.quiet_start', 'Start Time')}
                              </label>
                              <input
                                type="time"
                                value={notificationPrefs.quietHoursStart || '22:00'}
                                onChange={(e) => handleQuietHoursChange('quietHoursStart', e.target.value)}
                                disabled={savingNotificationPrefs}
                                className="input"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="block text-sm font-medium mb-2">
                                {t('settings.notifications_tab.quiet_end', 'End Time')}
                              </label>
                              <input
                                type="time"
                                value={notificationPrefs.quietHoursEnd || '08:00'}
                                onChange={(e) => handleQuietHoursChange('quietHoursEnd', e.target.value)}
                                disabled={savingNotificationPrefs}
                                className="input"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="glass-strong rounded-xl p-8 text-center">
                      <p className="text-gray-400">
                        {t('settings.notifications_tab.load_failed', 'Failed to load notification preferences')}
                      </p>
                      <button
                        onClick={loadNotificationPreferences}
                        className="btn-secondary mt-4"
                      >
                        {t('common.retry', 'Retry')}
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
