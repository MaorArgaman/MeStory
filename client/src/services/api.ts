import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';

/**
 * Generate a UUID v4 for idempotency keys
 * Uses crypto.randomUUID() if available, falls back to manual generation
 */
export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Retry Logic Configuration
 * Like Waze - recalculate route, don't drive through a building
 */
interface RetryConfig {
  maxRetries: number;       // Maximum retry attempts (3-5)
  baseDelay: number;        // Initial delay in ms
  maxDelay: number;         // Maximum delay cap
  retryableStatuses: number[]; // HTTP statuses worth retrying (5xx, not 4xx)
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,          // Start with 1 second
  maxDelay: 10000,          // Cap at 10 seconds
  retryableStatuses: [500, 502, 503, 504], // Server errors only, not client errors
};

/**
 * Check if an error is retryable
 * 500 errors = yes, 400 errors = no (client's fault)
 */
function isRetryableError(error: AxiosError): boolean {
  // Network errors (no response) are retryable
  if (!error.response) {
    return true;
  }

  // Only retry server errors (5xx), not client errors (4xx)
  const status = error.response.status;
  return DEFAULT_RETRY_CONFIG.retryableStatuses.includes(status);
}

/**
 * Calculate delay with exponential backoff
 * Each retry waits longer: 1s -> 2s -> 4s -> 8s (capped at maxDelay)
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay = config.baseDelay * Math.pow(2, attempt);
  // Add jitter (±20%) to prevent thundering herd
  const jitter = delay * 0.2 * (Math.random() - 0.5);
  return Math.min(delay + jitter, config.maxDelay);
}

/**
 * Sleep utility
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Execute request with retry logic
 */
export async function withRetry<T>(
  requestFn: () => Promise<AxiosResponse<T>>,
  config: Partial<RetryConfig> = {}
): Promise<AxiosResponse<T>> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: AxiosError | null = null;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error as AxiosError;

      // Don't retry if it's not a retryable error
      if (!isRetryableError(lastError)) {
        throw error;
      }

      // Don't retry if we've exhausted attempts
      if (attempt === retryConfig.maxRetries) {
        throw error;
      }

      const delay = calculateDelay(attempt, retryConfig);
      await sleep(delay);
    }
  }

  throw lastError;
}

// In production, use the server URL
// In development, use localhost
const API_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://api.mestory-ai.com/api' : 'http://localhost:5001/api');

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Paths that should auto-receive an idempotency key. The server reads the
// X-Idempotency-Key header to dedupe retries (especially relevant for
// payments and AI features where double-charging is bad). Anything that
// mutates state via POST gets one unless it's a streaming/long-poll route.
const IDEMPOTENCY_PATH_PATTERNS: RegExp[] = [
  /^\/payments\//,
  /^\/book-purchases\//,
  /^\/ai\//,
  /^\/analysis\//,
  /^\/voice\//,
  /^\/interview\//,
];

function shouldAutoIdempotent(method: string | undefined, url: string | undefined): boolean {
  if (!method || !url) return false;
  if (method.toUpperCase() !== 'POST') return false;
  return IDEMPOTENCY_PATH_PATTERNS.some((re) => re.test(url));
}

