// MeStory Server - Performance optimized
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables FIRST before any other imports

import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import { connectDatabase, getDatabaseStatus } from './config/database';
import { apiLimiter } from './middleware/rateLimiter';
import { configurePassport } from './config/passport';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware';
import { initializeSocketIO, getOnlineUsersCount } from './services/socketService';

// Import routes
import authRoutes from './routes/authRoutes';
import bookRoutes from './routes/bookRoutes';
import aiRoutes from './routes/aiRoutes';
import userRoutes from './routes/userRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import paymentRoutes from './routes/paymentRoutes';
import adminRoutes from './routes/adminRoutes';
import recommendationRoutes from './routes/recommendationRoutes';
import promotionRoutes from './routes/promotionRoutes';
import ttsRoutes from './routes/ttsRoutes';
import messagingRoutes from './routes/messagingRoutes';
import notificationRoutes from './routes/notificationRoutes';
import voiceRoutes from './routes/voiceRoutes';
import analysisRoutes from './routes/analysisRoutes';
import templateRoutes from './routes/templateRoutes';
import bookPurchaseRoutes from './routes/bookPurchaseRoutes';
import webhookRoutes from './routes/webhookRoutes';
import refundRoutes from './routes/refundRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import sitemapRoutes from './routes/sitemapRoutes';
import collaborationRoutes from './routes/collaborationRoutes';
import organizationRoutes from './routes/organizationRoutes';
import jobRoutes from './routes/jobRoutes';
import { initializeDefaultTemplates } from './services/templateService';
import { initializeSubscriptionJobs } from './jobs/subscriptionJobs';
import { initializeCleanupJobs } from './jobs/cleanupJobs';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5001;

// Deploy marker — bumped whenever the server code changes. Used to verify
// that a push actually rolled out to Vercel.
const SERVER_VERSION = 'v2-hardened-env-handling';

// Check if running in Vercel serverless environment
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';

// Trust proxy for Vercel (required for express-rate-limit behind reverse proxy)
if (isVercel) {
  app.set('trust proxy', 1);
}

// EARLIEST possible diagnostics endpoint — no middleware, no DB, no imports
// beyond Express itself. If this doesn't respond, the function is crashing
// during cold start (module-load error) and no amount of runtime logic helps.
app.get('/version', (_req, res) => {
  res.status(200).json({
    version: SERVER_VERSION,
    timestamp: new Date().toISOString(),
    node: process.version,
    env: {
      isVercel,
      nodeEnv: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasClientUrl: !!process.env.CLIENT_URL,
    },
  });
});

// ============================================
// Serverless Initialization (must be early)
// ============================================
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;
let lastInitError: Error | null = null;
let lastInitAttempt: number = 0;
const INIT_RETRY_DELAY = 5000; // 5 seconds between retry attempts

const initializeApp = async () => {
  if (isInitialized) return;

  // Allow retry after delay if previous attempt failed
  const now = Date.now();
  if (lastInitError && (now - lastInitAttempt) < INIT_RETRY_DELAY) {
    throw lastInitError;
  }

  try {
    lastInitAttempt = now;
    lastInitError = null;

    // Connect to Supabase
    await connectDatabase();

    // Configure Passport strategies
    const passportConfigured = configurePassport();
    if (passportConfigured) {
      console.log('✅ Google OAuth configured successfully');
    }

    // Initialize default book templates (non-blocking — don't delay cold start)
    initializeDefaultTemplates()
      .then(() => console.log('✅ Book templates initialized'))
      .catch((err: any) => console.warn('⚠️ Template init failed (non-fatal):', err.message));

    isInitialized = true;
    console.log('✅ Server initialization complete');
  } catch (error) {
    console.error('❌ Failed to initialize app:', error);
    lastInitError = error as Error;
    initializationPromise = null; // Allow new initialization attempt
    throw error;
  }
};

