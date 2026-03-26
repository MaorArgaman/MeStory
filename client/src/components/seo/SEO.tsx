import { Helmet } from 'react-helmet-async';

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
const DEFAULT_SITE_URL = 'https://mestory.co.il';
const DEFAULT_IMAGE = `${DEFAULT_SITE_URL}/img/og-image.jpg`;

const DEFAULT_DESCRIPTIONS = {
  he: 'MeStory - הפלטפורמה המובילה לכתיבת ספרים עם בינה מלאכותית. כתוב, עצב ופרסם את הסיפור שלך בקלות.',
  en: 'MeStory - The leading AI-powered book writing platform. Write, design, and publish your story with ease.',
};

const DEFAULT_TITLES = {
  he: 'MeStory - כתוב את הסיפור שלך',
  en: 'MeStory - Write Your Story',
};

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
  const getAlternateUrl = () => {
    if (!alternateLocale) return null;
    // Assuming URL structure supports language prefix or query param
    const baseUrl = finalCanonical.replace(/\/(he|en)\//g, '/');
    return baseUrl;
  };

  const alternateUrl = getAlternateUrl();

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <html lang={lang} dir={lang === 'he' ? 'rtl' : 'ltr'} />
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      {keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}

      {/* Robots */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}

      {/* Canonical URL */}
      <link rel="canonical" href={finalCanonical} />

      {/* Hreflang Tags for Multilingual Support */}
      <link rel="alternate" hrefLang={lang} href={finalCanonical} />
      {alternateUrl && alternateLocale && (
        <link rel="alternate" hrefLang={altLang} href={alternateUrl} />
      )}
      <link rel="alternate" hrefLang="x-default" href={DEFAULT_SITE_URL} />

      {/* Open Graph Tags */}
      <meta property="og:site_name" content={DEFAULT_SITE_NAME} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={finalUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content={locale} />
      {alternateLocale && (
        <meta property="og:locale:alternate" content={alternateLocale} />
      )}

      {/* Article-specific OG tags */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === 'article' && author && (
        <meta property="article:author" content={author} />
      )}

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:site" content="@mestory_il" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={image} />

      {/* Additional Meta Tags */}
      <meta name="application-name" content={DEFAULT_SITE_NAME} />
      <meta name="apple-mobile-web-app-title" content={DEFAULT_SITE_NAME} />
      <meta name="theme-color" content="#111123" />
    </Helmet>
  );
}

// Pre-configured SEO components for common pages
export function HomeSEO({ locale = 'he_IL' }: { locale?: 'he_IL' | 'en_US' }) {
  const lang = locale === 'he_IL' ? 'he' : 'en';

  const titles = {
    he: 'MeStory - הפלטפורמה המובילה לכתיבת ספרים עם בינה מלאכותית',
    en: 'MeStory - The Leading AI-Powered Book Writing Platform',
  };

  const descriptions = {
    he: 'צור ספרים מקצועיים בקלות עם הכלים החכמים של MeStory. כתיבה, עיצוב ופרסום - הכל במקום אחד.',
    en: 'Create professional books easily with MeStory\'s smart tools. Writing, design, and publishing - all in one place.',
  };

  return (
    <SEO
      title={titles[lang]}
      description={descriptions[lang]}
      locale={locale}
      alternateLocale={locale === 'he_IL' ? 'en_US' : 'he_IL'}
      keywords={lang === 'he'
        ? ['כתיבת ספרים', 'בינה מלאכותית', 'פרסום עצמי', 'עיצוב ספרים', 'MeStory']
        : ['book writing', 'AI', 'self-publishing', 'book design', 'MeStory']
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
    he: 'גלה ספרים מדהימים מיוצרים ישראליים. קנה, קרא ותמוך ביוצרים מקומיים.',
    en: 'Discover amazing books from Israeli creators. Buy, read, and support local authors.',
  };

  return (
    <SEO
      title={titles[lang]}
      description={descriptions[lang]}
      url={`${DEFAULT_SITE_URL}/marketplace`}
      locale={locale}
      alternateLocale={locale === 'he_IL' ? 'en_US' : 'he_IL'}
      keywords={lang === 'he'
        ? ['ספרים', 'חנות ספרים', 'ספרים ישראליים', 'קריאה', 'MeStory']
        : ['books', 'bookstore', 'Israeli books', 'reading', 'MeStory']
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
