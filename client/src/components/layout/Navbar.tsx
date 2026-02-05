import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Sparkles, BookOpen, User, LogOut, ChevronDown, Crown, MessageCircle, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logoIcon from '../../assets/images/logo-icon.png';
import { getUnreadCount as getMessagesUnreadCount } from '../../services/messagingApi';
import { getUnreadCount as getNotificationsUnreadCount } from '../../services/notificationApi';
import ConversationsList from '../messaging/ConversationsList';
import NotificationCenter from '../notifications/NotificationCenter';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [messagesUnreadCount, setMessagesUnreadCount] = useState(0);
  const [notificationsUnreadCount, setNotificationsUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

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
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl"
    >
      <div className="glass-strong rounded-2xl border border-white/10 shadow-2xl shadow-black/50 backdrop-blur-2xl">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="relative"
              >
                <img
                  src={logoIcon}
                  alt="MeStory Logo"
                  className="h-10 w-10 object-contain drop-shadow-[0_0_15px_rgba(255,215,0,0.6)]"
                />
              </motion.div>
              <span className="text-3xl font-bold gradient-gold" style={{ fontFamily: "'Cinzel', serif" }}>
                MeStory
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 ${
                  isActive('/dashboard')
                    ? 'bg-gradient-to-r from-magic-gold/20 to-yellow-500/20 text-magic-gold border border-magic-gold/30 shadow-glow-gold'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <BookOpen className="w-5 h-5" />
                <span className="font-semibold">My Books</span>
              </Link>

              <Link
                to="/marketplace"
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 ${
                  isActive('/marketplace')
                    ? 'bg-gradient-to-r from-magic-gold/20 to-yellow-500/20 text-magic-gold border border-magic-gold/30 shadow-glow-gold'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Sparkles className="w-5 h-5" />
                <span className="font-semibold">Marketplace</span>
              </Link>

              {/* Notifications Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotifications(true)}
                className="relative p-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300"
                title="התראות"
              >
                <Bell className="w-5 h-5" />
                {notificationsUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-magic-gold to-yellow-500 text-deep-space text-xs flex items-center justify-center font-bold">
                    {notificationsUnreadCount > 9 ? '9+' : notificationsUnreadCount}
                  </span>
                )}
              </motion.button>

              {/* Messages Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMessages(true)}
                className="relative p-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300"
                title="הודעות"
              >
                <MessageCircle className="w-5 h-5" />
                {messagesUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs flex items-center justify-center font-bold">
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
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-200 hover:text-white hover:bg-white/5 transition-all duration-300"
                >
                  {/* Avatar with Gold Glow */}
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-magic-gold to-yellow-600 flex items-center justify-center shadow-glow-gold ring-2 ring-magic-gold/30">
                      <User className="w-6 h-6 text-deep-space" />
                    </div>
                    {/* Premium Badge */}
                    {user?.role === 'premium' && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center border-2 border-deep-space">
                        <Crown className="w-3 h-3 text-deep-space" />
                      </div>
                    )}
                  </div>
                  <span className="font-semibold">{user?.name}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-300 ${
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
                        <p className="text-xs text-gray-400 mb-1">Signed in as</p>
                        <p className="text-white font-semibold truncate mb-3">{user?.email}</p>
                        <div className="flex items-center gap-2">
                          <div
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                              user?.role === 'premium'
                                ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-magic-gold border border-magic-gold/30'
                                : user?.role === 'standard'
                                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                            }`}
                          >
                            {user?.role === 'premium' && <Crown className="w-3 h-3 inline mr-1" />}
                            {user?.role?.toUpperCase()}
                          </div>
                          <div className="text-xs text-gray-300 font-medium">
                            <span className="text-magic-gold font-bold">{user?.credits}</span> credits
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <Link
                          to="/subscription"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-5 py-3 text-gray-300 hover:text-magic-gold hover:bg-magic-gold/10 transition-all duration-300"
                        >
                          <Crown className="w-4 h-4" />
                          <span className="font-medium">Upgrade Plan</span>
                        </Link>

                        <Link
                          to="/settings"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-5 py-3 text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300"
                        >
                          <User className="w-4 h-4" />
                          <span className="font-medium">Settings</span>
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-5 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="font-medium">Logout</span>
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

      {/* Ambient Glow Effect */}
      <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-magic-gold/10 blur-3xl -z-10 opacity-50" />

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
