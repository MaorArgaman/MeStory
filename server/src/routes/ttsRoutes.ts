/**
 * TTS Routes
 * Text-to-Speech API endpoints
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  generateAudio,
  getVoices,
  deleteAudioCache,
  getAudioStatus,
  generateBookAudio,
  migrateAllBooksAudio,
  migrateAllBooksTranslations,
} from '../controllers/ttsController';

const router = Router();

// Get available voices (public)
router.get('/voices', getVoices as any);

// Get audio status for a book (public)
router.get('/status/:bookId', getAudioStatus as any);

// Generate audio for a single chapter (requires auth)
router.post('/generate', authenticate as any, generateAudio as any);

// Generate audio for entire book (requires auth)
router.post('/generate-book/:bookId', authenticate as any, generateBookAudio as any);

// Migrate all published books - generate audio (requires auth)
router.post('/migrate-all', authenticate as any, migrateAllBooksAudio as any);

// Migrate all published books - generate translations (requires auth)
router.post('/migrate-translations', authenticate as any, migrateAllBooksTranslations as any);

// Delete cached audio (requires auth)
router.delete('/cache', authenticate as any, deleteAudioCache as any);

export default router;
