/**
 * Shared promise cache for promotion endpoints (/promotions/trending, /promotions/featured).
 *
 * TrendingBooks and FeaturedBooks mount simultaneously on the Marketplace page and
 * previously each fired their own API call. This cache deduplicates in-flight requests
 * and keeps results for 2 minutes — fast enough for a session, fresh enough to feel live.
 */
import api from './api';

interface PromotedBook {
  book: any;
  promotionScore: number;
  promotionReasons: string[];
  badges: string[];
}

interface PromotionsData {
  trending: PromotedBook[];
  featured: PromotedBook[];
}

interface CacheEntry {
  promise: Promise<PromotionsData>;
  ts: number;
}

let cache: CacheEntry | null = null;
const TTL_MS = 2 * 60_000; // 2 minutes

function fetchAll(): Promise<PromotionsData> {
  return Promise.all([
    api.get('/promotions/trending', { params: { limit: 6 } }),
    api.get('/promotions/featured', { params: { limit: 4 } }),
  ]).then(([trendingRes, featuredRes]) => ({
    trending: trendingRes.data?.data?.books ?? [],
    featured: featuredRes.data?.data?.books ?? [],
  }));
}

export function getPromotions(): Promise<PromotionsData> {
  const now = Date.now();
  if (cache && now - cache.ts < TTL_MS) {
    return cache.promise;
  }
  const promise = fetchAll().catch(err => {
    cache = null; // evict broken entry so next call retries
    throw err;
  });
  cache = { promise, ts: now };
  return promise;
}

/** Force a fresh fetch on next access */
export function invalidatePromotionsCache() {
  cache = null;
}
