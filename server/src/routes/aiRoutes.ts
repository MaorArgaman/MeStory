import { Router } from 'express';
import { getSuggestions, analyzeChapter, generateTitles, generateBookSynopsis, generateCoverColors, generateCover, translateChapterContent, translateBook } from '../controllers/aiController';
import {
  generateAIImage,
  generateAIImageVariations,
  generateChapterIllustration,
  previewEnhancedPrompt,
} from '../controllers/aiImageController';
import {
  generateBookDesign,
  applyBookDesign,
  generateTypography,
  getImageSuggestions,
  generateContextualImage,
  generateCompleteDesign,
  generateCompleteDesignAsync,
  getDesignPreview,
  getDesignState,
  applyCompleteDesign,
  generateTemplateDesign,
  designWizard,
  premiumDesignWizard,
} from '../controllers/aiBookDesignController';
import {
  startInterview,
  sendMessage,
  getInterviewState,
  completeInterview,
  cancelInterview,
} from '../controllers/chatInterviewController';
import { authenticate } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter for AI endpoints (more restrictive)
// Section 17.2: AI operations are resource-intensive
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute per IP (increased for polling)
  message: {
    success: false,
    message: 'Too many AI requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for GET requests (polling endpoints)
  skip: (req) => req.method === 'GET',
});

// All AI routes require authentication
router.use(authenticate as any);
router.use(aiLimiter);

/**
 * POST /api/ai/suggestions
 * Generate writing continuation suggestions
 *
 * Body:
 * {
 *   currentText: string (min 50 chars)
 *   genre: string
 *   context?: {
 *     bookTitle?: string
 *     chapterTitle?: string
 *     characters?: string[]
 *   }
 * }
 */
router.post('/suggestions', getSuggestions as any);

/**
 * POST /api/ai/analyze
 * Analyze text quality and get scores
 *
 * Body:
 * {
 *   text: string (min 100 chars)
 * }
 */
router.post('/analyze', analyzeChapter as any);

/**
 * POST /api/ai/generate-titles
 * Generate book title suggestions based on genre
 *
 * Body:
 * {
 *   genre: string
 *   count?: number (1-10, default 5)
 * }
 */
router.post('/generate-titles', generateTitles as any);

/**
 * POST /api/ai/generate-synopsis
 * Generate compelling synopsis for book marketplace
 *
 * Body:
 * {
 *   bookId: string
 * }
 */
router.post('/generate-synopsis', generateBookSynopsis as any);

/**
 * POST /api/ai/generate-cover-colors
 * Generate AI color scheme for book cover
 *
 * Body:
 * {
 *   title: string
 *   genre: string
 *   mood?: string
 * }
 */
router.post('/generate-cover-colors', generateCoverColors as any);

/**
 * POST /api/ai/generate-cover
 * Generate AI-powered book cover design
 *
 * Body:
 * {
 *   synopsis: string
 *   genre: string
 *   title: string
 * }
 */
router.post('/generate-cover', generateCover as any);

/**
 * POST /api/ai/translate-chapter
 * Translate a single chapter from Hebrew to English or vice versa
 *
 * Body:
 * {
 *   content: string
 *   title: string
 *   targetLanguage: 'hebrew' | 'english'
 * }
 */
router.post('/translate-chapter', translateChapterContent as any);

/**
 * POST /api/ai/translate-book/:bookId
 * Translate an entire book from Hebrew to English or vice versa
 *
 * Body:
 * {
 *   targetLanguage: 'hebrew' | 'english'
 * }
 */
router.post('/translate-book/:bookId', translateBook as any);

/**
 * POST /api/ai/generate-image
 * Generate a single AI image for book pages
 *
 * Body:
 * {
 *   prompt: string
 *   bookId?: string
 *   style?: 'realistic' | 'illustration' | 'artistic' | 'manga' | 'watercolor' | 'oil-painting'
 *   aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'
 *   pageIndex?: number (if provided with bookId, saves image to book)
 * }
 */
router.post('/generate-image', generateAIImage as any);

/**
 * POST /api/ai/generate-variations
 * Generate multiple AI image variations
 *
 * Body:
 * {
 *   prompt: string
 *   bookId?: string
 *   style?: string
 *   aspectRatio?: string
 *   count?: number (1-4, default 4)
 * }
 */
router.post('/generate-variations', generateAIImageVariations as any);

/**
 * POST /api/ai/generate-illustration/:bookId/:chapterIndex
 * Generate AI illustration based on chapter content
 *
 * Body:
 * {
 *   style?: string
 *   pageIndex?: number (if provided, saves image to book)
 * }
 */
router.post('/generate-illustration/:bookId/:chapterIndex', generateChapterIllustration as any);

/**
 * POST /api/ai/preview-prompt
 * Preview enhanced prompt without generating image
 *
 * Body:
 * {
 *   prompt: string
 *   bookId?: string
 *   style?: string
 * }
 */
router.post('/preview-prompt', previewEnhancedPrompt as any);

// ============================================
// AI BOOK DESIGN ROUTES
// ============================================

