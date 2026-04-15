import { forwardRef, useRef, useState, useEffect } from 'react';
// @ts-ignore - react-pageflip has incomplete types
import HTMLFlipBook from 'react-pageflip';
import { X, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BookFlipReaderProps {
  book: {
    id: string;
    title: string;
    author?: { name: string };
    language: string;
    synopsis?: string;
    description?: string;
    coverDesign?: {
      coverColor?: string;
      textColor?: string;
      fontFamily?: string;
      imageUrl?: string;
      back?: {
        backgroundColor?: string;
        imageUrl?: string;
      };
    };
  };
  pages: Array<{
    id: string;
    content: string;
    type?: string;
  }>;
  frontCoverImageUrl?: string | null;
  backCoverImageUrl?: string | null;
  isRTL?: boolean;
  onClose: () => void;
}

// Individual page wrapper - must be forwardRef per react-pageflip API
const Page = forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string }>(
  ({ children, className = '' }, ref) => (
    <div
      ref={ref}
      className={`bg-white overflow-hidden ${className}`}
      style={{
        width: '100%',
        height: '100%',
        boxShadow: 'inset 0 0 30px rgba(0,0,0,0.08)',
      }}
    >
      {children}
    </div>
  )
);
Page.displayName = 'Page';

export default function BookFlipReader({
  book,
  pages,
  frontCoverImageUrl,
  backCoverImageUrl,
  isRTL: isRTLProp,
  onClose,
}: BookFlipReaderProps) {
  const { t } = useTranslation();
  const flipBookRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isBookOpen, setIsBookOpen] = useState(false);

  // Prefer the prop (computed from multiple signals in BookLayoutPage).
  // Fall back to language field if not provided.
  const isRTL = isRTLProp !== undefined ? isRTLProp : (book.language === 'he' || book.language === 'ar');
  const coverColor = book.coverDesign?.coverColor || '#1a1a2e';
  const textColor = book.coverDesign?.textColor || '#ffffff';
  const fontFamily =
    book.coverDesign?.fontFamily || (isRTL ? '"David Libre", serif' : '"Playfair Display", serif');
  const authorName = book.author?.name || '';

  // Ensure even number of pages (flipbook needs pairs); pad with blank if odd
  const normalizedPages = pages.length % 2 === 0 ? pages : [...pages, { id: 'blank-pad', content: '', type: 'blank' }];

  useEffect(() => {
    // Total = front cover + content pages + back cover
    setTotalPages(normalizedPages.length + 2);
  }, [normalizedPages.length]);

  const handleFlip = (e: any) => {
    setCurrentPage(e.data);
    if (e.data > 0) setIsBookOpen(true);
    if (e.data === 0) setIsBookOpen(false);
  };

  const goToStart = () => {
    flipBookRef.current?.pageFlip()?.flip(0);
  };

  const flipNext = () => {
    flipBookRef.current?.pageFlip()?.flipNext();
  };

  const flipPrev = () => {
    flipBookRef.current?.pageFlip()?.flipPrev();
  };

  // For RTL: "next" visually means previous page in DOM, swap button actions
  const handleNextClick = isRTL ? flipPrev : flipNext;
  const handlePrevClick = isRTL ? flipNext : flipPrev;

  const isAtEnd = currentPage >= totalPages - 1;

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-deep-space via-[#0a0a1f] to-cosmic-purple/30 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-black/30 backdrop-blur-sm border-b border-memorial-gold/20">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-memorial-gold hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
          <span className="text-sm font-medium">{isRTL ? 'סגור' : 'Close'}</span>
        </button>

        <div className="text-memorial-gold/80 text-sm font-medium tracking-wide" dir={isRTL ? 'rtl' : 'ltr'}>
          {currentPage === 0
            ? t('book_layout.front_cover')
            : isAtEnd
            ? t('book_layout.back_cover')
            : isRTL
            ? `${totalPages - 2} / ${currentPage}`
            : `${currentPage} / ${totalPages - 2}`}
        </div>

        <button
          onClick={goToStart}
          disabled={currentPage === 0}
          className="flex items-center gap-2 text-memorial-gold hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title={isRTL ? 'חזרה להתחלה' : 'Back to start'}
        >
          <RotateCcw className="w-5 h-5" />
          <span className="text-sm font-medium hidden sm:inline">
            {isRTL ? 'חזרה להתחלה' : 'Back to start'}
          </span>
        </button>
      </div>

      {/* Book Flip Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden">
        <div
          className="relative"
          style={{
            // Mirror the whole book for RTL - content inside is un-mirrored below
            transform: isRTL ? 'scaleX(-1)' : 'none',
          }}
        >
          <HTMLFlipBook
            ref={flipBookRef}
            width={400}
            height={560}
            size="stretch"
            minWidth={280}
            maxWidth={500}
            minHeight={400}
            maxHeight={700}
            maxShadowOpacity={0.5}
            showCover={true}
            mobileScrollSupport={true}
            drawShadow={true}
            flippingTime={900}
            usePortrait={false}
            autoSize={true}
            clickEventForward={true}
            useMouseEvents={true}
            swipeDistance={30}
            showPageCorners={true}
            disableFlipByClick={false}
            startPage={0}
            startZIndex={0}
            className="book-flip"
            style={{}}
            onFlip={handleFlip}
          >
            {/* Front Cover */}
            <Page className="front-cover">
              <div
                className="w-full h-full flex flex-col items-center justify-center relative"
                style={{
                  backgroundColor: coverColor,
                  color: textColor,
                  fontFamily,
                  transform: isRTL ? 'scaleX(-1)' : 'none',
                  backgroundImage: frontCoverImageUrl ? `url(${frontCoverImageUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {frontCoverImageUrl && <div className="absolute inset-0 bg-black/30" />}
                <div className="relative z-10 text-center px-6">
                  <h1
                    className="font-bold mb-6 drop-shadow-lg"
                    style={{ fontSize: 'clamp(1.2rem, 4vw, 2rem)', lineHeight: 1.2 }}
                  >
                    {book.title}
                  </h1>
                  {authorName && (
                    <p
                      className="drop-shadow-md opacity-90"
                      style={{ fontSize: 'clamp(0.8rem, 2.5vw, 1.1rem)' }}
                    >
                      {authorName}
                    </p>
                  )}
                </div>
              </div>
            </Page>

            {/* Content Pages */}
            {normalizedPages.map((page, index) => (
              <Page key={page.id}>
                <div
                  className="w-full h-full p-8 overflow-hidden"
                  style={{
                    direction: isRTL ? 'rtl' : 'ltr',
                    fontFamily,
                    transform: isRTL ? 'scaleX(-1)' : 'none',
                  }}
                >
                  <div
                    className="prose prose-sm max-w-none h-full overflow-hidden text-gray-800"
                    style={{ fontSize: '14px', lineHeight: 1.7 }}
                    dangerouslySetInnerHTML={{ __html: page.content || '' }}
                  />
                  <div
                    className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-400"
                    style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }}
                  >
                    {index + 1}
                  </div>
                </div>
              </Page>
            ))}

            {/* Back Cover */}
            <Page className="back-cover">
              <div
                className="w-full h-full flex flex-col items-center justify-center relative p-8"
                style={{
                  backgroundColor: book.coverDesign?.back?.backgroundColor || coverColor,
                  color: textColor,
                  fontFamily,
                  transform: isRTL ? 'scaleX(-1)' : 'none',
                  backgroundImage: backCoverImageUrl ? `url(${backCoverImageUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {backCoverImageUrl && <div className="absolute inset-0 bg-black/50" />}
                <div className="relative z-10 text-center max-w-[85%]">
                  {(book.synopsis || book.description) && (
                    <p
                      className="drop-shadow-md leading-relaxed"
                      style={{ fontSize: 'clamp(0.75rem, 2vw, 0.95rem)' }}
                    >
                      {book.synopsis || book.description}
                    </p>
                  )}
                </div>
              </div>
            </Page>
          </HTMLFlipBook>
        </div>
      </div>

      {/* Bottom controls
          Visual layout:
          - LTR: [←prev]  [open/restart]  [next→]   — next is on the right
          - RTL: [←next]  [open/restart]  [prev→]   — next is on the left (Hebrew reading direction)
      */}
      <div className="flex items-center justify-center gap-4 px-6 py-4 bg-black/30 backdrop-blur-sm border-t border-memorial-gold/20">
        {/* Left visual button: next in RTL, prev in LTR */}
        <button
          onClick={isRTL ? flipNext : flipPrev}
          disabled={isRTL ? isAtEnd : currentPage === 0}
          className="p-3 rounded-full bg-memorial-gold/10 hover:bg-memorial-gold/20 text-memorial-gold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          title={isRTL ? 'הדף הבא' : 'Previous'}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {!isBookOpen && (
          <button
            onClick={flipNext}
            className="px-6 py-3 rounded-full bg-memorial-gold text-deep-space font-semibold hover:bg-memorial-gold/90 transition-all shadow-lg"
          >
            {isRTL ? 'פתח את הספר' : 'Open the book'}
          </button>
        )}

        {isAtEnd && (
          <button
            onClick={goToStart}
            className="px-6 py-3 rounded-full bg-memorial-gold text-deep-space font-semibold hover:bg-memorial-gold/90 transition-all shadow-lg flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            {isRTL ? 'חזרה להתחלה' : 'Back to start'}
          </button>
        )}

        {/* Right visual button: prev in RTL, next in LTR */}
        <button
          onClick={isRTL ? flipPrev : flipNext}
          disabled={isRTL ? currentPage === 0 : isAtEnd}
          className="p-3 rounded-full bg-memorial-gold/10 hover:bg-memorial-gold/20 text-memorial-gold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          title={isRTL ? 'הדף הקודם' : 'Next'}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
