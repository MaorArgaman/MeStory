import { useEffect } from 'react';

const DEFAULT_SITE_URL = 'https://mestory.co.il';

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
    name: 'MeStory',
    alternateName: 'MeStory Israel',
    url: DEFAULT_SITE_URL,
    logo: `${DEFAULT_SITE_URL}/img/MeStory-Logo.png`,
    description: descriptions[locale],
    foundingDate: '2024',
    sameAs: [
      'https://www.facebook.com/mestory.il',
      'https://www.instagram.com/mestory.il',
      'https://twitter.com/mestory_il',
      'https://www.linkedin.com/company/mestory',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: ['Hebrew', 'English'],
      email: 'support@mestory.co.il',
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
    name: title,
    description,
    author: {
      '@type': 'Person',
      name: author.name,
      url: author.url,
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

  useJsonLd(data, `book-${title.replace(/\s+/g, '-').toLowerCase()}`);
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
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
      bestRating: '5',
      worstRating: '1',
    },
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
    name: 'MeStory',
    url: DEFAULT_SITE_URL,
    description: descriptions[locale],
    inLanguage: locale === 'he' ? 'he-IL' : 'en-US',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${DEFAULT_SITE_URL}/marketplace?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
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
