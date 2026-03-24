import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL environment variable is not set');
}

if (!supabaseKey) {
  throw new Error('SUPABASE_ANON_KEY environment variable is not set');
}

// Public client for frontend operations
export const supabase = createClient(supabaseUrl, supabaseKey);

// Service role client for backend operations (bypasses RLS)
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Connection status check with retry
export const getDatabaseStatus = async (retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { error } = await supabaseAdmin.from('users').select('id').limit(1);
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
    const status = await getDatabaseStatus(1); // Single attempt per getDatabaseStatus call
    if (status.isConnected) {
      console.log('✅ Supabase connected successfully');
      return;
    }

    if (attempt < maxRetries) {
      console.log(`⏳ Supabase connection attempt ${attempt}/${maxRetries} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    } else {
      console.error('❌ Supabase connection failed after all retries:', status.error);
      throw new Error(`Supabase connection failed: ${status.error}`);
    }
  }
};

export default supabaseAdmin;
