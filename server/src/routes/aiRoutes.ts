import { Router } from 'express';
import { getSuggestions, analyzeChapter, generateTitles, generateBookSynopsis, generateCoverColors, generateCover } from '../controllers/aiController';
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
} from '../controllers/aiBookDesignController';
import { authenticate } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter for AI endpoints (more restrictive)
// Section 17.2: AI operations are resource-intensive
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  message: {
    success: false,
    message: 'Too many AI requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
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

export default router;
