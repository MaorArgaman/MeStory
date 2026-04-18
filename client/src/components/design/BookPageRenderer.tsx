/**
 * BookPageRenderer
 * Renders a single book page with all design elements applied:
 * - Background pattern
 * - Page frame / border
 * - Corner decorations
 * - Drop caps
 * - Section dividers
 * - Pull quotes
 * - Header / footer decoration
 *
 * This is the single source of truth for how a book page looks,
 * used by both the editor preview and the BookFlipReader.
 */

import React, { useMemo } from 'react';
import OrnamentRenderer from './OrnamentLibrary';

// ─── Page size definitions (in mm, used for aspect-ratio) ─────────────────────
export const PAGE_SIZE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  A4:     { width: 210, height: 297 },
  A5:     { width: 148, height: 210 },
  B5:     { width: 176, height: 250 },
  Letter: { width: 216, height: 279 },
  '6x9':  { width: 152, height: 229 },
  '5x8':  { width: 127, height: 203 },
  Square: { width: 210, height: 210 },
  Pocket: { width: 127, height: 178 },
};

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface PageDesignSettings {
  // Typography
  fontFamily?: string;
  titleFont?: string;
  fontSize?: number;
  lineHeight?: number;
  textColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  // Layout
  columns?: 1 | 2 | 3 | 4;
  paragraphSpacing?: number;
  margins?: { top: number; bottom: number; left: number; right: number };
  showPageNumbers?: boolean;
  pageNumberPosition?: string;
  // Design elements
  dropCapStyle?: 'none' | 'classic' | 'decorative' | 'box' | 'modern';
  dividerStyle?: 'none' | 'line' | 'ornament' | 'stars' | 'dots' | 'wave';
  pullQuoteStyle?: 'none' | 'bordered' | 'background' | 'side-accent' | 'centered';
  pageFrame?: 'none' | 'simple' | 'double' | 'ornate' | 'rounded' | 'dashed' | 'dotted' | 'gradient';
  frameColor?: string;
  backgroundPattern?: 'none' | 'dots' | 'stripes' | 'grid' | 'waves' | 'confetti' | 'stars' | 'hearts' | 'geometric';
  headerDecoration?: 'none' | 'line' | 'ornament' | 'gradient-line' | 'dots';
  sectionDivider?: string;
  cornerDecorations?: 'none' | 'flourish' | 'geometric' | 'floral' | 'stars' | 'hearts' | 'leaves';
  titleUnderline?: 'none' | 'simple' | 'double' | 'wavy' | 'dotted' | 'gradient' | 'ornate';
  // Page size
  pageSize?: string;
  customPageSize?: { width: number; height: number };
}

export interface BookPageRendererProps {
  /** HTML content of the page */
  content: string;
  /** Page type for special rendering */
  pageType?: 'chapter' | 'title' | 'toc' | 'blank' | 'dedication' | 'summary';
  /** Page number to display */
  pageNumber?: number;
  /** Book title for header */
  bookTitle?: string;
  /** Chapter title for chapter header */
  chapterTitle?: string;
  /** Design settings */
  settings: PageDesignSettings;
  /** Whether text is RTL */
  isRTL?: boolean;
  /** Scale factor for preview (0.5 = 50% size) */
  scale?: number;
  /** Additional className */
  className?: string;
  /** Inline style overrides */
  style?: React.CSSProperties;
  /** Children (e.g., image overlays) */
  children?: React.ReactNode;
  /** Called when page is clicked */
  onClick?: () => void;
}

