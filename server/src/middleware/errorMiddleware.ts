import { Request, Response, NextFunction } from 'express';

/**
 * Global Error Handling Middleware
 * Catches all async errors and returns structured JSON responses
 */

interface CustomError extends Error {
  status?: number;
  statusCode?: number;
  errors?: any[];
}

/**
 * Async handler wrapper to catch promise rejections
 * Use this to wrap async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Global error handler middleware
 * Must be placed after all routes in server.ts
 */
export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // SEC-010 FIX: Sanitize sensitive data before logging
  const sanitizeBody = (body: any): any => {
    if (!body || typeof body !== 'object') return body;
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard', 'cvv'];
    const sanitized = { ...body };
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    return sanitized;
  };

  // Log error for debugging
  console.error('❌ Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    body: process.env.NODE_ENV === 'development' ? sanitizeBody(req.body) : undefined,
  });

  // Determine status code
  const statusCode = err.status || err.statusCode || 500;

  // Build error response - hide internal error messages from users in production
  const isProduction = process.env.NODE_ENV === 'production';
  const errorResponse: any = {
    success: false,
    error: (isProduction && statusCode === 500) ? 'Internal server error' : (err.message || 'Internal server error'),
  };

  // Add stack trace in development mode
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.path = req.path;
    errorResponse.method = req.method;
  }

  // Add validation errors if present
  if (err.errors && Array.isArray(err.errors)) {
    errorResponse.errors = err.errors;
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    errorResponse.error = 'Validation failed';
    errorResponse.details = err.message;
  }

  if (err.name === 'CastError') {
    errorResponse.error = 'Invalid ID format';
  }

  if (err.name === 'JsonWebTokenError') {
    errorResponse.error = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    errorResponse.error = 'Token expired';
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 * Must be placed after all routes but before error handler
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  const error: CustomError = new Error(`Route not found: ${req.method} ${req.path}`);
  error.status = 404;
  next(error);
};

/**
 * Validation error helper
 * Creates a structured validation error
 */
export const createValidationError = (message: string, errors?: any[]) => {
  const error: CustomError = new Error(message);
  error.status = 400;
  error.name = 'ValidationError';
  if (errors) {
    error.errors = errors;
  }
  return error;
};

/**
 * Authentication error helper
 */
export const createAuthError = (message: string = 'Authentication required') => {
  const error: CustomError = new Error(message);
  error.status = 401;
  return error;
};

/**
 * Authorization error helper
 */
export const createAuthorizationError = (message: string = 'Access denied') => {
  const error: CustomError = new Error(message);
  error.status = 403;
  return error;
};

/**
 * Not found error helper
 */
export const createNotFoundError = (resource: string = 'Resource') => {
  const error: CustomError = new Error(`${resource} not found`);
  error.status = 404;
  return error;
};
