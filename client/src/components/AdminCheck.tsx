import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, AlertTriangle } from 'lucide-react';

interface AdminCheckProps {
  children: React.ReactNode;
}

/**
 * AdminCheck component
 * Ensures only users with admin role can access protected routes
 * Must be used inside RequireAuth wrapper
 */
export default function AdminCheck({ children }: AdminCheckProps) {
  const { user, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-deep-space">
        <div className="text-center">
          <Shield className="w-16 h-16 text-magic-gold mx-auto mb-4 animate-pulse" />
          <p className="text-gray-300 text-lg">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Check if user has admin role
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-deep-space p-8">
        <div className="max-w-md w-full text-center">
          <div className="glass-strong rounded-2xl p-8">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-3xl font-display font-bold text-white mb-4">
              Access Denied
            </h1>
            <p className="text-gray-300 mb-6">
              You don't have permission to access the admin dashboard. This area is restricted to administrators only.
            </p>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="btn-primary w-full"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User is admin, render children
  return <>{children}</>;
}
