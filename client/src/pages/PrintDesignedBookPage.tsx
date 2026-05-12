/**
 * PrintDesignedBookPage — renders a book with its auto-generated
 * design plan (book.autoDesignPlan). Counterpart to PrintBookPage,
 * but driven by the planner agent's output instead of the manual
 * editor's pageLayout.
 *
 * Puppeteer hits /print/:bookId/designed?token=... to convert this to
 * PDF. The page also works as an iframe preview inside the editor —
 * it sets body.print-ready when content + images are loaded.
 */

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import DesignedBookView from '../components/autoDesign/DesignedBookView';
import type { BookForRender, DesignPlan } from '../components/autoDesign/designPlanTypes';

interface ApiBookResponse {
  id: string;
  title: string;
  author?: { name?: string };
  chapters?: Array<{ title: string; content: string }>;
  pageImages?: Array<{ _id?: string; url: string; pageIndex: number }>;
  autoDesignPlan?: DesignPlan;
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

  // Mark ready once images have settled — same pattern as PrintBookPage
  // so puppeteerExportService can keep using the same `body.print-ready`
  // signal.
  useEffect(() => {
    if (!book?.autoDesignPlan) return;
    let cancelled = false;
    const markReady = () => {
      if (cancelled) return;
      document.body.classList.add('print-ready');
    };
    // Defer one tick so React has painted the DesignedBookView.
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
    return (
      <div style={{ padding: 40, fontFamily: 'sans-serif', color: '#900' }}>
        שגיאה בטעינת הספר: {error}
      </div>
    );
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
  };

  return <DesignedBookView book={renderable} plan={book.autoDesignPlan} />;
}
