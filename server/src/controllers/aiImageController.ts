import { Response } from 'express';
import mongoose from 'mongoose';
import { Book } from '../models/Book';
import { AuthRequest } from '../types';
import {
  generateImage,
  generateImageVariations,
  generateBookIllustration,
  generateEnhancedPrompt,
  ImageGenerationRequest,
} from '../services/imageGenerationService';

/**
 * Generate AI image for book page
 * POST /api/ai/generate-image
 */
export const generateAIImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { prompt, bookId, style, aspectRatio, pageIndex } = req.body;

    if (!prompt) {
      res.status(400).json({
        success: false,
        error: 'Prompt is required',
      });
      return;
    }

    // Build request
    const imageRequest: ImageGenerationRequest = {
      prompt,
      style: style || 'illustration',
      aspectRatio: aspectRatio || '1:1',
    };

    // Add book context if bookId is provided
    if (bookId && mongoose.Types.ObjectId.isValid(bookId)) {
      const book = await Book.findById(bookId);
      if (book && book.author.toString() === req.user.id) {
        imageRequest.bookContext = {
          title: book.title,
          genre: book.genre,
        };
      }
    }

    // Generate the image
    const result = await generateImage(imageRequest);

    if (!result.success) {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to generate image',
      });
      return;
    }

    // If bookId and pageIndex are provided, save the image to the book
    if (bookId && pageIndex !== undefined && mongoose.Types.ObjectId.isValid(bookId)) {
      const book = await Book.findById(bookId);
      if (book && book.author.toString() === req.user.id) {
        // Initialize pageImages array if it doesn't exist
        if (!book.pageImages) {
          book.pageImages = [];
        }

        // Add the generated image
        book.pageImages.push({
          pageIndex: parseInt(pageIndex, 10),
          url: result.imageUrl!,
          x: 10,
          y: 10,
          width: 40,
          height: 40,
          rotation: 0,
          isAiGenerated: true,
          prompt: result.enhancedPrompt || prompt,
          createdAt: new Date(),
        } as any);

        await book.save();
      }
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
    console.error('AI image generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate image',
    });
  }
};

/**
 * Generate multiple AI image variations
 * POST /api/ai/generate-variations
 */
export const generateAIImageVariations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { prompt, bookId, style, aspectRatio, count } = req.body;

    if (!prompt) {
      res.status(400).json({
        success: false,
        error: 'Prompt is required',
      });
      return;
    }

    // Build request
    const imageRequest: ImageGenerationRequest = {
      prompt,
      style: style || 'illustration',
      aspectRatio: aspectRatio || '1:1',
    };

    // Add book context if bookId is provided
    if (bookId && mongoose.Types.ObjectId.isValid(bookId)) {
      const book = await Book.findById(bookId);
      if (book && book.author.toString() === req.user.id) {
        imageRequest.bookContext = {
          title: book.title,
          genre: book.genre,
        };
      }
    }

    // Generate variations
    const results = await generateImageVariations(imageRequest, count || 4);

    const successfulResults = results.filter((r) => r.success);

    res.status(200).json({
      success: true,
      data: {
        images: successfulResults.map((r) => ({
          imageUrl: r.imageUrl,
          prompt: r.prompt,
          enhancedPrompt: r.enhancedPrompt,
        })),
        totalGenerated: successfulResults.length,
      },
    });
  } catch (error: any) {
    console.error('AI image variations error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate image variations',
    });
  }
};

/**
 * Generate AI illustration based on chapter content
 * POST /api/ai/generate-illustration/:bookId/:chapterIndex
 */
export const generateChapterIllustration = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { bookId, chapterIndex } = req.params;
    const { style, pageIndex } = req.body;

    // Validate bookId
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

    // Get chapter
    const chapterIdx = parseInt(chapterIndex, 10);
    if (chapterIdx < 0 || chapterIdx >= book.chapters.length) {
      res.status(400).json({
        success: false,
        error: 'Invalid chapter index',
      });
      return;
    }

    const chapter = book.chapters[chapterIdx];

    // Generate illustration based on chapter content
    const result = await generateBookIllustration(
      chapter.content,
      {
        title: book.title,
        genre: book.genre,
        chapterTitle: chapter.title,
      },
      style || 'illustration'
    );

    if (!result.success) {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to generate illustration',
      });
      return;
    }

    // Save image to book if pageIndex is provided
    if (pageIndex !== undefined) {
      if (!book.pageImages) {
        book.pageImages = [];
      }

      book.pageImages.push({
        pageIndex: parseInt(pageIndex, 10),
        url: result.imageUrl!,
        x: 10,
        y: 10,
        width: 50,
        height: 40,
        rotation: 0,
        isAiGenerated: true,
        prompt: result.enhancedPrompt || result.prompt,
        createdAt: new Date(),
      } as any);

      await book.save();
    }

    res.status(200).json({
      success: true,
      data: {
        imageUrl: result.imageUrl,
        prompt: result.prompt,
        enhancedPrompt: result.enhancedPrompt,
        chapterTitle: chapter.title,
      },
    });
  } catch (error: any) {
    console.error('Chapter illustration error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate illustration',
    });
  }
};

/**
 * Preview enhanced prompt without generating image
 * POST /api/ai/preview-prompt
 */
export const previewEnhancedPrompt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { prompt, bookId, style } = req.body;

    if (!prompt) {
      res.status(400).json({
        success: false,
        error: 'Prompt is required',
      });
      return;
    }

    // Build request
    const imageRequest: ImageGenerationRequest = {
      prompt,
      style: style || 'illustration',
    };

    // Add book context if bookId is provided
    if (bookId && mongoose.Types.ObjectId.isValid(bookId)) {
      const book = await Book.findById(bookId);
      if (book && book.author.toString() === req.user.id) {
        imageRequest.bookContext = {
          title: book.title,
          genre: book.genre,
        };
      }
    }

    // Generate enhanced prompt
    const enhancedPrompt = await generateEnhancedPrompt(imageRequest);

    res.status(200).json({
      success: true,
      data: {
        originalPrompt: prompt,
        enhancedPrompt,
      },
    });
  } catch (error: any) {
    console.error('Preview prompt error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to enhance prompt',
    });
  }
};
