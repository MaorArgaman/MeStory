import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage, Language } from '../../contexts/LanguageContext';

interface LanguageRouteProps {
  children: React.ReactNode;
}

const SUPPORTED_LANGUAGES: Language[] = ['en', 'he'];

/**
 * Extracts language from URL path
 */
const getLanguageFromPath = (pathname: string): Language | null => {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0]?.toLowerCase();

  if (firstSegment && SUPPORTED_LANGUAGES.includes(firstSegment as Language)) {
    return firstSegment as Language;
  }

  return null;
};

/**
 * Wrapper component that syncs URL language with LanguageContext
 * Used to wrap public pages that support language prefix
 */
export default function LanguageRoute({ children }: LanguageRouteProps) {
  const location = useLocation();
  const { language, setLanguage } = useLanguage();

  // Extract language from the current path
  const urlLanguage = getLanguageFromPath(location.pathname);

  useEffect(() => {
    // If URL has a valid language that differs from current context language, sync it
    if (urlLanguage && urlLanguage !== language) {
      setLanguage(urlLanguage);
    }
  }, [urlLanguage, language, setLanguage]);

  return <>{children}</>;
}