// Middleware to ensure initialization is complete before handling API requests
const ensureInitialized = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isInitialized) {
      if (!initializationPromise) {
        initializationPromise = initializeApp();
      }
      await initializationPromise;
    }
    next();
  } catch (error) {
    console.error('Initialization failed:', error);
    res.status(503).json({
      success: false,
      error: 'Server is starting up. Please try again in a moment.',
    });
  }
};

// Start initialization in background for Vercel
if (isVercel) {
  console.log('🌐 Running in Vercel serverless mode');
  initializationPromise = initializeApp().catch((err) => {
    console.error('Initialization error:', err);
    lastInitError = err;
  });
}

// ============================================
// CORS Configuration
// ============================================
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://mestory.co.il',
  'https://www.mestory.co.il',
  process.env.CLIENT_URL,
].filter(Boolean) as string[];

// ============================================
// Standard Middleware
// ============================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
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

    console.warn(`CORS request from disallowed origin: ${origin}`);
    // IMPORTANT: Do NOT pass an Error to the callback — that triggers Express's
    // default error handler which returns 500 with no CORS headers, and the
    // browser misreports it as "CORS header missing". Instead, return false:
    // cors middleware will simply not set Access-Control-Allow-Origin, the
    // browser blocks the request on its own, and we don't surface a fake 500.
    callback(null, false);
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// SEC-003 FIX: Validate JWT_SECRET in production
// NOTE: Do NOT process.exit() here — that kills the Vercel serverless function
// during cold start (FUNCTION_INVOCATION_FAILED), making every API call fail
// with a misleading "CORS header missing" error in the browser. Instead, log
// loudly and let /health report the missing env var so the admin can see it.
const sessionSecret = process.env.JWT_SECRET;
if (process.env.NODE_ENV === 'production' && !sessionSecret) {
  console.error('⚠️ CRITICAL: JWT_SECRET is not set in production — sessions are insecure. Check /health for details.');
}

// ============================================
// CSRF Protection (BUG-006)
// ============================================
// This application uses multiple layers of CSRF protection:
//
// 1. SameSite Cookies: Session cookies use 'strict' in production,
//    preventing them from being sent with cross-origin requests.
//
// 2. CORS Configuration: Only whitelisted origins can make requests.
//    Unknown origins are rejected in production mode.
//
// 3. JWT Authentication: API endpoints require valid JWT tokens in
//    the Authorization header. Attackers cannot forge these tokens.
//
// 4. Secure Cookie Settings: httpOnly prevents JavaScript access,
//    secure ensures HTTPS-only transmission in production.
//
// Traditional CSRF tokens (like csurf) are not needed because:
// - All state-changing APIs require JWT authentication
// - JWTs are not automatically sent by the browser (unlike cookies)
// - SameSite=strict prevents cross-site cookie sending
// - CORS blocks cross-origin requests from untrusted domains
// ============================================

