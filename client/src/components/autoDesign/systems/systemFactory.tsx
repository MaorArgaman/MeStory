/**
 * The shared render core for genome-driven and spec-driven design systems.
 *
 * Every visual choice flows through a compact VisualSpec (ornament family,
 * texture, drop-cap style, numeral style, frame, heading tracking). Two
 * builders feed it:
 *   - makeGenomeVisual(genome): the generative path — a StyleGenome sampled
 *     from an archetype drives palette + texture + all the axes. This is what
 *     gives thousands of coherent looks from one seed.
 *   - makeSystemVisual(spec): the legacy "Phase-A breadth" path — four fixed
 *     systems with a hand-set spec + palette variants. Kept for backward
 *     compatibility with plans generated before genome mode.
 *
 * memoir-warm still has its own hand-written module (memoirWarm.tsx) for the
 * legacy path; genome mode renders every family through this core.
 */

import type { CSSProperties, ReactNode } from 'react';
import { deriveColorRoles, makeRng, rgba, type ColorRoles } from '../designTokens';
import type { Palette } from '../designPlanTypes';
import type { DropCapStyle, NumeralStyle, StyleGenome } from '../genome';
import { pageTexture, type TextureKind } from '../textures';
import { Divider, InitialFrame, type OrnamentFamily } from '../ornaments';
import type { ImageTreatmentResult, OpenerProps, SystemVisual } from './types';

/** The visual DNA both builders share. SystemSpec is a superset (adds variants). */
export interface VisualSpec {
  ornamentFamily: OrnamentFamily;
  texture: TextureKind;
  dropCap: DropCapStyle;
  framePages: boolean;
  numeralStyle: NumeralStyle;
  headingTracking?: string;
}

export interface SystemSpec extends VisualSpec {
  id: string;
  /** variantId → base palette. The planner picks one and copies it into the plan. */
  variants: Record<string, Palette>;
}

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

export function makeGenomeVisual(genome: StyleGenome): SystemVisual {
  const spec: VisualSpec = {
    ornamentFamily: genome.ornamentFamily,
    texture: genome.texture,
    dropCap: genome.dropCap,
    framePages: genome.framePages,
    numeralStyle: genome.numeralStyle,
    headingTracking: genome.headingTracking,
  };
  const roles = deriveColorRoles(genome.palette);
  return buildVisual(`genome:${genome.ornamentFamily}`, spec, {
    resolveRoles: () => roles,
    pageBackground: (r) => pageTexture(genome.texture, r.background, r.muted),
  });
}

export function makeSystemVisual(spec: SystemSpec): SystemVisual {
  const firstVariantId = Object.keys(spec.variants)[0];
  return buildVisual(spec.id, spec, {
    resolveRoles: (variantId, planPalette) =>
      deriveColorRoles(
        (variantId && spec.variants[variantId]) || planPalette || spec.variants[firstVariantId]
      ),
    pageBackground: (r) => pageTexture(spec.texture, r.background, r.muted),
  });
}

function buildVisual(
  id: string,
  spec: VisualSpec,
  hooks: {
    resolveRoles: (variantId: string | undefined, planPalette: Palette) => ColorRoles;
    pageBackground: (roles: ColorRoles) => CSSProperties;
  }
): SystemVisual {
  return {
    id,
    resolveRoles: hooks.resolveRoles,
    pageBackground: hooks.pageBackground,
    Ornament({ style, roles, seed }): ReactNode {
      if (style === 'none') return <div style={{ height: '6pt' }} />;
      const family = style === 'rule' ? 'rule' : style === 'stars' ? 'asterism' : spec.ornamentFamily;
      const rng = makeRng(seed + 11);
      return (
        <div style={{ textAlign: 'center', color: roles.accent, margin: '15pt 0', opacity: 0.9, transform: `rotate(${(rng() - 0.5) * 0.8}deg)` }}>
          <Divider family={family} width={200} />
        </div>
      );
    },
    DropCap({ letter, roles, typography }): ReactNode {
      return dropCapNode(letter, roles, typography, spec);
    },
    ChapterOpener(props: OpenerProps): ReactNode {
      const t = props.template || 'numeral-ornament';
      if (t === 'image-overlay' && props.imageUrl) return imageOverlayOpener(props, spec);
      if (t === 'vertical-title') return verticalTitleOpener(props, spec);
      if (t === 'rule-stack') return ruleStackOpener(props, spec);
      return numeralOrnamentOpener(props, spec);
    },
    imageTreatment(treatment, roles, seed): ImageTreatmentResult {
      return sharedImageTreatment(treatment, roles, seed);
    },
  };
}

// ---------------------------------------------------------------------------
// Drop caps
// ---------------------------------------------------------------------------

