import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { api, uploadAvatar } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage, Language } from '../contexts/LanguageContext';
import {
  User,
  Download,
  Loader2,
  Check,
  Mail,
  Save,
  Bell,
  Lock,
  AlertTriangle,
  Globe,
  FileDown,
  Camera,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

// Simplified notification level
type NotificationLevel = 'all' | 'important' | 'off';

export default function SettingsPage() {
  const { t } = useTranslation('common');
  const { user, refreshUser } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [languageLoading, setLanguageLoading] = useState(false);

  // Profile state
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(user?.profile?.avatar || '');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Security state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [exportingData, setExportingData] = useState(false);

  // Notifications state - simplified to 3 levels
  const [notificationLevel, setNotificationLevel] = useState<NotificationLevel>('all');
  const [savingNotificationPrefs, setSavingNotificationPrefs] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    loadNotificationLevel();
  }, []);

  const loadNotificationLevel = async () => {
    try {
      const response = await api.get('/notifications/preferences');
      if (response.data.success) {
        const prefs = response.data.data;
        const emailAll = prefs.emailNotifications;
        const allOn = emailAll.purchases && emailAll.subscriptions && emailAll.bookUpdates && emailAll.marketing;
        const allOff = !emailAll.purchases && !emailAll.subscriptions && !emailAll.bookUpdates && !emailAll.marketing;
        if (allOff) setNotificationLevel('off');
        else if (allOn) setNotificationLevel('all');
        else setNotificationLevel('important');
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to load notification preferences:', error);
    }
  };

  const handleNotificationLevelChange = async (level: NotificationLevel) => {
    setNotificationLevel(level);
    try {
      setSavingNotificationPrefs(true);
      let updates = {};
      if (level === 'all') {
        updates = {
          emailNotifications: { purchases: true, subscriptions: true, bookUpdates: true, marketing: true },
          pushNotifications: { purchases: true, subscriptions: true, bookUpdates: true, mentions: true },
          inAppNotifications: { purchases: true, subscriptions: true, bookUpdates: true, mentions: true, likes: true, comments: true, shares: true, newFollowers: true, messages: true, payments: true, qualityScore: true, promotions: true, system: true },
          quietHoursEnabled: false,
        };
      } else if (level === 'important') {
        updates = {
          emailNotifications: { purchases: true, subscriptions: true, bookUpdates: true, marketing: false },
          pushNotifications: { purchases: true, subscriptions: false, bookUpdates: true, mentions: false },
          inAppNotifications: { purchases: true, subscriptions: true, bookUpdates: true, mentions: false, likes: false, comments: false, shares: false, newFollowers: false, messages: true, payments: true, qualityScore: false, promotions: false, system: true },
          quietHoursEnabled: false,
        };
      } else {
        updates = {
          emailNotifications: { purchases: false, subscriptions: false, bookUpdates: false, marketing: false },
          pushNotifications: { purchases: false, subscriptions: false, bookUpdates: false, mentions: false },
          inAppNotifications: { purchases: false, subscriptions: false, bookUpdates: false, mentions: false, likes: false, comments: false, shares: false, newFollowers: false, messages: false, payments: false, qualityScore: false, promotions: false, system: false },
          quietHoursEnabled: false,
        };
      }
      const response = await api.put('/notifications/preferences', updates);
      if (response.data.success) {
        toast.success(language === 'he' ? 'העדפות ההתראות נשמרו' : 'Notification preferences saved');
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to save notification preferences:', error);
      toast.error(t('settings.toast.save_notification_prefs_failed', 'Failed to save notification preferences'));
    } finally {
      setSavingNotificationPrefs(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const response = await api.put('/user/profile', { name, avatar });
      if (response.data.success) {
        toast.success(t('settings.toast.profile_updated'));
        await refreshUser();
      }
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Failed to update profile:', error);
      toast.error(error.response?.data?.error || t('settings.toast.profile_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error(t('settings.toast.invalid_image_type', 'Please upload a valid image (JPG, PNG, WebP, GIF)'));
      return;
    }
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
      if (import.meta.env.DEV) console.error('Failed to upload avatar:', error);
      toast.error(error.message || t('settings.toast.avatar_failed', 'Failed to upload profile picture'));
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleChangePassword = async () => {
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
      const response = await api.put('/user/password', { oldPassword, newPassword });
      if (response.data.success) {
        toast.success(t('settings.toast.password_changed'));
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordForm(false);
      }
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Failed to change password:', error);
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
      if (import.meta.env.DEV) console.error('Failed to change language:', error);
      toast.error(t('settings.toast.language_failed'));
    } finally {
      setLanguageLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setExportingData(true);
      const response = await api.get('/user/export-data', { responseType: 'blob' });
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
      if (import.meta.env.DEV) console.error('Failed to export data:', error);
      toast.error(error.response?.data?.error || t('settings.toast.export_failed'));
    } finally {
      setExportingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    try {
      setDeletingAccount(true);
      await api.delete('/user/account');
      toast.success(language === 'he' ? 'החשבון נמחק' : 'Account deleted');
      window.location.href = '/';
    } catch (error: any) {
      if (import.meta.env.DEV) console.error('Failed to delete account:', error);
      toast.error(error.response?.data?.error || (language === 'he' ? 'מחיקת החשבון נכשלה' : 'Failed to delete account'));
    } finally {
      setDeletingAccount(false);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' as const },
    }),
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-memorial-gold to-amber-300 bg-clip-text text-transparent mb-2">
            {t('settings.title')}
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            {t('settings.subtitle')}
          </p>
        </div>

        <div className="space-y-5">
          {/* Profile Card */}
          <motion.section
            custom={0}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="rounded-2xl border border-memorial-gold/20 bg-white/[0.04] backdrop-blur-xl p-5 sm:p-7 shadow-lg"
          >
            <h2 className="text-lg sm:text-xl font-bold mb-5 flex items-center gap-2.5 text-memorial-gold">
              <User className="w-5 h-5" />
              {t('settings.profile.title')}
            </h2>

            <div className="space-y-5">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-memorial-gold/20 to-purple-500/20 border-2 border-memorial-gold/30 flex items-center justify-center">
                    {avatar ? (
                      <img src={avatar} alt={t('settings.profile.avatar')} className="w-full h-full object-cover" />
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
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all text-sm ${
                      avatarUploading
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-memorial-gold/10 hover:bg-memorial-gold/20 text-memorial-gold border border-memorial-gold/30 hover:border-memorial-gold/50'
                    }`}
                  >
                    {avatarUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    <span>{t('settings.profile.upload_avatar', 'Upload Picture')}</span>
                  </label>
                  <p className="mt-1.5 text-xs text-gray-500">
                    {t('settings.profile.avatar_hint', 'JPG, PNG, WebP or GIF. Max 5MB.')}
                  </p>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-300">
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
                <label className="block text-sm font-medium mb-1.5 flex items-center gap-2 text-gray-300">
                  <Mail className="w-4 h-4" />
                  {t('settings.profile.email', 'Email')}
                </label>
                <input type="email" value={email} disabled className="input opacity-50 cursor-not-allowed" />
                <p className="text-xs text-gray-500 mt-1">{t('settings.profile.email_help')}</p>
              </div>

              {/* Save */}
              <button
                onClick={handleUpdateProfile}
                disabled={loading}
                className="btn-primary w-full sm:w-auto px-8 py-3 flex items-center justify-center gap-2 text-base"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {t('settings.profile.save')}
              </button>
            </div>
          </motion.section>

          {/* Notifications Card */}
          <motion.section
            custom={1}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="rounded-2xl border border-memorial-gold/20 bg-white/[0.04] backdrop-blur-xl p-5 sm:p-7 shadow-lg"
          >
            <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2.5 text-memorial-gold">
              <Bell className="w-5 h-5" />
              {t('settings.notifications.title')}
            </h2>
            <p className="text-sm text-gray-400 mb-4">{t('settings.notifications.subtitle')}</p>

            <div className="flex flex-col sm:flex-row gap-3">
              {([
                { value: 'all' as NotificationLevel, label: language === 'he' ? '\u05D4\u05DB\u05DC' : 'All', desc: language === 'he' ? '\u05E7\u05D1\u05DC\u05D5 \u05D0\u05EA \u05DB\u05DC \u05D4\u05D4\u05EA\u05E8\u05D0\u05D5\u05EA' : 'Receive all notifications' },
                { value: 'important' as NotificationLevel, label: language === 'he' ? '\u05E8\u05E7 \u05D7\u05E9\u05D5\u05D1' : 'Important only', desc: language === 'he' ? '\u05E8\u05DB\u05D9\u05E9\u05D5\u05EA, \u05EA\u05E9\u05DC\u05D5\u05DE\u05D9\u05DD \u05D5\u05DE\u05E2\u05E8\u05DB\u05EA' : 'Purchases, payments & system' },
                { value: 'off' as NotificationLevel, label: language === 'he' ? '\u05DB\u05D1\u05D5\u05D9' : 'Off', desc: language === 'he' ? '\u05DC\u05DC\u05D0 \u05D4\u05EA\u05E8\u05D0\u05D5\u05EA' : 'No notifications' },
              ]).map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleNotificationLevelChange(option.value)}
                  disabled={savingNotificationPrefs}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all text-center ${
                    notificationLevel === option.value
                      ? 'border-memorial-gold bg-memorial-gold/10 text-white'
                      : 'border-white/10 text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className="font-semibold text-base mb-1">{option.label}</div>
                  <div className="text-xs opacity-70">{option.desc}</div>
                  {notificationLevel === option.value && (
                    <Check className="w-4 h-4 mx-auto mt-2 text-memorial-gold" />
                  )}
                </button>
              ))}
            </div>

            {savingNotificationPrefs && (
              <div className="flex items-center gap-2 mt-3 text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                {language === 'he' ? 'שומר...' : 'Saving...'}
              </div>
            )}
          </motion.section>

          {/* Language Card */}
          <motion.section
            custom={2}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="rounded-2xl border border-memorial-gold/20 bg-white/[0.04] backdrop-blur-xl p-5 sm:p-7 shadow-lg"
          >
            <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2.5 text-memorial-gold">
              <Globe className="w-5 h-5" />
              {t('settings.language.title', 'Language')}
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => handleLanguageChange('he')}
                disabled={languageLoading}
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl border-2 transition-all ${
                  language === 'he'
                    ? 'border-memorial-gold bg-memorial-gold/10 text-white'
                    : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {languageLoading && language !== 'he' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span className="text-2xl">&#x1F1EE;&#x1F1F1;</span>
                    <span className="font-medium text-base">{'\u05E2\u05D1\u05E8\u05D9\u05EA'}</span>
                    {language === 'he' && <Check className="w-5 h-5 text-memorial-gold" />}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                disabled={languageLoading}
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl border-2 transition-all ${
                  language === 'en'
                    ? 'border-memorial-gold bg-memorial-gold/10 text-white'
                    : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {languageLoading && language !== 'en' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span className="text-2xl">&#x1F1FA;&#x1F1F8;</span>
                    <span className="font-medium text-base">English</span>
                    {language === 'en' && <Check className="w-5 h-5 text-memorial-gold" />}
                  </>
                )}
              </button>
            </div>
          </motion.section>

          {/* Change Password Card */}
          <motion.section
            custom={3}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="rounded-2xl border border-memorial-gold/20 bg-white/[0.04] backdrop-blur-xl p-5 sm:p-7 shadow-lg"
          >
            <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2.5 text-memorial-gold">
              <Lock className="w-5 h-5" />
              {t('settings.security.change_password')}
            </h2>

            {!showPasswordForm ? (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-memorial-gold/30 text-memorial-gold hover:bg-memorial-gold/10 transition-all font-medium"
              >
                {t('settings.security.change_password')}
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-300">
                    {t('settings.security.current_password')}
                  </label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="input"
                    placeholder={t('settings.security.current_password_placeholder', '********')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-300">
                    {t('settings.security.new_password')}
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input"
                    placeholder={t('settings.security.new_password_placeholder', '********')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-300">
                    {t('settings.security.confirm_password')}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input"
                    placeholder={t('settings.security.confirm_password_placeholder', '********')}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleChangePassword}
                    disabled={loading}
                    className="btn-primary px-6 py-3 flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                    {t('settings.security.update_password')}
                  </button>
                  <button
                    onClick={() => { setShowPasswordForm(false); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); }}
                    className="px-6 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                  >
                    {language === 'he' ? 'ביטול' : 'Cancel'}
                  </button>
                </div>
              </motion.div>
            )}
          </motion.section>

          {/* Download Data Card */}
          <motion.section
            custom={4}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="rounded-2xl border border-memorial-gold/20 bg-white/[0.04] backdrop-blur-xl p-5 sm:p-7 shadow-lg"
          >
            <h2 className="text-lg sm:text-xl font-bold mb-2 flex items-center gap-2.5 text-memorial-gold">
              <FileDown className="w-5 h-5" />
              {t('settings.security.export_title', 'Download My Data')}
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              {t('settings.security.export_description', 'Download a copy of all your data, including your profile, books, and activity.')}
            </p>
            <button
              onClick={handleExportData}
              disabled={exportingData}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-memorial-gold/30 text-memorial-gold hover:bg-memorial-gold/10 transition-all font-medium flex items-center justify-center gap-2"
            >
              {exportingData ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              {t('settings.security.export_button', 'Download Data')}
            </button>
          </motion.section>

          {/* Delete Account Card */}
          <motion.section
            custom={5}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="rounded-2xl border border-red-500/30 bg-red-500/[0.03] backdrop-blur-xl p-5 sm:p-7 shadow-lg"
          >
            <h2 className="text-lg sm:text-xl font-bold mb-2 flex items-center gap-2.5 text-red-400">
              <Trash2 className="w-5 h-5" />
              {t('settings.account.delete_account')}
            </h2>
            <p className="text-sm text-gray-400 mb-4">{t('settings.account.delete_warning')}</p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-all font-medium"
              >
                {t('settings.account.delete_account')}
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4"
              >
                <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-200">
                    {language === 'he'
                      ? '\u05E4\u05E2\u05D5\u05DC\u05D4 \u05D6\u05D5 \u05DC\u05D0 \u05E0\u05D9\u05EA\u05E0\u05EA \u05DC\u05D1\u05D9\u05D8\u05D5\u05DC. \u05D4\u05E7\u05DC\u05D3 "DELETE" \u05DC\u05D0\u05D9\u05E9\u05D5\u05E8.'
                      : 'This cannot be undone. Type "DELETE" to confirm.'}
                  </p>
                </div>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="input"
                  placeholder="DELETE"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== 'DELETE' || deletingAccount}
                    className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-all flex items-center gap-2"
                  >
                    {deletingAccount ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                    {t('settings.account.delete_account')}
                  </button>
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                    className="px-6 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                  >
                    {language === 'he' ? 'ביטול' : 'Cancel'}
                  </button>
                </div>
              </motion.div>
            )}
          </motion.section>
        </div>
      </div>
    </div>
  );
}
