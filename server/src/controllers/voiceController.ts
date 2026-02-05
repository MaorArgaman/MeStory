/**
 * Voice Controller
 * Handles voice interview API endpoints for book creation
 */

import { Response } from 'express';
import fs from 'fs';
import { AuthRequest } from '../types';
import { transcribeAudio } from '../services/whisperService';
import {
  createInterviewState,
  getFirstQuestion,
  processResponse,
  generateInterviewSummary,
  getInterviewProgress,
  canCompleteEarly,
  InterviewState,
  InterviewSummary,
} from '../services/aiInterviewService';

// In-memory interview state storage (use Redis in production)
const interviewStates = new Map<string, InterviewState>();

/**
 * Start a new voice interview
 * POST /api/interview/start
 */
export const startInterview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { genre, targetAudience, bookId } = req.body;

    // Create interview ID (use bookId if provided, otherwise generate)
    const interviewId = bookId || `interview_${req.user.id}_${Date.now()}`;

    // Check if interview already exists
    if (interviewStates.has(interviewId)) {
      const existingState = interviewStates.get(interviewId)!;

      // If not complete, return existing state
      if (!existingState.isComplete) {
        res.status(200).json({
          success: true,
          data: {
            interviewId,
            state: existingState,
            progress: getInterviewProgress(existingState),
            message: 'Resumed existing interview',
          },
        });
        return;
      }
    }

    // Create new interview state
    const state = createInterviewState(interviewId, genre, targetAudience);

    // Get first question
    const firstQuestion = await getFirstQuestion(state);

    // Store state
    interviewStates.set(interviewId, state);

    res.status(200).json({
      success: true,
      data: {
        interviewId,
        firstQuestion,
        currentTopic: state.currentTopic,
        progress: 0,
        state,
      },
    });
  } catch (error: any) {
    console.error('Start interview error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start interview',
    });
  }
};

/**
 * Transcribe audio and process response
 * POST /api/interview/respond
 */
export const processInterviewResponse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { interviewId, textResponse, currentQuestion } = req.body;
    const audioFile = req.file;

    // Validate interview exists
    if (!interviewId || !interviewStates.has(interviewId)) {
      res.status(400).json({
        success: false,
        error: 'Interview not found. Please start a new interview.',
      });
      return;
    }

    const state = interviewStates.get(interviewId)!;

    // Check if interview is complete
    if (state.isComplete) {
      res.status(400).json({
        success: false,
        error: 'Interview already completed',
      });
      return;
    }

    let responseText = textResponse;

    // Transcribe audio if provided
    if (audioFile) {
      try {
        const transcription = await transcribeAudio(audioFile.path, 'he');
        responseText = transcription.text;

        // Clean up uploaded file
        fs.unlink(audioFile.path, (err) => {
          if (err) console.error('Failed to delete audio file:', err);
        });
      } catch (transcribeError: any) {
        console.error('Transcription error:', transcribeError);

        // Clean up uploaded file on error
        if (audioFile.path) {
          fs.unlink(audioFile.path, () => {});
        }

        res.status(500).json({
          success: false,
          error: 'Failed to transcribe audio. Please try again or type your response.',
        });
        return;
      }
    }

    // Validate response
    if (!responseText || responseText.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'No response provided',
      });
      return;
    }

    // Update last question in state
    if (currentQuestion && state.responses.length > 0) {
      state.responses[state.responses.length - 1].question = currentQuestion;
    }

    // Process the response
    const result = await processResponse(state, responseText.trim());

    // Update stored state
    interviewStates.set(interviewId, result.state);

    // Calculate progress
    const progress = getInterviewProgress(result.state);

    res.status(200).json({
      success: true,
      data: {
        transcribedText: responseText,
        nextQuestion: result.nextQuestion,
        currentTopic: result.currentTopic,
        isComplete: result.isComplete,
        progress,
        canCompleteEarly: canCompleteEarly(result.state),
        state: result.state,
      },
    });
  } catch (error: any) {
    console.error('Process interview response error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process response',
    });
  }
};

/**
 * Transcribe audio file only (no interview processing)
 * POST /api/voice/transcribe
 */
