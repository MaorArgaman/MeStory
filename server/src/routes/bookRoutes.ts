import { Router } from 'express';
import {
  createBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
  publishBook,
  purchaseBook,
  exportBookPDF,
  exportBookPDFAsync,
  getPublicBooks,
  getPublicBookById,
  likeBook,
  addReview,
  updateReview,
  deleteReview,
  getBookReviews,
  addMention,
  removeMention,
  getBookMentions,
  uploadCoverImage,
  uploadManuscript,
  uploadAudio,
  getPricingStrategy,
  exportBookToFormat,
  uploadPageImage,
  updatePageImage,
  deletePageImage,
  getPageImages,
  updatePageImages,
  shareBook,
  getBookSocialStats,
  recordBookView,
} from '../controllers/bookController';
import {
  diagnoseBookImages,
  repersistBookImages,
} from '../controllers/imageDiagnosticController';
import { upload, uploadImage, uploadAudio as uploadAudioMiddleware } from '../middleware/uploadMiddleware';
import { authenticate } from '../middleware/auth';
import { runValidation } from '../middleware/validate';
import {
  createBookValidation,
  updateBookValidation,
  mongoIdValidation,
  listBooksValidation,
  publicBooksValidation,
} from '../middleware/validators';

const router = Router();

/**
 * Section 14.2: Books API Endpoints
 */

// Public routes (no authentication required)
// GET /api/books/public - Get all published books for marketplace
router.get('/public', runValidation(publicBooksValidation), getPublicBooks as any);

// GET /api/books/public/:id - Get a single published book by ID
router.get('/public/:id', runValidation(mongoIdValidation), getPublicBookById as any);

// GET /api/books/:id/reviews - Get all reviews for a book
router.get('/:id/reviews', runValidation(mongoIdValidation), getBookReviews as any);

// GET /api/books/:id/mentions - Get all mentions for a book (public)
router.get('/:id/mentions', runValidation(mongoIdValidation), getBookMentions as any);

// POST /api/books/:id/view - Record a book view (public)
router.post('/:id/view', runValidation(mongoIdValidation), recordBookView as any);

// Apply authentication to all remaining book routes
router.use(authenticate as any);

// GET /api/books - List user books
router.get('/', runValidation(listBooksValidation), getBooks as any);

// POST /api/books - Create book
router.post(
  '/',
  runValidation(createBookValidation),
  createBook as any
);

// POST /api/books/upload - Upload manuscript file and create book
router.post(
  '/upload',
  upload.single('manuscript'),
  uploadManuscript as any
);

// POST /api/books/upload-audio - Upload and transcribe audio file
router.post(
  '/upload-audio',
  uploadAudioMiddleware.single('audio'),
  uploadAudio as any
);

// GET /api/books/:id - Get book by ID
router.get(
  '/:id',
  runValidation(mongoIdValidation),
  getBookById as any
);

// PUT /api/books/:id - Update book
router.put(
  '/:id',
  runValidation(updateBookValidation),
  updateBook as any
);

// DELETE /api/books/:id - Delete book
router.delete(
  '/:id',
  runValidation(mongoIdValidation),
  deleteBook as any
);

// POST /api/books/:id/publish - Publish book
router.post(
  '/:id/publish',
  runValidation(mongoIdValidation),
  publishBook as any
);

// POST /api/books/:id/purchase - Purchase a book
router.post(
  '/:id/purchase',
  runValidation(mongoIdValidation),
  purchaseBook as any
);

// GET /api/books/:id/export - Export book as PDF (sync, streams PDF in response)
router.get(
  '/:id/export',
  runValidation(mongoIdValidation),
  exportBookPDF as any
);

// POST /api/books/:id/export-async - Start PDF export as background job
// Returns { jobId } immediately; client polls /api/jobs/:id for progress and downloadUrl
router.post(
  '/:id/export-async',
  runValidation(mongoIdValidation),
  exportBookPDFAsync as any
);

// GET /api/books/:id/image-diagnostic - Report every image URL saved on the book
// and whether it is still reachable. Used to debug "my AI images disappeared".
router.get(
  '/:id/image-diagnostic',
  runValidation(mongoIdValidation),
  diagnoseBookImages as any
);

// POST /api/books/:id/repersist-images - Migrate any reachable image URLs
// on this book to permanent Supabase Storage so they can't expire again.
router.post(
  '/:id/repersist-images',
  runValidation(mongoIdValidation),
  repersistBookImages as any
);