function dropCapNode(
  letter: string,
  roles: ColorRoles,
  typography: OpenerProps['typography'],
  spec: VisualSpec
): ReactNode {
  const size = typography.baseSize * 3.0;
  const fontFamily = typography.displayFamily || typography.headingFamily;
  const base: CSSProperties = {
    float: 'right',
    fontFamily,
    color: roles.accent,
    fontSize: `${size}pt`,
    lineHeight: 0.84,
    marginLeft: '5pt',
    marginTop: '2pt',
  };
  if (spec.dropCap === 'framed') {
    return (
      <span style={{ position: 'relative', float: 'right', width: `${size * 1.15}pt`, height: `${size * 1.15}pt`, marginLeft: '6pt', color: roles.accent }}>
        <InitialFrame family={spec.ornamentFamily} size={Math.round(size * 1.15 * 1.333)} bg={rgba(roles.accent, 0.06)} />
        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily, fontSize: `${size * 0.62}pt`, color: roles.accent }}>
          {letter}
        </span>
      </span>
    );
  }
  if (spec.dropCap === 'underline') {
    return <span style={{ ...base, borderBottom: `2px solid ${roles.accent}`, paddingBottom: '1pt' }}>{letter}</span>;
  }
  if (spec.dropCap === 'color-block') {
    return (
      <span style={{ float: 'right', fontFamily, color: roles.background, background: roles.accent, fontSize: `${size * 0.7}pt`, lineHeight: 1, padding: '4pt 6pt', marginLeft: '6pt', marginTop: '2pt' }}>
        {letter}
      </span>
    );
  }
  if (spec.dropCap === 'raised') {
    // Raised initial — sits on the baseline and rises above the first line.
    return <span style={{ fontFamily, color: roles.accent, fontSize: `${size * 0.8}pt`, lineHeight: 1, verticalAlign: '-0.12em', marginLeft: '2pt', fontWeight: 700 }}>{letter}</span>;
  }
  return <span style={base}>{letter}</span>;
}

// ---------------------------------------------------------------------------
// Numerals
// ---------------------------------------------------------------------------

function romanize(num: number): string {
  const map: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let n = Math.max(1, Math.floor(num));
  let out = '';
  for (const [v, s] of map) {
    while (n >= v) {
      out += s;
      n -= v;
    }
  }
  return out;
}

/** Worded/roman/digit label for the numeral-ornament opener. */
function numeralLabel(spec: VisualSpec, idx: number): string {
  if (spec.numeralStyle === 'word') return `פרק ${idx + 1}`;
  if (spec.numeralStyle === 'roman') return romanize(idx + 1);
  return `${idx + 1}`;
}

/** Big bare figure (roman or digit) for figure-led openers. */
function bigNumeral(spec: VisualSpec, idx: number): string {
  return spec.numeralStyle === 'roman' ? romanize(idx + 1) : `${idx + 1}`;
}

/** Extra style for circled / outlined numerals. */
function numeralBoxStyle(spec: VisualSpec, roles: ColorRoles): CSSProperties {
  if (spec.numeralStyle === 'circled') {
    return {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '1.9em',
      minHeight: '1.9em',
      padding: '0.15em 0.2em',
      borderRadius: '999px',
      border: `2px solid ${roles.accent}`,
      boxSizing: 'border-box',
    };
  }
  if (spec.numeralStyle === 'outlined') {
    return { WebkitTextStroke: `1.2px ${roles.accent}`, color: 'transparent' } as CSSProperties;
  }
  return {};
}

// ---------------------------------------------------------------------------
// Opener compositions (themed by spec)
// ---------------------------------------------------------------------------

function numeralOrnamentOpener(props: OpenerProps, spec: VisualSpec): ReactNode {
  const { chapterIndex, title, epigraph, roles, typography } = props;
  return (
    <div style={{ marginTop: '26mm', textAlign: 'center', padding: '0 6mm' }}>
      <div
        style={{
          display: 'inline-block',
          fontFamily: typography.displayFamily || typography.headingFamily,
          fontSize: `${typography.scale[spec.numeralStyle === 'numeral' || spec.numeralStyle === 'circled' || spec.numeralStyle === 'outlined' ? 4 : 3]}pt`,
          color: roles.accent,
          letterSpacing: spec.headingTracking || '0.14em',
          marginBottom: '4pt',
          ...numeralBoxStyle(spec, roles),
        }}
      >
        {numeralLabel(spec, chapterIndex)}
      </div>
      <div style={{ color: roles.accent, opacity: 0.9, margin: '4pt 0 8pt' }}>
        <Divider family={spec.ornamentFamily} width={150} />
      </div>
      <h2 style={{ fontFamily: typography.headingFamily, fontSize: `${typography.scale[4]}pt`, color: roles.text, margin: '6pt 0 14pt', lineHeight: 1.18, fontWeight: 700, letterSpacing: spec.headingTracking }}>
        {title}
      </h2>
      {epigraph && (
        <p style={{ fontFamily: typography.bodyFamily, fontSize: `${typography.scale[1]}pt`, color: roles.muted, fontStyle: 'italic', maxWidth: '74%', margin: '0 auto', lineHeight: 1.5 }}>
          {epigraph}
        </p>
      )}
      <div style={{ width: '32%', height: '0.6pt', background: roles.accent, margin: '18pt auto 0' }} />
    </div>
  );
}

