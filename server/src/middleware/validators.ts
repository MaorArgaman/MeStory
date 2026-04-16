import { body, param, query } from 'express-validator';

/**
 * SECURITY: Whitelist of memorial book genres. Keep in sync with client genres.
 */
const MEMORIAL_GENRES = [
  'fallen_soldier',
  'life_story',
  'family_legacy',
  'tribute',
  'holocaust_survivor',
  'shared_memories',
  'letters_and_words',
  'testimony',
  'collaborative',
];

/**
 * SECURITY: Whitelist of sortable book fields. Matches ALLOWED_SORT_FIELDS in Book.ts.
 */
const ALLOWED_BOOK_SORT = [
  'createdAt',
  'updatedAt',
  'title',
  'genre',
  'qualityScore',
  'wordCount',
  'readingTime',
  'views',
  'likesCount',
  'purchaseCount',
  'rating',
  'publishedAt',
  'price',
  'quality',
  'popularity',
];

/**
 * Validation rules for user registration
 */
export const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  // BUG-031: Strong password validation requiring special characters
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
];

/**
 * Validation rules for user login
 */
export const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

/**
 * Validation rules for creating a book
 */
export const createBookValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Book title is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),

  body('genre')
    .trim()
    .notEmpty()
    .withMessage('Genre is required'),

  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),

  body('language')
    .optional()
    .isLength({ min: 2, max: 5 })
    .withMessage('Language code must be 2-5 characters'),
];

/**
 * Validation rules for updating a book
 */
export const updateBookValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid book ID'),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),

  body('genre')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Genre cannot be empty'),

  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),

  body('synopsis')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Synopsis must not exceed 5000 characters'),

  body('chapters')
    .optional()
    .isArray()
    .withMessage('Chapters must be an array'),

  body('chapters.*.title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Chapter title is required'),

  body('chapters.*.content')
    .optional()
    .notEmpty()
    .withMessage('Chapter content is required'),

  body('chapters.*.order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Chapter order must be a non-negative integer'),

  body('characters')
    .optional()
    .isArray()
    .withMessage('Characters must be an array'),

  body('characters.*.name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Character name is required'),
];

/**
 * Validation rules for UUID parameter (Supabase)
 */
export const uuidValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
];

// Alias for backwards compatibility
export const mongoIdValidation = uuidValidation;

/**
 * SECURITY: Validation rules for book listing queries.
 * Enforces whitelists on sortBy/order to prevent ORDER BY injection,
 * and caps search/limit to prevent ReDoS and resource exhaustion.
 */
export const listBooksValidation = [
  query('sortBy')
    .optional()
    .isString()
    .isIn(ALLOWED_BOOK_SORT)
    .withMessage('Invalid sort field'),

  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be "asc" or "desc"'),

  query('genre')
    .optional()
    .isString()
    .isLength({ max: 50 })
    .withMessage('Invalid genre'),

  query('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Invalid status'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('Limit must be between 1 and 100'),

  query('offset')
    .optional()
    .isInt({ min: 0 })
    .toInt()
    .withMessage('Offset must be non-negative'),
];

/**
 * SECURITY: Validation rules for the public marketplace query.
 * Search input is length-capped; escaping still happens at the model layer.
 */
export const publicBooksValidation = [
  ...listBooksValidation,

  query('search')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Search query too long')
    .trim(),

  query('category')
    .optional()
    .isString()
    .isLength({ max: 50 })
    .withMessage('Invalid category'),
];

/**
 * SECURITY: Validation rules for user search.
 * Minimum 2 chars to prevent enumerating every user, max 50 to prevent ReDoS.
 */
export const userSearchValidation = [
  query('q')
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Search query must be 2-50 characters'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .toInt(),
];
