import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * OAuth Success Callback Page
 * Handles the redirect after successful Google OAuth login
 */
export default function AuthSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      console.error('No token received from OAuth');
      navigate('/login?error=no_token');
      return;
    }

    // Store token and fetch user info
    const handleAuth = async () => {
      try {
        await loginWithToken(token);

        // Redirect to dashboard
        navigate('/dashboard');
      } catch (error) {
        console.error('Auth error:', error);
        navigate('/login?error=auth_failed');
      }
    };

    handleAuth();
  }, [searchParams, navigate, loginWithToken]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-deep-space">
      <div className="text-center">
        <Loader2 className="w-16 h-16 animate-spin text-magic-gold mx-auto mb-4" />
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
