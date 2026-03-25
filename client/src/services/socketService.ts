/**
 * Socket.IO Client Service
 * Manages WebSocket connection for real-time notifications
 *
 * NOTE: Requires socket.io-client package. Run `npm install socket.io-client` if not installed.
 */

// @ts-ignore - socket.io-client may need to be installed
import { io, Socket } from 'socket.io-client';

// Socket instance
let socket: Socket | null = null;

// Connection state
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Get the API URL from environment
const getSocketURL = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  // Remove /api suffix if present for socket connection
  return apiUrl.replace(/\/api$/, '');
};

/**
 * Initialize socket connection with JWT token
 */
export function initializeSocket(token: string): Socket {
  // If already connected with same credentials, return existing socket
  if (socket?.connected) {
    return socket;
  }

  // Disconnect existing socket if any
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  isConnecting = true;
  reconnectAttempts = 0;

  const socketUrl = getSocketURL();
  console.log('[Socket] Connecting to:', socketUrl);

  socket = io(socketUrl, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  // Connection events
  socket.on('connect', () => {
    console.log('[Socket] Connected successfully');
    isConnecting = false;
    reconnectAttempts = 0;
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error.message);
    isConnecting = false;
    reconnectAttempts++;

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.warn('[Socket] Max reconnection attempts reached');
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);

    // If server disconnected us, try to reconnect
    if (reason === 'io server disconnect') {
      socket?.connect();
    }
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
    reconnectAttempts = 0;
  });

  socket.on('reconnect_failed', () => {
    console.error('[Socket] Reconnection failed');
  });

  // Health check
  socket.on('pong', () => {
    // Connection is healthy
  });

  return socket;
}

/**
 * Get current socket instance
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Check if socket is connected
 */
export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}

/**
 * Disconnect socket
 */
export function disconnectSocket(): void {
  if (socket) {
    console.log('[Socket] Disconnecting...');
    socket.disconnect();
    socket = null;
    isConnecting = false;
    reconnectAttempts = 0;
  }
}

/**
 * Send ping to server to check connection health
 */
export function ping(): void {
  if (socket?.connected) {
    socket.emit('ping');
  }
}

// Event listener types
export type NotificationEventData = {
  _id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
  sender?: {
    _id: string;
    name: string;
    profilePicture?: string;
  } | null;
};

export type UnreadCountUpdateData = {
  unreadCount: number;
};

export type NewMessageData = {
  conversationId: string;
  message: {
    _id: string;
    content: string;
    sender: {
      _id: string;
      name: string;
      profilePicture?: string;
    };
    createdAt: string;
  };
};

/**
 * Subscribe to notification events
 */
export function onNotification(callback: (data: NotificationEventData) => void): () => void {
  if (!socket) {
    console.warn('[Socket] Cannot subscribe: socket not initialized');
    return () => {};
  }

  socket.on('notification', callback);
  return () => {
    socket?.off('notification', callback);
  };
}

/**
 * Subscribe to unread count updates
 */
export function onUnreadCountUpdate(callback: (data: UnreadCountUpdateData) => void): () => void {
  if (!socket) {
    console.warn('[Socket] Cannot subscribe: socket not initialized');
    return () => {};
  }

  socket.on('unread_count_update', callback);
  return () => {
    socket?.off('unread_count_update', callback);
  };
}

/**
 * Subscribe to new message events
 */
export function onNewMessage(callback: (data: NewMessageData) => void): () => void {
  if (!socket) {
    console.warn('[Socket] Cannot subscribe: socket not initialized');
    return () => {};
  }

  socket.on('new_message', callback);
  return () => {
    socket?.off('new_message', callback);
  };
}
