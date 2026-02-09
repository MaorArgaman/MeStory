/**
 * Chat Interview Controller
 * Handles API endpoints for AI chat-based interviews
 */

import { Response } from 'express';
import { AuthRequest } from '../types';
import {
  createInterview,
  getInterview,
  deleteInterview,
  generateFirstMessage,
  processUserMessage,
  generateSummary,
  getInterviewProgress,
  canCompleteEarly,
} from '../services/chatInterviewService';

/**
 * Start a new AI interview
 * POST /api/ai/interview/start
 */
export const startInterview = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { genre, targetAudience } = req.body;

    // Create interview state
    const state = createInterview(genre, targetAudience);

    // Generate first AI message
    const firstMessage = await generateFirstMessage(state);

    res.status(200).json({
      success: true,
      data: {
        state: {
          id: state.id,
          currentTopic: state.currentTopic,
          questionsAsked: state.questionsAsked,
          messages: state.messages,
          isComplete: state.isComplete,
          progress: getInterviewProgress(state),
          canCompleteEarly: canCompleteEarly(state),
        },
        firstMessage,
      },
    });
  } catch (error: any) {
    console.error('Error starting interview:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start interview',
    });
  }
};

/**
 * Send a message and get AI response
 * POST /api/ai/interview/:id/message
 */
export const sendMessage = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Message is required',
      });
      return;
    }

    // Get interview state
    const state = getInterview(id);

    if (!state) {
      res.status(404).json({
        success: false,
        error: 'Interview not found',
      });
      return;
    }

    if (state.isComplete) {
      res.status(400).json({
        success: false,
        error: 'Interview is already complete',
      });
      return;
    }

    // Process message and get AI response
    const result = await processUserMessage(state, message);

    res.status(200).json({
      success: true,
      data: {
        state: {
          id: result.state.id,
          currentTopic: result.state.currentTopic,
          questionsAsked: result.state.questionsAsked,
          messages: result.state.messages,
          isComplete: result.state.isComplete,
          progress: getInterviewProgress(result.state),
          canCompleteEarly: canCompleteEarly(result.state),
        },
        aiMessage: result.aiMessage,
        topicTransition: result.topicTransition,
      },
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process message',
    });
  }
};

/**
 * Get interview state
 * GET /api/ai/interview/:id/state
 */
export const getInterviewState = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const state = getInterview(id);

    if (!state) {
      res.status(404).json({
        success: false,
        error: 'Interview not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: state.id,
        currentTopic: state.currentTopic,
        questionsAsked: state.questionsAsked,
        messages: state.messages,
        isComplete: state.isComplete,
        progress: getInterviewProgress(state),
        canCompleteEarly: canCompleteEarly(state),
      },
    });
  } catch (error: any) {
    console.error('Error getting interview state:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get interview state',
    });
  }
};

/**
 * Complete interview and get summary
 * POST /api/ai/interview/:id/complete
 */
export const completeInterview = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const state = getInterview(id);

    if (!state) {
      res.status(404).json({
        success: false,
        error: 'Interview not found',
      });
      return;
    }

    // Generate summary
    const summary = await generateSummary(state);

    // Mark as complete
    state.isComplete = true;

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error('Error completing interview:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to complete interview',
    });
  }
};

/**
 * Cancel/delete interview
 * DELETE /api/ai/interview/:id
 */
export const cancelInterview = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const state = getInterview(id);

    if (!state) {
      res.status(404).json({
        success: false,
        error: 'Interview not found',
      });
      return;
    }

    deleteInterview(id);

    res.status(200).json({
      success: true,
      message: 'Interview cancelled',
    });
  } catch (error: any) {
    console.error('Error cancelling interview:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel interview',
    });
  }
};
