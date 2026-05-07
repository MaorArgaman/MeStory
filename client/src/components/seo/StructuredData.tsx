import { useEffect } from 'react';

const DEFAULT_SITE_URL = 'https://mestory-ai.com';

// Helper to render JSON-LD script
function useJsonLd(data: object, id: string) {
  useEffect(() => {
    const scriptId = `json-ld-${id}`;
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    script.textContent = JSON.stringify(data);

    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [data, id]);
}

// Organization Schema
interface OrganizationSchemaProps {
  locale?: 'he' | 'en';
}

export function OrganizationSchema({ locale = 'he' }: OrganizationSchemaProps) {
  const descriptions = {
    he: 'MeStory - הפלטפורמה המובילה לכתיבת ספרים עם בינה מלאכותית בישראל',
    en: 'MeStory - The leading AI-powered book writing platform in Israel',
  };

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${DEFAULT_SITE_URL}#organization`,
    name: 'MeStory',
    alternateName: ['MeStory Israel', 'מי-סטורי', 'MeStory.ai'],
    url: DEFAULT_SITE_URL,
    logo: {
      '@type': 'ImageObject',
      '@id': `${DEFAULT_SITE_URL}#logo`,
      url: `${DEFAULT_SITE_URL}/img/new/Logo-Me-512.png`,
      width: 512,
      height: 512,
      caption: 'MeStory',
    },
    image: { '@id': `${DEFAULT_SITE_URL}#logo` },
    description: descriptions[locale],
    foundingDate: '2024',
    sameAs: [
      'https://www.facebook.com/MeStoryAI',
      'https://www.instagram.com/mestory_ai/',
      'https://www.linkedin.com/company/115788080/',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: ['Hebrew', 'English'],
      email: 'mestory.tec@gmail.com',
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IL',
    },
  };

  useJsonLd(data, 'organization');
  return null;
}

// Book Schema
interface BookSchemaProps {
  title: string;
  description?: string;
  author: {
    name: string;
    url?: string;
  };
  isbn?: string;
  image?: string;
  datePublished?: string;
  genre?: string[];
  numberOfPages?: number;
  bookFormat?: 'EBook' | 'Hardcover' | 'Paperback' | 'AudioBook';
  inLanguage?: 'he' | 'en';
  price?: number;
  currency?: 'ILS' | 'USD';
  url?: string;
  rating?: {
    value: number;
    count: number;
  };
}

export function BookSchema({
  title,
  description,
  author,
  isbn,
  image,
  datePublished,
  genre,
  numberOfPages,
  bookFormat = 'EBook',
  inLanguage = 'he',
  price,
  currency = 'ILS',
  url,
  rating,
}: BookSchemaProps) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: title || 'Untitled',
    description,
    author: {
      '@type': 'Person',
      name: author?.name || 'Unknown',
      url: author?.url,
    },
    url,
    image,
    inLanguage: inLanguage === 'he' ? 'he-IL' : 'en-US',
    bookFormat: `https://schema.org/${bookFormat}`,
  };

  if (isbn) data.isbn = isbn;
  if (datePublished) data.datePublished = datePublished;
  if (genre) data.genre = genre;
  if (numberOfPages) data.numberOfPages = numberOfPages;

  if (price !== undefined) {
    data.offers = {
      '@type': 'Offer',
      price: price,
      priceCurrency: currency,
      availability: 'https://schema.org/InStock',
      url: url,
    };
  }

  if (rating) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating.value,
      reviewCount: rating.count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  useJsonLd(data, `book-${(title || 'untitled').replace(/\s+/g, '-').toLowerCase()}`);
  return null;
}

// FAQ Schema
interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSchemaProps {
  items: FAQItem[];
}

export function FAQSchema({ items }: FAQSchemaProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  useJsonLd(data, 'faq');
  return null;
}

// HowTo Schema
interface HowToStep {
  name: string;
  text: string;
  image?: string;
  url?: string;
}

