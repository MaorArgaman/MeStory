/**
 * Socket.io Service
 * Manages WebSocket connections for real-time notifications
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken, JWTPayload } from '../utils/jwt';

// Store the Socket.IO server instance
let io: SocketIOServer | null = null;

// Map of userId to socket IDs (a user can have multiple connections from different devices)
const userSockets: Map<string, Set<string>> = new Map();

/**
 * Initialize Socket.IO with HTTP server
 */
export function initializeSocketIO(httpServer: HTTPServer, allowedOrigins: string[]): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) {
          return callback(null, true);
        }

        // Check if origin matches Vercel preview/production domains
        if (origin.endsWith('.vercel.app') || origin.endsWith('.vercel.sh')) {
          return callback(null, true);
        }

        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        // Allow in development
        if (process.env.NODE_ENV !== 'production') {
          return callback(null, true);
        }

        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = verifyToken(token);
      // Attach user data to socket
      socket.data.user = decoded;
      next();
    } catch (error) {
      next(new Error('Invalid or expired token'));
    }
  });

  // Handle connections
  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as JWTPayload;

    if (!user || !user.id) {
      socket.disconnect(true);
      return;
    }

    console.log(`[Socket] User ${user.id} connected (socket: ${socket.id})`);

    // Join user to their personal room
    socket.join(`user:${user.id}`);

    // Track user's socket connections
    if (!userSockets.has(user.id)) {
      userSockets.set(user.id, new Set());
    }
    userSockets.get(user.id)!.add(socket.id);

    // Handle ping (for connection health check)
    socket.on('ping', () => {
      socket.emit('pong');
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`[Socket] User ${user.id} disconnected (socket: ${socket.id}, reason: ${reason})`);

      // Remove socket from user's connections
      const sockets = userSockets.get(user.id);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(user.id);
        }
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`[Socket] Error for user ${user.id}:`, error);
    });
  });

  console.log('[Socket] Socket.IO server initialized');
  return io;
}

/**
 * Get the Socket.IO server instance
 */
export function getIO(): SocketIOServer | null {
  return io;
}

/**
 * Check if a user is currently connected
 */
export function isUserOnline(userId: string): boolean {
  return userSockets.has(userId) && userSockets.get(userId)!.size > 0;
}

/**
 * Get count of online users
 */
export function getOnlineUsersCount(): number {
  return userSockets.size;
}

/**
 * Send notification to a specific user
 */
export function sendNotificationToUser(userId: string, notification: any): void {
  if (!io) {
    console.warn('[Socket] Socket.IO not initialized, cannot send notification');
    return;
  }

  io.to(`user:${userId}`).emit('notification', notification);
  console.log(`[Socket] Sent notification to user ${userId}`);
}

/**
 * Send notification to multiple users
 */
export function sendNotificationToUsers(userIds: string[], notification: any): void {
  if (!io) {
    console.warn('[Socket] Socket.IO not initialized, cannot send notifications');
    return;
  }

  userIds.forEach((userId) => {
    io!.to(`user:${userId}`).emit('notification', notification);
  });
  console.log(`[Socket] Sent notification to ${userIds.length} users`);
}

/**
 * Emit unread count update to a user
 */
export function emitUnreadCountUpdate(userId: string, unreadCount: number): void {
  if (!io) {
    return;
  }

  io.to(`user:${userId}`).emit('unread_count_update', { unreadCount });
}

/**
 * Emit message notification to a user
 */
export function sendMessageNotification(userId: string, message: any): void {
  if (!io) {
    return;
  }

  io.to(`user:${userId}`).emit('new_message', message);
}

/**
 * Broadcast event to all connected users (admin use)
 */
export function broadcastToAll(event: string, data: any): void {
  if (!io) {
    return;
  }

  io.emit(event, data);
}
