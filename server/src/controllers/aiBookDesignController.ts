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
  generateCompleteDesignWithImages,
  convertDesignToBookState,
  generateQuickDesignPreview,
  generateTemplateBasedDesign,
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

/**
 * Generate complete AI design with all images (Nano Banana Pro)
 * POST /api/ai/design-complete/:bookId
 */
export const generateCompleteDesign = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { bookId } = req.params;
    const { generateImages = true } = req.body;

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

    // Set AI design state to analyzing
    book.aiDesignState = {
      status: 'analyzing',
      startedAt: new Date(),
      progress: {
        currentStep: 1,
        totalSteps: generateImages ? 6 : 4,
        stepName: 'Analyzing book...',
      },
    };
    await book.save();

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

    // Generate complete design with images
    const design = await generateCompleteDesignWithImages(
      designInput,
      async (progress) => {
        // Update progress in database
        book.aiDesignState = {
          ...book.aiDesignState,
          status: 'generating-design',
          progress,
        };
        await book.save();
      },
      generateImages
    );

    // Convert design to book state format and save
    const designState = convertDesignToBookState(design);
    book.aiDesignState = designState;
    await book.save();

    res.status(200).json({
      success: true,
      message: 'Complete AI design generated successfully',
      data: {
        design,
        bookId,
      },
    });
  } catch (error: any) {
    console.error('Generate complete design error:', error);

    // Update book with error state
    try {
      const { bookId } = req.params;
      await Book.findByIdAndUpdate(bookId, {
        aiDesignState: {
          status: 'error',
          error: error.message,
        },
      });
    } catch (e) {
      console.error('Failed to update error state:', e);
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate complete design',
    });
  }
};

/**
 * Get quick design preview (without generating images)
 * POST /api/ai/design-preview/:bookId
 */
export const getDesignPreview = async (req: AuthRequest, res: Response): Promise<void> => {
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
      synopsis: book.synopsis || book.description,
      chapters: book.chapters.map((ch) => ({
        title: ch.title,
        content: ch.content,
        wordCount: ch.wordCount,
      })),
      targetAudience: book.targetAudience,
    };

    const preview = await generateQuickDesignPreview(designInput);

    res.status(200).json({
      success: true,
      data: { preview },
    });
  } catch (error: any) {
    console.error('Get design preview error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get design preview',
    });
  }
};

/**
 * Get current AI design state
 * GET /api/ai/design-state/:bookId
 */
export const getDesignState = async (req: AuthRequest, res: Response): Promise<void> => {
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
    const book = await Book.findById(bookId).select('aiDesignState author');
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

    res.status(200).json({
      success: true,
      data: {
        aiDesignState: book.aiDesignState || { status: 'idle' },
      },
    });
  } catch (error: any) {
    console.error('Get design state error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get design state',
    });
  }
};

/**
 * Apply AI design state to book layout and cover
 * POST /api/ai/apply-complete-design/:bookId
 */