interface HowToSchemaProps {
  name: string;
  description: string;
  steps: HowToStep[];
  image?: string;
  estimatedDuration?: string; // ISO 8601 duration, e.g., "PT30M"
  supply?: string[];
  tool?: string[];
}

export function HowToSchema({
  name,
  description,
  steps,
  image,
  estimatedDuration,
  supply,
  tool,
}: HowToSchemaProps) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      image: step.image,
      url: step.url,
    })),
  };

  if (image) data.image = image;
  if (estimatedDuration) data.totalTime = estimatedDuration;
  if (supply) {
    data.supply = supply.map((s) => ({
      '@type': 'HowToSupply',
      name: s,
    }));
  }
  if (tool) {
    data.tool = tool.map((t) => ({
      '@type': 'HowToTool',
      name: t,
    }));
  }

  useJsonLd(data, `howto-${name.replace(/\s+/g, '-').toLowerCase()}`);
  return null;
}

// Author/Person Schema
interface AuthorSchemaProps {
  name: string;
  description?: string;
  image?: string;
  url?: string;
  sameAs?: string[];
  jobTitle?: string;
  locale?: 'he' | 'en';
}

export function AuthorSchema({
  name,
  description,
  image,
  url,
  sameAs,
  jobTitle,
  locale = 'he',
}: AuthorSchemaProps) {
  const jobTitles = {
    he: 'סופר/ת',
    en: 'Author',
  };

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    url,
    image,
    jobTitle: jobTitle || jobTitles[locale],
  };

  if (description) data.description = description;
  if (sameAs) data.sameAs = sameAs;

  useJsonLd(data, `author-${name.replace(/\s+/g, '-').toLowerCase()}`);
  return null;
}

// Breadcrumb Schema
interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  useJsonLd(data, 'breadcrumb');
  return null;
}

// Software Application Schema
interface SoftwareApplicationSchemaProps {
  locale?: 'he' | 'en';
}

export function SoftwareApplicationSchema({ locale = 'he' }: SoftwareApplicationSchemaProps) {
  const descriptions = {
    he: 'אפליקציית כתיבת ספרים מבוססת בינה מלאכותית. כתוב, עצב ופרסם ספרים בקלות.',
    en: 'AI-powered book writing application. Write, design, and publish books with ease.',
  };

  const data = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'MeStory',
    description: descriptions[locale],
    url: DEFAULT_SITE_URL,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'ILS',
      description: locale === 'he' ? 'חינם להתחלה' : 'Free to start',
    },
    featureList: locale === 'he'
      ? [
          'כתיבה מונחית בינה מלאכותית',
          'עיצוב עטיפות',
          'פרסום לשוק',
          'תבניות מוכנות',
          'עריכה בזמן אמת',
        ]
      : [
          'AI-guided writing',
          'Cover design',
          'Marketplace publishing',
          'Ready-made templates',
          'Real-time editing',
        ],
    screenshot: `${DEFAULT_SITE_URL}/img/landing-hero.png`,
    // aggregateRating intentionally omitted: Google issues manual penalties
    // for unverified rating numbers in schema. Re-add only when wired to real
    // user reviews from the database.
  };

  useJsonLd(data, 'software-application');
  return null;
}

// WebSite Schema with SearchAction
interface WebsiteSchemaProps {
  locale?: 'he' | 'en';
}

