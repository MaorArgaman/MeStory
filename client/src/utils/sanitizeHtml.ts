/**
 * Sanitizes user/author-authored rich-text HTML before it is rendered with
 * dangerouslySetInnerHTML. Book and chapter content is author-controlled and
 * is shown to OTHER readers once a book is published, so it must be stripped
 * of scripts, event handlers and javascript: URLs to prevent stored XSS.
 *
 * The allow-list matches what the TipTap editor produces (formatting,
 * headings, lists, links, images, tables) — anything else is removed.
 */

import DOMPurify from 'dompurify';

const CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'span', 'div', 'b', 'strong', 'i', 'em', 'u', 's', 'strike',
    'sub', 'sup', 'mark', 'small', 'blockquote', 'pre', 'code', 'hr',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'img', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'src', 'alt', 'title', 'width', 'height',
    'class', 'style', 'colspan', 'rowspan', 'dir', 'align',
  ],
  // DOMPurify's default URI handling already blocks javascript:/vbscript:
  // and other dangerous schemes while allowing http(s), mailto, tel,
  // relative URLs and data: images.
  ALLOW_DATA_ATTR: false,
};

/**
 * Returns a sanitized copy of `dirty` HTML, safe to pass to
 * dangerouslySetInnerHTML. Always run this on any author-authored content.
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, CONFIG) as unknown as string;
}
