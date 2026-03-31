/**
 * TTS Routes - DISABLED
 * Text-to-Speech API endpoints
 *
 * TTS has been disabled due to high costs (~$32 per book)
 * All endpoints return 503 Service Unavailable
 */

import { Router, Request, Response } from 'express';

const router = Router();

// TTS service disabled message
const ttsDisabledResponse = (_req: Request, res: Response) => {
  return res.status(503).json({
    success: false,
    error: 'TTS service is currently disabled',
    message: 'Text-to-Speech has been disabled to reduce costs. Use browser-based TTS instead.',
  });
};

// All routes return disabled message
router.get('/voices', ttsDisabledResponse);
router.get('/status/:bookId', ttsDisabledResponse);
router.post('/generate', ttsDisabledResponse);
router.post('/generate-book/:bookId', ttsDisabledResponse);
router.post('/migrate-all', ttsDisabledResponse);
router.post('/migrate-translations', ttsDisabledResponse);
router.delete('/cache', ttsDisabledResponse);

export default router;
