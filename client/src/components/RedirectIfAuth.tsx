import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * Redirects authenticated users to dashboard
 * Use this to wrap public pages like login/register/landing
 */
export default function RedirectIfAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-deep-space">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (user) {
    // User is logged in, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
