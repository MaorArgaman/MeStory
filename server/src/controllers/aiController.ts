import { Request, Response } from 'express';
import { generateContinuations, analyzeTextQuality, generateBookTitles, generateSynopsis, generateCoverColorScheme, generateBookCover, translateChapter } from '../services/geminiService';
import { Book } from '../models/Book';

// UUID validation regex for Supabase IDs
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

    // Validate UUID format
    if (!UUID_REGEX.test(bookId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid bookId format',
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

/**
 * POST /api/ai/translate-chapter
 * Translate a single chapter from Hebrew to English or vice versa
 */
export const translateChapterContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, title, targetLanguage } = req.body;

    // Validation
    if (!content || !title) {
      res.status(400).json({
        success: false,
        message: 'content and title are required',
      });
      return;
    }

    if (!targetLanguage || !['hebrew', 'english'].includes(targetLanguage)) {
      res.status(400).json({
        success: false,
        message: 'targetLanguage must be "hebrew" or "english"',
      });
      return;
    }

    // Translate chapter using Gemini AI
    const translation = await translateChapter(content, title, targetLanguage);

    res.status(200).json({
      success: true,
      data: {
        translatedContent: translation.translatedContent,
        translatedTitle: translation.translatedTitle,
        targetLanguage,
      },
    });
  } catch (error) {
    console.error('Error translating chapter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to translate chapter',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    });
  }
};

/**
 * POST /api/ai/translate-book/:bookId
 * Translate an entire book (all chapters) from Hebrew to English or vice versa
 */
export const translateBook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookId } = req.params;
    const { targetLanguage } = req.body;

    // Validation
    if (!bookId) {
      res.status(400).json({
        success: false,
        message: 'bookId is required',
      });
      return;
    }

    if (!UUID_REGEX.test(bookId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid bookId format',
      });
      return;
    }

    if (!targetLanguage || !['hebrew', 'english'].includes(targetLanguage)) {
      res.status(400).json({
        success: false,
        message: 'targetLanguage must be "hebrew" or "english"',
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
        message: 'Book must have at least one chapter to translate',
      });
      return;
    }

    // Translate book title
    const titleTranslation = await translateChapter(book.title, book.title, targetLanguage);

    // Translate all chapters
    const translatedChapters = [];
    for (const chapter of book.chapters) {
      const translation = await translateChapter(
        chapter.content || '',
        chapter.title || `Chapter ${chapter.order}`,
        targetLanguage
      );
      translatedChapters.push({
        _id: chapter._id,
        order: chapter.order,
        title: translation.translatedTitle,
        content: translation.translatedContent,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        translatedTitle: titleTranslation.translatedTitle,
        translatedChapters,
        targetLanguage,
        sourceLanguage: targetLanguage === 'hebrew' ? 'english' : 'hebrew',
      },
    });
  } catch (error) {
    console.error('Error translating book:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to translate book',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    });
  }
};
