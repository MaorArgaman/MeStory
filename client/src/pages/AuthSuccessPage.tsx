import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Loader2 } from 'lucide-react';
import { logger } from '../utils/logger';

/**
 * OAuth Success Callback Page
 * Handles the redirect after successful Google OAuth login
 * SEC-002 FIX: Token is now retrieved from HTTP-only cookie via API
 */
export default function AuthSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    // Store token and fetch user info
    const handleAuth = async () => {
      try {
        // First try to get token from URL (legacy support)
        let token = searchParams.get('token');

        // SEC-002 FIX: If no token in URL, fetch from secure cookie endpoint
        if (!token) {
          try {
            const response = await api.get('/auth/token', { withCredentials: true });
            if (response.data.success && response.data.token) {
              token = response.data.token;
            }
          } catch (e) {
            // No token in cookie either
          }
        }

        if (!token) {
          // BUG-055 FIX: Use logger instead of console.error
          logger.error('No token received from OAuth');
          navigate('/login?error=no_token');
          return;
        }

        await loginWithToken(token);

        // Redirect to dashboard
        navigate('/dashboard');
      } catch (error) {
        // BUG-055 FIX: Use logger instead of console.error
        logger.error('Auth error:', error);
        navigate('/login?error=auth_failed');
      }
    };

    handleAuth();
  }, [searchParams, navigate, loginWithToken]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-deep-space">
      <div className="text-center">
        <Loader2 className="w-16 h-16 animate-spin text-memorial-gold mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-white mb-2">
          Completing Sign In...
        </h2>
        <p className="text-gray-400">
          Please wait while we set up your account
        </p>
      </div>
    </div>
  );
}
