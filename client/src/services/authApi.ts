/**
 * Auth API Service
 * Handles authentication-related API calls including email verification
 */

import api from './api';

/**
 * Verify email with code
 */
export const verifyEmail = async (code: string): Promise<{
  isVerified: boolean;
  verifiedAt?: string;
}> => {
  const response = await api.post('/auth/verify-email', { code });
  return response.data.data.emailVerification;
};

/**
 * Resend verification code
 */
export const resendVerificationCode = async (): Promise<void> => {
  await api.post('/auth/resend-verification');
};

/**
 * Get current user data
 */
export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data.data.user;
};
