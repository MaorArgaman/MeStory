/**
 * PrintBookPage — a minimal, printer-friendly render of a book.
 *
 * This page exists solely so Puppeteer/headless Chrome can load it and convert
 * the rendered DOM into a PDF. It mirrors the visual style of BookLayoutPage's
 * PageRenderer, but strips out every bit of editing UI (toolbars, spreads,
 * navigation, buttons…). One flat column of pages, one `.print-page` per page,
 * with `@page` CSS so Chrome puts one logical page per physical page.
 *
 * Full design fidelity: background patterns, page frames, drop caps, corner
 * decorations, multi-column layouts, accent colours, title fonts and
 * underlines, header decorations, and section dividers are all applied — so
 * the PDF matches exactly what the user sees in the editor.
 *
 * The server signals "page is ready" by watching for `.print-ready` on <body>.
 */

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';

// ---------- Types (narrow, locally-defined to keep this page self-contained) --

interface PageImage {
  id: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  borderRadius?: number;
  shadow?: boolean;
  textWrap?: 'behind' | 'front' | 'wrap';
  flipH?: boolean;
  flipV?: boolean;
  border?: { width: number; style: string; color: string };
}

interface PageContent {
  id: string;
  type: 'chapter' | 'blank' | 'toc' | 'title' | 'dedication' | 'summary' | 'cover';
  chapterIndex?: number;
  pageIndex?: number;
  content: string;
  images?: PageImage[];
}

interface BookData {
  id: string;
  title: string;
  genre: string;
  language: string;
  description?: string;
  synopsis?: string;
  author?: { _id?: string; id?: string; name?: string };
  coverDesign?: any;
  pageLayout?: {
    pages: PageContent[];
    settings: Record<string, any>;
  };
  chapters?: Array<{ title: string; content: string }>;
}

// ---------- Page-size table (mirrors BookPageRenderer) ----------------------

const PAGE_SIZE_MM: Record<string, { width: number; height: number }> = {
  A4:     { width: 210, height: 297 },
  A5:     { width: 148, height: 210 },
  B5:     { width: 176, height: 250 },
  Letter: { width: 216, height: 279 },
  '6x9':  { width: 152, height: 229 },
  '5x8':  { width: 127, height: 203 },
  Square: { width: 210, height: 210 },
  Pocket: { width: 127, height: 178 },
};

// ---------- Helpers --------------------------------------------------------

const isRTL = (text: string): boolean =>
  /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F]/.test(text || '');

const defaultSettings: Record<string, any> = {
  fontSize: 14,
  lineHeight: 1.7,
  fontFamily: 'David Libre',
  titleFont: '',
  textColor: '#1a1a1a',
  accentColor: '#8b6914',
  frameColor: '',
  backgroundColor: '#ffffff',
  margins: { top: 50, bottom: 50, left: 45, right: 45 },
  showPageNumbers: true,
  dropCapStyle: 'none',
  dividerStyle: 'none',
  sectionDivider: '',
  pageFrame: 'none',
  backgroundPattern: 'none',
  headerDecoration: 'none',
  cornerDecorations: 'none',
  titleUnderline: 'none',
  columns: 1,
  paragraphSpacing: 12,
  pageSize: 'A5',
  customPageSize: null,
};

