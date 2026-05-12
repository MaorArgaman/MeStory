/**
 * DesignedBookView — renders a book according to a DesignPlan produced
 * by the planner agent. Used both:
 *   - inside the editor, as an iframe preview
 *   - inside PrintDesignedBookPage, which Puppeteer captures for PDF
 *
 * Style strategy: every page is an absolutely-positioned A5 (or A4) box
 * with explicit width/height in mm. CSS `@page` rules ensure one logical
 * page per physical printed page. RTL is the default since MeStory is
 * Hebrew-first.
 *
 * Unknown block types are silently skipped — this lets a client built
 * against schema v1 keep working when v2 plans land in the database.
 */

import { useMemo } from 'react';
import type {
  Block,
  BookForRender,
  DesignPlan,
  Page as PlanPage,
} from './designPlanTypes';

// -- Page size ---------------------------------------------------------------
// Default A5 portrait. Could be made configurable later — but for now the
// planner doesn't pick page size; it picks margins inside a fixed canvas.

const PAGE_W_MM = 148;
const PAGE_H_MM = 210;

// -- Web font loading --------------------------------------------------------
// We inject one <link> for the Hebrew Google fonts used across the 10
// design systems. Deduped by checking document.head for the same href.

const GOOGLE_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@400;700&family=Heebo:wght@300;400;600;800&family=Assistant:wght@300;400;600;700&family=Suez+One&family=David+Libre:wght@400;700&display=swap';

