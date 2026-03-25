import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Helper to format retry time for user-friendly messages
 */
const formatRetryTime = (ms: number): string => {
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours > 1 ? 's' : ''}`;
};

/**
 * Custom key generator that uses user ID when authenticated, falls back to IP
 * This ensures rate limits are per-user for authenticated endpoints
 */
const userKeyGenerator = (req: Request): string => {
  // AuthRequest has user.id when authenticated
  const user = (req as any).user;
  if (user && user.id) {
    return `user:${user.id}`;
  }
  // Fallback to IP for unauthenticated requests
  return req.ip || req.socket.remoteAddress || 'unknown';
};

/**
 * Section 17.2: Rate limiting (100 req/min)
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '200'), // 200 requests per minute
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 failed requests per 15 minutes
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for AI-related endpoints
 * More restrictive to prevent abuse
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    success: false,
    error: 'AI request limit exceeded, please wait before trying again',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Payment Rate Limiters
 * These are more restrictive to prevent abuse and fraud
 */

/**
 * Payment attempt rate limiter
 * Max 10 payment attempts per user per hour
 * Applies to: create-order, capture endpoints
 */
export const paymentAttemptLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 payment attempts per hour
  keyGenerator: userKeyGenerator,
  handler: (req: Request, res: Response) => {
    const retryAfter = res.getHeader('Retry-After');
    const retryMs = retryAfter ? Number(retryAfter) * 1000 : 60 * 60 * 1000;
    res.status(429).json({
      success: false,
      error: 'Too many payment attempts. Please try again later.',
      retryAfter: formatRetryTime(retryMs),
      retryAfterSeconds: Math.ceil(retryMs / 1000),
    });
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,
});

/**
 * Payout request rate limiter
 * Max 3 payout requests per user per day
 * Applies to: request-payout endpoint
 */
export const payoutRequestLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // 3 payout requests per day
  keyGenerator: userKeyGenerator,
  handler: (req: Request, res: Response) => {
    const retryAfter = res.getHeader('Retry-After');
    const retryMs = retryAfter ? Number(retryAfter) * 1000 : 24 * 60 * 60 * 1000;
    res.status(429).json({
      success: false,
      error: 'Maximum payout requests reached for today. Please try again tomorrow.',
      retryAfter: formatRetryTime(retryMs),
      retryAfterSeconds: Math.ceil(retryMs / 1000),
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Subscription change rate limiter
 * Max 5 subscription changes per user per day
 * Applies to: upgrade, cancel endpoints
 */
export const subscriptionChangeLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // 5 subscription changes per day
  keyGenerator: userKeyGenerator,
  handler: (req: Request, res: Response) => {
    const retryAfter = res.getHeader('Retry-After');
    const retryMs = retryAfter ? Number(retryAfter) * 1000 : 24 * 60 * 60 * 1000;
    res.status(429).json({
      success: false,
      error: 'Too many subscription changes. Please try again later.',
      retryAfter: formatRetryTime(retryMs),
      retryAfterSeconds: Math.ceil(retryMs / 1000),
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});
