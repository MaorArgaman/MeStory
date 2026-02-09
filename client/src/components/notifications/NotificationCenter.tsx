/**
 * Notification Center Component
 * Shows all user notifications with filters
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Bell,
  Heart,
  MessageCircle,
  Share2,
  CreditCard,
  Crown,
  BookOpen,
  Star,
  TrendingUp,
  Check,
  CheckCheck,
  Trash2,
  Archive,
  Loader2,
  Filter,
  User,
} from 'lucide-react';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  archiveNotification,
  Notification,
  NotificationType,
} from '../../services/notificationApi';
import toast from 'react-hot-toast';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  onUnreadCountChange,
}) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, filter, showUnreadOnly]);

  const loadNotifications = async (loadMore = false) => {
    setLoading(true);
    try {
      const currentPage = loadMore ? page + 1 : 1;
      const response = await getNotifications(currentPage, 20, {
        type: filter === 'all' ? undefined : filter,
        unreadOnly: showUnreadOnly,
      });

      if (loadMore) {
        setNotifications((prev) => [...prev, ...response.notifications]);
      } else {
        setNotifications(response.notifications);
      }

      setUnreadCount(response.unreadCount);
      onUnreadCountChange?.(response.unreadCount);
      setPage(currentPage);
      setHasMore(currentPage < response.pagination.pages);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.isRead) return;

    try {
      await markAsRead(notification._id);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notification._id ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      onUnreadCountChange?.(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAllRead(true);
    try {
      await markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
      onUnreadCountChange?.(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark notifications');
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      const deleted = notifications.find((n) => n._id === notificationId);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      if (deleted && !deleted.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
        onUnreadCountChange?.(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleArchive = async (notificationId: string) => {
    try {
      await archiveNotification(notificationId);
      const archived = notifications.find((n) => n._id === notificationId);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      if (archived && !archived.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
        onUnreadCountChange?.(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      toast.error('Failed to archive notification');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    handleMarkAsRead(notification);

    // Navigate based on notification type and data
    if (notification.data?.link) {
      onClose();
      navigate(notification.data.link);
    } else if (notification.data?.bookId) {
      onClose();
      navigate(`/reader/${notification.data.bookId}`);
    } else if (notification.data?.conversationId) {
      onClose();
      // Open messages modal or navigate
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-pink-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'share':
        return <Share2 className="w-5 h-5 text-green-500" />;
      case 'purchase':
        return <CreditCard className="w-5 h-5 text-emerald-500" />;
      case 'new_message':
        return <MessageCircle className="w-5 h-5 text-purple-500" />;
      case 'payment':
        return <CreditCard className="w-5 h-5 text-green-600" />;
      case 'subscription':
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 'book_published':
        return <BookOpen className="w-5 h-5 text-indigo-500" />;
      case 'quality_score':
        return <Star className="w-5 h-5 text-yellow-400" />;
      case 'promotion':
        return <TrendingUp className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  const filterOptions: { value: NotificationType | 'all'; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'All', icon: <Bell className="w-4 h-4" /> },
    { value: 'like', label: 'Likes', icon: <Heart className="w-4 h-4" /> },
    { value: 'comment', label: 'Comments', icon: <MessageCircle className="w-4 h-4" /> },
    { value: 'share', label: 'Shares', icon: <Share2 className="w-4 h-4" /> },
    { value: 'purchase', label: 'Purchases', icon: <CreditCard className="w-4 h-4" /> },
    { value: 'payment', label: 'Payments', icon: <CreditCard className="w-4 h-4" /> },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl w-full max-w-lg h-[700px] max-h-[90vh] flex flex-col shadow-2xl border border-purple-500/20 overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 bg-black/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bell className="w-6 h-6 text-purple-400" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-500 text-white text-[10px] flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-white">Notifications</h2>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={markingAllRead}
                    className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    title="Mark all as read"
                  >
                    {markingAllRead ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCheck className="w-5 h-5" />
                    )}
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                    filter === option.value
                      ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>

            {/* Unread toggle */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                  showUnreadOnly
                    ? 'bg-pink-500/20 text-pink-300'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Filter className="w-4 h-4" />
                Unread only
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-purple-400" />
                </div>
                <h4 className="text-lg font-medium text-white mb-2">No notifications</h4>
                <p className="text-gray-400 text-sm">
                  {showUnreadOnly
                    ? 'No unread notifications'
                    : 'Your notifications will appear here'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map((notification) => (
                  <motion.div
                    key={notification._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 hover:bg-white/5 cursor-pointer transition-colors relative group ${
                      !notification.isRead ? 'bg-purple-500/5' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                        {notification.sender?.profilePicture ? (
                          <img
                            src={notification.sender.profilePicture}
                            alt={notification.sender.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getNotificationIcon(notification.type)
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            className={`font-medium truncate ${
                              notification.isRead ? 'text-gray-300' : 'text-white'
                            }`}
                          >
                            {notification.title}
                          </h4>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>

                        <p
                          className={`text-sm mt-1 line-clamp-2 ${
                            notification.isRead ? 'text-gray-500' : 'text-gray-400'
                          }`}
                        >
                          {notification.message}
                        </p>

                        {/* Unread indicator */}
                        {!notification.isRead && (
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-purple-500" />
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification);
                            }}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchive(notification._id);
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                          title="Archive"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification._id);
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Load More */}
                {hasMore && (
                  <div className="p-4 text-center">
                    <button
                      onClick={() => loadNotifications(true)}
                      disabled={loading}
                      className="px-4 py-2 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 transition-colors disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                      ) : (
                        'Load more'
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationCenter;
