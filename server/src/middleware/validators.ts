import { body, param } from 'express-validator';

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

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
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
    .isMongoId()
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
 * Validation rules for MongoDB ID parameter
 */
export const mongoIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
];
