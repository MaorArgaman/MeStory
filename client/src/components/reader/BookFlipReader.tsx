import { forwardRef, useRef, useState, useEffect, Component } from 'react';
// @ts-ignore - react-pageflip has incomplete types
import HTMLFlipBook from 'react-pageflip';
import { X, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  FRONT_OVERLAY, BACK_OVERLAY, COVER_SCALE,
  DEFAULT_TITLE_POS, DEFAULT_AUTHOR_POS,
  titleStyle, authorStyle, synopsisStyle, backAuthorStyle,
} from '../../utils/coverStyles';
import { sanitizeHtml } from '../../utils/sanitizeHtml';

// react-pageflip manipulates the DOM directly, which can conflict with React's
// reconciliation. This boundary catches those exceptions silently — the flipbook
// continues to work because the actual DOM is correct; React just can't match it
// to its virtual tree.
class FlipBookErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: false }; }
  componentDidCatch(error: Error) {
    if (error.message?.includes('removeChild') || error.message?.includes('insertBefore')) {
      return; // Suppress known react-pageflip DOM sync errors
    }
    console.error('[FlipBook]', error);
  }
  render() { return this.props.children; }
}

export interface ReaderDesignSettings {
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  textColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  columns?: 1 | 2 | 3 | 4;
  dropCapStyle?: 'none' | 'classic' | 'decorative' | 'box' | 'modern';
  dividerStyle?: 'none' | 'line' | 'ornament' | 'stars' | 'dots' | 'wave';
  pageFrame?: 'none' | 'simple' | 'double' | 'ornate' | 'rounded' | 'dashed' | 'dotted' | 'gradient';
  frameColor?: string;
  backgroundPattern?: 'none' | 'dots' | 'stripes' | 'grid' | 'waves' | 'confetti' | 'stars' | 'hearts' | 'geometric';
  headerDecoration?: 'none' | 'line' | 'ornament' | 'gradient-line' | 'dots';
  sectionDivider?: string;
  cornerDecorations?: 'none' | 'flourish' | 'geometric' | 'floral' | 'stars' | 'hearts' | 'leaves';
  titleUnderline?: 'none' | 'simple' | 'double' | 'wavy' | 'dotted' | 'gradient' | 'ornate';
  margins?: { top: number; bottom: number; left: number; right: number };
  showPageNumbers?: boolean;
}

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
  /** Optional design settings to render the book pages with template styling */
  designSettings?: ReaderDesignSettings;
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
  designSettings,
  onClose,
}: BookFlipReaderProps) {
  const { t } = useTranslation();
  const flipBookRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [, setTotalPages] = useState(0);
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
          <FlipBookErrorBoundary>
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
                  className="w-full h-full relative overflow-hidden"
                  style={{
                    backgroundColor: book.coverDesign?.back?.backgroundColor || coverColor,
                    color: textColor, fontFamily,
                    backgroundImage: backCoverImageUrl ? `url(${backCoverImageUrl})` : undefined,
                    backgroundSize: 'cover', backgroundPosition: 'center', direction: 'rtl',
                  }}
                >
                  <div className="absolute inset-0" style={{ background: BACK_OVERLAY }} />
                  <div className="relative z-10 h-full flex flex-col p-6">
                    <div className="flex-1 flex items-center justify-center">
                      {(() => {
                        const text = book.synopsis || book.description || '';
                        return text && (
                          <p className="break-words" style={synopsisStyle(text, textColor, fontFamily, true, COVER_SCALE.reader)}>
                            {text}
                          </p>
                        );
                      })()}
                    </div>
                    {authorName && (
                      <div className="pt-3 border-t border-white/20">
                        <p style={backAuthorStyle(textColor, fontFamily, true, COVER_SCALE.reader)}>
                          מאת: {authorName}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Page>
            ) : (
              <Page className="front-cover">
                <div
                  className="w-full h-full relative overflow-hidden"
                  style={{
                    backgroundColor: coverColor, color: textColor, fontFamily,
                    backgroundImage: frontCoverImageUrl ? `url(${frontCoverImageUrl})` : undefined,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                  }}
                >
                  {frontCoverImageUrl && (
                    <div className="absolute inset-0" style={{ background: FRONT_OVERLAY }} />
                  )}
                  <div className="absolute z-10" style={{ left: `${DEFAULT_TITLE_POS.x}%`, top: `${DEFAULT_TITLE_POS.y}%`, transform: 'translate(-50%, -50%)', maxWidth: '85%' }}>
                    <h1 className="break-words" style={titleStyle(book.title, textColor, fontFamily, COVER_SCALE.reader)}>
                      {book.title}
                    </h1>
                  </div>
                  {authorName && (
                    <div className="absolute z-10" style={{ left: `${DEFAULT_AUTHOR_POS.x}%`, top: `${DEFAULT_AUTHOR_POS.y}%`, transform: 'translate(-50%, -50%)', maxWidth: '80%' }}>
                      <p className="break-words" style={authorStyle(textColor, fontFamily, COVER_SCALE.reader)}>
                        {authorName}
                      </p>
                    </div>
                  )}
                </div>
              </Page>
            )}

            {/* Content Pages (reversed for RTL, natural order for LTR) */}
            {orderedContentPages.map((page) => {
              // Design settings from template (or defaults)
              const ds = designSettings || {};
              const pageFontFamily = ds.fontFamily || fontFamily;
              const pageFontSize = ds.fontSize || 14;
              const pageLineHeight = ds.lineHeight || 1.7;
              const pageTextColor = ds.textColor || '#1a1a1a';
              const pageAccentColor = ds.accentColor || '#8b6914';
              const pageBgColor = ds.backgroundColor || '#ffffff';
              const pageMargins = ds.margins || { top: 32, bottom: 30, left: 28, right: 28 };
              const showHeader = ds.headerDecoration && ds.headerDecoration !== 'none';

              // Drop cap class
              const dropCapClass = page.type === 'chapter' && ds.dropCapStyle && ds.dropCapStyle !== 'none'
                ? ds.dropCapStyle === 'classic' ? 'book-drop-cap'
                : ds.dropCapStyle === 'decorative' ? 'book-drop-cap-decorative'
                : ds.dropCapStyle === 'box' ? 'book-drop-cap-box'
                : 'book-drop-cap'
                : '';

              // Column class
              const columnClass = ds.columns && ds.columns > 1 ? `book-columns-${ds.columns} book-column-rule` : '';

              // Background pattern style
              const patternStyle: React.CSSProperties = (() => {
                if (!ds.backgroundPattern || ds.backgroundPattern === 'none') return {};
                const hex = pageAccentColor.replace('#', '');
                const r = parseInt(hex.slice(0, 2), 16) || 139;
                const g = parseInt(hex.slice(2, 4), 16) || 105;
                const b = parseInt(hex.slice(4, 6), 16) || 20;
                const rgba = (a: number) => `rgba(${r},${g},${b},${a})`;
                if (ds.backgroundPattern === 'dots') return { backgroundImage: `radial-gradient(circle, ${rgba(0.1)} 1px, transparent 1px)`, backgroundSize: '18px 18px' };
                if (ds.backgroundPattern === 'grid') return { backgroundImage: `linear-gradient(${rgba(0.04)} 1px, transparent 1px), linear-gradient(90deg, ${rgba(0.04)} 1px, transparent 1px)`, backgroundSize: '22px 22px' };
                return {};
              })();

              // Frame style
              const frameStyle: React.CSSProperties = (() => {
                const c = ds.frameColor || pageAccentColor;
                if (!ds.pageFrame || ds.pageFrame === 'none') return {};
                if (ds.pageFrame === 'simple') return { boxShadow: `inset 0 0 0 1px ${c}50` };
                if (ds.pageFrame === 'double') return { boxShadow: `inset 0 0 0 1px ${c}50, inset 0 0 0 3px ${c}25` };
                if (ds.pageFrame === 'ornate') return { boxShadow: `inset 0 0 0 1.5px ${c}60, inset 0 0 0 3.5px ${c}25` };
                if (ds.pageFrame === 'dashed') return { outline: `1.5px dashed ${c}50`, outlineOffset: '-5px' };
                return {};
              })();

              // Header decoration text
              const headerText = (() => {
                if (!showHeader) return null;
                const titleTrunc = book.title.length > 30 ? book.title.slice(0, 28) + '…' : book.title;
                if (ds.headerDecoration === 'ornament') return `✦ ${titleTrunc} ✦`;
                return titleTrunc;
              })();

              return (
                <Page key={page.id}>
                  <div
                    className="w-full h-full relative overflow-hidden"
                    style={{
                      direction: isRTL ? 'rtl' : 'ltr',
                      fontFamily: pageFontFamily,
                      backgroundColor: pageBgColor,
                      color: pageTextColor,
                      '--accent-color': pageAccentColor,
                      '--frame-color': ds.frameColor || pageAccentColor,
                      ...patternStyle,
                      ...frameStyle,
                    } as React.CSSProperties}
                  >
                    {/* ── Header ── */}
                    {showHeader ? (
                      <div
                        className="absolute top-0 left-0 right-0"
                        style={{ padding: `0 ${pageMargins.right}px` }}
                      >
                        <div
                          className="flex items-center gap-2 pt-2 pb-1.5"
                          style={{
                            borderBottom: ds.headerDecoration === 'gradient-line'
                              ? 'none'
                              : `0.5px solid ${pageAccentColor}40`,
                          }}
                        >
                          {ds.headerDecoration === 'gradient-line' && (
                            <div style={{ flex: 1, height: 1, background: `linear-gradient(to ${isRTL ? 'left' : 'right'}, transparent, ${pageAccentColor}50)` }} />
                          )}
                          <span style={{
                            fontSize: '8px',
                            color: `${pageAccentColor}80`,
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                            fontWeight: 300,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '80%',
                          }}>
                            {headerText}
                          </span>
                          {ds.headerDecoration === 'gradient-line' && (
                            <div style={{ flex: 1, height: 1, background: `linear-gradient(to ${isRTL ? 'right' : 'left'}, transparent, ${pageAccentColor}50)` }} />
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Simple title header (always shown as fallback) */
                      <div
                        className="absolute top-3 left-0 right-0 text-center truncate px-6"
                        style={{ fontSize: '8px', color: '#9ca3af', direction: isRTL ? 'rtl' : 'ltr' }}
                      >
                        {book.title}
                      </div>
                    )}

                    {/* ── Content ── */}
                    <div
                      className="absolute overflow-hidden"
                      style={{
                        top: pageMargins.top + (showHeader ? 18 : 12),
                        bottom: pageMargins.bottom + (ds.showPageNumbers !== false ? 16 : 0),
                        left: pageMargins.left,
                        right: pageMargins.right,
                      }}
                    >
                      <div
                        className={`book-page-content prose prose-sm max-w-none h-full overflow-hidden ${dropCapClass} ${columnClass} ${ds.titleUnderline && ds.titleUnderline !== 'none' ? `page-title-underline-${ds.titleUnderline}` : ''} ${ds.dividerStyle && ds.dividerStyle !== 'none' ? `page-divider-${ds.dividerStyle}` : ''}`}
                        style={{
                          fontSize: `${pageFontSize}px`,
                          lineHeight: pageLineHeight,
                          direction: isRTL ? 'rtl' : 'ltr',
                          color: pageTextColor,
                          textAlign: isRTL ? 'right' : 'left',
                          '--accent-color': pageAccentColor,
                        } as React.CSSProperties}
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }}
                      />
                    </div>

                    {/* ── Corner Decorations ── */}
                    {ds.cornerDecorations && ds.cornerDecorations !== 'none' && (() => {
                      const cornerSVGPaths: Record<string, string> = {
                        flourish: 'M2,2 Q8,2 8,8 M2,2 Q2,8 8,8',
                        geometric: 'M2,2 L14,2 L14,4 L4,4 L4,14 L2,14 Z',
                        floral: 'M8,8 Q4,4 2,2 M8,8 Q4,12 2,14 M8,8 Q12,4 14,2',
                        stars: 'M8,2 L9,6 L13,6 L10,9 L11,13 L8,10 L5,13 L6,9 L3,6 L7,6 Z',
                        leaves: 'M2,14 Q2,8 8,2 Q8,8 14,8 Q8,8 8,14 Q4,14 2,14 Z',
                        geometric_fallback: 'M2,2 L12,2 L12,3.5 L3.5,3.5 L3.5,12 L2,12 Z',
                      };
                      const path = cornerSVGPaths[ds.cornerDecorations] || cornerSVGPaths.geometric;
                      const corners = [
                        { style: { top: 4, right: 4 }, rotate: 0 },
                        { style: { top: 4, left: 4 }, rotate: 90 },
                        { style: { bottom: 4, right: 4 }, rotate: 270 },
                        { style: { bottom: 4, left: 4 }, rotate: 180 },
                      ];
                      return corners.map((corner, i) => (
                        <div
                          key={i}
                          style={{
                            position: 'absolute',
                            width: 14,
                            height: 14,
                            opacity: 0.5,
                            ...corner.style,
                          }}
                          dangerouslySetInnerHTML={{
                            __html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="${pageAccentColor}" stroke-width="1.5" transform="rotate(${corner.rotate},8,8)">${path}</svg>`
                          }}
                        />
                      ));
                    })()}

                    {/* ── Page Number ── */}
                    {ds.showPageNumbers !== false && (
                      <div
                        className="absolute bottom-2 left-0 right-0 text-center"
                        style={{ fontSize: '8px', color: `${pageTextColor}50`, letterSpacing: '1px', fontFamily: pageFontFamily }}
                        dir="ltr"
                      >
                        — {page.pageNumber} —
                      </div>
                    )}
                  </div>
                </Page>
              );
            })}

            {/* Last DOM page — Front cover for RTL, Back cover for LTR */}
            {isRTL ? (
              <Page className="front-cover">
                <div
                  className="w-full h-full relative overflow-hidden"
                  style={{
                    backgroundColor: coverColor, color: textColor, fontFamily,
                    backgroundImage: frontCoverImageUrl ? `url(${frontCoverImageUrl})` : undefined,
                    backgroundSize: 'cover', backgroundPosition: 'center', direction: 'rtl',
                  }}
                >
                  {frontCoverImageUrl && (
                    <div className="absolute inset-0" style={{ background: FRONT_OVERLAY }} />
                  )}
                  <div className="absolute z-10" style={{ left: `${DEFAULT_TITLE_POS.x}%`, top: `${DEFAULT_TITLE_POS.y}%`, transform: 'translate(-50%, -50%)', maxWidth: '85%' }}>
                    <h1 className="break-words" style={titleStyle(book.title, textColor, fontFamily, COVER_SCALE.reader)}>
                      {book.title}
                    </h1>
                  </div>
                  {authorName && (
                    <div className="absolute z-10" style={{ left: `${DEFAULT_AUTHOR_POS.x}%`, top: `${DEFAULT_AUTHOR_POS.y}%`, transform: 'translate(-50%, -50%)', maxWidth: '80%' }}>
                      <p className="break-words" style={authorStyle(textColor, fontFamily, COVER_SCALE.reader)}>
                        {authorName}
                      </p>
                    </div>
                  )}
                </div>
              </Page>
            ) : (
              <Page className="back-cover">
                <div
                  className="w-full h-full relative overflow-hidden"
                  style={{
                    backgroundColor: book.coverDesign?.back?.backgroundColor || coverColor,
                    color: textColor, fontFamily,
                    backgroundImage: backCoverImageUrl ? `url(${backCoverImageUrl})` : undefined,
                    backgroundSize: 'cover', backgroundPosition: 'center', direction: 'ltr',
                  }}
                >
                  <div className="absolute inset-0" style={{ background: BACK_OVERLAY }} />
                  <div className="relative z-10 h-full flex flex-col p-6">
                    <div className="flex-1 flex items-center justify-center">
                      {(() => {
                        const text = book.synopsis || book.description || '';
                        return text && (
                          <p className="break-words" style={synopsisStyle(text, textColor, fontFamily, false, COVER_SCALE.reader)}>
                            {text}
                          </p>
                        );
                      })()}
                    </div>
                    {authorName && (
                      <div className="pt-3 border-t border-white/20">
                        <p style={backAuthorStyle(textColor, fontFamily, false, COVER_SCALE.reader)}>
                          By: {authorName}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Page>
            )}
          </HTMLFlipBook>
          </FlipBookErrorBoundary>
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
