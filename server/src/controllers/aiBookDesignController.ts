import { randomUUID } from 'crypto';
import { Response } from 'express';
import { Book } from '../models/Book';
import { User } from '../models/User';

// UUID validation function for Supabase
const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// Helper to get author name from user ID
const getAuthorName = async (authorId: string): Promise<string> => {
  const user = await User.findById(authorId);
  return user?.name || 'Unknown Author';
};
import { AuthRequest } from '../types';
import { enqueueJob, runJobInBackground, failJob } from '../services/jobQueue';
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
import {
  generateUltimatePremiumDesign,
  convertPremiumDesignToBookState,
  BookDesignInput as PremiumBookDesignInput,
  PremiumCompleteDesign,
} from '../services/premiumDesignService';

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
    if (!isValidUUID(bookId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Find book with all data
    const book = await Book.findByIdForDesign(bookId);
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Ensure user owns this book
    if (book.author !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to design this book',
      });
      return;
    }

    // Prepare input for design generation
    const designInput: BookDesignInput = {
      title: book.title,
      authorName: await getAuthorName(book.author),
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
    if (!isValidUUID(bookId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Find book
    const book = await Book.findByIdForDesign(bookId);
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Ensure user owns this book
    if (book.author !== req.user.id) {
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
    let pageLayoutUpdate = book.pageLayout || {};
    if (applyImageSuggestions && typedDesign.imagePlacements) {
      // Store in a way that the frontend can use
      (pageLayoutUpdate as any).imageSuggestions = typedDesign.imagePlacements;
    }

    // Build update object
    const updateData: any = {};
    if (applyTypography || applyLayout) {
      updateData.pageLayout = pageLayoutUpdate;
    }
    if (applyCover) {
      updateData.coverDesign = book.coverDesign;
    }

    const updatedBook = await Book.findByIdAndUpdate(bookId, updateData, { new: true });

    res.status(200).json({
      success: true,
      message: 'Design applied successfully',
      data: {
        book: {
          id: updatedBook?.id,
          pageLayout: updatedBook?.pageLayout,
          coverDesign: updatedBook?.coverDesign,
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
    if (!isValidUUID(bookId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Find book
    const book = await Book.findByIdForDesign(bookId);
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Ensure user owns this book
    if (book.author !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to access this book',
      });
      return;
    }

    const designInput: BookDesignInput = {
      title: book.title,
      authorName: await getAuthorName(book.author),
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
    if (!isValidUUID(bookId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Find book
    const book = await Book.findByIdForDesign(bookId);
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Ensure user owns this book
    if (book.author !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to access this book',
      });
      return;
    }

    const designInput: BookDesignInput = {
      title: book.title,
      authorName: await getAuthorName(book.author),
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
    if (!isValidUUID(bookId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Find book
    const book = await Book.findByIdForDesign(bookId);
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Ensure user owns this book
    if (book.author !== req.user.id) {
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
    if (!isValidUUID(bookId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Find book with all data
    const book = await Book.findByIdForDesign(bookId);
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Ensure user owns this book
    if (book.author !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to design this book',
      });
      return;
    }

    // Set AI design state to analyzing
    await Book.findByIdAndUpdate(bookId, {
      aiDesignState: {
        status: 'analyzing',
        startedAt: new Date(),
        progress: {
          currentStep: 1,
          totalSteps: generateImages ? 6 : 4,
          stepName: 'Analyzing book...',
        },
      },
    });

    // Prepare input for design generation
    const designInput: BookDesignInput = {
      title: book.title,
      authorName: await getAuthorName(book.author),
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
        await Book.findByIdAndUpdate(bookId, {
          aiDesignState: {
            status: 'generating-design',
            progress,
          },
        });
      },
      generateImages
    );

    // Convert design to book state format and save
    const designState = convertDesignToBookState(design);
    await Book.findByIdAndUpdate(bookId, { aiDesignState: designState });

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
 * Async complete design via background job.
 * POST /api/ai/design-complete-async/:bookId
 *
 * Returns { jobId } immediately. Client polls /api/jobs/:jobId for progress.
 * Heavy work (AI design + image generation) runs in the background and the
 * existing book.aiDesignState is still updated as progress advances, so the
 * existing UI components that watch that state continue to work unchanged.
 */
export const generateCompleteDesignAsync = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { bookId } = req.params;
    const { generateImages = true } = req.body;

    if (!isValidUUID(bookId)) {
      res.status(400).json({ success: false, error: 'Invalid book ID' });
      return;
    }

    const book = await Book.findByIdForDesign(bookId);
    if (!book) {
      res.status(404).json({ success: false, error: 'Book not found' });
      return;
    }
    if (book.author !== req.user.id) {
      res.status(403).json({ success: false, error: 'You do not have permission to design this book' });
      return;
    }

    // Snapshot fields we need — req.user may not be available after response
    const userId = req.user.id;
    const bookSnapshot = {
      title: book.title,
      genre: book.genre,
      language: book.language || 'en',
      synopsis: book.synopsis || book.description,
      chapters: book.chapters.map((ch: any) => ({
        title: ch.title,
        content: ch.content,
        wordCount: ch.wordCount,
      })),
      targetAudience: book.targetAudience,
      authorId: book.author,
    };

    const job = await enqueueJob({
      userId,
      bookId,
      type: 'design_generation',
      input: { generateImages, title: book.title },
    });

    runJobInBackground(job.id, async ({ updateProgress }) => {
      await updateProgress(5, 'Analyzing book...');

      const designInput: BookDesignInput = {
        title: bookSnapshot.title,
        authorName: await getAuthorName(bookSnapshot.authorId),
        genre: bookSnapshot.genre,
        language: bookSnapshot.language,
        synopsis: bookSnapshot.synopsis,
        chapters: bookSnapshot.chapters,
        targetAudience: bookSnapshot.targetAudience,
      };

      // Mirror existing aiDesignState updates so current UI keeps working
      await Book.findByIdAndUpdate(bookId, {
        aiDesignState: {
          status: 'analyzing',
          startedAt: new Date(),
          progress: {
            currentStep: 1,
            totalSteps: generateImages ? 6 : 4,
            stepName: 'Analyzing book...',
          },
        },
      });

      const design = await generateCompleteDesignWithImages(
        designInput,
        async (progress: any) => {
          // Forward progress to both the book row and the job row
          await Book.findByIdAndUpdate(bookId, {
            aiDesignState: { status: 'generating-design', progress },
          });
          if (progress?.currentStep && progress?.totalSteps) {
            const pct = 10 + Math.round((progress.currentStep / progress.totalSteps) * 80);
            await updateProgress(pct, progress.stepName);
          }
        },
        generateImages
      );

      await updateProgress(95, 'Finalizing design...');
      const designState = convertDesignToBookState(design);
      await Book.findByIdAndUpdate(bookId, { aiDesignState: designState });

      return { bookId, design };
    });

    res.status(202).json({
      success: true,
      data: {
        jobId: job.id,
        status: 'pending',
        pollUrl: `/api/jobs/${job.id}`,
      },
    });
  } catch (error: any) {
    console.error('Async generate complete design error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start design generation',
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
    if (!isValidUUID(bookId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Find book
    const book = await Book.findByIdForDesign(bookId);
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Ensure user owns this book
    if (book.author !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to access this book',
      });
      return;
    }

    const designInput: BookDesignInput = {
      title: book.title,
      authorName: await getAuthorName(book.author),
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
    if (!isValidUUID(bookId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Find book
    const book = await Book.findByIdForDesign(bookId);
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Ensure user owns this book
    if (book.author !== req.user.id) {
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
    if (!isValidUUID(bookId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Find book
    const book = await Book.findByIdForDesign(bookId);
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Ensure user owns this book
    if (book.author !== req.user.id) {
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
    let pageImagesUpdate = book.pageImages || [];
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

      pageImagesUpdate = [...pageImagesUpdate, ...newPageImages];
    }

    const updatedBook = await Book.findByIdAndUpdate(
      bookId,
      {
        pageLayout: book.pageLayout,
        coverDesign: book.coverDesign,
        pageImages: pageImagesUpdate,
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'AI design applied successfully',
      data: {
        book: {
          id: updatedBook?.id,
          pageLayout: updatedBook?.pageLayout,
          coverDesign: updatedBook?.coverDesign,
          pageImages: updatedBook?.pageImages,
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
 * AI Design Wizard - One-click complete book design
 * POST /api/ai/design-wizard/:bookId
 *
 * This endpoint creates a complete professional book design including:
 * - Typography (fonts, sizes, colors)
 * - Layout (margins, spacing, headers, page numbers)
 * - Front cover with AI-generated image
 * - Back cover with synopsis
 * - Interior image suggestions
 */
export const designWizard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { bookId } = req.params;
    const { generateInteriorImages = false } = req.body;

    // Validate MongoDB ID
    if (!isValidUUID(bookId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Find book with all data
    const book = await Book.findByIdForDesign(bookId);
    if (!book) {
      res.status(404).json({
        success: false,
        error: 'Book not found',
      });
      return;
    }

    // Ensure user owns this book
    if (book.author !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'You do not have permission to design this book',
      });
      return;
    }

    // Calculate total steps based on options
    const totalSteps = generateInteriorImages ? 8 : 6;
    const stepNames = [
      'Analyzing book content...',
      'Generating typography design...',
      'Creating layout settings...',
      'Designing cover concept...',
      'Generating front cover image...',
      'Creating back cover design...',
      ...(generateInteriorImages ? ['Generating interior images...', 'Finalizing design...'] : ['Finalizing design...']),
    ];

    // Initialize design state
    await Book.findByIdAndUpdate(bookId, {
      aiDesignState: {
        status: 'analyzing',
        startedAt: new Date(),
        progress: {
          currentStep: 1,
          totalSteps,
          stepName: stepNames[0],
        },
      },
    });

    // Prepare design input
    const designInput: BookDesignInput = {
      title: book.title,
      authorName: await getAuthorName(book.author),
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

    // Helper to update progress
    const updateProgress = async (step: number) => {
      await Book.findByIdAndUpdate(bookId, {
        aiDesignState: {
          status: step === totalSteps ? 'completed' : 'generating-design',
          progress: {
            currentStep: step,
            totalSteps,
            stepName: stepNames[step - 1] || 'Processing...',
          },
        },
      });
    };

    // Step 1: Analyze book
    await updateProgress(1);

    // Step 2-6: Generate complete design with images
    const design = await generateCompleteDesignWithImages(
      designInput,
      async (progress) => {
        // Map internal progress to wizard steps
        const wizardStep = Math.min(progress.currentStep + 1, totalSteps - 1);
        await updateProgress(wizardStep);
      },
      true // Always generate cover images in wizard mode
    );

    // Final step: Save completed design
    await updateProgress(totalSteps);

    console.log('🧙 Design Wizard: Converting design to book state...');

    // Also apply design to book's coverDesign and pageLayout
    if (design.typography && design.layout) {
      book.pageLayout = {
        bodyFont: design.typography.bodyFont,
        fontSize: design.typography.fontSize || 14,
        lineHeight: design.typography.lineHeight || 1.6,
        pageSize: 'A5',
        margins: {
          top: design.layout.margins?.top || 60,
          bottom: design.layout.margins?.bottom || 60,
          left: design.layout.margins?.inner || 50,
          right: design.layout.margins?.outer || 50,
        },
        includeTableOfContents: true,
        headerFooter: {
          includeHeader: design.layout.headerStyle !== 'none',
          includeFooter: true,
          includePageNumbers: design.layout.pageNumberPosition !== 'none',
          pageNumberPosition: 'bottom',
        },
      };
    }

    if (design.covers || design.cover) {
      const coverData = design.cover; // Original cover design with colors
      console.log('🧙 Design Wizard: Applying cover design to book...');
      console.log(`🧙 design.covers.frontImageUrl: ${design.covers?.frontImageUrl ? 'SET' : 'UNDEFINED'}`);

      book.coverDesign = {
        front: {
          type: design.covers?.frontImageUrl ? 'ai-generated' : 'gradient',
          imageUrl: design.covers?.frontImageUrl,
          backgroundColor: coverData?.front?.colorPalette?.[0] || '#1a1a2e',
          gradientColors: coverData?.front?.colorPalette,
          title: {
            text: book.title,
            font: design.typography?.titleFont || 'Playfair Display',
            size: coverData?.front?.title?.size || 48,
            color: coverData?.front?.title?.color || '#ffffff',
            position: { x: 50, y: 40 },
          },
          authorName: {
            text: await getAuthorName(book.author),
            font: design.typography?.bodyFont || 'Inter',
            size: coverData?.front?.author?.size || 18,
            color: coverData?.front?.author?.color || '#ffffff',
          },
        },
        back: {
          imageUrl: design.covers?.backImageUrl,
          backgroundColor: coverData?.back?.backgroundColor || '#1a1a2e',
          synopsis: book.synopsis || book.description || '',
        },
        spine: {
          width: Math.ceil((book.statistics?.pageCount || 100) / 10) + 5,
          title: book.title,
          author: await getAuthorName(book.author),
          backgroundColor: coverData?.spine?.backgroundColor || '#1a1a2e',
        },
      };

      console.log(`🧙 Final book.coverDesign.front.imageUrl: ${book.coverDesign.front?.imageUrl ? 'SET' : 'UNDEFINED'}`);
      console.log(`🧙 Final book.coverDesign.front.type: ${book.coverDesign.front?.type}`);
    }

    // Convert and save design state with all updates
    const designState = convertDesignToBookState(design);
    const finalAiDesignState = {
      ...designState,
      status: 'completed',
      completedAt: new Date(),
    };

    const updatedBook = await Book.findByIdAndUpdate(
      bookId,
      {
        aiDesignState: finalAiDesignState,
        pageLayout: book.pageLayout,
        coverDesign: book.coverDesign,
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'AI Design Wizard completed successfully!',
      data: {
        bookId,
        design: updatedBook?.aiDesignState?.design,
        coverDesign: updatedBook?.coverDesign,
        pageLayout: updatedBook?.pageLayout,
        completedAt: updatedBook?.aiDesignState?.completedAt,
      },
    });
  } catch (error: any) {
    console.error('Design Wizard error:', error);

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
      error: error.message || 'Design Wizard failed',
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
      if (!isValidUUID(bookId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid book ID',
        });
        return;
      }

      const book = await Book.findByIdForDesign(bookId);
      if (book && book.author !== req.user.id) {
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

/**
 * ULTIMATE PREMIUM DESIGN - "עצב לי הכל" Feature
 * POST /api/ai/premium-design/:bookId
 *
 * Creates the highest quality AI-powered book design including:
 * - Deep theme analysis for understanding book essence
 * - Premium typography with perfect font pairing and rich colors
 * - Unique background colors and styled text
 * - Beautiful table of contents design
 * - Chapter decorations and ornaments
 * - Page numbering, headers, footers
 * - Drop caps and section breaks
 * - Strategic image placements with AI-generated images
 * - Professional cover design with AI-generated front/back images
 * - All design elements saved to database
 */
export const premiumDesignWizard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { bookId } = req.params;
    const {
      generateCoverImages = true,
      generateInteriorImages = true,
      maxInteriorImages = 5,
    } = req.body;

    // Validate book ID — pure CPU check, no I/O, safe to do before responding
    if (!isValidUUID(bookId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid book ID',
      });
      return;
    }

    // Create job row FIRST so the client can always find it when polling.
    const jobId = randomUUID();
    const userId = req.user.id;

    try {
      await enqueueJob({
        id: jobId,
        userId,
        bookId,
        type: 'design_generation',
        input: { generateCoverImages, generateInteriorImages, maxInteriorImages },
      });
    } catch (err) {
      console.error(`[premiumDesignWizard] enqueueJob failed — jobId=${jobId}`, err);
      res.status(500).json({ success: false, error: 'Failed to create design job' });
      return;
    }

    // Job row exists — safe to respond 202 and let the client poll
    res.status(202).json({ success: true, data: { jobId, status: 'pending' } });

    // All heavy work runs after the response is sent
    const totalSteps = generateInteriorImages ? 9 : 7;
    const stepNames = [
      'מנתח את תוכן הספר...',
      'יוצר מערכת טיפוגרפיה מקצועית...',
      'מעצב תוכן עניינים...',
      'יוצר עיצוב פרקים...',
      'מעצב פריסת עמודים...',
      'יוצר עיצוב כריכה...',
      'מייצר תמונות כריכה עם AI...',
      ...(generateInteriorImages ? ['מנתח מיקומי תמונות...', 'מייצר איורים פנימיים...'] : []),
    ];

    // Fire-and-forget: book lookup + AI work runs after the 202 response is sent
    (async () => {
      const book = await Book.findByIdForDesign(bookId);
      if (!book) {
        console.error(`[premiumDesignWizard] Book not found in background — bookId=${bookId}`);
        await failJob(jobId, 'Book not found');
        return;
      }
      if (book.author !== userId) {
        console.error(`[premiumDesignWizard] Permission denied in background — book.author=${book.author} userId=${userId}`);
        await failJob(jobId, 'Permission denied');
        return;
      }

      // Mark book as in-progress (best-effort)
      Book.findByIdAndUpdate(bookId, {
        aiDesignState: {
          status: 'analyzing',
          startedAt: new Date().toISOString(),
          jobId,
          progress: { currentStep: 1, totalSteps, stepName: 'מנתח את תוכן הספר...' },
        },
      }).catch((err: unknown) => console.error('[premiumDesignWizard] Failed to update book aiDesignState:', err));

      runJobInBackground(jobId, async ({ updateProgress }) => {
      // Prepare design input
      const designInput: PremiumBookDesignInput = {
        title: book.title,
        authorName: await getAuthorName(book.author),
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

      console.log(`\n🌟 Starting PREMIUM DESIGN (job ${jobId}) for "${book.title}"...`);

      // Generate ultimate premium design
      const premiumDesign = await generateUltimatePremiumDesign(
        designInput,
        async (progress) => {
          const stepIndex = progress.currentStep - 1;
          const pct = Math.round((progress.currentStep / progress.totalSteps) * 90);
          await Promise.all([
            updateProgress(pct, stepNames[stepIndex] || progress.stepName),
            Book.findByIdAndUpdate(bookId, {
              aiDesignState: {
                status: 'generating-design',
                jobId,
                progress: {
                  currentStep: progress.currentStep,
                  totalSteps: progress.totalSteps,
                  stepName: stepNames[stepIndex] || progress.stepName,
                },
              },
            }),
          ]);
        },
        { generateCoverImages, generateInteriorImages, maxInteriorImages }
      );

      // Convert design to book state format
      const designState = convertPremiumDesignToBookState(premiumDesign);

      // Build page layout
      const newPageLayout = {
        bodyFont: premiumDesign.typography.bodyFont,
        fontSize: premiumDesign.typography.fontSize,
        lineHeight: premiumDesign.typography.lineHeight,
        pageSize: premiumDesign.layout.pageSize as 'A4' | 'A5' | 'Letter' | 'Custom',
        margins: {
          top: premiumDesign.layout.margins.top,
          bottom: premiumDesign.layout.margins.bottom,
          left: premiumDesign.layout.margins.inner,
          right: premiumDesign.layout.margins.outer,
        },
        includeTableOfContents: true,
        tableOfContentsStyle: premiumDesign.tableOfContents.style,
        headerFooter: {
          includeHeader: premiumDesign.layout.headers.enabled,
          includeFooter: premiumDesign.layout.footers.enabled,
          includePageNumbers: premiumDesign.layout.pageNumbering.enabled,
          pageNumberPosition: premiumDesign.layout.pageNumbering.position.includes('bottom') ? 'bottom' : 'top' as 'top' | 'bottom' | 'none',
        },
        textColor: premiumDesign.typography.colors.text,
        titleFont: premiumDesign.typography.titleFont,
        headerFont: premiumDesign.typography.headingFont,
        accentColor: premiumDesign.typography.colors.accent,
        backgroundColor: premiumDesign.layout.background.primaryColor,
        columns: premiumDesign.layout.columns,
        paragraphIndent: premiumDesign.typography.formatting.firstParagraphIndent ? 20 : 0,
        paragraphSpacing: premiumDesign.typography.paragraphSpacing,
        settings: {
          premiumDesign: {
            theme: premiumDesign.theme,
            typography: premiumDesign.typography,
            tableOfContents: premiumDesign.tableOfContents,
            chapterDecoration: premiumDesign.chapterDecoration,
            layout: premiumDesign.layout,
            imagePlacements: premiumDesign.imagePlacements,
            overallStyle: premiumDesign.overallStyle,
            qualityScore: premiumDesign.qualityScore,
          },
        },
      };

      // Build cover design
      const authorName = await getAuthorName(book.author);
      const newCoverDesign = {
        front: {
          type: premiumDesign.covers.frontImageUrl ? 'ai-generated' : 'gradient' as 'ai-generated' | 'uploaded' | 'gradient' | 'solid',
          imageUrl: premiumDesign.covers.frontImageUrl,
          backgroundColor: premiumDesign.cover.front.colorPalette[0] || '#1a1a2e',
          gradientColors: premiumDesign.cover.front.colorPalette,
          title: {
            text: book.title,
            font: premiumDesign.cover.front.title.font,
            size: premiumDesign.cover.front.title.size,
            color: premiumDesign.cover.front.title.color,
            position: premiumDesign.cover.front.title.position,
          },
          subtitle: premiumDesign.cover.front.subtitle,
          authorName: {
            text: authorName,
            font: premiumDesign.cover.front.author.font,
            size: premiumDesign.cover.front.author.size,
            color: premiumDesign.cover.front.author.color,
          },
        },
        back: {
          imageUrl: premiumDesign.covers.backImageUrl,
          backgroundColor: premiumDesign.cover.back.backgroundColor,
          synopsis: book.synopsis || book.description || '',
          authorBio: premiumDesign.cover.back.authorBio?.text,
        },
        spine: {
          width: Math.ceil((book.statistics?.pageCount || 100) / 10) + 5,
          title: book.title,
          author: authorName,
          backgroundColor: premiumDesign.cover.spine.backgroundColor,
        },
      };

      // Build page images
      const newPageImages = premiumDesign.generatedImages.map((img, idx) => ({
        _id: `premium-${Date.now()}-${idx}`,
        pageIndex: img.chapterIndex * 2 + 1,
        url: img.imageUrl,
        x: 10,
        y: img.position === 'chapter-start' ? 10 : img.position === 'chapter-end' ? 60 : 35,
        width: 80,
        height: 40,
        rotation: 0,
        isAiGenerated: true,
        prompt: img.prompt,
        createdAt: new Date().toISOString(),
      }));

      const allPageImages = [...(book.pageImages || []), ...newPageImages];

      // Save everything to the database
      const updatedBook = await Book.findByIdAndUpdate(
        bookId,
        {
          aiDesignState: {
            ...designState,
            status: 'completed',
            jobId,
            completedAt: new Date().toISOString(),
          },
          pageLayout: newPageLayout,
          coverDesign: newCoverDesign,
          pageImages: allPageImages,
        },
        { new: true }
      );

      console.log(`\n✅ PREMIUM DESIGN SAVED (job ${jobId}) for "${book.title}"!`);

      // Return the result payload — the job queue stores it and the client reads it on poll
      return {
        bookId,
        qualityScore: premiumDesign.qualityScore,
        theme: premiumDesign.theme,
        typography: {
          bodyFont: premiumDesign.typography.bodyFont,
          headingFont: premiumDesign.typography.headingFont,
          colors: premiumDesign.typography.colors,
        },
        tableOfContents: premiumDesign.tableOfContents,
        chapterDecoration: premiumDesign.chapterDecoration,
        layout: {
          pageSize: premiumDesign.layout.pageSize,
          chapterStartStyle: premiumDesign.layout.chapterStartStyle,
          pageNumbering: premiumDesign.layout.pageNumbering,
          background: premiumDesign.layout.background,
        },
        covers: {
          frontImageUrl: premiumDesign.covers.frontImageUrl,
          backImageUrl: premiumDesign.covers.backImageUrl,
        },
        imagePlacements: premiumDesign.imagePlacements.length,
        generatedImages: premiumDesign.generatedImages.length,
        overallStyle: premiumDesign.overallStyle,
        pageLayout: updatedBook?.pageLayout,
        coverDesign: updatedBook?.coverDesign,
      };
    });
    })().catch((err: unknown) => {
      console.error('[premiumDesignWizard] Background IIFE failed:', err);
    });

  } catch (error: any) {
    // This catch only handles synchronous errors before the response was sent
    // (e.g., book not found, auth failures). At this point res.status(202) has
    // already been sent, so we cannot send another response — just log.
    console.error('Premium Design Wizard synchronous error:', error);
  }
};
