/**
 * TTS Controller
 * Handles text-to-speech API endpoints for book narration
 */

import { Response } from 'express';
import mongoose from 'mongoose';
import { Book } from '../models/Book';
import { AuthRequest } from '../types';
import {
  generateSpeech,
  generateChapterNarration,
  getAvailableVoices,
  prepareTextForTTS,
  splitIntoSentences,
  estimateDuration,
  TTSProvider,
} from '../services/ttsService';

/**
 * Get available voices for a language
 * GET /api/tts/voices
 */
export const getVoices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { language = 'he', provider } = req.query;

    const voices = getAvailableVoices(
      language as string,
      provider as TTSProvider | undefined
    );

    res.status(200).json({
      success: true,
      data: {
        voices,
        availableProviders: ['browser', 'google', 'elevenlabs'],
      },
    });
  } catch (error: any) {
    console.error('Get voices error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get voices',
    });
  }
};

/**
 * Generate speech for a text
 * POST /api/tts/synthesize
 */
export const synthesizeSpeech = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { text, language = 'he', voice, speed = 1.0, provider = 'browser' } = req.body;

    if (!text || text.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'Text is required',
      });
      return;
    }

    // Limit text length to prevent abuse
    if (text.length > 10000) {
      res.status(400).json({
        success: false,
        error: 'Text too long. Maximum 10,000 characters.',
      });
      return;
    }

    const result = await generateSpeech({
      text,
      language,
      voice,
      speed,
      provider,
    });

    if (!result.success) {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to generate speech',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        audioUrl: result.audioUrl,
        audioDuration: result.audioDuration,
        provider: result.provider,
        estimatedDuration: estimateDuration(text, language, speed),
      },
    });
  } catch (error: any) {
    console.error('Synthesize speech error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to synthesize speech',
    });
  }
};

/**
 * Generate narration for a book chapter
 * POST /api/tts/narrate-chapter/:bookId/:chapterIndex
 */
export const narrateChapter = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { bookId, chapterIndex } = req.params;
    const { voice, speed = 1.0, provider = 'browser' } = req.body;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    const chapterIdx = parseInt(chapterIndex, 10);
    if (isNaN(chapterIdx) || chapterIdx < 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid chapter index',
      });
      return;
    }

    // Find book
    const book = await Book.findById(bookId).select('chapters language');
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Check chapter exists
    if (chapterIdx >= book.chapters.length) {
      res.status(400).json({
        success: false,
        error: 'Chapter not found',
      });
      return;
    }

    const chapter = book.chapters[chapterIdx];
    const language = book.language || 'he';

    // Generate narration
    const result = await generateChapterNarration(
      chapter.content,
      language,
      provider as TTSProvider,
      voice
    );

    if (!result.success) {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to generate narration',
      });
      return;
    }

    // Prepare text for client-side TTS if using browser
    const plainText = prepareTextForTTS(chapter.content);
    const sentences = splitIntoSentences(plainText);

    res.status(200).json({
      success: true,
      data: {
        audioUrl: result.audioUrl,
        provider: result.provider,
        chapterTitle: chapter.title,
        plainText,
        sentences,
        estimatedDuration: estimateDuration(plainText, language, speed),
        language,
      },
    });
  } catch (error: any) {
    console.error('Narrate chapter error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to narrate chapter',
    });
  }
};

/**
 * Get prepared text for client-side TTS (no server-side generation)
 * GET /api/tts/prepare/:bookId/:chapterIndex
 */
export const prepareChapterText = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { bookId, chapterIndex } = req.params;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    const chapterIdx = parseInt(chapterIndex, 10);
    if (isNaN(chapterIdx) || chapterIdx < 0) {
      res.status(400).json({
        success: false,
        error: 'Invalid chapter index',
      });
      return;
    }

    // Find book
    const book = await Book.findById(bookId).select('chapters language title');
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Check chapter exists
    if (chapterIdx >= book.chapters.length) {
      res.status(400).json({
        success: false,
        error: 'Chapter not found',
      });
      return;
    }

    const chapter = book.chapters[chapterIdx];
    const language = book.language || 'he';

    // Prepare text for TTS
    const plainText = prepareTextForTTS(chapter.content);
    const sentences = splitIntoSentences(plainText);

    res.status(200).json({
      success: true,
      data: {
        bookTitle: book.title,
        chapterTitle: chapter.title,
        chapterIndex: chapterIdx,
        plainText,
        sentences,
        language,
        estimatedDuration: estimateDuration(plainText, language),
        totalChapters: book.chapters.length,
      },
    });
  } catch (error: any) {
    console.error('Prepare chapter text error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to prepare chapter text',
    });
  }
};