// ─── Helper: get background pattern CSS ───────────────────────────────────────
function getPatternStyle(
  pattern: string,
  accentColor: string
): React.CSSProperties {
  const c = accentColor || '#8b6914';
  // Convert hex to rgb for rgba usage
  const r = parseInt(c.slice(1, 3), 16) || 139;
  const g = parseInt(c.slice(3, 5), 16) || 105;
  const b = parseInt(c.slice(5, 7), 16) || 20;
  const rgba = (a: number) => `rgba(${r},${g},${b},${a})`;

  switch (pattern) {
    case 'dots':
      return {
        backgroundImage: `radial-gradient(circle, ${rgba(0.12)} 1px, transparent 1px)`,
        backgroundSize: '20px 20px',
      };
    case 'stripes':
      return {
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 27px, ${rgba(0.06)} 27px, ${rgba(0.06)} 28px)`,
      };
    case 'grid':
      return {
        backgroundImage: `linear-gradient(${rgba(0.05)} 1px, transparent 1px), linear-gradient(90deg, ${rgba(0.05)} 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      };
    case 'waves':
      return {
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='20'%3E%3Cpath d='M0,10 Q25,2 50,10 Q75,18 100,10' fill='none' stroke='${encodeURIComponent(rgba(0.07))}' stroke-width='1.5'/%3E%3C/svg%3E")`,
        backgroundSize: '100px 20px',
      };
    case 'geometric':
      return {
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect x='0' y='0' width='40' height='40' fill='none' stroke='${encodeURIComponent(rgba(0.05))}' stroke-width='1'/%3E%3C/svg%3E")`,
        backgroundSize: '40px 40px',
      };
    default:
      return {};
  }
}

// ─── Helper: get page frame CSS ────────────────────────────────────────────────
function getFrameStyle(
  frame: string,
  color: string
): React.CSSProperties {
  const c = color || '#8b6914';
  switch (frame) {
    case 'simple':   return { boxShadow: `inset 0 0 0 1px ${c}` };
    case 'double':   return { boxShadow: `inset 0 0 0 1px ${c}, inset 0 0 0 3px ${c}80` };
    case 'ornate':   return { boxShadow: `inset 0 0 0 1.5px ${c}, inset 0 0 0 3.5px ${c}40, inset 0 0 0 5px ${c}20` };
    case 'dashed':   return { outline: `2px dashed ${c}`, outlineOffset: '-6px' };
    case 'dotted':   return { outline: `2px dotted ${c}`, outlineOffset: '-6px' };
    case 'rounded':  return { boxShadow: `inset 0 0 0 1.5px ${c}`, borderRadius: '8px', overflow: 'hidden' };
    case 'gradient': return { boxShadow: `inset 0 0 0 2px ${c}` };
    default:         return {};
  }
}

// ─── Corner Decoration SVGs ────────────────────────────────────────────────────
function CornerSVG({ type, color, size = 36 }: { type: string; color: string; size?: number }) {
  const style: React.CSSProperties = { color, width: size, height: size };
  if (type === 'flourish') {
    return (
      <svg viewBox="0 0 60 60" style={style} fill="none" stroke="currentColor" aria-hidden="true">
        <path d="M2,2 L50,2 L50,4 L4,4 L4,50 L2,50 Z" fill="currentColor" opacity="0.35"/>
        <path d="M8,8 Q8,22 8,32 Q22,8 32,8" strokeWidth="1.5"/>
        <circle cx="8" cy="8" r="2.5" fill="currentColor"/>
      </svg>
    );
  }
  if (type === 'floral') {
    return (
      <svg viewBox="0 0 60 60" style={style} fill="none" stroke="currentColor" aria-hidden="true">
        <path d="M0,0 L48,0 L48,2 L2,2 L2,48 L0,48 Z" fill="currentColor" opacity="0.4"/>
        <circle cx="14" cy="14" r="5" strokeWidth="1.2"/>
        <circle cx="14" cy="14" r="2.5" fill="currentColor"/>
        <path d="M19,14 Q24,9 29,14" strokeWidth="1"/>
        <path d="M14,19 Q9,24 14,29" strokeWidth="1"/>
      </svg>
    );
  }
  if (type === 'geometric') {
    return (
      <svg viewBox="0 0 60 60" style={style} fill="none" stroke="currentColor" aria-hidden="true">
        <polyline points="0,42 0,0 42,0" strokeWidth="2"/>
        <polyline points="0,30 0,8 8,0 30,0" strokeWidth="1" opacity="0.5"/>
        <rect x="2" y="2" width="8" height="8" fill="currentColor" opacity="0.3"/>
      </svg>
    );
  }
  if (type === 'stars') {
    return (
      <svg viewBox="0 0 40 40" style={style} fill="currentColor" aria-hidden="true">
        <text x="2" y="18" fontSize="14" opacity="0.7">✦</text>
        <text x="16" y="32" fontSize="10" opacity="0.5">✧</text>
      </svg>
    );
  }
  return null;
}

