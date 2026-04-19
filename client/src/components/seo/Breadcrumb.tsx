import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const DEFAULT_SITE_URL = 'https://mestory-ai.com';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumb navigation component with JSON-LD structured data
 *
 * Features:
 * - Automatically prepends Home link
 * - Includes BreadcrumbList schema for SEO
 * - RTL support for Hebrew
 * - Responsive design
 * - Last item is not clickable (current page)
 */
export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  const { language } = useLanguage();
  const isRTL = language === 'he';

  // Home item is always first
  const homeItem: BreadcrumbItem = {
    name: isRTL ? 'ראשי' : 'Home',
    url: '/',
  };

  // Full breadcrumb items including home
  const allItems = [homeItem, ...items];

  // Generate JSON-LD structured data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: allItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${DEFAULT_SITE_URL}${item.url}`,
    })),
  };

  // Insert JSON-LD script into document head
  useEffect(() => {
    const scriptId = 'json-ld-breadcrumb-nav';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    script.textContent = JSON.stringify(structuredData);

    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [structuredData]);

  return (
    <nav
      aria-label={isRTL ? 'ניווט פירורי לחם' : 'Breadcrumb'}
      className={`flex items-center flex-wrap gap-1 sm:gap-2 text-sm text-gray-400 ${className}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <ol className="flex items-center flex-wrap gap-1 sm:gap-2 list-none p-0 m-0">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isFirst = index === 0;

          return (
            <li key={item.url} className="flex items-center gap-1 sm:gap-2">
              {/* Chevron separator (not before first item) */}
              {index > 0 && (
                <ChevronRight
                  className={`w-4 h-4 text-gray-500 flex-shrink-0 ${
                    isRTL ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              )}

              {isLast ? (
                // Last item is current page - not clickable
                <span
                  className="text-gray-300 font-medium truncate max-w-[200px] sm:max-w-none"
                  aria-current="page"
                >
                  {isFirst && (
                    <Home
                      className={`w-4 h-4 inline-block ${isRTL ? 'ml-1' : 'mr-1'}`}
                      aria-hidden="true"
                    />
                  )}
                  {item.name}
                </span>
              ) : (
                // Clickable breadcrumb link
                <Link
                  to={item.url}
                  className="hover:text-memorial-gold transition-colors duration-200 flex items-center truncate max-w-[150px] sm:max-w-none"
                >
                  {isFirst && (
                    <Home
                      className={`w-4 h-4 flex-shrink-0 ${isRTL ? 'ml-1' : 'mr-1'}`}
                      aria-hidden="true"
                    />
                  )}
                  <span className="truncate">{item.name}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