/** Convert hex colour to an rgba() string. */
function hexToRgba(hex: string, alpha: number): string {
  const c = (hex || '#8b6914').replace('#', '');
  const r = parseInt(c.slice(0, 2), 16) || 139;
  const g = parseInt(c.slice(2, 4), 16) || 105;
  const b = parseInt(c.slice(4, 6), 16) || 20;
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Build the CSS background-image / background-size for a pattern. */
function buildPatternCSS(pattern: string, accentColor: string): string {
  if (!pattern || pattern === 'none') return '';
  const c = (pct: number) => hexToRgba(accentColor, pct);
  const enc = (s: string) => encodeURIComponent(s);

  switch (pattern) {
    case 'dots':
      return `background-image: radial-gradient(circle, ${c(0.12)} 1px, transparent 1px); background-size: 20px 20px;`;
    case 'stripes':
      return `background-image: repeating-linear-gradient(0deg, transparent, transparent 27px, ${c(0.06)} 27px, ${c(0.06)} 28px);`;
    case 'grid':
      return `background-image: linear-gradient(${c(0.05)} 1px, transparent 1px), linear-gradient(90deg, ${c(0.05)} 1px, transparent 1px); background-size: 24px 24px;`;
    case 'waves': {
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='100' height='20'><path d='M0,10 Q25,2 50,10 Q75,18 100,10' fill='none' stroke='${enc(c(0.07))}' stroke-width='1.5'/></svg>`;
      return `background-image: url("data:image/svg+xml,${svg}"); background-size: 100px 20px;`;
    }
    case 'geometric': {
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><rect x='0' y='0' width='40' height='40' fill='none' stroke='${enc(c(0.05))}' stroke-width='1'/></svg>`;
      return `background-image: url("data:image/svg+xml,${svg}"); background-size: 40px 40px;`;
    }
    case 'confetti': {
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><circle cx='15' cy='15' r='3' fill='${enc(c(0.1))}'/><rect x='30' y='8' width='6' height='6' fill='${enc(c(0.08))}' transform='rotate(20,33,11)'/><circle cx='45' cy='40' r='2' fill='${enc(c(0.12))}'/><rect x='8' y='38' width='5' height='5' fill='${enc(c(0.07))}' transform='rotate(-15,10,40)'/></svg>`;
      return `background-image: url("data:image/svg+xml,${svg}"); background-size: 60px 60px;`;
    }
    case 'stars': {
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='50' height='50'><text x='10' y='20' font-size='12' fill='${enc(c(0.1))}'>✦</text><text x='28' y='38' font-size='8' fill='${enc(c(0.07))}'>✧</text></svg>`;
      return `background-image: url("data:image/svg+xml,${svg}"); background-size: 50px 50px;`;
    }
    case 'hearts': {
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='50' height='50'><text x='10' y='22' font-size='14' fill='${enc(c(0.09))}'>♥</text><text x='30' y='42' font-size='10' fill='${enc(c(0.06))}'>♥</text></svg>`;
      return `background-image: url("data:image/svg+xml,${svg}"); background-size: 50px 50px;`;
    }
    default:
      return '';
  }
}

/** Build the CSS for a page frame. */
function buildFrameCSS(frame: string, color: string): string {
  const c = color || '#8b6914';
  switch (frame) {
    case 'simple':   return `box-shadow: inset 0 0 0 1px ${c};`;
    case 'double':   return `box-shadow: inset 0 0 0 1px ${c}, inset 0 0 0 3px ${c}80;`;
    case 'ornate':   return `box-shadow: inset 0 0 0 1.5px ${c}, inset 0 0 0 3.5px ${c}40, inset 0 0 0 5px ${c}20;`;
    case 'dashed':   return `outline: 2px dashed ${c}; outline-offset: -6px;`;
    case 'dotted':   return `outline: 2px dotted ${c}; outline-offset: -6px;`;
    case 'rounded':  return `box-shadow: inset 0 0 0 1.5px ${c}; border-radius: 8px; overflow: hidden;`;
    case 'gradient': return `box-shadow: inset 0 0 0 2px ${c};`;
    default:         return '';
  }
}

/** Build CSS for drop caps. */
function buildDropCapCSS(style: string, accentColor: string, isRtl: boolean): string {
  if (!style || style === 'none') return '';
  const floatDir = isRtl ? 'right' : 'left';
  const marginSide = isRtl ? 'margin-left' : 'margin-right';
  const acc = accentColor || '#8b6914';

  if (style === 'classic' || style === 'modern') {
    return `
      .print-page.drop-cap .page-body p:first-of-type::first-letter {
        float: ${floatDir}; font-size: 4.2em; line-height: 0.85; font-weight: bold;
        ${marginSide}: 8px; margin-bottom: 0; color: ${acc};
      }`;
  }
  if (style === 'decorative') {
    return `
      .print-page.drop-cap .page-body p:first-of-type::first-letter {
        float: ${floatDir}; font-size: 4.5em; line-height: 0.8; font-weight: bold;
        ${marginSide}: 10px; padding: 4px 8px;
        border: 2px solid ${acc}; color: ${acc}; background: #faf6ef;
      }`;
  }
  if (style === 'box') {
    return `
      .print-page.drop-cap .page-body p:first-of-type::first-letter {
        float: ${floatDir}; font-size: 3.8em; line-height: 0.85; font-weight: bold;
        ${marginSide}: 10px; padding: 6px 10px; background: ${acc}; color: white;
      }`;
  }
  return '';
}

/** Build CSS for title underlines. */
function buildTitleUnderlineCSS(style: string, accentColor: string): string {
  if (!style || style === 'none') return '';
  const acc = accentColor || '#8b6914';
  switch (style) {
    case 'simple':   return `.print-page .page-body h1, .print-page .page-body h2 { border-bottom: 1px solid ${acc}; padding-bottom: 6px; }`;
    case 'double':   return `.print-page .page-body h1, .print-page .page-body h2 { border-bottom: 3px double ${acc}; padding-bottom: 6px; }`;
    case 'wavy':     return `.print-page .page-body h1, .print-page .page-body h2 { border-bottom: 2px solid ${acc}; padding-bottom: 6px; text-decoration: underline wavy ${acc}; }`;
    case 'dotted':   return `.print-page .page-body h1, .print-page .page-body h2 { border-bottom: 2px dotted ${acc}; padding-bottom: 6px; }`;
    case 'gradient': return `.print-page .page-body h1, .print-page .page-body h2 { border-image: linear-gradient(to right, ${acc}, transparent) 1; border-bottom: 2px solid; padding-bottom: 6px; }`;
    case 'ornate':   return `.print-page .page-body h1, .print-page .page-body h2 { border-bottom: 2px solid ${acc}; padding-bottom: 8px; }`;
    default:         return '';
  }
}

/** Build CSS for header decoration. */
function buildHeaderDecoCSS(style: string, accentColor: string): string {
  if (!style || style === 'none') return '';
  const acc = accentColor || '#8b6914';
  switch (style) {
    case 'line':
      return `.print-page .page-header { border-bottom: 0.5px solid ${acc}40; padding-bottom: 4px; }`;
    case 'gradient-line':
      return `.print-page .page-header { border-bottom: 1px solid; border-image: linear-gradient(to right, transparent, ${acc}60, transparent) 1; padding-bottom: 4px; }`;
    case 'dots':
      return `.print-page .page-header::after { content: '• • •'; display: block; color: ${acc}; font-size: 7px; letter-spacing: 4px; }`;
    default:
      return '';
  }
}

/** Corner SVG paths as raw HTML strings for injection. */
function cornerSVG(type: string, color: string, size: number): string {
  if (type === 'flourish') {
    return `<svg viewBox="0 0 60 60" width="${size}" height="${size}" fill="none" stroke="${color}" style="color:${color}"><path d="M2,2 L50,2 L50,4 L4,4 L4,50 L2,50 Z" fill="${color}" opacity="0.35"/><path d="M8,8 Q8,22 8,32 Q22,8 32,8" stroke-width="1.5"/><circle cx="8" cy="8" r="2.5" fill="${color}"/></svg>`;
  }
  if (type === 'floral') {
    return `<svg viewBox="0 0 60 60" width="${size}" height="${size}" fill="none" stroke="${color}"><path d="M0,0 L48,0 L48,2 L2,2 L2,48 L0,48 Z" fill="${color}" opacity="0.4"/><circle cx="14" cy="14" r="5" stroke-width="1.2"/><circle cx="14" cy="14" r="2.5" fill="${color}"/><path d="M19,14 Q24,9 29,14" stroke-width="1"/><path d="M14,19 Q9,24 14,29" stroke-width="1"/></svg>`;
  }
  if (type === 'geometric') {
    return `<svg viewBox="0 0 60 60" width="${size}" height="${size}" fill="none" stroke="${color}"><polyline points="0,42 0,0 42,0" stroke-width="2"/><polyline points="0,30 0,8 8,0 30,0" stroke-width="1" opacity="0.5"/><rect x="2" y="2" width="8" height="8" fill="${color}" opacity="0.3"/></svg>`;
  }
  if (type === 'stars') {
    return `<svg viewBox="0 0 40 40" width="${size}" height="${size}" fill="${color}"><text x="2" y="18" font-size="14" opacity="0.7">✦</text><text x="16" y="32" font-size="10" opacity="0.5">✧</text></svg>`;
  }
  if (type === 'hearts') {
    return `<svg viewBox="0 0 40 40" width="${size}" height="${size}" fill="${color}"><text x="4" y="20" font-size="14" opacity="0.6">♥</text></svg>`;
  }
  if (type === 'leaves') {
    return `<svg viewBox="0 0 40 40" width="${size}" height="${size}" fill="none" stroke="${color}"><path d="M4,36 Q4,4 36,4 Q4,4 4,36 Z" fill="${color}" opacity="0.25"/><path d="M4,36 L20,20" stroke-width="1"/></svg>`;
  }
  return '';
}

// ---------- Component ------------------------------------------------------

export default function PrintBookPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const [params] = useSearchParams();

  const [book, setBook] = useState<BookData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // If Puppeteer passed a token in the URL, use it for this specific page.
  // Don't overwrite existing localStorage token — just set it once if empty.
  useEffect(() => {
    const tokenFromUrl = params.get('token');
    if (tokenFromUrl && !localStorage.getItem('token')) {
      localStorage.setItem('token', tokenFromUrl);
    }
  }, [params]);

  // Load the book
  useEffect(() => {
    if (!bookId) return;
    (async () => {
      try {
        const res = await api.get(`/books/${bookId}`);
        const data = res.data?.data?.book || res.data?.data;
        if (!data) throw new Error('Book not found in response');
        setBook(data);
      } catch (e: any) {
        setError(e?.message || 'Failed to load book');
      }
    })();
  }, [bookId]);

  // Once the book is set and any images have had a chance to load, mark ready.
  // Puppeteer waits for `body.print-ready` before calling page.pdf().
  useEffect(() => {
    if (!book) return;
    let cancelled = false;

    const markReady = () => {
      if (cancelled) return;
      document.body.classList.add('print-ready');
      setReady(true);
    };

    // Wait for all <img> inside the document to load (or fail) before printing
    const imgs = Array.from(document.querySelectorAll('img'));
    if (imgs.length === 0) {
      // Small delay so fonts have a chance to swap in
      setTimeout(markReady, 500);
      return;
    }

    let remaining = imgs.length;
    const done = () => {
      remaining -= 1;
      if (remaining <= 0) setTimeout(markReady, 300);
    };
    imgs.forEach((img) => {
      if ((img as HTMLImageElement).complete) done();
      else {
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      }
    });

    // Safety fallback: mark ready after 15s regardless
    const failSafe = setTimeout(markReady, 15_000);
    return () => {
      cancelled = true;
      clearTimeout(failSafe);
    };
  }, [book]);

  if (error) {
    return <div style={{ padding: 40, color: 'red' }}>Error: {error}</div>;
  }
  if (!book) {
    return <div style={{ padding: 40 }}>Loading…</div>;
  }

  // Merge saved settings with defaults
  const raw = book.pageLayout?.settings || {};
  const settings: Record<string, any> = { ...defaultSettings };
  for (const key of Object.keys(defaultSettings)) {
    if (raw[key] !== undefined && raw[key] !== null) settings[key] = raw[key];
  }
  // Margins — merge nested object
  if (raw.margins) {
    settings.margins = { ...defaultSettings.margins, ...raw.margins };
  }

  const pages = book.pageLayout?.pages || [];
  const rtl = (book.language || '').startsWith('he') || isRTL(book.title);

  // Resolve page dimensions
  const pageSizeKey = settings.pageSize || 'A5';
  const pageDims =
    pageSizeKey === 'Custom' && settings.customPageSize
      ? settings.customPageSize
      : PAGE_SIZE_MM[pageSizeKey] || PAGE_SIZE_MM.A5;

  return (
    <>
      {/* Inject Google Fonts */}
      <GoogleFontsLink fontFamily={settings.fontFamily} titleFont={settings.titleFont} />

      <PrintStyles settings={settings} rtl={rtl} pageDims={pageDims} />

      {/* Cover as the very first physical page */}
      <CoverPage book={book} rtl={rtl} pageDims={pageDims} />

      {/* All book pages, in order. Each becomes one printed page. */}
      {pages.map((page, idx) => (
        <PrintPage
          key={page.id || idx}
          page={page}
          pageNumber={idx + 1}
          bookTitle={book.title}
          settings={settings}
          rtl={rtl}
        />
      ))}

      {/* Invisible sentinel — Puppeteer waits for this */}
      <div id="print-ready-sentinel" data-ready={ready ? '1' : '0'} />
    </>
  );
}

// ---------- Google Fonts Loader --------------------------------------------

function GoogleFontsLink({ fontFamily, titleFont }: { fontFamily: string; titleFont?: string }) {
  // Build the list of fonts we need, deduped
  const fonts = new Set<string>();
  const add = (f: string) => {
    if (!f) return;
    // Strip CSS stack fallbacks and quotes, take first token
    const name = f.replace(/['"]/g, '').split(',')[0].trim();
    if (name) fonts.add(name);
  };
  add(fontFamily);
  add(titleFont || '');

  const query = [
    'Frank+Ruhl+Libre:wght@300;400;500;700;900',
    'David+Libre:wght@400;700',
    'Heebo:wght@300;400;500;700',
    'Assistant:wght@300;400;600;700',
    'Playfair+Display:wght@400;600;700;900',
    'Cormorant+Garamond:wght@300;400;600;700',
    'Lora:wght@400;600;700',
    'Cinzel:wght@400;600;700',
    'Libre+Baskerville:wght@400;700',
    'EB+Garamond:wght@400;700',
  ].join('&family=');

  const href = `https://fonts.googleapis.com/css2?family=${query}&display=swap`;
  return <link rel="stylesheet" href={href} />;
}

// ---------- Styles ---------------------------------------------------------

function PrintStyles({
  settings,
  rtl,
  pageDims,
}: {
  settings: Record<string, any>;
  rtl: boolean;
  pageDims: { width: number; height: number };
}) {
  const acc = settings.accentColor || '#8b6914';
  const frameColor = settings.frameColor || acc;

  // Resolve font stacks
  const bodyFont = (settings.fontFamily || 'David Libre').replace(/['"]/g, '').split(',')[0].trim();
  const titleFont = (settings.titleFont || bodyFont).replace(/['"]/g, '').split(',')[0].trim();
  const fontStack = `"${bodyFont}", "David Libre", "Frank Ruhl Libre", Georgia, serif`;
  const titleFontStack = `"${titleFont}", "Playfair Display", serif`;

  const patternCSS = buildPatternCSS(settings.backgroundPattern, acc);
  const frameCSS = buildFrameCSS(settings.pageFrame, frameColor);
  const dropCapCSS = buildDropCapCSS(settings.dropCapStyle, acc, rtl);
  const titleUnderlineCSS = buildTitleUnderlineCSS(settings.titleUnderline, acc);
  const headerDecoCSS = buildHeaderDecoCSS(settings.headerDecoration, acc);
  const colCount = Number(settings.columns) || 1;
  const pSpacing = Number(settings.paragraphSpacing) || 12;
  const fs = Number(settings.fontSize) || 14;
  const lh = Number(settings.lineHeight) || 1.7;
  const m = settings.margins || { top: 50, bottom: 50, left: 45, right: 45 };

  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@300;400;500;700;900&family=David+Libre:wght@400;700&family=Heebo:wght@300;400;500;700&family=Assistant:wght@300;400;600;700&family=Playfair+Display:wght@400;600;700;900&family=Cormorant+Garamond:wght@300;400;600;700&family=Lora:wght@400;600;700&family=Cinzel:wght@400;600;700&display=swap');

      @page {
        size: ${pageDims.width}mm ${pageDims.height}mm;
        margin: 0;
      }
      *, *::before, *::after { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        background: #e5e7eb;
        font-family: ${fontStack};
        color: ${settings.textColor || '#1a1a1a'};
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      /* ── Page shell ──────────────────────────────────────── */
      .print-page {
        width: ${pageDims.width}mm;
        height: ${pageDims.height}mm;
        background: ${settings.backgroundColor || '#ffffff'};
        color: ${settings.textColor || '#1a1a1a'};
        padding: ${m.top}px ${m.right}px ${m.bottom}px ${m.left}px;
        position: relative;
        overflow: hidden;
        page-break-after: always;
        break-after: page;
        direction: ${rtl ? 'rtl' : 'ltr'};
        margin: 0 auto 8mm;
        box-shadow: 0 6px 24px rgba(0,0,0,0.15);
        --accent-color: ${acc};
        --frame-color: ${frameColor};
        ${patternCSS}
        ${frameCSS}
      }
      .print-page:last-child {
        page-break-after: auto;
      }

      /* ── Page header ─────────────────────────────────────── */
      .print-page .page-header {
        position: absolute;
        top: 10px;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 9px;
        color: ${acc}90;
        letter-spacing: 1px;
        text-transform: uppercase;
      }
      ${headerDecoCSS}

      /* ── Page number ─────────────────────────────────────── */
      .print-page .page-number {
        position: absolute;
        bottom: 14px;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 10px;
        color: ${settings.textColor || '#1a1a1a'}60;
        letter-spacing: 1px;
      }

      /* ── Page body ───────────────────────────────────────── */
      .print-page .page-body {
        font-size: ${fs}px;
        line-height: ${lh};
        padding-top: 22px;
        padding-bottom: 30px;
        height: 100%;
        box-sizing: border-box;
        overflow: hidden;
        text-align: ${rtl ? 'right' : 'justify'};
      }
      .print-page .page-body h1,
      .print-page .page-body h2,
      .print-page .page-body h3 {
        font-family: ${titleFontStack};
        font-weight: 700;
        margin: 0 0 14px 0;
        text-align: center;
        color: ${settings.textColor || '#1a1a1a'};
      }
      .print-page .page-body h1 { font-size: ${Math.round(fs * 1.6)}px; }
      .print-page .page-body h2 { font-size: ${Math.round(fs * 1.3)}px; }
      .print-page .page-body h3 { font-size: ${Math.round(fs * 1.1)}px; }
      .print-page .page-body p  { margin: 0 0 ${pSpacing}px 0; }

      /* ── Multi-column layout ─────────────────────────────── */
      ${colCount >= 2 ? `.print-page .page-body { columns: ${colCount}; column-gap: 1.5em; }` : ''}

      /* ── Drop caps ───────────────────────────────────────── */
      ${dropCapCSS}

      /* ── Title underlines ────────────────────────────────── */
      ${titleUnderlineCSS}

      /* ── Corner decorations ──────────────────────────────── */
      .print-page .corner {
        position: absolute;
        width: 36px;
        height: 36px;
        overflow: hidden;
        pointer-events: none;
      }
      .print-page .corner-tl { top: 8px; ${rtl ? 'right' : 'left'}: 8px; }
      .print-page .corner-tr { top: 8px; ${rtl ? 'left' : 'right'}: 8px; transform: scaleX(-1); }
      .print-page .corner-bl { bottom: 8px; ${rtl ? 'right' : 'left'}: 8px; transform: scaleY(-1); }
      .print-page .corner-br { bottom: 8px; ${rtl ? 'left' : 'right'}: 8px; transform: scale(-1); }

      /* ── Images ──────────────────────────────────────────── */
      .print-page .image {
        position: absolute;
      }
      .print-page .image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      /* ── Cover page ──────────────────────────────────────── */
      .cover-page {
        width: ${pageDims.width}mm;
        height: ${pageDims.height}mm;
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        page-break-after: always;
        break-after: page;
        margin: 0 auto 8mm;
        color: #fff;
      }
      .cover-page .cover-img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        z-index: 0;
      }
      .cover-page .cover-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.75) 100%);
        z-index: 1;
      }
      .cover-page .cover-text {
        position: relative;
        z-index: 2;
        text-align: center;
        padding: 0 24px;
      }
      .cover-page .cover-title {
        font-family: ${titleFontStack};
        font-size: 34px;
        font-weight: 700;
        margin: 0 0 16px 0;
        text-shadow: 0 2px 8px rgba(0,0,0,0.6);
      }
      .cover-page .cover-author {
        font-size: 16px;
        letter-spacing: 2px;
        text-transform: uppercase;
        opacity: 0.9;
      }

      @media print {
        html, body { background: #fff; }
        .print-page, .cover-page {
          box-shadow: none;
          margin: 0;
        }
      }
    `}</style>
  );
}

// ---------- Cover ----------------------------------------------------------

function CoverPage({
  book,
  rtl,
}: {
  book: BookData;
  rtl: boolean;
  pageDims?: { width: number; height: number };
}) {
  const cover = book.coverDesign || {};
  const imageUrl = cover.imageUrl || cover.front?.imageUrl;
  const bgColor = cover.coverColor || cover.front?.colorPalette?.[0] || '#1a1a2e';
  const titleColor = cover.textColor || cover.front?.title?.color || '#ffffff';
  const authorName = book.author?.name || '';

  return (
    <div
      className="cover-page"
      style={{ background: bgColor, direction: rtl ? 'rtl' : 'ltr' }}
    >
      {imageUrl && <img className="cover-img" src={imageUrl} alt="" crossOrigin="anonymous" />}
      <div className="cover-overlay" />
      <div className="cover-text">
        <h1 className="cover-title" style={{ color: titleColor }}>{book.title}</h1>
        {authorName && (
          <div className="cover-author" style={{ color: titleColor }}>
            {rtl ? `מאת ${authorName}` : `by ${authorName}`}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Single page ----------------------------------------------------

function PrintPage({
  page,
  pageNumber,
  bookTitle,
  settings,
}: {
  page: PageContent;
  pageNumber: number;
  bookTitle: string;
  settings: Record<string, any>;
  rtl?: boolean;
}) {
  const isChapter = page.type === 'chapter';
  const isBlank = page.type === 'blank';
  const isSpecial = page.type === 'title' || page.type === 'toc' || page.type === 'cover';

  const showHeader =
    !isSpecial && !isBlank && settings.headerDecoration !== 'none';
  const showPageNumber =
    settings.showPageNumbers !== false && !isBlank;

  const showCorners =
    settings.cornerDecorations && settings.cornerDecorations !== 'none';

  const acc = settings.accentColor || '#8b6914';
  const cornerColor = `${acc}90`;

  // Apply drop-cap class only on chapter pages when the style is set
  const dropCapClass =
    isChapter && settings.dropCapStyle && settings.dropCapStyle !== 'none'
      ? 'drop-cap'
      : '';

  return (
    <div className={`print-page ${dropCapClass}`}>
      {/* Corner decorations */}
      {showCorners && (
        <>
          <div
            className="corner corner-tl"
            dangerouslySetInnerHTML={{
              __html: cornerSVG(settings.cornerDecorations, cornerColor, 36),
            }}
          />
          <div
            className="corner corner-tr"
            dangerouslySetInnerHTML={{
              __html: cornerSVG(settings.cornerDecorations, cornerColor, 36),
            }}
          />
          <div
            className="corner corner-bl"
            dangerouslySetInnerHTML={{
              __html: cornerSVG(settings.cornerDecorations, cornerColor, 36),
            }}
          />
          <div
            className="corner corner-br"
            dangerouslySetInnerHTML={{
              __html: cornerSVG(settings.cornerDecorations, cornerColor, 36),
            }}
          />
        </>
      )}

      {/* Decorated header */}
      {showHeader && (
        <div className="page-header">
          {settings.headerDecoration === 'ornament'
            ? `✦ ${bookTitle} ✦`
            : bookTitle}
        </div>
      )}

      {/* Page content */}
      <div
        className="page-body"
        dangerouslySetInnerHTML={{ __html: page.content || '' }}
      />

      {/* Absolutely-positioned user images (percentage-based, same as editor) */}
      {(page.images || []).map((img) => (
        <div
          key={img.id}
          className="image"
          style={{
            left: `${img.x}%`,
            top: `${img.y}%`,
            width: `${img.width}%`,
            height: `${img.height}%`,
            transform: `rotate(${img.rotation || 0}deg)${img.flipH ? ' scaleX(-1)' : ''}${img.flipV ? ' scaleY(-1)' : ''}`,
            opacity: img.opacity ?? 1,
            zIndex: img.textWrap === 'behind' ? 0 : 10,
          }}
        >
          <img
            src={img.url}
            alt=""
            crossOrigin="anonymous"
            style={{
              borderRadius: img.borderRadius ? `${img.borderRadius}%` : undefined,
              boxShadow: img.shadow ? '0 4px 20px rgba(0,0,0,0.3)' : undefined,
              border: img.border
                ? `${img.border.width}px ${img.border.style} ${img.border.color}`
                : undefined,
            }}
          />
        </div>
      ))}

      {/* Section divider (shown at bottom of chapter pages) */}
      {isChapter && settings.dividerStyle && settings.dividerStyle !== 'none' && (
        <div
          style={{
            position: 'absolute',
            bottom: 28,
            left: 0,
            right: 0,
            textAlign: 'center',
            color: acc,
            fontSize: '0.85em',
            letterSpacing: '0.5em',
            opacity: 0.7,
            direction: 'ltr',
          }}
        >
          {settings.dividerStyle === 'ornament' || settings.dividerStyle === 'stars'
            ? settings.sectionDivider || (settings.dividerStyle === 'stars' ? '✦ ✧ ✦' : '⸻ ✦ ⸻')
            : settings.dividerStyle === 'dots'
            ? '• • • • •'
            : settings.dividerStyle === 'line'
            ? ''  // handled via CSS border below
            : settings.sectionDivider || '⸻ ✦ ⸻'}
        </div>
      )}

      {showPageNumber && (
        <div className="page-number">— {pageNumber} —</div>
      )}
    </div>
  );
}
