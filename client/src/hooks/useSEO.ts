import { useEffect } from 'react';

interface SEOOptions {
  title: string;
  description: string;
  canonicalUrl?: string;
  keywords?: string[];
  ogType?: 'website' | 'article' | 'book';
  ogImage?: string;
  twitterCard?: 'summary' | 'summary_large_image';
}

const DEFAULT_SITE_NAME = 'MeStory';
const DEFAULT_SITE_URL = 'https://mestory.co.il';
const DEFAULT_IMAGE = `${DEFAULT_SITE_URL}/img/new/logo-mestory-large.jpeg`;

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

function setLinkTag(rel: string, href: string) {
  let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;

  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
  }

  link.setAttribute('href', href);
}

export function useSEO({
  title,
  description,
  canonicalUrl,
  keywords = [],
  ogType = 'website',
  ogImage = DEFAULT_IMAGE,
  twitterCard = 'summary_large_image',
}: SEOOptions) {
  useEffect(() => {
    // Set document title
    document.title = title.includes(DEFAULT_SITE_NAME) ? title : `${title} | ${DEFAULT_SITE_NAME}`;

    // Set meta description
    setMetaTag('description', description);

    // Set keywords if provided
    if (keywords.length > 0) {
      setMetaTag('keywords', keywords.join(', '));
    }

    // Set canonical URL
    if (canonicalUrl) {
      setLinkTag('canonical', canonicalUrl);
    }

    // Set Open Graph tags
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:type', ogType, true);
    setMetaTag('og:image', ogImage, true);
    if (canonicalUrl) {
      setMetaTag('og:url', canonicalUrl, true);
    }

    // Set Twitter tags
    setMetaTag('twitter:card', twitterCard);
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', ogImage);

  }, [title, description, canonicalUrl, keywords, ogType, ogImage, twitterCard]);
}

export default useSEO;