function ruleStackOpener(props: OpenerProps, spec: VisualSpec): ReactNode {
  const { chapterIndex, title, epigraph, roles, typography } = props;
  return (
    <div style={{ marginTop: '30mm', textAlign: 'right', padding: '0 4mm' }}>
      <div style={{ borderTop: `0.7pt solid ${roles.hairline}`, marginBottom: '2pt' }} />
      <div style={{ borderTop: `0.7pt solid ${roles.hairline}`, marginBottom: '12pt' }} />
      <div style={{ display: 'inline-block', fontFamily: typography.displayFamily || typography.headingFamily, fontSize: `${typography.scale[4] * 1.4}pt`, color: roles.accent, lineHeight: 0.9, letterSpacing: spec.headingTracking, ...numeralBoxStyle(spec, roles) }}>
        {bigNumeral(spec, chapterIndex)}
      </div>
      <h2 style={{ fontFamily: typography.headingFamily, fontSize: `${typography.scale[3]}pt`, color: roles.text, margin: '6pt 0 10pt', fontWeight: 700, letterSpacing: spec.headingTracking }}>
        {title}
      </h2>
      {epigraph && (
        <p style={{ fontFamily: typography.bodyFamily, fontSize: `${typography.scale[1]}pt`, color: roles.muted, fontStyle: 'italic', lineHeight: 1.5, maxWidth: '80%' }}>
          {epigraph}
        </p>
      )}
      <div style={{ borderTop: `0.7pt solid ${roles.hairline}`, marginTop: '14pt' }} />
    </div>
  );
}

function verticalTitleOpener(props: OpenerProps, spec: VisualSpec): ReactNode {
  const { chapterIndex, title, epigraph, roles, typography } = props;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 14mm' }}>
      <div style={{ display: 'inline-block', alignSelf: 'flex-start', fontFamily: typography.displayFamily || typography.headingFamily, fontSize: `${typography.scale[4] * 2.4}pt`, color: rgba(roles.accent, 0.9), lineHeight: 0.8, letterSpacing: spec.headingTracking, ...numeralBoxStyle(spec, roles) }}>
        {bigNumeral(spec, chapterIndex)}
      </div>
      <div style={{ width: '28%', height: '2.5pt', background: roles.accent, margin: '10pt 0 14pt' }} />
      <h2 style={{ fontFamily: typography.headingFamily, fontSize: `${typography.scale[4]}pt`, color: roles.text, margin: 0, lineHeight: 1.15, fontWeight: 700, maxWidth: '88%' }}>
        {title}
      </h2>
      {epigraph && (
        <p style={{ fontFamily: typography.bodyFamily, fontSize: `${typography.scale[1]}pt`, color: roles.muted, fontStyle: 'italic', marginTop: '12pt', maxWidth: '78%', lineHeight: 1.5 }}>
          {epigraph}
        </p>
      )}
    </div>
  );
}

