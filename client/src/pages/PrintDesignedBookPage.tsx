/**
 * PrintDesignedBookPage — renders a book with its auto-generated design
 * plan (book.autoDesignPlan): a FULL front cover (image + title/author
 * overlay), the designed interior pages, and a back cover (synopsis +
 * author). Counterpart to PrintBookPage, driven by the planner agent's
 * output instead of the manual editor's pageLayout.
 *
 * Puppeteer hits /print/:bookId/designed?token=... to convert this to PDF.
 * It also works as the in-editor iframe preview; it sets body.print-ready
 * when content + images have settled.
 */

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import type { CSSProperties } from 'react';
import { api } from '../services/api';
import DesignedBookView from '../components/autoDesign/DesignedBookView';
import type { BookForRender, DesignPlan } from '../components/autoDesign/designPlanTypes';
import {
  FRONT_OVERLAY,
  BACK_OVERLAY,
  COVER_SCALE,
  titleStyle,
  authorStyle,
  synopsisStyle,
  backAuthorStyle,
} from '../utils/coverStyles';

interface CoverText {
  text?: string;
  font?: string;
  color?: string;
}
interface ApiBookResponse {
  id: string;
  title: string;
  language?: string;
  synopsis?: string;
  description?: string;
  author?: { name?: string };
  chapters?: Array<{ title: string; content: string }>;
  pageImages?: Array<{ _id?: string; url: string; pageIndex: number }>;
  pageLayout?: { pages?: Array<{ images?: Array<{ url?: string }> }> };
  autoDesignPlan?: DesignPlan;
  coverDesign?: {
    front?: {
      imageUrl?: string;
      backgroundColor?: string;
      gradientColors?: string[];
      title?: CoverText;
      subtitle?: CoverText;
      authorName?: CoverText;
    };
    back?: {
      imageUrl?: string;
      backgroundColor?: string;
      synopsis?: string;
      authorBio?: string;
    };
  };
}

const PAGE_MM = { w: 148, h: 210 };

const isRTLText = (t?: string): boolean => /[֐-׿]/.test(t || '');

const pageBox: CSSProperties = {
  width: `${PAGE_MM.w}mm`,
  height: `${PAGE_MM.h}mm`,
  position: 'relative',
  overflow: 'hidden',
  margin: '0 auto 12mm auto',
  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
  pageBreakAfter: 'always',
  breakAfter: 'page',
};

function FrontCover({ book }: { book: ApiBookResponse }) {
  const front = book.coverDesign?.front || {};
  const rtl = isRTLText(book.title) || book.language === 'he';
  const imageUrl = front.imageUrl;
  const bg =
    front.backgroundColor ||
    (front.gradientColors && front.gradientColors.length
      ? `linear-gradient(135deg, ${front.gradientColors.join(', ')})`
      : '#1a1a2e');
  const txtColor = front.title?.color || '#ffffff';
  const font = front.title?.font || (rtl ? 'David Libre' : 'Georgia');
  const authorName = front.authorName?.text || book.author?.name || '';

  return (
    <div className="adv-cover-page" style={{ ...pageBox, background: bg }}>
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          crossOrigin="anonymous"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      <div style={{ position: 'absolute', inset: 0, background: FRONT_OVERLAY }} />
      {/* Title — top third */}
      <div style={{ position: 'absolute', top: '14%', left: '8%', right: '8%' }}>
        <div style={titleStyle(book.title, txtColor, font, COVER_SCALE.print)}>{book.title}</div>
      </div>
      {/* Author — lower area */}
      {authorName && (
        <div style={{ position: 'absolute', bottom: '12%', left: '8%', right: '8%' }}>
          <div style={authorStyle(txtColor, font, COVER_SCALE.print)}>
            {rtl ? `מאת ${authorName}` : `by ${authorName}`}
          </div>
        </div>
      )}
    </div>
  );
}

