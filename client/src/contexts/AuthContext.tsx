import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { User } from '../types';
import EmailVerificationModal from '../components/auth/EmailVerificationModal';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  needsVerification: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  markEmailVerified: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await api.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.data.user);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });

      if (response.data.success) {
        const { user, token, requiresVerification } = response.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);

        // Only track verification status, don't show modal on login
        // Modal is only shown during registration
        if (requiresVerification) {
          setNeedsVerification(true);
        }
        toast.success('Welcome back!');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const loginWithToken = async (token: string) => {
    try {
      // Store the token
      localStorage.setItem('token', token);

      // Fetch user info with the token
      const response = await api.get('/auth/me');

      if (response.data.success) {
        const user = response.data.data.user;
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        toast.success('Welcome to MeStory!');
      }
    } catch (error: any) {
      console.error('Token login error:', error);
      localStorage.removeItem('token');
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });

      if (response.data.success) {
        const { user, token, requiresVerification } = response.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        toast.success('Account created! Please verify your email.');

        if (requiresVerification) {
          setNeedsVerification(true);
          setShowVerificationModal(true);
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    await loadUser();
  };

  const markEmailVerified = () => {
    setNeedsVerification(false);
    setShowVerificationModal(false);
    if (user) {
      const updatedUser = {
        ...user,
        emailVerification: { isVerified: true, verifiedAt: new Date().toISOString() },
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    toast.success('Email verified! Welcome to MeStory!');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        needsVerification,
        login,
        loginWithToken,
        register,
        logout,
        refreshUser,
        markEmailVerified,
      }}
    >
      {children}

      {/* Email Verification Modal */}
      {user && (
        <EmailVerificationModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          onVerified={markEmailVerified}
          email={user.email}
        />
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