// ─── Divider Renderer ─────────────────────────────────────────────────────────
function SectionDivider({
  style,
  custom,
  accentColor,
  isRTL,
}: {
  style: string;
  custom?: string;
  accentColor: string;
  isRTL: boolean;
}) {
  const c = accentColor || '#8b6914';
  if (style === 'none') return null;

  if (style === 'ornament' || style === 'stars') {
    const text = custom || (style === 'stars' ? '✦ ✧ ✦' : '⸻ ✦ ⸻');
    return (
      <div style={{ textAlign: 'center', color: c, margin: '1.2em 0', fontSize: '0.9em', letterSpacing: '0.5em', opacity: 0.75, direction: 'ltr' }}>
        {text}
      </div>
    );
  }
  if (style === 'line') {
    return <hr style={{ border: 'none', borderTop: `1px solid ${c}`, width: '60%', margin: '1.2em auto', opacity: 0.5 }} />;
  }
  if (style === 'dots') {
    return (
      <div style={{ textAlign: 'center', color: c, margin: '1em 0', letterSpacing: '0.6em', opacity: 0.55, direction: 'ltr' }}>
        • • • • •
      </div>
    );
  }
  if (style === 'wave') {
    return (
      <div style={{ margin: '1.2em auto', width: '70%' }}>
        <OrnamentRenderer id="divider-wave" color={c} height={12} />
      </div>
    );
  }
  return (
    <div style={{ textAlign: 'center', color: c, margin: '1em 0', opacity: 0.6, direction: 'ltr' }}>
      {custom || '⸻ ✦ ⸻'}
    </div>
  );
}