// Request interceptor to add auth token + idempotency key
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Auto-attach idempotency key to mutating AI/payment requests if the
    // caller didn't set one explicitly. Lets the server safely dedupe a
    // retry without double-charging credits or creating duplicate orders.
    if (
      shouldAutoIdempotent(config.method, config.url) &&
      !config.headers['X-Idempotency-Key'] &&
      !config.headers['x-idempotency-key']
    ) {
      config.headers['X-Idempotency-Key'] = generateIdempotencyKey();
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// PERF: shared /auth/me deduplication.
// Multiple contexts (AuthContext, LanguageContext, CurrencyContext) each fetch
// /auth/me on mount. Without this, a single navigation fired 3-6 requests back-
// to-back, each taking 300-1500ms. This layer ensures:
//   1. Concurrent requests share ONE in-flight promise.
//   2. Results are cached for a short window so quick re-mounts don't re-fetch.
// Any 401/logout clears the cache so the next call will refetch.
let meInFlight: Promise<AxiosResponse<any>> | null = null;
let meCachedResponse: AxiosResponse<any> | null = null;
let meCachedAt = 0;
const ME_CACHE_TTL_MS = 10_000; // 10s is plenty to absorb a navigation burst

export function fetchMe(): Promise<AxiosResponse<any>> {
  const now = Date.now();
  if (meCachedResponse && now - meCachedAt < ME_CACHE_TTL_MS) {
    return Promise.resolve(meCachedResponse);
  }
  if (meInFlight) {
    return meInFlight;
  }
  meInFlight = api.get('/auth/me')
    .then((res) => {
      meCachedResponse = res;
      meCachedAt = Date.now();
      return res;
    })
    .finally(() => {
      meInFlight = null;
    });
  return meInFlight;
}

export function invalidateMeCache(): void {
  meInFlight = null;
  meCachedResponse = null;
  meCachedAt = 0;
}

// Response interceptor — auto-retry on 503 (Vercel cold start), then handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<{ error: string; message?: string }>) => {
    // Ignore canceled requests - don't show any error
    if (axios.isCancel(error) || error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
      return Promise.reject(error);
    }

    // Auto-retry once on 503 (server starting up / cold start)
    const config = error.config as AxiosRequestConfig & { _retried?: boolean };
    if (error.response?.status === 503 && config && !config._retried) {
      config._retried = true;
      await sleep(2000);
      return api.request(config);
    }

    const url = error.config?.url || '';
    const isAuthCheck = url.includes('/auth/me');
    // Callers can opt out of the auto error toast (e.g. optional fetches
    // where a 404 is an expected, handled outcome).
    const suppressToast = !!(error.config as any)?.suppressErrorToast;

    // 402 / 403 with credit-system error codes - dispatch a global event so
    // a top-level modal can react. We don't toast here since the modal
    // gives a richer UX (shows top-up packages and upgrade CTA).
    if (error.response?.status === 402) {
      const data = error.response.data as any;
      if (data?.errorCode === 'INSUFFICIENT_CREDITS') {
        window.dispatchEvent(
          new CustomEvent('insufficient-credits', {
            detail: {
              required: data.required,
              available: data.available,
              topUpOptions: data.topUpOptions || [],
            },
          })
        );
        return Promise.reject(error);
      }
    }
    if (error.response?.status === 403) {
      const data = error.response.data as any;
      if (data?.errorCode === 'FEATURE_NOT_AVAILABLE') {
        window.dispatchEvent(
          new CustomEvent('feature-not-available', {
            detail: {
              feature: data.feature,
              currentPlan: data.currentPlan,
            },
          })
        );
        return Promise.reject(error);
      }
    }

    // Handle specific error cases
    if (error.response?.status === 401) {
      // Unauthorized - clear token, cached /auth/me, and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      invalidateMeCache();

      // Only redirect if not already on login/register page and not during initial auth check
      if (!window.location.pathname.includes('/login') &&
          !window.location.pathname.includes('/register') &&
          !isAuthCheck) {
        toast.error('Session expired. Please login again.');
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action.');
    } else if (error.response?.status === 429) {
      toast.error('Too many requests. Please try again later.');
    } else if (error.response?.status === 500 || error.response?.status === 503) {
      // Server error - don't show toast for auth checks or non-critical tracking
      const isSilent = isAuthCheck || url.endsWith('/view');
      if (!isSilent) {
        toast.error('Server is temporarily unavailable. Please try again.');
      }
    } else if (!error.response && error.message === 'Network Error') {
      // Network error - don't show toast for auth checks
      if (!isAuthCheck) {
        toast.error('Connection error. Please check your internet.');
      }
    } else if (error.response?.data?.error) {
      // Show API error message (but not for silent auth checks)
      if (!isAuthCheck && !suppressToast) {
        toast.error(error.response.data.error);
      }
    } else if (error.message && !isAuthCheck && !suppressToast) {
      // Show generic error
      toast.error(error.message);
    }

    return Promise.reject(error);
  }
);

/**
 * Upload user avatar
 */
export const uploadAvatar = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await api.post('/user/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (response.data.success) {
    return response.data.data.avatarUrl;
  }

  throw new Error(response.data.error || 'Failed to upload avatar');
};

/**
 * Make a payment request with idempotency support AND retry logic
 * Automatically generates and includes an idempotency key to prevent duplicate charges
 * Retries on network/server errors with exponential backoff
 *
 * @param url - API endpoint
 * @param data - Request body
 * @param config - Additional axios config
 * @returns Promise with response
 */
export async function paymentRequest<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  const idempotencyKey = generateIdempotencyKey();

  // Use retry logic for payment requests (critical operations)
  const response = await withRetry(
    () => api.post(url, data, {
      ...config,
      headers: {
        ...config?.headers,
        'X-Idempotency-Key': idempotencyKey,
      },
    }),
    {
      maxRetries: 3,        // Payment requests get 3 retries
      baseDelay: 1500,      // Start with 1.5s for payments
    }
  );

  return response.data;
}

/**
 * Make a critical API request with retry logic
 * Use this for important operations that should survive temporary failures
 */
export async function criticalRequest<T = any>(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await withRetry(
    () => api[method](url, method === 'get' || method === 'delete' ? config : data, config),
    { maxRetries: 3 }
  );
  return response.data;
}

/**
 * Payment API helpers with built-in idempotency support
 */
export const paymentApi = {
  /**
   * Create a subscription upgrade order
   * @param plan - Plan ID ('standard' or 'premium')
   */
  createSubscriptionOrder: async (plan: string) => {
    return paymentRequest('/payments/create-order', { plan });
  },

  /**
   * Capture/complete a subscription payment
   * @param orderId - Order ID from createOrder
   */
  captureSubscriptionOrder: async (orderId: string) => {
    return paymentRequest('/payments/capture-order', { orderId });
  },

  /**
   * Create a book purchase order
   * @param bookId - Book ID to purchase
   */
  createBookPurchaseOrder: async (bookId: string) => {
    return paymentRequest(`/book-purchases/${bookId}/create-order`);
  },

  /**
   * Capture/complete a book purchase
   * @param orderId - Order ID from createPurchaseOrder
   */
  captureBookPurchase: async (orderId: string) => {
    return paymentRequest('/book-purchases/capture', { orderId });
  },

  /**
   * List one-time top-up packages.
   */
  listTopUpPackages: async () => {
    const res = await api.get('/payments/topup/packages');
    return res.data;
  },

  /**
   * Create a top-up order for a credit package.
   */
  createTopUpOrder: async (packageId: string) => {
    return paymentRequest('/payments/topup/create-order', { packageId });
  },

  /**
   * Capture/complete a top-up order.
   */
  captureTopUpOrder: async (orderId: string) => {
    return paymentRequest('/payments/topup/capture-order', { orderId });
  },

  /**
   * Server-side PayPal config status. Hit on app load to decide whether
   * to show "payments unavailable" UI.
   */
  getConfigStatus: async () => {
    const res = await api.get('/payments/config-status');
    return res.data;
  },
};

export default api;
