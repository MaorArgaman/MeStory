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
  getPublicBooks,
  likeBook,
  addReview,
  getBookReviews,
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
} from '../controllers/bookController';
import { upload, uploadImage, uploadAudio as uploadAudioMiddleware } from '../middleware/uploadMiddleware';
import { authenticate } from '../middleware/auth';
import { runValidation } from '../middleware/validate';
import {
  createBookValidation,
  updateBookValidation,
  mongoIdValidation,
} from '../middleware/validators';

const router = Router();

/**
 * Section 14.2: Books API Endpoints
 */

// Public routes (no authentication required)
// GET /api/books/public - Get all published books for marketplace
router.get('/public', getPublicBooks as any);

// GET /api/books/:id/reviews - Get all reviews for a book
router.get('/:id/reviews', runValidation(mongoIdValidation), getBookReviews as any);

// Apply authentication to all remaining book routes
router.use(authenticate as any);

// GET /api/books - List user books
router.get('/', getBooks as any);

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

// GET /api/books/:id/export - Export book as PDF
router.get(
  '/:id/export',
  runValidation(mongoIdValidation),
  exportBookPDF as any
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

export default router;