function BackCover({ book }: { book: ApiBookResponse }) {
  const back = book.coverDesign?.back || {};
  const front = book.coverDesign?.front || {};
  const rtl = isRTLText(book.title) || book.language === 'he';
  const synopsis = back.synopsis || book.synopsis || book.description || '';
  if (!synopsis && !back.imageUrl && !back.authorBio) return null;
  const bg = back.backgroundColor || front.backgroundColor || '#1a1a2e';
  const txtColor = front.title?.color || '#ffffff';
  const font = front.title?.font || (rtl ? 'David Libre' : 'Georgia');

  return (
    <div className="adv-cover-page" style={{ ...pageBox, background: bg }}>
      {back.imageUrl && (
        <img
          src={back.imageUrl}
          alt=""
          crossOrigin="anonymous"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      <div style={{ position: 'absolute', inset: 0, background: BACK_OVERLAY }} />
      <div style={{ position: 'absolute', top: '16%', bottom: '16%', left: '10%', right: '10%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {synopsis && (
          <p style={{ ...synopsisStyle(synopsis, txtColor, font, rtl, COVER_SCALE.print), margin: 0 }}>
            {synopsis}
          </p>
        )}
        {back.authorBio && (
          <p style={{ ...synopsisStyle(back.authorBio, txtColor, font, rtl, COVER_SCALE.print), margin: '16px 0 0 0', opacity: 0.85 }}>
            {back.authorBio}
          </p>
        )}
        <div style={{ ...backAuthorStyle(txtColor, font, rtl, COVER_SCALE.print), marginTop: 28, letterSpacing: '1px' }}>
          {book.title}
        </div>
      </div>
    </div>
  );
}

export default function PrintDesignedBookPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const [params] = useSearchParams();

  const [book, setBook] = useState<ApiBookResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tokenFromUrl = params.get('token');
    if (tokenFromUrl && !localStorage.getItem('token')) {
      localStorage.setItem('token', tokenFromUrl);
    }
  }, [params]);

  useEffect(() => {
    if (!bookId) return;
    (async () => {
      try {
        const res = await api.get(`/books/${bookId}`);
        const data = res.data?.data?.book || res.data?.data;
        if (!data) throw new Error('Book not found');
        setBook(data);
      } catch (e: any) {
        setError(e?.message || 'Failed to load book');
      }
    })();
  }, [bookId]);

  useEffect(() => {
    if (!book?.autoDesignPlan) return;
    let cancelled = false;
    const markReady = () => {
      if (cancelled) return;
      document.body.classList.add('print-ready');
    };
    const t = setTimeout(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      if (imgs.length === 0) {
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
    }, 100);
    const failSafe = setTimeout(markReady, 15_000);
    return () => {
      cancelled = true;
      clearTimeout(t);
      clearTimeout(failSafe);
    };
  }, [book]);

  if (error) {
    return <div style={{ padding: 40, fontFamily: 'sans-serif', color: '#900' }}>שגיאה בטעינת הספר: {error}</div>;
  }
  if (!book) {
    return <div style={{ padding: 40, fontFamily: 'sans-serif' }}>טוען ספר…</div>;
  }
  if (!book.autoDesignPlan) {
    return (
      <div style={{ padding: 40, fontFamily: 'sans-serif', color: '#666' }}>
        לספר הזה אין עדיין עיצוב אוטומטי. הפעל את הפיצ'ר מתוך עורך הספר.
      </div>
    );
  }

  const renderable: BookForRender = {
    id: book.id,
    title: book.title,
    author: book.author,
    chapters: book.chapters,
    pageImages: book.pageImages,
    pageLayout: book.pageLayout,
  };

  return (
    <div style={{ background: '#E8E5DD', minHeight: '100vh', padding: '12mm 0', direction: 'rtl' }}>
      {book.coverDesign?.front && <FrontCover book={book} />}
      <DesignedBookView book={renderable} plan={book.autoDesignPlan} embedded />
      <BackCover book={book} />
    </div>
  );
}
