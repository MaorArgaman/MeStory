import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { BookOpen, User, LogOut, ChevronDown, Crown, MessageCircle, Bell, Store, Library, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUnreadCount as getMessagesUnreadCount } from '../../services/messagingApi';
import { getUnreadCount as getNotificationsUnreadCount } from '../../services/notificationApi';
import ConversationsList from '../messaging/ConversationsList';
import NotificationCenter from '../notifications/NotificationCenter';
import logoIcon from '../../assets/images/logo-icon.png';

export default function Navbar() {
  const { t } = useTranslation('common');
  const { user, logout } = useAuth();
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [messagesUnreadCount, setMessagesUnreadCount] = useState(0);
  const [notificationsUnreadCount, setNotificationsUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Fetch unread message and notification counts
  useEffect(() => {
    const fetchUnreadCounts = async () => {
      try {
        const [messagesCount, notificationsCount] = await Promise.all([
          getMessagesUnreadCount(),
          getNotificationsUnreadCount(),
        ]);
        setMessagesUnreadCount(messagesCount);
        setNotificationsUnreadCount(notificationsCount);
      } catch (error) {
        // Silently ignore errors
      }
    };

    if (user) {
      fetchUnreadCounts();
      // Refresh every 30 seconds
      const interval = setInterval(fetchUnreadCounts, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setShowMobileMenu(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 w-full"
      ref={mobileMenuRef}
    >
      <div className="glass-strong border-b border-white/10 shadow-lg shadow-black/30 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo - Left Side */}
            <Link to="/dashboard" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="h-8 sm:h-10 lg:h-12 flex items-center gap-2 sm:gap-3"
              >
                <img
                  src={logoIcon}
                  alt="MeStory"
                  className="h-8 sm:h-10 lg:h-12 w-auto object-contain drop-shadow-lg"
                />
                <span className="text-lg sm:text-xl lg:text-2xl font-bold gradient-gold hidden sm:block" style={{ fontFamily: "'Cinzel', serif" }}>
                  MeStory
                </span>
              </motion.div>
            </Link>

            {/* Navigation Links - Centered (Hidden on mobile) */}
            <div className="hidden lg:flex items-center gap-2">
              <Link
                to="/dashboard"
                className={`flex items-center gap-2 px-4 xl:px-5 py-2 xl:py-2.5 rounded-xl transition-all duration-300 ${
                  isActive('/dashboard')
                    ? 'bg-gradient-to-r from-magic-gold/20 to-yellow-500/20 text-magic-gold border border-magic-gold/30 shadow-glow-gold'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <BookOpen className="w-4 h-4 xl:w-5 xl:h-5" />
                <span className="font-semibold text-sm xl:text-base">{t('nav.my_books')}</span>
              </Link>

              <Link
                to="/marketplace"
                className={`flex items-center gap-2 px-4 xl:px-5 py-2 xl:py-2.5 rounded-xl transition-all duration-300 ${
                  isActive('/marketplace')
                    ? 'bg-gradient-to-r from-magic-gold/20 to-yellow-500/20 text-magic-gold border border-magic-gold/30 shadow-glow-gold'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Store className="w-4 h-4 xl:w-5 xl:h-5" />
                <span className="font-semibold text-sm xl:text-base">{t('nav.marketplace')}</span>
              </Link>

              <Link
                to="/library"
                className={`flex items-center gap-2 px-4 xl:px-5 py-2 xl:py-2.5 rounded-xl transition-all duration-300 ${
                  isActive('/library')
                    ? 'bg-gradient-to-r from-magic-gold/20 to-yellow-500/20 text-magic-gold border border-magic-gold/30 shadow-glow-gold'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Library className="w-4 h-4 xl:w-5 xl:h-5" />
                <span className="font-semibold text-sm xl:text-base">{t('nav.library', 'My Library')}</span>
              </Link>
            </div>

            {/* Right Side - Notifications, Messages, User */}
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 flex-shrink-0">
              {/* Mobile Menu Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300"
              >
                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </motion.button>
              {/* Notifications Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotifications(true)}
                className="relative p-2 sm:p-2.5 rounded-lg sm:rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300"
                title={t('nav.notifications')}
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {notificationsUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-r from-magic-gold to-yellow-500 text-deep-space text-[10px] sm:text-xs flex items-center justify-center font-bold">
                    {notificationsUnreadCount > 9 ? '9+' : notificationsUnreadCount}
                  </span>
                )}
              </motion.button>

              {/* Messages Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMessages(true)}
                className="relative p-2 sm:p-2.5 rounded-lg sm:rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300"
                title={t('nav.messages')}
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                {messagesUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[10px] sm:text-xs flex items-center justify-center font-bold">
                    {messagesUnreadCount > 9 ? '9+' : messagesUnreadCount}
                  </span>
                )}
              </motion.button>

              {/* User Dropdown */}
              <div className="relative" ref={menuRef}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1 sm:gap-2 lg:gap-3 px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-gray-200 hover:text-white hover:bg-white/5 transition-all duration-300"
                >
                  {/* Avatar with Gold Glow */}
                  <div className="relative">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-magic-gold to-yellow-600 flex items-center justify-center shadow-glow-gold ring-2 ring-magic-gold/30">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-deep-space" />
                    </div>
                    {/* Premium Badge */}
                    {user?.role === 'premium' && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center border-2 border-deep-space">
                        <Crown className="w-2 h-2 sm:w-3 sm:h-3 text-deep-space" />
                      </div>
                    )}
                  </div>
                  <span className="font-semibold hidden sm:block text-sm lg:text-base max-w-[80px] lg:max-w-none truncate">{user?.name}</span>
                  <ChevronDown
                    className={`w-3 h-3 sm:w-4 sm:h-4 hidden sm:block transition-transform duration-300 ${
                      showUserMenu ? 'rotate-180' : ''
                    }`}
                  />
                </motion.button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-3 w-72 glass-strong rounded-xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden"
                    >
                      {/* User Info */}
                      <div className="px-5 py-4 border-b border-white/10 bg-gradient-to-br from-white/5 to-transparent">
                        <p className="text-xs text-gray-400 mb-1">{t('user.signed_in_as')}</p>
                        <p className="text-white font-semibold truncate mb-3">{user?.email}</p>
                        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                              user?.role === 'premium'
                                ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-magic-gold border border-magic-gold/30'
                                : user?.role === 'standard'
                                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                            }`}
                          >
                            {user?.role === 'premium' && <Crown className={`w-3 h-3 inline ${isRTL ? 'ml-1' : 'mr-1'}`} />}
                            {t(`user.${user?.role || 'free'}`)}
                          </div>
                          <div className="text-xs text-gray-300 font-medium">
                            <span className="text-magic-gold font-bold">{user?.credits}</span> {t('user.credits')}
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <Link
                          to="/subscription"
                          onClick={() => setShowUserMenu(false)}
                          className={`flex items-center gap-3 px-5 py-3 text-gray-300 hover:text-magic-gold hover:bg-magic-gold/10 transition-all duration-300 ${isRTL ? 'flex-row-reverse' : ''}`}
                        >
                          <Crown className="w-4 h-4" />
                          <span className="font-medium">{t('nav.upgrade')}</span>
                        </Link>

                        <Link
                          to="/settings"
                          onClick={() => setShowUserMenu(false)}
                          className={`flex items-center gap-3 px-5 py-3 text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300 ${isRTL ? 'flex-row-reverse' : ''}`}
                        >
                          <User className="w-4 h-4" />
                          <span className="font-medium">{t('nav.settings')}</span>
                        </Link>

                        <button
                          onClick={handleLogout}
                          className={`w-full flex items-center gap-3 px-5 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300 ${isRTL ? 'flex-row-reverse' : ''}`}
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="font-medium">{t('nav.logout')}</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden glass-strong border-b border-white/10 shadow-lg overflow-hidden"
          >
            <div className="p-3 space-y-1">
              <Link
                to="/dashboard"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  isActive('/dashboard')
                    ? 'bg-gradient-to-r from-magic-gold/20 to-yellow-500/20 text-magic-gold border border-magic-gold/30'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <BookOpen className="w-5 h-5" />
                <span className="font-semibold">{t('nav.my_books')}</span>
              </Link>

              <Link
                to="/marketplace"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  isActive('/marketplace')
                    ? 'bg-gradient-to-r from-magic-gold/20 to-yellow-500/20 text-magic-gold border border-magic-gold/30'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Store className="w-5 h-5" />
                <span className="font-semibold">{t('nav.marketplace')}</span>
              </Link>

              <Link
                to="/library"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  isActive('/library')
                    ? 'bg-gradient-to-r from-magic-gold/20 to-yellow-500/20 text-magic-gold border border-magic-gold/30'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Library className="w-5 h-5" />
                <span className="font-semibold">{t('nav.library', 'My Library')}</span>
              </Link>

              <div className="border-t border-white/10 my-2" />

              <Link
                to="/subscription"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  isActive('/subscription')
                    ? 'bg-gradient-to-r from-magic-gold/20 to-yellow-500/20 text-magic-gold border border-magic-gold/30'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Crown className="w-5 h-5" />
                <span className="font-semibold">{t('nav.upgrade')}</span>
              </Link>

              <Link
                to="/settings"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  isActive('/settings')
                    ? 'bg-gradient-to-r from-magic-gold/20 to-yellow-500/20 text-magic-gold border border-magic-gold/30'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <User className="w-5 h-5" />
                <span className="font-semibold">{t('nav.settings')}</span>
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-semibold">{t('nav.logout')}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Modal */}
      <ConversationsList
        isOpen={showMessages}
        onClose={() => {
          setShowMessages(false);
          // Refresh unread count when closing
          getMessagesUnreadCount().then(setMessagesUnreadCount).catch(() => {});
        }}
      />

      {/* Notifications Modal */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => {
          setShowNotifications(false);
          // Refresh unread count when closing
          getNotificationsUnreadCount().then(setNotificationsUnreadCount).catch(() => {});
        }}
      />
    </motion.nav>
  );
}
