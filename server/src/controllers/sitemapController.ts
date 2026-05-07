/**
 * Sitemap Controller
 * Generates dynamic XML sitemap for SEO optimization
 */

import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

// Base URL for the site
const getBaseUrl = (): string => {
  return process.env.CLIENT_URL || 'https://mestory-ai.com';
};

// Static pages with their metadata
const staticPages = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/marketplace', changefreq: 'hourly', priority: '0.9' },
  { path: '/faq', changefreq: 'weekly', priority: '0.6' },
  { path: '/about', changefreq: 'monthly', priority: '0.6' },
  { path: '/subscription', changefreq: 'weekly', priority: '0.8' },
  { path: '/guides', changefreq: 'monthly', priority: '0.8' },
  { path: '/guides/write-book', changefreq: 'monthly', priority: '0.7' },
  { path: '/guides/publish-book', changefreq: 'monthly', priority: '0.7' },
  { path: '/guides/earn-money', changefreq: 'monthly', priority: '0.7' },
  { path: '/privacy', changefreq: 'monthly', priority: '0.3' },
  { path: '/terms', changefreq: 'monthly', priority: '0.3' },
];

// Supported languages for hreflang
const supportedLanguages = ['en', 'he'];

/**
 * Escape XML special characters
 */
const escapeXml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

/**
 * Format date to W3C datetime format
 */
const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

/**
 * Generate hreflang links for a URL
 */
const generateHreflangLinks = (baseUrl: string, path: string): string => {
  let links = '';

  for (const lang of supportedLanguages) {
    const url = `${baseUrl}${path}${path.includes('?') ? '&' : '?'}lang=${lang}`;
    links += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${escapeXml(url)}" />\n`;
  }

  // Add x-default for the primary URL
  links += `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(baseUrl + path)}" />\n`;

  return links;
};

/**
 * Generate URL entry for sitemap
 */
const generateUrlEntry = (
  baseUrl: string,
  path: string,
  lastmod?: string,
  changefreq: string = 'weekly',
  priority: string = '0.5',
  includeHreflang: boolean = true
): string => {
  let entry = '  <url>\n';
  entry += `    <loc>${escapeXml(baseUrl + path)}</loc>\n`;

  if (lastmod) {
    entry += `    <lastmod>${formatDate(lastmod)}</lastmod>\n`;
  }

  entry += `    <changefreq>${changefreq}</changefreq>\n`;
  entry += `    <priority>${priority}</priority>\n`;

  if (includeHreflang) {
    entry += generateHreflangLinks(baseUrl, path);
  }

  entry += '  </url>\n';

  return entry;
};

/**
 * Fetch published books from database
 */
const fetchPublishedBooks = async (): Promise<Array<{
  id: string;
  title: string;
  updated_at: string;
}>> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('books')
      .select('id, title, updated_at')
      .filter('publishing_status->>status', 'eq', 'published')
      .filter('publishing_status->>isPublic', 'eq', 'true')
      .order('updated_at', { ascending: false })
      .limit(50000);

    if (error) {
      console.error('Error fetching published books for sitemap:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch published books:', error);
    return [];
  }
};

/**
 * Fetch public author profiles from database
 */
const fetchPublicAuthors = async (): Promise<Array<{
  id: string;
  name: string;
  updated_at: string;
}>> => {
  try {
    // Fetch users who have published at least one book
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, name, updated_at')
      .filter('profile->authorProfile->>publishedBooks', 'gt', '0')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching public authors for sitemap:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch public authors:', error);
    return [];
  }
};

/**
 * Generate complete XML sitemap
 * GET /sitemap.xml
 */
export const generateSitemap = async (_req: Request, res: Response): Promise<void> => {
  try {
    const baseUrl = getBaseUrl();
    const now = new Date().toISOString();

    // Start XML sitemap
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    sitemap += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

    // Add static pages
    for (const page of staticPages) {
      sitemap += generateUrlEntry(
        baseUrl,
        page.path,
        now,
        page.changefreq,
        page.priority,
        true
      );
    }

    // Fetch dynamic content
    const [books, authors] = await Promise.all([
      fetchPublishedBooks(),
      fetchPublicAuthors(),
    ]);

    // Add published books
    for (const book of books) {
      sitemap += generateUrlEntry(
        baseUrl,
        `/book/${book.id}`,
        book.updated_at,
        'weekly',
        '0.7',
        true
      );
    }

    // Add author profiles (route is /profile/:id, not /author/:id)
    for (const author of authors) {
      sitemap += generateUrlEntry(
        baseUrl,
        `/profile/${author.id}`,
        author.updated_at,
        'weekly',
        '0.6',
        true
      );
    }

    // Close sitemap
    sitemap += '</urlset>';

    // Set headers for XML response
    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.status(200).send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).set('Content-Type', 'text/plain').send('Error generating sitemap');
  }
};

/**
 * Generate robots.txt
 * GET /robots.txt
 */
export const generateRobotsTxt = (_req: Request, res: Response): void => {
  const baseUrl = getBaseUrl();

  const robotsTxt = `# MeStory Robots.txt (server-generated)
# Mirrors client/public/robots.txt — keep both in sync.

User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard
Disallow: /editor/
Disallow: /design/
Disallow: /admin
Disallow: /settings
Disallow: /library
Disallow: /earnings
Disallow: /login
Disallow: /register
Crawl-delay: 1

# AI / generative search crawlers — allowed for GEO/AEO
User-agent: GPTBot
Allow: /
Disallow: /api/
Disallow: /dashboard
Disallow: /editor/
Disallow: /admin

User-agent: ChatGPT-User
Allow: /
Disallow: /api/

User-agent: OAI-SearchBot
Allow: /
Disallow: /api/

User-agent: ClaudeBot
Allow: /
Disallow: /api/

User-agent: anthropic-ai
Allow: /
Disallow: /api/

User-agent: Claude-Web
Allow: /
Disallow: /api/

User-agent: PerplexityBot
Allow: /
Disallow: /api/

User-agent: Google-Extended
Allow: /
Disallow: /api/

User-agent: Applebot-Extended
Allow: /
Disallow: /api/

User-agent: CCBot
Allow: /
Disallow: /api/

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml
`;

  res.set('Content-Type', 'text/plain');
  res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
  res.status(200).send(robotsTxt);
};

export default {
  generateSitemap,
  generateRobotsTxt,
};
