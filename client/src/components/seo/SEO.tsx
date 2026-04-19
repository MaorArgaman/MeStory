import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'book' | 'profile';
  locale?: 'he_IL' | 'en_US';
  alternateLocale?: 'he_IL' | 'en_US';
  canonicalUrl?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  keywords?: string[];
  noIndex?: boolean;
  twitterCard?: 'summary' | 'summary_large_image';
}

const DEFAULT_SITE_NAME = 'MeStory';
const DEFAULT_SITE_URL = 'https://mestory-ai.com';
const DEFAULT_IMAGE = `${DEFAULT_SITE_URL}/img/new/logo-mestory-large.png`;

const DEFAULT_DESCRIPTIONS = {
  he: 'MeStory - הפלטפורמה המובילה לכתיבת ספרים עם בינה מלאכותית. כתוב, עצב ופרסם את הסיפור שלך בקלות.',
  en: 'MeStory - The leading AI-powered book writing platform. Write, design, and publish your story with ease.',
};

const DEFAULT_TITLES = {
  he: 'MeStory - כתוב את הסיפור שלך',
  en: 'MeStory - Write Your Story',
};

// Helper to set or update a meta tag
function setMetaTag(name: string, content: string, isProperty = false) {
  const attribute = isProperty ? 'property' : 'name';
  let meta = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;

  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, name);
    document.head.appendChild(meta);
  }

  meta.setAttribute('content', content);
}

// Helper to set or update a link tag
function setLinkTag(rel: string, href: string, extraAttrs?: Record<string, string>) {
  const selector = extraAttrs
    ? `link[rel="${rel}"]${Object.entries(extraAttrs).map(([k, v]) => `[${k}="${v}"]`).join('')}`
    : `link[rel="${rel}"]`;

  let link = document.querySelector(selector) as HTMLLinkElement;

  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    if (extraAttrs) {
      Object.entries(extraAttrs).forEach(([key, value]) => {
        link.setAttribute(key, value);
      });
    }
    document.head.appendChild(link);
  }

  link.setAttribute('href', href);
}

export function SEO({
  title,
  description,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  locale = 'he_IL',
  alternateLocale,
  canonicalUrl,
  publishedTime,
  modifiedTime,
  author,
  keywords = [],
  noIndex = false,
  twitterCard = 'summary_large_image',
}: SEOProps) {
  const lang = locale === 'he_IL' ? 'he' : 'en';
  const altLang = alternateLocale === 'he_IL' ? 'he' : 'en';

  const finalTitle = title
    ? `${title} | ${DEFAULT_SITE_NAME}`
    : DEFAULT_TITLES[lang];

  const finalDescription = description || DEFAULT_DESCRIPTIONS[lang];
  const finalUrl = url || canonicalUrl || DEFAULT_SITE_URL;
  const finalCanonical = canonicalUrl || finalUrl;

  // Generate alternate URL for other language
  const getAlternateUrl = (targetLang: string) => {
    if (!finalCanonical) return null;

    const langPrefixRegex = /\/(en|he)(\/|$)/;
    const hasLangPrefix = langPrefixRegex.test(finalCanonical);

    if (hasLangPrefix) {
      return finalCanonical.replace(langPrefixRegex, `/${targetLang}$2`);
    } else {
      const urlParts = finalCanonical.split(DEFAULT_SITE_URL);
      if (urlParts.length === 2) {
        const path = urlParts[1] || '/';
        return `${DEFAULT_SITE_URL}/${targetLang}${path === '/' ? '' : path}`;
      }
      return null;
    }
  };

  const alternateUrl = alternateLocale ? getAlternateUrl(altLang) : null;
  const currentLangUrl = getAlternateUrl(lang);

  useEffect(() => {
    // Set document title
    document.title = finalTitle;

    // Set HTML attributes
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'he' ? 'rtl' : 'ltr');

    // Basic Meta Tags
    setMetaTag('description', finalDescription);
    if (keywords.length > 0) {
      setMetaTag('keywords', keywords.join(', '));
    }

    // Robots
    if (noIndex) {
      setMetaTag('robots', 'noindex, nofollow');
    } else {
      setMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    }

    // Canonical URL
    setLinkTag('canonical', finalCanonical);

    // Hreflang Tags
    setLinkTag('alternate', currentLangUrl || finalCanonical, { hreflang: lang });
    if (alternateUrl && alternateLocale) {
      setLinkTag('alternate', alternateUrl, { hreflang: altLang });
    }
    setLinkTag('alternate', `${DEFAULT_SITE_URL}/en`, { hreflang: 'x-default' });

    // Open Graph Tags
    setMetaTag('og:site_name', DEFAULT_SITE_NAME, true);
    setMetaTag('og:title', finalTitle, true);
    setMetaTag('og:description', finalDescription, true);
    setMetaTag('og:image', image, true);
    setMetaTag('og:image:width', '1200', true);
    setMetaTag('og:image:height', '630', true);
    setMetaTag('og:url', finalUrl, true);
    setMetaTag('og:type', type, true);
    setMetaTag('og:locale', locale, true);
    if (alternateLocale) {
      setMetaTag('og:locale:alternate', alternateLocale, true);
    }

    // Article-specific OG tags
    if (type === 'article' && publishedTime) {
      setMetaTag('article:published_time', publishedTime, true);
    }
    if (type === 'article' && modifiedTime) {
      setMetaTag('article:modified_time', modifiedTime, true);
    }
    if (type === 'article' && author) {
      setMetaTag('article:author', author, true);
    }

    // Twitter Card Tags
    setMetaTag('twitter:card', twitterCard);
    setMetaTag('twitter:site', '@mestory_il');
    setMetaTag('twitter:title', finalTitle);
    setMetaTag('twitter:description', finalDescription);
    setMetaTag('twitter:image', image);

    // Additional Meta Tags
    setMetaTag('application-name', DEFAULT_SITE_NAME);
    setMetaTag('apple-mobile-web-app-title', DEFAULT_SITE_NAME);
    setMetaTag('theme-color', '#111123');

  }, [finalTitle, finalDescription, image, finalUrl, type, locale, alternateLocale,
      canonicalUrl, publishedTime, modifiedTime, author, keywords, noIndex, twitterCard,
      lang, altLang, finalCanonical, alternateUrl, currentLangUrl]);

  return null;
}