// Session middleware for Passport
app.use(
  session({
    secret: sessionSecret || 'dev-only-fallback-key-not-for-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Serve static files from uploads directory
const uploadDir = process.env.UPLOAD_DIR || './uploads';
app.use('/uploads', express.static(path.resolve(uploadDir)));

// ============================================
// Health Check (no init required)
// ============================================
app.get('/health', async (_req, res) => {
  const dbStatus = await getDatabaseStatus();
  const isVercelEnv = process.env.VERCEL === '1' || process.env.VERCEL === 'true';

  // Check for configuration issues
  const configIssues: string[] = [];
  if (!process.env.SUPABASE_URL) {
    configIssues.push('SUPABASE_URL is not set (CRITICAL - DB will fail)');
  }
  if (!process.env.SUPABASE_ANON_KEY) {
    configIssues.push('SUPABASE_ANON_KEY is not set (CRITICAL - DB will fail)');
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    configIssues.push('SUPABASE_SERVICE_ROLE_KEY is not set (CRITICAL - admin ops will fail)');
  }
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    configIssues.push('JWT_SECRET is not set (CRITICAL - sessions are insecure)');
  }
  if (!process.env.CLIENT_URL) {
    configIssues.push('CLIENT_URL is not set (CORS may block production origin)');
  }
  if (!process.env.GOOGLE_CLIENT_ID) {
    configIssues.push('GOOGLE_CLIENT_ID is not set');
  }
  if (!process.env.GOOGLE_CLIENT_SECRET) {
    configIssues.push('GOOGLE_CLIENT_SECRET is not set');
  }
  if (!process.env.OPENAI_API_KEY) {
    configIssues.push('OPENAI_API_KEY is not set (required for audio transcription)');
  }
  if (!process.env.GEMINI_API_KEY) {
    configIssues.push('GEMINI_API_KEY is not set (required for AI features)');
  }

  res.status(200).json({
    status: configIssues.length === 0 ? 'ok' : 'warning',
    message: 'MeStory API is running',
    initialized: isInitialized,
    initError: lastInitError?.message || null,
    configIssues: configIssues.length > 0 ? configIssues : undefined,
    database: dbStatus,
    socket: {
      onlineUsers: getOnlineUsersCount(),
    },
    env: {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasGoogleCallbackUrl: !!process.env.GOOGLE_CALLBACK_URL,
      hasOpenAiKey: !!process.env.OPENAI_API_KEY,
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      hasClientUrl: !!process.env.CLIENT_URL,
      clientUrl: process.env.CLIENT_URL || 'not set',
      nodeEnv: process.env.NODE_ENV,
      isVercel: isVercelEnv,
    }
  });
});

// ============================================
// SEO Routes (no authentication required)
// ============================================
// Sitemap and robots.txt for search engines
app.use('/', sitemapRoutes);

// ============================================
// API Routes (require initialization)
// ============================================

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Request timeout middleware - prevent hanging requests
// Long AI operations (premium-design, design-complete) get 270s (just under Vercel's 300s maxDuration).
// Everything else gets 55s.
const REQUEST_TIMEOUT = 55000;
const AI_LONG_TIMEOUT = 270000;
const LONG_AI_PATHS = ['/ai/premium-design/', '/ai/design-complete/', '/ai/design-wizard/'];

app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  const isLongAI = LONG_AI_PATHS.some(p => req.path.startsWith(p));
  const timeoutMs = isLongAI ? AI_LONG_TIMEOUT : REQUEST_TIMEOUT;

  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      console.error(`[TIMEOUT] Request timed out after ${timeoutMs}ms: ${req.method} ${req.originalUrl}`);
      res.status(504).json({
        success: false,
        error: 'Request timeout - please try again',
      });
    }
  }, timeoutMs);

  // Clear timeout when response is finished
  res.on('finish', () => clearTimeout(timeout));
  res.on('close', () => clearTimeout(timeout));

  next();
});

// IMPORTANT: Apply initialization check BEFORE routes
app.use('/api', ensureInitialized);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/user', userRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api/messages', messagingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/book-purchases', bookPurchaseRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/refunds', refundRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/collaboration', collaborationRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/jobs', jobRoutes);

// ============================================
// Error Handling (must be last)
// ============================================
app.use(notFoundHandler);
app.use(errorHandler);

// ============================================
// Local Development Server
// ============================================
const startServer = async () => {
  try {
    await initializeApp();

    // Initialize Socket.IO for local development
    initializeSocketIO(httpServer, allowedOrigins);
    console.log('✅ Socket.IO initialized');

    // Initialize subscription cron jobs (only for non-serverless environments)
    initializeSubscriptionJobs();
    console.log('✅ Subscription jobs initialized');

    // Initialize cleanup jobs
    initializeCleanupJobs();
    console.log('✅ Cleanup jobs initialized');

    // Start listening
    httpServer.listen(PORT, () => {
      console.log(`🚀 MeStory server running on port ${PORT}`);
      console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Only start server in non-Vercel environments
if (!isVercel) {
  startServer();
}

export default app;
// restart Mon Apr 13 21:41:37     2026
// restart
