/**
 * DesignedBookView — renders a book from a DesignPlan. Owns page geometry
 * (A5 boxes, RTL margins, columns, pagination, page numbers) and delegates
 * every decorative/system-specific visual (backgrounds, ornaments, drop
 * caps, chapter openers, image treatments) to a SystemVisual resolved from
 * plan.designSystem. That separation is what lets the same renderer produce
 * a warm memoir and a bold magazine that look nothing alike.
 *
 * Used both as the in-editor iframe preview and (via PrintDesignedBookPage)
 * as the page Puppeteer captures for PDF. Unknown block types are skipped so
 * a v1 client keeps working against newer plans.
 */

import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { Block, BookForRender, DesignPlan, Page as PlanPage } from './designPlanTypes';
import { deriveColorRoles, rgba, type ColorRoles } from './designTokens';
import { imageUrlById } from './collectImages';
import { getSystemVisual } from './systems';
import type { SystemVisual } from './systems/types';

const PAGE_W_MM = 148;
const PAGE_H_MM = 210;

const GOOGLE_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@400;700&family=Heebo:wght@300;400;600;800&family=Assistant:wght@300;400;600;700&family=Suez+One&family=David+Libre:wght@400;700&family=Alef:wght@400;700&family=Rubik:wght@400;500;700&family=Secular+One&display=swap';