export const transcribeVoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const audioFile = req.file;

    if (!audioFile) {
      res.status(400).json({
        success: false,
        error: 'Audio file is required',
      });
      return;
    }

    // Transcribe audio
    const transcription = await transcribeAudio(audioFile.path, 'he');

    // Clean up uploaded file
    fs.unlink(audioFile.path, (err) => {
      if (err) console.error('Failed to delete audio file:', err);
    });

    res.status(200).json({
      success: true,
      data: {
        text: transcription.text,
        language: transcription.language,
      },
    });
  } catch (error: any) {
    console.error('Transcribe voice error:', error);

    // Clean up uploaded file on error
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to transcribe audio',
    });
  }
};

/**
 * Complete interview and generate summary
 * POST /api/interview/complete
 */
export const completeInterview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { interviewId } = req.body;

    // Validate interview exists
    if (!interviewId || !interviewStates.has(interviewId)) {
      res.status(400).json({
        success: false,
        error: 'Interview not found',
      });
      return;
    }

    const state = interviewStates.get(interviewId)!;

    // Generate summary
    const summary = await generateInterviewSummary(state);

    // Calculate duration
    const duration = Math.round((Date.now() - state.startedAt.getTime()) / 1000);

    // Mark interview as complete
    state.isComplete = true;
    interviewStates.set(interviewId, state);

    res.status(200).json({
      success: true,
      data: {
        summary,
        responses: state.responses,
        duration,
        questionsAsked: state.questionsAsked,
      },
    });
  } catch (error: any) {
    console.error('Complete interview error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to complete interview',
    });
  }
};

/**
 * Get interview state
 * GET /api/interview/:interviewId/state
 */
export const getInterviewState = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { interviewId } = req.params;

    // Validate interview exists
    if (!interviewId || !interviewStates.has(interviewId)) {
      res.status(404).json({
        success: false,
        error: 'Interview not found',
      });
      return;
    }

    const state = interviewStates.get(interviewId)!;

    res.status(200).json({
      success: true,
      data: {
        state,
        progress: getInterviewProgress(state),
        canCompleteEarly: canCompleteEarly(state),
      },
    });
  } catch (error: any) {
    console.error('Get interview state error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get interview state',
    });
  }
};

/**
 * Save interview summary to book
 * POST /api/interview/save-to-book
 */
export const saveInterviewToBook = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { interviewId, bookId, summary, responses, duration } = req.body;

    // Import Book model here to avoid circular dependencies
    const { Book } = await import('../models/Book');

    // Find the book
    const book = await Book.findOne({
      _id: bookId,
      author: req.user.id,
    });

    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found or unauthorized',
      });
      return;
    }

    // Update book's storyContext with voice interview data
    book.storyContext = {
      ...book.storyContext,
      theme: summary.theme.mainTheme,
      characters: summary.characters.map((c: any) => `${c.name} (${c.role}): ${c.description}`).join('\n'),
      conflict: summary.plot.conflict,
      setting: `${summary.setting.world} - ${summary.setting.timePeriod}. ${summary.setting.atmosphere}`,
      keyPoints: summary.plot.keyEvents.join('\n'),
      completedAt: new Date(),
      // Store full voice interview data
      voiceInterview: {
        completedAt: new Date(),
        duration,
        responses: responses.map((r: any) => ({
          topic: r.topic,
          question: r.question,
          answer: r.answer,
        })),
        summary,
      },
    } as any;

    await book.save();

    // Clean up interview state
    if (interviewId && interviewStates.has(interviewId)) {
      interviewStates.delete(interviewId);
    }

    res.status(200).json({
      success: true,
      data: {
        bookId: book._id,
        message: 'Interview saved to book successfully',
      },
    });
  } catch (error: any) {
    console.error('Save interview to book error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save interview to book',
    });
  }
};

/**
 * Cancel/delete interview
 * DELETE /api/interview/:interviewId
 */
export const cancelInterview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { interviewId } = req.params;

    if (interviewId && interviewStates.has(interviewId)) {
      interviewStates.delete(interviewId);
    }

    res.status(200).json({
      success: true,
      message: 'Interview cancelled',
    });
  } catch (error: any) {
    console.error('Cancel interview error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel interview',
    });
  }
};