export function WebsiteSchema({ locale = 'he' }: WebsiteSchemaProps) {
  const descriptions = {
    he: 'MeStory - הפלטפורמה המובילה לכתיבת ספרים עם בינה מלאכותית',
    en: 'MeStory - The leading AI-powered book writing platform',
  };

  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${DEFAULT_SITE_URL}#website`,
    name: 'MeStory',
    alternateName: ['מי-סטורי', 'MeStory.ai'],
    url: DEFAULT_SITE_URL,
    description: descriptions[locale],
    inLanguage: locale === 'he' ? 'he-IL' : 'en-US',
    publisher: { '@id': `${DEFAULT_SITE_URL}#organization` },
    potentialAction: [
      {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${DEFAULT_SITE_URL}/marketplace?search={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    ],
  };

  useJsonLd(data, 'website');
  return null;
}

// Product Schema (for book marketplace)
interface ProductSchemaProps {
  name: string;
  description: string;
  image: string;
  price: number;
  currency?: 'ILS' | 'USD';
  url: string;
  brand?: string;
  rating?: {
    value: number;
    count: number;
  };
}

export function ProductSchema({
  name,
  description,
  image,
  price,
  currency = 'ILS',
  url,
  brand = 'MeStory',
  rating,
}: ProductSchemaProps) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image,
    url,
    brand: {
      '@type': 'Brand',
      name: brand,
    },
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: currency,
      availability: 'https://schema.org/InStock',
      url,
    },
  };

  if (rating) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating.value,
      reviewCount: rating.count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  useJsonLd(data, `product-${name.replace(/\s+/g, '-').toLowerCase()}`);
  return null;
}

// Export default FAQ items in both languages for common use
export const DEFAULT_FAQ_ITEMS = {
  he: [
    {
      question: 'מה זה MeStory?',
      answer: 'MeStory היא פלטפורמה לכתיבת ספרים עם עזרת בינה מלאכותית. אנחנו מאפשרים לכל אחד לכתוב, לעצב ולפרסם את הסיפור שלו בקלות.',
    },
    {
      question: 'כמה עולה להשתמש ב-MeStory?',
      answer: 'ההרשמה ל-MeStory חינמית. יש לנו מסלולים שונים עם יכולות מתקדמות למנויים.',
    },
    {
      question: 'האם אני יכול למכור את הספרים שלי?',
      answer: 'כן! אתה יכול לפרסם את הספרים שלך בשוק שלנו ולהרוויח ממכירות.',
    },
  ],
  en: [
    {
      question: 'What is MeStory?',
      answer: 'MeStory is an AI-powered book writing platform. We enable anyone to write, design, and publish their story with ease.',
    },
    {
      question: 'How much does MeStory cost?',
      answer: 'Registration to MeStory is free. We have different subscription plans with advanced features.',
    },
    {
      question: 'Can I sell my books?',
      answer: 'Yes! You can publish your books on our marketplace and earn from sales.',
    },
  ],
};

// Article Schema (for guides, blog posts, news)
interface ArticleSchemaProps {
  headline: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author?: {
    name: string;
    url?: string;
  };
  publisher?: {
    name: string;
    logo?: string;
  };
  url?: string;
  articleType?: 'Article' | 'BlogPosting' | 'NewsArticle' | 'TechArticle' | 'HowTo';
  wordCount?: number;
  speakable?: string[]; // CSS selectors for speakable content
}

export function ArticleSchema({
  headline,
  description,
  image,
  datePublished,
  dateModified,
  author = { name: 'MeStory', url: DEFAULT_SITE_URL },
  publisher = { name: 'MeStory', logo: `${DEFAULT_SITE_URL}/img/new/logo-mestory-large.png` },
  url,
  articleType = 'Article',
  wordCount,
  speakable,
}: ArticleSchemaProps) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': articleType,
    headline,
    description,
    url: url || DEFAULT_SITE_URL,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Person',
      name: author.name,
      url: author.url,
    },
    publisher: {
      '@type': 'Organization',
      name: publisher.name,
      logo: {
        '@type': 'ImageObject',
        url: publisher.logo,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url || DEFAULT_SITE_URL,
    },
  };

  if (image) data.image = image;
  if (wordCount) data.wordCount = wordCount;

  // Add speakable specification for voice search optimization
  if (speakable && speakable.length > 0) {
    data.speakable = {
      '@type': 'SpeakableSpecification',
      cssSelector: speakable,
    };
  }

  useJsonLd(data, `article-${headline.replace(/\s+/g, '-').toLowerCase().slice(0, 50)}`);
  return null;
}

// Speakable Schema (for voice search / AEO optimization)
interface SpeakableSchemaProps {
  name: string;
  cssSelectors: string[];
  url?: string;
}

