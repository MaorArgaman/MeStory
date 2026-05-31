/**
 * memoir-warm — client visual implementation. Warm, album-like memoir
 * typesetting: illuminated serif drop caps, diamond ornaments, paper-tinted
 * pages with a subtle inset keyline on feature pages, framed/polaroid photo
 * treatments, and three distinct chapter-opener compositions.
 *
 * Four palette variants (autumn / sepia / dusk / garden) — chosen by the
 * planner via plan.variant — give real variety across regenerates.
 */

import type { CSSProperties, ReactNode } from 'react';
import { deriveColorRoles, makeRng, rgba, type ColorRoles } from '../designTokens';
import type { Palette } from '../designPlanTypes';
import type { ImageTreatmentResult, OpenerProps, SystemVisual } from './types';

const VARIANT_PALETTES: Record<string, Palette> = {
  autumn: { text: '#2A1B0F', background: '#FBF6EE', accent: '#B8651A', muted: '#8C7A66' },
  sepia: { text: '#3B2E22', background: '#F6EFE3', accent: '#9C6B3F', muted: '#9A8A78' },
  dusk: { text: '#2E2330', background: '#F7F1F0', accent: '#8A5A6E', muted: '#928693' },
  garden: { text: '#26301F', background: '#F6F4EA', accent: '#A65A3C', muted: '#7E8770' },
};

// SVG ornaments — drawn in `currentColor` so the caller sets the accent.
function diamondsSvg(): ReactNode {
  return (
    <svg viewBox="0 0 120 20" width="120" height="20" aria-hidden="true">
      <path d="M40 6 L46 10 L40 14 L34 10 Z" fill="currentColor" />
      <path d="M60 3 L68 10 L60 17 L52 10 Z" fill="currentColor" />
      <path d="M80 6 L86 10 L80 14 L74 10 Z" fill="currentColor" />
    </svg>
  );
}

function ruleDiamondSvg(): ReactNode {
  return (
    <svg viewBox="0 0 220 16" width="220" height="16" aria-hidden="true">
      <line x1="14" y1="8" x2="96" y2="8" stroke="currentColor" strokeWidth="0.8" />
      <path d="M110 3 L116 8 L110 13 L104 8 Z" fill="currentColor" />
      <line x1="124" y1="8" x2="206" y2="8" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  );
}