// Pre-configured SEO components for common pages
export function HomeSEO({ locale = 'he_IL' }: { locale?: 'he_IL' | 'en_US' }) {
  const lang = locale === 'he_IL' ? 'he' : 'en';

  const titles = {
    he: 'MeStory - הפלטפורמה המובילה לכתיבת ספרים עם בינה מלאכותית',
    en: 'MeStory - The Leading AI-Powered Book Writing Platform',
  };

  const descriptions = {
    he: 'צור ספרים מקצועיים בקלות עם הכלים החכמים של MeStory. כתיבה, עיצוב ופרסום - הכל במקום אחד. הצטרף לאלפי סופרים ישראלים שכבר יצרו את הסיפור שלהם.',
    en: 'Create professional books easily with MeStory\'s smart AI tools. Writing, design, and publishing - all in one place. Join thousands of Israeli authors who already created their story.',
  };

  return (
    <SEO
      title={titles[lang]}
      description={descriptions[lang]}
      locale={locale}
      alternateLocale={locale === 'he_IL' ? 'en_US' : 'he_IL'}
      keywords={lang === 'he'
        ? ['כתיבת ספרים', 'בינה מלאכותית', 'פרסום עצמי', 'עיצוב ספרים', 'MeStory', 'ספרים בעברית']
        : ['book writing', 'AI', 'self-publishing', 'book design', 'MeStory', 'Hebrew books']
      }
    />
  );
}

export function MarketplaceSEO({ locale = 'he_IL' }: { locale?: 'he_IL' | 'en_US' }) {
  const lang = locale === 'he_IL' ? 'he' : 'en';

  const titles = {
    he: 'חנות הספרים',
    en: 'Book Marketplace',
  };

  const descriptions = {
    he: 'גלה מאות ספרים מדהימים מיוצרים ישראליים בחנות MeStory. סיפורים מקוריים, רומנים, ספרי ילדים ועוד. קנה, קרא ותמוך ביוצרים מקומיים.',
    en: 'Discover hundreds of amazing books from Israeli creators in the MeStory marketplace. Original stories, novels, children\'s books and more. Buy, read, and support local authors.',
  };

  return (
    <SEO
      title={titles[lang]}
      description={descriptions[lang]}
      url={`${DEFAULT_SITE_URL}/${lang}/marketplace`}
      canonicalUrl={`${DEFAULT_SITE_URL}/${lang}/marketplace`}
      locale={locale}
      alternateLocale={locale === 'he_IL' ? 'en_US' : 'he_IL'}
      keywords={lang === 'he'
        ? ['ספרים', 'חנות ספרים', 'ספרים ישראליים', 'קריאה', 'MeStory', 'ספרים דיגיטליים']
        : ['books', 'bookstore', 'Israeli books', 'reading', 'MeStory', 'digital books']
      }
    />
  );
}

export function BookSEO({
  title,
  description,
  author,
  coverImage,
  bookId,
  locale = 'he_IL',
}: {
  title: string;
  description?: string;
  author?: string;
  coverImage?: string;
  bookId: string;
  locale?: 'he_IL' | 'en_US';
}) {
  return (
    <SEO
      title={title}
      description={description}
      image={coverImage}
      url={`${DEFAULT_SITE_URL}/book/${bookId}`}
      type="book"
      locale={locale}
      author={author}
    />
  );
}

export function AuthorSEO({
  name,
  bio,
  profileImage,
  authorId,
  locale = 'he_IL',
}: {
  name: string;
  bio?: string;
  profileImage?: string;
  authorId: string;
  locale?: 'he_IL' | 'en_US';
}) {
  const lang = locale === 'he_IL' ? 'he' : 'en';

  const descriptions = {
    he: bio || `גלה את הספרים של ${name} ב-MeStory`,
    en: bio || `Discover ${name}'s books on MeStory`,
  };

  return (
    <SEO
      title={name}
      description={descriptions[lang]}
      image={profileImage}
      url={`${DEFAULT_SITE_URL}/profile/${authorId}`}
      type="profile"
      locale={locale}
      author={name}
    />
  );
}

export default SEO;
