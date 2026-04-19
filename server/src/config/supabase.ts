import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Defensive: warn at module load but DON'T throw.
// Throwing here kills the Vercel serverless function during cold start
// (FUNCTION_INVOCATION_FAILED) before Express/CORS middleware can run,
// which in the browser manifests as "CORS header missing" on every request.
// Instead, use placeholder values so the function can boot and /health
// can report which env vars are missing.
const PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const PLACEHOLDER_KEY = 'placeholder-key';

const supabaseUrl = process.env.SUPABASE_URL || PLACEHOLDER_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || PLACEHOLDER_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!process.env.SUPABASE_URL) {
  console.error('⚠️ SUPABASE_URL is not set — DB operations will fail. Check /health for details.');
}
if (!process.env.SUPABASE_ANON_KEY) {
  console.error('⚠️ SUPABASE_ANON_KEY is not set — DB operations will fail. Check /health for details.');
}

// Create a fetch-like function using axios (better Windows compatibility)
const axiosFetch = async (input: any, init?: any): Promise<Response> => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const method = init?.method || 'GET';
  const body = init?.body;

  // Convert Headers to plain object, sanitizing values
  let headers: Record<string, string> = {};
  if (init?.headers) {
    if (init.headers instanceof Headers) {
      init.headers.forEach((value, key) => {
        headers[key] = value.replace(/[\r\n]/g, ''); // Remove newlines
      });
    } else if (Array.isArray(init.headers)) {
      init.headers.forEach(([key, value]) => {
        headers[key] = String(value).replace(/[\r\n]/g, '');
      });
    } else {
      Object.entries(init.headers).forEach(([key, value]) => {
        headers[key] = String(value).replace(/[\r\n]/g, '');
      });
    }
  }

  try {
    const response = await axios({
      url,
      method,
      headers,
      data: body,
      timeout: 45000, // 45 second timeout (Supabase free tier can be very slow after pause)
      validateStatus: () => true, // Don't throw on non-2xx
    });

    // Convert axios response headers to Headers object
    const responseHeaders = new Headers();
    Object.entries(response.headers || {}).forEach(([key, value]) => {
      if (typeof value === 'string') {
        responseHeaders.set(key, value);
      }
    });

    // Convert axios response to fetch Response-like object
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      json: async () => response.data,
      text: async () => typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
      blob: async () => new Blob([response.data]),
      arrayBuffer: async () => response.data,
      clone: () => ({ ...response }) as unknown as Response,
      body: null,
      bodyUsed: false,
      redirected: false,
      type: 'basic' as any,
      url,
      formData: async () => new FormData(),
    } as Response;
  } catch (error: any) {
    throw new Error(error.message || 'Network request failed');
  }
};

// Public client for frontend operations
export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    fetch: axiosFetch as unknown as typeof fetch,
  },
});

// Service role client for backend operations (bypasses RLS)
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      fetch: axiosFetch as unknown as typeof fetch,
    },
    db: {
      schema: 'public',
    },
  }
);

// Timeout wrapper for promises
const withTimeout = <T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMsg)), ms)
    )
  ]);
};

// Connection status check with retry and timeout
export const getDatabaseStatus = async (retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { error } = await withTimeout(
        supabaseAdmin.from('users').select('id').limit(1) as any,
        5000, // 5 second timeout per attempt
        'Connection timeout'
      ) as any;
      return {
        isConnected: !error,
        readyState: error ? 0 : 1,
        readyStateText: error ? 'disconnected' : 'connected',
        error: error?.message
      };
    } catch (err: any) {
      console.error(`Database status check attempt ${attempt}/${retries} failed:`, err.message);
      if (attempt === retries) {
        return {
          isConnected: false,
          readyState: 0,
          readyStateText: 'error',
          error: err.message
        };
      }
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, attempt * 500));
    }
  }
  return {
    isConnected: false,
    readyState: 0,
    readyStateText: 'error',
    error: 'All connection attempts failed'
  };
};

// Initialize database connection with retry logic for serverless cold starts
export const connectDatabase = async (): Promise<void> => {
  console.log('🔌 Connecting to Supabase...');
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const status = await getDatabaseStatus(1);
    if (status.isConnected) {
      console.log('✅ Supabase connected successfully');
      return;
    }

    if (attempt < maxRetries) {
      console.log(`⏳ Supabase connection attempt ${attempt}/${maxRetries} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    } else {
      console.warn('⚠️ Supabase connection check failed after all retries:', status.error);
      console.warn('⚠️ Server will start anyway - requests may fail if DB is unavailable');
    }
  }
};