function ensureFontsLoaded() {
  if (typeof document === 'undefined') return;
  if (document.head.querySelector(`link[href="${GOOGLE_FONTS_HREF}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = GOOGLE_FONTS_HREF;
  document.head.appendChild(link);
}

function findImageUrl(book: BookForRender, imageId: string): string | null {
  // Resolve over the UNIFIED list (pageImages + pageLayout pages), matching
  // the server planner's "img-N" scheme exactly.
  const direct = imageUrlById(book).get(imageId);
  if (direct) return direct;
  // Fallback: match by a real _id if one happens to exist.
  const img = (book.pageImages || []).find((i) => i._id === imageId);
  return img?.url || null;
}

// ---------------------------------------------------------------------------
// Block renderer
// ---------------------------------------------------------------------------

interface RenderCtx {
  book: BookForRender;
  plan: DesignPlan;
  roles: ColorRoles;
  system: SystemVisual;
}

function BlockRenderer({ block, ctx }: { block: Block; ctx: RenderCtx }) {
  const { plan, roles, system, book } = ctx;
  const { typography } = plan;

  switch (block.type) {
    case 'heading': {
      const sizeIdx = block.level === 1 ? 4 : block.level === 2 ? 3 : 2;
      return (
        <h2
          style={{
            fontFamily: typography.headingFamily,
            fontSize: `${typography.scale[sizeIdx]}pt`,
            color: roles.text,
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
      const style: CSSProperties = {
        fontFamily: typography.bodyFamily,
        fontSize: `${fontSize}pt`,
        lineHeight: typography.leading,
        color: block.lead ? roles.muted : roles.text,
        textAlign: align,
        margin: '0 0 6pt 0',
        textIndent: block.dropCap || block.runInHead || block.lead ? 0 : '1em',
      };
      if (block.dropCap && block.text.length > 0) {
        return (
          <p style={style}>
            {system.DropCap({ letter: block.text.charAt(0), roles, typography })}
            {block.text.slice(1)}
          </p>
        );
      }
      if (block.runInHead) {
        return (
          <p style={style}>
            <span
              style={{
                fontFamily: typography.headingFamily,
                fontWeight: 700,
                color: roles.accent,
                marginLeft: '0.4em',
              }}
            >
              {block.runInHead}
            </span>
            {block.text}
          </p>
        );
      }
      return <p style={style}>{block.text}</p>;
    }

    case 'image': {
      const url = findImageUrl(book, block.imageId);
      if (!url) return null;

      // Full-bleed variants are positioned by the page, not flowed.
      if (block.placement.startsWith('full-bleed')) {
        const pos: CSSProperties =
          block.placement === 'full-bleed-bottom'
            ? { bottom: 0, height: '50%' }
            : block.placement === 'full-bleed-top'
            ? { top: 0, height: '50%' }
            : { top: 0, bottom: 0 };
        return (
          <div style={{ position: 'absolute', left: 0, right: 0, overflow: 'hidden', ...pos }}>
            <img
              src={url}
              alt={block.caption || ''}
              crossOrigin="anonymous"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {block.caption && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '8pt',
                  right: '12pt',
                  color: '#fff',
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

      // Flowed image with a system-specific treatment.
      const widthPct = Math.round((block.widthFraction ?? 0.6) * 100);
      const tr = system.imageTreatment(block.treatment, roles, plan.seed);
      const isSide = block.placement === 'side-left' || block.placement === 'side-right';
      const figureStyle: CSSProperties = {
        ...tr.figureStyle,
        position: tr.figureStyle.position ?? 'relative',
        width: `${widthPct}%`,
        ...(isSide
          ? {
              float: block.placement === 'side-right' ? 'right' : 'left',
              margin: block.placement === 'side-right' ? '0 0 6pt 8pt' : '0 8pt 6pt 0',
            }
          : {}),
      };
      return (
        <figure style={figureStyle}>
          <img src={url} alt={block.caption || ''} crossOrigin="anonymous" style={tr.imgStyle} />
          {tr.overlay}
          {block.caption && <figcaption style={tr.captionStyle}>{block.caption}</figcaption>}
        </figure>
      );
    }

    case 'layered': {
      const url = findImageUrl(book, block.imageId);
      if (!url) return null;
      const heightPct = Math.round((block.heightFraction ?? 1) * 100);
      const scrimBg =
        block.scrim === 'dark'
          ? rgba('#000000', 0.42)
          : block.scrim === 'light'
          ? rgba('#ffffff', 0.5)
          : block.scrim === 'gradient-bottom'
          ? `linear-gradient(0deg, ${rgba('#000000', 0.62)} 0%, ${rgba('#000000', 0)} 60%)`
          : block.scrim === 'gradient-top'
          ? `linear-gradient(180deg, ${rgba('#000000', 0.62)} 0%, ${rgba('#000000', 0)} 60%)`
          : 'transparent';
      const lightText = block.scrim !== 'light';
      const justify =
        block.align === 'top' ? 'flex-start' : block.align === 'bottom' ? 'flex-end' : 'center';
      return (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: `${heightPct}%`,
            overflow: 'hidden',
          }}
        >
          <img
            src={url}
            alt=""
            crossOrigin="anonymous"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: scrimBg }} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: justify,
              padding: '14mm 12mm',
              textAlign: 'center',
            }}
          >
            {block.overlay.map((o, i) =>
              o.type === 'heading' ? (
                <h2
                  key={i}
                  style={{
                    fontFamily: typography.headingFamily,
                    fontSize: `${typography.scale[o.level === 1 ? 4 : 3]}pt`,
                    color: lightText ? '#fff' : roles.text,
                    margin: '0 0 6pt 0',
                    lineHeight: 1.15,
                    textShadow: lightText ? '0 2px 12px rgba(0,0,0,0.5)' : 'none',
                  }}
                >
                  {o.text}
                </h2>
              ) : (
                <p
                  key={i}
                  style={{
                    fontFamily: typography.bodyFamily,
                    fontSize: `${typography.scale[2]}pt`,
                    color: lightText ? 'rgba(255,255,255,0.92)' : roles.text,
                    margin: 0,
                    lineHeight: 1.5,
                    textShadow: lightText ? '0 1px 8px rgba(0,0,0,0.5)' : 'none',
                  }}
                >
                  {o.text}
                </p>
              )
            )}
          </div>
        </div>
      );
    }

    case 'margin-note': {
      // Set in the outer (left, in RTL) margin, small and muted.
      return (
        <aside
          style={{
            position: 'absolute',
            left: '4mm',
            width: `${ctx.plan.grid.marginsMm.end - 6}mm`,
            fontFamily: typography.bodyFamily,
            fontSize: `${typography.scale[1] * 0.92}pt`,
            color: roles.muted,
            fontStyle: 'italic',
            lineHeight: 1.4,
            borderTop: `0.5pt solid ${roles.hairline}`,
            paddingTop: '3pt',
            direction: 'rtl',
          }}
        >
          {block.text}
        </aside>
      );
    }

    case 'accent-bar': {
      return (
        <div
          style={{
            width: `${Math.round((block.widthFraction ?? 0.25) * 100)}%`,
            height: `${block.thicknessPt ?? 3}pt`,
            background: roles.accent,
            margin: '10pt 0',
            borderRadius: '1pt',
          }}
        />
      );
    }

    case 'pull-quote': {
      return (
        <blockquote
          style={{
            fontFamily: typography.headingFamily,
            fontSize: `${typography.scale[2]}pt`,
            lineHeight: 1.4,
            color: roles.accent,
            borderInlineStart: `3px solid ${roles.accent}`,
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
                color: roles.muted,
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

    case 'divider':
      return <>{system.Ornament({ style: block.style, roles, seed: plan.seed })}</>;

    case 'callout': {
      return (
        <aside
          style={{
            background: block.tone === 'quote' ? 'transparent' : roles.surface,
            borderInlineStart: `3px solid ${roles.accent}`,
            padding: '8pt 12pt',
            margin: '8pt 0',
            color: roles.text,
            fontFamily: typography.bodyFamily,
            fontSize: `${typography.baseSize}pt`,
            fontStyle: block.tone === 'quote' ? 'italic' : 'normal',
          }}
        >
          {block.text}
        </aside>
      );
    }

    case 'spacer':
      return <div style={{ height: `${block.sizeMm}mm` }} />;

    case 'title-page': {
      return (
        <div
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
              color: roles.text,
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
                color: roles.muted,
                marginTop: '12pt',
              }}
            >
              {block.subtitle}
            </p>
          )}
          <div style={{ marginTop: '40pt', width: '40%', height: '1px', background: roles.accent }} />
          <p
            style={{
              fontFamily: typography.bodyFamily,
              fontSize: `${typography.scale[2]}pt`,
              color: roles.text,
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
      const title = chapter?.title || `פרק ${block.chapterIndex + 1}`;
      const imageUrl = block.imageId ? findImageUrl(book, block.imageId) : null;
      return (
        <>
          {system.ChapterOpener({
            chapterIndex: block.chapterIndex,
            title,
            epigraph: block.epigraph,
            imageUrl,
            template: block.template,
            roles,
            typography,
            seed: plan.seed,
          })}
        </>
      );
    }

    case 'toc': {
      const chapters = book.chapters || [];
      return (
        <div>
          <h2
            style={{
              fontFamily: typography.headingFamily,
              fontSize: `${typography.scale[3]}pt`,
              color: roles.text,
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
              color: roles.text,
            }}
          >
            {chapters.map((ch, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6pt 0',
                  borderBottom: `1px dotted ${roles.hairline}`,
                }}
              >
                <span>{ch.title}</span>
                <span style={{ color: roles.muted }}>{i + 1}</span>
              </li>
            ))}
          </ol>
        </div>
      );
    }

    case 'page-break':
      return null;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Page renderer
// ---------------------------------------------------------------------------

function PageRenderer({
  page,
  pageNumber,
  ctx,
}: {
  page: PlanPage;
  pageNumber: number;
  ctx: RenderCtx;
}) {
  const { plan, roles, system } = ctx;
  const grid = plan.grid;

  // A page is "edge-to-edge" when it owns the whole canvas: title pages,
  // image-overlay openers, full-bleed images, layered blocks, spreads.
  const hasFullBleed = page.blocks.some(
    (b) =>
      (b.type === 'image' && b.placement === 'full-bleed') ||
      b.type === 'layered' ||
      b.type === 'title-page' ||
      (b.type === 'chapter-opener' && b.template === 'image-overlay')
  );
  const isEdgeToEdge = hasFullBleed || page.kind === 'spread';

  const bg = system.pageBackground(roles, page.kind);
  const showFrame =
    !isEdgeToEdge && (page.kind === 'chapter-opener' || page.kind === 'image-feature');

  return (
    <div
      className="adv-page"
      style={{
        width: `${PAGE_W_MM}mm`,
        height: `${PAGE_H_MM}mm`,
        position: 'relative',
        color: roles.text,
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        margin: '0 auto 12mm auto',
        overflow: 'hidden',
        pageBreakAfter: 'always',
        breakAfter: 'page',
        ...bg,
      }}
    >
      {showFrame && (
        <div
          style={{
            position: 'absolute',
            inset: '6mm',
            border: `0.5pt solid ${rgba(roles.accent, 0.4)}`,
            pointerEvents: 'none',
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          top: isEdgeToEdge ? 0 : `${grid.marginsMm.top}mm`,
          bottom: isEdgeToEdge ? 0 : `${grid.marginsMm.bottom}mm`,
          right: isEdgeToEdge ? 0 : `${grid.marginsMm.start}mm`,
          left: isEdgeToEdge ? 0 : `${grid.marginsMm.end}mm`,
          direction: 'rtl',
          columnCount: isEdgeToEdge ? 1 : grid.columns,
          columnGap: `${grid.gutterMm}mm`,
        }}
      >
        {page.blocks.map((block, i) => (
          <BlockRenderer key={i} block={block} ctx={ctx} />
        ))}
      </div>
      {page.kind !== 'title' && page.kind !== 'blank' && !isEdgeToEdge && (
        <div
          style={{
            position: 'absolute',
            bottom: '10mm',
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: plan.typography.bodyFamily,
            fontSize: `${plan.typography.scale[1]}pt`,
            color: roles.muted,
          }}
        >
          {pageNumber}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Top-level
// ---------------------------------------------------------------------------

export interface DesignedBookViewProps {
  book: BookForRender;
  plan: DesignPlan;
  /** When true, render just the pages (no outer gray backdrop/padding) —
   *  the parent supplies the surrounding layout (e.g. cover + interior). */
  embedded?: boolean;
}

export default function DesignedBookView({ book, plan, embedded }: DesignedBookViewProps) {
  ensureFontsLoaded();

  const system = useMemo(() => getSystemVisual(plan.designSystem), [plan.designSystem]);
  const roles = useMemo(
    () =>
      system.resolveRoles
        ? system.resolveRoles(plan.variant, plan.palette)
        : deriveColorRoles(plan.palette),
    [system, plan.variant, plan.palette]
  );
  const ctx: RenderCtx = { book, plan, roles, system };

  const pageCss = useMemo(
    () => `
@page { size: ${PAGE_W_MM}mm ${PAGE_H_MM}mm; margin: 0; }
@media print {
  body { background: white !important; margin: 0 !important; padding: 0 !important; }
  .adv-page { box-shadow: none !important; margin: 0 !important; page-break-after: always; }
}
`,
    []
  );

  const pages = plan.pages.map((page, i) => (
    <PageRenderer key={i} page={page} pageNumber={i + 1} ctx={ctx} />
  ));

  if (embedded) {
    // Parent owns the backdrop/padding (cover + interior + back cover wrap).
    return (
      <>
        <style>{pageCss}</style>
        {pages}
      </>
    );
  }

  return (
    <>
      <style>{pageCss}</style>
      <div style={{ background: '#E8E5DD', minHeight: '100vh', padding: '12mm 0', direction: 'rtl' }}>
        {pages}
      </div>
    </>
  );
}
