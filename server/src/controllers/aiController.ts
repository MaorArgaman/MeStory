import { Request, Response } from 'express';
import { generateContinuations, analyzeTextQuality, generateBookTitles, generateSynopsis, generateCoverColorScheme, generateBookCover } from '../services/geminiService';
import { Book } from '../models/Book';

/**
 * POST /api/ai/suggestions
 * Generate writing continuation suggestions
 */
export const getSuggestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentText, genre, context } = req.body;

    // Validation
    if (!currentText || !genre) {
      res.status(400).json({
        success: false,
        message: 'currentText and genre are required',
      });
      return;
    }

    if (currentText.length < 50) {
      res.status(400).json({
        success: false,
        message: 'currentText must be at least 50 characters',
      });
      return;
    }

    // Generate suggestions using Gemini AI
    const suggestions = await generateContinuations(currentText, genre, context);

    res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate suggestions',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    });
  }
};

/**
 * POST /api/ai/analyze
 * Analyze text quality and get scores
 */
export const analyzeChapter = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text } = req.body;

    // Validation
    if (!text) {
      res.status(400).json({
        success: false,
        message: 'text is required',
      });
      return;
    }

    if (text.length < 100) {
      res.status(400).json({
        success: false,
        message: 'text must be at least 100 characters for analysis',
      });
      return;
    }

    // Analyze text using Gemini AI
    const analysis = await analyzeTextQuality(text);

    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Error analyzing text:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze text',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    });
  }
};

/**
 * POST /api/ai/generate-titles
 * Generate book title suggestions based on genre
 */
export const generateTitles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { genre, count = 5 } = req.body;

    // Validation
    if (!genre) {
      res.status(400).json({
        success: false,
        message: 'genre is required',
      });
      return;
    }

    if (count < 1 || count > 10) {
      res.status(400).json({
        success: false,
        message: 'count must be between 1 and 10',
      });
      return;
    }

    // Generate titles using Gemini AI
    const titles = await generateBookTitles(genre, count);

    res.status(200).json({
      success: true,
      data: {
        titles,
        genre,
      },
    });
  } catch (error) {
    console.error('Error generating titles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate titles',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    });
  }
};

/**
 * POST /api/ai/generate-synopsis
 * Generate compelling synopsis for book marketplace
 */
export const generateBookSynopsis = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookId } = req.body;

    // Validation
    if (!bookId) {
      res.status(400).json({
        success: false,
        message: 'bookId is required',
      });
      return;
    }

    // Fetch book with chapters
    const book = await Book.findById(bookId);
    if (!book) {
      res.status(404).json({
        success: false,
        message: 'Book not found',
      });
      return;
    }

    // Validate book has content
    if (!book.chapters || book.chapters.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Book must have at least one chapter to generate synopsis',
      });
      return;
    }

    // Generate synopsis using Gemini AI
    const synopsis = await generateSynopsis(
      book.title,
      book.genre,
      book.chapters.map((ch: any) => ({
        title: ch.title,
        content: ch.content,
      }))
    );

    res.status(200).json({
      success: true,
      data: {
        synopsis,
      },
    });
  } catch (error) {
    console.error('Error generating synopsis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate synopsis',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    });
  }
};

/**
 * POST /api/ai/generate-cover-colors
 * Generate AI color scheme for book cover
 */
export const generateCoverColors = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, genre, mood } = req.body;

    // Validation
    if (!title || !genre) {
      res.status(400).json({
        success: false,
        message: 'title and genre are required',
      });
      return;
    }

    // Generate color scheme using Gemini AI
    const colorScheme = await generateCoverColorScheme(title, genre, mood);

    res.status(200).json({
      success: true,
      data: colorScheme,
    });
  } catch (error) {
    console.error('Error generating color scheme:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate color scheme',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    });
  }
};

/**
 * POST /api/ai/generate-cover
 * Generate AI-powered book cover design
 */
export const generateCover = async (req: Request, res: Response): Promise<void> => {
  try {
    const { synopsis, genre, title } = req.body;

    // Validation
    if (!synopsis || !genre || !title) {
      res.status(400).json({
        success: false,
        message: 'synopsis, genre, and title are required',
      });
      return;
    }

    // Generate cover design using Gemini AI
    const coverDesign = await generateBookCover(synopsis, genre, title);

    res.status(200).json({
      success: true,
      data: coverDesign,
    });
  } catch (error) {
    console.error('Error generating cover:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate cover design',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    });
  }
};
