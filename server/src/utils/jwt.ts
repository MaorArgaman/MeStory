import jwt from 'jsonwebtoken';
import { UserRole } from '../models/User';

// JWT payload interface
export interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
}

// Get JWT secret from environment
const getJWTSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return secret;
};

/**
 * Generate JWT token
 * Section 17.1: JWT tokens with 60-day expiry
 */
export const generateToken = (payload: JWTPayload): string => {
  const secret = getJWTSecret();

  return jwt.sign(payload, secret, {
    expiresIn: '60d',
    issuer: 'mestory-api',
  });
};

/**
 * Verify JWT token
 * Returns decoded payload if valid, throws error if invalid
 */
export const verifyToken = (token: string): JWTPayload => {
  const secret = getJWTSecret();

  try {
    const decoded = jwt.verify(token, secret, {
      issuer: 'mestory-api',
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
};

/**
 * Decode token without verification (for debugging)
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
};
