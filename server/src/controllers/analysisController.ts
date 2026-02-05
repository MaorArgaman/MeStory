/**
 * Analysis Controller
 * Handlers for AI text enhancement and analysis endpoints
 */

import { Request, Response } from 'express';
import {
  enhanceSelectedText,
  EnhanceAction,
  EnhanceContext,
} from '../services/textEnhancementService';
import { Book } from '../models/Book';

/**
 * POST /api/analysis/enhance-text
 * Enhance selected text with AI
 */
export const enhanceText = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, action, context } = req.body;

    // Validation
    if (!text) {
      res.status(400).json({
        success: false,
        message: 'text is required',
      });
      return;
    }

    if (!action || !['improve', 'expand', 'shorten', 'continue'].includes(action)) {
      res.status(400).json({
        success: false,
        message: 'action must be one of: improve, expand, shorten, continue',
      });
      return;
    }

    if (text.length < 10) {
      res.status(400).json({
        success: false,
        message: 'text must be at least 10 characters',
      });
      return;
    }

    if (text.length > 5000) {
      res.status(400).json({
        success: false,
        message: 'text must be less than 5000 characters',
      });
      return;
    }

    // Build context
    const enhanceContext: EnhanceContext = {
      genre: context?.genre || 'general',
      bookTitle: context?.bookTitle,
      chapterTitle: context?.chapterTitle,
      surroundingText: context?.surroundingText,
    };

    // If bookId provided, fetch voice interview context
    if (context?.bookId) {
      try {
        const book = await Book.findById(context.bookId);
        if (book?.storyContext?.voiceInterview?.summary) {
          enhanceContext.voiceInterview = book.storyContext.voiceInterview.summary;
        }
      } catch (bookError) {
        // Continue without voice interview context
        console.warn('Could not fetch book context:', bookError);
      }
    }

    // Enhance text
    const result = await enhanceSelectedText(text, action as EnhanceAction, enhanceContext);

    res.status(200).json({
      success: true,
      data: {
        originalText: text,
        enhancedText: result.enhanced,
        explanation: result.explanation,
        action,
      },
    });
  } catch (error) {
    console.error('Error enhancing text:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enhance text',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    });
  }
};

/**
 * POST /api/analysis/plot-structure/:bookId
 * Analyze book plot structure (three-act)
 */
export const analyzePlotStructure = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookId } = req.params;

    // Fetch book
    const book = await Book.findById(bookId);
    if (!book) {
      res.status(404).json({
        success: false,
        message: 'Book not found',
      });
      return;
    }

    if (!book.chapters || book.chapters.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Book must have at least one chapter for plot analysis',
      });
      return;
    }

    // Import and call plot analysis service (will be created later)
    const { analyzePlotStructure: analyzeStructure } = await import('../services/plotAnalysisService');
    const analysis = await analyzeStructure(book);

    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Error analyzing plot structure:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze plot structure',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    });
  }
};

/**
 * POST /api/analysis/tension/:bookId
 * Analyze book tension levels
 */
export const analyzeTension = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookId } = req.params;

    // Fetch book
    const book = await Book.findById(bookId);
    if (!book) {
      res.status(404).json({
        success: false,
        message: 'Book not found',
      });
      return;
    }

    if (!book.chapters || book.chapters.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Book must have at least one chapter for tension analysis',
      });
      return;
    }

    // Import and call tension analysis service (will be created later)
    const { analyzeTension: analyzeTensionLevels } = await import('../services/tensionAnalysisService');
    const analysis = await analyzeTensionLevels(book);

    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Error analyzing tension:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze tension',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    });
  }
};

/**
 * POST /api/analysis/techniques/:bookId
 * Analyze writing techniques in book
 */
export const analyzeWritingTechniques = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookId } = req.params;

    // Fetch book
    const book = await Book.findById(bookId);
    if (!book) {
      res.status(404).json({
        success: false,
        message: 'Book not found',
      });
      return;
    }

    if (!book.chapters || book.chapters.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Book must have at least one chapter for techniques analysis',
      });
      return;
    }

    // Import and call techniques analysis (will be part of plot service)
    const { analyzeWritingTechniques: analyzeTechniques } = await import('../services/plotAnalysisService');
    const analysis = await analyzeTechniques(book);

    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Error analyzing writing techniques:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze writing techniques',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    });
  }
};

/**
 * POST /api/analysis/guidance
 * Check for writing guidance alerts
 */
export const checkWritingGuidance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookId, chapterIndex, recentText } = req.body;

    // Validation
    if (!bookId || chapterIndex === undefined || !recentText) {
      res.status(400).json({
        success: false,
        message: 'bookId, chapterIndex, and recentText are required',
      });
      return;
    }

    // Fetch book
    const book = await Book.findById(bookId);
    if (!book) {
      res.status(404).json({
        success: false,
        message: 'Book not found',
      });
      return;
    }

    // Import and call guidance service (will be created later)
    const { checkGuidance } = await import('../services/writingGuidanceService');
    const guidance = await checkGuidance(book, chapterIndex, recentText);

    res.status(200).json({
      success: true,
      data: {
        guidance, // null if no guidance needed
      },
    });
  } catch (error) {
    console.error('Error checking writing guidance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check writing guidance',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    });
  }
};

/**
 * POST /api/analysis/score-change
 * Calculate score change after AI suggestion applied
 */
export const calculateScoreChange = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookId, chapterIndex, previousText, newText } = req.body;

    // Validation
    if (!previousText || !newText) {
      res.status(400).json({
        success: false,
        message: 'previousText and newText are required',
      });
      return;
    }

    // Import quality analysis from gemini service
    const { analyzeTextQuality } = await import('../services/geminiService');

    // Analyze both texts
    const [previousAnalysis, newAnalysis] = await Promise.all([
      analyzeTextQuality(previousText),
      analyzeTextQuality(newText),
    ]);

    // Calculate delta
    const delta = newAnalysis.overallScore - previousAnalysis.overallScore;

    // Calculate breakdown per category
    const breakdown = Object.keys(previousAnalysis.scores).map((key) => ({
      category: key,
      previousValue: (previousAnalysis.scores as any)[key],
      newValue: (newAnalysis.scores as any)[key],
      delta: (newAnalysis.scores as any)[key] - (previousAnalysis.scores as any)[key],
    }));

    // Generate improvement summary
    const improvements = breakdown
      .filter(b => b.delta > 0)
      .map(b => `${b.category}: +${b.delta}`);

    res.status(200).json({
      success: true,
      data: {
        previousScore: previousAnalysis.overallScore,
        newScore: newAnalysis.overallScore,
        delta,
        breakdown,
        improvements,
        newRating: newAnalysis.rating,
        newRatingLabel: newAnalysis.ratingLabel,
      },
    });
  } catch (error) {
    console.error('Error calculating score change:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate score change',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    });
  }
};
