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

    // ===== COLLABORATION PRESENCE (BUG-006) =====
    // Client joins a book room when opening the editor. We broadcast
    // presence + chapter-focus events to everyone else in that room.
    //
    // Authorization is NOT checked here — the server already rejects
    // writes from non-collaborators in bookController. Presence events
    // are low-trust (just avatars), so we accept any join and let the
    // REST layer be the source of truth for permissions.

    socket.on('book:join', (payload: { bookId?: string } = {}) => {
      const { bookId } = payload;
      if (!bookId || typeof bookId !== 'string') return;

      const room = `book:${bookId}`;
      socket.join(room);
      // Announce to other sockets in the room
      socket.to(room).emit('book:user-joined', {
        bookId,
        userId: user.id,
        name: (user as any).name,
        at: new Date().toISOString(),
      });
      // Send the joiner a list of who else is already here
      const room_sockets = io?.sockets.adapter.rooms.get(room);
      const others: Array<{ userId: string; socketId: string }> = [];
      if (room_sockets && io) {
        for (const sid of room_sockets) {
          if (sid === socket.id) continue;
          const s = io.sockets.sockets.get(sid);
          const uid = (s?.data?.user as JWTPayload | undefined)?.id;
          if (uid) others.push({ userId: uid, socketId: sid });
        }
      }
      socket.emit('book:presence', { bookId, others });
    });

    socket.on('book:leave', (payload: { bookId?: string } = {}) => {
      const { bookId } = payload;
      if (!bookId || typeof bookId !== 'string') return;
      const room = `book:${bookId}`;
      socket.leave(room);
      socket.to(room).emit('book:user-left', { bookId, userId: user.id });
    });

    socket.on('book:editing-chapter', (payload: { bookId?: string; chapterIndex?: number } = {}) => {
      const { bookId, chapterIndex } = payload;
      if (!bookId || typeof bookId !== 'string') return;
      socket.to(`book:${bookId}`).emit('book:user-editing', {
        bookId,
        chapterIndex,
        userId: user.id,
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`[Socket] User ${user.id} disconnected (socket: ${socket.id}, reason: ${reason})`);

      // Broadcast user-left to any book rooms this socket was in
      for (const room of socket.rooms) {
        if (room.startsWith('book:')) {
          const bookId = room.slice('book:'.length);
          socket.to(room).emit('book:user-left', { bookId, userId: user.id });
        }
      }

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

/**
 * Emit a collaboration-scoped event to everyone currently viewing a book.
 * Used for presence + live update broadcasts.
 */
export function emitToBookRoom(bookId: string, event: string, data: any): void {
  if (!io || !bookId) return;
  io.to(`book:${bookId}`).emit(event, data);
}

/**
 * Notify a specific user that they've been removed from a book (BUG-007).
 * The client should close any open editor for that book and show a toast.
 */
export function notifyCollaboratorRemoved(userId: string, bookId: string, bookTitle?: string): void {
  if (!io) return;
  io.to(`user:${userId}`).emit('collaboration:removed', {
    bookId,
    bookTitle,
    at: new Date().toISOString(),
  });
}

/**
 * Notify all collaborators that a book was deleted (BUG-011).
 * Everyone in the book room gets a toast + forced close.
 */
export function notifyBookDeleted(bookId: string, bookTitle?: string): void {
  if (!io) return;
  io.to(`book:${bookId}`).emit('collaboration:book-deleted', {
    bookId,
    bookTitle,
    at: new Date().toISOString(),
  });
}
