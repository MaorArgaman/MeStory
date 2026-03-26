import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Language } from '../../contexts/LanguageContext';

const LANGUAGE_STORAGE_KEY = 'mestory-language';
const SUPPORTED_LANGUAGES: Language[] = ['en', 'he'];

/**
 * Detects the preferred language from various sources
 * Priority: URL > localStorage > browser language > default (en)
 */
export const detectPreferredLanguage = (): Language => {
  // Check localStorage first
  const storedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
  if (storedLang && SUPPORTED_LANGUAGES.includes(storedLang)) {
    return storedLang;
  }

  // Fall back to browser language
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('he')) {
    return 'he';
  }

  // Default to English
  return 'en';
};

/**
 * Extracts language from URL path
 * Returns null if no valid language prefix is found
 */
export const getLanguageFromPath = (pathname: string): Language | null => {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0]?.toLowerCase();

  if (firstSegment && SUPPORTED_LANGUAGES.includes(firstSegment as Language)) {
    return firstSegment as Language;
  }

  return null;
};

/**
 * Removes language prefix from path
 */
export const stripLanguageFromPath = (pathname: string): string => {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0]?.toLowerCase();

  if (firstSegment && SUPPORTED_LANGUAGES.includes(firstSegment as Language)) {
    return '/' + segments.slice(1).join('/');
  }

  return pathname;
};

/**
 * Adds language prefix to path
 */
export const addLanguageToPath = (pathname: string, language: Language): string => {
  const strippedPath = stripLanguageFromPath(pathname);
  const cleanPath = strippedPath === '/' ? '' : strippedPath;
  return `/${language}${cleanPath}`;
};

/**
 * List of public routes that support language prefix
 */
export const PUBLIC_LOCALIZED_ROUTES = [
  '/',
  '/marketplace',
  '/book',
  '/faq',
  '/about',
  '/guides',
  '/privacy',
  '/terms',
];

/**
 * Checks if a path is a public localized route
 */
export const isPublicLocalizedRoute = (pathname: string): boolean => {
  const strippedPath = stripLanguageFromPath(pathname);

  // Check exact matches
  if (PUBLIC_LOCALIZED_ROUTES.includes(strippedPath)) {
    return true;
  }

  // Check prefix matches (for routes like /book/:id, /guides/*)
  return PUBLIC_LOCALIZED_ROUTES.some(route => {
    if (route === '/') return strippedPath === '/';
    return strippedPath.startsWith(route + '/') || strippedPath === route;
  });
};

interface LanguageRedirectProps {
  children: React.ReactNode;
}

/**
 * Component that handles language-based redirects for the root path
 * Redirects / to /en or /he based on user preference
 */
export default function LanguageRedirect({ children }: LanguageRedirectProps) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect on exact root path without language prefix
    if (location.pathname === '/') {
      const preferredLanguage = detectPreferredLanguage();
      // Save to localStorage
      localStorage.setItem(LANGUAGE_STORAGE_KEY, preferredLanguage);
      // Redirect to language-prefixed root
      navigate(`/${preferredLanguage}`, { replace: true });
    }
  }, [location.pathname, navigate]);

  // If at root, don't render children until redirect happens
  if (location.pathname === '/') {
    return null;
  }

  return <>{children}</>;
}
