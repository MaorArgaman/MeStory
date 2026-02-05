import { Response } from 'express';
import mongoose from 'mongoose';
import { Book } from '../models/Book';
import { AuthRequest } from '../types';
import {
  generateCompleteBookDesign,
  generateTypographyDesign,
  suggestImagePlacements,
  applyDesignToPageLayout,
  applyDesignToCoverDesign,
  BookDesignInput,
  CompleteBookDesign,
} from '../services/aiBookDesignService';

/**
 * Generate complete AI book design
 * POST /api/ai/design-book/:bookId
 */
export const generateBookDesign = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { bookId } = req.params;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Find book with all data
    const book = await Book.findById(bookId).populate('author', 'name');
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Ensure user owns this book
    if (book.author._id?.toString() !== req.user.id && (book.author as any).toString() !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to design this book',
      });
      return;
    }

    // Prepare input for design generation
    const designInput: BookDesignInput = {
      title: book.title,
      authorName: (book.author as any).name || 'Unknown Author',
      genre: book.genre,
      language: book.language || 'en',
      synopsis: book.synopsis || book.description,
      chapters: book.chapters.map((ch) => ({
        title: ch.title,
        content: ch.content,
        wordCount: ch.wordCount,
      })),
      targetAudience: book.targetAudience,
    };

    // Generate complete design
    const design = await generateCompleteBookDesign(designInput);

    res.status(200).json({
      success: true,
      message: 'Book design generated successfully',
      data: {
        design,
        bookId,
      },
    });
  } catch (error: any) {
    console.error('Generate book design error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate book design',
    });
  }
};

/**
 * Apply AI design to book
 * POST /api/ai/apply-design/:bookId
 */
export const applyBookDesign = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { bookId } = req.params;
    const { design, applyTypography, applyLayout, applyCover, applyImageSuggestions } = req.body;

    if (!design) {
      res.status(400).json({
        success: false,
        error: 'Design data is required',
      });
      return;
    }

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Find book
    const book = await Book.findById(bookId);
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Ensure user owns this book
    if (book.author.toString() !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to update this book',
      });
      return;
    }

    const typedDesign = design as CompleteBookDesign;

    // Apply selected design elements
    if (applyTypography || applyLayout) {
      const updatedLayout = applyDesignToPageLayout(typedDesign, book.pageLayout || {});
      book.pageLayout = updatedLayout;
    }

    if (applyCover) {
      const updatedCover = applyDesignToCoverDesign(typedDesign);
      book.coverDesign = updatedCover;
    }

    // Store image suggestions for user to accept/place later
    if (applyImageSuggestions && typedDesign.imagePlacements) {
      // Store in a way that the frontend can use
      if (!book.pageLayout) {
        book.pageLayout = {} as any;
      }
      (book.pageLayout as any).imageSuggestions = typedDesign.imagePlacements;
    }

    await book.save();

    res.status(200).json({
      success: true,
      message: 'Design applied successfully',
      data: {
        book: {
          id: book._id,
          pageLayout: book.pageLayout,
          coverDesign: book.coverDesign,
        },
      },
    });
  } catch (error: any) {
    console.error('Apply book design error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to apply book design',
    });
  }
};

/**
 * Generate only typography design
 * POST /api/ai/design-typography/:bookId
 */
export const generateTypography = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { bookId } = req.params;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Find book
    const book = await Book.findById(bookId).populate('author', 'name');
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Ensure user owns this book
    if (book.author._id?.toString() !== req.user.id && (book.author as any).toString() !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to access this book',
      });
      return;
    }

    const designInput: BookDesignInput = {
      title: book.title,
      authorName: (book.author as any).name || 'Unknown Author',
      genre: book.genre,
      language: book.language || 'en',
      synopsis: book.synopsis,
      chapters: book.chapters.map((ch) => ({
        title: ch.title,
        content: ch.content,
        wordCount: ch.wordCount,
      })),
      targetAudience: book.targetAudience,
    };

    const typography = await generateTypographyDesign(designInput);

    res.status(200).json({
      success: true,
      data: { typography },
    });
  } catch (error: any) {
    console.error('Generate typography error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate typography',
    });
  }
};

/**
 * Get image placement suggestions
 * POST /api/ai/suggest-images/:bookId
 */
export const getImageSuggestions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { bookId } = req.params;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Find book
    const book = await Book.findById(bookId).populate('author', 'name');
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Ensure user owns this book
    if (book.author._id?.toString() !== req.user.id && (book.author as any).toString() !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to access this book',
      });
      return;
    }

    const designInput: BookDesignInput = {
      title: book.title,
      authorName: (book.author as any).name || 'Unknown Author',
      genre: book.genre,
      language: book.language || 'en',
      synopsis: book.synopsis,
      chapters: book.chapters.map((ch) => ({
        title: ch.title,
        content: ch.content,
        wordCount: ch.wordCount,
      })),
    };

    const suggestions = await suggestImagePlacements(designInput);

    res.status(200).json({
      success: true,
      data: { suggestions },
    });
  } catch (error: any) {
    console.error('Get image suggestions error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get image suggestions',
    });
  }
};

/**
 * Generate contextual image based on text position
 * POST /api/ai/generate-contextual-image
 */
export const generateContextualImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { bookId, chapterIndex, textBefore, customPrompt } = req.body;

    if (!bookId || chapterIndex === undefined) {
      res.status(400).json({
        success: false,
        error: 'Book ID and chapter index are required',
      });
      return;
    }

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Find book
    const book = await Book.findById(bookId);
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Ensure user owns this book
    if (book.author.toString() !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to access this book',
      });
      return;
    }

    // Get the chapter
    if (chapterIndex < 0 || chapterIndex >= book.chapters.length) {
      res.status(400).json({
        success: false,
        error: 'Invalid chapter index',
      });
      return;
    }

    const chapter = book.chapters[chapterIndex];
    const contextText = textBefore || chapter.content.slice(0, 1500);

    // Import image generation service
    const { generateImage } = await import('../services/imageGenerationService');

    // Generate image based on context
    const result = await generateImage({
      prompt: customPrompt || `Illustration for book chapter: ${contextText.slice(0, 500)}`,
      bookContext: {
        title: book.title,
        genre: book.genre,
        chapterTitle: chapter.title,
        sceneDescription: contextText.slice(0, 500),
      },
      style: 'illustration',
      aspectRatio: '4:3',
    });

    if (!result.success) {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to generate image',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        imageUrl: result.imageUrl,
        prompt: result.prompt,
        enhancedPrompt: result.enhancedPrompt,
      },
    });
  } catch (error: any) {
    console.error('Generate contextual image error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate contextual image',
    });
  }
};
