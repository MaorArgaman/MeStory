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

  // Tag each content page with its ORIGINAL page number (1-indexed) before any reversal
  const pagesWithNumbers = normalizedPages.map((p, i) => ({ ...p, pageNumber: i + 1 }));

  // For RTL: reverse the content order so the flipbook physically flips right-to-left.
  // react-pageflip always renders the first page on the right alone (with showCover),
  // then the next spread with left-right pairs. We want:
  //   LTR order in DOM: [FrontCover, p1, p2, p3, ..., pN, BackCover]
  //   RTL order in DOM: [BackCover, pN, ..., p2, p1, FrontCover]
  // This way, starting at the LAST position renders the front cover alone on the right
  // (visually the same as a closed Hebrew book). flipPrev then opens backward in DOM,
  // which visually advances reading in Hebrew direction.
  const orderedContentPages = isRTL ? [...pagesWithNumbers].reverse() : pagesWithNumbers;

  // Total DOM pages = front cover + content + back cover
  const totalDomPages = normalizedPages.length + 2;

  // For RTL, start at the last DOM index (which is the front cover after reversal).
  const initialStartPage = isRTL ? totalDomPages - 1 : 0;

  useEffect(() => {
    setTotalPages(totalDomPages);
  }, [totalDomPages]);

  const handleFlip = (e: any) => {
    const idx = e.data;
    setCurrentPage(idx);
    // For LTR: index 0 = front cover (closed). For RTL: last index = front cover (closed).
    const closedIdx = isRTL ? totalDomPages - 1 : 0;
    if (idx !== closedIdx) setIsBookOpen(true);
    else setIsBookOpen(false);
  };

  const goToStart = () => {
    flipBookRef.current?.pageFlip()?.flip(initialStartPage);
  };

  const flipNext = () => {
    flipBookRef.current?.pageFlip()?.flipNext();
  };

  const flipPrev = () => {
    flipBookRef.current?.pageFlip()?.flipPrev();
  };

  // Semantic actions: readNext advances reading (Hebrew: visually flips left),
  // readPrev goes backward (Hebrew: visually flips right).
  // In RTL the DOM order is reversed, so "read next" = flipPrev in DOM.
  const readNext = isRTL ? flipPrev : flipNext;
  const readPrev = isRTL ? flipNext : flipPrev;

  // "Start" state = book closed showing front cover
  // For LTR: currentPage === 0
  // For RTL: currentPage === totalDomPages - 1
  const isAtStart = isRTL ? currentPage === totalDomPages - 1 : currentPage === 0;
  // "End" state = book closed showing back cover (opposite end)
  const isAtEnd = isRTL ? currentPage === 0 : currentPage >= totalDomPages - 1;

  // Compute the "reading position" for display (1-based, going through content pages)
  // At start (front cover): 0. At end (back cover): content count.
  const readingPosition = isRTL
    ? totalDomPages - 1 - currentPage  // RTL: reversed
    : currentPage;
  const contentPageCount = normalizedPages.length;

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

        <div className="text-memorial-gold/80 text-sm font-medium tracking-wide" dir="ltr">
          {isAtStart
            ? t('book_layout.front_cover')
            : isAtEnd
            ? t('book_layout.back_cover')
            : `${readingPosition} / ${contentPageCount}`}
        </div>

        <button
          onClick={goToStart}
          disabled={isAtStart}
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
        <div className="relative">
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
            startPage={initialStartPage}
            startZIndex={0}
            className="book-flip"
            style={{}}
            onFlip={handleFlip}
          >
            {/* DOM order for RTL is: [BackCover, ...reversedContent, FrontCover]
                DOM order for LTR is: [FrontCover, ...content, BackCover]
                This way "next" in DOM always means "forward reading" in the book's natural direction. */}

            {/* First DOM page — Back cover for RTL, Front cover for LTR */}
            {isRTL ? (
              <Page className="back-cover">
                <div
                  className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
                  style={{
                    backgroundColor: book.coverDesign?.back?.backgroundColor || coverColor,
                    color: textColor,
                    fontFamily,
                    backgroundImage: backCoverImageUrl ? `url(${backCoverImageUrl})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {backCoverImageUrl && <div className="absolute inset-0 bg-black/50" />}
                  <div
                    className="relative z-10 text-center px-8 py-10 max-w-[88%] max-h-[85%] flex items-center justify-center"
                    style={{ direction: 'rtl' }}
                  >
                    {(() => {
                      const text = book.synopsis || book.description || '';
                      const len = text.length;
                      // Auto-scale font: shorter text = bigger, longer text = smaller
                      const fontSize = len < 200 ? '1rem' : len < 350 ? '0.85rem' : len < 500 ? '0.75rem' : '0.7rem';
                      const lineHeight = len < 200 ? 1.7 : len < 350 ? 1.6 : 1.5;
                      return text && (
                        <p
                          className="drop-shadow-md break-words"
                          style={{
                            fontSize,
                            lineHeight,
                            userSelect: 'none',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {text}
                        </p>
                      );
                    })()}
                  </div>
                </div>
              </Page>
            ) : (
              <Page className="front-cover">
                <div
                  className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
                  style={{
                    backgroundColor: coverColor,
                    color: textColor,
                    fontFamily,
                    backgroundImage: frontCoverImageUrl ? `url(${frontCoverImageUrl})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {frontCoverImageUrl && <div className="absolute inset-0 bg-black/30" />}
                  <div className="relative z-10 text-center px-6 max-w-[90%]">
                    <h1
                      className="font-bold mb-6 drop-shadow-lg break-words"
                      style={{ fontSize: 'clamp(1.2rem, 4vw, 2rem)', lineHeight: 1.2 }}
                    >
                      {book.title}
                    </h1>
                    {authorName && (
                      <p
                        className="drop-shadow-md opacity-90 break-words"
                        style={{ fontSize: 'clamp(0.8rem, 2.5vw, 1.1rem)' }}
                      >
                        {authorName}
                      </p>
                    )}
                  </div>
                </div>
              </Page>
            )}

            {/* Content Pages (reversed for RTL, natural order for LTR) */}
            {orderedContentPages.map((page) => (
              <Page key={page.id}>
                <div
                  className="w-full h-full relative overflow-hidden bg-white"
                  style={{
                    direction: isRTL ? 'rtl' : 'ltr',
                    fontFamily,
                  }}
                >
                  {/* Book title header */}
                  <div
                    className="absolute top-3 left-0 right-0 text-center text-[10px] text-gray-400 px-6 truncate"
                    style={{ direction: isRTL ? 'rtl' : 'ltr' }}
                  >
                    {book.title}
                  </div>

                  <div className="absolute inset-0 px-8 pt-10 pb-10 overflow-hidden">
                    <div
                      className="prose prose-sm max-w-none h-full overflow-hidden text-gray-800"
                      style={{ fontSize: '14px', lineHeight: 1.7, direction: isRTL ? 'rtl' : 'ltr' }}
                      dangerouslySetInnerHTML={{ __html: page.content || '' }}
                    />
                  </div>

                  {/* Page number — always the ORIGINAL page number, not the DOM index */}
                  <div
                    className="absolute bottom-3 left-0 right-0 text-center text-xs text-gray-400"
                    dir="ltr"
                  >
                    {page.pageNumber}
                  </div>
                </div>
              </Page>
            ))}

            {/* Last DOM page — Front cover for RTL, Back cover for LTR */}
            {isRTL ? (
              <Page className="front-cover">
                <div
                  className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
                  style={{
                    backgroundColor: coverColor,
                    color: textColor,
                    fontFamily,
                    backgroundImage: frontCoverImageUrl ? `url(${frontCoverImageUrl})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {frontCoverImageUrl && <div className="absolute inset-0 bg-black/30" />}
                  <div className="relative z-10 text-center px-6 max-w-[90%]">
                    <h1
                      className="font-bold mb-6 drop-shadow-lg break-words"
                      style={{ fontSize: 'clamp(1.2rem, 4vw, 2rem)', lineHeight: 1.2 }}
                    >
                      {book.title}
                    </h1>
                    {authorName && (
                      <p
                        className="drop-shadow-md opacity-90 break-words"
                        style={{ fontSize: 'clamp(0.8rem, 2.5vw, 1.1rem)' }}
                      >
                        {authorName}
                      </p>
                    )}
                  </div>
                </div>
              </Page>
            ) : (
              <Page className="back-cover">
                <div
                  className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
                  style={{
                    backgroundColor: book.coverDesign?.back?.backgroundColor || coverColor,
                    color: textColor,
                    fontFamily,
                    backgroundImage: backCoverImageUrl ? `url(${backCoverImageUrl})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  {backCoverImageUrl && <div className="absolute inset-0 bg-black/50" />}
                  <div
                    className="relative z-10 text-center px-8 py-10 max-w-[88%] max-h-[85%] flex items-center justify-center"
                    style={{ direction: 'ltr' }}
                  >
                    {(() => {
                      const text = book.synopsis || book.description || '';
                      const len = text.length;
                      const fontSize = len < 200 ? '1rem' : len < 350 ? '0.85rem' : len < 500 ? '0.75rem' : '0.7rem';
                      const lineHeight = len < 200 ? 1.7 : len < 350 ? 1.6 : 1.5;
                      return text && (
                        <p
                          className="drop-shadow-md break-words"
                          style={{
                            fontSize,
                            lineHeight,
                            userSelect: 'none',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {text}
                        </p>
                      );
                    })()}
                  </div>
                </div>
              </Page>
            )}
          </HTMLFlipBook>
        </div>
      </div>

      {/* Bottom controls
          Visual layout — same for both directions:
            [←]  [open/restart]  [→]
          - LTR: ← = readPrev (go back),  → = readNext (advance)
          - RTL: ← = readNext (advance),  → = readPrev (go back)
            because in Hebrew "forward" physically moves LEFT
      */}
      <div className="flex items-center justify-center gap-4 px-6 py-4 bg-black/30 backdrop-blur-sm border-t border-memorial-gold/20">
        <button
          onClick={isRTL ? readNext : readPrev}
          disabled={isRTL ? isAtEnd : isAtStart}
          className="p-3 rounded-full bg-memorial-gold/10 hover:bg-memorial-gold/20 text-memorial-gold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          title={isRTL ? 'הדף הבא' : 'Previous'}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {!isBookOpen && !isAtEnd && (
          <button
            onClick={readNext}
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

        <button
          onClick={isRTL ? readPrev : readNext}
          disabled={isRTL ? isAtStart : isAtEnd}
          className="p-3 rounded-full bg-memorial-gold/10 hover:bg-memorial-gold/20 text-memorial-gold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          title={isRTL ? 'הדף הקודם' : 'Next'}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