const memoirWarmVisual: SystemVisual = {
  id: 'memoir-warm',

  resolveRoles(variantId: string | undefined, planPalette: Palette): ColorRoles {
    // Prefer the named variant; fall back to the plan's palette (planner may
    // have tweaked it), then to autumn.
    const base =
      (variantId && VARIANT_PALETTES[variantId]) || planPalette || VARIANT_PALETTES.autumn;
    return deriveColorRoles(base);
  },

  pageBackground(roles): CSSProperties {
    // A faint warm gradient gives the cream page depth without printing as a
    // flat block. The inset keyline frame for opener/feature pages is drawn
    // by DesignedBookView (showFrame), not here — so we never override the
    // page's card shadow.
    return {
      background: `linear-gradient(180deg, ${roles.background} 0%, ${rgba(
        roles.muted,
        0.06
      )} 100%)`,
    };
  },

  Ornament({ style, roles, seed }): ReactNode {
    if (style === 'none') return <div style={{ height: '6pt' }} />;
    const rng = makeRng(seed + 7);
    const glyph =
      style === 'stars' ? (
        <span style={{ letterSpacing: '0.5em', fontSize: '14pt' }}>✦ ✦ ✦</span>
      ) : style === 'rule' ? (
        ruleDiamondSvg()
      ) : (
        diamondsSvg()
      );
    return (
      <div
        style={{
          textAlign: 'center',
          color: roles.accent,
          margin: '14pt 0',
          opacity: 0.85,
          transform: `rotate(${(rng() - 0.5) * 1.2}deg)`,
        }}
      >
        {glyph}
      </div>
    );
  },

  DropCap({ letter, roles, typography }): ReactNode {
    return (
      <span
        style={{
          float: 'right', // RTL: drop cap hangs on the right
          fontFamily: typography.displayFamily || typography.headingFamily,
          color: roles.accent,
          fontSize: `${typography.baseSize * 3.1}pt`,
          lineHeight: 0.82,
          marginLeft: '5pt',
          marginTop: '2pt',
          marginRight: '-1pt',
          textShadow: `0 1px 0 ${rgba(roles.accent, 0.18)}`,
        }}
      >
        {letter}
      </span>
    );
  },

  ChapterOpener(props: OpenerProps): ReactNode {
    const t = props.template || 'numeral-ornament';
    if (t === 'image-overlay' && props.imageUrl) return imageOverlayOpener(props);
    if (t === 'rule-stack') return ruleStackOpener(props);
    return numeralOrnamentOpener(props);
  },

  imageTreatment(treatment, roles, seed): ImageTreatmentResult {
    const rng = makeRng(seed + 31);
    const captionBase: CSSProperties = {
      marginTop: '4pt',
      color: roles.muted,
      fontStyle: 'italic',
      textAlign: 'center',
      fontSize: '9pt',
    };
    switch (treatment) {
      case 'polaroid':
        return {
          figureStyle: {
            background: '#fff',
            padding: '3mm 3mm 9mm 3mm',
            boxShadow: `0 4px 14px ${rgba('#000000', 0.18)}`,
            transform: `rotate(${(rng() - 0.5) * 4}deg)`,
            margin: '6pt auto',
          },
          imgStyle: { width: '100%', height: 'auto', display: 'block' },
          captionStyle: { ...captionBase, color: roles.text, marginTop: '5pt' },
        };
      case 'postcard':
        return {
          figureStyle: {
            background: '#fff',
            padding: '2mm',
            border: `1px solid ${roles.hairline}`,
            boxShadow: `0 3px 10px ${rgba('#000000', 0.12)}`,
            margin: '6pt auto',
          },
          imgStyle: { width: '100%', height: 'auto', display: 'block' },
          captionStyle: { ...captionBase, textAlign: 'right', marginRight: '2mm' },
        };
      case 'duotone':
        return {
          figureStyle: { position: 'relative', margin: '6pt auto', overflow: 'hidden' },
          imgStyle: {
            width: '100%',
            height: 'auto',
            display: 'block',
            filter: 'grayscale(1) contrast(1.05)',
          },
          captionStyle: captionBase,
          overlay: (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: roles.accent,
                mixBlendMode: 'color',
                opacity: 0.55,
                pointerEvents: 'none',
              }}
            />
          ),
        };
      case 'vignette':
        return {
          figureStyle: { position: 'relative', margin: '6pt auto', overflow: 'hidden' },
          imgStyle: { width: '100%', height: 'auto', display: 'block' },
          captionStyle: captionBase,
          overlay: (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                boxShadow: `inset 0 0 14mm 4mm ${rgba('#000000', 0.28)}`,
                pointerEvents: 'none',
              }}
            />
          ),
        };
      case 'rounded':
        return {
          figureStyle: { margin: '6pt auto', overflow: 'hidden', borderRadius: '3mm' },
          imgStyle: { width: '100%', height: 'auto', display: 'block', borderRadius: '3mm' },
          captionStyle: captionBase,
        };
      case 'framed':
        return {
          figureStyle: {
            margin: '6pt auto',
            padding: '2mm',
            border: `0.5pt solid ${roles.hairline}`,
            outline: `2.5pt solid ${roles.background}`,
            outlineOffset: '-1mm',
            boxShadow: `0 2px 8px ${rgba('#000000', 0.1)}`,
          },
          imgStyle: { width: '100%', height: 'auto', display: 'block' },
          captionStyle: captionBase,
        };
      default: // plain
        return {
          figureStyle: { margin: '6pt auto' },
          imgStyle: { width: '100%', height: 'auto', display: 'block' },
          captionStyle: captionBase,
        };
    }
  },
};

// --- Opener compositions -----------------------------------------------------

function numeralOrnamentOpener(props: OpenerProps): ReactNode {
  const { chapterIndex, title, epigraph, roles, typography } = props;
  return (
    <div style={{ marginTop: '26mm', textAlign: 'center', padding: '0 6mm' }}>
      <div
        style={{
          fontFamily: typography.displayFamily || typography.headingFamily,
          fontSize: `${typography.scale[3]}pt`,
          color: roles.accent,
          letterSpacing: '0.16em',
          marginBottom: '4pt',
        }}
      >
        פרק {chapterIndex + 1}
      </div>
      <div style={{ color: roles.accent, opacity: 0.85, margin: '6pt 0' }}>
        <svg viewBox="0 0 120 20" width="120" height="20" aria-hidden="true">
          <path d="M40 6 L46 10 L40 14 L34 10 Z" fill="currentColor" />
          <path d="M60 3 L68 10 L60 17 L52 10 Z" fill="currentColor" />
          <path d="M80 6 L86 10 L80 14 L74 10 Z" fill="currentColor" />
        </svg>
      </div>
      <h2
        style={{
          fontFamily: typography.headingFamily,
          fontSize: `${typography.scale[4]}pt`,
          color: roles.text,
          margin: '8pt 0 14pt 0',
          lineHeight: 1.18,
          fontWeight: 700,
        }}
      >
        {title}
      </h2>
      {epigraph && (
        <p
          style={{
            fontFamily: typography.bodyFamily,
            fontSize: `${typography.scale[1]}pt`,
            color: roles.muted,
            fontStyle: 'italic',
            maxWidth: '74%',
            margin: '0 auto',
            lineHeight: 1.5,
          }}
        >
          {epigraph}
        </p>
      )}
      <div
        style={{ width: '34%', height: '0.6pt', background: roles.accent, margin: '18pt auto 0' }}
      />
    </div>
  );
}