function imageOverlayOpener(props: OpenerProps, spec: VisualSpec): ReactNode {
  const { chapterIndex, title, imageUrl, roles, typography } = props;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', flex: '0 0 66%', overflow: 'hidden' }}>
        <img src={imageUrl || ''} alt="" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(0deg, ${rgba('#000000', 0.62)} 0%, ${rgba('#000000', 0.05)} 45%, ${rgba('#000000', 0)} 72%)` }} />
        <div style={{ position: 'absolute', bottom: '8mm', right: '8mm', left: '8mm', textAlign: 'right' }}>
          <div style={{ fontFamily: typography.displayFamily || typography.headingFamily, fontSize: `${typography.scale[2]}pt`, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.16em', marginBottom: '2pt' }}>
            {spec.numeralStyle === 'word' ? `פרק ${chapterIndex + 1}` : bigNumeral(spec, chapterIndex)}
          </div>
          <h2 style={{ fontFamily: typography.headingFamily, fontSize: `${typography.scale[4]}pt`, color: '#fff', margin: 0, lineHeight: 1.15, fontWeight: 700, textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
            {title}
          </h2>
        </div>
      </div>
      <div style={{ flex: 1, position: 'relative', background: roles.background }}>
        <div style={{ position: 'absolute', top: '8mm', left: 0, right: 0, textAlign: 'center', color: roles.accent, opacity: 0.9 }}>
          <Divider family={spec.ornamentFamily} width={120} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared image treatments
// ---------------------------------------------------------------------------

function sharedImageTreatment(
  treatment: string | undefined,
  roles: ColorRoles,
  seed: number
): ImageTreatmentResult {
  const rng = makeRng(seed + 31);
  const caption: CSSProperties = { marginTop: '4pt', color: roles.muted, fontStyle: 'italic', textAlign: 'center', fontSize: '9pt' };
  switch (treatment) {
    case 'polaroid':
      return {
        figureStyle: { background: '#fff', padding: '3mm 3mm 9mm', boxShadow: `0 4px 14px ${rgba('#000000', 0.18)}`, transform: `rotate(${(rng() - 0.5) * 4}deg)`, margin: '6pt auto' },
        imgStyle: { width: '100%', height: 'auto', display: 'block' },
        captionStyle: { ...caption, color: roles.text },
      };
    case 'postcard':
      return {
        figureStyle: { background: '#fff', padding: '2mm', border: `1px solid ${roles.hairline}`, boxShadow: `0 3px 10px ${rgba('#000000', 0.12)}`, margin: '6pt auto' },
        imgStyle: { width: '100%', height: 'auto', display: 'block' },
        captionStyle: { ...caption, textAlign: 'right', marginRight: '2mm' },
      };
    case 'duotone':
      return {
        figureStyle: { position: 'relative', margin: '6pt auto', overflow: 'hidden' },
        imgStyle: { width: '100%', height: 'auto', display: 'block', filter: 'grayscale(1) contrast(1.05)' },
        captionStyle: caption,
        overlay: <div style={{ position: 'absolute', inset: 0, background: roles.accent, mixBlendMode: 'color', opacity: 0.5, pointerEvents: 'none' }} />,
      };
    case 'vignette':
      return {
        figureStyle: { position: 'relative', margin: '6pt auto', overflow: 'hidden' },
        imgStyle: { width: '100%', height: 'auto', display: 'block' },
        captionStyle: caption,
        overlay: <div style={{ position: 'absolute', inset: 0, boxShadow: `inset 0 0 14mm 4mm ${rgba('#000000', 0.28)}`, pointerEvents: 'none' }} />,
      };
    case 'rounded':
      return {
        figureStyle: { margin: '6pt auto', overflow: 'hidden', borderRadius: '3mm' },
        imgStyle: { width: '100%', height: 'auto', display: 'block', borderRadius: '3mm' },
        captionStyle: caption,
      };
    case 'framed':
      return {
        figureStyle: { margin: '6pt auto', padding: '2mm', border: `0.5pt solid ${roles.hairline}`, outline: `2.5pt solid ${roles.background}`, outlineOffset: '-1mm', boxShadow: `0 2px 8px ${rgba('#000000', 0.1)}` },
        imgStyle: { width: '100%', height: 'auto', display: 'block' },
        captionStyle: caption,
      };
    case 'sepia':
      return {
        figureStyle: { margin: '6pt auto', position: 'relative', overflow: 'hidden' },
        imgStyle: { width: '100%', height: 'auto', display: 'block', filter: 'sepia(0.55) contrast(1.02) saturate(0.9)' },
        captionStyle: caption,
      };
    case 'sketch':
      return {
        figureStyle: { margin: '6pt auto', position: 'relative', overflow: 'hidden' },
        imgStyle: { width: '100%', height: 'auto', display: 'block', filter: 'grayscale(1) contrast(1.4) brightness(1.08)' },
        captionStyle: caption,
      };
    case 'blueprint':
      return {
        figureStyle: { position: 'relative', margin: '6pt auto', overflow: 'hidden' },
        imgStyle: { width: '100%', height: 'auto', display: 'block', filter: 'grayscale(1) brightness(1.12) contrast(0.9)' },
        captionStyle: caption,
        overlay: <div style={{ position: 'absolute', inset: 0, background: roles.accent, mixBlendMode: 'multiply', opacity: 0.55, pointerEvents: 'none' }} />,
      };
    case 'soft-shadow':
      return {
        figureStyle: { margin: '8pt auto', borderRadius: '2mm', boxShadow: `0 10px 28px ${rgba('#000000', 0.18)}` },
        imgStyle: { width: '100%', height: 'auto', display: 'block', borderRadius: '2mm' },
        captionStyle: caption,
      };
    default:
      return {
        figureStyle: { margin: '6pt auto' },
        imgStyle: { width: '100%', height: 'auto', display: 'block' },
        captionStyle: caption,
      };
  }
}
