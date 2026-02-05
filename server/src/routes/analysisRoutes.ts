/**
 * Analysis Routes
 * API endpoints for AI text enhancement and analysis
 */

import { Router } from 'express';
import {
  enhanceText,
  analyzePlotStructure,
  analyzeTension,
  analyzeWritingTechniques,
  checkWritingGuidance,
  calculateScoreChange,
} from '../controllers/analysisController';
import { authenticate } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter for analysis endpoints
const analysisLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // 15 requests per minute per IP
  message: {
    success: false,
    message: 'Too many analysis requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// All analysis routes require authentication
router.use(authenticate as any);
router.use(analysisLimiter);

/**
 * POST /api/analysis/enhance-text
 * Enhance selected text using AI
 *
 * Body:
 * {
 *   text: string (10-5000 chars)
 *   action: 'improve' | 'expand' | 'shorten' | 'continue'
 *   context?: {
 *     genre?: string
 *     bookId?: string
 *     bookTitle?: string
 *     chapterTitle?: string
 *     surroundingText?: string
 *   }
 * }
 *
 * Response:
 * {
 *   originalText: string
 *   enhancedText: string
 *   explanation: string
 *   action: string
 * }
 */
router.post('/enhance-text', enhanceText as any);

/**
 * POST /api/analysis/plot-structure/:bookId
 * Analyze book plot structure (three-act)
 *
 * Response:
 * {
 *   threeActStructure: { act1, act2, act3 }
 *   plotPoints: { incitingIncident, midpoint, climax }
 *   balance: 'balanced' | 'front-heavy' | 'back-heavy'
 *   suggestions: string[]
 * }
 */
router.post('/plot-structure/:bookId', analyzePlotStructure as any);

/**
 * POST /api/analysis/tension/:bookId
 * Analyze tension levels throughout the book
 *
 * Response:
 * {
 *   chapters: [{ chapterIndex, title, tensionLevel, type, keyMoments }]
 *   overallArc: string
 *   suggestions: string[]
 * }
 */
router.post('/tension/:bookId', analyzeTension as any);

/**
 * POST /api/analysis/techniques/:bookId
 * Analyze writing techniques used in the book
 *
 * Response:
 * {
 *   techniques: {
 *     tensionCreation: { score, trend, examples, suggestions }
 *     problemResolution: { score, trend, examples, suggestions }
 *     characterDevelopment: { score, trend, examples, suggestions }
 *     motifsThemes: { score, trend, examples, suggestions }
 *     dialogueQuality: { score, trend, examples, suggestions }
 *     pacing: { score, trend, examples, suggestions }
 *   }
 *   overallScore: number
 *   improvements: string[]
 * }
 */
router.post('/techniques/:bookId', analyzeWritingTechniques as any);

/**
 * POST /api/analysis/guidance
 * Check for writing guidance alerts (real-time deviation detection)
 *
 * Body:
 * {
 *   bookId: string
 *   chapterIndex: number
 *   recentText: string (last ~500 chars written)
 * }
 *
 * Response:
 * {
 *   guidance: {
 *     type: 'deviation' | 'structure' | 'tension' | 'character'
 *     severity: 'info' | 'warning'
 *     message: string
 *     suggestions: [{ text, insertable? }]
 *   } | null
 * }
 */
router.post('/guidance', checkWritingGuidance as any);

/**
 * POST /api/analysis/score-change
 * Calculate score change after applying AI suggestion
 *
 * Body:
 * {
 *   bookId?: string
 *   chapterIndex?: number
 *   previousText: string
 *   newText: string
 * }
 *
 * Response:
 * {
 *   previousScore: number
 *   newScore: number
 *   delta: number
 *   breakdown: [{ category, previousValue, newValue, delta }]
 *   improvements: string[]
 * }
 */
router.post('/score-change', calculateScoreChange as any);

export default router;