// POST /api/books/:id/like - Toggle like on a book
router.post(
  '/:id/like',
  runValidation(mongoIdValidation),
  likeBook as any
);

// POST /api/books/:id/share - Track book share
router.post(
  '/:id/share',
  runValidation(mongoIdValidation),
  shareBook as any
);

// GET /api/books/:id/social-stats - Get book social statistics
router.get(
  '/:id/social-stats',
  runValidation(mongoIdValidation),
  getBookSocialStats as any
);

// POST /api/books/:id/review - Add a review to a book
router.post(
  '/:id/review',
  runValidation(mongoIdValidation),
  addReview as any
);

// PUT /api/books/:id/review - Update user's review
router.put(
  '/:id/review',
  runValidation(mongoIdValidation),
  updateReview as any
);

// DELETE /api/books/:id/review - Delete user's review
router.delete(
  '/:id/review',
  runValidation(mongoIdValidation),
  deleteReview as any
);

// POST /api/books/:id/mention - Add a mention to a book
router.post(
  '/:id/mention',
  runValidation(mongoIdValidation),
  addMention as any
);

// DELETE /api/books/:id/mention/:userId - Remove a mention from a book
router.delete(
  '/:id/mention/:userId',
  removeMention as any
);

// POST /api/books/:id/upload-cover - Upload cover image
router.post(
  '/:id/upload-cover',
  uploadImage.single('cover'),
  uploadCoverImage as any
);

// GET /api/books/:id/pricing-strategy - Get AI pricing strategy
router.get(
  '/:id/pricing-strategy',
  runValidation(mongoIdValidation),
  getPricingStrategy as any
);

// GET /api/books/:id/export/:format - Export book to PDF or DOCX
router.get(
  '/:id/export/:format',
  runValidation(mongoIdValidation),
  exportBookToFormat as any
);

// === Page Image Routes for Book Layout ===

// GET /api/books/:id/page-images - Get all page images
router.get(
  '/:id/page-images',
  runValidation(mongoIdValidation),
  getPageImages as any
);

// POST /api/books/:id/page-image - Upload a new page image
router.post(
  '/:id/page-image',
  uploadImage.single('image'),
  uploadPageImage as any
);

// PUT /api/books/:id/page-images - Batch update page images (for auto-save)
router.put(
  '/:id/page-images',
  runValidation(mongoIdValidation),
  updatePageImages as any
);

// PUT /api/books/:id/page-image/:imageId - Update single page image position/size
router.put(
  '/:id/page-image/:imageId',
  updatePageImage as any
);

// DELETE /api/books/:id/page-image/:imageId - Delete a page image
router.delete(
  '/:id/page-image/:imageId',
  deletePageImage as any
);

// GET /api/books/:id/contribute-info - Public: get basic book info for contribution page
router.get('/:id/contribute-info', async (req: any, res: any) => {
  try {
    const { Book } = await import('../models/Book');
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }
    // Return minimal public info
    res.status(200).json({
      success: true,
      data: {
        title: book.title,
        author: (book as any).authorName || 'Anonymous',
        genre: book.genre,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/books/:id/contributions - Public: submit a memory/contribution
router.post('/:id/contributions', async (req: any, res: any) => {
  try {
    const { Book } = await import('../models/Book');
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    const { memory, contributorName, relationship, token } = req.body;

    if (!memory && !req.file) {
      return res.status(400).json({ success: false, error: 'Memory or image required' });
    }
    if (!contributorName) {
      return res.status(400).json({ success: false, error: 'Name required' });
    }

    // Add contribution to book's pending contributions
    const contribution = {
      id: `contrib-${Date.now()}`,
      memory: memory || '',
      contributorName,
      relationship: relationship || 'other',
      imageUrl: null, // TODO: handle image upload
      status: 'pending', // pending | approved | rejected
      createdAt: new Date().toISOString(),
    };

    const contributions = (book as any).contributions || [];
    contributions.push(contribution);

    await Book.findByIdAndUpdate(req.params.id, {
      contributions,
    } as any);

    res.status(201).json({
      success: true,
      message: 'Contribution submitted',
    });
  } catch (error: any) {
    console.error('Failed to save contribution:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/books/:id/contributions - Authenticated: get contributions for book owner
router.get('/:id/contributions', authenticate as any, async (req: any, res: any) => {
  try {
    const { Book } = await import('../models/Book');
    const book = await Book.findById(req.params.id);
    if (!book || book.author !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    res.status(200).json({
      success: true,
      data: (book as any).contributions || [],
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