/**
 * POST /api/ai/design-book/:bookId
 * Generate complete AI book design (typography, layout, cover, image suggestions)
 * This is the main "AI Design" feature
 */
router.post('/design-book/:bookId', generateBookDesign as any);

/**
 * POST /api/ai/apply-design/:bookId
 * Apply AI-generated design to a book
 *
 * Body:
 * {
 *   design: CompleteBookDesign,
 *   applyTypography: boolean,
 *   applyLayout: boolean,
 *   applyCover: boolean,
 *   applyImageSuggestions: boolean
 * }
 */
router.post('/apply-design/:bookId', applyBookDesign as any);

/**
 * POST /api/ai/design-typography/:bookId
 * Generate only typography design
 */
router.post('/design-typography/:bookId', generateTypography as any);

/**
 * POST /api/ai/suggest-images/:bookId
 * Get AI suggestions for image placements in the book
 */
router.post('/suggest-images/:bookId', getImageSuggestions as any);

/**
 * POST /api/ai/generate-contextual-image
 * Generate an image based on the text context at a specific position
 *
 * Body:
 * {
 *   bookId: string,
 *   chapterIndex: number,
 *   textBefore: string (optional),
 *   customPrompt: string (optional)
 * }
 */
router.post('/generate-contextual-image', generateContextualImage as any);

/**
 * POST /api/ai/design-complete/:bookId
 * Generate complete AI design with all images (Nano Banana Pro)
 *
 * Body:
 * {
 *   generateImages?: boolean (default true)
 * }
 */
router.post('/design-complete/:bookId', generateCompleteDesign as any);

/**
 * POST /api/ai/design-complete-async/:bookId
 * Async variant - returns { jobId } immediately, client polls /api/jobs/:id
 * Avoids HTTP timeouts and lets the client show a live progress bar.
 */
router.post('/design-complete-async/:bookId', generateCompleteDesignAsync as any);

/**
 * POST /api/ai/design-wizard/:bookId
 * AI Design Wizard - One-click complete book design
 * Creates a full professional design including typography, layout, covers, and images
 *
 * Body:
 * {
 *   generateInteriorImages?: boolean (default false)
 * }
 */
router.post('/design-wizard/:bookId', designWizard as any);

/**
 * POST /api/ai/premium-design/:bookId
 * ULTIMATE PREMIUM DESIGN - "עצב לי הכל" Feature
 * Creates the highest quality AI-powered book design including:
 * - Deep theme analysis for understanding book essence
 * - Premium typography with perfect font pairing and rich colors
 * - Unique background colors and styled text
 * - Beautiful table of contents design
 * - Chapter decorations and ornaments
 * - Page numbering, headers, footers, drop caps
 * - Strategic image placements with AI-generated images
 * - Professional cover design with AI-generated images
 * - ALL design elements saved to database
 *
 * Body:
 * {
 *   generateCoverImages?: boolean (default true)
 *   generateInteriorImages?: boolean (default true)
 *   maxInteriorImages?: number (default 5)
 * }
 */
router.post('/premium-design/:bookId', premiumDesignWizard as any);

/**
 * POST /api/ai/design-preview/:bookId
 * Get quick design preview without generating images
 */
router.post('/design-preview/:bookId', getDesignPreview as any);

/**
 * GET /api/ai/design-state/:bookId
 * Get current AI design state (for resuming)
 */
router.get('/design-state/:bookId', getDesignState as any);

/**
 * POST /api/ai/apply-complete-design/:bookId
 * Apply AI design state to book layout and cover
 */
router.post('/apply-complete-design/:bookId', applyCompleteDesign as any);

/**
 * POST /api/ai/design/complete
 * Generate template-based design (quick AI design using pre-made templates)
 *
 * Body:
 * {
 *   bookId?: string (optional, for ownership verification)
 *   bookTitle: string (required)
 *   bookGenre: string (required)
 *   bookSynopsis?: string
 *   language?: 'en' | 'he' (default 'en')
 *   generateCoverImage?: boolean (default false)
 * }
 */
router.post('/design/complete', generateTemplateDesign as any);

// ============================================
// AI CHAT INTERVIEW ROUTES
// ============================================

/**
 * POST /api/ai/interview/start
 * Start a new AI-driven chat interview
 *
 * Body:
 * {
 *   genre?: string
 *   targetAudience?: string
 * }
 */
router.post('/interview/start', startInterview as any);

/**
 * POST /api/ai/interview/:id/message
 * Send a message and get AI response
 *
 * Body:
 * {
 *   message: string
 * }
 */
router.post('/interview/:id/message', sendMessage as any);

/**
 * GET /api/ai/interview/:id/state
 * Get current interview state
 */
router.get('/interview/:id/state', getInterviewState as any);

/**
 * POST /api/ai/interview/:id/complete
 * Complete interview and get summary
 */
router.post('/interview/:id/complete', completeInterview as any);

/**
 * DELETE /api/ai/interview/:id
 * Cancel/delete interview
 */
router.delete('/interview/:id', cancelInterview as any);

export default router;