export function SpeakableSchema({
  name,
  cssSelectors,
  url = DEFAULT_SITE_URL,
}: SpeakableSchemaProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    url,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: cssSelectors,
    },
  };

  useJsonLd(data, `speakable-${name.replace(/\s+/g, '-').toLowerCase()}`);
  return null;
}

// Video Schema (for video content / GEO optimization)
interface VideoSchemaProps {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration?: string; // ISO 8601 duration e.g., "PT5M30S"
  contentUrl?: string;
  embedUrl?: string;
  interactionCount?: number;
}

export function VideoSchema({
  name,
  description,
  thumbnailUrl,
  uploadDate,
  duration,
  contentUrl,
  embedUrl,
  interactionCount,
}: VideoSchemaProps) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name,
    description,
    thumbnailUrl,
    uploadDate,
  };

  if (duration) data.duration = duration;
  if (contentUrl) data.contentUrl = contentUrl;
  if (embedUrl) data.embedUrl = embedUrl;
  if (interactionCount) {
    data.interactionStatistic = {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/WatchAction',
      userInteractionCount: interactionCount,
    };
  }

  useJsonLd(data, `video-${name.replace(/\s+/g, '-').toLowerCase()}`);
  return null;
}

// Review Schema (for book reviews / ratings)
interface ReviewSchemaProps {
  itemReviewed: {
    name: string;
    type: 'Book' | 'Product' | 'SoftwareApplication';
  };
  author: string;
  reviewRating: number;
  reviewBody: string;
  datePublished?: string;
}

export function ReviewSchema({
  itemReviewed,
  author,
  reviewRating,
  reviewBody,
  datePublished = new Date().toISOString().split('T')[0],
}: ReviewSchemaProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': itemReviewed.type,
      name: itemReviewed.name,
    },
    author: {
      '@type': 'Person',
      name: author,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: reviewRating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody,
    datePublished,
  };

  useJsonLd(data, `review-${itemReviewed.name.replace(/\s+/g, '-').toLowerCase()}`);
  return null;
}

// CollectionPage Schema — for marketplace and other index pages
interface CollectionPageSchemaProps {
  name: string;
  description: string;
  url: string;
  numberOfItems?: number;
  inLanguage?: 'he' | 'en';
}

export function CollectionPageSchema({
  name,
  description,
  url,
  numberOfItems,
  inLanguage = 'he',
}: CollectionPageSchemaProps) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#collection`,
    name,
    description,
    url,
    inLanguage: inLanguage === 'he' ? 'he-IL' : 'en-US',
    isPartOf: { '@id': `${DEFAULT_SITE_URL}#website` },
    publisher: { '@id': `${DEFAULT_SITE_URL}#organization` },
  };
  if (numberOfItems !== undefined) {
    data.mainEntity = {
      '@type': 'ItemList',
      numberOfItems,
    };
  }
  useJsonLd(data, 'collection-page');
  return null;
}

// AboutPage Schema
interface AboutPageSchemaProps {
  name: string;
  description: string;
  url: string;
  inLanguage?: 'he' | 'en';
}

export function AboutPageSchema({
  name,
  description,
  url,
  inLanguage = 'he',
}: AboutPageSchemaProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': `${url}#aboutpage`,
    name,
    description,
    url,
    inLanguage: inLanguage === 'he' ? 'he-IL' : 'en-US',
    isPartOf: { '@id': `${DEFAULT_SITE_URL}#website` },
    about: { '@id': `${DEFAULT_SITE_URL}#organization` },
    mainEntity: { '@id': `${DEFAULT_SITE_URL}#organization` },
  };
  useJsonLd(data, 'about-page');
  return null;
}

// ProfilePage Schema — wraps a Person/AuthorSchema in a ProfilePage entity
// so Google understands this is a profile, not a generic page.
interface ProfilePageSchemaProps {
  name: string;
  url: string;
  description?: string;
  dateCreated?: string;
  inLanguage?: 'he' | 'en';
}

