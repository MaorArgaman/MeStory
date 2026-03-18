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

// Connection status check
export const getDatabaseStatus = async () => {
  try {
    const { error } = await supabaseAdmin.from('users').select('id').limit(1);
    return {
      isConnected: !error,
      readyState: error ? 0 : 1,
      readyStateText: error ? 'disconnected' : 'connected',
      error: error?.message
    };
  } catch (err: any) {
    return {
      isConnected: false,
      readyState: 0,
      readyStateText: 'error',
      error: err.message
    };
  }
};

// Initialize database connection (no-op for Supabase, but kept for compatibility)
export const connectDatabase = async (): Promise<void> => {
  console.log('🔌 Connecting to Supabase...');
  const status = await getDatabaseStatus();
  if (status.isConnected) {
    console.log('✅ Supabase connected successfully');
  } else {
    console.error('❌ Supabase connection failed:', status.error);
    throw new Error(`Supabase connection failed: ${status.error}`);
  }
};

export default supabaseAdmin;
