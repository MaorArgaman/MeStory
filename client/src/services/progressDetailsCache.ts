/**
 * Shared promise cache for /recommendations/progress-details.
 *
 * Both ContinueReading and ContinueWriting mount simultaneously and call the
 * same endpoint. Without this cache, two requests fire in parallel; with it,
 * the second caller gets the same in-flight Promise and pays zero extra cost.
 *
 * Cache TTL: 30 seconds — short enough to stay fresh, long enough to cover
 * simultaneous mounts.
 */
import api from './api';

interface ProgressData {
  continueReading: any[];
  continueWriting: any[];
}

let cached: { promise: Promise<ProgressData>; ts: number } | null = null;
const TTL_MS = 30_000;

export function getProgressDetails(): Promise<ProgressData> {
  const now = Date.now();
  if (cached && now - cached.ts < TTL_MS) {
    return cached.promise;
  }
  const promise = api
    .get('/recommendations/progress-details')
    .then(r => r.data.data as ProgressData)
    .catch(err => {
      // Evict broken cache so next caller retries
      cached = null;
      throw err;
    });
  cached = { promise, ts: now };
  return promise;
}

/** Call this to force a fresh fetch on next access (e.g. after user action). */
export function invalidateProgressCache() {
  cached = null;
}