function ensureFontsLoaded() {
  if (typeof document === 'undefined') return;
  if (document.head.querySelector(`link[href="${GOOGLE_FONTS_HREF}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = GOOGLE_FONTS_HREF;
  document.head.appendChild(link);
}

// -- Image lookup ------------------------------------------------------------

function findImageUrl(book: BookForRender, imageId: string): string | null {
  const img = (book.pageImages || []).find((i) => i._id === imageId);
  return img?.url || null;
}

// -- Block renderer ----------------------------------------------------------
// One JSX node per block. Layout (page break, full-bleed positioning)
// happens at the page level, not here.

interface BlockRendererProps {
  block: Block;
  book: BookForRender;
  plan: DesignPlan;
}

function BlockRenderer({ block, book, plan }: BlockRendererProps) {
  const { palette, typography } = plan;

  switch (block.type) {
    case 'heading': {
      const sizeIdx = block.level === 1 ? 4 : block.level === 2 ? 3 : 2;
      const fontSize = typography.scale[sizeIdx];
      return (
        <h2
          className="adv-heading"
          style={{
            fontFamily: typography.headingFamily,
            fontSize: `${fontSize}pt`,
            color: palette.text,
            textAlign: block.align === 'center' ? 'center' : block.align === 'end' ? 'left' : 'right',
            margin: '0 0 8pt 0',
            lineHeight: 1.2,
            fontWeight: 700,
          }}
        >
          {block.text}
        </h2>
      );
    }
    case 'paragraph': {
      const align =
        block.align === 'center' ? 'center' : block.align === 'justify' ? 'justify' : 'right';
      const fontSize = block.lead ? typography.scale[2] : typography.baseSize;
      return (
        <p
          className={`adv-paragraph${block.dropCap ? ' adv-paragraph--dropcap' : ''}${block.lead ? ' adv-paragraph--lead' : ''}`}
          style={{
            fontFamily: typography.bodyFamily,
            fontSize: `${fontSize}pt`,
            lineHeight: typography.leading,
            color: palette.text,
            textAlign: align,
            margin: '0 0 6pt 0',
            textIndent: block.dropCap ? 0 : '1em',
          }}
        >
          {block.dropCap ? (
            <>
              <span
                className="adv-dropcap"
                style={{
                  fontFamily: typography.displayFamily || typography.headingFamily,
                  color: palette.accent,
                  fontSize: `${typography.baseSize * 3.2}pt`,
                  lineHeight: 0.9,
                  float: 'right',
                  marginLeft: '4pt',
                  marginTop: '2pt',
                }}
              >
                {block.text.charAt(0)}
              </span>
              {block.text.slice(1)}
            </>
          ) : (
            block.text
          )}
        </p>
      );
    }
    case 'image': {
      const url = findImageUrl(book, block.imageId);
      if (!url) return null;
      const widthPct = Math.round((block.widthFraction ?? 0.6) * 100);
      const baseImg = (
        <img
          src={url}
          alt={block.caption || ''}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      );
      if (block.placement === 'full-bleed' || block.placement === 'full-bleed-top' || block.placement === 'full-bleed-bottom') {
        return (
          <div
            className="adv-image adv-image--full-bleed"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              ...(block.placement === 'full-bleed-bottom'
                ? { bottom: 0, height: '50%' }
                : block.placement === 'full-bleed-top'
                ? { top: 0, height: '50%' }
                : { top: 0, bottom: 0 }),
              overflow: 'hidden',
            }}
          >
            <img
              src={url}
              alt={block.caption || ''}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {block.caption && (
              <div
                className="adv-image__caption"
                style={{
                  position: 'absolute',
                  bottom: '8pt',
                  right: '12pt',
                  color: palette.background,
                  fontFamily: typography.bodyFamily,
                  fontSize: `${typography.scale[1]}pt`,
                  textShadow: '0 1px 4px rgba(0,0,0,0.6)',
                }}
              >
                {block.caption}
              </div>
            )}
          </div>
        );
      }
      if (block.placement === 'side-left' || block.placement === 'side-right') {
        return (
          <div
            className="adv-image adv-image--side"
            style={{
              float: block.placement === 'side-right' ? 'right' : 'left',
              width: `${widthPct}%`,
              margin: block.placement === 'side-right' ? '0 0 6pt 8pt' : '0 8pt 6pt 0',
            }}
          >
            {baseImg}
            {block.caption && (
              <div
                style={{
                  marginTop: '3pt',
                  fontFamily: typography.bodyFamily,
                  fontSize: `${typography.scale[1]}pt`,
                  color: palette.muted,
                  fontStyle: 'italic',
                }}
              >
                {block.caption}
              </div>
            )}
          </div>
        );
      }
      // framed-center / inline
      return (
        <figure
          className="adv-image adv-image--framed"
          style={{
            margin: '8pt auto',
            width: `${widthPct}%`,
            padding: block.placement === 'framed-center' ? '6pt' : 0,
            border: block.placement === 'framed-center' ? `1px solid ${palette.muted}` : 'none',
          }}
        >
          {baseImg}
          {block.caption && (
            <figcaption
              style={{
                marginTop: '4pt',
                fontFamily: typography.bodyFamily,
                fontSize: `${typography.scale[1]}pt`,
                color: palette.muted,
                fontStyle: 'italic',
                textAlign: 'center',
              }}
            >
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
    }
    case 'pull-quote': {
      return (
        <blockquote
          className="adv-pullquote"
          style={{
            fontFamily: typography.headingFamily,
            fontSize: `${typography.scale[2]}pt`,
            lineHeight: 1.4,
            color: palette.accent,
            borderInlineStart: `3px solid ${palette.accent}`,
            paddingInlineStart: '12pt',
            margin: '12pt 0',
            fontStyle: 'italic',
          }}
        >
          {block.text}
          {block.attribution && (
            <footer
              style={{
                marginTop: '6pt',
                color: palette.muted,
                fontSize: `${typography.scale[1]}pt`,
                fontStyle: 'normal',
              }}
            >
              — {block.attribution}
            </footer>
          )}
        </blockquote>
      );
    }
    case 'divider': {
      if (block.style === 'none') return <div style={{ height: '8pt' }} />;
      // For now we use a single CSS-only ornament. The 10 design systems
      // each have richer SVG ornaments on the server; once we wire those
      // through to the client we'll pick by plan.designSystem + style.
      const glyph =
        block.style === 'stars' ? '✦ ✦ ✦' : block.style === 'ornament' ? '◆ ◆ ◆' : '———';
      return (
        <div
          className="adv-divider"
          style={{
            textAlign: 'center',
            margin: '14pt 0',
            color: palette.accent,
            fontFamily: typography.displayFamily || typography.headingFamily,
            letterSpacing: '0.4em',
            fontSize: `${typography.scale[1]}pt`,
          }}
        >
          {glyph}
        </div>
      );
    }
    case 'callout': {
      return (
        <aside
          className={`adv-callout adv-callout--${block.tone}`}
          style={{
            background: block.tone === 'warning' ? '#FFF4E6' : block.tone === 'note' ? '#F0F4F8' : 'transparent',
            borderInlineStart: `3px solid ${palette.accent}`,
            padding: '8pt 12pt',
            margin: '8pt 0',
            color: palette.text,
            fontFamily: typography.bodyFamily,
            fontSize: `${typography.baseSize}pt`,
            fontStyle: block.tone === 'quote' ? 'italic' : 'normal',
          }}
        >
          {block.text}
        </aside>
      );
    }
    case 'spacer': {
      return <div style={{ height: `${block.sizeMm}mm` }} />;
    }
    case 'title-page': {
      return (
        <div
          className="adv-titlepage"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 20mm',
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              fontFamily: typography.displayFamily || typography.headingFamily,
              fontSize: `${typography.scale[4] * 1.4}pt`,
              color: palette.text,
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            {block.title}
          </h1>
          {block.subtitle && (
            <p
              style={{
                fontFamily: typography.headingFamily,
                fontSize: `${typography.scale[2]}pt`,
                color: palette.muted,
                marginTop: '12pt',
              }}
            >
              {block.subtitle}
            </p>
          )}
          <div
            style={{
              marginTop: '40pt',
              width: '40%',
              height: '1px',
              background: palette.accent,
            }}
          />
          <p
            style={{
              fontFamily: typography.bodyFamily,
              fontSize: `${typography.scale[2]}pt`,
              color: palette.text,
              marginTop: '20pt',
            }}
          >
            {block.author}
          </p>
        </div>
      );
    }
    case 'chapter-opener': {
      const chapter = book.chapters?.[block.chapterIndex];
      const chapterTitle = chapter?.title || `פרק ${block.chapterIndex + 1}`;
      return (
        <div className="adv-chapter-opener" style={{ marginTop: '20mm', marginBottom: '12pt' }}>
          <div
            style={{
              fontFamily: typography.displayFamily || typography.headingFamily,
              fontSize: `${typography.scale[3]}pt`,
              color: palette.accent,
              textAlign: 'center',
              letterSpacing: '0.2em',
            }}
          >
            פרק {block.chapterIndex + 1}
          </div>
          <h2
            style={{
              fontFamily: typography.headingFamily,
              fontSize: `${typography.scale[4]}pt`,
              color: palette.text,
              textAlign: 'center',
              margin: '6pt 0 14pt 0',
              lineHeight: 1.2,
            }}
          >
            {chapterTitle}
          </h2>
          {block.epigraph && (
            <p
              style={{
                fontFamily: typography.bodyFamily,
                fontSize: `${typography.scale[1]}pt`,
                color: palette.muted,
                fontStyle: 'italic',
                textAlign: 'center',
                margin: '0 auto 18pt auto',
                maxWidth: '70%',
              }}
            >
              {block.epigraph}
            </p>
          )}
          <div
            style={{
              width: '40%',
              height: '1px',
              background: palette.accent,
              margin: '0 auto',
            }}
          />
        </div>
      );
    }
    case 'toc': {
      const chapters = book.chapters || [];
      return (
        <div className="adv-toc">
          <h2
            style={{
              fontFamily: typography.headingFamily,
              fontSize: `${typography.scale[3]}pt`,
              color: palette.text,
              textAlign: 'center',
              marginBottom: '20pt',
            }}
          >
            תוכן עניינים
          </h2>
          <ol
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              fontFamily: typography.bodyFamily,
              fontSize: `${typography.baseSize}pt`,
              color: palette.text,
            }}
          >
            {chapters.map((ch, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6pt 0',
                  borderBottom: `1px dotted ${palette.muted}`,
                }}
              >
                <span>{ch.title}</span>
                <span style={{ color: palette.muted }}>{i + 1}</span>
              </li>
            ))}
          </ol>
        </div>
      );
    }
    case 'page-break':
      return null; // Page boundaries are owned by the Page layer.
    default:
      return null;
  }
}

// -- Page renderer -----------------------------------------------------------

interface PageRendererProps {
  page: PlanPage;
  pageNumber: number;
  book: BookForRender;
  plan: DesignPlan;
}

function PageRenderer({ page, pageNumber, book, plan }: PageRendererProps) {
  const { palette, grid } = plan;

  // Full-bleed pages: no padding, image fills entire page.
  const isFullBleed = page.blocks.some((b) => b.type === 'image' && b.placement === 'full-bleed');

  return (
    <div
      className={`adv-page adv-page--${page.kind}`}
      style={{
        width: `${PAGE_W_MM}mm`,
        height: `${PAGE_H_MM}mm`,
        position: 'relative',
        background: palette.background,
        color: palette.text,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        margin: '0 auto 12mm auto',
        overflow: 'hidden',
        pageBreakAfter: 'always',
        breakAfter: 'page',
      }}
    >
      <div
        className="adv-page__content"
        style={{
          position: 'absolute',
          top: isFullBleed ? 0 : `${grid.marginsMm.top}mm`,
          bottom: isFullBleed ? 0 : `${grid.marginsMm.bottom}mm`,
          // Hebrew RTL: `start` = right, `end` = left
          right: isFullBleed ? 0 : `${grid.marginsMm.start}mm`,
          left: isFullBleed ? 0 : `${grid.marginsMm.end}mm`,
          direction: 'rtl',
          columnCount: grid.columns,
          columnGap: `${grid.gutterMm}mm`,
        }}
      >
        {page.blocks.map((block, i) => (
          <BlockRenderer key={i} block={block} book={book} plan={plan} />
        ))}
      </div>
      {page.kind !== 'title' && page.kind !== 'blank' && (
        <div
          className="adv-page__number"
          style={{
            position: 'absolute',
            bottom: '10mm',
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: plan.typography.bodyFamily,
            fontSize: `${plan.typography.scale[1]}pt`,
            color: palette.muted,
          }}
        >
          {pageNumber}
        </div>
      )}
    </div>
  );
}

// -- Top-level component ------------------------------------------------------

export interface DesignedBookViewProps {
  book: BookForRender;
  plan: DesignPlan;
}

export default function DesignedBookView({ book, plan }: DesignedBookViewProps) {
  ensureFontsLoaded();

  // Inject @page rules so print/PDF gets correct page sizing. Runs once
  // per plan render — the size never changes.
  const pageCss = useMemo(
    () => `
@page { size: ${PAGE_W_MM}mm ${PAGE_H_MM}mm; margin: 0; }
@media print {
  body { background: white !important; margin: 0 !important; padding: 0 !important; }
  .adv-page { box-shadow: none !important; margin: 0 !important; page-break-after: always; }
}
.adv-paragraph--dropcap::first-letter { /* fallback when JS-rendered dropcap fails */ }
`,
    []
  );

  return (
    <>
      <style>{pageCss}</style>
      <div
        className="adv-book"
        style={{
          background: '#E8E5DD',
          minHeight: '100vh',
          padding: '12mm 0',
          direction: 'rtl',
        }}
      >
        {plan.pages.map((page, i) => (
          <PageRenderer key={i} page={page} pageNumber={i + 1} book={book} plan={plan} />
        ))}
      </div>
    </>
  );
}
