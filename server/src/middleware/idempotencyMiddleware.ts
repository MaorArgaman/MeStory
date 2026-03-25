/**
 * Idempotency Middleware
 * Prevents duplicate payment operations by caching responses based on idempotency keys.
 *
 * Usage:
 * - Client sends X-Idempotency-Key header with a unique UUID for each payment request
 * - If the same key is sent again within TTL, the cached response is returned
 * - Prevents duplicate charges if client retries due to network issues
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';

// In-memory cache for idempotency keys
// Key format: idempotency:{userId}:{key}
interface CachedResponse {
  statusCode: number;
  body: any;
  createdAt: number;
}

const idempotencyCache = new Map<string, CachedResponse>();

// TTL: 24 hours in milliseconds
const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000;

// Cleanup interval: every hour
const CLEANUP_INTERVAL = 60 * 60 * 1000;

// Periodic cleanup of expired entries
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;

  // Use Array.from to avoid downlevelIteration requirement
  const entries = Array.from(idempotencyCache.entries());
  for (let i = 0; i < entries.length; i++) {
    const [key, value] = entries[i];
    if (now - value.createdAt > IDEMPOTENCY_TTL) {
      idempotencyCache.delete(key);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`[Idempotency] Cleaned up ${cleanedCount} expired entries`);
  }
}, CLEANUP_INTERVAL);

/**
 * Generate idempotency cache key
 */
function getCacheKey(userId: string, idempotencyKey: string): string {
  return `idempotency:${userId}:${idempotencyKey}`;
}

/**
 * Validate idempotency key format (UUID v4)
 */
function isValidIdempotencyKey(key: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(key);
}

/**
 * Idempotency middleware factory
 * @param options Configuration options
 * @returns Express middleware function
 */
export interface IdempotencyOptions {
  required?: boolean;  // Whether idempotency key is required (default: false)
  headerName?: string; // Custom header name (default: X-Idempotency-Key)
}

export function idempotencyMiddleware(options: IdempotencyOptions = {}) {
  const { required = false, headerName = 'X-Idempotency-Key' } = options;

  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    // Get idempotency key from header
    const idempotencyKey = req.headers[headerName.toLowerCase()] as string | undefined;

    // If no key provided
    if (!idempotencyKey) {
      if (required) {
        res.status(400).json({
          success: false,
          error: `Missing required header: ${headerName}`,
          code: 'MISSING_IDEMPOTENCY_KEY',
        });
        return;
      }
      // Not required, proceed without idempotency
      next();
      return;
    }

    // Validate key format
    if (!isValidIdempotencyKey(idempotencyKey)) {
      res.status(400).json({
        success: false,
        error: `Invalid ${headerName} format. Must be a valid UUID v4.`,
        code: 'INVALID_IDEMPOTENCY_KEY',
      });
      return;
    }

    // Need authenticated user for proper key isolation
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        error: 'Authentication required for idempotent requests',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    const cacheKey = getCacheKey(req.user.id, idempotencyKey);

    // Check if we have a cached response
    const cached = idempotencyCache.get(cacheKey);
    if (cached) {
      // Check if it's still valid (not expired)
      if (Date.now() - cached.createdAt <= IDEMPOTENCY_TTL) {
        console.log(`[Idempotency] Returning cached response for key: ${idempotencyKey}`);

        // Return cached response with header indicating it's a replay
        res.setHeader('X-Idempotent-Replayed', 'true');
        res.status(cached.statusCode).json(cached.body);
        return;
      } else {
        // Expired, remove from cache
        idempotencyCache.delete(cacheKey);
      }
    }

    // Store original json method to intercept response
    const originalJson = res.json.bind(res);

    // Override json to cache the response
    res.json = function(body: any): Response {
      // Only cache successful responses (2xx) or client errors (4xx)
      // Don't cache server errors (5xx) as those might be transient
      if (res.statusCode >= 200 && res.statusCode < 500) {
        idempotencyCache.set(cacheKey, {
          statusCode: res.statusCode,
          body,
          createdAt: Date.now(),
        });
        console.log(`[Idempotency] Cached response for key: ${idempotencyKey}`);
      }

      return originalJson(body);
    };

    next();
  };
}

/**
 * Pre-configured middleware for payment endpoints (idempotency key recommended but not required)
 */
export const paymentIdempotency = idempotencyMiddleware({ required: false });

/**
 * Pre-configured middleware for critical payment endpoints (idempotency key required)
 */
export const strictPaymentIdempotency = idempotencyMiddleware({ required: true });

/**
 * Helper to clear idempotency cache (useful for testing)
 */
export function clearIdempotencyCache(): void {
  idempotencyCache.clear();
}

/**
 * Get cache statistics (useful for monitoring)
 */
export function getIdempotencyCacheStats(): { size: number; keys: string[] } {
  return {
    size: idempotencyCache.size,
    keys: Array.from(idempotencyCache.keys()),
  };
}
