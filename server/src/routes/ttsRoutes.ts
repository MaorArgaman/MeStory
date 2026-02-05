/**
 * TTS Routes
 * Text-to-Speech API endpoints for book narration
 */

import { Router } from 'express';
import {
  getVoices,
  synthesizeSpeech,
  narrateChapter,
  prepareChapterText,
} from '../controllers/ttsController';
import { authenticate } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter for TTS endpoints
const ttsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    success: false,
    message: 'Too many TTS requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// All TTS routes require authentication
router.use(authenticate as any);
router.use(ttsLimiter);

/**
 * GET /api/tts/voices
 * Get available voices for a language
 *
 * Query:
 * - language: 'he' | 'en' (default: 'he')
 * - provider?: 'browser' | 'google' | 'elevenlabs'
 */
router.get('/voices', getVoices as any);

/**
 * POST /api/tts/synthesize
 * Generate speech from text
 *
 * Body:
 * {
 *   text: string,
 *   language?: string (default: 'he'),
 *   voice?: string,
 *   speed?: number (0.5-2.0, default: 1.0),
 *   provider?: 'browser' | 'google' | 'elevenlabs'
 * }
 */
router.post('/synthesize', synthesizeSpeech as any);

/**
 * POST /api/tts/narrate-chapter/:bookId/:chapterIndex
 * Generate narration for a specific chapter
 *
 * Body:
 * {
 *   voice?: string,
 *   speed?: number,
 *   provider?: 'browser' | 'google' | 'elevenlabs'
 * }
 */
router.post('/narrate-chapter/:bookId/:chapterIndex', narrateChapter as any);

/**
 * GET /api/tts/prepare/:bookId/:chapterIndex
 * Get prepared text for client-side TTS
 * Returns plain text and sentences for Web Speech API
 */
router.get('/prepare/:bookId/:chapterIndex', prepareChapterText as any);

export default router;
