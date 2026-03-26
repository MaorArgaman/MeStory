import { useCallback } from 'react';
import { useLocation, useNavigate, NavigateOptions } from 'react-router-dom';
import { useLanguage, Language } from '../contexts/LanguageContext';
import {
  getLanguageFromPath,
  addLanguageToPath,
  isPublicLocalizedRoute,
  stripLanguageFromPath,
} from '../components/routing/LanguageRedirect';

/**
 * Hook that provides utilities for working with localized paths
 */
export function useLocalizedPath() {
  const { language } = useLanguage();
  const location = useLocation();

  /**
   * Gets the current language from URL or context
   */
  const currentLanguage = getLanguageFromPath(location.pathname) || language;

  /**
   * Converts a path to a localized path with language prefix
   * Only applies to public localized routes
   */
  const localizedPath = useCallback(
    (path: string, lang?: Language): string => {
      const targetLang = lang || currentLanguage;

      // Strip any existing language prefix
      const cleanPath = stripLanguageFromPath(path);

      // Only add language prefix for public localized routes
      if (isPublicLocalizedRoute(cleanPath)) {
        return addLanguageToPath(cleanPath, targetLang);
      }

      // Return the clean path for non-localized routes
      return cleanPath;
    },
    [currentLanguage]
  );

  /**
   * Gets path for switching to a different language
   * Keeps the current route but changes the language prefix
   */
  const getPathForLanguage = useCallback(
    (targetLang: Language): string => {
      const currentPath = location.pathname;
      const strippedPath = stripLanguageFromPath(currentPath);

      // If it's a localized route, add the new language prefix
      if (isPublicLocalizedRoute(strippedPath)) {
        return addLanguageToPath(strippedPath, targetLang);
      }

      // For non-localized routes, just return the current path
      return currentPath;
    },
    [location.pathname]
  );

  /**
   * Checks if the current route is a localized route
   */
  const isLocalizedRoute = isPublicLocalizedRoute(stripLanguageFromPath(location.pathname));

  return {
    currentLanguage,
    localizedPath,
    getPathForLanguage,
    isLocalizedRoute,
  };
}

/**
 * Hook that provides a navigate function that automatically adds language prefix
 */
export function useNavigateWithLanguage() {
  const navigate = useNavigate();
  const { localizedPath } = useLocalizedPath();

  const navigateWithLanguage = useCallback(
    (to: string, options?: NavigateOptions) => {
      const localizedTo = localizedPath(to);
      navigate(localizedTo, options);
    },
    [navigate, localizedPath]
  );

  return navigateWithLanguage;
}

export default useLocalizedPath;
