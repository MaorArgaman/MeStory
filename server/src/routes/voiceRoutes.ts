/**
 * Voice Routes
 * Voice interview and transcription API endpoints
 */

import { Router } from 'express';
import {
  startInterview,
  processInterviewResponse,
  transcribeVoice,
  completeInterview,
  getInterviewState,
  saveInterviewToBook,
  cancelInterview,
} from '../controllers/voiceController';
import { authenticate } from '../middleware/auth';
import { uploadAudio, handleUploadError } from '../middleware/uploadMiddleware';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter for voice endpoints
const voiceLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute (high limit for interview flow)
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for transcription (API costs)
const transcribeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 transcriptions per minute
  message: {
    success: false,
    message: 'Too many transcription requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// All voice routes require authentication
router.use(authenticate as any);
router.use(voiceLimiter);

/**
 * POST /api/voice/transcribe
 * Transcribe audio file to text
 *
 * Body: FormData with 'audio' file field
 *
 * Response:
 * {
 *   text: string,
 *   language: string
 * }
 */
router.post(
  '/transcribe',
  transcribeLimiter,
  uploadAudio.single('audio'),
  handleUploadError as any,
  transcribeVoice as any
);

/**
 * POST /api/interview/start
 * Start a new voice interview
 *
 * Body:
 * {
 *   genre?: string,
 *   targetAudience?: string,
 *   bookId?: string
 * }
 *
 * Response:
 * {
 *   interviewId: string,
 *   firstQuestion: string,
 *   currentTopic: string,
 *   progress: number
 * }
 */
router.post('/interview/start', startInterview as any);

/**
 * POST /api/interview/respond
 * Process interview response (audio or text)
 *
 * Body: FormData with:
 * - interviewId: string (required)
 * - textResponse?: string (if not using audio)
 * - currentQuestion?: string
 * - audio?: File (if using voice)
 *
 * Response:
 * {
 *   transcribedText: string,
 *   nextQuestion: string | null,
 *   currentTopic: string,
 *   isComplete: boolean,
 *   progress: number,
 *   canCompleteEarly: boolean
 * }
 */
router.post(
  '/interview/respond',
  transcribeLimiter,
  uploadAudio.single('audio'),
  handleUploadError as any,
  processInterviewResponse as any
);

/**
 * POST /api/interview/complete
 * Complete interview and generate summary
 *
 * Body:
 * {
 *   interviewId: string
 * }
 *
 * Response:
 * {
 *   summary: InterviewSummary,
 *   responses: InterviewResponse[],
 *   duration: number,
 *   questionsAsked: number
 * }
 */
router.post('/interview/complete', completeInterview as any);

/**
 * GET /api/interview/:interviewId/state
 * Get current interview state
 *
 * Response:
 * {
 *   state: InterviewState,
 *   progress: number,
 *   canCompleteEarly: boolean
 * }
 */
router.get('/interview/:interviewId/state', getInterviewState as any);

/**
 * POST /api/interview/save-to-book
 * Save completed interview summary to a book
 *
 * Body:
 * {
 *   interviewId?: string,
 *   bookId: string,
 *   summary: InterviewSummary,
 *   responses: InterviewResponse[],
 *   duration: number
 * }
 */
router.post('/interview/save-to-book', saveInterviewToBook as any);

/**
 * DELETE /api/interview/:interviewId
 * Cancel/delete an interview in progress
 */
router.delete('/interview/:interviewId', cancelInterview as any);

export default router;