function ruleStackOpener(props: OpenerProps): ReactNode {
  const { chapterIndex, title, epigraph, roles, typography } = props;
  // RTL: content set to the right (start). Stacked hairlines + big accent numeral.
  return (
    <div style={{ marginTop: '30mm', textAlign: 'right', padding: '0 4mm' }}>
      <div style={{ borderTop: `0.6pt solid ${roles.hairline}`, marginBottom: '2pt' }} />
      <div style={{ borderTop: `0.6pt solid ${roles.hairline}`, marginBottom: '12pt' }} />
      <div
        style={{
          fontFamily: typography.displayFamily || typography.headingFamily,
          fontSize: `${typography.scale[4] * 1.5}pt`,
          color: roles.accent,
          lineHeight: 0.9,
        }}
      >
        {chapterIndex + 1}
      </div>
      <h2
        style={{
          fontFamily: typography.headingFamily,
          fontSize: `${typography.scale[3]}pt`,
          color: roles.text,
          margin: '6pt 0 10pt 0',
          fontWeight: 700,
        }}
      >
        {title}
      </h2>
      {epigraph && (
        <p
          style={{
            fontFamily: typography.bodyFamily,
            fontSize: `${typography.scale[1]}pt`,
            color: roles.muted,
            fontStyle: 'italic',
            lineHeight: 1.5,
            maxWidth: '80%',
            marginRight: 0,
          }}
        >
          {epigraph}
        </p>
      )}
      <div style={{ borderTop: `0.6pt solid ${roles.hairline}`, marginTop: '14pt' }} />
    </div>
  );
}

function imageOverlayOpener(props: OpenerProps): ReactNode {
  const { chapterIndex, title, imageUrl, roles, typography } = props;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', flex: '0 0 64%', overflow: 'hidden' }}>
        <img
          src={imageUrl || ''}
          alt=""
          crossOrigin="anonymous"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {/* gradient scrim so the title stays legible over any photo */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(0deg, ${rgba('#000000', 0.6)} 0%, ${rgba(
              '#000000',
              0.05
            )} 45%, ${rgba('#000000', 0)} 70%)`,
          }}
        />
        <div style={{ position: 'absolute', bottom: '8mm', right: '8mm', left: '8mm', textAlign: 'right' }}>
          <div
            style={{
              fontFamily: typography.displayFamily || typography.headingFamily,
              fontSize: `${typography.scale[2]}pt`,
              color: 'rgba(255,255,255,0.85)',
              letterSpacing: '0.16em',
              marginBottom: '2pt',
            }}
          >
            פרק {chapterIndex + 1}
          </div>
          <h2
            style={{
              fontFamily: typography.headingFamily,
              fontSize: `${typography.scale[4]}pt`,
              color: '#fff',
              margin: 0,
              lineHeight: 1.15,
              fontWeight: 700,
              textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            }}
          >
            {title}
          </h2>
        </div>
      </div>
      <div style={{ flex: 1, position: 'relative', background: roles.background }}>
        <div
          style={{
            position: 'absolute',
            top: '8mm',
            right: 0,
            left: 0,
            textAlign: 'center',
            color: roles.accent,
            opacity: 0.85,
          }}
        >
          <svg viewBox="0 0 120 20" width="100" height="16" aria-hidden="true">
            <path d="M40 6 L46 10 L40 14 L34 10 Z" fill="currentColor" />
            <path d="M60 3 L68 10 L60 17 L52 10 Z" fill="currentColor" />
            <path d="M80 6 L86 10 L80 14 L74 10 Z" fill="currentColor" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default memoirWarmVisual;