export const applyCompleteDesign = async (req: AuthRequest, res: Response): Promise<void> => {
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

    // Check if AI design exists
    if (!book.aiDesignState?.design) {
      res.status(400).json({
        success: false,
        error: 'No AI design found. Please generate a design first.',
      });
      return;
    }

    const design = book.aiDesignState.design;

    // Apply typography and layout to pageLayout
    if (design.typography && design.layout) {
      book.pageLayout = {
        bodyFont: design.typography.bodyFont,
        fontSize: design.typography.fontSize,
        lineHeight: design.typography.lineHeight,
        pageSize: 'A5',
        margins: {
          top: design.layout.margins.top,
          bottom: design.layout.margins.bottom,
          left: design.layout.margins.inner,
          right: design.layout.margins.outer,
        },
        includeTableOfContents: true,
        headerFooter: {
          includeHeader: design.layout.headers?.show || false,
          includeFooter: true,
          includePageNumbers: design.layout.pageNumbers?.show ?? true,
          pageNumberPosition: design.layout.pageNumbers?.position === 'bottom-center' ? 'bottom' : 'bottom',
        },
      };
    }

    // Apply cover design
    if (design.covers) {
      book.coverDesign = {
        front: {
          type: design.covers.front?.generatedImageUrl ? 'ai-generated' : 'gradient',
          imageUrl: design.covers.front?.generatedImageUrl,
          backgroundColor: design.covers.front?.backgroundColor,
          gradientColors: design.covers.front?.gradientColors,
          title: {
            text: book.title,
            font: design.typography?.titleFont || 'Playfair Display',
            size: design.covers.front?.title?.fontSize || 48,
            color: design.covers.front?.title?.color || '#ffffff',
            position: { x: 50, y: 40 },
          },
          authorName: {
            text: '', // Will be populated from user
            font: design.typography?.bodyFont || 'Inter',
            size: design.covers.front?.author?.fontSize || 18,
            color: design.covers.front?.author?.color || '#ffffff',
          },
        },
        back: {
          imageUrl: design.covers.back?.generatedImageUrl,
          backgroundColor: design.covers.back?.backgroundColor,
          synopsis: book.synopsis || '',
        },
        spine: {
          width: Math.ceil((book.statistics?.pageCount || 100) / 10) + 5,
          title: book.title,
          author: '',
          backgroundColor: design.covers.spine?.backgroundColor,
        },
      };
    }

    // Apply image placements to pageImages
    if (design.imagePlacements && design.imagePlacements.length > 0) {
      const newPageImages = design.imagePlacements
        .filter((p: any) => p.generatedImageUrl)
        .map((p: any) => ({
          pageIndex: p.chapterIndex * 2 + 1, // Rough page estimate
          url: p.generatedImageUrl,
          x: 10,
          y: p.imagePosition === 'top' ? 10 : p.imagePosition === 'bottom' ? 60 : 35,
          width: p.imageSize === 'large' ? 80 : p.imageSize === 'medium' ? 50 : 30,
          height: p.imageSize === 'large' ? 40 : p.imageSize === 'medium' ? 30 : 20,
          rotation: 0,
          isAiGenerated: true,
          prompt: p.prompt,
          createdAt: new Date(),
        }));

      book.pageImages = [...(book.pageImages || []), ...newPageImages];
    }

    await book.save();

    res.status(200).json({
      success: true,
      message: 'AI design applied successfully',
      data: {
        book: {
          id: book._id,
          pageLayout: book.pageLayout,
          coverDesign: book.coverDesign,
          pageImages: book.pageImages,
        },
      },
    });
  } catch (error: any) {
    console.error('Apply complete design error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to apply design',
    });
  }
};

/**
 * Generate template-based design (quick AI design using templates)
 * POST /api/ai/design/complete
 */
export const generateTemplateDesign = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { bookId, bookTitle, bookGenre, bookSynopsis, language, generateCoverImage } = req.body;

    if (!bookTitle || !bookGenre) {
      res.status(400).json({
        success: false,
        error: 'Book title and genre are required',
      });
      return;
    }

    // If bookId provided, verify ownership
    if (bookId) {
      if (!mongoose.Types.ObjectId.isValid(bookId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid book ID',
        });
        return;
      }

      const book = await Book.findById(bookId).select('author');
      if (book && book.author.toString() !== req.user.id) {
        res.status(403).json({
          success: false,
          error: 'You do not have permission to design this book',
        });
        return;
      }
    }

    // Generate template-based design
    const design = await generateTemplateBasedDesign(
      bookTitle,
      bookGenre,
      bookSynopsis,
      language || 'en',
      generateCoverImage || false
    );

    res.status(200).json({
      success: true,
      data: {
        templateId: design.templateId,
        reasoning: design.reasoning,
        coverPrompt: design.coverPrompt,
        coverImageUrl: design.coverImageUrl,
      },
    });
  } catch (error: any) {
    console.error('Generate template design error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate template design',
    });
  }
};
