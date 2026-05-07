/**
 * TTS Routes - re-enabled with credit gating.
 *
 * Originally disabled because each book audiobook costs ~$32. With the
 * new credit system this becomes profitable: each chapter narration
 * deducts 12 credits (~$0.50 of revenue against ~$0.10 of compute), and
 * full audiobook = 60 credits (~$2.50 vs ~$1.80 compute).
 *
 * TTS is gated at the plan level: Standard/Premium only. Free users get
 * a 403 with upgrade prompt.
 */

import { Router } from 'express';
import {
  generateAudio,
  getVoices,
  deleteAudioCache,
  getAudioStatus,
  generateBookAudio,
  migrateAllBooksAudio,
  migrateAllBooksTranslations,
} from '../controllers/ttsController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/adminMiddleware';
import { requireCredits } from '../middleware/requireCredits';
import rateLimit from 'express-rate-limit';

const router = Router();

const ttsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many TTS requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authenticate as any);

// Voice catalogue - cheap, no credit charge
router.get('/voices', getVoices as any);

// Per-chapter status - cheap, no credit charge
router.get('/status/:bookId', getAudioStatus as any);

// Generate audio for a single chapter (12 credits, gated to Standard+)
router.post(
  '/generate',
  ttsLimiter,
  requireCredits('tts_chapter') as any,
  generateAudio as any
);

// Generate audio for an entire book (60 credits, gated to Standard+)
// Premium users have a "1 free audiobook/month" bonus that's consumed
// before charging credits.
router.post(
  '/generate-book/:bookId',
  ttsLimiter,
  requireCredits('tts_full_book') as any,
  generateBookAudio as any
);

// Admin migration endpoints - bypass credits (admin role bypasses anyway)
router.post('/migrate-all', requireAdmin as any, migrateAllBooksAudio as any);
router.post('/migrate-translations', requireAdmin as any, migrateAllBooksTranslations as any);

// Cache management - admin only
router.delete('/cache', requireAdmin as any, deleteAudioCache as any);

export default router;
