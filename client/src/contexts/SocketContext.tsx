/**
 * Socket Context
 * Provides app-wide socket connection management and real-time notifications
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import {
  initializeSocket,
  disconnectSocket,
  isSocketConnected,
  onNotification,
  onUnreadCountUpdate,
  onNewMessage,
  NotificationEventData,
  NewMessageData,
} from '../services/socketService';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface SocketContextType {
  isConnected: boolean;
  notificationsUnreadCount: number;
  messagesUnreadCount: number;
  setNotificationsUnreadCount: (count: number) => void;
  setMessagesUnreadCount: (count: number) => void;
  lastNotification: NotificationEventData | null;
  lastMessage: NewMessageData | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [notificationsUnreadCount, setNotificationsUnreadCount] = useState(0);
  const [messagesUnreadCount, setMessagesUnreadCount] = useState(0);
  const [lastNotification, setLastNotification] = useState<NotificationEventData | null>(null);
  const [lastMessage, setLastMessage] = useState<NewMessageData | null>(null);

  // Handle notification event
  const handleNotification = useCallback((notification: NotificationEventData) => {
    console.log('[SocketContext] Received notification:', notification);
    setLastNotification(notification);

    // Show toast for new notification
    toast(notification.title, {
      icon: getNotificationIcon(notification.type),
      duration: 4000,
      style: {
        background: 'rgba(17, 17, 35, 0.95)',
        color: '#fff',
        border: '1px solid rgba(168, 85, 247, 0.3)',
      },
    });
  }, []);

  // Handle unread count update
  const handleUnreadCountUpdate = useCallback((data: { unreadCount: number }) => {
    console.log('[SocketContext] Unread count update:', data.unreadCount);
    setNotificationsUnreadCount(data.unreadCount);
  }, []);

  // Handle new message
  const handleNewMessage = useCallback((data: NewMessageData) => {
    console.log('[SocketContext] New message:', data);
    setLastMessage(data);
    setMessagesUnreadCount(prev => prev + 1);

    // Show toast for new message
    toast(`New message from ${data.message.sender.name}`, {
      icon: '💬',
      duration: 4000,
      style: {
        background: 'rgba(17, 17, 35, 0.95)',
        color: '#fff',
        border: '1px solid rgba(168, 85, 247, 0.3)',
      },
    });
  }, []);

  // Initialize socket when user logs in
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (user && token) {
      console.log('[SocketContext] User logged in, initializing socket');
      const socket = initializeSocket(token);

      // Update connection state
      const handleConnect = () => setIsConnected(true);
      const handleDisconnect = () => setIsConnected(false);

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);

      // Set initial connection state
      setIsConnected(isSocketConnected());

      // Subscribe to events
      const unsubNotification = onNotification(handleNotification);
      const unsubUnreadCount = onUnreadCountUpdate(handleUnreadCountUpdate);
      const unsubNewMessage = onNewMessage(handleNewMessage);

      // Cleanup on unmount or user change
      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        unsubNotification();
        unsubUnreadCount();
        unsubNewMessage();
      };
    } else {
      // User logged out, disconnect socket
      console.log('[SocketContext] User logged out, disconnecting socket');
      disconnectSocket();
      setIsConnected(false);
      setNotificationsUnreadCount(0);
      setMessagesUnreadCount(0);
      setLastNotification(null);
      setLastMessage(null);
    }
  }, [user, handleNotification, handleUnreadCountUpdate, handleNewMessage]);

  // Disconnect on component unmount
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  const value: SocketContextType = {
    isConnected,
    notificationsUnreadCount,
    messagesUnreadCount,
    setNotificationsUnreadCount,
    setMessagesUnreadCount,
    lastNotification,
    lastMessage,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// Helper function to get notification icon
function getNotificationIcon(type: string): string {
  switch (type) {
    case 'like':
      return '❤️';
    case 'comment':
      return '💬';
    case 'share':
      return '🔗';
    case 'purchase':
      return '💰';
    case 'new_message':
      return '✉️';
    case 'payment':
      return '💳';
    case 'subscription':
      return '👑';
    case 'book_published':
      return '📚';
    case 'quality_score':
      return '⭐';
    case 'promotion':
      return '🚀';
    default:
      return '🔔';
  }
}

// Hook to use socket context
export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