export function ProfilePageSchema({
  name,
  url,
  description,
  dateCreated,
  inLanguage = 'he',
}: ProfilePageSchemaProps) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${url}#profilepage`,
    name: `${name} — MeStory Author Profile`,
    url,
    inLanguage: inLanguage === 'he' ? 'he-IL' : 'en-US',
    isPartOf: { '@id': `${DEFAULT_SITE_URL}#website` },
    mainEntity: {
      '@type': 'Person',
      name,
      url,
    },
  };
  if (description) data.description = description;
  if (dateCreated) data.dateCreated = dateCreated;
  useJsonLd(data, 'profile-page');
  return null;
}

// Course Schema — for guides that teach a skill
interface CourseSchemaProps {
  name: string;
  description: string;
  url: string;
  provider?: { name: string; url: string };
  inLanguage?: 'he' | 'en';
  educationalLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  timeRequired?: string; // ISO 8601 duration
}

export function CourseSchema({
  name,
  description,
  url,
  provider = { name: 'MeStory', url: DEFAULT_SITE_URL },
  inLanguage = 'he',
  educationalLevel = 'Beginner',
  timeRequired,
}: CourseSchemaProps) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    '@id': `${url}#course`,
    name,
    description,
    url,
    inLanguage: inLanguage === 'he' ? 'he-IL' : 'en-US',
    provider: {
      '@type': 'Organization',
      name: provider.name,
      url: provider.url,
      '@id': `${DEFAULT_SITE_URL}#organization`,
    },
    educationalLevel,
    isAccessibleForFree: true,
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      inLanguage: inLanguage === 'he' ? 'he-IL' : 'en-US',
    },
  };
  if (timeRequired) data.timeRequired = timeRequired;
  useJsonLd(data, `course-${name.replace(/\s+/g, '-').toLowerCase().slice(0, 40)}`);
  return null;
}

// DefinedTermSet Schema — glossary / dictionary of MeStory terms.
// Search engines and LLMs heavily favor glossaries for citation.
interface DefinedTerm {
  name: string;
  description: string;
  termCode?: string;
  inLanguage?: 'he' | 'en';
}

interface DefinedTermSetSchemaProps {
  name: string;
  url: string;
  terms: DefinedTerm[];
  inLanguage?: 'he' | 'en';
}

export function DefinedTermSetSchema({
  name,
  url,
  terms,
  inLanguage = 'he',
}: DefinedTermSetSchemaProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    '@id': `${url}#glossary`,
    name,
    url,
    inLanguage: inLanguage === 'he' ? 'he-IL' : 'en-US',
    hasDefinedTerm: terms.map((term, idx) => ({
      '@type': 'DefinedTerm',
      '@id': `${url}#term-${idx}`,
      name: term.name,
      description: term.description,
      ...(term.termCode ? { termCode: term.termCode } : {}),
      inDefinedTermSet: { '@id': `${url}#glossary` },
    })),
  };
  useJsonLd(data, 'defined-term-set');
  return null;
}

// Export default HowTo steps for creating a book
export const DEFAULT_HOWTO_STEPS = {
  he: [
    { name: 'הרשמה', text: 'צור חשבון חינמי ב-MeStory' },
    { name: 'בחירת תבנית', text: 'בחר תבנית מתאימה לסיפור שלך' },
    { name: 'כתיבה', text: 'התחל לכתוב עם עזרת הבינה המלאכותית' },
    { name: 'עיצוב', text: 'עצב את העטיפה והעימוד' },
    { name: 'פרסום', text: 'פרסם את הספר שלך בשוק' },
  ],
  en: [
    { name: 'Sign Up', text: 'Create a free MeStory account' },
    { name: 'Choose Template', text: 'Select a template for your story' },
    { name: 'Write', text: 'Start writing with AI assistance' },
    { name: 'Design', text: 'Design your cover and layout' },
    { name: 'Publish', text: 'Publish your book to the marketplace' },
  ],
};
