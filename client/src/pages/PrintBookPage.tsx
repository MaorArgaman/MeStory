/**
 * PrintBookPage — a minimal, printer-friendly render of a book.
 *
 * This page exists solely so Puppeteer/headless Chrome can load it and convert
 * the rendered DOM into a PDF. It mirrors the visual style of BookLayoutPage's
 * PageRenderer, but strips out every bit of editing UI (toolbars, spreads,
 * navigation, buttons…). One flat column of pages, one `.print-page` per page,
 * with `@page` CSS so Chrome puts one logical page per physical page.
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
    settings: {
      fontSize?: number;
      lineHeight?: number;
      fontFamily?: string;
      textColor?: string;
      backgroundColor?: string;
      margins?: { top: number; bottom: number; left: number; right: number };
      showPageNumbers?: boolean;
      includeToc?: boolean;
    };
  };
  chapters?: Array<{ title: string; content: string }>;
}

// ---------- Helpers --------------------------------------------------------

const isRTL = (text: string): boolean =>
  /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F]/.test(text || '');

const defaultSettings = {
  fontSize: 14,
  lineHeight: 1.7,
  fontFamily: '"Playfair Display", "David Libre", "Frank Ruhl Libre", Georgia, serif',
  textColor: '#1a1a1a',
  backgroundColor: '#ffffff',
  margins: { top: 50, bottom: 50, left: 45, right: 45 },
  showPageNumbers: true,
};

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
      setTimeout(markReady, 300);
      return;
    }

    let remaining = imgs.length;
    const done = () => {
      remaining -= 1;
      if (remaining <= 0) setTimeout(markReady, 200);
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

  const settings = {
    ...defaultSettings,
    ...(book.pageLayout?.settings || {}),
    margins: { ...defaultSettings.margins, ...(book.pageLayout?.settings?.margins || {}) },
  };

  const pages = book.pageLayout?.pages || [];
  const rtl = (book.language || '').startsWith('he') || isRTL(book.title);

  return (
    <>
      <PrintStyles settings={settings} rtl={rtl} />

      {/* Cover as the very first physical page */}
      <CoverPage book={book} rtl={rtl} />

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

// ---------- Styles ---------------------------------------------------------

function PrintStyles({ settings, rtl }: { settings: any; rtl: boolean }) {
  // Chrome honors @page for headless PDF generation.
  // `size` controls paper, `margin` is zero because each .print-page handles its own padding.
  return (
    <style>{`
      @page {
        size: A5;
        margin: 0;
      }
      html, body {
        margin: 0;
        padding: 0;
        background: #e5e7eb;
        font-family: ${settings.fontFamily};
        color: ${settings.textColor};
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .print-page {
        width: 148mm;
        height: 210mm;
        background: ${settings.backgroundColor};
        color: ${settings.textColor};
        padding: ${settings.margins.top}px ${settings.margins.right}px ${settings.margins.bottom}px ${settings.margins.left}px;
        position: relative;
        overflow: hidden;
        box-sizing: border-box;
        page-break-after: always;
        break-after: page;
        direction: ${rtl ? 'rtl' : 'ltr'};
        text-align: ${rtl ? 'right' : 'left'};
        margin: 0 auto 8mm;
        box-shadow: 0 6px 24px rgba(0,0,0,0.15);
      }
      .print-page:last-child {
        page-break-after: auto;
      }
      .print-page .page-header {
        position: absolute;
        top: 10px;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 9px;
        color: #6b7280;
        letter-spacing: 0.5px;
        text-transform: uppercase;
      }
      .print-page .page-number {
        position: absolute;
        bottom: 14px;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 10px;
        color: #6b7280;
      }
      .print-page .page-body {
        font-size: ${settings.fontSize}px;
        line-height: ${settings.lineHeight};
        padding-top: 20px;
        padding-bottom: 30px;
        height: 100%;
        box-sizing: border-box;
        overflow: hidden;
      }
      .print-page .page-body h1,
      .print-page .page-body h2,
      .print-page .page-body h3 {
        font-weight: 700;
        margin: 0 0 14px 0;
        text-align: center;
      }
      .print-page .page-body h1 { font-size: 22px; }
      .print-page .page-body h2 { font-size: 18px; }
      .print-page .page-body h3 { font-size: 16px; }
      .print-page .page-body p { margin: 0 0 12px 0; text-align: justify; }
      .print-page .image {
        position: absolute;
      }
      .print-page .image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .cover-page {
        width: 148mm;
        height: 210mm;
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

function CoverPage({ book, rtl }: { book: BookData; rtl: boolean }) {
  const cover = book.coverDesign || {};
  const imageUrl = cover.imageUrl || cover.front?.imageUrl;
  const bgColor = cover.coverColor || cover.front?.colorPalette?.[0] || '#1a1a2e';
  const titleColor = cover.textColor || cover.front?.title?.color || '#ffffff';
  const authorName = book.author?.name || '';

  return (
    <div className="cover-page" style={{ background: bgColor, direction: rtl ? 'rtl' : 'ltr' }}>
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
  rtl: _rtl,
}: {
  page: PageContent;
  pageNumber: number;
  bookTitle: string;
  settings: any;
  rtl: boolean;
}) {
  const showHeader =
    page.type !== 'title' && page.type !== 'toc' && page.type !== 'blank' && page.type !== 'cover';
  const showPageNumber = settings.showPageNumbers !== false && page.type !== 'blank';

  return (
    <div className="print-page">
      {showHeader && <div className="page-header">{bookTitle}</div>}

      <div
        className="page-body"
        // The server stores page content as HTML. The editor also uses
        // dangerouslySetInnerHTML here, so we stay consistent.
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
              border: img.border ? `${img.border.width}px ${img.border.style} ${img.border.color}` : undefined,
            }}
          />
        </div>
      ))}

      {showPageNumber && <div className="page-number">{pageNumber}</div>}
    </div>
  );
}
