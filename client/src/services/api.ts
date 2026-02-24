import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

// In production, use the server URL
// In development, use localhost
const API_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://server-two-henna-44.vercel.app/api' : 'http://localhost:5001/api');

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<{ error: string; message?: string }>) => {
    const url = error.config?.url || '';
    const isAuthCheck = url.includes('/auth/me');

    // Handle specific error cases
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Only redirect if not already on login/register page and not during initial auth check
      if (!window.location.pathname.includes('/login') &&
          !window.location.pathname.includes('/register') &&
          !isAuthCheck) {
        toast.error('Session expired. Please login again.');
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action.');
    } else if (error.response?.status === 429) {
      toast.error('Too many requests. Please try again later.');
    } else if (error.response?.status === 500 || error.response?.status === 503) {
      // Server error - don't show toast for auth checks (handled by AuthContext)
      if (!isAuthCheck) {
        toast.error('Server is temporarily unavailable. Please try again.');
      }
    } else if (!error.response && error.message === 'Network Error') {
      // Network error - don't show toast for auth checks
      if (!isAuthCheck) {
        toast.error('Connection error. Please check your internet.');
      }
    } else if (error.response?.data?.error) {
      // Show API error message (but not for silent auth checks)
      if (!isAuthCheck) {
        toast.error(error.response.data.error);
      }
    } else if (error.message && !isAuthCheck) {
      // Show generic error
      toast.error(error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