// ─── Process HTML content: inject design elements ─────────────────────────────
function processContent(
  html: string,
  settings: PageDesignSettings,
  accentColor: string,
  isRTL: boolean,
): string {
  if (!html) return '';

  let processed = html;

  // Inject chapter header decoration after <h1> or <h2> tags
  if (settings.headerDecoration && settings.headerDecoration !== 'none') {
    const decoMap: Record<string, string> = {
      line: `<div class="book-chapter-header header-line" style="--accent-color:${accentColor}"></div>`,
      ornament: `<div style="text-align:center;color:${accentColor};font-size:0.85em;letter-spacing:0.5em;margin:0.4em 0 0.8em;opacity:0.7;direction:ltr">✦ ✧ ✦</div>`,
      'gradient-line': `<div class="book-chapter-header header-gradient-line" style="--accent-color:${accentColor}"></div>`,
      dots: `<div style="text-align:center;color:${accentColor};margin:0.4em 0 0.8em;letter-spacing:0.5em;opacity:0.5;direction:ltr">• • •</div>`,
    };
    const decoHtml = decoMap[settings.headerDecoration] || '';
    if (decoHtml) {
      processed = processed.replace(/(<\/h[12]>)/gi, `$1${decoHtml}`);
    }
  }

  // Inject title underline class on <h1>/<h2>
  if (settings.titleUnderline && settings.titleUnderline !== 'none') {
    const cls = `book-title-underline-${settings.titleUnderline}`;
    processed = processed.replace(/<(h[12])([^>]*)>/gi, (_, tag, attrs) => {
      const existingClass = attrs.match(/class="([^"]*)"/);
      if (existingClass) {
        return `<${tag}${attrs.replace(`class="${existingClass[1]}"`, `class="${existingClass[1]} ${cls}"`)}>`;
      }
      return `<${tag}${attrs} class="${cls}" style="--accent-color:${accentColor}">`;
    });
  }

  return processed;
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function BookPageRenderer({
  content,
  pageType = 'chapter',
  pageNumber,
  bookTitle,
  chapterTitle,
  settings,
  isRTL = false,
  scale = 1,
  className = '',
  style: styleOverride,
  children,
  onClick,
}: BookPageRendererProps) {
  const {
    fontFamily = 'David Libre',
    fontSize = 12,
    lineHeight = 1.7,
    textColor = '#1a1a1a',
    accentColor = '#8b6914',
    backgroundColor = '#ffffff',
    columns = 1,
    paragraphSpacing = 10,
    margins = { top: 32, bottom: 30, left: 28, right: 28 },
    showPageNumbers = true,
    dropCapStyle = 'none',
    dividerStyle = 'none',
    pageFrame = 'none',
    frameColor = accentColor,
    backgroundPattern = 'none',
    headerDecoration = 'none',
    sectionDivider = '',
    cornerDecorations = 'none',
  } = settings;

  // Compute CSS variables for accent color
  const cssVars: React.CSSProperties = {
    '--accent-color': accentColor,
    '--frame-color': frameColor || accentColor,
    '--pattern-color': accentColor,
  } as React.CSSProperties;

  // Compute drop cap class
  const dropCapClass = useMemo(() => {
    if (dropCapStyle === 'none' || pageType !== 'chapter') return '';
    const map: Record<string, string> = {
      classic: 'book-drop-cap',
      decorative: 'book-drop-cap-decorative',
      box: 'book-drop-cap-box',
      modern: 'book-drop-cap',
    };
    return map[dropCapStyle] || '';
  }, [dropCapStyle, pageType]);

  // Compute multi-column class
  const columnClass = columns > 1 ? `book-columns-${columns} book-column-rule` : '';

  // Process content with injected design elements
  const processedContent = useMemo(
    () => processContent(content, settings, accentColor, isRTL),
    [content, settings, accentColor, isRTL]
  );

  // Frame style
  const frameStyle = getFrameStyle(pageFrame, frameColor);

  // Background pattern style
  const patternStyle = backgroundPattern !== 'none'
    ? getPatternStyle(backgroundPattern, accentColor)
    : {};

  // Scaled dimensions
  const scaledFontSize = Math.max(6, Math.round(fontSize * scale));
  const scaledMargins = {
    top: Math.round(margins.top * scale),
    bottom: Math.round(margins.bottom * scale),
    left: Math.round(margins.left * scale),
    right: Math.round(margins.right * scale),
  };

  const showHeader = headerDecoration !== 'none' && bookTitle && pageType !== 'title';
  const showCorners = cornerDecorations && cornerDecorations !== 'none';
  const cornerColor = `${accentColor}90`;

  return (
    <div
      className={`relative overflow-hidden book-page-preview ${className}`}
      style={{
        backgroundColor,
        fontFamily,
        fontSize: scaledFontSize,
        lineHeight,
        color: textColor,
        direction: isRTL ? 'rtl' : 'ltr',
        ...patternStyle,
        ...frameStyle,
        ...cssVars,
        ...styleOverride,
      }}
      onClick={onClick}
    >
      {/* ── Corner Decorations ── */}
      {showCorners && (
        <>
          <div className="book-corner-decoration book-corner-tl" style={{ color: cornerColor }}>
            <CornerSVG type={cornerDecorations} color={cornerColor} size={Math.round(36 * scale)} />
          </div>
          <div className="book-corner-decoration book-corner-tr" style={{ color: cornerColor, transform: 'scaleX(-1)' }}>
            <CornerSVG type={cornerDecorations} color={cornerColor} size={Math.round(36 * scale)} />
          </div>
          <div className="book-corner-decoration book-corner-bl" style={{ color: cornerColor, transform: 'scaleY(-1)' }}>
            <CornerSVG type={cornerDecorations} color={cornerColor} size={Math.round(36 * scale)} />
          </div>
          <div className="book-corner-decoration book-corner-br" style={{ color: cornerColor, transform: 'scale(-1)' }}>
            <CornerSVG type={cornerDecorations} color={cornerColor} size={Math.round(36 * scale)} />
          </div>
        </>
      )}

      {/* ── Decorated Header ── */}
      {showHeader && (
        <div
          className="absolute top-0 left-0 right-0 book-header-decorated"
          style={{
            padding: `0 ${scaledMargins.right}px`,
            '--accent-color': accentColor,
          } as React.CSSProperties}
        >
          <div className="flex items-center gap-2 pt-2 pb-1.5">
            {headerDecoration === 'gradient-line' && (
              <div style={{ flex: 1, height: 1, background: `linear-gradient(to ${isRTL ? 'left' : 'right'}, transparent, ${accentColor}60)` }} />
            )}
            <span style={{
              fontSize: Math.max(6, scaledFontSize * 0.6),
              color: `${accentColor}90`,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              fontWeight: 300,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '70%',
            }}>
              {headerDecoration === 'ornament' ? `✦ ${chapterTitle || bookTitle} ✦` : (chapterTitle || bookTitle)}
            </span>
            {headerDecoration === 'gradient-line' && (
              <div style={{ flex: 1, height: 1, background: `linear-gradient(to ${isRTL ? 'right' : 'left'}, transparent, ${accentColor}60)` }} />
            )}
          </div>
        </div>
      )}

      {/* ── Page Content ── */}
      <div
        style={{
          position: 'absolute',
          top: scaledMargins.top + (showHeader ? Math.round(18 * scale) : 0),
          bottom: scaledMargins.bottom + (showPageNumbers ? Math.round(16 * scale) : 0),
          left: scaledMargins.left,
          right: scaledMargins.right,
          overflow: 'hidden',
        }}
      >
        {/* Multi-column + drop cap wrapper */}
        <div
          className={`book-page-content prose prose-sm max-w-none h-full overflow-hidden ${dropCapClass} ${columnClass}`}
          style={{
            '--accent-color': accentColor,
            color: textColor,
            direction: isRTL ? 'rtl' : 'ltr',
            textAlign: isRTL ? 'right' : 'left',
            ...(paragraphSpacing ? { '--paragraph-spacing': `${paragraphSpacing}px` } : {}),
          } as React.CSSProperties}
          dangerouslySetInnerHTML={{ __html: processedContent }}
        />

        {/* Section divider overlay - shown between content sections */}
        {dividerStyle !== 'none' && pageType === 'chapter' && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center' }}>
            <SectionDivider
              style={dividerStyle}
              custom={sectionDivider}
              accentColor={accentColor}
              isRTL={isRTL}
            />
          </div>
        )}
      </div>

      {/* ── Page Number ── */}
      {showPageNumbers && pageNumber && (
        <div
          className="absolute bottom-1.5 left-0 right-0 text-center"
          style={{
            fontSize: Math.max(6, scaledFontSize * 0.65),
            color: `${textColor}60`,
            letterSpacing: '1px',
            fontFamily,
          }}
        >
          — {pageNumber} —
        </div>
      )}

      {/* ── Children (image overlays etc.) ── */}
      {children}
    </div>
  );
}

// ─── Utility: compute aspect ratio for a page size ────────────────────────────
export function getPageAspectRatio(
  pageSize?: string,
  customPageSize?: { width: number; height: number }
): number {
  if (pageSize === 'Custom' && customPageSize) {
    return customPageSize.height / customPageSize.width;
  }
  const dims = PAGE_SIZE_DIMENSIONS[pageSize || 'A5'] || PAGE_SIZE_DIMENSIONS.A5;
  return dims.height / dims.width;
}
