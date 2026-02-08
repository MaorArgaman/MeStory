// MeStory Server
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import { connectDatabase } from './config/database';
import { apiLimiter } from './middleware/rateLimiter';
import { configurePassport } from './config/passport';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware';

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
import { initializeDefaultTemplates } from './services/templateService';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Check if running in Vercel serverless environment
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';

// Trust proxy for Vercel (required for express-rate-limit behind reverse proxy)
if (isVercel) {
  app.set('trust proxy', 1);
}

// ============================================
// Serverless Initialization (must be early)
// ============================================
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;
let initializationError: Error | null = null;

const initializeApp = async () => {
  if (isInitialized) return;
  if (initializationError) throw initializationError;

  try {
    // Connect to MongoDB
    await connectDatabase();

    // Configure Passport strategies
    const passportConfigured = configurePassport();
    if (passportConfigured) {
      console.log('✅ Google OAuth configured successfully');
    }

    // Initialize default book templates
    await initializeDefaultTemplates();
    console.log('✅ Book templates initialized');

    isInitialized = true;
    console.log('✅ Server initialization complete');
  } catch (error) {
    console.error('❌ Failed to initialize app:', error);
    initializationError = error as Error;
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
    initializationError = err;
  });
}

// ============================================
// CORS Configuration
// ============================================
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
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

    console.warn(`CORS request from origin: ${origin}`);
    // Allow all origins in development, be stricter in production if needed
    callback(null, true);
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session middleware for Passport
app.use(
  session({
    secret: process.env.JWT_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
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
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'MeStory API is running',
    initialized: isInitialized,
  });
});

// ============================================
// API Routes (require initialization)
// ============================================

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

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

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start server for local development (not Vercel)
if (!isVercel) {
  startServer();
}

// Export the Express app for Vercel serverless handler
export default app;
