import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../../hooks/useAnalytics';

/**
 * Google Analytics 4 Component
 *
 * Loads the GA4 script and tracks page views on route changes.
 * Only loads if VITE_GA_MEASUREMENT_ID environment variable is set.
 */
export function GoogleAnalytics() {
  const location = useLocation();
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

  // Load GA4 script on mount
  useEffect(() => {
    if (!measurementId) {
      return;
    }

    // Check if script is already loaded
    if (document.querySelector(`script[src*="googletagmanager.com/gtag"]`)) {
      return;
    }

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    };
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: false, // We'll track page views manually on route changes
    });

    // Load the gtag.js script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    return () => {
      // Cleanup is not typically needed for GA, but included for completeness
      const existingScript = document.querySelector(`script[src*="googletagmanager.com/gtag"]`);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [measurementId]);

  // Track page views on route changes
  useEffect(() => {
    if (!measurementId) {
      return;
    }

    // Small delay to ensure the page title has been updated
    const timeoutId = setTimeout(() => {
      trackPageView(location.pathname + location.search, document.title);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [location, measurementId]);

  // This component doesn't render anything
  return null;
}

export default GoogleAnalytics;
